#!/usr/bin/env node
const fs3 = require("fs");
const path3 = require("path");

const APP_ROOT3 = process.argv[2] || ".";
const root3 = path3.resolve(APP_ROOT3);

function fail3(msg) {
  console.error("\n[SPEC CHECK FAIL]");
  console.error(msg);
  process.exit(1);
}

function collectFiles(dir, out = []) {
  for (const entry of fs3.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", "dist", "build", "coverage"].includes(entry.name)) continue;
    const p = path3.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(p, out);
    else out.push(p);
  }
  return out;
}

const files = collectFiles(root3);

// 1) Naming guard: no random "Engine" paths where your repo uses "Engin"
for (const f of files) {
  const base = path3.basename(f);
  if (/Engine/i.test(base) && !/Dreamengin/i.test(base) && !/Engin/i.test(base)) {
    fail3(`Forbidden naming found: ${f}`);
  }
}

// 2) No obvious fake-action / privacy violations
const bannedPatterns = [
  "publicByDefault",
  "autoPublish",
  "shareImmediately",
  "unsafeExposeProfileDraft",
  "fakeButton",
  "implicitPublish"
];

for (const f of files) {
  if (!/\.(ts|tsx|js|jsx|md|json)$/.test(f)) continue;
  const text = fs3.readFileSync(f, "utf8");

  for (const pat of bannedPatterns) {
    if (text.includes(pat)) {
      fail3(`Danger pattern "${pat}" found in ${f}`);
    }
  }

  // basic projection safety
  if (/ViewProfile/i.test(f) && /draft/i.test(text) && !/saved|public|projection/i.test(text)) {
    fail3(`View Profile may be using draft state unsafely: ${f}`);
  }
}

console.log("SPEC CHECK PASSED");
