import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

type AuthenticatedPageHeaderProps = {
  backHref: string;
  title: string;
  icon: ReactNode;
  accentColor?: string;
  eyebrow?: string;
  subtitle?: string;
  badge?: string;
  containerClassName?: string;
};

export default function AuthenticatedPageHeader({
  backHref,
  title,
  icon,
  accentColor = 'var(--de-accent)',
  eyebrow = 'DREAMengin',
  subtitle,
  badge,
  containerClassName = 'max-w-2xl',
}: AuthenticatedPageHeaderProps) {
  return (
    <header className="de-auth-header sticky top-0 z-30">
      <div className={`de-auth-header-inner ${containerClassName} mx-auto px-4 py-3 flex items-center gap-3`}>
        <Link
          href={backHref}
          className="de-auth-back"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--de-text)' }} />
        </Link>

        <div
          className="de-auth-icon"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, rgba(200,152,26,0.92))`,
            boxShadow: `0 6px 18px color-mix(in srgb, ${accentColor} 26%, transparent)`,
          }}
        >
          {icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="de-auth-eyebrow">{eyebrow}</div>
          <div style={{ display: 'flex', alignItems: subtitle ? 'flex-start' : 'center', gap: 10, justifyContent: 'space-between' }}>
            <div style={{ minWidth: 0 }}>
              <h1 className="de-auth-title">{title}</h1>
              {subtitle ? (
                <div className="de-auth-subtitle">{subtitle}</div>
              ) : null}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {badge ? <span className="de-auth-badge">{badge}</span> : null}
          <BrandLogo width={28} height={28} alt="DREAMengin" className="de-auth-logo" />
        </div>
      </div>
    </header>
  );
}
