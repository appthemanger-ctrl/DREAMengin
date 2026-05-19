/**
 * Adari build enforcement utilities — v2.0.0
 *
 * This module is intentionally dependency-free and Node-only. It is used by
 * `scripts/postbuild` to verify the repo matches the v2.0.0 spec invariants.
 *
 * v2.0.0: required paths updated from legacy widget-era files to canonical
 * v2 runtime files. WheelLayout / WidgetEngine / WidgetBus / useWidget were
 * v1-era enforcement targets; they are now legacy archives, not required files.
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

/**
 * v2.0.0 required paths — canonical runtime files that must exist.
 * Replaces the v1-era check (WheelLayout, WidgetEngine, WidgetBus, useWidget).
 */
const REQUIRED_PATHS = [
  // Canonical type authority (replaces widget-system-v2.ts)
  "types/dream-window.ts",
  // Canonical naming authority
  "lib/identity/canonical-names.ts",
  // Dream Window lifecycle
  "lib/dream-window/useDreamWindowActions.ts",
  // Dual runtime persistence
  "lib/runtime/useDualRuntimePersistence.ts",
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
    const pkg = JSON.parse(raw) as { scripts?: Record<string, string>; version?: string };
    const scripts = pkg.scripts ?? {};
    const okBuild = typeof scripts.build === "string" && scripts.build.length > 0;
    const okPostbuild = typeof scripts.postbuild === "string" && scripts.postbuild.length > 0;
    const okVersion = pkg.version === '2.0.0';

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
      {
        id: "version:2.0.0",
        ok: okVersion,
        message: okVersion ? `package.json version is ${pkg.version}` : `package.json version must be 2.0.0, got: ${pkg.version}`,
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
