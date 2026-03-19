/**
 * lib/feature-build/featureManifest.ts
 *
 * Source-of-truth for the feature build manifest across all 6 Daydream+Engin pairs.
 *
 * Each pair has:
 *   - A list of market-leading features to integrate (status: implemented | active | planned)
 *   - A max feature count (maxFeatures) — phase switches from BUILD → UPGRADE → REFINE
 *   - A refineThreshold (0–1) — fraction of usable (implemented + active) features required
 *     to enter UPGRADE phase. Removes the perfection gate; SICC work begins at threshold.
 *   - UI quality refinements to pursue in UPGRADE and REFINE phases (SICC criteria)
 *
 * Phase rules:
 *   BUILD   — building core capabilities; usable fraction below refineThreshold.
 *   UPGRADE — enough is live for users to act on; concurrent build + SICC refinement.
 *             "UPGRADE! REFINE! we don't stop, we continue forward."
 *   REFINE  — all maxFeatures fully implemented; pure SICC polish.
 *
 * Architecture: docs/ARCHITECTURE.md §1 (Daydream pair system).
 * Naming: lib/identity/canonical-names.ts (DaydreamDomain, EnginSurface).
 */

import type { DaydreamDomain, EnginSurface } from '@/lib/identity/canonical-names';

// ─── Feature status ───────────────────────────────────────────────────────────

/**
 * implemented — fully built, tested, stable.
 * active      — built, user-facing, and user-adjustable right now; not yet perfect.
 *               "Things simplify in a way that allow the user to adjust when necessary."
 * planned     — not yet built.
 */
export type FeatureStatus = 'implemented' | 'active' | 'planned';

export interface FeatureEntry {
  /** Stable identifier — used by CI grep scan */
  id: string;
  /** Human-readable label */
  label: string;
  /** Brief description for job summaries */
  description: string;
  /** Current implementation status */
  status: FeatureStatus;
  /**
   * grep pattern used by the build-cycle workflow to verify implementation.
   * Empty string = skip code scan (manual milestone only).
   */
  detectPattern: string;
  /** Relative repo paths to search for detectPattern (empty = whole repo) */
  detectPaths: string[];
}

// ─── Pair manifest ────────────────────────────────────────────────────────────

export interface DaydreamEnginManifest {
  domain: DaydreamDomain;
  engin: EnginSurface;
  /** CSS hex accent colour for this pair */
  accentColor: string;
  features: FeatureEntry[];
  /**
   * Target feature count before switching to REFINE phase.
   * Must equal features.length.
   */
  maxFeatures: number;
  /**
   * Fraction of maxFeatures (0–1) that must be usable (implemented + active)
   * before the pair enters UPGRADE phase. Default: 0.6
   * Removes the 100% perfection gate — SICC refinement work starts at threshold.
   */
  refineThreshold: number;
  /** UI refinements to pursue in UPGRADE and REFINE phases */
  uiRefinements: string[];
}

// ─── Music / StarMakerEngin ───────────────────────────────────────────────────

