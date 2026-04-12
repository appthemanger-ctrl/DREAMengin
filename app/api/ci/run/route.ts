import { NextResponse } from 'next/server';
import { spawn } from 'child_process';

function runCommand(command: string, cwd: string): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn(command, { shell: true, cwd });
    let stdout = '', stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('close', (code) => resolve({ stdout, stderr, code: code || 0 }));
  });
}

export async function POST(request: Request) {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.CI_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stages = [
    { name: 'Lint', command: 'pnpm lint' },
    { name: 'Typecheck', command: 'pnpm typecheck' },
    { name: 'Unit Tests', command: 'pnpm test' },
    { name: 'Build', command: 'pnpm build' },
  ];

  const results = [];
  let overallStatus = 'passing';
  for (const stage of stages) {
    const { stdout, stderr, code } = await runCommand(stage.command, process.cwd());
    const passed = code === 0;
    if (!passed) overallStatus = 'failed';
    results.push({ name: stage.name, passed, output: (stdout + stderr).slice(0, 2000) });
  }
  return NextResponse.json({ status: overallStatus, stages: results });
}
