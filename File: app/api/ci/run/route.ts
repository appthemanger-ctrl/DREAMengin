import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { createServerClient } from '@/lib/supabase/server';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  // 1. Authenticate – only the owner (appthemanger@gmail.com) can trigger CI
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== 'appthemanger@gmail.com') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // 2. Define CI stages (adjust commands to match your package.json scripts)
  const stages = [
    { name: 'Lint', command: 'pnpm lint' },
    { name: 'Typecheck', command: 'pnpm typecheck' },
    { name: 'Unit Tests', command: 'pnpm test' },
    { name: 'Build', command: 'pnpm build' },
  ];

  const results: Array<{
    name: string;
    passed: boolean;
    output: string;
    durationMs: number;
  }> = [];

  let overallStatus = 'passing';
  const startTime = Date.now();

  for (const stage of stages) {
    const stageStart = Date.now();
    try {
      const { stdout, stderr } = await execAsync(stage.command, {
        cwd: process.cwd(),
        shell: true,
        env: { ...process.env, CI: 'true' }, // simulate CI environment
      });
      results.push({
        name: stage.name,
        passed: true,
        output: stdout || stderr || 'No output',
        durationMs: Date.now() - stageStart,
      });
    } catch (error: any) {
      overallStatus = 'failed';
      results.push({
        name: stage.name,
        passed: false,
        output: error.stdout || error.stderr || error.message,
        durationMs: Date.now() - stageStart,
      });
      break; // stop pipeline on first failure
    }
  }

  return NextResponse.json({
    status: overallStatus,
    stages: results,
    totalDurationMs: Date.now() - startTime,
    timestamp: new Date().toISOString(),
  });
}
