// Cloudflare Pages Function: /api/innerdreams
// This endpoint can:
// - pause/resume the agent (stored in KV if bound)
// - answer questions via OpenAI
// - open GitHub PRs with changes (recommended flow)
//
// Required env vars:
// - INNERDREAMS_PASSWORD
// - GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO
// - OPENAI_API_KEY (only for AI ask/edit/autopilot)

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(status, obj) {
  return new Response(JSON.stringify(obj, null, 2), { status, headers: JSON_HEADERS });
}

async function readJson(request) {
  const ct = request.headers.get("content-type") || "";
  if (ct.includes("application/json")) return await request.json();
  // allow raw text body for simple commands
  const t = (await request.text()).trim();
  if (!t) return {};
  try { return JSON.parse(t); } catch { return { instruction: t }; }
}

async function getState(env) {
  // Prefer KV if user binds it as INNERDREAMS_KV
  try {
    if (env.INNERDREAMS_KV) {
      const raw = await env.INNERDREAMS_KV.get("state");
      if (raw) return JSON.parse(raw);
    }
  } catch {}
  // fallback (non-durable across isolates)
  if (!globalThis.__innerdreams_state) {
    globalThis.__innerdreams_state = { paused: false, last_autopilot_ms: 0 };
  }
  return globalThis.__innerdreams_state;
}

async function setState(env, next) {
  try {
    if (env.INNERDREAMS_KV) {
      await env.INNERDREAMS_KV.put("state", JSON.stringify(next));
      return;
    }
  } catch {}
  globalThis.__innerdreams_state = next;
}

function requirePassword(env, provided) {
  const expected = env.INNERDREAMS_PASSWORD;
  if (!expected) return { ok: false, msg: "Server missing INNERDREAMS_PASSWORD env var." };
  if (typeof provided !== "string" || !provided) return { ok: false, msg: "Missing password." };
  if (provided !== expected) return { ok: false, msg: "Auth failed." };
  return { ok: true };
}

async function openaiText(env, { instructions, input, model }) {
  const key = env.OPENAI_API_KEY;
  if (!key) throw new Error("Server missing OPENAI_API_KEY env var.");
  const m = model || env.OPENAI_MODEL || "gpt-4.1-mini";

  // Responses API: POST https://api.openai.com/v1/responses
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "authorization": `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: m,
      instructions,
      input,
      // Keep responses cheap-ish; adjust if you want longer outputs
      max_output_tokens: 1200,
      store: false,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenAI error ${res.status}: ${errText.slice(0, 500)}`);
  }
  const data = await res.json();

  // Robust text extraction: concatenate any message->output_text chunks
  let out = "";
  if (typeof data.output_text === "string") out = data.output_text;
  if (!out && Array.isArray(data.output)) {
    for (const item of data.output) {
      if (item && item.type === "message" && Array.isArray(item.content)) {
        for (const c of item.content) {
          if (c && (c.type === "output_text" || c.type === "text") && typeof c.text === "string") out += c.text;
        }
      }
    }
  }
  return out.trim() || JSON.stringify(data).slice(0, 1000);
}

async function ghRequest(token, url, init = {}) {
  const res = await fetch(url, {
    ...init,
    headers: {
      "authorization": `Bearer ${token}`,
      "accept": "application/vnd.github+json",
      ...(init.headers || {}),
    },
  });
  const text = await res.text();
  let jsonBody = null;
  try { jsonBody = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) {
    throw new Error(`GitHub ${res.status} ${url}: ${text.slice(0, 500)}`);
  }
  return jsonBody;
}

async function ghGetDefaultBranch({ token, owner, repo }) {
  const r = await ghRequest(token, `https://api.github.com/repos/${owner}/${repo}`);
  return r.default_branch || "main";
}

async function ghGetFile({ token, owner, repo, path, ref }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replaceAll("%2F","/")}?ref=${encodeURIComponent(ref)}`;
  const r = await ghRequest(token, url);
  if (!r || r.type !== "file" || !r.content) throw new Error(`Not a file: ${path}`);
  const content = atob(r.content.replace(/\n/g, ""));
  return { content, sha: r.sha };
}

async function ghCreateBranch({ token, owner, repo, baseBranch, newBranch }) {
  const ref = await ghRequest(token, `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(baseBranch)}`);
  const baseSha = ref.object.sha;
  await ghRequest(token, `https://api.github.com/repos/${owner}/${repo}/git/refs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      ref: `refs/heads/${newBranch}`,
      sha: baseSha,
    }),
  });
  return baseSha;
}