const MUSIC_MANIFEST: DaydreamEnginManifest = {
  domain: 'Music',
  engin: 'StarMakerEngin',
  accentColor: '#a855f7',
  maxFeatures: 13,
  refineThreshold: 0.6,
  features: [
    { id: 'beat-maker',          label: 'Beat Maker',           description: '8-step × 4-channel visual sequencer',         status: 'implemented', detectPattern: 'BeatCell',              detectPaths: ['components/daydream/StarMakerEngin.tsx'] },
    { id: 'mixing-board',        label: 'Mixing Board',         description: '4-channel volume fader strips',               status: 'implemented', detectPattern: 'MixerStrip',            detectPaths: ['components/daydream/StarMakerEngin.tsx'] },
    { id: 'sound-effects',       label: 'Sound Effects',        description: 'Toggle-able effect palette',                  status: 'implemented', detectPattern: 'sfxPalette',            detectPaths: ['components/daydream/StarMakerEngin.tsx'] },
    { id: 'bpm-key',             label: 'BPM & Key Selector',   description: 'BPM + musical key + major/minor toggle',      status: 'implemented', detectPattern: 'setBpm',                detectPaths: ['components/daydream/StarMakerEngin.tsx'] },
    { id: 'pitch-control',       label: 'Pitch Control',        description: 'Semitone shift slider −12 → +12',             status: 'implemented', detectPattern: 'setPitch',              detectPaths: ['components/daydream/StarMakerEngin.tsx'] },
    { id: 'stem-export',         label: 'Stem Export',          description: 'Per-stem checklist + bridge emit on prepare', status: 'implemented', detectPattern: 'music:stem-ready',      detectPaths: ['components/daydream/StarMakerEngin.tsx'] },
    { id: 'your-releases',       label: 'Your Releases',        description: 'Real Supabase read of owned releases',        status: 'implemented', detectPattern: 'MusicRelease',          detectPaths: ['components/daydream/StarMakerEngin.tsx'] },
    { id: 'publish-controls',    label: 'Publishing Controls',  description: 'Supabase write — visibility toggle',          status: 'implemented', detectPattern: "visibility.*public",    detectPaths: ['components/daydream/StarMakerEngin.tsx'] },
    { id: 'waveform-viz',        label: 'Waveform Visualizer',  description: 'Real-time waveform display for recordings',   status: 'active',      detectPattern: 'WaveformVisualizer',    detectPaths: ['components/daydream/StarMakerEngin.tsx'] },
    { id: 'chord-builder',       label: 'Chord Builder',        description: 'Interactive chord progression builder',       status: 'active',      detectPattern: 'ChordBuilder',          detectPaths: ['components/daydream/StarMakerEngin.tsx'] },
    { id: 'ai-melody',           label: 'AI Melody Suggestions', description: 'Dr. Eams-powered melody recommendation',   status: 'planned',     detectPattern: 'ai.*melody',            detectPaths: ['components/daydream/StarMakerEngin.tsx'] },
    { id: 'collab-studio',       label: 'Collaboration Studio', description: 'Real-time multi-user session with presence',  status: 'planned',     detectPattern: 'CollabStudio',          detectPaths: ['components/daydream/StarMakerEngin.tsx'] },
    { id: 'playlist-manager',    label: 'Playlist Manager',     description: 'Drag-and-drop playlist ordering + save',     status: 'planned',     detectPattern: 'PlaylistManager',       detectPaths: ['components/daydream/StarMakerEngin.tsx'] },
  ],
  uiRefinements: [
    'Consistent purple accent tokens across all controls',
    'Smooth fader animation (spring physics)',
    'Beat cell press feedback (scale + glow)',
    'Accessible: ARIA labels on all interactive controls',
    'Dark/light mode token parity',
  ],
};

// ─── Games / GameEngin ────────────────────────────────────────────────────────

