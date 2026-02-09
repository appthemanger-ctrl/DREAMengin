/**
 * Adari build enforcement utilities.
 *
 * This module is intentionally dependency-free and Node-only. It is used by
 * `scripts/postbuild` to verify the repo matches the MVP spec invariants.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

export type AdariCheck = {
  id: string;
  ok: boolean;
  message: string;
};

export type AdariReport = {
  ok: boolean;
  checks: AdariCheck[];
};

const REQUIRED_PATHS = [
  "components/WheelLayout.tsx",
  "lib/widgets/WidgetEngine.tsx",
  "lib/widgets/WidgetBus.ts",
  "lib/widgets/useWidget.ts",
] as const;

function checkRequiredPaths(cwd: string): AdariCheck[] {
  return REQUIRED_PATHS.map((p) => {
    const abs = resolve(cwd, p);
    const ok = existsSync(abs);
    return {
      id: `path:${p}`,
      ok,
      message: ok ? `Found ${p}` : `Missing required file: ${p}`,
    };
  });
}

function checkPackageJsonScripts(cwd: string): AdariCheck[] {
  const pkgPath = resolve(cwd, "package.json");
  if (!existsSync(pkgPath)) {
    return [{ id: "package.json", ok: false, message: "Missing package.json" }];
  }
  try {
    const raw = readFileSync(pkgPath, "utf8");
    const pkg = JSON.parse(raw) as { scripts?: Record<string, string> };
    const scripts = pkg.scripts ?? {};
    const okBuild = typeof scripts.build === "string" && scripts.build.length > 0;
    const okPostbuild = typeof scripts.postbuild === "string" && scripts.postbuild.length > 0;

    return [
      {
        id: "scripts:build",
        ok: okBuild,
        message: okBuild ? "package.json has a build script" : "package.json missing scripts.build",
      },
      {
        id: "scripts:postbuild",
        ok: okPostbuild,
        message: okPostbuild ? "package.json has a postbuild script" : "package.json missing scripts.postbuild",
      },
    ];
  } catch (e) {
    return [{ id: "package.json:parse", ok: false, message: `Failed to parse package.json: ${String(e)}` }];
  }
}

export function getBuildReport(opts?: { cwd?: string }): AdariReport {
  const cwd = opts?.cwd ?? process.cwd();
  const checks: AdariCheck[] = [
    ...checkRequiredPaths(cwd),
    ...checkPackageJsonScripts(cwd),
  ];
  const ok = checks.every((c) => c.ok);
  return { ok, checks };
}

export function assertBuildInvariants(opts?: { cwd?: string }): void {
  const report = getBuildReport(opts);
  if (report.ok) return;

  const lines = report.checks
    .filter((c) => !c.ok)
    .map((c) => `- ${c.message}`);
  throw new Error(`Adari build enforcement failed:\n${lines.join("\n")}`);
}
