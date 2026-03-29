'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useGameAutoStart, useSubmitScore } from '@/lib/games/hooks';
import {
  LUCID_AVENUE_DISTRICTS,
  calculateLucidAvenueScore,
  createInitialLucidAvenueState,
  getLucidAvenueCompletionPercent,
  getLucidAvenueDistrict,
  getLucidAvenueHint,
  getLucidAvenueMissionChecklist,
  getLucidAvenueObjectiveKeys,
  getLucidAvenuePatrolPathKeys,
  getLucidAvenuePatrolPositions,
  interactInLucidAvenue,
  requestLucidAvenueHint,
  isSamePosition,
  moveLucidAvenuePlayer,
  scanLucidAvenue,
  waitLucidAvenueTurn,
  type LucidAvenueState,
  type Position,
} from '@/lib/games/lucid-avenue-world';

type Phase = 'menu' | 'playing' | 'win' | 'lose';

const MAP_CELL_SIZE = 34;
const TRAINER_CAM_CELL_SIZE = 40;
const VIEWPORT_RADIUS = 3;

export default function LucidAvenue() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [state, setState] = useState<LucidAvenueState>(() => createInitialLucidAvenueState());
  const [viewportWidth, setViewportWidth] = useState(1280);
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
    const updateViewport = () => setViewportWidth(window.innerWidth);
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

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

  const askAi = useCallback(() => {
    if (phase !== 'playing') return;
    runStateAction((current) => requestLucidAvenueHint(current));
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
      } else if (key === 'h') {
        event.preventDefault();
        askAi();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [askAi, interact, move, phase, scan, startGame, wait]);

  const districtVisitedCount = state.visitedDistrictIds.length;
  const scanActive = state.scanTurns > 0;
  const featuredDistricts = Object.values(LUCID_AVENUE_DISTRICTS);
  const districtShardCount = district.shards.filter((entry) => state.shards.includes(entry.id)).length;
  const districtCacheCount = district.caches.filter((entry) => state.caches.includes(entry.id)).length;
  const aiHint = useMemo(() => getLucidAvenueHint(state), [state]);
  const trainerCamRows = useMemo(() => buildTrainerCamRows(state, district), [district, state]);
  const nearbyNpc = district.npcs.find((npc) => (
    Math.abs(npc.position.x - state.player.x) <= 2 && Math.abs(npc.position.y - state.player.y) <= 2
  ));
  const nearbyTerminal = district.terminals.find((terminal) => (
    Math.abs(terminal.position.x - state.player.x) <= 2 && Math.abs(terminal.position.y - state.player.y) <= 2
  ));
  const isPhoneLayout = viewportWidth <= 430;
  const isMobileLayout = viewportWidth <= 900;
  const mapCellSize = isPhoneLayout ? 22 : isMobileLayout ? 28 : MAP_CELL_SIZE;
  const trainerCamCellSize = isPhoneLayout ? 28 : isMobileLayout ? 34 : TRAINER_CAM_CELL_SIZE;

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
            skyline keys, observatory finale, classic handheld-style sprite animation, AI route hints, and a full mission loop built for DREAMengin.
            It is not a copy of the archive’s copyrighted content.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
          {[
            '6 connected districts',
            '6 signal shards',
            '5 quest flags',
            'Patrol rhythm stealth',
            'Sprite animation + trainer cam',
            'AI route hints',
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
            Keyboard / remote: move · Space interact · Q scan · E wait · H AI hint
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

      <div style={{ display: 'grid', gridTemplateColumns: isMobileLayout ? '1fr' : 'minmax(0, 1.2fr) minmax(320px, 0.9fr)', gap: 14 }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: isMobileLayout ? '1fr' : 'minmax(280px, 320px) minmax(0, 1fr)', gap: 12, alignItems: 'start' }}>
            <div style={retroInsetPanelStyle}>
              <div style={{ ...sectionHeadingStyle, fontSize: 11 }}>Trainer cam</div>
              <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.66)', lineHeight: 1.6 }}>
                A zoomed sprite view around your runner for a classic handheld-style route feel.
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${VIEWPORT_RADIUS * 2 + 1}, ${trainerCamCellSize}px)`,
                  gap: 3,
                  justifyContent: 'center',
                  padding: 8,
                }}
              >
                {trainerCamRows.flatMap((row) => row.map((cell) => renderCell({
                  tile: cell.tile,
                  position: cell.position,
                  state,
                  patrols,
                  objectiveKeys,
                  patrolPathKeys,
                  phase,
                  size: trainerCamCellSize,
                })))}
              </div>
            </div>

            <div style={{ display: 'grid', gap: 10 }}>
              <div style={retroInsetPanelStyle}>
                <div style={{ ...sectionHeadingStyle, fontSize: 11 }}>Current route</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8 }}>
                  <MiniMetric label="District shards" value={`${districtShardCount}/${district.shards.length || 0}`} />
                  <MiniMetric label="Caches cracked" value={`${districtCacheCount}/${district.caches.length || 0}`} />
                  <MiniMetric label="Patrols" value={`${district.patrols.length}`} />
                  <MiniMetric label="Contacts" value={`${district.npcs.length}`} />
                </div>
              </div>

              <div style={retroInsetPanelStyle}>
                <div style={{ ...sectionHeadingStyle, fontSize: 11 }}>Nearby route intel</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={routeIntelStyle}>
                    <span style={{ color: '#94a3b8' }}>Contact</span>
                    <span style={{ color: '#f8fafc' }}>{nearbyNpc ? `${nearbyNpc.emoji} ${nearbyNpc.name}` : 'No nearby contact'}</span>
                  </div>
                  <div style={routeIntelStyle}>
                    <span style={{ color: '#94a3b8' }}>Terminal</span>
                    <span style={{ color: '#f8fafc' }}>{nearbyTerminal ? `${nearbyTerminal.emoji} ${nearbyTerminal.name}` : 'No nearby terminal'}</span>
                  </div>
                  <div style={routeIntelStyle}>
                    <span style={{ color: '#94a3b8' }}>AI hint</span>
                    <span style={{ color: '#f8fafc', textAlign: 'right' }}>{aiHint}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${district.map[0].length}, ${mapCellSize}px)`,
              gap: isPhoneLayout ? 2 : 4,
              justifyContent: 'center',
              padding: isPhoneLayout ? 4 : 8,
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
                size: mapCellSize,
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
            <div style={sectionHeadingStyle}>Route atlas</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {featuredDistricts.map((entry, index) => {
                const active = entry.id === district.id;
                const visited = state.visitedDistrictIds.includes(entry.id);
                return (
                  <div
                    key={entry.id}
                    style={{
                      borderRadius: 12,
                      padding: '10px 12px',
                      background: active ? 'rgba(30,41,59,0.96)' : 'rgba(15,23,42,0.72)',
                      border: `1px solid ${active ? `${entry.color}55` : 'rgba(148,163,184,0.12)'}`,
                      display: 'grid',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
                      <div style={{ color: '#f8fafc', fontSize: 12, fontWeight: 800 }}>
                        {index + 1}. {entry.name}
                      </div>
                      <div style={{ fontSize: 10, color: active ? '#fde68a' : visited ? '#86efac' : '#94a3b8', fontWeight: 800 }}>
                        {active ? 'ACTIVE' : visited ? 'VISITED' : 'UNVISITED'}
                      </div>
                    </div>
                    <div style={{ color: 'rgba(226,232,240,0.62)', fontSize: 11, lineHeight: 1.55 }}>{entry.subtitle}</div>
                  </div>
                );
              })}
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
              <button onClick={askAi} disabled={phase !== 'playing'} style={actionButtonStyle}>AI Hint</button>
              <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.6)', textAlign: 'center' }}>
                Shared GameRemote directions work in the dedicated play session.
                Keyboard extras: Space / Enter interact, Q scan, E wait, H AI hint, R restart.
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
  size = MAP_CELL_SIZE,
}: {
  tile: string;
  position: Position;
  state: LucidAvenueState;
  patrols: ReturnType<typeof getLucidAvenuePatrolPositions>;
  objectiveKeys: Set<string>;
  patrolPathKeys: Set<string>;
  phase: Phase;
  size?: number;
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
  const background = getTileBackground({
    isWall,
    districtColor: district.color,
    scanPatrol: !isWall && patrolPathKeys.has(key) && state.scanTurns > 0,
    scanObjective: !isWall && objectiveKeys.has(key) && state.scanTurns > 0,
    isExit: Boolean(exitHere),
  });
  const spriteKind = playerHere
    ? phase === 'win'
      ? 'playerWin'
      : phase === 'lose'
        ? 'playerLose'
        : 'player'
    : patrolHere
      ? 'patrol'
      : shardHere
        ? 'shard'
        : cacheHere
          ? 'cache'
          : terminalHere
            ? 'terminal'
            : exitHere
              ? 'exit'
              : npcHere
                ? 'npc'
                : null;

  return (
    <div
      key={`${position.x}-${position.y}`}
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background,
        border: isWall ? '1px solid rgba(71,85,105,0.28)' : '1px solid rgba(148,163,184,0.16)',
        color: '#f8fafc',
        boxShadow: !isWall ? 'inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.03)',
        position: 'relative',
        overflow: 'hidden',
      }}
      title={buildCellTitle({ playerHere, patrolHere, shardHere, cacheHere, npcHere, terminalHere, exitHere, district })}
    >
      {!isWall && (
        <>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.14,
              background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 4px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: `${Math.max(10, Math.round(size * 0.24))}px`,
              background: 'linear-gradient(180deg, rgba(2,6,23,0), rgba(2,6,23,0.22) 40%, rgba(2,6,23,0.34))',
            }}
          />
        </>
      )}
      {spriteKind
        ? (
          <PixelSprite
            kind={spriteKind}
            frame={state.turn}
            size={Math.max(18, Math.round(size * 0.72))}
            accent={district.color}
          />
        )
        : !isWall && <div style={pixelGroundDotStyle} />}
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