const GAMES_MANIFEST: DaydreamEnginManifest = {
  domain: 'Games',
  engin: 'GameEngin',
  accentColor: '#22c55e',
  maxFeatures: 14,
  refineThreshold: 0.6,
  features: [
    { id: 'personal-scores',     label: 'Personal Best Scores',  description: 'Live scores from game_scores table',          status: 'implemented', detectPattern: 'GameScore',             detectPaths: ['components/daydream/GameEngin.tsx'] },
    { id: 'leaderboard',         label: 'Leaderboard Publish',   description: 'One-tap share score to leaderboard',          status: 'implemented', detectPattern: 'shared.*boolean',       detectPaths: ['components/daydream/GameEngin.tsx'] },
    { id: 'play-now',            label: 'Play Now Entry Points', description: 'Entry points for all live games',             status: 'implemented', detectPattern: 'Play Now',              detectPaths: ['components/daydream/GameEngin.tsx'] },
    { id: 'game-remote',         label: 'GameRemote Controller', description: 'In-surface controller shortcut',             status: 'implemented', detectPattern: 'GameRemote',            detectPaths: ['components/daydream/GameEngin.tsx'] },
    { id: 'world-builder',       label: 'World Builder',         description: '5×5 tile-grid editor with save',             status: 'implemented', detectPattern: 'WorldState',            detectPaths: ['components/daydream/GameEngin.tsx'] },
    { id: 'achievements',        label: 'Achievement System',    description: '8 achievements with score-driven unlock',    status: 'implemented', detectPattern: 'AchievementDef',        detectPaths: ['components/daydream/GameEngin.tsx'] },
    { id: 'physics-config',      label: 'Physics Config',        description: 'Gravity preset + friction slider',           status: 'implemented', detectPattern: 'GravityPreset',         detectPaths: ['components/daydream/GameEngin.tsx'] },
    { id: 'game-scripts',        label: 'Game Scripts',          description: 'Script editor + bridge emit on save',        status: 'implemented', detectPattern: 'ScriptLanguage',        detectPaths: ['components/daydream/GameEngin.tsx'] },
    { id: 'cross-engin-sync',    label: 'Cross-Engin Sync',      description: 'Live status indicators for sibling Engins',  status: 'implemented', detectPattern: 'Cross-Engin Sync',      detectPaths: ['components/daydream/GameEngin.tsx'] },
    { id: 'multiplayer-lobby',   label: 'Multiplayer Lobby',     description: 'Room-based matchmaking + invite system',     status: 'active',      detectPattern: 'MultiplayerLobby',      detectPaths: ['components/daydream/GameEngin.tsx'] },
    { id: 'tournament-mode',     label: 'Tournament Mode',       description: 'Bracket system with prize track',            status: 'planned',     detectPattern: 'TournamentMode',        detectPaths: ['components/daydream/GameEngin.tsx'] },
    { id: 'game-analytics',      label: 'Game Analytics',        description: 'Heatmaps, session length, funnel',           status: 'planned',     detectPattern: 'GameAnalytics',         detectPaths: ['components/daydream/GameEngin.tsx'] },
    { id: 'replay-system',       label: 'Replay System',         description: 'Record and replay game sessions',            status: 'planned',     detectPattern: 'ReplaySystem',          detectPaths: ['components/daydream/GameEngin.tsx'] },
    { id: 'social-challenges',   label: 'Social Challenges',     description: 'Friend-to-friend challenge cards',           status: 'active',      detectPattern: 'SocialChallenge',       detectPaths: ['components/daydream/GameEngin.tsx'] },
  ],
  uiRefinements: [
    'Consistent green accent tokens across all game surfaces',
    'Controller button press animation (scale feedback)',
    'Achievement unlock animation (slide-in badge)',
    'Score counter smooth increment animation',
    'Accessible: ARIA roles for game grid cells',
  ],
};

// ─── Lab / LabEngin ───────────────────────────────────────────────────────────

const LAB_MANIFEST: DaydreamEnginManifest = {
  domain: 'Lab',
  engin: 'LabEngin',
  accentColor: '#06b6d4',
  maxFeatures: 11,
  refineThreshold: 0.6,
  features: [
    { id: 'active-experiments',  label: 'Active Experiments',   description: 'Live list from physics_experiments table',    status: 'implemented', detectPattern: 'Experiment',            detectPaths: ['components/daydream/LabEngin.tsx'] },
    { id: 'new-experiment',      label: 'New Experiment',       description: 'Direct entry point to start an experiment',  status: 'implemented', detectPattern: 'new.*experiment',       detectPaths: ['components/daydream/LabEngin.tsx'] },
    { id: 'simulation-runner',   label: 'Simulation Runner',    description: '4 simulation types with mock result display', status: 'implemented', detectPattern: 'SimType',               detectPaths: ['components/daydream/LabEngin.tsx'] },
    { id: 'data-visualization',  label: 'Data Visualization',   description: 'Chart type selector + ASCII preview',        status: 'implemented', detectPattern: 'ChartType',             detectPaths: ['components/daydream/LabEngin.tsx'] },
    { id: 'cross-engin-sync',    label: 'Cross-Engin Sync',     description: 'Live status for Code, Game, Music channels', status: 'implemented', detectPattern: 'Code2.*Gamepad2.*Music', detectPaths: ['components/daydream/LabEngin.tsx'] },
    { id: 'quantum-circuit',     label: 'Quantum Circuit Canvas', description: 'Visual qubit circuit builder',            status: 'implemented', detectPattern: 'QuantumCircuitCanvas',  detectPaths: ['components/daydream'] },
    { id: 'collab-lab',          label: 'Collaborative Lab',      description: 'Real-time shared experiment workspace',   status: 'planned',     detectPattern: 'CollabLab',             detectPaths: ['components/daydream/LabEngin.tsx'] },
    { id: 'ai-hypothesis',       label: 'AI Hypothesis Generator', description: 'Dr. Eams hypothesis suggestion engine',  status: 'planned',     detectPattern: 'ai.*hypothesis',        detectPaths: ['components/daydream/LabEngin.tsx'] },
    { id: 'molecule-viewer',     label: '3D Molecule Viewer',   description: 'WebGPU-accelerated molecular display',       status: 'planned',     detectPattern: 'MoleculeViewer',        detectPaths: ['components/daydream/LabEngin.tsx'] },
    { id: 'dataset-browser',     label: 'Dataset Browser',      description: 'Browse and import public science datasets',  status: 'planned',     detectPattern: 'DatasetBrowser',        detectPaths: ['components/daydream/LabEngin.tsx'] },
    { id: 'published-results',   label: 'Published Results',    description: 'Share experiment results to profile',        status: 'active',      detectPattern: 'PublishedResults',      detectPaths: ['components/daydream/LabEngin.tsx'] },
  ],
  uiRefinements: [
    'Consistent cyan accent tokens across all Lab surfaces',
    'Simulation progress bar with pulse animation',
    'Chart render fade-in on data load',
    'Accessible: ARIA live regions for simulation status',
    'Metric cards consistent border-radius and shadow depth',
  ],
};

