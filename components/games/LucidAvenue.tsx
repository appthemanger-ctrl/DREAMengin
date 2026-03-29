'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useGameAutoStart, useSubmitScore } from '@/lib/games/hooks';
import {
  LUCID_AVENUE_DISTRICTS,
  calculateLucidAvenueScore,
  createInitialLucidAvenueState,
  getLucidAvenueCompletionPercent,
  getLucidAvenueDistrict,
  getLucidAvenueMissionChecklist,
  getLucidAvenueObjectiveKeys,
  getLucidAvenuePatrolPathKeys,
  getLucidAvenuePatrolPositions,
  interactInLucidAvenue,
  isSamePosition,
  moveLucidAvenuePlayer,
  scanLucidAvenue,
  waitLucidAvenueTurn,
  type LucidAvenueState,
  type Position,
} from '@/lib/games/lucid-avenue-world';

type Phase = 'menu' | 'playing' | 'win' | 'lose';

const MAP_CELL_SIZE = 34;

export default function LucidAvenue() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [state, setState] = useState<LucidAvenueState>(() => createInitialLucidAvenueState());
  const submitScore = useSubmitScore('lucid-avenue');

  const district = useMemo(() => getLucidAvenueDistrict(state.districtId), [state.districtId]);
  const patrols = useMemo(() => getLucidAvenuePatrolPositions(state), [state]);
  const patrolPathKeys = useMemo(() => getLucidAvenuePatrolPathKeys(state.districtId), [state.districtId]);
  const objectiveKeys = useMemo(() => getLucidAvenueObjectiveKeys(state), [state]);
  const missions = useMemo(() => getLucidAvenueMissionChecklist(state), [state]);
  const score = useMemo(() => calculateLucidAvenueScore(state), [state]);
  const completion = useMemo(() => getLucidAvenueCompletionPercent(state), [state]);

  const startGame = useCallback(() => {
    setState(createInitialLucidAvenueState());
    setPhase('playing');
  }, []);

  useGameAutoStart(phase === 'menu' ? startGame : null);

  useEffect(() => {
    if (phase === 'menu') return;
    if (state.outcome === 'win') setPhase('win');
    if (state.outcome === 'lose') setPhase('lose');
  }, [phase, state.outcome]);

  useEffect(() => {
    if (phase === 'win' || phase === 'lose') {
      submitScore(score, state.shards.length);
    }
  }, [phase, score, state.shards.length, submitScore]);

  const runStateAction = useCallback((updater: (current: LucidAvenueState) => LucidAvenueState) => {
    setState((current) => updater(current));
  }, []);

  const move = useCallback((dx: number, dy: number) => {
    if (phase !== 'playing') return;
    runStateAction((current) => moveLucidAvenuePlayer(current, dx, dy));
  }, [phase, runStateAction]);

  const interact = useCallback(() => {
    if (phase !== 'playing') return;
    runStateAction((current) => interactInLucidAvenue(current));
  }, [phase, runStateAction]);

  const scan = useCallback(() => {
    if (phase !== 'playing') return;
    runStateAction((current) => scanLucidAvenue(current));
  }, [phase, runStateAction]);

  const wait = useCallback(() => {
    if (phase !== 'playing') return;
    runStateAction((current) => waitLucidAvenueTurn(current));
  }, [phase, runStateAction]);

  useEffect(() => {
    if (phase !== 'playing') return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        event.preventDefault();
        move(0, -1);
      } else if (key === 'arrowdown' || key === 's') {
        event.preventDefault();
        move(0, 1);
      } else if (key === 'arrowleft' || key === 'a') {
        event.preventDefault();
        move(-1, 0);
      } else if (key === 'arrowright' || key === 'd') {
        event.preventDefault();
        move(1, 0);
      } else if (key === ' ' || key === 'enter') {
        event.preventDefault();
        interact();
      } else if (key === 'q') {
        event.preventDefault();
        scan();
      } else if (key === 'e') {
        event.preventDefault();
        wait();
      } else if (key === 'r') {
        event.preventDefault();
        startGame();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [interact, move, phase, scan, startGame, wait]);

  const districtVisitedCount = state.visitedDistrictIds.length;
  const scanActive = state.scanTurns > 0;
  const featuredDistricts = Object.values(LUCID_AVENUE_DISTRICTS);

  if (phase === 'menu') {
    return (
      <div style={{ ...shellStyle, padding: 24, gap: 18 }}>
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={pillStyle}>🌴 Lucid Avenue · full city run</div>
          <div style={{ fontSize: 34, fontWeight: 900, color: '#fde68a', letterSpacing: '-0.05em', lineHeight: 0.95 }}>
            A much fuller
            <br />
            original LA-inspired
            <br />
            handheld-style adventure.
          </div>
          <div style={{ maxWidth: 760, color: 'rgba(226,232,240,0.84)', fontSize: 13, lineHeight: 1.8 }}>
            This is an original LA-inspired retro city quest, expanded far beyond the tiny earlier slice:
            six districts, deterministic patrol routes, shard recovery, NPC-gated progression, relay terminals,
            skyline keys, observatory finale, and a full mission loop built for DREAMengin.
            It is not a copy of the archive’s copyrighted content.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          {[
            '6 connected districts',
            '6 signal shards',
            '5 quest flags',
            'Patrol rhythm stealth',
            'NPC + terminal progression',
            'Dedicated observatory finale',
          ].map((item) => (
            <div key={item} style={chipStyle}>
              {item}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          {featuredDistricts.map((entry) => (
            <div
              key={entry.id}
              style={{
                borderRadius: 16,
                padding: 12,
                border: '1px solid rgba(148,163,184,0.16)',
                background: 'rgba(15,23,42,0.72)',
                display: 'grid',
                gap: 6,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: 13 }}>{entry.name}</div>
                <div style={{ width: 10, height: 10, borderRadius: 999, background: entry.color }} />
              </div>
              <div style={{ color: 'rgba(226,232,240,0.62)', fontSize: 11, lineHeight: 1.6 }}>{entry.subtitle}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          <button onClick={startGame} style={primaryButtonStyle}>
            ▶ Start the full Lucid run
          </button>
          <div style={{ ...chipStyle, minHeight: 46, alignItems: 'center', display: 'flex' }}>
            Keyboard / remote: move · Space interact · Q scan · E wait
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...shellStyle, padding: 16, gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'grid', gap: 4 }}>
          <div style={pillStyle}>🌴 Lucid Avenue · full city route online</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#fde68a' }}>
            {district.name}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.72)', maxWidth: 720 }}>{district.subtitle}</div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <StatChip label="Score" value={score.toLocaleString()} accent="#f59e0b" />
          <StatChip label="Completion" value={`${completion}%`} accent="#22c55e" />
          <StatChip label="Districts" value={`${districtVisitedCount}/6`} accent="#38bdf8" />
          <button onClick={startGame} style={secondaryButtonStyle}>Restart</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.9fr)', gap: 14 }}>
        <div style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ color: '#f8fafc', fontWeight: 800, fontSize: 14 }}>City grid</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <MiniChip text={`Turn ${state.turn}`} />
              <MiniChip text={`${state.shards.length}/6 shards`} />
              <MiniChip text={`Battery ${state.battery}`} />
              <MiniChip text={`Heat ${state.heat}/${6}`} tone={state.heat >= 4 ? '#f87171' : '#facc15'} />
              <MiniChip text={scanActive ? `Scan +${state.scanTurns}` : 'Scan idle'} tone={scanActive ? '#67e8f9' : '#94a3b8'} />
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${district.map[0].length}, ${MAP_CELL_SIZE}px)`,
              gap: 4,
              justifyContent: 'center',
              padding: 8,
              overflowX: 'auto',
            }}
          >
            {district.map.flatMap((row, y) => (
              row.split('').map((tile, x) => renderCell({
                tile,
                position: { x, y },
                state,
                patrols,
                objectiveKeys,
                patrolPathKeys,
                phase,
              }))
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              '😎 runner',
              '✨ shard',
              '📦 cache',
              '🚓 patrol',
              '🖥️ terminal',
              '⇢ district exit',
            ].map((item) => <MiniChip key={item} text={item} />)}
          </div>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div style={panelStyle}>
            <div style={sectionHeadingStyle}>Mission status</div>
            <div style={{ fontSize: 12, color: '#e2e8f0', lineHeight: 1.7 }}>{state.message}</div>
            <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
              {missions.map((item) => (
                <div key={item} style={{ fontSize: 12, color: item.startsWith('✅') ? '#86efac' : '#e2e8f0' }}>{item}</div>
              ))}
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sectionHeadingStyle}>District briefing</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {district.atmosphere.map((entry) => (
                <div key={entry} style={{ fontSize: 12, color: 'rgba(226,232,240,0.78)', lineHeight: 1.65 }}>
                  • {entry}
                </div>
              ))}
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sectionHeadingStyle}>Resources</div>
            <div style={{ display: 'grid', gap: 8 }}>
              <BarRow label="Heat" value={state.heat} max={6} color={state.heat >= 4 ? '#ef4444' : '#f59e0b'} />
              <BarRow label="Battery" value={state.battery} max={6} color="#38bdf8" />
              <BarRow label="Shards" value={state.shards.length} max={6} color="#c084fc" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginTop: 10 }}>
              <MiniMetric label="Credits" value={`${state.credits}`} />
              <MiniMetric label="Visited" value={`${districtVisitedCount}/6`} />
              <MiniMetric label="Flags" value={`${Object.values(state.flags).filter(Boolean).length}/5`} />
              <MiniMetric label="State" value={phase === 'playing' ? 'Active' : phase === 'win' ? 'Won' : 'Burned'} />
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sectionHeadingStyle}>Controls</div>
            <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
              <button onClick={() => move(0, -1)} disabled={phase !== 'playing'} style={controlButtonStyle}>↑</button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => move(-1, 0)} disabled={phase !== 'playing'} style={controlButtonStyle}>←</button>
                <button onClick={() => move(0, 1)} disabled={phase !== 'playing'} style={controlButtonStyle}>↓</button>
                <button onClick={() => move(1, 0)} disabled={phase !== 'playing'} style={controlButtonStyle}>→</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, width: '100%' }}>
                <button onClick={interact} disabled={phase !== 'playing'} style={actionButtonStyle}>Interact</button>
                <button onClick={scan} disabled={phase !== 'playing'} style={actionButtonStyle}>Scan</button>
                <button onClick={wait} disabled={phase !== 'playing'} style={actionButtonStyle}>Wait</button>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.6)', textAlign: 'center' }}>
                Shared GameRemote directions work in the dedicated play session.
                Keyboard extras: Space / Enter interact, Q scan, E wait, R restart.
              </div>
            </div>
          </div>

          <div style={panelStyle}>
            <div style={sectionHeadingStyle}>Run log</div>
            <div style={{ display: 'grid', gap: 6 }}>
              {state.log.map((entry) => (
                <div key={entry} style={{ fontSize: 11, color: 'rgba(226,232,240,0.78)', lineHeight: 1.6 }}>
                  {entry}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {(phase === 'win' || phase === 'lose') && (
        <div
          style={{
            borderRadius: 18,
            padding: 16,
            border: `1px solid ${phase === 'win' ? 'rgba(74,222,128,0.35)' : 'rgba(248,113,113,0.35)'}`,
            background: phase === 'win'
              ? 'linear-gradient(135deg, rgba(20,83,45,0.45), rgba(8,47,73,0.55))'
              : 'linear-gradient(135deg, rgba(127,29,29,0.55), rgba(30,41,59,0.72))',
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 900, color: phase === 'win' ? '#86efac' : '#fca5a5' }}>
            {phase === 'win' ? 'Observatory synced.' : 'Route burned.'}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(248,250,252,0.82)', lineHeight: 1.7 }}>
            {phase === 'win'
              ? `Lucid Angeles lights back up after ${state.turn} turns with ${state.shards.length}/6 shards, ${state.credits} credits, and a final score of ${score.toLocaleString()}.`
              : `Heat capped out after ${state.turn} turns. Reset the run, route cleaner through the patrol rhythm, and try again.`}
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={startGame} style={primaryButtonStyle}>
              {phase === 'win' ? '▶ Run it again' : '↺ Retry route'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function renderCell({
  tile,
  position,
  state,
  patrols,
  objectiveKeys,
  patrolPathKeys,
  phase,
}: {
  tile: string;
  position: Position;
  state: LucidAvenueState;
  patrols: ReturnType<typeof getLucidAvenuePatrolPositions>;
  objectiveKeys: Set<string>;
  patrolPathKeys: Set<string>;
  phase: Phase;
}) {
  const district = getLucidAvenueDistrict(state.districtId);
  const playerHere = isSamePosition(state.player, position);
  const patrolHere = patrols.find((patrol) => isSamePosition(patrol.position, position));
  const shardHere = district.shards.find((shard) => isSamePosition(shard.position, position) && !state.shards.includes(shard.id));
  const cacheHere = district.caches.find((cache) => isSamePosition(cache.position, position) && !state.caches.includes(cache.id));
  const npcHere = district.npcs.find((npc) => isSamePosition(npc.position, position));
  const terminalHere = district.terminals.find((terminal) => isSamePosition(terminal.position, position));
  const exitHere = district.exits.find((entry) => isSamePosition(entry.position, position));
  const key = `${position.x},${position.y}`;

  const isWall = tile === '#';
  let background = isWall
    ? 'linear-gradient(180deg, rgba(15,23,42,0.98), rgba(2,6,23,0.96))'
    : 'linear-gradient(180deg, rgba(30,41,59,0.92), rgba(15,23,42,0.86))';

  if (!isWall && patrolPathKeys.has(key) && state.scanTurns > 0) {
    background = 'linear-gradient(180deg, rgba(37,99,235,0.24), rgba(15,23,42,0.86))';
  }
  if (!isWall && objectiveKeys.has(key) && state.scanTurns > 0) {
    background = 'linear-gradient(180deg, rgba(168,85,247,0.24), rgba(15,23,42,0.86))';
  }
  if (exitHere) {
    background = 'linear-gradient(180deg, rgba(15,118,110,0.45), rgba(8,47,73,0.82))';
  }

  let label = '';
  if (shardHere) label = '✨';
  if (cacheHere) label = '📦';
  if (npcHere) label = npcHere.emoji;
  if (terminalHere) label = terminalHere.emoji;
  if (exitHere) label = '⇢';
  if (patrolHere) label = patrolHere.emoji;
  if (playerHere) label = phase === 'win' ? '🤩' : phase === 'lose' ? '😵' : '😎';

  return (
    <div
      key={`${position.x}-${position.y}`}
      style={{
        width: MAP_CELL_SIZE,
        height: MAP_CELL_SIZE,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background,
        border: isWall ? '1px solid rgba(71,85,105,0.28)' : '1px solid rgba(148,163,184,0.16)',
        color: '#f8fafc',
        fontSize: 18,
        boxShadow: !isWall ? 'inset 0 1px 0 rgba(255,255,255,0.05)' : 'none',
      }}
      title={buildCellTitle({ playerHere, patrolHere, shardHere, cacheHere, npcHere, terminalHere, exitHere, district })}
    >
      {label}
    </div>
  );
}

function buildCellTitle({
  playerHere,
  patrolHere,
  shardHere,
  cacheHere,
  npcHere,
  terminalHere,
  exitHere,
  district,
}: {
  playerHere: boolean;
  patrolHere: { name: string } | undefined;
  shardHere: { label: string } | undefined;
  cacheHere: { label: string } | undefined;
  npcHere: { name: string; title: string } | undefined;
  terminalHere: { name: string } | undefined;
  exitHere: { label: string } | undefined;
  district: { name: string };
}) {
  if (playerHere) return `Runner · ${district.name}`;
  if (patrolHere) return patrolHere.name;
  if (shardHere) return shardHere.label;
  if (cacheHere) return cacheHere.label;
  if (npcHere) return `${npcHere.name} · ${npcHere.title}`;
  if (terminalHere) return terminalHere.name;
  if (exitHere) return exitHere.label;
  return district.name;
}

function StatChip({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{ ...chipStyle, borderColor: `${accent}44`, color: '#f8fafc' }}>
      <span style={{ color: 'rgba(226,232,240,0.64)', fontSize: 11 }}>{label}</span>
      <span style={{ fontWeight: 800 }}>{value}</span>
    </div>
  );
}

function MiniChip({ text, tone = 'rgba(226,232,240,0.78)' }: { text: string; tone?: string }) {
  return (
    <div style={{ borderRadius: 999, padding: '6px 10px', background: 'rgba(15,23,42,0.78)', border: '1px solid rgba(148,163,184,0.16)', color: tone, fontSize: 11, fontWeight: 700 }}>
      {text}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderRadius: 12, padding: 10, background: 'rgba(15,23,42,0.72)', border: '1px solid rgba(148,163,184,0.14)', display: 'grid', gap: 4 }}>
      <div style={{ fontSize: 10, color: 'rgba(226,232,240,0.58)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#f8fafc', fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, color: '#e2e8f0', fontWeight: 700 }}>
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <div style={{ height: 8, borderRadius: 999, background: 'rgba(51,65,85,0.82)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, (value / max) * 100)}%`, background: color, borderRadius: 999, transition: 'width 0.2s ease' }} />
      </div>
    </div>
  );
}

