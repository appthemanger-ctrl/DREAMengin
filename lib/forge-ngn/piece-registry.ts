/**
 * NGN Engin — Piece Registry
 *
 * 120+ atomic pieces for the visual engine builder (Engin Forge / NGN Engin).
 * Each piece has a PieceManifest describing its category, ports, and metadata.
 *
 * Feature 41.
 */

export type PieceCategory =
  | 'Audio'
  | 'Visual'
  | 'AI'
  | 'Game'
  | 'Social'
  | 'Utility'
  | 'Runtime';

export type PortType = 'audio' | 'video' | 'data' | 'event' | 'trigger';

export interface Port {
  id: string;
  label: string;
  type: PortType;
}

export interface PieceManifest {
  /** Unique stable identifier */
  id: string;
  /** Display label */
  label: string;
  category: PieceCategory;
  description: string;
  /** Input ports */
  inputPorts: Port[];
  /** Output ports */
  outputPorts: Port[];
  /** 'source' | 'processor' | 'output' — for min-3 validation */
  role: 'source' | 'processor' | 'output';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function p(id: string, label: string, type: PortType): Port {
  return { id, label, type };
}

function piece(
  id: string,
  label: string,
  category: PieceCategory,
  description: string,
  role: PieceManifest['role'],
  inputPorts: Port[],
  outputPorts: Port[],
): PieceManifest {
  return { id, label, category, description, role, inputPorts, outputPorts };
}

// ── Audio Pieces ──────────────────────────────────────────────────────────────

const AUDIO_PIECES: PieceManifest[] = [
  piece('audio.mic-input', 'Mic Input', 'Audio', 'Live microphone capture', 'source',
    [], [p('out', 'Audio', 'audio')]),
  piece('audio.file-loader', 'Audio File Loader', 'Audio', 'Load audio from file', 'source',
    [], [p('out', 'Audio', 'audio'), p('meta', 'Metadata', 'data')]),
  piece('audio.waveform-zoom', 'Waveform Zoom', 'Audio', 'Zoomable waveform visualizer', 'processor',
    [p('in', 'Audio', 'audio')], [p('out', 'Audio', 'audio'), p('view', 'View', 'video')]),
  piece('audio.beat-grid', 'Beat Grid', 'Audio', 'Detect and display beat grid', 'processor',
    [p('in', 'Audio', 'audio')], [p('beats', 'Beats', 'data'), p('view', 'View', 'video')]),
  piece('audio.pitch-shifter', 'Pitch Shifter', 'Audio', 'Shift pitch up/down', 'processor',
    [p('in', 'Audio', 'audio'), p('semitones', 'Semitones', 'data')], [p('out', 'Audio', 'audio')]),
  piece('audio.time-stretch', 'Time Stretch', 'Audio', 'Stretch/compress duration', 'processor',
    [p('in', 'Audio', 'audio'), p('rate', 'Rate', 'data')], [p('out', 'Audio', 'audio')]),
  piece('audio.eq', 'Equalizer', 'Audio', '10-band parametric EQ', 'processor',
    [p('in', 'Audio', 'audio')], [p('out', 'Audio', 'audio')]),
  piece('audio.compressor', 'Compressor', 'Audio', 'Dynamic range compression', 'processor',
    [p('in', 'Audio', 'audio')], [p('out', 'Audio', 'audio')]),
  piece('audio.reverb', 'Reverb', 'Audio', 'Convolution reverb', 'processor',
    [p('in', 'Audio', 'audio')], [p('out', 'Audio', 'audio')]),
  piece('audio.delay', 'Delay', 'Audio', 'Tape-style delay', 'processor',
    [p('in', 'Audio', 'audio')], [p('out', 'Audio', 'audio')]),
  piece('audio.stem-isolator', 'Stem Isolator', 'Audio', 'Fingerprint-based stem extraction', 'processor',
    [p('in', 'Audio', 'audio'), p('fingerprint', 'Fingerprint', 'data')], [p('stem', 'Stem', 'audio')]),
  piece('audio.beat-slicer', 'Beat Slicer', 'Audio', 'Slice audio at beat boundaries', 'processor',
    [p('in', 'Audio', 'audio'), p('beats', 'Beats', 'data')], [p('slices', 'Slices', 'audio')]),
  piece('audio.sampler', 'Sampler', 'Audio', 'Multi-sample trigger pad', 'processor',
    [p('trigger', 'Trigger', 'trigger'), p('samples', 'Samples', 'audio')], [p('out', 'Audio', 'audio')]),
  piece('audio.sequencer', 'Step Sequencer', 'Audio', '16-step pattern sequencer', 'source',
    [], [p('out', 'Trigger', 'trigger'), p('midi', 'MIDI', 'data')]),
  piece('audio.looper', 'Looper', 'Audio', 'Record and loop audio', 'processor',
    [p('in', 'Audio', 'audio'), p('trigger', 'Trigger', 'trigger')], [p('out', 'Audio', 'audio')]),
  piece('audio.speaker-output', 'Speaker Output', 'Audio', 'Render audio to speakers', 'output',
    [p('in', 'Audio', 'audio')], []),
  piece('audio.file-export', 'Audio Export', 'Audio', 'Export audio to WAV/MP3', 'output',
    [p('in', 'Audio', 'audio')], [p('file', 'File', 'data')]),
  piece('audio.spectrum', 'Spectrum Analyzer', 'Audio', 'Real-time FFT spectrum', 'processor',
    [p('in', 'Audio', 'audio')], [p('view', 'View', 'video'), p('data', 'Data', 'data')]),
  piece('audio.peak-map', 'Peak Map Builder', 'Audio', 'Build frequency peak map', 'processor',
    [p('in', 'Audio', 'audio')], [p('map', 'Peak Map', 'data')]),
  piece('audio.fingerprint', 'Audio Fingerprint', 'Audio', 'Record reference fingerprint', 'processor',
    [p('map', 'Peak Map', 'data'), p('start', 'Start', 'data'), p('end', 'End', 'data')], [p('fp', 'Fingerprint', 'data')]),
];

// ── Visual Pieces ─────────────────────────────────────────────────────────────

const VISUAL_PIECES: PieceManifest[] = [
  piece('visual.camera', 'Camera Input', 'Visual', 'Device camera capture', 'source',
    [], [p('video', 'Video', 'video')]),
  piece('visual.image-loader', 'Image Loader', 'Visual', 'Load image from file or URL', 'source',
    [], [p('image', 'Image', 'video')]),
  piece('visual.video-loader', 'Video Loader', 'Visual', 'Load video from file or URL', 'source',
    [], [p('video', 'Video', 'video')]),
  piece('visual.canvas-2d', '2D Canvas', 'Visual', 'HTML5 2D drawing canvas', 'processor',
    [p('draw', 'Draw Commands', 'data')], [p('out', 'Video', 'video')]),
  piece('visual.webgl', 'WebGL Renderer', 'Visual', 'WebGL shader renderer', 'processor',
    [p('shader', 'Shader', 'data'), p('uniforms', 'Uniforms', 'data')], [p('out', 'Video', 'video')]),
  piece('visual.particle-system', 'Particle System', 'Visual', 'GPU particle emitter', 'processor',
    [p('trigger', 'Trigger', 'trigger'), p('config', 'Config', 'data')], [p('out', 'Video', 'video')]),
  piece('visual.text-overlay', 'Text Overlay', 'Visual', 'Animated text on video', 'processor',
    [p('video', 'Video', 'video'), p('text', 'Text', 'data')], [p('out', 'Video', 'video')]),
  piece('visual.chroma-key', 'Chroma Key', 'Visual', 'Green-screen removal', 'processor',
    [p('video', 'Video', 'video'), p('color', 'Key Color', 'data')], [p('out', 'Video', 'video')]),
  piece('visual.blur', 'Blur Filter', 'Visual', 'Gaussian blur post-process', 'processor',
    [p('video', 'Video', 'video')], [p('out', 'Video', 'video')]),
  piece('visual.lut', 'LUT Color Grade', 'Visual', 'Apply LUT color grading', 'processor',
    [p('video', 'Video', 'video'), p('lut', 'LUT', 'data')], [p('out', 'Video', 'video')]),
  piece('visual.screen-output', 'Screen Output', 'Visual', 'Render to screen', 'output',
    [p('video', 'Video', 'video')], []),
  piece('visual.record', 'Screen Recorder', 'Visual', 'Record video to file', 'output',
    [p('video', 'Video', 'video')], [p('file', 'File', 'data')]),
  piece('visual.babylon-scene', 'Babylon.js Scene', 'Visual', '3D scene powered by Babylon.js', 'processor',
    [p('config', 'Scene Config', 'data')], [p('out', 'Video', 'video')]),
  piece('visual.avatar', 'Avatar Renderer', 'Visual', 'Render DREAMengin avatar', 'processor',
    [p('state', 'Avatar State', 'data')], [p('out', 'Video', 'video')]),
  piece('visual.transition', 'Transition', 'Visual', 'Cross-fade / wipe between clips', 'processor',
    [p('a', 'Video A', 'video'), p('b', 'Video B', 'video'), p('t', 'Time', 'data')], [p('out', 'Video', 'video')]),
];

// ── AI Pieces ─────────────────────────────────────────────────────────────────

const AI_PIECES: PieceManifest[] = [
  piece('ai.chat', 'AI Chat', 'AI', 'Conversational AI panel', 'processor',
    [p('prompt', 'Prompt', 'data')], [p('response', 'Response', 'data')]),
  piece('ai.image-gen', 'Image Generator', 'AI', 'Text-to-image generation', 'source',
    [p('prompt', 'Prompt', 'data')], [p('image', 'Image', 'video')]),
  piece('ai.text-to-speech', 'Text to Speech', 'AI', 'Neural TTS synthesis', 'processor',
    [p('text', 'Text', 'data')], [p('audio', 'Audio', 'audio')]),
  piece('ai.speech-to-text', 'Speech to Text', 'AI', 'Transcribe audio to text', 'processor',
    [p('audio', 'Audio', 'audio')], [p('text', 'Text', 'data')]),
  piece('ai.sentiment', 'Sentiment Analyzer', 'AI', 'Analyze emotion/sentiment in text', 'processor',
    [p('text', 'Text', 'data')], [p('score', 'Score', 'data')]),
  piece('ai.embedding', 'Text Embedder', 'AI', 'Compute semantic embeddings', 'processor',
    [p('text', 'Text', 'data')], [p('vector', 'Vector', 'data')]),
  piece('ai.classifier', 'Image Classifier', 'AI', 'Classify image content', 'processor',
    [p('image', 'Image', 'video')], [p('label', 'Label', 'data'), p('confidence', 'Confidence', 'data')]),
  piece('ai.style-transfer', 'Style Transfer', 'AI', 'Apply artistic style to video', 'processor',
    [p('video', 'Video', 'video'), p('style', 'Style', 'data')], [p('out', 'Video', 'video')]),
  piece('ai.lyric-gen', 'Lyric Generator', 'AI', 'Generate song lyrics', 'source',
    [p('theme', 'Theme', 'data')], [p('lyrics', 'Lyrics', 'data')]),
  piece('ai.beat-gen', 'Beat Generator', 'AI', 'AI-composed beat pattern', 'source',
    [p('genre', 'Genre', 'data')], [p('pattern', 'Pattern', 'data'), p('audio', 'Audio', 'audio')]),
  piece('ai.code-gen', 'Code Generator', 'AI', 'Generate code snippets from description', 'processor',
    [p('description', 'Description', 'data')], [p('code', 'Code', 'data')]),
  piece('ai.bot-detector', 'Bot Detector', 'AI', 'Swipe-physics bot detection', 'processor',
    [p('swipes', 'Swipe Data', 'data')], [p('score', 'Bot Score', 'data'), p('blocked', 'Blocked', 'event')]),
];

// ── Game Pieces ───────────────────────────────────────────────────────────────

const GAME_PIECES: PieceManifest[] = [
  piece('game.loop', 'Game Loop', 'Game', 'Fixed-timestep game update loop', 'source',
    [], [p('tick', 'Tick', 'trigger'), p('dt', 'Delta Time', 'data')]),
  piece('game.input', 'Input Handler', 'Game', 'Keyboard/gamepad/touch input', 'source',
    [], [p('actions', 'Actions', 'data'), p('events', 'Events', 'event')]),
  piece('game.physics', 'Physics Engine', 'Game', '2D rigid-body physics', 'processor',
    [p('bodies', 'Bodies', 'data'), p('tick', 'Tick', 'trigger')], [p('state', 'State', 'data')]),
  piece('game.collision', 'Collision Detector', 'Game', 'AABB/circle collision detection', 'processor',
    [p('bodies', 'Bodies', 'data')], [p('pairs', 'Collision Pairs', 'data')]),
  piece('game.sprite-renderer', 'Sprite Renderer', 'Game', 'Render sprite sheets', 'processor',
    [p('state', 'State', 'data'), p('atlas', 'Atlas', 'video')], [p('out', 'Video', 'video')]),
  piece('game.tilemap', 'Tilemap', 'Game', 'Render tiled level map', 'processor',
    [p('map', 'Map Data', 'data')], [p('out', 'Video', 'video')]),
  piece('game.audio-manager', 'Audio Manager', 'Game', 'Positional audio for game objects', 'processor',
    [p('events', 'Events', 'event'), p('sounds', 'Sounds', 'audio')], [p('out', 'Audio', 'audio')]),
  piece('game.score', 'Score Tracker', 'Game', 'Track and display score', 'processor',
    [p('events', 'Events', 'event')], [p('score', 'Score', 'data'), p('view', 'View', 'video')]),
  piece('game.leaderboard', 'Leaderboard', 'Game', 'Online leaderboard integration', 'output',
    [p('score', 'Score', 'data'), p('player', 'Player', 'data')], []),
  piece('game.pathfinder', 'Pathfinder (A*)', 'Game', 'A* pathfinding on a grid', 'processor',
    [p('grid', 'Grid', 'data'), p('start', 'Start', 'data'), p('goal', 'Goal', 'data')], [p('path', 'Path', 'data')]),
  piece('game.state-machine', 'State Machine', 'Game', 'Finite-state machine for game entities', 'processor',
    [p('events', 'Events', 'event')], [p('state', 'State', 'data')]),
  piece('game.inventory', 'Inventory', 'Game', 'Item inventory system', 'processor',
    [p('events', 'Events', 'event')], [p('items', 'Items', 'data'), p('view', 'View', 'video')]),
  piece('game.dialogue', 'Dialogue Tree', 'Game', 'Branching NPC dialogue', 'processor',
    [p('trigger', 'Trigger', 'trigger'), p('tree', 'Dialogue Tree', 'data')], [p('line', 'Line', 'data'), p('view', 'View', 'video')]),
  piece('game.save', 'Save/Load', 'Game', 'Persist game state to IndexedDB', 'output',
    [p('state', 'State', 'data')], [p('loaded', 'Loaded State', 'data')]),
];

// ── Social Pieces ─────────────────────────────────────────────────────────────

const SOCIAL_PIECES: PieceManifest[] = [
  piece('social.feed', 'Dream Feed', 'Social', 'Scrollable content feed with torridity ranking', 'source',
    [], [p('items', 'Feed Items', 'data'), p('view', 'View', 'video')]),
  piece('social.post-composer', 'Post Composer', 'Social', 'Create and publish a post', 'source',
    [], [p('post', 'Post', 'data')]),
  piece('social.reactions', 'Reaction Bar', 'Social', 'Like/react to content', 'processor',
    [p('item', 'Content Item', 'data')], [p('reactions', 'Reactions', 'data'), p('view', 'View', 'video')]),
  piece('social.comment-thread', 'Comment Thread', 'Social', 'Nested comment display', 'processor',
    [p('item', 'Content Item', 'data')], [p('comments', 'Comments', 'data'), p('view', 'View', 'video')]),
  piece('social.user-card', 'User Card', 'Social', 'Display user profile card', 'processor',
    [p('user', 'User', 'data')], [p('view', 'View', 'video')]),
  piece('social.follow', 'Follow Button', 'Social', 'Follow/unfollow a user', 'processor',
    [p('user', 'User', 'data')], [p('state', 'Follow State', 'data'), p('view', 'View', 'video')]),
  piece('social.dm', 'Direct Message', 'Social', 'Send/receive DMs', 'processor',
    [p('thread', 'Thread', 'data')], [p('messages', 'Messages', 'data'), p('view', 'View', 'video')]),
  piece('social.shared-dream', 'Shared Dream', 'Social', 'Real-time collaborative session', 'processor',
    [p('component', 'Component', 'data')], [p('participants', 'Participants', 'data'), p('edits', 'Edits', 'event')]),
  piece('social.view-tally', 'View Tally', 'Social', '4-second view tracker', 'processor',
    [p('visible', 'Visible', 'event')], [p('tally', 'Tally', 'data')]),
  piece('social.bot-gate', 'Bot Gate', 'Social', 'Block flagged bot accounts', 'processor',
    [p('user', 'User', 'data'), p('score', 'Bot Score', 'data')], [p('allowed', 'Allowed', 'event')]),
  piece('social.notification', 'Notification', 'Social', 'Push/in-app notifications', 'output',
    [p('event', 'Event', 'event')], []),
  piece('social.marketplace', 'DreamMarketplace', 'Social', 'Publish/browse engine assemblies', 'output',
    [p('assembly', 'Assembly', 'data')], [p('listing', 'Listing', 'data')]),
];

// ── Utility Pieces ────────────────────────────────────────────────────────────

const UTILITY_PIECES: PieceManifest[] = [
  piece('util.timer', 'Timer', 'Utility', 'Interval / one-shot timer', 'source',
    [], [p('tick', 'Tick', 'trigger')]),
  piece('util.clock', 'Clock', 'Utility', 'Emits current timestamp', 'source',
    [], [p('time', 'Time', 'data')]),
  piece('util.random', 'Random Source', 'Utility', 'Seeded random number generator', 'source',
    [], [p('value', 'Value', 'data')]),
  piece('util.counter', 'Counter', 'Utility', 'Increment/decrement counter', 'processor',
    [p('trigger', 'Trigger', 'trigger'), p('reset', 'Reset', 'trigger')], [p('count', 'Count', 'data')]),
  piece('util.switch', 'Switch', 'Utility', 'Route data to one of N outputs', 'processor',
    [p('in', 'Input', 'data'), p('selector', 'Selector', 'data')], [p('a', 'A', 'data'), p('b', 'B', 'data')]),
  piece('util.merge', 'Merge', 'Utility', 'Merge multiple data streams', 'processor',
    [p('a', 'A', 'data'), p('b', 'B', 'data')], [p('out', 'Output', 'data')]),
  piece('util.filter', 'Filter', 'Utility', 'Filter data by predicate', 'processor',
    [p('in', 'Input', 'data'), p('pred', 'Predicate', 'data')], [p('out', 'Output', 'data')]),
  piece('util.transform', 'Transform', 'Utility', 'Map data through a JS expression', 'processor',
    [p('in', 'Input', 'data'), p('fn', 'Transform Fn', 'data')], [p('out', 'Output', 'data')]),
  piece('util.logger', 'Logger', 'Utility', 'Log data to console / overlay', 'output',
    [p('in', 'Input', 'data')], []),
  piece('util.storage', 'Storage (IndexedDB)', 'Utility', 'Persist data to IndexedDB', 'output',
    [p('key', 'Key', 'data'), p('value', 'Value', 'data')], [p('loaded', 'Loaded', 'data')]),
  piece('util.http', 'HTTP Request', 'Utility', 'Fetch data from a URL', 'source',
    [p('trigger', 'Trigger', 'trigger'), p('config', 'Config', 'data')], [p('response', 'Response', 'data')]),
  piece('util.supabase', 'Supabase Query', 'Utility', 'Query Supabase table', 'source',
    [p('query', 'Query', 'data')], [p('rows', 'Rows', 'data')]),
  piece('util.json-schema', 'JSON Schema', 'Utility', 'Validate data against JSON schema', 'processor',
    [p('in', 'Input', 'data'), p('schema', 'Schema', 'data')], [p('valid', 'Valid', 'event'), p('out', 'Output', 'data')]),
  piece('util.throttle', 'Throttle', 'Utility', 'Rate-limit event stream', 'processor',
    [p('in', 'Input', 'event')], [p('out', 'Output', 'event')]),
  piece('util.debounce', 'Debounce', 'Utility', 'Debounce event stream', 'processor',
    [p('in', 'Input', 'event')], [p('out', 'Output', 'event')]),
  piece('util.snapshot', 'Snapshot', 'Utility', 'Serialize VM state (VMSN)', 'output',
    [p('state', 'State', 'data')], [p('snapshot', 'Snapshot', 'data')]),
  piece('util.pipeline-cache', 'Pipeline Cache', 'Utility', 'IndexedDB WGSL pipeline cache', 'processor',
    [p('shader', 'Shader', 'data')], [p('pipeline', 'Pipeline', 'data')]),
  piece('util.torridity-rank', 'Torridity Rank', 'Utility', 'Compute torridity visibility score', 'processor',
    [p('views', 'Views', 'data'), p('mass', 'Mass', 'data')], [p('rank', 'Rank', 'data')]),
];

// ── Runtime Pieces ────────────────────────────────────────────────────────────

const RUNTIME_PIECES: PieceManifest[] = [
  piece('runtime.dual-hub', 'Dual Runtime Hub', 'Runtime',
    'Bridge between TOO VM (HomeDream) and BOTTOM VM (DreamSpace). Creates two independent buses and forwards messages between sides.',
    'processor',
    [p('too-in', 'TOO VM In', 'event'), p('bottom-in', 'BOTTOM VM In', 'event')],
    [p('too-out', 'TOO VM Out', 'event'), p('bottom-out', 'BOTTOM VM Out', 'event')]),
  piece('runtime.wasm-loader', 'WASM Loader', 'Runtime', 'Load and instantiate a WebAssembly module', 'source',
    [p('binary', 'Binary', 'data'), p('imports', 'Imports', 'data')], [p('instance', 'Instance', 'data')]),
  piece('runtime.gpu-compute', 'GPU Compute', 'Runtime', 'Run a WGSL compute shader', 'processor',
    [p('shader', 'Shader', 'data'), p('buffer', 'Buffer', 'data')], [p('result', 'Result', 'data')]),
  piece('runtime.worker', 'Web Worker', 'Runtime', 'Run code off the main thread', 'processor',
    [p('script', 'Script', 'data'), p('msg', 'Message', 'data')], [p('result', 'Result', 'data')]),
  piece('runtime.shared-buffer', 'Shared Buffer', 'Runtime', 'SharedArrayBuffer for zero-copy IPC', 'processor',
    [p('size', 'Size', 'data')], [p('buffer', 'Buffer', 'data')]),
  piece('runtime.quota', 'Resource Quota', 'Runtime', 'Enforce per-VM resource limits', 'processor',
    [p('usage', 'Usage', 'data'), p('quota', 'Quota', 'data')], [p('allowed', 'Allowed', 'event')]),
  piece('runtime.security', 'Security Gate', 'Runtime', 'Memory bounds check + syscall allow-list', 'processor',
    [p('call', 'Syscall', 'data')], [p('allowed', 'Allowed', 'event')]),
  piece('runtime.event-bus', 'Local Event Bus', 'Runtime', 'Isolated createEventBus() instance', 'processor',
    [], [p('bus', 'Bus', 'data')]),
];

// ── Full Registry ─────────────────────────────────────────────────────────────

export const PIECE_REGISTRY: PieceManifest[] = [
  ...AUDIO_PIECES,
  ...VISUAL_PIECES,
  ...AI_PIECES,
  ...GAME_PIECES,
  ...SOCIAL_PIECES,
  ...UTILITY_PIECES,
  ...RUNTIME_PIECES,
];

/** Look up a piece by id */
export function getPiece(id: string): PieceManifest | undefined {
  return PIECE_REGISTRY.find((p) => p.id === id);
}

/** All pieces in a given category */
export function getPiecesByCategory(category: PieceCategory): PieceManifest[] {
  return PIECE_REGISTRY.filter((p) => p.category === category);
}

/** All distinct categories */
export const PIECE_CATEGORIES: PieceCategory[] = [
  'Audio', 'Visual', 'AI', 'Game', 'Social', 'Utility', 'Runtime',
];
