import Link from 'next/link';

type StatusAction = {
  href: string;
  label: string;
  primary?: boolean;
};

export default function RootStatusScreen({
  eyebrow,
  title,
  message,
  detail,
  actions = [],
  loading = false,
}: {
  eyebrow?: string;
  title: string;
  message: string;
  detail?: string | null;
  actions?: StatusAction[];
  loading?: boolean;
}) {
  return (
    <div
      className="min-h-[100svh] flex flex-col items-center justify-center px-4"
      style={{ background: 'linear-gradient(155deg, #070e1c 0%, #0c1829 45%, #0f2244 75%, #0a1628 100%)' }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '520px',
            height: '380px',
            background: 'radial-gradient(ellipse, rgba(56,189,248,0.10) 0%, transparent 65%)',
            filter: 'blur(70px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-60px',
            left: '28%',
            width: '420px',
            height: '420px',
            background: 'radial-gradient(circle, rgba(200,152,26,0.10) 0%, transparent 60%)',
            filter: 'blur(70px)',
          }}
        />
      </div>

      <div
        style={{
          position: 'relative',
          width: 'min(30rem, 92vw)',
          textAlign: 'center',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(32px) saturate(170%)',
          WebkitBackdropFilter: 'blur(32px) saturate(170%)',
          border: '1px solid rgba(255,255,255,0.10)',
          borderRadius: 28,
          padding: '42px 30px 36px',
          boxShadow: '0 8px 56px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent, rgba(200,152,26,0.55) 40%, rgba(56,189,248,0.35) 70%, transparent)',
          }}
          aria-hidden="true"
        />

        {loading ? (
          <div className="de-spinner de-spinner-lg mx-auto mb-5" />
        ) : (
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              margin: '0 auto 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: '#e8d090',
              fontSize: 22,
            }}
            aria-hidden="true"
          >
            ✦
          </div>
        )}

        {eyebrow && (
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(200,152,26,0.80)',
              marginBottom: 10,
            }}
          >
            {eyebrow}
          </div>
        )}

        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: 'rgba(220,235,255,0.92)',
            letterSpacing: '-0.02em',
            marginBottom: 10,
          }}
        >
          {title}
        </h1>

        <p
          style={{
            fontSize: 14,
            color: 'rgba(165,195,235,0.72)',
            lineHeight: 1.7,
            marginBottom: detail ? 14 : 28,
          }}
        >
          {message}
        </p>

        {detail && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(220,68,68,0.05)',
              border: '1px solid rgba(220,68,68,0.14)',
              color: '#fca5a5',
              fontSize: 12,
              fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              lineHeight: 1.6,
              wordBreak: 'break-word',
              marginBottom: 20,
            }}
          >
            {detail}
          </div>
        )}

        {actions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {actions.map((action) => (
              <Link
                key={`${action.href}:${action.label}`}
                href={action.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '13px 28px',
                  borderRadius: 12,
                  background: action.primary ? 'linear-gradient(135deg, #F59E0B, #D97706)' : 'rgba(255,255,255,0.06)',
                  border: action.primary ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  color: action.primary ? '#fff' : 'rgba(210,230,255,0.85)',
                  fontWeight: action.primary ? 700 : 600,
                  fontSize: 14,
                  textDecoration: 'none',
                  boxShadow: action.primary ? '0 4px 20px rgba(245,158,11,0.35)' : 'none',
                }}
              >
                {action.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}