import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Not In Use | DREAMengin',
};

export default function GestureNavPage() {
  return (
    <div className="de-sky-bg min-h-screen flex items-center justify-center">
      <div className="de-widget" style={{ padding: '32px', maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🚧</div>
        <h1 className="de-widget-title">Not in use in this version</h1>
        <p style={{ color: 'var(--de-text-dim)', fontSize: 14 }}>
          The gesture navigation demo has been superseded by the spatial DreamNav system.
          All navigation flows through the Golden Button (SPEC §3).
        </p>
        <a href="/home" className="de-btn de-btn-gold" style={{ display: 'inline-flex', marginTop: 20 }}>
          Go Home
        </a>
      </div>
    </div>
  );
}
