'use client';

/**
 * ForgeDreamCanvas — Visual Assembly Builder
 *
 * - Left sidebar: component inventory grouped by category
 * - Central canvas: draggable piece boxes with input/output ports
 * - Wiring: click output port → drag to input port → wire created
 * - Test button: runAssembly via sandbox
 * - Save: serializeAssembly → JSON download
 * - Uses local event bus, NOT global bridge
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  type MouseEvent,
} from 'react';
import {
  COMPONENT_INVENTORY,
  ALL_CATEGORIES,
  getByCategory,
  type AtomicComponent,
  type ComponentCategory,
} from '../lib/componentInventory';
import {
  atomicPieceFromComponent,
  createAssembly,
  runAssembly,
  serializeAssembly,
  validateAssembly,
  type AtomicPiece,
  type Wire,
  type AssemblySandbox,
} from '../lib/forge/engineForge';
import { createEventBus } from '../lib/eventBus';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlacedPiece {
  piece: AtomicPiece;
  x: number;
  y: number;
}

interface PendingWire {
  fromPieceId: string;
  fromPortId:  string;
  /** Mouse position while drawing */
  mx: number;
  my: number;
}

// ─── Default sandbox ──────────────────────────────────────────────────────────

const DEFAULT_SANDBOX: AssemblySandbox = {
  execute(piece, inputs) {
    return { pieceId: piece.id, name: piece.name, inputs, output: `[${piece.name} output]` };
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ForgeDreamCanvas() {
  const [activeCategory, setActiveCategory] = useState<ComponentCategory>('Audio & Music');
  const [placed,         setPlaced]         = useState<PlacedPiece[]>([]);
  const [wires,          setWires]          = useState<Wire[]>([]);
  const [pendingWire,    setPendingWire]    = useState<PendingWire | null>(null);
  const [runResult,      setRunResult]      = useState<string>('');
  const [validationMsg,  setValidationMsg]  = useState<string>('');
  const [draggingId,     setDraggingId]     = useState<string | null>(null);
  const dragOffset  = useRef({ dx: 0, dy: 0 });
  const canvasRef   = useRef<HTMLDivElement>(null);

  // Local bus — scoped to this assembly, NOT global
  const busRef = useRef(createEventBus());

  // Listen to bus events
  useEffect(() => {
    const bus = busRef.current;
    const handleExec = (payload: unknown) => {
      const p = payload as { result: unknown };
      setRunResult(JSON.stringify(p.result, null, 2));
    };
    bus.on('executed', handleExec);
    return () => bus.off('executed', handleExec);
  }, []);

  // ── Sidebar: add piece to canvas ──
  const addPiece = useCallback((comp: AtomicComponent) => {
    const piece: AtomicPiece = atomicPieceFromComponent(comp, 'any');
    setPlaced((prev) => [
      ...prev,
      { piece, x: 200 + Math.random() * 300, y: 80 + Math.random() * 300 },
    ]);
  }, []);

  // ── Piece drag (mouse) ──
  const startDrag = useCallback(
    (e: MouseEvent<HTMLDivElement>, pieceId: string) => {
      e.stopPropagation();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect  = canvas.getBoundingClientRect();
      const found = placed.find((p) => p.piece.id === pieceId);
      if (!found) return;
      dragOffset.current = {
        dx: e.clientX - rect.left - found.x,
        dy: e.clientY - rect.top  - found.y,
      };
      setDraggingId(pieceId);
    },
    [placed]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      if (draggingId) {
        const nx = e.clientX - rect.left - dragOffset.current.dx;
        const ny = e.clientY - rect.top  - dragOffset.current.dy;
        setPlaced((prev) =>
          prev.map((p) =>
            p.piece.id === draggingId ? { ...p, x: nx, y: ny } : p
          )
        );
      }

      if (pendingWire) {
        setPendingWire((pw) =>
          pw ? { ...pw, mx: e.clientX - rect.left, my: e.clientY - rect.top } : null
        );
      }
    },
    [draggingId, pendingWire]
  );

  const onMouseUp = useCallback(() => {
    setDraggingId(null);
    // Pending wire dropped on empty space → cancel
    if (pendingWire) setPendingWire(null);
  }, [pendingWire]);

  // ── Port click → start wiring ──
  const startWire = useCallback(
    (e: MouseEvent, fromPieceId: string, fromPortId: string) => {
      e.stopPropagation();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      setPendingWire({
        fromPieceId,
        fromPortId,
        mx: e.clientX - rect.left,
        my: e.clientY - rect.top,
      });
    },
    []
  );

  // ── Input port click → complete wire ──
  const completeWire = useCallback(
    (e: MouseEvent, toPieceId: string, toPortId: string) => {
      e.stopPropagation();
      if (!pendingWire) return;
      if (pendingWire.fromPieceId === toPieceId) { setPendingWire(null); return; }

      const wire: Wire = {
        id:          `wire_${Date.now()}`,
        fromPieceId: pendingWire.fromPieceId,
        fromPortId:  pendingWire.fromPortId,
        toPieceId,
        toPortId,
      };
      setWires((prev) => [...prev, wire]);
      setPendingWire(null);
    },
    [pendingWire]
  );

  // ── Validate ──
  const validate = useCallback(() => {
    const pieces = placed.map((p) => p.piece);
    const result = validateAssembly(pieces, wires);
    setValidationMsg(result.valid ? '✅ Valid assembly' : result.errors.join('\n'));
  }, [placed, wires]);

  // ── Run ──
  const run = useCallback(() => {
    const pieces = placed.map((p) => p.piece);
    try {
      const assembly = createAssembly(pieces, wires);
      // Swap the assembly's bus events to our local bus
      assembly.bus.on('executed', (payload) => busRef.current.emit('executed', payload));
      assembly.bus.on('error',    (payload) => setRunResult(`Error: ${(payload as { message: string }).message}`));
      runAssembly(assembly, DEFAULT_SANDBOX);
    } catch (err) {
      setRunResult(`Assembly error: ${String(err)}`);
    }
  }, [placed, wires]);

  // ── Save ──
  const save = useCallback(() => {
    const pieces = placed.map((p) => p.piece);
    const json   = serializeAssembly({ id: `forge_${Date.now()}`, pieces, wires });
    const blob   = new Blob([json], { type: 'application/json' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = 'assembly.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [placed, wires]);

  // ── Save to Supabase ──
  const saveToSupabase = useCallback(async (publish = false) => {
    const pieces = placed.map((p) => p.piece);
    const json   = serializeAssembly({ id: `forge_${Date.now()}`, pieces, wires });

    try {
      const { createClient } = await import('../lib/supabase/client');
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setValidationMsg('⚠ Sign in to save to your workspace'); return; }

      const { error } = await supabase.from('forge_assemblies').upsert({
        user_id:    user.id,
        assembly:   JSON.parse(json) as Record<string, unknown>,
        visibility: publish ? 'public' : 'private',
        title:      `Assembly ${new Date().toLocaleDateString()}`,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        setValidationMsg(`⚠ Save failed: ${error.message}`);
      } else {
        setValidationMsg(publish ? '✅ Published to Marketplace' : '✅ Saved to workspace');
      }
    } catch (err) {
      setValidationMsg(`⚠ ${String(err)}`);
    }
  }, [placed, wires]);

  // ── Clear ──
  const clear = useCallback(() => {
    setPlaced([]);
    setWires([]);
    setPendingWire(null);
    setRunResult('');
    setValidationMsg('');
  }, []);

  // ─── Render ────────────────────────────────────────────────────────────────

  const categoryPieces = getByCategory(activeCategory);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0a14] text-white font-sans select-none">

      {/* ── Left sidebar ── */}
      <aside className="w-64 flex-shrink-0 flex flex-col border-r border-white/10 overflow-hidden">
        {/* Category tabs */}
        <div className="overflow-y-auto flex-shrink-0 border-b border-white/10">
          {ALL_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                cat === activeCategory
                  ? 'bg-amber-500/20 text-amber-300 font-semibold'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Piece list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {categoryPieces.map((comp) => (
            <button
              key={comp.id}
              onDoubleClick={() => addPiece(comp)}
              title={`Double-click to add: ${comp.description}`}
              className="w-full text-left px-2 py-1.5 rounded text-xs text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              {comp.name}
            </button>
          ))}
        </div>

        {/* Action bar */}
        <div className="border-t border-white/10 p-2 space-y-1">
          <button onClick={validate} className="w-full py-1.5 rounded text-xs bg-sky-600 hover:bg-sky-500 transition-colors">Validate</button>
          <button onClick={run}      className="w-full py-1.5 rounded text-xs bg-green-700 hover:bg-green-600 transition-colors">▶ Run</button>
          <button onClick={save}     className="w-full py-1.5 rounded text-xs bg-white/10 hover:bg-white/20 transition-colors">💾 Save JSON</button>
          <button onClick={() => void saveToSupabase(false)} className="w-full py-1.5 rounded text-xs bg-amber-900/40 hover:bg-amber-900/60 transition-colors">☁ Save to Workspace</button>
          <button onClick={() => void saveToSupabase(true)}  className="w-full py-1.5 rounded text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors">🏪 Publish to Marketplace</button>
          <button onClick={clear}    className="w-full py-1.5 rounded text-xs bg-red-900/40 hover:bg-red-900/60 transition-colors">✕ Clear</button>
        </div>
      </aside>

      {/* ── Central canvas ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Canvas area */}
        <div
          ref={canvasRef}
          className="flex-1 relative overflow-hidden"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, #111827 0%, #0a0a14 100%)' }}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
        >
          {/* Grid dots */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            <defs>
              <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.8" fill="#ffffff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Wires */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {wires.map((wire) => {
              const from = placed.find((p) => p.piece.id === wire.fromPieceId);
              const to   = placed.find((p) => p.piece.id === wire.toPieceId);
              if (!from || !to) return null;
              const x1 = from.x + 180; const y1 = from.y + 30;
              const x2 = to.x;         const y2 = to.y + 30;
              const cx1 = x1 + 60;     const cx2 = x2 - 60;
              return (
                <path
                  key={wire.id}
                  d={`M ${x1} ${y1} C ${cx1} ${y1}, ${cx2} ${y2}, ${x2} ${y2}`}
                  stroke="#fbbf24" strokeWidth="1.5" fill="none" opacity="0.7"
                />
              );
            })}

            {/* Pending wire */}
            {pendingWire && (() => {
              const from = placed.find((p) => p.piece.id === pendingWire.fromPieceId);
              if (!from) return null;
              const x1 = from.x + 180; const y1 = from.y + 30;
              const { mx: x2, my: y2 } = pendingWire;
              return (
                <path
                  d={`M ${x1} ${y1} C ${x1 + 60} ${y1}, ${x2 - 60} ${y2}, ${x2} ${y2}`}
                  stroke="#fbbf2488" strokeWidth="1.5" fill="none" strokeDasharray="4 4"
                />
              );
            })()}
          </svg>

          {/* Placed pieces */}
          {placed.map(({ piece, x, y }) => (
            <div
              key={piece.id}
              style={{ position: 'absolute', left: x, top: y, width: 180, zIndex: draggingId === piece.id ? 100 : 1 }}
            >
              {/* Header (drag handle) */}
              <div
                onMouseDown={(e) => startDrag(e, piece.id)}
                className="cursor-grab active:cursor-grabbing px-2 py-1 rounded-t text-xs font-semibold truncate"
                style={{ background: '#1e293b', borderBottom: '1px solid #334155' }}
                title={piece.description}
              >
                {piece.name}
                <span className="ml-1 text-[10px] text-white/40">{piece.category}</span>
              </div>

              {/* Ports */}
              <div className="flex justify-between px-0 py-1 rounded-b text-[10px]"
                   style={{ background: '#0f172a', border: '1px solid #1e293b', borderTop: 'none' }}>
                {/* Input ports */}
                <div className="flex flex-col gap-1 pl-1">
                  {piece.inputPorts.map((port) => (
                    <div
                      key={port.id}
                      className="flex items-center gap-1 cursor-crosshair"
                      onMouseUp={(e) => completeWire(e, piece.id, port.id)}
                    >
                      <div className="w-2 h-2 rounded-full bg-sky-400 border border-sky-200" />
                      <span className="text-white/50">{port.label}</span>
                    </div>
                  ))}
                </div>

                {/* Output ports */}
                <div className="flex flex-col gap-1 pr-1 items-end">
                  {piece.outputPorts.map((port) => (
                    <div
                      key={port.id}
                      className="flex items-center gap-1 cursor-crosshair"
                      onMouseDown={(e) => startWire(e, piece.id, port.id)}
                    >
                      <span className="text-white/50">{port.label}</span>
                      <div className="w-2 h-2 rounded-full bg-amber-400 border border-amber-200" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {/* Empty state */}
          {placed.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-white/20 text-sm">Double-click pieces in the sidebar to add them here</p>
            </div>
          )}
        </div>

        {/* Output bar */}
        {(runResult || validationMsg) && (
          <div className="border-t border-white/10 p-3 max-h-32 overflow-y-auto">
            {validationMsg && (
              <pre className="text-xs text-sky-300 whitespace-pre-wrap mb-1">{validationMsg}</pre>
            )}
            {runResult && (
              <pre className="text-xs text-green-300 whitespace-pre-wrap">{runResult}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgeDreamCanvas;
