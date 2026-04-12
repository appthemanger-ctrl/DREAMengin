#!/usr/bin/env node

const { execSync } = require("node:child_process");

function read(command) {
  return execSync(command, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
}

function shouldTreatAsDocument(file) {
  return (
    file === "README.md" ||
    file === "REPO_STATE.md" ||
    file.startsWith("docs/") ||
    file.endsWith(".md") ||
    file.endsWith(".mdx")
  );
}

try {
  const message = read("git log -1 --pretty=%B");
  if (message.includes("[skip vercel]")) {
    console.log("Skipping Vercel build because commit message requested it.");
    process.exit(0);
  }

  const changedFiles = read("git diff-tree --no-commit-id --name-only -r -m HEAD")
    .split("\n")
    .map((file) => file.trim())
    .filter(Boolean);

  if (changedFiles.length > 0 && changedFiles.every(shouldTreatAsDocument)) {
    console.log("Skipping Vercel build because this commit only updates documents.");
    process.exit(0);
  }

  console.log("Continuing Vercel build.");
  process.exit(1);
} catch {
  console.log("Continuing Vercel build because ignore checks could not be evaluated.");
  process.exit(1);
}
