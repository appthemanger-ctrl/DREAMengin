import type { Request, Response } from "express";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
function send(res: Response, status: number, obj: any) {
  res.status(status);
  for (const [k, v] of Object.entries(JSON_HEADERS)) res.setHeader(k, v as string);
  res.end(JSON.stringify(obj, null, 2));
}

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

// constant-time compare
function timingSafeEqual(a: string, b: string) {
  const aa = Buffer.from(String(a ?? ""), "utf8");
  const bb = Buffer.from(String(b ?? ""), "utf8");
  const len = Math.max(aa.length, bb.length);
  let diff = aa.length ^ bb.length;
  for (let i = 0; i < len; i++) diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

function todayUTC() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// In-memory state fallback (for Vercel-like environments). For true persistence, store in DB/KV.
const STATE: { paused: boolean; lastAutopilotDay: string; autopilotCountToday: number } =
  (globalThis as any).__INNERDREAMS_STATE__ ||
  { paused: false, lastAutopilotDay: "", autopilotCountToday: 0 };
(globalThis as any).__INNERDREAMS_STATE__ = STATE;

// ---------------- OpenAI (Responses API via fetch) ----------------
function extractOutputText(respJson: any) {
  if (!respJson) return "";
  if (typeof respJson.output_text === "string") return respJson.output_text;
  const out: string[] = [];
  for (const item of respJson.output || []) {
    if (item?.type === "message" && Array.isArray(item.content)) {
      for (const part of item.content) {
        if (part?.type === "output_text" && typeof part.text === "string") out.push(part.text);
      }
    }
  }
  return out.join("\n").trim();
}

async function openaiText({ input, instructions }: { input: string; instructions?: string }) {
  const apiKey = requireEnv("OPENAI_API_KEY");
  const model = process.env.OPENAI_MODEL || "gpt-5.2";
  const r = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, store: false, instructions: instructions || undefined, input }),
  });
  const t = await r.text();
  let j: any = null;
  try {
    j = t ? JSON.parse(t) : null;
  } catch {}
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${t.slice(0, 800)}`);
  return extractOutputText(j);
}

// ---------------- GitHub helpers ----------------
async function gh(token: string, url: string, init: RequestInit = {}) {
  const r = await fetch(url, {
    ...init,
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  const t = await r.text();
  let j: any = null;
  try {
    j = t ? JSON.parse(t) : null;
  } catch {}
  if (!r.ok) throw new Error(`GitHub ${r.status} ${url}: ${t.slice(0, 800)}`);
  return j;
}
async function ghGetDefaultBranch(token: string, owner: string, repo: string) {
  const r = await gh(token, `https://api.github.com/repos/${owner}/${repo}`);
  return r.default_branch as string;
}
async function ghGetHeadSha(token: string, owner: string, repo: string, branch: string) {
  const r = await gh(token, `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`);
  return r.object.sha as string;
}
async function ghCreateBranch(token: string, owner: string, repo: string, branch: string, sha: string) {
  return gh(token, `https://api.github.com/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ref: `refs/heads/${branch}`, sha }),
  });
}
async function ghGetFile(token: string, owner: string, repo: string, path: string, ref: string) {
  const r = await gh(
    token,
    `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`
  );
  if (Array.isArray(r)) throw new Error(`Path is a directory: ${path}`);
  const content = r.content ? Buffer.from(String(r.content).replace(/\n/g, ""), "base64").toString("utf8") : "";
  return { sha: r.sha as string, content };
}
async function ghPutFile(token: string, owner: string, repo: string, path: string, branch: string, message: string, content: string, sha?: string | null) {
  const b64 = Buffer.from(String(content), "utf8").toString("base64");
  return gh(token, `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ message, content: b64, branch, sha: sha || undefined }),
  });
}
async function ghCreatePR(token: string, owner: string, repo: string, title: string, head: string, base: string, body: string) {
  return gh(token, `https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, head, base, body }),
  });
}

// ---------------- Actions ----------------
async function assertPassword(provided: string) {
  const expected = requireEnv("INNERDREAMS_PASSWORD");
  if (!timingSafeEqual(provided, expected)) throw new Error("Unauthorized");
}

export async function innerdreamsHandler(req: Request, res: Response) {
  try {
    if (req.method === "GET") {
      return send(res, 200, { ok: true, paused: !!STATE.paused });
    }
    if (req.method !== "POST") return send(res, 405, { ok: false, error: "Use GET or POST." });

    const { password = "", action = "", instruction = "", files } = (req.body || {}) as any;

    await assertPassword(String(password || ""));

    const act = String(action || "").trim();
    const instr = String(instruction || "").trim();
    const fileList: string[] = Array.isArray(files)
      ? files.map(String).filter(Boolean)
      : String(files || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);

    if (act === "pause") {
      STATE.paused = true;
      return send(res, 200, { ok: true, paused: true });
    }
    if (act === "resume") {
      STATE.paused = false;
      return send(res, 200, { ok: true, paused: false });
    }
    if (act === "status") {
      return send(res, 200, { ok: true, paused: !!STATE.paused });
    }

    if (STATE.paused) return send(res, 409, { ok: false, error: "Innerdreams is paused." });

    if (act === "ask") {
      if (!instr) return send(res, 400, { ok: false, error: "Missing instruction." });
      const answer = await openaiText({
        instructions: [
          "You are Innerdreams, a cautious site-maintainer assistant.",
          "Never output secrets, tokens, passwords, or private keys.",
          "Answer with a short actionable response.",
        ].join("\n"),
        input: instr,
      });
      return send(res, 200, { ok: true, answer });
    }

    if (act === "edit") {
      if (!instr) return send(res, 400, { ok: false, error: "Missing instruction." });
      if (!fileList.length) return send(res, 400, { ok: false, error: "Missing files (array or comma-separated)." });

      const token = requireEnv("GITHUB_TOKEN");
      const owner = requireEnv("GITHUB_OWNER");
      const repo = requireEnv("GITHUB_REPO");

      const base = await ghGetDefaultBranch(token, owner, repo);
      const baseSha = await ghGetHeadSha(token, owner, repo, base);
      const prefix = process.env.INNERDREAMS_BRANCH_PREFIX || "innerdreams";
      const branch = `${prefix}-${Date.now()}`;

      await ghCreateBranch(token, owner, repo, branch, baseSha);

      const blobs: { path: string; sha: string | null; content: string }[] = [];
      for (const p of fileList) {
        try {
          const got = await ghGetFile(token, owner, repo, p, base);
          blobs.push({ path: p, sha: got.sha, content: got.content });
        } catch {
          blobs.push({ path: p, sha: null, content: "" });
        }
      }

      const prompt = [
        "You are an expert maintainer of a web app repository.",
        "Goal: apply the user's instruction with MINIMAL edits.",
        "Hard rules: Do NOT add secrets. Do NOT introduce new dependencies. Return ONLY valid JSON (no markdown).",
        "Return JSON: { changes:[{path,content}], prTitle, prBody }",
        "User instruction:",
        instr,
        "",
        "Here are current files (path + content):",
        ...blobs.map((f) => `---\nPATH: ${f.path}\nCONTENT:\n${f.content}\n`),
      ].join("\n");

      const raw = await openaiText({ instructions: "Return ONLY JSON.", input: prompt });
      let plan: any = null;
      try {
        plan = JSON.parse(raw);
      } catch {
        throw new Error("Model did not return valid JSON.");
      }
      const changes: any[] = Array.isArray(plan?.changes) ? plan.changes : [];
      if (!changes.length) throw new Error("No changes proposed.");

      const byPath = new Map(blobs.map((b) => [b.path, b]));
      for (const ch of changes) {
        if (!ch?.path || typeof ch.content !== "string") continue;
        const existing = byPath.get(ch.path);
        await ghPutFile(token, owner, repo, ch.path, branch, `Innerdreams: update ${ch.path}`, ch.content, existing?.sha || null);
      }

      const pr = await ghCreatePR(
        token,
        owner,
        repo,
        plan.prTitle || "Innerdreams update",
        branch,
        base,
        plan.prBody || "Created by Innerdreams."
      );
      return send(res, 200, { ok: true, pr_url: pr.html_url, pr_number: pr.number, branch, base });
    }

    if (act === "autopilot") {
      const day = todayUTC();
      const limit = Number(process.env.INNERDREAMS_DAILY_LIMIT || "1");
      if (STATE.lastAutopilotDay !== day) {
        STATE.lastAutopilotDay = day;
        STATE.autopilotCountToday = 0;
      }
      if (STATE.autopilotCountToday >= limit) {
        return send(res, 200, { ok: true, skipped: true, reason: `Daily limit reached (${limit}/day).` });
      }

      const token = requireEnv("GITHUB_TOKEN");
      const owner = requireEnv("GITHUB_OWNER");
      const repo = requireEnv("GITHUB_REPO");
      const base = await ghGetDefaultBranch(token, owner, repo);
      const baseSha = await ghGetHeadSha(token, owner, repo, base);

      const prefix = process.env.INNERDREAMS_BRANCH_PREFIX || "innerdreams";
      const branch = `${prefix}-autopilot-${day}-${Date.now()}`;
      await ghCreateBranch(token, owner, repo, branch, baseSha);

      const tree = await gh(token, `https://api.github.com/repos/${owner}/${repo}/git/trees/${baseSha}?recursive=1`);
      const paths = (tree?.tree || [])
        .filter((x: any) => x && x.type === "blob")
        .map((x: any) => x.path)
        .filter((p: any) => typeof p === "string")
        .slice(0, 2500);

      const report = await openaiText({
        instructions: [
          "You are Innerdreams Autopilot.",
          "Propose 1-3 small, safe improvements that require no new dependencies.",
          "Never output secrets.",
          "Output a short markdown report.",
        ].join("\n"),
        input: `Repo file list (truncated):\n${paths.join("\n")}`,
      });

      let existingSha: string | null = null;
      try {
        const got = await ghGetFile(token, owner, repo, "INNERDREAMS_REPORT.md", base);
        existingSha = got.sha;
      } catch {}

      await ghPutFile(token, owner, repo, "INNERDREAMS_REPORT.md", branch, "Innerdreams autopilot report", report || "# Innerdreams report\n\nNo report generated.\n", existingSha);

      const pr = await ghCreatePR(
        token,
        owner,
        repo,
        `Innerdreams autopilot report (${day})`,
        branch,
        base,
        "- Autogenerated daily report.\n- No secrets included.\n- Review and merge if useful."
      );

      STATE.autopilotCountToday += 1;
      return send(res, 200, { ok: true, skipped: false, pr_url: pr.html_url, pr_number: pr.number, branch, base, day });
    }

    return send(res, 400, { ok: false, error: `Unknown action: ${act}` });
  } catch (e: any) {
    const msg = e?.message ? e.message : String(e);
    const status = msg === "Unauthorized" ? 401 : 500;
    return send(res, status, { ok: false, error: msg });
  }
}
