'use client';

/**
 * components/forge/dream.EngineBuilderCanvas.tsx — §41 Engin Forge (NGN Engin)
 *
 * Visual engine builder as described in spec §41.
 *
 * §41.1 Layout:
 *   - Left sidebar: 120+ atomic pieces (from componentInventory) by category
 *   - Central canvas: drag pieces, connect input/output ports
 *   - Each piece has a manifest and a local event bus
 *
 * §41.2 Rules:
 *   - Minimum 3 pieces (source + processor + output), max 30
 *   - Test in sandbox (isolated component)
 *   - Save assembly as JSON, share/publish to DreamMarketplace
 *
 * §41.3 Dual Runtime Hub:
 *   - "Dual Runtime Hub" piece enables cross-side communication
 *
 * §42 Local Event Bus:
 *   - Each assembly gets its own createEventBus() instance
 *   - Modules communicate only when explicitly wired
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Play, Save, Download, Upload,
  Zap, ChevronRight, ChevronDown, X, Check,
  AlertTriangle, CheckCircle2, Link2, Unlink,
} from 'lucide-react';
import {
  COMPONENT_INVENTORY,
  type AtomicComponent,
  type ComponentCategory,
} from '@/lib/componentInventory';
import {
  createAssembly,
  validateAssembly,
  serializeAssembly,
  deserializeAssembly,
  atomicPieceFromComponent,
  type AtomicPiece,
  type Wire,
  type EngineAssembly,
} from '@/lib/forge/engineForge';

// ── Design tokens ─────────────────────────────────────────────────────────────

const C = {
  bg:       '#0a0a0f',
  panel:    'rgba(255,255,255,0.04)',
  panel2:   'rgba(255,255,255,0.07)',
  border:   'rgba(255,255,255,0.08)',
  border2:  'rgba(255,255,255,0.14)',
  text:     'rgba(255,255,255,0.88)',
  dim:      'rgba(255,255,255,0.45)',
  accent:   '#6366f1',    // indigo
  success:  '#22c55e',
  warning:  '#f59e0b',
  error:    '#ef4444',
  source:   '#3b82f6',    // blue
  processor:'#8b5cf6',   // purple
  output:   '#ec4899',   // pink
  hub:      '#f97316',   // orange — dual runtime hub
} as const;

// ── Category colours ──────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  'Audio & Music':          '#ec4899',
  'Games & Play':           '#3b82f6',
  'Visuals & 3D':           '#8b5cf6',
  'Coding & Automation':    '#06b6d4',
  'Social & Sharing':       '#22c55e',
  'Data & Analytics':       '#f97316',
  'Publishing & Commerce':  '#eab308',
  'AI & Intelligence':      '#a855f7',
  'Input & Controls':       '#14b8a6',
  'Storage & Syncing':      '#64748b',
  'Science & Simulation':   '#f43f5e',
};

// ── Canvas piece state (adds position + role override) ────────────────────────

interface CanvasPiece extends AtomicPiece {
  x: number;
  y: number;
}

// ── Wire-drawing state ────────────────────────────────────────────────────────

interface WireInProgress {
  fromPieceId: string;
  fromPortId:  string;
  fromX:       number;
  fromY:       number;
  toX:         number;
  toY:         number;
}

// ── §41 DUAL RUNTIME HUB piece ────────────────────────────────────────────────

const DUAL_RUNTIME_HUB: AtomicComponent = {
  id:          'forge-dual-runtime-hub',
  name:        'Dual Runtime Hub',
  description: '§41.3 Enables cross-side communication between HomeDream and DreamSpace VMs.',
  category:    'Science & Simulation',
};

// ── Component ─────────────────────────────────────────────────────────────────

export interface EngineBuilderCanvasProps {
  /** Called with the JSON-serialised assembly when the user saves. */
  onSave?: (json: string) => void;
  /** Pre-load a serialised assembly. */
  initialJson?: string;
}

