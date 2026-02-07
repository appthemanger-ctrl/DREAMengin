// app/api/admin/hotfix/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  if (!token || token !== process.env.HOTFIX_TOKEN) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE!, // server only
    { auth: { persistSession: false } }
  )

  let cacheReset: string = 'skipped'
  try {
    // Preferred: RPC wrapper if present
    const rpc = await supabase.rpc('reset_schema_cache', {}, { head: false, schema: 'admin' })
    if (rpc.error) throw rpc.error
    cacheReset = 'rpc_ok'
  } catch {
    // Universal fallback: NOTIFY PostgREST to reload schema
    const r = await supabase.rpc('pg_notify', { channel: 'pgrst', payload: 'reload schema' } as any).catch(()=>null)
    cacheReset = 'notify_sent'
  }

  // Sanity checks
  const tables = await supabase
    .from('pg_tables')
    .select('schemaname, tablename')
    .eq('schemaname','public')
    .in('tablename',['app_posts','music_releases','widgets'])

  const columns = await supabase
    .from('information_schema.columns')
    .select('table_name, column_name')
    .in('table_name',['app_posts','music_releases'])

  return NextResponse.json({
    ok: true,
    cacheReset,
    project: process.env.NEXT_PUBLIC_SUPABASE_URL,
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE ?? process.env.DEMO_MODE ?? 'unset',
    tables: { error: tables.error?.message, count: tables.data?.length },
    columns: { error: columns.error?.message, have_user_id: columns.data?.some(c => c.column_name==='user_id') ?? false }
  })
}
