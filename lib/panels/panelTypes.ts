/**
 * panelTypes — canonical panel IDs for the SPA panel system.
 *
 * Every feature of DREAMengin that was previously a separate route is now
 * a SystemPanelId. The PanelHost renders them inline within the single page.
 * No router.push(). No browser navigation. One page, everything inside.
 */

export type SystemPanelId =
  | 'settings'
  | 'connectors'
  | 'marketplace'
  | 'profile'
  | 'feed-settings'
  | 'settings/appearance'
  | 'settings/feed'
  | 'settings/algorithm'
  | 'settings/widgets'
  | 'settings/controls'
  | 'settings/privacy'
  | 'settings/data'
  | 'settings/help'
  | 'settings/safety';

export interface PanelMeta {
  id: SystemPanelId;
  label: string;
}

export const PANEL_META: Record<SystemPanelId, PanelMeta> = {
  'settings':             { id: 'settings',             label: 'Settings' },
  'connectors':           { id: 'connectors',           label: 'Connectors' },
  'marketplace':          { id: 'marketplace',          label: 'DreamMarketplace' },
  'profile':              { id: 'profile',              label: 'Edit ProfileDream' },
  'feed-settings':        { id: 'feed-settings',        label: 'Feed Settings' },
  'settings/appearance':  { id: 'settings/appearance',  label: 'Theme & Appearance' },
  'settings/feed':        { id: 'settings/feed',        label: 'Feed' },
  'settings/algorithm':   { id: 'settings/algorithm',   label: 'My Algorithm' },
  'settings/widgets':     { id: 'settings/widgets',     label: 'Widgets' },
  'settings/controls':    { id: 'settings/controls',    label: 'Controls' },
  'settings/privacy':     { id: 'settings/privacy',     label: 'Privacy' },
  'settings/data':        { id: 'settings/data',        label: 'Data' },
  'settings/help':        { id: 'settings/help',        label: 'Help & Onboarding' },
  'settings/safety':      { id: 'settings/safety',      label: 'Policy & Safety' },
};
