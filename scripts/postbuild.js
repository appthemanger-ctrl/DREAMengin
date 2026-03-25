/**
 * Postbuild enforcement (Node runnable) — v2.0.0
 *
 * We keep this tiny and dependency-free so it runs in any CI/CD without ts-node.
 *
 * v2.0.0: updated REQUIRED_PATHS from legacy widget-era files (WheelLayout,
 * WidgetEngine, WidgetBus, useWidget) to canonical v2 runtime files.
 */
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

/**
 * v2.0.0 canonical required paths.
 * These are the structural invariants for DREAMengin v2.0.0.
 */
const REQUIRED_PATHS = [
  "types/dream-window.ts",
  "lib/identity/canonical-names.ts",
  "lib/dream-window/useDreamWindowActions.ts",
  "lib/runtime/useDualRuntimePersistence.ts",
];

function checkRequiredPaths(cwd) {
  return REQUIRED_PATHS.map((p) => {
    const abs = resolve(cwd, p);
    const ok = existsSync(abs);
    return { id: `path:${p}`, ok, message: ok ? `Found ${p}` : `Missing required file: ${p}` };
  });
}

function checkPackageJsonScripts(cwd) {
  const pkgPath = resolve(cwd, "package.json");
  if (!existsSync(pkgPath)) return [{ id: "package.json", ok: false, message: "Missing package.json" }];

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    const scripts = (pkg && pkg.scripts) || {};
    const okBuild = typeof scripts.build === "string" && scripts.build.length > 0;
    const okPostbuild = typeof scripts.postbuild === "string" && scripts.postbuild.length > 0;
    const okVersion = pkg.version === "2.0.0";

    return [
      { id: "scripts:build",     ok: okBuild,     message: okBuild     ? "package.json has a build script"    : "package.json missing scripts.build" },
      { id: "scripts:postbuild", ok: okPostbuild, message: okPostbuild ? "package.json has a postbuild script" : "package.json missing scripts.postbuild" },
      { id: "version:2.0.0",     ok: okVersion,   message: okVersion   ? `package.json version is ${pkg.version}` : `package.json version must be 2.0.0, got: ${pkg.version}` },
    ];
  } catch (e) {
    return [{ id: "package.json:parse", ok: false, message: `Failed to parse package.json: ${String(e)}` }];
  }
}

function main() {
  const cwd = process.cwd();
  const checks = [...checkRequiredPaths(cwd), ...checkPackageJsonScripts(cwd)];
  const failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    console.error("❌ Adari: build enforcement failed");
    for (const f of failed) console.error(`- ${f.message}`);
    process.exit(1);
  }
  console.log("✅ Adari v2.0.0: build invariants satisfied");
}

main();
