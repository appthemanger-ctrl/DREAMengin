#!/usr/bin/env node
const fs2 = require("fs");
const path2 = require("path");

const APP_ROOT2 = process.argv[2] || ".";
const root2 = path2.resolve(APP_ROOT2);

function fail2(msg) {
  console.error("\n[VERCEL PREFLIGHT FAIL]");
  console.error(msg);
  process.exit(1);
}
function ok2(msg) {
  console.log("[ok]", msg);
}

if (!fs2.existsSync(root2)) fail2(`App root does not exist: ${root2}`);

const pkgPath = path2.join(root2, "package.json");
if (!fs2.existsSync(pkgPath)) fail2(`Missing package.json in app root: ${root2}`);
ok2("Found package.json");

const pkg = JSON.parse(fs2.readFileSync(pkgPath, "utf8"));
const scripts = pkg.scripts || {};
for (const s of ["build", "lint", "typecheck", "test:ci"]) {
  if (!scripts[s]) fail2(`Missing required script: ${s}`);
  ok2(`Found script "${s}"`);
}

const nextConfigCandidates = [
  "next.config.ts",
  "next.config.js",
  "next.config.mjs"
].map(f => path2.join(root2, f)).filter(fs2.existsSync);

if (nextConfigCandidates.length === 0) {
  fail2("Missing Next.js config in app root");
}
ok2(`Found Next.js config: ${path2.basename(nextConfigCandidates[0])}`);

const nextConfigText = fs2.readFileSync(nextConfigCandidates[0], "utf8");
if (nextConfigText.includes("ignoreBuildErrors: true")) {
  fail2("Do not set typescript.ignoreBuildErrors=true");
}
ok2("TypeScript build errors are not ignored");

const lockfiles = ["package-lock.json", "pnpm-lock.yaml", "yarn.lock"]
  .map(f => path2.join(root2, f))
  .filter(fs2.existsSync);

if (lockfiles.length === 0) fail2("No lockfile in app root");
if (lockfiles.length > 1) fail2(`Multiple lockfiles in app root: ${lockfiles.join(", ")}`);
ok2(`Using lockfile: ${path2.basename(lockfiles[0])}`);

const vercelJsonPath = path2.join(root2, "vercel.json");
if (fs2.existsSync(vercelJsonPath)) {
  const vercelJsonText = fs2.readFileSync(vercelJsonPath, "utf8");
  if (vercelJsonText.includes('"builds"')) {
    fail2('Avoid legacy vercel.json "builds" unless absolutely required');
  }
  ok2("vercel.json passed basic checks");
}

console.log("\nVERCEL PREFLIGHT PASSED");
