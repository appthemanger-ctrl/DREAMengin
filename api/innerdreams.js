// Vercel Serverless Function: /api/innerdreams
// Secrets live in Vercel Env Vars. Required:
// INNERDREAMS_PASSWORD, GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, OPENAI_API_KEY

const JSON_HEADERS = { "content-type":"application/json; charset=utf-8", "cache-control":"no-store" }
function send(res, status, obj){
  res.status(status)
  for (const [k,v] of Object.entries(JSON_HEADERS)) res.setHeader(k,v)
  res.end(JSON.stringify(obj, null, 2))
}

function timingSafeEqual(a,b){
  const enc = new TextEncoder()
  const aa = enc.encode(String(a ?? ""))
  const bb = enc.encode(String(b ?? ""))
  let diff = aa.length ^ bb.length
  for (let i=0;i<Math.max(aa.length, bb.length);i++){
    diff |= (aa[i] ?? 0) ^ (bb[i] ?? 0)
  }
  return diff === 0
}

function requireEnv(name){
  const v = process.env[name]
  if (!v) throw new Error(`Missing required env var: ${name}`)
  return v
}

function todayUTC(){
  const d=new Date()
  const y=d.getUTCFullYear()
  const m=String(d.getUTCMonth()+1).padStart(2,"0")
  const dd=String(d.getUTCDate()).padStart(2,"0")
  return `${y}-${m}-${dd}`
}

globalThis.__INNERDREAMS_STATE__ = globalThis.__INNERDREAMS_STATE__ || { paused:false, lastAutopilotDay:"", autopilotCountToday:0 }

function extractOutputText(respJson){
  if (!respJson) return ""
  if (typeof respJson.output_text === "string") return respJson.output_text
  const out=[]
  for (const item of respJson.output || []){
    if (item?.type==="message" && Array.isArray(item.content)){
      for (const part of item.content){
        if (part?.type==="output_text" && typeof part.text==="string") out.push(part.text)
      }
    }
  }
  return out.join("\n").trim()
}

async function openaiText({ input, instructions }){
  const apiKey = requireEnv("OPENAI_API_KEY")
  const model = process.env.OPENAI_MODEL || "gpt-5.2"
  const r = await fetch("https://api.openai.com/v1/responses", {
    method:"POST",
    headers:{ "content-type":"application/json", "authorization":`Bearer ${apiKey}` },
    body: JSON.stringify({ model, store:false, instructions: instructions || undefined, input })
  })
  const t = await r.text()
  let j=null
  try{ j = t ? JSON.parse(t) : null }catch{}
  if (!r.ok) throw new Error(`OpenAI ${r.status}: ${t.slice(0,800)}`)
  return extractOutputText(j)
}

// GitHub helpers
async function gh(token,url,init={}){
  const r = await fetch(url, {
    ...init,
    headers:{
      "accept":"application/vnd.github+json",
      "authorization":`Bearer ${token}`,
      ...(init.headers || {})
    }
  })
  const t = await r.text()
  let j=null
  try{ j = t ? JSON.parse(t) : null }catch{}
  if (!r.ok) throw new Error(`GitHub ${r.status} ${url}: ${t.slice(0,800)}`)
  return j
}
async function ghGetDefaultBranch({token,owner,repo}){
  const r = await gh(token, `https://api.github.com/repos/${owner}/${repo}`)
  return r.default_branch
}
async function ghGetHeadSha({token,owner,repo,branch}){
  const r = await gh(token, `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`)
  return r.object.sha
}
async function ghCreateBranch({token,owner,repo,branch,sha}){
  return gh(token, `https://api.github.com/repos/${owner}/${repo}/git/refs`, {
    method:"POST",
    headers:{ "content-type":"application/json" },
    body: JSON.stringify({ ref:`refs/heads/${branch}`, sha })
  })
}
async function ghGetFile({token,owner,repo,path,ref}){
  const r = await gh(token, `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`)
  if (Array.isArray(r)) throw new Error(`Path is a directory: ${path}`)
  const content = r.content ? Buffer.from(r.content.replace(/\n/g,""), "base64").toString("utf8") : ""
  return { sha:r.sha, content }
}
async function ghPutFile({token,owner,repo,path,branch,message,content,sha}){
  const b64 = Buffer.from(String(content), "utf8").toString("base64")
  return gh(token, `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
    method:"PUT",
    headers:{ "content-type":"application/json" },
    body: JSON.stringify({ message, content:b64, branch, sha: sha || undefined })
  })
}
async function ghCreatePR({token,owner,repo,title,head,base,body}){
  return gh(token, `https://api.github.com/repos/${owner}/${repo}/pulls`, {
    method:"POST",
    headers:{ "content-type":"application/json" },
    body: JSON.stringify({ title, head, base, body })
  })
}