async function ghUpsertFile({ token, owner, repo, branch, path, message, content, sha }) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replaceAll("%2F","/")}`;
  const body = {
    message,
    branch,
    content: btoa(content),
  };
  if (sha) body.sha = sha;

  return await ghRequest(token, url, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function ghCreatePR({ token, owner, repo, title, head, base, body }) {
  return await ghRequest(token, `https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title, head, base, body }),
  });
}

function pickFilesHeuristically(instruction) {
  const s = (instruction || "").toLowerCase();
  const files = new Set();

  // Most visual tweaks end up in App or Landing
  if (s.includes("navbar") || s.includes("header") || s.includes("menu") || s.includes("hero") || s.includes("landing")) {
    files.add("Archive/client/src/pages/Landing.tsx");
    files.add("Archive/client/src/App.tsx");
  }
  if (s.includes("theme") || s.includes("color") || s.includes("css") || s.includes("tailwind")) {
    files.add("Archive/client/src/index.css");
  }
  if (s.includes("route") || s.includes("api") || s.includes("backend")) {
    files.add("Archive/server/routes.ts");
  }
  // fallback
  if (files.size === 0) files.add("Archive/client/src/App.tsx");
  return Array.from(files);
}

async function handleAsk(env, question) {
  const instructions =
    "You are Innerdreams: a practical web/dev assistant. Answer clearly and briefly. " +
    "If you need more context from the repo, say what file you'd inspect, but still give the best answer you can.";
  const answer = await openaiText(env, { instructions, input: question });
  return answer;
}

async function handleEdit(env, { instruction, files }) {
  const token = env.GITHUB_TOKEN;
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    throw new Error("Missing GitHub env vars: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO.");
  }

  const baseBranch = await ghGetDefaultBranch({ token, owner, repo });
  const branch = `innerdreams/${Date.now()}`;
  await ghCreateBranch({ token, owner, repo, baseBranch, newBranch: branch });

  const targets = (Array.isArray(files) && files.length ? files : pickFilesHeuristically(instruction)).slice(0, 5);

  let prBody = `Instruction:\n\n- ${instruction}\n\nFiles touched:\n` + targets.map(f => `- ${f}`).join("\n");
  for (const path of targets) {
    // Load file
    const { content: oldContent, sha } = await ghGetFile({ token, owner, repo, path, ref: baseBranch });

    // Ask model for full-file rewrite
    const modelInstructions =
      "You are an expert TypeScript/React/Vite developer. " +
      "You will be given a file and an instruction. " +
      "Return ONLY the complete updated file contents (no backticks, no explanations). " +
      "Preserve working imports and app structure. Make minimal, safe changes that satisfy the instruction. " +
      "Do not add new dependencies. Keep formatting reasonable.";

    const input =
      `INSTRUCTION:\n${instruction}\n\nFILE PATH: ${path}\n\nCURRENT FILE:\n` +
      oldContent;

    const newContent = await openaiText(env, { instructions: modelInstructions, input });

    // Basic sanity: don't commit empty
    if (!newContent || newContent.length < 20) {
      throw new Error(`Model produced suspiciously short output for ${path}.`);
    }

    await ghUpsertFile({
      token,
      owner,
      repo,
      branch,
      path,
      sha,
      message: `Innerdreams: ${instruction} (${path})`,
      content: newContent,
    });
  }

  const pr = await ghCreatePR({
    token,
    owner,
    repo,
    title: `Innerdreams: ${instruction.slice(0, 60)}`,
    head: branch,
    base: baseBranch,
    body: prBody,
  });

  return { pr_url: pr.html_url, pr_number: pr.number, branch, base: baseBranch, files: targets };
}

