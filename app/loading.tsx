export default function RootLoading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--de-sky-bg, #f5f3ee)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: '3px solid rgba(200,152,26,0.2)',
          borderTopColor: 'var(--de-gold, #c8981a)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
    </div>
  );
}
