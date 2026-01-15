// Cloudflare Pages Function – endpoint: /api/innerdreams
// SECURITY: never put secrets in browser code – server-side only
// Required env vars (Cloudflare Pages > Settings > Environment Variables):
//   INNERDREAMS_PASSWORD   (admin gate)
//   GITHUB_TOKEN          (needs repo scope)
//   GITHUB_OWNER          (your GitHub username)
//   GITHUB_REPO           (repo name)
//   OPENAI_API_KEY        (for ask/edit/autopilot)
// Optional:
//   OPENAI_MODEL          (default: gpt-4)
//   INNERDREAMS_DAILY_LIMIT (autopilot PRs per day, default 1)

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
function json(status, obj, extra = {}){ return new Response(JSON.stringify(obj,null,2), {status, headers:{...JSON_HEADERS,...extra}})}

function timingSafeEqual(a, b){
  const enc=new TextEncoder(); const aa=enc.encode(String(a??"")); const bb=enc.encode(String(b??""));
  let diff=aa.length^bb.length; for(let i=0;i<Math.max(aa.length,bb.length);i++) diff|=(aa[i]??0)^(bb[i]??0);
  return diff===0;
}
function requireEnv(env, name){
  const v=env[name]; if(!v) throw new Error(`Missing required env var: ${name}`); return v;
}

// ---------- STATE (KV or memory) ----------
const MEMORY_STATE={paused:false,lastAutopilotDay:"",autopilotCountToday:0};
async function loadState(env){
  const kv=env.INNERDREAMS_KV; if(!kv) return {...MEMORY_STATE};
  const st=await kv.get("innerdreams_state","json"); return st||{...MEMORY_STATE};
}
async function saveState(env,st){
  const kv=env.INNERDREAMS_KV; if(!kv){Object.assign(MEMORY_STATE,st); return;}
  await kv.put("innerdreams_state",JSON.stringify(st));
}
function todayUTC(){
  const d=new Date(); const y=d.getUTCFullYear(); const m=String(d.getUTCMonth()+1).padStart(2,'0'); const dd=String(d.getUTCDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}

// ---------- OPENAI (Responses API) ----------
function extractOutputText(respJson){
  if(!respJson) return "";
  if(typeof respJson.output_text==="string") return respJson.output_text;
  const out=[];
  for(const item of respJson.output||[]){
    if(item&&item.type==="message"&&Array.isArray(item.content)){
      for(const part of item.content){
        if(part?.type==="output_text"&&typeof part.text==="string") out.push(part.text);
      }
    }
  }
  return out.join("\n").trim();
}
async function openaiText(env,{input,instructions}){
  const apiKey=requireEnv(env,"OPENAI_API_KEY");
  const model=env.OPENAI_MODEL||"gpt-4";
  const res=await fetch("https://api.openai.com/v1/responses",{
    method:"POST",
    headers:{"content-type":"application/json","authorization":`Bearer ${apiKey}`},
    body:JSON.stringify({model,store:false,instructions:instructions||undefined,input})
  });
  const text=await res.text(); let jsonBody=null; try{jsonBody=text?JSON.parse(text):null}catch{}
  if(!res.ok) throw new Error(`OpenAI ${res.status}: ${text.slice(0,800)}`);
  return extractOutputText(jsonBody);
}

// ---------- GITHUB HELPERS (no deps) ----------
async function gh(token,url,init={}){
  const res=await fetch(url,{...init,headers:{"accept":"application/vnd.github+json","authorization":`Bearer ${token}`,...(init.headers||{})}});
  const text=await res.text(); let jsonBody=null; try{jsonBody=text?JSON.parse(text):null}catch{}
  if(!res.ok) throw new Error(`GitHub ${res.status} ${url}: ${text.slice(0,800)}`);
  return jsonBody;
}
async function ghGetDefaultBranch({token,owner,repo}){ const r=await gh(token,`https://api.github.com/repos/${owner}/${repo}`); return r.default_branch; }
async function ghGetHeadSha({token,owner,repo,branch}){ const r=await gh(token,`https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${branch}`); return r.object.sha; }
async function ghCreateBranch({token,owner,repo,branch,sha}){ return gh(token,`https://api.github.com/repos/${owner}/${repo}/git/refs`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({ref:`refs/heads/${branch}`,sha})}); }
async function ghGetFile({token,owner,repo,path,ref}){ const r=await gh(token,`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(ref)}`); if(Array.isArray(r)) throw new Error(`Path is a directory: ${path}`); const content=r.content?atob(r.content.replace(/\n/g,"")):""; return {sha:r.sha,content}; }
async function ghPutFile({token,owner,repo,path,branch,message,content,sha}){
  const b64=btoa(unescape(encodeURIComponent(content)));
  return gh(token,`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({message,content:b64,branch,sha:sha||undefined})});
}
async function ghCreatePR({token,owner,repo,title,head,base,body}){ return gh(token,`https://api.github.com/repos/${owner}/${repo}/pulls`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({title,head,base,body})}); }

// ---------- INNERDREAMS ACTIONS ----------
async function assertPassword(env,provided){
  const expected=requireEnv(env,"INNERDREAMS_PASSWORD");
  if(!timingSafeEqual(provided,expected)) throw new Error("Unauthorized");
}
async function handleAsk(env,instruction){
  const answer=await openaiText(env,{input:instruction,instructions:["You are Innerdreams, a cautious site-maintainer assistant.","Never output secrets, tokens, passwords, or private keys.","Answer with a short actionable response."].join("\n")});
  return answer;
}
async function handleEdit(env,{instruction,files}){
  const token=requireEnv(env,"GITHUB_TOKEN");
  const owner=requireEnv(env,"GITHUB_OWNER");
  const repo=requireEnv(env,"GITHUB_REPO");
  const base=await ghGetDefaultBranch({token,owner,repo});
  const baseSha=await ghGetHeadSha({token,owner,repo,branch:base});
  const prefix=env.INNERDREAMS_BRANCH_PREFIX||"innerdreams";
  const branch=`${prefix}-${Date.now()}`;
  await ghCreateBranch({token,owner,repo,branch,sha:baseSha});
  const fileBlobs=[];
  for(const path of files){
    try{ const got=await ghGetFile({token,owner,repo,path,ref:base}); fileBlobs.push({path
