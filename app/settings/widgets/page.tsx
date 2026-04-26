// SURFACE: dreamsurface.SettingsWidgetsLegacy
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';
import AuthenticatedPageHeader from '@/components/ui/dream.AuthenticatedPageHeader';

export const metadata = { title: 'Dreams – DREAMengin Settings' };

export default function LegacyWidgetsSettingsPage() {
  return (
    <div className="de-sky-bg min-h-screen">
      <AuthenticatedPageHeader
        backHref="/settings"
        title="Dreams"
        subtitle="Widgets are Dreams now. Continue to the canonical Dream layout editor."
        icon={<LayoutGrid className="w-4 h-4" />}
        accentColor="var(--de-gold)"
        badge="Settings"
      />
      <div className="de-auth-content">
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Dream settings moved</span>
          </div>
          <div className="de-widget-body">
            <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>
              The old widget settings route now points to Dreams. Use the Dream layout editor to reorder, hide, and reset your OS.
            </p>
          </div>
          <div className="de-widget-actions">
            <Link href="/settings/dreams" className="de-btn de-btn-primary text-xs">
              Open Dream settings →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
