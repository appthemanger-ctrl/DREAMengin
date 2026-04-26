// SURFACE: dreamsurface.SettingsDreams
import Link from 'next/link';
import { LayoutGrid, RotateCcw } from 'lucide-react';
import AuthenticatedPageHeader from '@/components/ui/dream.AuthenticatedPageHeader';
import DreamsLayoutEditor from './dreams-layout-editor';

export const metadata = { title: 'Dreams – DREAMengin Settings' };

export default function DreamsSettingsPage() {
  return (
    <div className="de-sky-bg min-h-screen">
      <AuthenticatedPageHeader
        backHref="/settings"
        title="Dreams"
        subtitle="Drag to reorder, toggle visibility, and reset your OS layout."
        icon={<LayoutGrid className="w-4 h-4" />}
        accentColor="var(--de-gold)"
        badge="Settings"
      />
      <div className="de-auth-content space-y-4">
        <DreamsLayoutEditor />
        <div className="de-widget">
          <div className="de-widget-header"><span className="de-widget-title">Layout reset</span></div>
          <div className="de-widget-body">
            <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>
              Reset returns HomeDream and DreamSpace to the default Dream suggestions.
            </p>
          </div>
          <div className="de-widget-actions">
            <Link href="/homedream" className="de-btn de-btn-primary text-xs">
              <RotateCcw className="w-3 h-3" /> Back to HomeDream
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
