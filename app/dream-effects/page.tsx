export default function DreamEffectsPage() {
  return (
    <div className="de-sky-bg min-h-screen flex items-center justify-center">
      <div className="de-widget" style={{ padding: '32px', maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🚧</div>
        <h1 className="de-widget-title">Not in use in this version</h1>
        <p style={{ color: 'var(--de-text-dim)', fontSize: 14 }}>
          The Three.js dream effects demo has been superseded.
          The design system is frosted glass — not neon shaders (SPEC §9).
        </p>
        <a href="/home" className="de-btn de-btn-gold" style={{ display: 'inline-flex', marginTop: 20 }}>
          Go Home
        </a>
      </div>
    </div>
  );
}