async function assertPassword(provided){
  const expected = requireEnv("INNERDREAMS_PASSWORD")
  if (!timingSafeEqual(provided, expected)) throw new Error("Unauthorized")
}

async function handleAsk(instruction){
  return openaiText({
    instructions: [
      "You are Innerdreams, a cautious site-maintainer assistant.",
      "Never output secrets, tokens, passwords, or private keys.",
      "Answer with a short actionable response."
    ].join("\n"),
    input: instruction
  })
}

async function handleEdit({ instruction, files }){
  const token=requireEnv("GITHUB_TOKEN")
  const owner=requireEnv("GITHUB_OWNER")
  const repo=requireEnv("GITHUB_REPO")

  const base=await ghGetDefaultBranch({token,owner,repo})
  const baseSha=await ghGetHeadSha({token,owner,repo,branch:base})

  const prefix=process.env.INNERDREAMS_BRANCH_PREFIX || "innerdreams"
  const branch=`${prefix}-${Date.now()}`
  await ghCreateBranch({token,owner,repo,branch,sha:baseSha})

  const fileBlobs=[]
  for (const p of files){
    try{
      const got=await ghGetFile({token,owner,repo,path:p,ref:base})
      fileBlobs.push({ path:p, sha:got.sha, content:got.content })
    }catch{
      fileBlobs.push({ path:p, sha:null, content:"" })
    }
  }

  const prompt = [
    "You are an expert maintainer of a web app repository.",
    "Goal: apply the user's instruction with MINIMAL edits.",
    "Hard rules: Do NOT add secrets. Do NOT introduce new dependencies. Return ONLY valid JSON (no markdown).",
    "Return JSON: { changes:[{path,content}], prTitle, prBody }",
    "User instruction:",
    instruction,
    "",
    "Here are current files:",
    ...fileBlobs.map(f => `---\nPATH: ${f.path}\nCONTENT:\n${f.content}\n`)
  ].join("\n")

  const raw = await openaiText({ instructions:"Return ONLY JSON.", input: prompt })
  let plan=null
  try{ plan = JSON.parse(raw) }catch{ throw new Error("Model did not return valid JSON.") }
  const changes = Array.isArray(plan?.changes) ? plan.changes : []
  if (!changes.length) throw new Error("No changes proposed.")

  const byPath = new Map(fileBlobs.map(f => [f.path, f]))
  for (const ch of changes){
    if (!ch?.path || typeof ch.content !== "string") continue
    const existing = byPath.get(ch.path)
    await ghPutFile({
      token, owner, repo,
      path: ch.path,
      branch,
      message: `Innerdreams: update ${ch.path}`,
      content: ch.content,
      sha: existing?.sha || null
    })
  }

  const pr = await ghCreatePR({
    token, owner, repo,
    title: plan.prTitle || "Innerdreams update",
    head: branch,
    base,
    body: plan.prBody || "Created by Innerdreams."
  })
  return { pr_url: pr.html_url, pr_number: pr.number, branch, base }
}

