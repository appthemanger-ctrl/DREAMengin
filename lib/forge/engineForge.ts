/**
 * Engin Forge — NGN Engin Assembly System
 *
 * Defines AtomicPiece, EngineAssembly, Wire, and all forge operations.
 * Integrates with componentInventory for the piece palette.
 */

import { createEventBus, type EventBus } from '../eventBus';
import type { AtomicComponent } from '../componentInventory';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Port {
  id: string;
  label: string;
  /** Data type flowing through this port. */
  dataType: string;
}

export interface AtomicPiece {
  id: string;
  name: string;
  description: string;
  category: string;
  inputPorts: Port[];
  outputPorts: Port[];
  /** Piece classification used for assembly validation. */
  role: 'source' | 'processor' | 'output' | 'any';
}

export interface Wire {
  id: string;
  /** Source piece id. */
  fromPieceId: string;
  /** Source output port id. */
  fromPortId: string;
  /** Target piece id. */
  toPieceId: string;
  /** Target input port id. */
  toPortId: string;
}

export type AssemblyEvents = {
  pieceAdded:    { piece: AtomicPiece };
  wireAdded:     { wire: Wire };
  assembled:     { pieceCount: number };
  executed:      { result: unknown };
  error:         { message: string };
};

export interface EngineAssembly {
  id: string;
  pieces: AtomicPiece[];
  wires: Wire[];
  bus: EventBus<AssemblyEvents>;
}

export interface AssemblySandbox {
  /** Called for each piece during execution — returns the piece's output. */
  execute(piece: AtomicPiece, inputs: Record<string, unknown>): unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ─── Validation ───────────────────────────────────────────────────────────────

/**
 * validateAssembly(pieces, wires)
 *
 * Rules:
 *  - 3 to 30 pieces
 *  - At least one 'source' piece
 *  - At least one 'processor' piece
 *  - At least one 'output' piece
 *  - No dangling wires (both ends must resolve to real pieces/ports)
 */
export function validateAssembly(
  pieces: AtomicPiece[],
  wires: Wire[]
): ValidationResult {
  const errors: string[] = [];
  const pieceIds = new Set(pieces.map((p) => p.id));

  if (pieces.length < 3)  errors.push('Assembly needs at least 3 pieces.');
  if (pieces.length > 30) errors.push('Assembly cannot exceed 30 pieces.');

  const hasSource    = pieces.some((p) => p.role === 'source'    || p.role === 'any');
  const hasProcessor = pieces.some((p) => p.role === 'processor' || p.role === 'any');
  const hasOutput    = pieces.some((p) => p.role === 'output'    || p.role === 'any');

  if (!hasSource)    errors.push('Assembly needs at least one source piece.');
  if (!hasProcessor) errors.push('Assembly needs at least one processor piece.');
  if (!hasOutput)    errors.push('Assembly needs at least one output piece.');

  for (const wire of wires) {
    if (!pieceIds.has(wire.fromPieceId)) {
      errors.push(`Wire "${wire.id}" references unknown source piece "${wire.fromPieceId}".`);
    }
    if (!pieceIds.has(wire.toPieceId)) {
      errors.push(`Wire "${wire.id}" references unknown target piece "${wire.toPieceId}".`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── createAssembly ───────────────────────────────────────────────────────────

/**
 * createAssembly(pieces, wires)
 *
 * Validates the assembly then creates it with a scoped local event bus.
 * Throws if validation fails.
 */
export function createAssembly(
  pieces: AtomicPiece[],
  wires: Wire[]
): EngineAssembly {
  const validation = validateAssembly(pieces, wires);
  if (!validation.valid) {
    throw new Error(`Assembly validation failed:\n${validation.errors.join('\n')}`);
  }

  const id  = `asm_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  const bus = createEventBus<AssemblyEvents>();

  return { id, pieces: [...pieces], wires: [...wires], bus };
}

// ─── runAssembly ─────────────────────────────────────────────────────────────

/**
 * runAssembly(assembly, sandbox)
 *
 * Executes pieces in topological order, routing wire outputs to inputs.
 * The sandbox implements actual piece logic.
 */
export function runAssembly(
  assembly: EngineAssembly,
  sandbox: AssemblySandbox
): unknown {
  const { pieces, wires, bus } = assembly;

  // Build adjacency: pieceId → inputs from wires
  const pieceInputs = new Map<string, Record<string, unknown>>();
  pieces.forEach((p) => pieceInputs.set(p.id, {}));

  const pieceOutputs = new Map<string, unknown>();

  // Simple topological sort by wire dependencies
  const processed = new Set<string>();
  const remaining = [...pieces];

  let iterations = 0;
  while (remaining.length > 0 && iterations < 100) {
    iterations++;
    const readyIdx = remaining.findIndex((piece) => {
      // All input wires have been satisfied
      const incomingWires = wires.filter((w) => w.toPieceId === piece.id);
      return incomingWires.every((w) => processed.has(w.fromPieceId));
    });

    if (readyIdx === -1) break; // cycle or no progress

    const piece = remaining.splice(readyIdx, 1)[0];

    // Collect inputs from wires
    const inputs: Record<string, unknown> = {};
    wires
      .filter((w) => w.toPieceId === piece.id)
      .forEach((w) => {
        inputs[w.toPortId] = pieceOutputs.get(w.fromPieceId);
      });

    try {
      const output = sandbox.execute(piece, inputs);
      pieceOutputs.set(piece.id, output);
    } catch (err) {
      bus.emit('error', { message: `Piece "${piece.name}" threw: ${String(err)}` });
    }

    processed.add(piece.id);
  }

  // Final output = last output piece's value
  const outputPiece = [...pieces].reverse().find((p) => p.role === 'output' || p.role === 'any');
  const result      = outputPiece ? pieceOutputs.get(outputPiece.id) : undefined;

  bus.emit('executed', { result });
  return result;
}

// ─── serializeAssembly ────────────────────────────────────────────────────────

/**
 * serializeAssembly(assembly)
 *
 * Returns a JSON-serialisable representation for Supabase storage.
 */
export function serializeAssembly(
  assembly: Omit<EngineAssembly, 'bus'>
): string {
  return JSON.stringify({
    id:     assembly.id,
    pieces: assembly.pieces,
    wires:  assembly.wires,
  }, null, 2);
}

/**
 * deserializeAssembly(json)
 *
 * Parses a serialised assembly and creates a new bus for it.
 */
export function deserializeAssembly(json: string): EngineAssembly {
  const parsed = JSON.parse(json) as { id: string; pieces: AtomicPiece[]; wires: Wire[] };
  const bus    = createEventBus<AssemblyEvents>();
  return { ...parsed, bus };
}

// ─── fromComponentInventory ───────────────────────────────────────────────────

/**
 * atomicPieceFromComponent(component, role?)
 *
 * Converts an AtomicComponent from the inventory into an AtomicPiece
 * with default single-port IO.
 */
export function atomicPieceFromComponent(
  component: AtomicComponent,
  role: AtomicPiece['role'] = 'any'
): AtomicPiece {
  return {
    id:          component.id,
    name:        component.name,
    description: component.description,
    category:    component.category,
    role,
    inputPorts:  [{ id: 'in',  label: 'Input',  dataType: 'any' }],
    outputPorts: [{ id: 'out', label: 'Output', dataType: 'any' }],
  };
}
