import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FolderOpen, Image, Video, Music2, Upload } from 'lucide-react';
import DaydreamShell, { type DaydreamWidget } from '@/components/daydream/DaydreamShell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Asset Library – DREAMengin', description: 'Support surface for private media and reusable assets.' };

const WIDGETS: DaydreamWidget[] = [
  { id: 'upload',  emoji: '📤', label: 'Upload',       desc: 'Add files to your vault',    color: '#2a8ab8', href: '/api/upload' },
  { id: 'photos',  emoji: '🖼️', label: 'Photos',       desc: 'Your image library',         color: '#ec4899', href: '/daydream/media-vault' },
  { id: 'videos',  emoji: '🎬', label: 'Videos',       desc: 'Your video collection',      color: '#ef4444', href: '/daydream/media-vault' },
  { id: 'audio',   emoji: '🎵', label: 'Audio',        desc: 'Sound files and recordings', color: '#c8981a', href: '/daydream/music' },
  { id: 'share',   emoji: '🔗', label: 'Share Media',  desc: 'Post to your feed',          color: '#22c55e', href: '/create' },
  { id: 'privacy', emoji: '🔒', label: 'Privacy',      desc: 'Control who sees what',      color: '#6366f1', href: '/settings/privacy' },
];

export default async function MediaVaultPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const categories = [
    { icon: FolderOpen, label: 'All Media',   count: 0 },
    { icon: Image,      label: 'Camera Roll', count: 0 },
    { icon: Video,      label: 'Videos',      count: 0 },
    { icon: Music2,     label: 'Music',       count: 0 },
  ];

  return (
    <DaydreamShell
      title="Asset Library"
      enginName="MediaEngin"
      accentColor="#c8981a"
      widgets={WIDGETS}
    >
    <div className="de-sky-bg min-h-screen">
      <header className="sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(220,232,248,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/homedream" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.15)' }}>
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </Link>
          <FolderOpen className="w-5 h-5" style={{ color: 'var(--de-gold)' }} />
          <h1 className="text-lg font-bold" style={{ color: 'var(--de-heading)' }}>Asset Library</h1>
          <span className="ml-auto text-xs px-2 py-1 rounded-full font-semibold" style={{ background: 'rgba(200,152,26,0.1)', color: 'var(--de-gold)', border: '1px solid rgba(200,152,26,0.2)' }}>Daydream</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 space-y-4">

        {/* Sort tabs */}
        <div className="de-tabs" style={{ width: 'fit-content' }}>
          {['Newest', 'Favorites', 'Tags'].map((t) => (
            <button key={t} type="button" className={`de-tab${t === 'Newest' ? ' active' : ''}`}>{t}</button>
          ))}
        </div>

        {/* Category grid */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Categories</span>
          </div>
          <div className="de-widget-body">
            <div className="grid grid-cols-2 gap-3">
              {categories.map(({ icon: Icon, label, count }) => (
                <button key={label} type="button" className="de-surface flex items-center gap-3 p-3 text-left">
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(42,138,184,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon className="w-4 h-4" style={{ color: 'var(--de-accent)' }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: 'var(--de-heading)' }}>{label}</div>
                    <div className="text-xs" style={{ color: 'var(--de-text-dim)' }}>{count} items</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="de-widget-actions">
            <Link href="/api/upload" className="de-btn de-btn-primary text-xs">
              <Upload className="w-3 h-3" /> + Upload
            </Link>
          </div>
        </div>

        {/* Empty state */}
        <div className="de-widget">
          <div className="de-widget-body flex flex-col items-center py-8 gap-3">
            <FolderOpen className="w-10 h-10 opacity-20" style={{ color: 'var(--de-accent)' }} />
            <p className="text-sm font-medium" style={{ color: 'var(--de-heading)' }}>Your vault is empty</p>
            <p className="text-xs text-center" style={{ color: 'var(--de-text-dim)' }}>Upload media to start building your library. Files stay private until you publish them.</p>
            <Link href="/api/upload" className="de-btn de-btn-ghost text-xs">Upload Your First File</Link>
          </div>
        </div>

      </div>
    </div>
    </DaydreamShell>
  );
}