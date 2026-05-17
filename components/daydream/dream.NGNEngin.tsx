'use client';

/**
 * NGNEngin — Visual Engine Builder (Engin Forge)
 *
 * Repurposed from ForgeEngin concept: a drag-and-drop visual builder
 * where users compose engines from 120+ atomic pieces, connect ports,
 * test in sandbox, and publish to DreamMarketplace.
 *
 * Rules:
 *  - Min 3 pieces (source + processor + output)
 *  - Max 30 pieces per engine
 *  - Each assembly has its own local event bus
 *  - "Dual Runtime Hub" piece enables cross-side communication
 *
 * Feature 41.
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type MouseEvent as ReactMouseEvent,
  type DragEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Play, Save, Share2, ChevronDown, ChevronRight,
  Zap, Cpu, Music, Eye, Bot, Gamepad2, Users, Wrench,
  AlertCircle, CheckCircle2, Boxes,
} from 'lucide-react';
import {
  PIECE_REGISTRY,
  PIECE_CATEGORIES,
  getPiecesByCategory,
  getPiece,
  type PieceManifest,
  type PieceCategory,
  type Port,
} from '@/lib/forge-ngn/piece-registry';
import {
  createAssembly,
  addPiece,
  removePiece,
  movePiece,
  addConnection,
  removeConnection,
  serializeAssembly,
  validateAssembly,
  isValidAssembly,
  type EngineAssembly,
  type PlacedPiece,
  type Connection,
} from '@/lib/forge-ngn/assembly';
import { createEventBus, bridgeBuses } from '@/lib/event-bus';

// ── Design tokens ─────────────────────────────────────────────────────────────

const T = {
  bg:       '#09090f',
  sidebar:  'rgba(255,255,255,0.03)',
  canvas:   'rgba(255,255,255,0.02)',
  card:     'rgba(255,255,255,0.06)',
  border:   'rgba(255,255,255,0.10)',
  text:     'rgba(255,255,255,0.88)',
  muted:    'rgba(255,255,255,0.45)',
  accent:   '#7c6cff',
  accentLo: 'rgba(124,108,255,0.18)',
  error:    '#ff5e5e',
  success:  '#4ade80',
};

// ── Category icons ─────────────────────────────────────────────────────────────

const CAT_ICON: Record<PieceCategory, React.ReactNode> = {
  Audio:   <Music   size={13} />,
  Visual:  <Eye     size={13} />,
  AI:      <Bot     size={13} />,
  Game:    <Gamepad2 size={13} />,
  Social:  <Users   size={13} />,
  Utility: <Wrench  size={13} />,
  Runtime: <Cpu     size={13} />,
};

const CAT_COLOR: Record<PieceCategory, string> = {
  Audio:   '#f472b6',
  Visual:  '#60a5fa',
  AI:      '#a78bfa',
  Game:    '#fb923c',
  Social:  '#34d399',
  Utility: '#facc15',
  Runtime: '#7c6cff',
};

// ── Role badge ────────────────────────────────────────────────────────────────

const ROLE_COLOR: Record<PieceManifest['role'], string> = {
  source:    '#34d399',
  processor: '#60a5fa',
  output:    '#fb923c',
};

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  onBack?: () => void;
}

interface PendingConnection {
  fromInstanceId: string;
  fromPortId: string;
}

export default function NGNEngin({ onBack }: Props) {
  const [assembly, setAssembly]           = useState<EngineAssembly>(() => createAssembly('My Engine'));
  const [expandedCats, setExpandedCats]   = useState<Set<PieceCategory>>(new Set(['Audio']));
  const [search, setSearch]               = useState('');
  const [pending, setPending]             = useState<PendingConnection | null>(null);
  const [sandboxOpen, setSandboxOpen]     = useState(false);
  const [saved, setSaved]                 = useState(false);
  const [shareUrl, setShareUrl]           = useState<string | null>(null);
  const [draggingId, setDraggingId]       = useState<string | null>(null);
  const [dragOffset, setDragOffset]       = useState({ x: 0, y: 0 });
  const canvasRef                         = useRef<HTMLDivElement>(null);
  const busRef                            = useRef(createEventBus());

  // Wire dual-runtime hub if present
  useEffect(() => {
    const hasDualHub = assembly.pieces.some((p: Record<string, unknown>) => p.pieceId === 'runtime.dual-hub');
    if (!hasDualHub) return;
    const busB = createEventBus();
    const dispose = bridgeBuses(busRef.current, busB, [], []);
    return dispose;
  }, [assembly.pieces]);

  const errors = validateAssembly(assembly);
  const valid  = errors.length === 0;

  // ── Sidebar helpers ──────────────────────────────────────────────────────────

  const filteredPieces = useCallback((cat: PieceCategory): PieceManifest[] => {
    const base = getPiecesByCategory(cat);
    if (!search) return base;
    const q = search.toLowerCase();
    return base.filter((p: Record<string, unknown>) => p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }, [search]);

  const toggleCat = (cat: PieceCategory) => {
    setExpandedCats((prev: Record<string, unknown>) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  // ── Canvas drag-drop ─────────────────────────────────────────────────────────

  const handleCanvasDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pieceId = e.dataTransfer.getData('pieceId');
    if (!pieceId) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left - 75;
    const y = e.clientY - rect.top  - 24;
    const result = addPiece(assembly, pieceId, x, y);
    if ('error' in result) return;
    setAssembly(result.assembly);
  };

  const handlePieceMouseDown = (e: ReactMouseEvent, instanceId: string) => {
    e.stopPropagation();
    const placed = assembly.pieces.find((p: Record<string, unknown>) => p.instanceId === instanceId);
    if (!placed) return;
    setDraggingId(instanceId);
    setDragOffset({ x: e.clientX - placed.x, y: e.clientY - placed.y });
  };

  const handleCanvasMouseMove = useCallback((e: ReactMouseEvent) => {
    if (!draggingId) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top  - dragOffset.y;
    setAssembly((a: Record<string, unknown>) => movePiece(a, draggingId, x, y));
  }, [draggingId, dragOffset]);

  const handleCanvasMouseUp = () => setDraggingId(null);

  // ── Port wiring ──────────────────────────────────────────────────────────────

  const handlePortClick = (instanceId: string, portId: string, isInput: boolean) => {
    if (!isInput && !pending) {
      setPending({ fromInstanceId: instanceId, fromPortId: portId });
      return;
    }
    if (isInput && pending) {
      setAssembly((a: Record<string, unknown>) => addConnection(a, pending.fromInstanceId, pending.fromPortId, instanceId, portId));
      setPending(null);
    }
  };

  // ── Actions ──────────────────────────────────────────────────────────────────

  const handleSave = () => {
    const json = serializeAssembly(assembly);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${assembly.name.replace(/\s+/g, '-')}.ngn.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePublish = () => {
    const json = serializeAssembly(assembly);
    const encoded = btoa(encodeURIComponent(json));
    setShareUrl(`${window.location.origin}/marketplace?assembly=${encoded}`);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100%', background: T.bg, color: T.text, fontFamily: 'inherit', overflow: 'hidden' }}>

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <aside style={{ width: 240, borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', background: T.sidebar, flexShrink: 0 }}>

        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Boxes size={16} color={T.accent} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Pieces</span>
          <span style={{ marginLeft: 'auto', fontSize: 11, color: T.muted }}>{PIECE_REGISTRY.length}</span>
          {onBack && (
            <button onClick={onBack} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', marginLeft: 4 }}>
              <X size={14} />
            </button>
          )}
        </div>

        {/* Search */}
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${T.border}` }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pieces…"
            style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: `1px solid ${T.border}`, borderRadius: 6, padding: '5px 8px', fontSize: 12, color: T.text, outline: 'none', boxSizing: 'border-box' }}
          />
        </div>

        {/* Category list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {PIECE_CATEGORIES.map((cat: Record<string, unknown>) => {
            const items = filteredPieces(cat);
            if (items.length === 0) return null;
            const expanded = expandedCats.has(cat);
            return (
              <div key={cat}>
                <button
                  onClick={() => toggleCat(cat)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'none', border: 'none', color: CAT_COLOR[cat], cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                >
                  {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  {CAT_ICON[cat]}
                  {cat}
                  <span style={{ marginLeft: 'auto', color: T.muted, fontWeight: 400 }}>{items.length}</span>
                </button>
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: 'hidden' }}
                    >
                      {items.map((piece: Record<string, unknown>) => (
                        <div
                          key={piece.id}
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('pieceId', piece.id)}
                          title={piece.description}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 20px', fontSize: 11, cursor: 'grab', color: T.text }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = T.accentLo; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: ROLE_COLOR[piece.role], flexShrink: 0 }} />
                          {piece.label}
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ padding: '10px 14px', borderTop: `1px solid ${T.border}`, fontSize: 10, color: T.muted, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {(['source', 'processor', 'output'] as const).map((role: Record<string, unknown>) => (
            <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: ROLE_COLOR[role] }} />
              {role}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${T.border}`, background: T.sidebar, flexShrink: 0 }}>
          <Zap size={16} color={T.accent} />
          <input
            value={assembly.name}
            onChange={(e) => setAssembly((a: Record<string, unknown>) => ({ ...a, name: e.target.value }))}
            style={{ background: 'transparent', border: 'none', color: T.text, fontSize: 14, fontWeight: 600, outline: 'none', width: 180 }}
          />

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Validation badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: valid ? T.success : T.error }}>
              {valid ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
              {valid ? 'Valid' : `${errors.length} error${errors.length > 1 ? 's' : ''}`}
            </div>

            <span style={{ color: T.border }}>|</span>
            <span style={{ fontSize: 11, color: T.muted }}>{assembly.pieces.length}/{30} pieces</span>

            <button
              onClick={() => setSandboxOpen(true)}
              disabled={!valid}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, background: valid ? T.accentLo : 'rgba(255,255,255,0.04)', border: `1px solid ${valid ? T.accent : T.border}`, color: valid ? T.accent : T.muted, cursor: valid ? 'pointer' : 'not-allowed', fontSize: 12 }}
            >
              <Play size={12} /> Test
            </button>
            <button
              onClick={handleSave}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, background: T.accentLo, border: `1px solid ${T.accent}`, color: T.accent, cursor: 'pointer', fontSize: 12 }}
            >
              <Save size={12} /> {saved ? 'Saved!' : 'Save'}
            </button>
            <button
              onClick={handlePublish}
              disabled={!valid}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, background: valid ? '#34d39922' : 'rgba(255,255,255,0.04)', border: `1px solid ${valid ? T.success : T.border}`, color: valid ? T.success : T.muted, cursor: valid ? 'pointer' : 'not-allowed', fontSize: 12 }}
            >
              <Share2 size={12} /> Publish
            </button>
          </div>
        </div>

        {/* Validation errors */}
        <AnimatePresence>
          {errors.length > 0 && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden', flexShrink: 0 }}>
              <div style={{ padding: '6px 16px', background: 'rgba(255,94,94,0.08)', borderBottom: '1px solid rgba(255,94,94,0.25)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {errors.map(err: Record<string, unknown>, (i: number ) => (
                  <span key={i} style={{ fontSize: 11, color: T.error }}>{err.message}</span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Canvas */}
        <div
          ref={canvasRef}
          style={{ flex: 1, position: 'relative', overflow: 'hidden', background: T.canvas, backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px', cursor: draggingId ? 'grabbing' : 'default' }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleCanvasDrop}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        >
          {/* SVG connection lines */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
            {assembly.connections.map((conn: Record<string, unknown>) => {
              const from = assembly.pieces.find((p: Record<string, unknown>) => p.instanceId === conn.fromInstanceId);
              const to   = assembly.pieces.find((p: Record<string, unknown>) => p.instanceId === conn.toInstanceId);
              if (!from || !to) return null;
              const x1 = from.x + 150; const y1 = from.y + 24;
              const x2 = to.x;         const y2 = to.y + 24;
              const cx = (x1 + x2) / 2;
              return (
                <path
                  key={conn.id}
                  d={`M${x1},${y1} C${cx},${y1} ${cx},${y2} ${x2},${y2}`}
                  stroke={T.accent}
                  strokeWidth={1.5}
                  fill="none"
                  opacity={0.6}
                />
              );
            })}
          </svg>

          {/* Placed pieces */}
          {assembly.pieces.map((placed: Record<string, unknown>) => (
            <PlacedPieceCard
              key={placed.instanceId}
              placed={placed}
              pending={pending}
              onMouseDown={(e) => handlePieceMouseDown(e, placed.instanceId)}
              onRemove={() => setAssembly((a: Record<string, unknown>) => removePiece(a, placed.instanceId))}
              onPortClick={handlePortClick}
            />
          ))}

          {/* Empty state */}
          {assembly.pieces.length === 0 && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ textAlign: 'center', color: T.muted }}>
                <Plus size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                <div style={{ fontSize: 13 }}>Drag pieces from the sidebar onto the canvas</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Min 3 pieces · Max 30 pieces</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Sandbox overlay ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sandboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, width: '80vw', maxWidth: 900, height: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
                <Play size={14} color={T.accent} />
                <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600 }}>Sandbox — {assembly.name}</span>
                <button onClick={() => setSandboxOpen(false)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: T.muted, cursor: 'pointer' }}><X size={16} /></button>
              </div>
              <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
                <div style={{ background: T.card, borderRadius: 8, padding: 16, fontSize: 12, color: T.muted, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {`Assembly: ${assembly.name}\nPieces: ${assembly.pieces.length}\nConnections: ${assembly.connections.length}\n\nPieces:\n${assembly.pieces.map((p: Record<string, unknown>) => `  • ${p.pieceId} @ (${Math.round(p.x)}, ${Math.round(p.y)})`).join('\n')}\n\nConnections:\n${assembly.connections.map((c: Record<string, unknown>) => `  • ${c.fromInstanceId.slice(0,6)}:${c.fromPortId} → ${c.toInstanceId.slice(0,6)}:${c.toPortId}`).join('\n') || '  (none)'}`}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Share URL modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {shareUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShareUrl(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, width: 480, display: 'flex', flexDirection: 'column', gap: 12 }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>Published to DreamMarketplace</div>
              <input
                readOnly
                value={shareUrl}
                style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, padding: '8px 12px', fontSize: 11, color: T.text, width: '100%', boxSizing: 'border-box', fontFamily: 'monospace' }}
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() => { navigator.clipboard.writeText(shareUrl); }}
                style={{ padding: '8px 16px', borderRadius: 6, background: T.accentLo, border: `1px solid ${T.accent}`, color: T.accent, cursor: 'pointer', fontSize: 12 }}
              >
                Copy Link
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── PlacedPieceCard ───────────────────────────────────────────────────────────

const T2 = {
  bg:       '#09090f',
  card:     'rgba(255,255,255,0.06)',
  border:   'rgba(255,255,255,0.10)',
  text:     'rgba(255,255,255,0.88)',
  muted:    'rgba(255,255,255,0.45)',
  accent:   '#7c6cff',
  accentLo: 'rgba(124,108,255,0.18)',
};

const ROLE_COLOR2: Record<PieceManifest['role'], string> = {
  source:    '#34d399',
  processor: '#60a5fa',
  output:    '#fb923c',
};

const CAT_COLOR2: Record<PieceCategory, string> = {
  Audio:   '#f472b6',
  Visual:  '#60a5fa',
  AI:      '#a78bfa',
  Game:    '#fb923c',
  Social:  '#34d399',
  Utility: '#facc15',
  Runtime: '#7c6cff',
};

interface PlacedPieceCardProps {
  placed: PlacedPiece;
  pending: PendingConnection | null;
  onMouseDown: (e: ReactMouseEvent) => void;
  onRemove: () => void;
  onPortClick: (instanceId: string, portId: string, isInput: boolean) => void;
}

function PlacedPieceCard({ placed, pending: Record<string, unknown>, onMouseDown: Record<string, unknown>, onRemove: Record<string, unknown>, onPortClick }: PlacedPieceCardProps) {
  const [hovered, setHovered] = useState(false);

  const manifest = getPiece(placed.pieceId);
  if (!manifest) return null;

  const catColor  = CAT_COLOR2[manifest.category as PieceCategory];
  const roleColor = ROLE_COLOR2[manifest.role as PieceManifest['role']];

  return (
    <div
      style={{
        position: 'absolute',
        left: placed.x,
        top: placed.y,
        width: 150,
        background: T2.card,
        border: `1px solid ${pending?.fromInstanceId === placed.instanceId ? T2.accent : T2.border}`,
        borderRadius: 8,
        userSelect: 'none',
        cursor: 'grab',
        boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.5)' : undefined,
        transition: 'box-shadow 0.15s',
      }}
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 8px', borderBottom: `1px solid ${T2.border}` }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: roleColor, flexShrink: 0 }} />
        <span style={{ fontSize: 10, fontWeight: 600, color: catColor, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{manifest.label}</span>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={onRemove}
          style={{ background: 'none', border: 'none', color: T2.muted, cursor: 'pointer', padding: 0, lineHeight: 1 }}
        >
          <X size={10} />
        </button>
      </div>

      {/* Ports */}
      <div style={{ display: 'flex', padding: '4px 0' }}>
        {/* Input ports */}
        <div style={{ flex: 1 }}>
          {manifest.inputPorts.map((port: Port) => (
            <div
              key={port.id}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => onPortClick(placed.instanceId, port.id, true)}
              title={`In: ${port.label}`}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', cursor: 'crosshair' }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: T2.border, border: `1.5px solid ${T2.muted}`, flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: T2.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{port.label}</span>
            </div>
          ))}
        </div>
        {/* Output ports */}
        <div style={{ flex: 1, alignItems: 'flex-end', display: 'flex', flexDirection: 'column' }}>
          {manifest.outputPorts.map((port: Port) => (
            <div
              key={port.id}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => onPortClick(placed.instanceId, port.id, false)}
              title={`Out: ${port.label}`}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px', cursor: 'crosshair', flexDirection: 'row-reverse' }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: T2.accent, border: `1.5px solid ${T2.accentLo}`, flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: T2.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{port.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