export default function EngineBuilderCanvas({
  onSave,
  initialJson,
}: EngineBuilderCanvasProps) {
  // ── Sidebar state ──────────────────────────────────────────────────────────

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['Audio & Music']),
  );
  const [searchQuery, setSearchQuery] = useState('');

  // ── Canvas state ──────────────────────────────────────────────────────────

  const [pieces, setPieces] = useState<CanvasPiece[]>(() => {
    if (initialJson) {
      try {
        const asm = deserializeAssembly(initialJson);
        return asm.pieces.map(p: Record<string, unknown>, i: number => ({
          ...p,
          x: 200 + (i % 4) * 180,
          y: 100 + Math.floor(i / 4) * 140,
        }));
      } catch {}
    }
    return [];
  });

  const [wires, setWires]       = useState<Wire[]>(() => {
    if (initialJson) {
      try { return deserializeAssembly(initialJson).wires; }
      catch {}
    }
    return [];
  });

  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [wireInProgress, setWireInProgress] = useState<WireInProgress | null>(null);
  const [dragPieceId, setDragPieceId]       = useState<string | null>(null);
  const [dragOffset, setDragOffset]         = useState({ x: 0, y: 0 });
  const [assembly, setAssembly]             = useState<EngineAssembly | null>(null);
  const [toast, setToast]                   = useState<{ msg: string; ok: boolean } | null>(null);

  const canvasRef = useRef<SVGSVGElement>(null);

  // ── Derived ────────────────────────────────────────────────────────────────

  const categories = useMemo(
    () => Array.from(new Set(COMPONENT_INVENTORY.map((c: Record<string, unknown>) => c.category))),
    [],
  );

  const filteredInventory = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return COMPONENT_INVENTORY.concat(DUAL_RUNTIME_HUB).filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  const validation = useMemo(() => validateAssembly(pieces, wires), [pieces, wires]);

  // ── Helpers ────────────────────────────────────────────────────────────────

  function showToast(msg: string, ok = true {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function inferRole(component: AtomicComponent: AtomicPiece['role'] {
    const name = component.name.toLowerCase();
    if (name.includes('loader') || name.includes('input') || name.includes('source') ||
        name.includes('recorder') || name.includes('handler') || name.includes('reader'))
      return 'source';
    if (name.includes('renderer') || name.includes('output') || name.includes('display') ||
        name.includes('player') || name.includes('publisher') || name.includes('poster'))
      return 'output';
    return 'processor';
  }

  function portColor(role: AtomicPiece['role']: string {
    if (role === 'source')    return C.source;
    if (role === 'output')    return C.output;
    if (role === 'processor') return C.processor;
    return C.hub;
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  const addPiece = useCallback((component: AtomicComponent) => {
    if (pieces.length >= 30) {
      showToast('Maximum 30 pieces per assembly.', false);
      return;
    }
    const role = inferRole(component);
    const piece = atomicPieceFromComponent(component, role);
    const canvas = canvasRef.current?.getBoundingClientRect();
    setPieces(prev: Record<string, unknown> => [
      ...prev,
      {
        ...piece,
        id: `${piece.id}-${Date.now()}`,
        x: 80 + Math.random() * ((canvas?.width ?? 600) - 200),
        y: 80 + Math.random() * ((canvas?.height ?? 400) - 150),
      },
    ]);
  }, [pieces.length]);

  const removePiece = useCallback((pieceId: string) => {
    setPieces(prev: Record<string, unknown> => prev.filter((p: Record<string, unknown>) => p.id !== pieceId));
    setWires(prev: Record<string, unknown> => prev.filter(
      (w) => w.fromPieceId !== pieceId && w.toPieceId !== pieceId,
    ));
    if (selectedPiece === pieceId) setSelectedPiece(null);
  }, [selectedPiece]);

  const startWire = useCallback(
    (pieceId: string, portId: string, x: number, y: number) => {
      setWireInProgress({ fromPieceId: pieceId, fromPortId: portId, fromX: x, fromY: y, toX: x, toY: y });
    },
    [],
  );

  const finishWire = useCallback(
    (toPieceId: string, toPortId: string) => {
      if (!wireInProgress) return;
      if (wireInProgress.fromPieceId === toPieceId) {
        setWireInProgress(null);
        return;
      }
      const wire: Wire = {
        id:          `wire-${Date.now()}`,
        fromPieceId: wireInProgress.fromPieceId,
        fromPortId:  wireInProgress.fromPortId,
        toPieceId,
        toPortId,
      };
      setWires(prev: Record<string, unknown> => [...prev, wire]);
      setWireInProgress(null);
    },
    [wireInProgress],
  );

  const buildAssembly = useCallback(() => {
    try {
      const asm = createAssembly(pieces, wires);
      setAssembly(asm);
      showToast(`Assembly "${asm.id.slice(0, 16)}…" built ✓`, true);
    } catch (err) {
      showToast(String(err).replace('Error: ', ''), false);
    }
  }, [pieces, wires]);

  const saveAssembly = useCallback(() => {
    if (!assembly) {
      showToast('Build the assembly first.', false);
      return;
    }
    const json = serializeAssembly(assembly);
    onSave?.(json);
    // Also trigger download
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `assembly-${assembly.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Assembly saved!', true);
  }, [assembly, onSave]);

  const loadAssembly = useCallback((json: string) => {
    try {
      const asm = deserializeAssembly(json);
      setPieces(asm.pieces.map(p: Record<string, unknown>, i: number => ({
        ...p,
        x: 200 + (i % 4) * 180,
        y: 100 + Math.floor(i / 4) * 140,
      })));
      setWires(asm.wires);
      setAssembly(null);
      showToast('Assembly loaded.', true);
    } catch {
      showToast('Invalid assembly JSON.', false);
    }
  }, []);

  // ── Drag handlers ─────────────────────────────────────────────────────────

  const onPiecePointerDown = useCallback(
    (e: React.PointerEvent, pieceId: string) => {
      if ((e.target as HTMLElement).dataset.port) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      const piece = pieces.find((p: Record<string, unknown>) => p.id === pieceId);
      if (!piece) return;
      setDragPieceId(pieceId);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setSelectedPiece(pieceId);
    },
    [pieces],
  );

  const onCanvasPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragPieceId) {
        const canvas = canvasRef.current?.getBoundingClientRect();
        if (!canvas) return;
        const x = e.clientX - canvas.left - dragOffset.x;
        const y = e.clientY - canvas.top  - dragOffset.y;
        setPieces(prev: Record<string, unknown> =>
          prev.map((p: Record<string, unknown>) => p.id === dragPieceId ? { ...p, x, y } : p),
        );
      }
      if (wireInProgress) {
        const canvas = canvasRef.current?.getBoundingClientRect();
        if (!canvas) return;
        setWireInProgress(prev: Record<string, unknown> => prev ? {
          ...prev,
          toX: e.clientX - canvas.left,
          toY: e.clientY - canvas.top,
        } : null);
      }
    },
    [dragPieceId, dragOffset, wireInProgress],
  );

  const onCanvasPointerUp = useCallback(() => {
    setDragPieceId(null);
    if (wireInProgress) setWireInProgress(null);
  }, [wireInProgress]);

  // ── Render ────────────────────────────────────────────────────────────────

  const PIECE_W  = 160;
  const PIECE_H  = 80;
  const PORT_R   = 6;

  function piecePortPos(piece: CanvasPiece, portId: string, isInput: boolean {
    const ports = isInput ? piece.inputPorts : piece.outputPorts;
    const idx   = ports.findIndex((p: Record<string, unknown>) => p.id === portId);
    const count = ports.length;
    const y     = piece.y + PIECE_H / 2;
    const x     = isInput
      ? piece.x + (PIECE_W * (idx + 1)) / (count + 1) * 0.4
      : piece.x + PIECE_W - (PIECE_W * (idx + 1)) / (count + 1) * 0.4;
    return { x, y };
  }

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        minHeight: 600,
        background: C.bg,
        fontFamily: 'system-ui, sans-serif',
        color: C.text,
        overflow: 'hidden',
        borderRadius: 12,
        border: `1px solid ${C.border2}`,
      }}
    >
      {/* ── Left Sidebar: Piece Palette ─────────────────────────────────── */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          borderRight: `1px solid ${C.border}`,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {/* Header */}
        <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 2, color: C.accent, marginBottom: 8 }}>
            PIECES  <span style={{ color: C.dim, fontWeight: 400 }}>
              {COMPONENT_INVENTORY.length + 1}
            </span>
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search pieces…"
            style={{
              width: '100%',
              background: C.panel,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              padding: '5px 10px',
              color: C.text,
              fontSize: 12,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Category groups */}
        {(searchQuery ? ['Search Results' as ComponentCategory] : categories).map((cat: Record<string, unknown>) => {
          const items = searchQuery
            ? filteredInventory
            : filteredInventory.filter((c: Record<string, unknown>) => c.category === cat);
          if (items.length === 0) return null;
          const expanded = expandedCategories.has(cat);
          return (
            <div key={cat}>
              <button
                onClick={() =>
                  setExpandedCategories(prev: Record<string, unknown> => {
                    const next = new Set(prev);
                    if (next.has(cat)) next.delete(cat); else next.add(cat);
                    return next;
                  })
                }
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: `1px solid ${C.border}`,
                  color: CATEGORY_COLORS[cat] ?? C.accent,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 1,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                {cat.toUpperCase()}
                <span style={{ marginLeft: 'auto', color: C.dim, fontWeight: 400 }}>
                  {items.length}
                </span>
              </button>
              <AnimatePresence>
                {expanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    {items.map((comp: Record<string, unknown>) => (
                      <button
                        key={comp.id}
                        onClick={() => addPiece(comp)}
                        title={comp.description}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '6px 14px 6px 22px',
                          background: 'transparent',
                          border: 'none',
                          borderBottom: `1px solid ${C.border}`,
                          color: C.text,
                          fontSize: 12,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.background = C.panel2;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                        }}
                      >
                        <Plus size={10} color={CATEGORY_COLORS[comp.category] ?? C.accent} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {comp.name}
                        </span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* ── Central Canvas ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 14px',
            borderBottom: `1px solid ${C.border}`,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 11, color: C.dim }}>
            {pieces.length}/30 pieces · {wires.length} wires
          </span>

          {/* Validation indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8 }}>
            {validation.valid ? (
              <CheckCircle2 size={14} color={C.success} />
            ) : (
              <AlertTriangle size={14} color={C.warning} />
            )}
            <span style={{ fontSize: 11, color: validation.valid ? C.success : C.warning }}>
              {validation.valid ? 'Valid' : validation.errors[0]}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Action buttons */}
          <ToolbarBtn icon={<Trash2 size={13} />} label="Clear" danger onClick={() => {
            setPieces([]); setWires([]); setAssembly(null);
          }} />
          <ToolbarBtn icon={<Upload size={13} />} label="Load" onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = () => {
              const file = input.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = e: unknown => loadAssembly(String(e.target?.result ?? ''));
              reader.readAsText(file);
            };
            input.click();
          }} />
          <ToolbarBtn icon={<Play size={13} />} label="Build" accent={C.accent} onClick={buildAssembly} />
          <ToolbarBtn icon={<Save size={13} />} label="Save JSON" accent={C.success} onClick={saveAssembly} />
        </div>

        {/* SVG canvas */}
        <svg
          ref={canvasRef}
          style={{ flex: 1, background: 'transparent', userSelect: 'none', cursor: dragPieceId ? 'grabbing' : 'default' }}
          onPointerMove={onCanvasPointerMove}
          onPointerUp={onCanvasPointerUp}
          onClick={() => setSelectedPiece(null)}
        >
          {/* Wire connections */}
          {wires.map((wire: Record<string, unknown>) => {
            const fromPiece = pieces.find((p: Record<string, unknown>) => p.id === wire.fromPieceId);
            const toPiece   = pieces.find((p: Record<string, unknown>) => p.id === wire.toPieceId);
            if (!fromPiece || !toPiece) return null;
            const from = piecePortPos(fromPiece, wire.fromPortId, false);
            const to   = piecePortPos(toPiece,   wire.toPortId,   true);
            const cx   = (from.x + to.x) / 2;
            return (
              <g key={wire.id}>
                <path
                  d={`M ${from.x} ${from.y} C ${cx} ${from.y} ${cx} ${to.y} ${to.x} ${to.y}`}
                  stroke={C.accent}
                  strokeWidth={2}
                  fill="none"
                  opacity={0.7}
                />
                {/* Delete wire on click */}
                <path
                  d={`M ${from.x} ${from.y} C ${cx} ${from.y} ${cx} ${to.y} ${to.x} ${to.y}`}
                  stroke="transparent"
                  strokeWidth={12}
                  fill="none"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setWires(prev: Record<string, unknown> => prev.filter((w: Record<string, unknown>) => w.id !== wire.id));
                  }}
                />
              </g>
            );
          })}

          {/* In-progress wire */}
          {wireInProgress && (
            <path
              d={`M ${wireInProgress.fromX} ${wireInProgress.fromY} C ${
                (wireInProgress.fromX + wireInProgress.toX) / 2
              } ${wireInProgress.fromY} ${
                (wireInProgress.fromX + wireInProgress.toX) / 2
              } ${wireInProgress.toY} ${wireInProgress.toX} ${wireInProgress.toY}`}
              stroke={C.warning}
              strokeWidth={2}
              strokeDasharray="6 3"
              fill="none"
              pointerEvents="none"
            />
          )}

          {/* Pieces */}
          {pieces.map((piece: Record<string, unknown>) => {
            const pc    = portColor(piece.role);
            const isDef = selectedPiece === piece.id;

            return (
              <g key={piece.id}>
                {/* Piece card */}
                <foreignObject
                  x={piece.x}
                  y={piece.y}
                  width={PIECE_W}
                  height={PIECE_H}
                  style={{ overflow: 'visible' }}
                >
                  <div
                    onPointerDown={(e) => onPiecePointerDown(e, piece.id)}
                    style={{
                      width: PIECE_W,
                      height: PIECE_H,
                      background: isDef ? C.panel2 : C.panel,
                      border: `1.5px solid ${isDef ? pc : C.border}`,
                      borderRadius: 8,
                      padding: '6px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      cursor: 'grab',
                      boxShadow: isDef ? `0 0 12px ${pc}44` : 'none',
                      transition: 'box-shadow 0.2s',
                    }}
                    onClick={(e) => { e.stopPropagation(); setSelectedPiece(piece.id); }}
                  >
                    {/* Role badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: 1,
                        color: pc,
                        background: `${pc}22`,
                        borderRadius: 3,
                        padding: '1px 5px',
                      }}>
                        {piece.role.toUpperCase()}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removePiece(piece.id); }}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          color: C.dim,
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                    {/* Name */}
                    <span style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: C.text,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {piece.name}
                    </span>
                    {/* Category */}
                    <span style={{ fontSize: 10, color: C.dim, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {piece.category}
                    </span>
                  </div>
                </foreignObject>

                {/* Input ports (left side) */}
                {piece.inputPorts.map(port: Record<string, unknown>, idx: number => {
                  const { x, y } = piecePortPos(piece, port.id, true);
                  return (
                    <g key={`in-${port.id}`}>
                      <circle
                        cx={x} cy={y} r={PORT_R}
                        fill={C.panel2}
                        stroke={pc}
                        strokeWidth={1.5}
                        style={{ cursor: 'crosshair' }}
                        data-port="in"
                        onPointerUp={(e) => {
                          e.stopPropagation();
                          finishWire(piece.id, port.id);
                        }}
                      />
                      <title>{port.label} (in)</title>
                    </g>
                  );
                })}

                {/* Output ports (right side) */}
                {piece.outputPorts.map(port: Record<string, unknown>, idx: number => {
                  const { x, y } = piecePortPos(piece, port.id, false);
                  return (
                    <g key={`out-${port.id}`}>
                      <circle
                        cx={x} cy={y} r={PORT_R}
                        fill={pc}
                        stroke={pc}
                        strokeWidth={1.5}
                        style={{ cursor: 'crosshair' }}
                        data-port="out"
                        onPointerDown={(e) => {
                          e.stopPropagation();
                          startWire(piece.id, port.id, x, y);
                        }}
                      />
                      <title>{port.label} (out)</title>
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Empty state */}
          {pieces.length === 0 && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={C.dim}
              fontSize={13}
            >
              ← Drag pieces from the sidebar to start building
            </text>
          )}
        </svg>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{
              position: 'absolute',
              bottom: 16,
              right: 16,
              background: toast.ok ? C.success : C.error,
              color: '#fff',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              zIndex: 999,
            }}
          >
            {toast.ok ? <Check size={14} /> : <AlertTriangle size={14} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Toolbar button helper ─────────────────────────────────────────────────────

function ToolbarBtn({
  icon, label, onClick, accent, danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  accent?: string;
  danger?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const color = danger ? '#ef4444' : accent ?? 'rgba(255,255,255,0.7)';
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        padding: '5px 10px',
        background: hover ? `${color}22` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hover ? color : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 6,
        color,
        fontSize: 12,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {icon}
      {label}
    </button>
  );
}
