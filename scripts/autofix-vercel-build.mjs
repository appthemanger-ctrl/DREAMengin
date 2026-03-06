/**
 * autofix-vercel-build.mjs
 *
 * Attempts a `next build` and, on failure, parses the error output to detect
 * missing npm/pnpm packages.  For each missing package it adds the latest
 * version to package.json (dependencies) and re-runs `pnpm install`.
 * The loop repeats up to MAX_ATTEMPTS times.
 *
 * Exit codes:
 *   0 – build succeeded (possibly after fixes)
 *   1 – build still failing after exhausting attempts
 */

import { execSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const MAX_ATTEMPTS = 5;
const PKG_PATH = resolve("package.json");

function run(cmd, opts = {}) {
  return spawnSync(cmd, { shell: true, encoding: "utf8", ...opts });
}

function latestVersion(pkg: string): string | null {
  // Validate package name before passing to shell
  if (!/^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(pkg)) {
    console.warn(`⚠  Skipping unsafe package name: ${pkg}`);
    return null;
  }
  const result = run(`pnpm info ${pkg} version`);
  if (result.status !== 0) return null;
  return result.stdout.trim();
}

function parseMissingModules(output) {
  const missing = new Set();
  const re = /Can't resolve '(@?[^']+)'/g;
  let m;
  while ((m = re.exec(output)) !== null) {
    const mod = m[1];
    // Ignore relative imports and built-in node modules
    if (!/^[./]|^node:/.test(mod)) {
      // Normalise to package name (strip sub-path e.g. "pkg/sub" → "pkg", "@scope/pkg/sub" → "@scope/pkg")
      const parts = mod.split("/");
      const pkgName = mod.startsWith("@") ? `${parts[0]}/${parts[1]}` : parts[0];
      // Skip if derived package name looks unsafe
      if (/^[a-z0-9@]/.test(pkgName)) {
        missing.add(pkgName);
      }
    }
  }
  return [...missing];
}

function addDependencies(pkgNames) {
  const pkgJson = JSON.parse(readFileSync(PKG_PATH, "utf8"));
  const already = new Set([
    ...Object.keys(pkgJson.dependencies ?? {}),
    ...Object.keys(pkgJson.devDependencies ?? {}),
  ]);

  let changed = false;
  for (const name of pkgNames) {
    if (already.has(name)) continue;
    const version = latestVersion(name);
    if (!version) {
      console.warn(`⚠  Could not resolve latest version for: ${name}`);
      continue;
    }
    console.log(`➕ Adding missing dependency: ${name}@^${version}`);
    pkgJson.dependencies = pkgJson.dependencies ?? {};
    pkgJson.dependencies[name] = `^${version}`;
    changed = true;
  }

  if (changed) {
    writeFileSync(PKG_PATH, JSON.stringify(pkgJson, null, 2) + "\n", "utf8");
  }
  return changed;
}

const MAX_ERROR_OUTPUT_LENGTH = 4000;

while (attempt < MAX_ATTEMPTS) {
  attempt++;
  console.log(`\n🔨 Build attempt ${attempt}/${MAX_ATTEMPTS}…`);

  const build = run("pnpm run build", { stdio: "pipe" });
  const combined = (build.stdout ?? "") + (build.stderr ?? "");

  if (build.status === 0) {
    console.log("✅ Build succeeded.");
    process.exit(0);
  }

  console.error(`❌ Build failed (exit ${build.status}).`);

  const missing = parseMissingModules(combined);
  if (missing.length === 0) {
    console.error("No missing modules detected – cannot auto-fix. Build output:");
    console.error(combined.slice(-MAX_ERROR_OUTPUT_LENGTH));
    process.exit(1);
  }

  console.log(`🔍 Missing packages: ${missing.join(", ")}`);
  const changed = addDependencies(missing);

  if (!changed) {
    console.error("All missing packages are already listed in package.json but build still fails.");
    console.error("Build output:");
    console.error(combined.slice(-MAX_ERROR_OUTPUT_LENGTH));
    process.exit(1);
  }

  console.log("📦 Running pnpm install…");
  const install = run("pnpm install", { stdio: "inherit" });
  if (install.status !== 0) {
    console.error("pnpm install failed.");
    process.exit(1);
  }
}

console.error(`❌ Build still failing after ${MAX_ATTEMPTS} attempts.`);
process.exit(1);
