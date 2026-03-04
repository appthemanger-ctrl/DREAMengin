import { execSync } from "node:child_process";

const DENY = [
  /\bAGPL\b/i,
  /\bGPL\b/i,
];

function run(cmd) {
  return execSync(cmd, { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
}

let json;
try {
  const out = run("npx --yes license-checker --json --production");
  json = JSON.parse(out);
} catch (e) {
  console.error("license-checker failed. Ensure dependencies are installed.");
  console.error(e?.stderr || e?.message || e);
  process.exit(2);
}

const offenders = [];
for (const [pkg, info] of Object.entries(json)) {
  const lic = (info.licenses ?? "").toString();
  const hit = DENY.some((re) => re.test(lic));
  if (hit) offenders.push({ pkg, licenses: lic, repository: info.repository });
}

if (offenders.length) {
  console.error("Blocked licenses detected (GPL/AGPL). Remove/replace these deps:");
  for (const o of offenders) {
    console.error(`- ${o.pkg}: ${o.licenses}${o.repository ? ` (${o.repository})` : ""}`);
  }
  process.exit(1);
}

console.log("License check OK (no GPL/AGPL detected in production dependencies).");