function buildTrainerCamRows(state: LucidAvenueState, district: ReturnType<typeof getLucidAvenueDistrict>) {
  const rows: Array<Array<{ position: Position; tile: string }>> = [];

  for (let y = state.player.y - VIEWPORT_RADIUS; y <= state.player.y + VIEWPORT_RADIUS; y += 1) {
    const row: Array<{ position: Position; tile: string }> = [];
    for (let x = state.player.x - VIEWPORT_RADIUS; x <= state.player.x + VIEWPORT_RADIUS; x += 1) {
      row.push({
        position: { x, y },
        tile: district.map[y]?.[x] ?? '#',
      });
    }
    rows.push(row);
  }

  return rows;
}

function getTileBackground({
  isWall,
  districtColor,
  scanPatrol,
  scanObjective,
  isExit,
}: {
  isWall: boolean;
  districtColor: string;
  scanPatrol: boolean;
  scanObjective: boolean;
  isExit: boolean;
}) {
  if (isWall) {
    return 'repeating-linear-gradient(0deg, rgba(15,23,42,0.98) 0 6px, rgba(30,41,59,0.98) 6px 12px), repeating-linear-gradient(90deg, rgba(51,65,85,0.5) 0 2px, transparent 2px 6px)';
  }

  if (isExit) {
    return 'linear-gradient(180deg, rgba(20,83,45,0.78), rgba(8,47,73,0.86)), repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 2px, transparent 2px 6px)';
  }

  if (scanObjective) {
    return `linear-gradient(180deg, ${districtColor}44, rgba(15,23,42,0.82)), repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 4px)`;
  }

  if (scanPatrol) {
    return 'linear-gradient(180deg, rgba(37,99,235,0.34), rgba(15,23,42,0.84)), repeating-linear-gradient(90deg, rgba(255,255,255,0.12) 0 1px, transparent 1px 4px)';
  }

  return `linear-gradient(180deg, ${districtColor}20, rgba(15,23,42,0.86)), repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 4px)`;
}

