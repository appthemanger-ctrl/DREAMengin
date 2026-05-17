/**
 * NGN Engin — Engine Assembly
 *
 * EngineAssembly CRUD helpers + JSON serialization.
 * An assembly is the JSON blueprint saved by the visual builder.
 *
 * Rules:
 *  - Minimum 3 pieces (at least one source, one processor, one output)
 *  - Maximum 30 pieces per engine
 *
 * Feature 41.
 */

import type { PieceManifest } from './piece-registry';
import { getPiece } from './piece-registry';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PlacedPiece {
  /** Unique instance id (UUID) */
  instanceId: string;
  /** Piece manifest id, e.g. 'audio.waveform-zoom' */
  pieceId: string;
  /** Canvas position */
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  fromInstanceId: string;
  fromPortId: string;
  toInstanceId: string;
  toPortId: string;
}

export interface EngineAssembly {
  id: string;
  name: string;
  description: string;
  pieces: PlacedPiece[];
  connections: Connection[];
  createdAt: number;
  updatedAt: number;
}

export type AssemblyValidationError =
  | { code: 'too-few-pieces'; message: string }
  | { code: 'too-many-pieces'; message: string }
  | { code: 'missing-source'; message: string }
  | { code: 'missing-processor'; message: string }
  | { code: 'missing-output'; message: string }
  | { code: 'unknown-piece'; pieceId: string; message: string };

// ── Constants ─────────────────────────────────────────────────────────────────

export const MIN_PIECES = 3;
export const MAX_PIECES = 30;

// ── Helpers ───────────────────────────────────────────────────────────────────

function uuid(: string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createAssembly(name: string, description = '': EngineAssembly {
  return {
    id: uuid(),
    name,
    description,
    pieces: [],
    connections: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// ── Piece CRUD ────────────────────────────────────────────────────────────────

export function addPiece(
  assembly: EngineAssembly,
  pieceId: string,
  x = 0,
  y = 0,
): { assembly: EngineAssembly; instanceId: string } | { error: string } {
  if (assembly.pieces.length >= MAX_PIECES) {
    return { error: `Maximum ${MAX_PIECES} pieces per engine.` };
  }
  if (!getPiece(pieceId)) {
    return { error: `Unknown piece: ${pieceId}` };
  }
  const instanceId = uuid();
  const updated: EngineAssembly = {
    ...assembly,
    pieces: [...assembly.pieces, { instanceId, pieceId, x, y }],
    updatedAt: Date.now(),
  };
  return { assembly: updated, instanceId };
}

export function removePiece(
  assembly: EngineAssembly,
  instanceId: string,
): EngineAssembly {
  return {
    ...assembly,
    pieces: assembly.pieces.filter((p: Record<string, unknown>) => p.instanceId !== instanceId),
    connections: assembly.connections.filter(
      (c) => c.fromInstanceId !== instanceId && c.toInstanceId !== instanceId,
    ),
    updatedAt: Date.now(),
  };
}

export function movePiece(
  assembly: EngineAssembly,
  instanceId: string,
  x: number,
  y: number,
): EngineAssembly {
  return {
    ...assembly,
    pieces: assembly.pieces.map((p: Record<string, unknown>) =>
      p.instanceId === instanceId ? { ...p, x, y } : p,
    ),
    updatedAt: Date.now(),
  };
}

// ── Connection CRUD ───────────────────────────────────────────────────────────

export function addConnection(
  assembly: EngineAssembly,
  fromInstanceId: string,
  fromPortId: string,
  toInstanceId: string,
  toPortId: string,
): EngineAssembly {
  const id = uuid();
  return {
    ...assembly,
    connections: [
      ...assembly.connections,
      { id, fromInstanceId, fromPortId, toInstanceId, toPortId },
    ],
    updatedAt: Date.now(),
  };
}

export function removeConnection(
  assembly: EngineAssembly,
  connectionId: string,
): EngineAssembly {
  return {
    ...assembly,
    connections: assembly.connections.filter((c: Record<string, unknown>) => c.id !== connectionId),
    updatedAt: Date.now(),
  };
}

// ── Validation ────────────────────────────────────────────────────────────────

export function validateAssembly(
  assembly: EngineAssembly,
): AssemblyValidationError[] {
  const errors: AssemblyValidationError[] = [];

  if (assembly.pieces.length < MIN_PIECES) {
    errors.push({
      code: 'too-few-pieces',
      message: `An engine needs at least ${MIN_PIECES} pieces (source + processor + output).`,
    });
  }

  if (assembly.pieces.length > MAX_PIECES) {
    errors.push({
      code: 'too-many-pieces',
      message: `An engine cannot have more than ${MAX_PIECES} pieces.`,
    });
  }

  const manifests: PieceManifest[] = [];
  for (const placed of assembly.pieces) {
    const manifest = getPiece(placed.pieceId);
    if (!manifest) {
      errors.push({
        code: 'unknown-piece',
        pieceId: placed.pieceId,
        message: `Unknown piece id: ${placed.pieceId}`,
      });
    } else {
      manifests.push(manifest);
    }
  }

  const hasSource    = manifests.some((m: Record<string, unknown>) => m.role === 'source');
  const hasProcessor = manifests.some((m: Record<string, unknown>) => m.role === 'processor');
  const hasOutput    = manifests.some((m: Record<string, unknown>) => m.role === 'output');

  if (!hasSource)    errors.push({ code: 'missing-source',    message: 'Assembly must include at least one source piece.' });
  if (!hasProcessor) errors.push({ code: 'missing-processor', message: 'Assembly must include at least one processor piece.' });
  if (!hasOutput)    errors.push({ code: 'missing-output',    message: 'Assembly must include at least one output piece.' });

  return errors;
}

export function isValidAssembly(assembly: EngineAssembly: boolean {
  return validateAssembly(assembly).length === 0;
}

// ── JSON Serialization ────────────────────────────────────────────────────────

export function serializeAssembly(assembly: EngineAssembly: string {
  return JSON.stringify(assembly, null, 2);
}

export function deserializeAssembly(json: string: EngineAssembly {
  const parsed = JSON.parse(json) as unknown;
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('id' in parsed) ||
    !('pieces' in parsed)
  ) {
    throw new Error('Invalid assembly JSON');
  }
  return parsed as EngineAssembly;
}
