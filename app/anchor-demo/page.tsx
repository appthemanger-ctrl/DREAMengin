export default function AnchorWidgetDemo() {
  return (
    <div className="de-sky-bg min-h-screen flex items-center justify-center">
      <div className="de-widget" style={{ padding: '32px', maxWidth: 480, textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚓</div>
        <h1 className="de-widget-title">Not in use in this version</h1>
        <p style={{ color: 'var(--de-text-dim)', fontSize: 14 }}>
          The AnchorWidget system has been superseded by the DreamNav surface.
          Navigation is handled by the Golden Button system (SPEC §3).
        </p>
        <a href="/home" className="de-btn de-btn-gold" style={{ display: 'inline-flex', marginTop: 20 }}>
          Go Home
        </a>
      </div>
    </div>
  );
}