type SpriteKind = 'player' | 'playerWin' | 'playerLose' | 'patrol' | 'shard' | 'cache' | 'terminal' | 'exit' | 'npc';
type SpritePalette = Record<string, string>;

const spritePalettes: Record<SpriteKind, SpritePalette> = {
  player: { '.': 'transparent', k: '#0f172a', a: '#fde68a', b: '#38bdf8', s: '#f1c27d', w: '#f8fafc' },
  playerWin: { '.': 'transparent', k: '#0f172a', a: '#86efac', b: '#67e8f9', s: '#f1c27d', w: '#f8fafc' },
  playerLose: { '.': 'transparent', k: '#0f172a', a: '#fca5a5', b: '#94a3b8', s: '#f1c27d', w: '#f8fafc' },
  patrol: { '.': 'transparent', k: '#0f172a', a: '#e2e8f0', b: '#ef4444', s: '#cbd5e1', w: '#f8fafc' },
  shard: { '.': 'transparent', k: '#0f172a', a: '#c084fc', b: '#f8fafc', s: '#f5d0fe', w: '#f8fafc' },
  cache: { '.': 'transparent', k: '#0f172a', a: '#f59e0b', b: '#92400e', s: '#fde68a', w: '#f8fafc' },
  terminal: { '.': 'transparent', k: '#0f172a', a: '#22d3ee', b: '#0f766e', s: '#67e8f9', w: '#f8fafc' },
  exit: { '.': 'transparent', k: '#0f172a', a: '#4ade80', b: '#14532d', s: '#bbf7d0', w: '#f8fafc' },
  npc: { '.': 'transparent', k: '#0f172a', a: '#f472b6', b: '#7c3aed', s: '#f1c27d', w: '#f8fafc' },
};

