import { createServerClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Pin } from 'lucide-react';
import BoardComposer from '@/components/messaging/BoardComposer';

export const dynamic = 'force-dynamic';

interface Props { params: Promise<{ id: string }> }

export default async function BoardDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: board } = await supabase
    .from('boards')
    .select('id, owner_id, title, description, is_public')
    .eq('id', id)
    .single();

  if (!board) notFound();

  // Check visibility: owner always can see; non-owner only if public
  if (board.owner_id !== user.id && !board.is_public) {
    redirect('/messages/boards');
  }

  const { data: posts } = await supabase
    .from('board_posts')
    .select('id, author_id, content, is_pinned, created_at, profiles!author_id(handle, display_name, avatar_url)')
    .eq('board_id', id)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: true });

  type Post = {
    id: string; author_id: string; content: string; is_pinned: boolean; created_at: string;
    profiles: { handle: string | null; display_name: string | null; avatar_url: string | null } | null;
  };

  const typedPosts = (posts ?? []) as Post[];

  return (
    <div style={{ minHeight: '100svh', background: 'linear-gradient(160deg, #dce8f8 0%, #c8d8f0 40%, #f5e8c4 100%)', paddingBottom: 120 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(160,195,240,0.3)', padding: '0 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 56 }}>
          <Link href="/messages/boards" style={{
            width: 34, height: 34, borderRadius: 9, background: 'rgba(160,195,240,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
          }}>
            <ArrowLeft size={15} style={{ color: 'var(--de-text)' }} />
          </Link>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 16, fontWeight: 800, color: 'var(--de-heading)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {board.title}
            </h1>
            {board.description && (
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)', margin: 0 }}>{board.description}</p>
            )}
          </div>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
            background: board.is_public ? 'rgba(42,138,184,0.1)' : 'rgba(200,152,26,0.1)',
            color: board.is_public ? '#2a8ab8' : '#a07010',
          }}>
            {board.is_public ? 'Public' : 'Private'}
          </span>
        </div>
      </header>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {typedPosts.length === 0 ? (
          <div className="de-widget">
            <div className="de-widget-body" style={{ textAlign: 'center', padding: '36px 20px' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 6 }}>No posts yet</div>
              <p style={{ fontSize: 13, color: 'var(--de-text-dim)' }}>Be the first to post in this board.</p>
            </div>
          </div>
        ) : typedPosts.map(post => {
          const author = post.profiles;
          const authorName = author?.display_name || author?.handle || 'Anonymous';
          return (
            <div key={post.id} className="de-widget" style={post.is_pinned ? { borderColor: 'rgba(200,152,26,0.4)' } : {}}>
              <div className="de-widget-body" style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #c8981a, #4A9ED6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff',
                  }}>
                    {authorName[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{authorName}</span>
                    {author?.handle && (
                      <span style={{ fontSize: 11, color: 'var(--de-text-dim)', marginLeft: 5 }}>@{author.handle}</span>
                    )}
                  </div>
                  {post.is_pinned && <Pin size={12} style={{ color: '#c8981a', flexShrink: 0 }} />}
                  <span style={{ fontSize: 10, color: 'var(--de-text-dim)', flexShrink: 0 }}>
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: 'var(--de-text)', margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer — always show (board owner + any board member can post) */}
      <BoardComposer boardId={id} userId={user.id} />
    </div>
  );
}