const shellStyle: CSSProperties = {
  background: 'linear-gradient(180deg, #120c22, #090f1f)',
  borderRadius: 18,
  display: 'grid',
};

const panelStyle: CSSProperties = {
  borderRadius: 16,
  padding: 14,
  background: 'rgba(15,23,42,0.76)',
  border: '1px solid rgba(148,163,184,0.14)',
  display: 'grid',
  gap: 10,
};

const pillStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 8,
  borderRadius: 999,
  padding: '8px 12px',
  background: 'rgba(15,23,42,0.72)',
  border: '1px solid rgba(250,204,21,0.22)',
  color: '#fde68a',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  width: 'fit-content',
};

const chipStyle: CSSProperties = {
  borderRadius: 14,
  padding: '10px 12px',
  background: 'rgba(15,23,42,0.76)',
  border: '1px solid rgba(148,163,184,0.14)',
  color: '#e2e8f0',
  fontSize: 12,
  fontWeight: 700,
  display: 'grid',
  gap: 4,
};

const primaryButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: 'none',
  padding: '12px 22px',
  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
  color: '#fff',
  fontSize: 14,
  fontWeight: 800,
  cursor: 'pointer',
};

const secondaryButtonStyle: CSSProperties = {
  borderRadius: 999,
  border: '1px solid rgba(148,163,184,0.2)',
  padding: '10px 16px',
  background: 'rgba(15,23,42,0.86)',
  color: '#f8fafc',
  fontSize: 12,
  fontWeight: 800,
  cursor: 'pointer',
};

const controlButtonStyle: CSSProperties = {
  minWidth: 58,
  minHeight: 48,
  borderRadius: 14,
  border: '1px solid rgba(250,204,21,0.24)',
  background: 'rgba(15,23,42,0.92)',
  color: '#f8fafc',
  fontSize: 20,
  fontWeight: 800,
  cursor: 'pointer',
};

const actionButtonStyle: CSSProperties = {
  minHeight: 44,
  borderRadius: 12,
  border: '1px solid rgba(148,163,184,0.18)',
  background: 'rgba(15,23,42,0.9)',
  color: '#f8fafc',
  fontSize: 12,
  fontWeight: 800,
  cursor: 'pointer',
};

const sectionHeadingStyle: CSSProperties = {
  color: '#fde68a',
  fontSize: 12,
  fontWeight: 900,
  textTransform: 'uppercase',
  letterSpacing: '0.12em',
};

