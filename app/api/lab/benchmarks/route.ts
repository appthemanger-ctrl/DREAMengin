import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';


function runServerBenchmarks() {
  const start = performance.now();
  let acc = 0;
  for (let i = 0; i < 100_000; i += 1) acc += Math.sqrt(i);
  const mathMs = performance.now() - start;

  const jsonStart = performance.now();
  JSON.parse(JSON.stringify({ acc, values: Array.from({ length: 200 }, (_, i) => i) }));
  const jsonMs = performance.now() - jsonStart;

  return [
    { name: 'Math Throughput', score: mathMs.toFixed(1), unit: 'ms' },
    { name: 'JSON Roundtrip', score: jsonMs.toFixed(1), unit: 'ms' },
    { name: 'Server Loop', score: (1000 / Math.max(mathMs, 1)).toFixed(1), unit: 'ops/s' },
    { name: 'Stability Score', score: (100 - Math.min(99, Math.round(mathMs + jsonMs))).toString(), unit: '/100' },
  ];
}

export async function POST(_req: NextRequest) {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = runServerBenchmarks();
  const db = supabase as any;
  const title = `Benchmark Run — ${new Date().toISOString()}`;
  const { data: record, error } = await db
    .from('physics_experiments')
    .insert({
      creator_id: user.id,
      title,
      status: 'completed',
      visibility: 'private',
    })
    .select('id, title, status')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ results, record });
}
