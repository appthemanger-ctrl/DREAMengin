/**
 * DREAMenginOS — Core Upgrade Layer
 *
 * Exports all atomic OS capabilities and provides upgradeEngine() so
 * any engine becomes a thin shell that calls into the OS layer.
 *
 * The existing DREAMenginOS.tsx visual dashboard is untouched.
 */

// ─── Re-exports from capability modules ──────────────────────────────────────

// slog transform
export {
  slog,
  slogInv,
  slogArray,
  slogMean,
  slogVariance,
  slogEntropy,
} from '../slog';

// Torridity physics
export {
  TORRIDITY_N,
  TORRIDITY_DP,
  TORRIDITY_LAMBDA,
  TORRIDITY_A0_PERCEPTION,
  mu,
  contentMass,
  torridityRank,
  throttledVisibility,
  rankFeed,
} from '../torridity';
export type { ContentItem, RankedItem } from '../torridity';

// Generation Law ι-Engine
export {
  DELTA_P,
  LAMBDA,
  IOTA_MAX,
  THRESHOLD_FLOW,
  THRESHOLD_SYNTHESIZE,
  calculateInventionForce,
  getPassProtocol,
  runPrePassChecklist,
  logResidual,
  auditPostPass,
  BUGS_LOG,
  DOC_RELATIONSHIPS,
} from '../generationLaw';
export type {
  CreativePass,
  Protocol,
  InventionResult,
  ResidualClass,
  PrePassChecklist,
} from '../generationLaw';

// Local Event Bus
export {
  createEventBus,
  createDualRuntimeHub,
} from '../eventBus';
export type { EventBus, EventHandler } from '../eventBus';

// Ledger
export {
  createLedger,
  getLedgerEntry,
  getAllByKind,
  storePeakMap,
  storeFingerprint,
  storeSampleMetadata,
  storeTorridityRank,
} from '../ledger';
export type {
  Ledger,
  LedgerEntry,
  PeakMapEntry,
  FingerprintEntry,
  SampleMetadataEntry,
  TorridityEntry,
  SampleMetadata,
} from '../ledger';

// Universal Editor
export {
  createLocalEventBus,
  canTransfer,
  transferModule,
} from '../universalEditor';
export type { ModuleManifest, RuntimeId } from '../universalEditor';

// Bot Detection
export {
  analyzeSwipe,
  tallyView,
  isBotSession,
} from '../botDetection';
export type {
  Point,
  SwipeAnalysis,
  ViewTally,
  BotSessionResult,
  SwipeRecord,
} from '../botDetection';

// Audio Fingerprint
export {
  buildPeakMap,
  recordReferenceFingerprint,
  matchFingerprint,
  extractAudioChunks,
} from '../audioFingerprint';
export type {
  Peak,
  PeakMap,
  Fingerprint,
  MatchResult,
} from '../audioFingerprint';

// Component Inventory
export {
  COMPONENT_INVENTORY,
  ALL_CATEGORIES,
  getByCategory,
  searchComponents,
} from '../componentInventory';
export type { AtomicComponent, ComponentCategory } from '../componentInventory';

// Forge
export {
  validateAssembly,
  createAssembly,
  runAssembly,
  serializeAssembly,
  deserializeAssembly,
  atomicPieceFromComponent,
} from '../forge/engineForge';
export type {
  AtomicPiece,
  EngineAssembly,
  Wire,
  Port,
  AssemblySandbox,
  ValidationResult,
} from '../forge/engineForge';

// GameEngin Runtime
export {
  loadDreamGame,
  GameEnginRuntime,
} from '../gameengin/gameEnginRuntime';
export type {
  DreamGameManifest,
  DreamGameInstance,
  InputType,
  InputHandler,
  GameEnginEvents,
} from '../gameengin/gameEnginRuntime';

// ─── OS Feature Upgrade ───────────────────────────────────────────────────────

export type OSFeature = 'ledger' | 'bridge' | 'aiTriad' | 'telemetry';

export interface EngineBase {
  id: string;
  name: string;
  [key: string]: unknown;
}

export interface UpgradedEngine<T extends EngineBase = EngineBase> {
  engine: T;
  features: OSFeature[];
  ledger?: ReturnType<typeof import('../ledger').createLedger>;
  bus?: ReturnType<typeof import('../eventBus').createEventBus>;
  telemetry?: {
    frameCount: number;
    startedAt: string;
    log: (msg: string) => void;
  };
}

/**
 * upgradeEngine(engine, features)
 *
 * Adds OS capabilities to any engine object:
 *  - 'ledger'    → attaches an in-memory Ledger
 *  - 'bridge'    → creates a local EventBus
 *  - 'aiTriad'   → documents AI triad presence (Dr. Eams, IDARi, Boogie)
 *  - 'telemetry' → lightweight frame counter + log
 */
export async function upgradeEngine<T extends EngineBase>(
  engine: T,
  features: OSFeature[]
): Promise<UpgradedEngine<T>> {
  const upgraded: UpgradedEngine<T> = { engine, features };

  if (features.includes('ledger')) {
    const { createLedger: _createLedger } = await import('../ledger');
    upgraded.ledger = _createLedger();
  }

  if (features.includes('bridge')) {
    const { createEventBus: _createBus } = await import('../eventBus');
    upgraded.bus = _createBus();
  }

  if (features.includes('telemetry')) {
    upgraded.telemetry = {
      frameCount: 0,
      startedAt:  new Date().toISOString(),
      log(msg: string) {
        console.info(`[${engine.id} telemetry] ${msg}`);
        this.frameCount++;
      },
    };
  }

  // 'aiTriad' is documented — the three agents are platform-level services
  // and don't need runtime attachment here.

  return upgraded;
}
