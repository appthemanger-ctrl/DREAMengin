export default function RootLoading() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 20,
        background: 'linear-gradient(148deg, var(--de-theme-from, #e9ecf1) 0%, var(--de-theme-mid, #f0f2f6) 55%, var(--de-theme-to, #f7f3ec) 100%)',
      }}
    >
      {/* Spinner with gold→sky pulse */}
      <div className="de-spinner de-spinner-lg" />

      {/* Wordmark */}
      <div
        style={{
          fontFamily: 'var(--font-cormorant, Georgia, serif)',
          fontStyle: 'italic',
          fontWeight: 500,
          fontSize: 22,
          letterSpacing: '-0.01em',
          lineHeight: 1,
          display: 'flex',
          alignItems: 'baseline',
          gap: 0,
          opacity: 0.7,
        }}
      >
        <span
          style={{
            background: 'linear-gradient(135deg, #8a6010 0%, #c8981a 40%, #f0d060 60%, #c8981a 80%, #8a6010 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          dream
        </span>
        <span style={{ color: 'var(--de-text-dim, rgba(60,75,100,0.52))' }}>engin</span>
      </div>
    </div>
  );
}
