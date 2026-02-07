/**
 * Postbuild enforcement (Node runnable).
 *
 * We keep this tiny and dependency-free so it runs in any CI/CD without ts-node.
 */
const { existsSync, readFileSync } = require("node:fs");
const { resolve } = require("node:path");

const REQUIRED_PATHS = [
  "components/WheelLayout.tsx",
  "lib/widgets/WidgetEngine.ts",
  "lib/widgets/WidgetBus.ts",
  "lib/widgets/useWidget.ts",
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

    return [
      { id: "scripts:build", ok: okBuild, message: okBuild ? "package.json has a build script" : "package.json missing scripts.build" },
      { id: "scripts:postbuild", ok: okPostbuild, message: okPostbuild ? "package.json has a postbuild script" : "package.json missing scripts.postbuild" },
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
  console.log("✅ Adari: build invariants satisfied");
}

main();
