import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Layout } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Boards – Dreamengin' };

export default async function BoardsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  type Board = { id: string; title: string; description: string | null; is_public: boolean; updated_at: string; owner_id?: string };

  const [{ data: myBoardsRaw }, { data: publicBoardsRaw }] = await Promise.all([
    supabase
      .from('boards')
      .select('*')
      .eq('owner_id', user.id)
      .order('updated_at', { ascending: false }),
    supabase
      .from('boards')
      .select('*')
      .eq('is_public', true)
      .neq('owner_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10),
  ]);

  const myBoards = (myBoardsRaw ?? []) as Board[];
  const publicBoards = (publicBoardsRaw ?? []) as Board[];

  const renderBoard = (b: Board) => (
    <Link key={b.id} href={`/messages/boards/${b.id}`}
      className="de-row" style={{ borderRadius: 12, marginBottom: 2, textDecoration: 'none' }}>
      <div style={{
        width: 40, height: 40, borderRadius: 11, flexShrink: 0,
        background: b.is_public ? 'rgba(42,138,184,0.12)' : 'rgba(200,152,26,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
      }}>
        {b.is_public ? '📋' : '🔒'}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--de-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {b.title}
        </div>
        {b.description && (
          <div style={{ fontSize: 11, color: 'var(--de-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {b.description}
          </div>
        )}
      </div>
      <span style={{ fontSize: 10, color: 'var(--de-text-dim)', flexShrink: 0 }}>
        {b.is_public ? 'Public' : 'Private'}
      </span>
    </Link>
  );

  return (
    <div style={{ minHeight: '100svh', background: 'linear-gradient(160deg, #dce8f8 0%, #c8d8f0 40%, #f5e8c4 100%)', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(160,195,240,0.3)', padding: '0 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 56 }}>
          <Link href="/messages" style={{
            width: 34, height: 34, borderRadius: 9, background: 'rgba(160,195,240,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
          }}>
            <ArrowLeft size={15} style={{ color: 'var(--de-text)' }} />
          </Link>
          <Layout size={17} style={{ color: 'var(--de-gold)' }} />
          <h1 style={{ flex: 1, fontSize: 18, fontWeight: 800, color: 'var(--de-heading)', margin: 0 }}>Boards</h1>
          <Link href="/messages/boards/new" style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px',
            borderRadius: 10, background: 'linear-gradient(135deg, #c8981a, #e0b830)',
            color: '#fff', fontWeight: 700, fontSize: 12, textDecoration: 'none',
          }}>
            <Plus size={13} /> New Board
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* My Boards */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">My Boards</span>
            <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{(myBoards ?? []).length}</span>
          </div>
          <div className="de-widget-body" style={{ padding: '6px 8px' }}>
            {(myBoards ?? []).length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--de-text-dim)', fontSize: 13 }}>
                No boards yet. Create one to start a discussion.
              </div>
            ) : (myBoards ?? []).map(b => renderBoard(b as Board))}
          </div>
        </div>

        {/* Public boards from others */}
        {(publicBoards ?? []).length > 0 && (
          <div className="de-widget">
            <div className="de-widget-header"><span className="de-widget-title">Discover Boards</span></div>
            <div className="de-widget-body" style={{ padding: '6px 8px' }}>
              {(publicBoards ?? []).map(b => renderBoard(b as Board))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