// ─── Code / CodeEngin ────────────────────────────────────────────────────────

const CODE_MANIFEST: DaydreamEnginManifest = {
  domain: 'Code',
  engin: 'CodeEngin',
  accentColor: '#3b82f6',
  maxFeatures: 12,
  refineThreshold: 0.6,
  features: [
    { id: 'live-notebook',       label: 'Live Notebook',        description: 'Python-rival per-cell execution notebook',   status: 'implemented', detectPattern: 'CellLanguage',          detectPaths: ['components/daydream/CodeEngin.tsx'] },
    { id: 'ci-dashboard',        label: 'CI Dashboard',         description: 'Five-stage pipeline simulation display',     status: 'implemented', detectPattern: 'CI.*Dashboard',         detectPaths: ['components/daydream/CodeEngin.tsx'] },
    { id: 'project-manager',     label: 'Project Manager',      description: 'Supabase list + quick-create form',          status: 'implemented', detectPattern: 'FolderOpen',            detectPaths: ['components/daydream/CodeEngin.tsx'] },
    { id: 'dual-runtime-conns',  label: 'Dual-Runtime Connections', description: 'Cross-Engin connectivity badges',        status: 'implemented', detectPattern: 'Gamepad2.*Music2.*FlaskConical', detectPaths: ['components/daydream/CodeEngin.tsx'] },
    { id: 'github-entry',        label: 'GitHub Entry Point',       description: 'Link to GitHub profile and repos',       status: 'implemented', detectPattern: 'Github',                detectPaths: ['components/daydream/CodeEngin.tsx'] },
    { id: 'diff-viewer',         label: 'Diff Viewer',              description: 'Full-file diff with hunk navigation and scroll-margin minimap', status: 'implemented', detectPattern: 'DiffViewer', detectPaths: ['components/daydream/CodeEngin.tsx'] },
    { id: 'ai-trust-layer',      label: 'AI Trust Layer',           description: 'Scope-picker → preview → apply/reject flow for safe AI-assisted edits on mobile', status: 'implemented', detectPattern: 'ShieldCheck', detectPaths: ['components/daydream/CodeEngin.tsx'] },
    { id: 'ai-code-assist',      label: 'AI Code Assist',           description: 'Dr. Eams in-line code suggestion',       status: 'active',      detectPattern: 'AiCodeAssist',          detectPaths: ['components/daydream/CodeEngin.tsx'] },
    { id: 'live-pair-programming', label: 'Live Pair Programming',  description: 'Real-time shared cursor code session',   status: 'planned',     detectPattern: 'PairProgramming',       detectPaths: ['components/daydream/CodeEngin.tsx'] },
    { id: 'deployment-console',  label: 'Deployment Console',       description: 'One-click deploy to Vercel/Supabase',    status: 'planned',     detectPattern: 'DeploymentConsole',     detectPaths: ['components/daydream/CodeEngin.tsx'] },
    { id: 'api-inspector',       label: 'API Inspector',            description: 'REST/GraphQL request builder + response viewer', status: 'planned', detectPattern: 'ApiInspector',        detectPaths: ['components/daydream/CodeEngin.tsx'] },
    { id: 'snippet-library',     label: 'Snippet Library',      description: 'Searchable personal code snippet vault',    status: 'planned',     detectPattern: 'SnippetLibrary',        detectPaths: ['components/daydream/CodeEngin.tsx'] },
  ],
  uiRefinements: [
    'Consistent blue accent tokens across all Code surfaces',
    'Syntax-highlighted cell output (mono font, token colors)',
    'CI pipeline stage transitions (smooth fill animation)',
    'Accessible: keyboard navigation for notebook cells',
    'Responsive layout — notebook collapses to single-column on mobile',
  ],
};

