export type DeviceMode = 'desktop' | 'mobile' | 'desktop_on_mobile';

export type ToolContext = {
  userId: string;
  mode: DeviceMode;
  route: string;
  projectId?: string;
  notebookId?: string;
  attachmentId?: string;
  featureFlags?: Record<string, boolean>;
};

export type ToolRequest = {
  action: string;
  input: Record<string, unknown>;
  context: ToolContext;
};

export type ToolResult = {
  ok: boolean;
  action: string;
  data?: unknown;
  error?: {
    code: string;
    message: string;
    details?: unknown;
    retryable?: boolean;
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Action name literals (matches capabilities.yaml)
// ─────────────────────────────────────────────────────────────────────────────

export type SetupAction = 'setup.check';

export type NavAction =
  | 'nav.open_settings_feed'
  | 'nav.open_settings_appearance'
  | 'nav.open_settings_widgets'
  | 'nav.open_connectors'
  | 'nav.open_profile'
  | 'nav.open_public_profile'
  | 'nav.open_marketplace'
  | 'nav.open_shop'
  | 'nav.open_discover'
  | 'nav.open_help'
  | 'nav.open_privacy'
  | 'nav.open_data'
  | 'nav.open_appeal';

export type SystemAction =
  | 'system.status'
  | 'system.bug_report';

export type OnboardingAction =
  | 'onboarding.guided_setup'
  | 'onboarding.replay_tips'
  | 'onboarding.explain_term'
  | 'onboarding.guide_add_slice'
  | 'onboarding.guide_add_widget'
  | 'onboarding.guide_edit_theme';

export type PrivacyAction =
  | 'privacy.explain_visibility'
  | 'privacy.publish_preview'
  | 'privacy.explain_data'
  | 'privacy.delete_data'
  | 'privacy.delete_account'
  | 'privacy.export_data';

export type PolicyAction =
  | 'policy.explain_enforcement'
  | 'policy.suggest_fix';

export type CurationAction =
  | 'curation.recommend_highlights'
  | 'curation.refresh_stale_slice'
  | 'curation.cleanup_hidden_widgets';

export type DrEamsActionName =
  | SetupAction
  | NavAction
  | SystemAction
  | OnboardingAction
  | PrivacyAction
  | PolicyAction
  | CurationAction;

// ─────────────────────────────────────────────────────────────────────────────
// Typed input shapes per action
// ─────────────────────────────────────────────────────────────────────────────

export type SetupCheckInput = { scope?: 'app' | 'supabase' | 'vercel' };
export type NavOpenPublicProfileInput = { handle: string };
export type OnboardingGuidedSetupInput = { focus?: 'music' | 'creator' | 'social' | 'all' };
export type OnboardingExplainTermInput = {
  term: 'dream' | 'daydream' | 'widget' | 'slice' | 'connector' | 'profile' | 'public_profile';
};
export type PrivacyDeleteInput = { confirm_phrase: string };
export type PolicyExplainInput = { enforcement_type: 'warning' | 'throttle' | 'temporary_ban' | 'permanent_ban' };
export type PolicySuggestFixInput = { violation_type: string };
export type CurationRefreshSliceInput = { slice_id: string };
export type SystemBugReportInput = { description: string; reproduction_steps?: string };

// ─────────────────────────────────────────────────────────────────────────────
// Main interface
// ─────────────────────────────────────────────────────────────────────────────

export interface DrEamsTools {
  run(req: ToolRequest): Promise<ToolResult>;
}

