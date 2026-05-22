import { createServerClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export const metadata = { title: 'Platform Errors – Admin' };

export default async function PlatformErrorsPage( ){
  const supabase = await createServerClient();
  const { data } = await (supabase as SupabaseClient)
    .from('platform_errors')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="de-sky-bg min-h-screen">
      <div className="de-auth-content space-y-4">
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Recent platform errors</span></div>
          <div className="de-widget-body" style={{ display: 'grid', gap: 10 }}>
            {(data ?? []).map((error: any) => (
              <div key={error.id} className="de-row" style={{ display: 'block' }}>
                <div className="text-xs" style={{ color: 'var(--de-gold)', fontWeight: 800 }}>{error.source} · {error.created_at}</div>
                <div className="text-sm" style={{ color: 'var(--de-heading)', fontWeight: 700 }}>{error.message}</div>
                {error.stack && <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: 'var(--de-text-dim)', marginTop: 6 }}>{error.stack.slice(0, 900)}</pre>}
              </div>
            ))}
            {(data ?? []).length === 0 && <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>No platform errors recorded.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}