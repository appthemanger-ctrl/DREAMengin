/**
 * Component Inventory
 *
 * Full typed inventory of 120+ atomic pieces across 11 categories.
 * Used by Engin Forge and ForgeDreamCanvas for the piece palette.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type ComponentCategory =
  | 'Audio & Music'
  | 'Games & Play'
  | 'Visuals & 3D'
  | 'Coding & Automation'
  | 'Social & Sharing'
  | 'Data & Analytics'
  | 'Publishing & Commerce'
  | 'AI & Intelligence'
  | 'Input & Controls'
  | 'Storage & Syncing'
  | 'Science & Simulation';

export interface AtomicComponent {
  id: string;
  name: string;
  description: string;
  category: ComponentCategory;
}

// ─── Inventory ───────────────────────────────────────────────────────────────

export const COMPONENT_INVENTORY: AtomicComponent[] = [
  // ── Audio & Music (23) ────────────────────────────────────────────────────
  { id: 'am-01', name: 'AudioBuffer Loader',       category: 'Audio & Music', description: 'Loads and decodes audio files into an AudioBuffer.' },
  { id: 'am-02', name: 'FFT Analyser',             category: 'Audio & Music', description: 'Computes real-time frequency spectrum via AnalyserNode.' },
  { id: 'am-03', name: 'Peak Map Builder',         category: 'Audio & Music', description: 'Extracts constellation peak maps from AudioBuffers.' },
  { id: 'am-04', name: 'Fingerprint Recorder',     category: 'Audio & Music', description: 'Records reference fingerprints from time windows.' },
  { id: 'am-05', name: 'Fingerprint Matcher',      category: 'Audio & Music', description: 'Matches fingerprints against live audio peak maps.' },
  { id: 'am-06', name: 'Stem Extractor',           category: 'Audio & Music', description: 'Stitches matched slices into isolated stem AudioBuffers.' },
  { id: 'am-07', name: 'BiquadFilter Node',        category: 'Audio & Music', description: 'Applies bandpass/lowpass/highpass filter to audio stream.' },
  { id: 'am-08', name: 'Reverb Convolver',         category: 'Audio & Music', description: 'Convolution reverb using impulse response buffers.' },
  { id: 'am-09', name: 'Pitch Shifter',            category: 'Audio & Music', description: 'Real-time pitch shifting using phase vocoder.' },
  { id: 'am-10', name: 'Beat Detector',            category: 'Audio & Music', description: 'Onset detection and BPM estimation from audio.' },
  { id: 'am-11', name: 'Loop Player',              category: 'Audio & Music', description: 'Seamless looping AudioBufferSourceNode with offset control.' },
  { id: 'am-12', name: 'Gain Node',                category: 'Audio & Music', description: 'Volume control node with smooth ramping.' },
  { id: 'am-13', name: 'Compressor Node',          category: 'Audio & Music', description: 'Dynamic range compression for audio streams.' },
  { id: 'am-14', name: 'Stereo Panner',            category: 'Audio & Music', description: 'Pan audio left/right in stereo field.' },
  { id: 'am-15', name: 'MIDI Input Handler',       category: 'Audio & Music', description: 'Receives MIDI note/CC events via Web MIDI API.' },
  { id: 'am-16', name: 'Step Sequencer',           category: 'Audio & Music', description: '16-step grid sequencer for beat programming.' },
  { id: 'am-17', name: 'Sample Pad',               category: 'Audio & Music', description: 'Touch/click pad for triggering audio samples.' },
  { id: 'am-18', name: 'Audio Recorder',           category: 'Audio & Music', description: 'MediaRecorder-based audio capture with waveform preview.' },
  { id: 'am-19', name: 'Waveform Renderer',        category: 'Audio & Music', description: 'Canvas-based waveform visualiser from AudioBuffer.' },
  { id: 'am-20', name: 'Spectral Gate',            category: 'Audio & Music', description: 'Suppresses frequencies below slog-threshold.' },
  { id: 'am-21', name: 'Arpeggiator',              category: 'Audio & Music', description: 'MIDI-based arpeggio pattern generator.' },
  { id: 'am-22', name: 'Chord Detector',           category: 'Audio & Music', description: 'Identifies chord root and quality from pitch classes.' },
  { id: 'am-23', name: 'Audio Stem Bus',           category: 'Audio & Music', description: 'Routes multiple stems to master output with per-stem gain.' },

  // ── Games & Play (22) ──────────────────────────────────────────────────────
  { id: 'gp-01', name: 'Game Manifest Loader',     category: 'Games & Play', description: 'Loads .dreamgame ZIP: WASM + assets + manifest.json.' },
  { id: 'gp-02', name: 'WASM Module Loader',       category: 'Games & Play', description: 'Instantiates WebAssembly modules with memory management.' },
  { id: 'gp-03', name: 'WebGPU Renderer',          category: 'Games & Play', description: 'Initialises WebGPU adapter + pipeline for game rendering.' },
  { id: 'gp-04', name: 'Input Router',             category: 'Games & Play', description: 'Multiplexes touch/mouse/keyboard/gamepad to game handlers.' },
  { id: 'gp-05', name: 'DualSense Handler',        category: 'Games & Play', description: 'PS5 DualSense haptics + adaptive trigger via Gamepad API.' },
  { id: 'gp-06', name: 'Collision Engine',         category: 'Games & Play', description: 'AABB + circle collision detection and response.' },
  { id: 'gp-07', name: 'Physics Integrator',       category: 'Games & Play', description: 'Euler/Verlet integration for rigid body simulation.' },
  { id: 'gp-08', name: 'Sprite Sheet Renderer',    category: 'Games & Play', description: 'Animates sprites from atlas frames at target FPS.' },
  { id: 'gp-09', name: 'Tile Map Engine',          category: 'Games & Play', description: 'Renders and scrolls tilemaps with camera tracking.' },
  { id: 'gp-10', name: 'AI Director',              category: 'Games & Play', description: 'Adaptive difficulty manager using player performance metrics.' },
  { id: 'gp-11', name: 'Save State Manager',       category: 'Games & Play', description: 'Serialises game state to IndexedDB or Supabase.' },
  { id: 'gp-12', name: 'Leaderboard Connector',    category: 'Games & Play', description: 'Posts scores and retrieves top-N rankings via Supabase.' },
  { id: 'gp-13', name: 'Entity Component System',  category: 'Games & Play', description: 'ECS framework for game objects with typed components.' },
  { id: 'gp-14', name: 'Particle System',          category: 'Games & Play', description: 'GPU-accelerated particle emitter with life/colour curves.' },
  { id: 'gp-15', name: 'Navigation Mesh',          category: 'Games & Play', description: 'Pathfinding over navmesh using A* algorithm.' },
  { id: 'gp-16', name: 'Camera Controller',        category: 'Games & Play', description: 'Follow, orbit, and cinematic camera modes.' },
  { id: 'gp-17', name: 'Sound Effect Trigger',     category: 'Games & Play', description: 'Fires one-shot audio samples on game events.' },
  { id: 'gp-18', name: 'Inventory System',         category: 'Games & Play', description: 'Item storage, equip, and use logic for RPG-style games.' },
  { id: 'gp-19', name: 'Dialogue Tree',            category: 'Games & Play', description: 'Branching NPC dialogue with condition evaluation.' },
  { id: 'gp-20', name: 'Procedural Generator',     category: 'Games & Play', description: 'Seeded dungeon / terrain / level procedural generation.' },
  { id: 'gp-21', name: 'Multiplayer Sync',         category: 'Games & Play', description: 'Client-side prediction + server reconciliation layer.' },
  { id: 'gp-22', name: 'Achievement Engine',       category: 'Games & Play', description: 'Tracks progress and unlocks achievements with notifications.' },

  // ── Visuals & 3D (12) ─────────────────────────────────────────────────────
  { id: 'v3-01', name: 'Babylon.js Scene',         category: 'Visuals & 3D', description: 'Base Babylon.js engine + scene + camera setup.' },
  { id: 'v3-02', name: 'GLTF Model Loader',        category: 'Visuals & 3D', description: 'Loads and displays GLTF/GLB 3D assets.' },
  { id: 'v3-03', name: 'Audio Visualizer 3D',      category: 'Visuals & 3D', description: 'FFT bars/spheres synced to Web Audio AnalyserNode.' },
  { id: 'v3-04', name: 'Shader Material',          category: 'Visuals & 3D', description: 'Custom WGSL/GLSL shader material for meshes.' },
  { id: 'v3-05', name: 'Post-FX Pipeline',         category: 'Visuals & 3D', description: 'Bloom, DOF, chromatic aberration post-processing.' },
  { id: 'v3-06', name: 'Physics Lab',              category: 'Visuals & 3D', description: 'Havok physics sandbox for rigid/soft body simulation.' },
  { id: 'v3-07', name: 'Sky Box Renderer',         category: 'Visuals & 3D', description: 'HDR environment map + procedural sky.' },
  { id: 'v3-08', name: 'Terrain Generator',        category: 'Visuals & 3D', description: 'Heightmap-based terrain with LOD streaming.' },
  { id: 'v3-09', name: 'Avatar Rigging',           category: 'Visuals & 3D', description: 'Skeleton + IK rig for character animation.' },
  { id: 'v3-10', name: 'VFX Emitter',              category: 'Visuals & 3D', description: 'Scripted visual effects: sparks, smoke, magic.' },
  { id: 'v3-11', name: 'CSS 3D Transform',         category: 'Visuals & 3D', description: 'Hardware-accelerated 3D transforms for UI elements.' },
  { id: 'v3-12', name: 'R3F Scene Bridge',         category: 'Visuals & 3D', description: 'React Three Fiber bridge for declarative 3D scenes.' },

  // ── Coding & Automation (16) ──────────────────────────────────────────────
  { id: 'ca-01', name: 'Code Editor',              category: 'Coding & Automation', description: 'Monaco-based in-app code editor with syntax highlighting.' },
  { id: 'ca-02', name: 'Script Runner',            category: 'Coding & Automation', description: 'Executes JavaScript in sandboxed VM context.' },
  { id: 'ca-03', name: 'Workflow Builder',         category: 'Coding & Automation', description: 'Visual node-graph for automation flows.' },
  { id: 'ca-04', name: 'API Connector',            category: 'Coding & Automation', description: 'Configurable REST/GraphQL request node.' },
  { id: 'ca-05', name: 'Cron Scheduler',           category: 'Coding & Automation', description: 'Time-based trigger with cron expression parser.' },
  { id: 'ca-06', name: 'Event Trigger',            category: 'Coding & Automation', description: 'Fires automations on platform events via event bus.' },
  { id: 'ca-07', name: 'Data Transform',           category: 'Coding & Automation', description: 'Jq-like JSON transform node with typed schema.' },
  { id: 'ca-08', name: 'Regex Filter',             category: 'Coding & Automation', description: 'Filters data streams by regular expression.' },
  { id: 'ca-09', name: 'TypeScript Linter',        category: 'Coding & Automation', description: 'In-browser TSC type-check with diagnostic overlay.' },
  { id: 'ca-10', name: 'Git Diff Viewer',          category: 'Coding & Automation', description: 'Side-by-side diff renderer for code changes.' },
  { id: 'ca-11', name: 'Package Resolver',         category: 'Coding & Automation', description: 'Resolves and bundles npm packages in-browser via esm.sh.' },
  { id: 'ca-12', name: 'Terminal Emulator',        category: 'Coding & Automation', description: 'xterm.js-based terminal for command execution.' },
  { id: 'ca-13', name: 'Log Stream Viewer',        category: 'Coding & Automation', description: 'Tails structured logs with filtering and search.' },
  { id: 'ca-14', name: 'Variable Store',           category: 'Coding & Automation', description: 'Typed key-value store scoped to a workflow run.' },
  { id: 'ca-15', name: 'Conditional Branch',       category: 'Coding & Automation', description: 'If/else routing node for workflow conditionals.' },
  { id: 'ca-16', name: 'Webhook Receiver',         category: 'Coding & Automation', description: 'Listens for inbound webhooks and routes to handlers.' },

  // ── Social & Sharing (12) ─────────────────────────────────────────────────
  { id: 'ss-01', name: 'Feed Card',                category: 'Social & Sharing', description: 'Rich content card with reactions, share, and view tally.' },
  { id: 'ss-02', name: 'Comment Thread',           category: 'Social & Sharing', description: 'Nested comment system with real-time updates.' },
  { id: 'ss-03', name: 'Reaction Bar',             category: 'Social & Sharing', description: 'Emoji reaction picker and aggregate counter.' },
  { id: 'ss-04', name: 'Share Sheet',              category: 'Social & Sharing', description: 'Native share + copy-link + QR code sheet.' },
  { id: 'ss-05', name: 'Profile Card',             category: 'Social & Sharing', description: 'User avatar, bio, stats, follow button.' },
  { id: 'ss-06', name: 'Follow Graph',             category: 'Social & Sharing', description: 'Follower/following relationship manager.' },
  { id: 'ss-07', name: 'Mention Autocomplete',     category: 'Social & Sharing', description: '@mention suggestion list from user search.' },
  { id: 'ss-08', name: 'DM Channel',               category: 'Social & Sharing', description: 'Direct message thread with read receipts.' },
  { id: 'ss-09', name: 'Notification Center',      category: 'Social & Sharing', description: 'Aggregated activity feed with unread badge.' },
  { id: 'ss-10', name: 'Live Presence',            category: 'Social & Sharing', description: 'Shows who is online in a shared space.' },
  { id: 'ss-11', name: 'Shared Dream Session',     category: 'Social & Sharing', description: 'Supabase Realtime broadcast for co-creation.' },
  { id: 'ss-12', name: 'Collab Cursor',            category: 'Social & Sharing', description: 'Shows remote cursor positions in shared canvas.' },

  // ── Data & Analytics (9) ──────────────────────────────────────────────────
  { id: 'da-01', name: 'Ledger Store',             category: 'Data & Analytics', description: 'Universal metadata store for audio, torridity, and samples.' },
  { id: 'da-02', name: 'Torridity Ranker',         category: 'Data & Analytics', description: 'MOND-based feed ranking with visibility throttle.' },
  { id: 'da-03', name: 'Chart Renderer',           category: 'Data & Analytics', description: 'Line/bar/scatter chart with responsive D3-style layout.' },
  { id: 'da-04', name: 'Heatmap Layer',            category: 'Data & Analytics', description: 'Overlay heatmap for engagement or spatial data.' },
  { id: 'da-05', name: 'Time Series Buffer',       category: 'Data & Analytics', description: 'Ring buffer for streaming time-series data.' },
  { id: 'da-06', name: 'slog Normaliser',          category: 'Data & Analytics', description: 'Applies slog transform to engagement metrics.' },
  { id: 'da-07', name: 'Bot Score Meter',          category: 'Data & Analytics', description: 'Displays physical Turing test score as a gauge.' },
  { id: 'da-08', name: 'Retention Funnel',         category: 'Data & Analytics', description: 'Visualises user flow drop-off across stages.' },
  { id: 'da-09', name: 'ι-Engine Dashboard',       category: 'Data & Analytics', description: 'Displays invention force scores for active passes.' },

  // ── Publishing & Commerce (8) ─────────────────────────────────────────────
  { id: 'pc-01', name: 'Post Composer',            category: 'Publishing & Commerce', description: 'Rich text + media post editor with preview.' },
  { id: 'pc-02', name: 'Asset Uploader',           category: 'Publishing & Commerce', description: 'Drag-drop file upload to Supabase Storage.' },
  { id: 'pc-03', name: 'Product Listing',          category: 'Publishing & Commerce', description: 'Digital product card with price and checkout CTA.' },
  { id: 'pc-04', name: 'Checkout Flow',            category: 'Publishing & Commerce', description: 'Stripe-ready payment collection flow.' },
  { id: 'pc-05', name: 'Paywall Gate',             category: 'Publishing & Commerce', description: 'Content unlock based on purchase or subscription.' },
  { id: 'pc-06', name: 'RSS Publisher',            category: 'Publishing & Commerce', description: 'Generates and serves RSS feed from content items.' },
  { id: 'pc-07', name: 'SEO Meta Injector',        category: 'Publishing & Commerce', description: 'Injects Open Graph + Twitter card meta tags.' },
  { id: 'pc-08', name: 'Versioned Release',        category: 'Publishing & Commerce', description: 'Tags, changelogs, and release notes manager.' },

  // ── AI & Intelligence (8) ─────────────────────────────────────────────────
  { id: 'ai-01', name: 'Dr. Eams Assistant',       category: 'AI & Intelligence', description: 'Voice + text AI assistant with platform context.' },
  { id: 'ai-02', name: 'IDARi Recommender',        category: 'AI & Intelligence', description: 'Personalised content ranking via TensorFlow.js.' },
  { id: 'ai-03', name: 'TheBoogieMan Moderator',   category: 'AI & Intelligence', description: 'Policy-aware content moderation agent.' },
  { id: 'ai-04', name: 'TF.js Classifier',         category: 'AI & Intelligence', description: 'In-browser image/audio classification via TF.js.' },
  { id: 'ai-05', name: 'Embeddings Engine',        category: 'AI & Intelligence', description: 'Generates semantic embeddings for search + clustering.' },
  { id: 'ai-06', name: 'Prompt Builder',           category: 'AI & Intelligence', description: 'Structured prompt template with variable injection.' },
  { id: 'ai-07', name: 'Sentiment Analyser',       category: 'AI & Intelligence', description: 'Real-time sentiment scoring on text inputs.' },
  { id: 'ai-08', name: 'Generation Law Evaluator', category: 'AI & Intelligence', description: 'Computes ι-force and routes to FLOW/SYNTHESIZE/MANIFEST.' },

  // ── Input & Controls (6) ──────────────────────────────────────────────────
  { id: 'ic-01', name: 'Swipe Gesture Handler',    category: 'Input & Controls', description: 'Touch swipe with slog-based physics deceleration.' },
  { id: 'ic-02', name: 'Tap-Hold-Move',            category: 'Input & Controls', description: '≥300ms hold → drag → edge-transfer between runtimes.' },
  { id: 'ic-03', name: 'Gamepad Mapper',           category: 'Input & Controls', description: 'Maps gamepad buttons/axes to configurable actions.' },
  { id: 'ic-04', name: 'Voice Command',            category: 'Input & Controls', description: 'Web Speech API keyword recognition.' },
  { id: 'ic-05', name: 'Spatial Pointer',          category: 'Input & Controls', description: 'XR/spatial pointer input for immersive runtimes.' },
  { id: 'ic-06', name: 'Keyboard Shortcut Bus',    category: 'Input & Controls', description: 'Global + scoped keyboard shortcut registry.' },

  // ── Storage & Syncing (4) ─────────────────────────────────────────────────
  { id: 'sto-01', name: 'Supabase DB Connector',  category: 'Storage & Syncing', description: 'CRUD operations against Supabase Postgres tables.' },
  { id: 'sto-02', name: 'IndexedDB Cache',         category: 'Storage & Syncing', description: 'Local-first offline cache with sync queue.' },
  { id: 'sto-03', name: 'Realtime Subscriptions',  category: 'Storage & Syncing', description: 'Supabase Realtime row-level change subscriptions.' },
  { id: 'sto-04', name: 'Storage Uploader',        category: 'Storage & Syncing', description: 'Chunked multipart upload to Supabase Storage.' },

  // ── Science & Simulation (6) ──────────────────────────────────────────────
  { id: 'sci-01', name: 'MOND Gravity Sim',        category: 'Science & Simulation', description: 'Interactive MOND galaxy-rotation curve simulator.' },
  { id: 'sci-02', name: 'Torridity Field Map',     category: 'Science & Simulation', description: 'Visualises torridity rank as a gravity field.' },
  { id: 'sci-03', name: 'Fluid Dynamics',          category: 'Science & Simulation', description: 'Navier-Stokes fluid sim on WebGPU compute shaders.' },
  { id: 'sci-04', name: 'Cellular Automata',       category: 'Science & Simulation', description: 'Conway / custom rule cellular automata grid.' },
  { id: 'sci-05', name: 'Orbital Mechanics',       category: 'Science & Simulation', description: 'N-body gravitational simulation with slog scaling.' },
  { id: 'sci-06', name: 'Signal Processor',        category: 'Science & Simulation', description: 'DSP pipeline: filter, FFT, convolution, envelope.' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * getByCategory(category)
 *
 * Returns all components in a given category.
 */
export function getByCategory(category: ComponentCategory): AtomicComponent[] {
  return COMPONENT_INVENTORY.filter((c) => c.category === category);
}

/**
 * searchComponents(query)
 *
 * Case-insensitive search across id, name, and description.
 */
export function searchComponents(query: string): AtomicComponent[] {
  const q = query.toLowerCase();
  return COMPONENT_INVENTORY.filter(
    (c) =>
      c.id.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
  );
}

/** All unique categories in the inventory. */
export const ALL_CATEGORIES: ComponentCategory[] = [
  'Audio & Music',
  'Games & Play',
  'Visuals & 3D',
  'Coding & Automation',
  'Social & Sharing',
  'Data & Analytics',
  'Publishing & Commerce',
  'AI & Intelligence',
  'Input & Controls',
  'Storage & Syncing',
  'Science & Simulation',
];