// ─── Brand / BrandingEngin ────────────────────────────────────────────────────

const BRAND_MANIFEST: DaydreamEnginManifest = {
  domain: 'Brand',
  engin: 'BrandingEngin',
  accentColor: '#ec4899',
  maxFeatures: 12,
  refineThreshold: 0.6,
  features: [
    { id: 'brand-kit',           label: 'Brand Kit',            description: 'Links to appearance and public profile',     status: 'implemented', detectPattern: 'Palette',               detectPaths: ['components/daydream/BrandingEngin.tsx'] },
    { id: 'analytics-entry',     label: 'Analytics Entry',      description: 'Link to algorithm/signal settings',         status: 'implemented', detectPattern: 'BarChart2',             detectPaths: ['components/daydream/BrandingEngin.tsx'] },
    { id: 'campaigns',           label: 'Campaigns',            description: 'DreamAds campaign create flow entry',       status: 'implemented', detectPattern: 'Megaphone',             detectPaths: ['components/daydream/BrandingEngin.tsx'] },
    { id: 'audience',            label: 'Audience Panel',       description: 'Follower count from follows table',         status: 'implemented', detectPattern: 'follower_count',        detectPaths: ['components/daydream/BrandingEngin.tsx'] },
    { id: 'brand-analytics',     label: 'Brand Analytics',      description: '4 metric cards with Refresh',               status: 'implemented', detectPattern: 'AnalyticMetric',        detectPaths: ['components/daydream/BrandingEngin.tsx'] },
    { id: 'ab-testing',          label: 'A/B Test Manager',     description: 'Create, pause, pick winner for A/B tests',  status: 'implemented', detectPattern: 'ABTest',                detectPaths: ['components/daydream/BrandingEngin.tsx'] },
    { id: 'roi-calculator',      label: 'Campaign ROI Calculator', description: 'Live CPM/CPC/ROI from inputs',           status: 'implemented', detectPattern: 'DollarSign',            detectPaths: ['components/daydream/BrandingEngin.tsx'] },
    { id: 'content-calendar-link', label: 'Content Calendar Link', description: 'Quick-jump to ContentEngin schedule',    status: 'active',      detectPattern: 'ContentCalendarLink',   detectPaths: ['components/daydream/BrandingEngin.tsx'] },
    { id: 'audience-segments',   label: 'Audience Segments',    description: 'Tag-based audience segmentation editor',    status: 'planned',     detectPattern: 'AudienceSegment',       detectPaths: ['components/daydream/BrandingEngin.tsx'] },
    { id: 'brand-voice-ai',      label: 'Brand Voice AI',       description: 'Dr. Eams on-brand copy suggestions',        status: 'planned',     detectPattern: 'BrandVoiceAi',          detectPaths: ['components/daydream/BrandingEngin.tsx'] },
    { id: 'competitor-watch',    label: 'Competitor Watch',     description: 'Monitor competitor profiles for signals',   status: 'planned',     detectPattern: 'CompetitorWatch',       detectPaths: ['components/daydream/BrandingEngin.tsx'] },
    { id: 'asset-library',       label: 'Asset Library',        description: 'Brand asset vault (logos, colors, fonts)',  status: 'planned',     detectPattern: 'AssetLibrary',          detectPaths: ['components/daydream/BrandingEngin.tsx'] },
  ],
  uiRefinements: [
    'Consistent pink accent tokens across all Brand surfaces',
    'Metric card trend arrows with animated count-up',
    'A/B test result bar chart with smooth transition',
    'Accessible: ARIA roles for metric cards',
    'Brand color picker with live preview',
  ],
};

// ─── Create / ContentEngin ────────────────────────────────────────────────────