async function handleAutopilot(){
  const st = globalThis.__INNERDREAMS_STATE__
  const day = todayUTC()
  const limit = Number(process.env.INNERDREAMS_DAILY_LIMIT || "1")

  if (st.lastAutopilotDay !== day){
    st.lastAutopilotDay = day
    st.autopilotCountToday = 0
  }
  if (st.autopilotCountToday >= limit){
    return { skipped:true, reason:`Daily limit reached (${limit}/day).` }
  }

  // Minimal autopilot: create/update INNERDREAMS_REPORT.md with a generated report.
  const token=requireEnv("GITHUB_TOKEN")
  const owner=requireEnv("GITHUB_OWNER")
  const repo=requireEnv("GITHUB_REPO")
  const base=await ghGetDefaultBranch({token,owner,repo})
  const baseSha=await ghGetHeadSha({token,owner,repo,branch:base})

  const prefix=process.env.INNERDREAMS_BRANCH_PREFIX || "innerdreams"
  const branch=`${prefix}-autopilot-${day}-${Date.now()}`
  await ghCreateBranch({token,owner,repo,branch,sha:baseSha})

  const tree = await gh(token, `https://api.github.com/repos/${owner}/${repo}/git/trees/${baseSha}?recursive=1`)
  const paths = (tree?.tree || []).filter(x => x?.type==="blob").map(x => x.path).slice(0, 2500)

  const report = await openaiText({
    instructions: [
      "You are Innerdreams Autopilot.",
      "Propose 1-3 small, safe improvements that require no new dependencies.",
      "Never output secrets.",
      "Output a short markdown report."
    ].join("\n"),
    input: `Repo file list (truncated):\n${paths.join("\n")}`
  })

  let existingSha=null
  try{
    const got=await ghGetFile({token,owner,repo,path:"INNERDREAMS_REPORT.md",ref:base})
    existingSha = got.sha
  }catch{}

  await ghPutFile({
    token, owner, repo,
    path: "INNERDREAMS_REPORT.md",
    branch,
    message: "Innerdreams autopilot report",
    content: report || "# Innerdreams report\n\nNo report generated.\n",
    sha: existingSha
  })

  const pr = await ghCreatePR({
    token, owner, repo,
    title: `Innerdreams autopilot report (${day})`,
    head: branch,
    base,
    body: "- Autogenerated daily report.\n- No secrets included.\n- Review and merge if useful."
  })

  st.autopilotCountToday += 1
  return { skipped:false, pr_url: pr.html_url, pr_number: pr.number, branch, base, day }
}

export default async function handler(req, res){
  res.setHeader("access-control-allow-origin","*")
  res.setHeader("access-control-allow-headers","content-type")
  res.setHeader("access-control-allow-methods","GET,POST,OPTIONS")
  if (req.method === "OPTIONS") return res.status(204).end()

  if (req.method === "GET"){
    const st = globalThis.__INNERDREAMS_STATE__
    return send(res, 200, { ok:true, paused:!!st.paused })
  }

  if (req.method !== "POST") return send(res, 405, { ok:false, error:"Use GET or POST." })

  const payload = (typeof req.body === "string")
    ? (() => { try { return JSON.parse(req.body) } catch { return {} } })()
    : (req.body || {})

  const password = String(payload.password || "")
  const action = String(payload.action || "")
  const instruction = String(payload.instruction || "")
  const files = Array.isArray(payload.files)
    ? payload.files.map(String).filter(Boolean)
    : String(payload.files || "").split(",").map(s => s.trim()).filter(Boolean)

  try{
    await assertPassword(password)

    const st = globalThis.__INNERDREAMS_STATE__
    if (action === "pause"){ st.paused = true; return send(res, 200, { ok:true, paused:true }) }
    if (action === "resume"){ st.paused = false; return send(res, 200, { ok:true, paused:false }) }
    if (st.paused && action !== "status") return send(res, 409, { ok:false, error:"Innerdreams is paused." })
    if (action === "status") return send(res, 200, { ok:true, paused:!!st.paused })

    if (action === "ask"){
      if (!instruction) return send(res, 400, { ok:false, error:"Missing instruction." })
      const answer = await handleAsk(instruction)
      return send(res, 200, { ok:true, answer })
    }
    if (action === "edit"){
      if (!instruction) return send(res, 400, { ok:false, error:"Missing instruction." })
      if (!files.length) return send(res, 400, { ok:false, error:"Missing files (array or comma-separated)." })
      const pr = await handleEdit({ instruction, files })
      return send(res, 200, { ok:true, ...pr })
    }
    if (action === "autopilot"){
      const result = await handleAutopilot()
      return send(res, 200, { ok:true, ...result })
    }

    return send(res, 400, { ok:false, error:`Unknown action: ${action}` })
  }catch(e){
    const msg = e?.message ? e.message : String(e)
    const status = (msg === "Unauthorized") ? 401 : 500
    return send(res, status, { ok:false, error: msg })
  }
}