async function handleAutopilot(env) {
  // Creates a PR with a site improvement report (safe default).
  const token = env.GITHUB_TOKEN;
  const owner = env.GITHUB_OWNER;
  const repo = env.GITHUB_REPO;
  if (!token || !owner || !repo) throw new Error("Missing GitHub env vars.");

  const baseBranch = await ghGetDefaultBranch({ token, owner, repo });
  const branch = `innerdreams/autopilot-${Date.now()}`;
  await ghCreateBranch({ token, owner, repo, baseBranch, newBranch: branch });

  const filesToSample = [
    "Archive/client/src/App.tsx",
    "Archive/client/src/pages/Landing.tsx",
    "Archive/client/src/index.css",
    "Archive/server/routes.ts",
    "Archive/design_guidelines.md",
  ];

  const samples = [];
  for (const p of filesToSample) {
    try {
      const { content } = await ghGetFile({ token, owner, repo, path: p, ref: baseBranch });
      samples.push({ path: p, content: content.slice(0, 6000) });
    } catch {
      // ignore missing
    }
  }

  const instructions =
    "You are Innerdreams, an autonomous reviewer for a small web app. " +
    "Read the provided repo snippets and produce a concise improvement report with: " +
    "(1) top risks/bugs, (2) performance wins, (3) UX/accessibility, (4) code cleanliness, " +
    "and (5) 3 concrete next PR ideas. Keep it actionable. Output Markdown only.";
  const input = "REPO SNIPPETS:\n" + samples.map(s => `---\nFILE: ${s.path}\n${s.content}`).join("\n\n");
  const report = await openaiText(env, { instructions, input });

  const reportPath = `INNERDREAMS_REPORT.md`;
  await ghUpsertFile({
    token,
    owner,
    repo,
    branch,
    path: reportPath,
    message: "Innerdreams autopilot: improvement report",
    content: report.startsWith("#") ? report : `# Innerdreams report\n\n${report}`,
  });

  const pr = await ghCreatePR({
    token,
    owner,
    repo,
    title: "Innerdreams autopilot: improvement report",
    head: branch,
    base: baseBranch,
    body: "Autogenerated improvement report. Merge if you want it in the repo.",
  });

  return { pr_url: pr.html_url, pr_number: pr.number, branch, base: baseBranch, files: [reportPath] };
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: { ...JSON_HEADERS, "access-control-allow-origin": "*", "access-control-allow-headers": "*", "access-control-allow-methods": "GET,POST,OPTIONS" } });
  }

  if (request.method === "GET") {
    const st = await getState(env);
    return json(200, { ok: true, paused: !!st.paused, kv_enabled: !!env.INNERDREAMS_KV });
  }

  if (request.method !== "POST") return json(405, { ok: false, error: "Use GET or POST." });

  const body = await readJson(request);
  const password = body.password || request.headers.get("x-innerdreams-password") || "";
  const auth = requirePassword(env, password);
  if (!auth.ok) return json(401, { ok: false, error: auth.msg });

  const st = await getState(env);

  const action = (body.action || "").toLowerCase().trim();
  const instruction = (body.instruction || "").trim();
  const question = (body.question || "").trim();
  const files = body.files;

  try {
    if (action === "pause") {
      st.paused = true;
      await setState(env, st);
      return json(200, { ok: true, paused: true });
    }
    if (action === "resume") {
      st.paused = false;
      await setState(env, st);
      return json(200, { ok: true, paused: false });
    }
    if (action === "status") {
      return json(200, { ok: true, paused: !!st.paused, kv_enabled: !!env.INNERDREAMS_KV, last_autopilot_ms: st.last_autopilot_ms || 0 });
    }
    if (action === "ask") {
      if (!question) return json(400, { ok: false, error: "Missing question." });
      const answer = await handleAsk(env, question);
      return json(200, { ok: true, answer });
    }
    if (action === "edit") {
      if (!instruction) return json(400, { ok: false, error: "Missing instruction." });
      if (st.paused) return json(409, { ok: false, error: "Innerdreams is paused." });
      const pr = await handleEdit(env, { instruction, files });
      return json(200, { ok: true, ...pr });
    }
    if (action === "autopilot") {
      if (st.paused) return json(409, { ok: false, error: "Innerdreams is paused." });

      const now = Date.now();
      const minGapMs = 24 * 60 * 60 * 1000; // 24h
      const last = st.last_autopilot_ms || 0;
      if (now - last < minGapMs) {
        return json(200, { ok: true, skipped: true, reason: "Rate-limited (24h).", next_ok_ms: last + minGapMs });
      }

      const pr = await handleAutopilot(env);
      st.last_autopilot_ms = now;
      await setState(env, st);

      return json(200, { ok: true, ...pr });
    }

    // Convenience: infer action if not provided
    if (!action) {
      if (instruction === "pause") return await onRequest({ ...context, request: new Request(request.url, { method: "POST", headers: request.headers, body: JSON.stringify({ password, action: "pause" }) }) });
      if (instruction === "resume") return await onRequest({ ...context, request: new Request(request.url, { method: "POST", headers: request.headers, body: JSON.stringify({ password, action: "resume" }) }) });
      if (instruction.endsWith("?")) {
        const answer = await handleAsk(env, instruction);
        return json(200, { ok: true, answer });
      }
      const pr = await handleEdit(env, { instruction, files });
      return json(200, { ok: true, ...pr });
    }

    return json(400, { ok: false, error: `Unknown action: ${action}` });
  } catch (e) {
    return json(500, { ok: false, error: e.message || String(e) });
  }
}
