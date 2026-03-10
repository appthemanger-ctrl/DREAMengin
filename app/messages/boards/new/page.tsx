'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NewBoardPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCreate = async () => {
    if (!title.trim() || isSaving) return;
    setIsSaving(true); setError('');
    try {
      const res = await fetch('/api/messages/boards?action=create_board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || undefined, is_public: isPublic }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setError(d.error || 'Failed to create board.'); return;
      }
      const { id } = await res.json() as { id: string };
      router.push(`/messages/boards/${id}`);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(160,195,240,0.35)',
    color: 'var(--de-heading)', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100svh', background: 'linear-gradient(160deg, #dce8f8 0%, #c8d8f0 40%, #f5e8c4 100%)', paddingBottom: 100 }}>
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
          <h1 style={{ flex: 1, fontSize: 18, fontWeight: 800, color: 'var(--de-heading)', margin: 0 }}>New Board</h1>
          <button onClick={handleCreate} disabled={!title.trim() || isSaving} style={{
            padding: '8px 20px', borderRadius: 10,
            background: title.trim() ? 'linear-gradient(135deg, #c8981a, #e0b830)' : 'rgba(200,152,26,0.2)',
            border: 'none', color: '#fff', fontWeight: 700, fontSize: 13,
            cursor: title.trim() && !isSaving ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {isSaving && <Loader2 size={12} className="animate-spin" />}
            Create
          </button>
        </div>
      </header>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(220,60,60,0.08)', border: '1px solid rgba(220,60,60,0.2)', color: '#dc4444', fontSize: 13 }}>
            {error}
          </div>
        )}
        <div style={{ background: 'rgba(255,255,255,0.72)', backdropFilter: 'blur(20px)', borderRadius: 22, padding: '18px 16px', border: '1px solid rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', marginBottom: 6, display: 'block', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>Title *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Music Production Tips" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', marginBottom: 6, display: 'block', letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this board about?" rows={3} style={{ ...inputStyle, resize: 'none' as const }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--de-heading)' }}>Make Public</div>
              <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Anyone can read and reply</div>
            </div>
            <button onClick={() => setIsPublic(p => !p)} style={{
              width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: isPublic ? 'linear-gradient(135deg, #c8981a, #e0b830)' : 'rgba(160,195,240,0.3)',
              position: 'relative', transition: 'background 0.2s',
            }}>
              <div style={{
                position: 'absolute', top: 3, left: isPublic ? 'calc(100% - 23px)' : 3,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)', transition: 'left 0.2s',
              }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