const spriteFrames: Record<SpriteKind, string[][]> = {
  player: [
    ['..aa....', '.aasa...', '.abbaa..', '.abbaa..', '..bb....', '.b..b...', 'b....b..', '.w..w...'],
    ['..aa....', '.aasa...', '.abbaa..', '.abbaa..', '..bb....', '...bb...', '..b..b..', '.w..w...'],
  ],
  playerWin: [
    ['..aa....', '.aasa...', '.abbaa..', '.abbaa..', '.bbbb...', 'b....b..', '.b..b...', '..ww....'],
  ],
  playerLose: [
    ['..aa....', '.aasa...', '..bbaa..', '.abbaa..', '..bb....', '.b..b...', '..ww....', '.w..w...'],
  ],
  patrol: [
    ['........', '.kkkkkk.', '.kbbbbk.', '.kwwwwk.', '.kbbbbk.', '..k..k..', '.a....a.', '..a..a..'],
    ['........', '.kkkkkk.', '.kbbbbk.', '.kwwwwk.', '.kbbbbk.', '..k..k..', '..a..a..', '.a....a.'],
  ],
  shard: [
    ['....a...', '...aba..', '..ababa.', '.abbbbba', '..ababa.', '...aba..', '....a...', '........'],
    ['........', '...aba..', '..ababa.', '.abbbbba', '..ababa.', '...aba..', '........', '........'],
  ],
  cache: [
    ['........', '.kkkkkk.', '.kaaaak.', '.kassak.', '.kbbbbk.', '.kkkkkk.', '........', '........'],
  ],
  terminal: [
    ['........', '.kkkkkk.', '.kssssk.', '.kabba.k', '.kbbbbk.', '..k..k..', '.a....a.', '........'],
    ['........', '.kkkkkk.', '.kabssk.', '.kabba.k', '.kbbbbk.', '..k..k..', '.a....a.', '........'],
  ],
  exit: [
    ['...a....', '..aaa...', '.aaaaa..', '...a....', '...a....', '...a....', '..bbb...', '.bbbb...'],
  ],
  npc: [
    ['..aa....', '.aasa...', '.abbaa..', '.abbba..', '..bb....', '.b..b...', '.w..w...', '........'],
    ['..aa....', '.aasa...', '.abbba..', '.abbaa..', '..bb....', '...bb...', '.w..w...', '........'],
  ],
};

function PixelSprite({
  kind,
  frame,
  size,
  accent,
}: {
  kind: SpriteKind;
  frame: number;
  size: number;
  accent?: string;
}) {
  const frames = spriteFrames[kind];
  const activeFrame = frames[frame % frames.length];
  const palette: SpritePalette = {
    ...spritePalettes[kind],
    ...(accent ? { b: accent } : {}),
  };

  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gridTemplateRows: 'repeat(8, 1fr)',
        imageRendering: 'pixelated',
        filter: 'drop-shadow(0 1px 0 rgba(15,23,42,0.7))',
        zIndex: 1,
      }}
    >
      {activeFrame.flatMap((row, y) => (
        row.split('').map((pixel, x) => (
          <div
            key={`${kind}-${frame}-${x}-${y}`}
            style={{
              background: palette[pixel] ?? 'transparent',
              borderRadius: pixel === '.' ? 0 : 0.5,
            }}
          />
        ))
      ))}
    </div>
  );
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

const retroInsetPanelStyle: CSSProperties = {
  borderRadius: 12,
  padding: 10,
  background: 'rgba(2,6,23,0.42)',
  border: '1px solid rgba(148,163,184,0.12)',
  display: 'grid',
  gap: 8,
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

const routeIntelStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  alignItems: 'center',
  fontSize: 11,
  borderRadius: 10,
  padding: '8px 10px',
  background: 'rgba(15,23,42,0.72)',
  border: '1px solid rgba(148,163,184,0.12)',
};

const pixelGroundDotStyle: CSSProperties = {
  width: 4,
  height: 4,
  borderRadius: 999,
  background: 'rgba(226,232,240,0.24)',
  zIndex: 1,
};
