#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const cp = require("child_process");

const APP_ROOT = process.argv[2] || ".";
const root = path.resolve(APP_ROOT);

function warn(msg) {
  console.error("\n[SCORE PASS WARN]");
  console.error(msg);
}

function out(k, v) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (outputFile) {
    fs.appendFileSync(outputFile, `${k}=${String(v)}\n`);
  }
}

function safeExec(cmd) {
  try {
    return cp.execSync(cmd, { encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

const base = process.env.GITHUB_BASE_REF ? `origin/${process.env.GITHUB_BASE_REF}` : "HEAD~1";
let changed = safeExec(`git diff --name-only ${base}...HEAD`);
if (!changed) changed = safeExec(`git diff --name-only HEAD~1 HEAD`);
const changedFiles = changed
  .split("\n")
  .map(s => s.trim())
  .filter(Boolean);

const T = Math.max(1, Math.ceil(changedFiles.length / 5)); // crude task proxy
const F = changedFiles.length;

const depFiles = [
  "package.json",
  "package-lock.json",
  "pnpm-lock.yaml",
  "yarn.lock",
  "tsconfig.json",
  "next.config.js",
  "next.config.mjs",
  "next.config.ts",
  "vercel.json"
];
const D = changedFiles.some(f => depFiles.some(d => f.endsWith(d))) ? 1 : 0;

let A = 0;
if (changedFiles.some(f => f.includes("/app/") || f.startsWith("app/") || f.includes("/pages/") || f.startsWith("pages/"))) A += 1;
if (changedFiles.some(f => f.includes("/components/") || f.startsWith("components/"))) A += 1;
if (changedFiles.some(f => f.includes("/lib/") || f.startsWith("lib/") || f.includes("/src/"))) A += 1;
if (changedFiles.some(f => f.includes("supabase") || f.includes("schema") || f.includes("migrations"))) A += 1;

const U = 0; // set >0 later if you add ambiguity parser

const weights = { T: 1, F: 0.35, D: 2, A: 1.5, U: 2 };
const chi = +(weights.T * T + weights.F * F + weights.D * D + weights.A * A + weights.U * U).toFixed(2);

let mode = "create";
if (chi >= 8) mode = "patch";
else if (chi >= 4) mode = "conform";

let allowed = "true";

// hard guardrails from your Generation Law
if (mode === "patch") {
  const badPatch = changedFiles.some(f =>
    f.includes("package.json") ||
    f.includes("schema") ||
    f.includes("migrations") ||
    f.startsWith("docs/") === false && f.split("/").length <= 2 && !f.startsWith(".github/")
  );
  if (badPatch) {
    allowed = "false";
    warn(`Patch mode violation. chi=${chi}, mode=${mode}, changed=${JSON.stringify(changedFiles, null, 2)}`);
  }
}

out("chi", chi);
out("mode", mode);
out("changed_files", changedFiles.length);
out("allowed", allowed);

console.log(JSON.stringify({ chi, mode, changedFiles, allowed }, null, 2));
