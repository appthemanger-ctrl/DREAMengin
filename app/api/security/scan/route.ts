import { exec } from 'child_process';
import { NextResponse } from 'next/server';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request ): Promise<NextResponse> {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.CI_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { stdout } = await execAsync('pnpm audit --json', { cwd: process.cwd() });
    const advisories = [];
    for (const line of stdout.split('\n').filter((l) => l.trim())) {
      try {
        const data = JSON.parse(line);
        if (data.type === 'auditAdvisory') {
          advisories.push({
            title: data.data.advisory.title,
            severity: data.data.advisory.severity,
            package: data.data.advisory.module_name,
            vulnerable_versions: data.data.advisory.vulnerable_versions,
            patched_versions: data.data.advisory.patched_versions,
          });
        }
      } catch {
          // Non-JSON line in pnpm audit output — skip silently
        }
    }
    const summary = {
      total: advisories.length,
      high: advisories.filter((a) => a.severity === 'high').length,
      moderate: advisories.filter((a) => a.severity === 'moderate').length,
      low: advisories.filter((a) => a.severity === 'low').length,
    };
    return NextResponse.json({ summary, advisories });
  } catch (_err: any) {
    const error = _err as Record<string, unknown> & { message?: string };
    if (error.stdout) {
      // pnpm audit exits with non‑zero when vulnerabilities found, but stdout still contains JSON
      const advisories = [];
      for (const line of error.stdout.split('\n').filter((l: string) => l.trim())) {
        try {
          const data = JSON.parse(line);
          if (data.type === 'auditAdvisory') {
            advisories.push({
              title: data.data.advisory.title,
              severity: data.data.advisory.severity,
              package: data.data.advisory.module_name,
              vulnerable_versions: data.data.advisory.vulnerable_versions,
              patched_versions: data.data.advisory.patched_versions,
            });
          }
        } catch {
          // Non-JSON line in pnpm audit output — skip silently
        }
      }
      const summary = {
        total: advisories.length,
        high: advisories.filter((a) => a.severity === 'high').length,
        moderate: advisories.filter((a) => a.severity === 'moderate').length,
        low: advisories.filter((a) => a.severity === 'low').length,
      };
      return NextResponse.json({ summary, advisories });
    }
    return NextResponse.json({ error: 'Audit failed', details: error.message }, { status: 500 });
  }
}