const CREATE_MANIFEST: DaydreamEnginManifest = {
  domain: 'Create',
  engin: 'ContentEngin',
  accentColor: '#f59e0b',
  maxFeatures: 12,
  refineThreshold: 0.6,
  features: [
    { id: 'recent-drafts',       label: 'Recent Drafts',        description: 'Latest 5 rows from notes table',             status: 'implemented', detectPattern: 'Note',                  detectPaths: ['components/daydream/ContentEngin.tsx'] },
    { id: 'content-calendar',    label: 'Content Calendar',     description: '7-day scheduler with inline add forms',      status: 'implemented', detectPattern: 'CalendarItem',          detectPaths: ['components/daydream/ContentEngin.tsx'] },
    { id: 'publishing-queue',    label: 'Publishing Queue',     description: 'Manage and publish via POST /api/posts',     status: 'implemented', detectPattern: 'publishItem',           detectPaths: ['components/daydream/ContentEngin.tsx'] },
    { id: 'draft-generator',     label: 'Smart Draft Generator','description':'Template-based draft text + save',          status: 'implemented', detectPattern: 'DraftType',             detectPaths: ['components/daydream/ContentEngin.tsx'] },
    { id: 'cross-platform',      label: 'Cross-Platform Targets','description':'Toggle + bridge broadcast per platform',   status: 'implemented', detectPattern: 'PLATFORMS',             detectPaths: ['components/daydream/ContentEngin.tsx'] },
    { id: 'media-vault-link',    label: 'Media Vault Link',     description: 'Quick-jump to /daydream/media-vault',        status: 'active',      detectPattern: 'media-vault',           detectPaths: ['components/daydream/ContentEngin.tsx'] },
    { id: 'ai-caption',          label: 'AI Caption Writer',    description: 'Dr. Eams one-click caption generation',      status: 'planned',     detectPattern: 'AiCaption',             detectPaths: ['components/daydream/ContentEngin.tsx'] },
    { id: 'collab-drafts',       label: 'Collaborative Drafts', description: 'Real-time co-authoring with presence',       status: 'planned',     detectPattern: 'CollabDraft',           detectPaths: ['components/daydream/ContentEngin.tsx'] },
    { id: 'content-analytics',   label: 'Content Analytics',    description: 'Per-post reach, clicks, engagement metrics', status: 'planned',     detectPattern: 'ContentAnalytics',      detectPaths: ['components/daydream/ContentEngin.tsx'] },
    { id: 'template-gallery',    label: 'Template Gallery',     description: 'Browse and apply community-shared templates',status: 'planned',     detectPattern: 'TemplateGallery',       detectPaths: ['components/daydream/ContentEngin.tsx'] },
    { id: 'short-video-editor',  label: 'Short Video Editor',   description: 'Trim, caption, and publish short-form video',status: 'planned',     detectPattern: 'ShortVideoEditor',      detectPaths: ['components/daydream/ContentEngin.tsx'] },
    { id: 'hashtag-optimizer',   label: 'Hashtag Optimizer',    description: 'AI-ranked hashtag suggestions per post',     status: 'planned',     detectPattern: 'HashtagOptimizer',      detectPaths: ['components/daydream/ContentEngin.tsx'] },
  ],
  uiRefinements: [
    'Consistent amber accent tokens across all Create surfaces',
    'Calendar day cell hover + active pulse',
    'Draft card appear animation (fade-up on load)',
    'Accessible: ARIA labels for platform toggles',
    'Empty-state illustration for no-draft scenario',
  ],
};

// ─── Manifest registry ────────────────────────────────────────────────────────

/** All 6 Daydream+Engin pair manifests in canonical domain order. */
export const FEATURE_MANIFESTS: readonly DaydreamEnginManifest[] = [
  MUSIC_MANIFEST,
  GAMES_MANIFEST,
  LAB_MANIFEST,
  CODE_MANIFEST,
  BRAND_MANIFEST,
  CREATE_MANIFEST,
] as const;

/** Look up the manifest for a specific domain. */
export function getManifest(domain: DaydreamDomain): DaydreamEnginManifest {
  const manifest = FEATURE_MANIFESTS.find((m) => m.domain === domain);
  if (!manifest) {
    throw new Error(`No feature manifest found for domain: ${domain}`);
  }
  return manifest;
}
