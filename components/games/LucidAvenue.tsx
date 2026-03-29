'use client';

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useGameAutoStart } from '@/lib/games/hooks';

type Phase = 'menu' | 'playing' | 'win' | 'lose';
type Pos = { x: number; y: number };

const CITY_MAP = [
  '############',
  '#S..#....#O#',
  '#.#.#.##.#.#',
  '#.#...##...#',
  '#.###....#.#',
  '#...#.##.#.#',
  '#.#...#....#',
  '############',
] as const;

const SHARDS: Pos[] = [
  { x: 3, y: 1 },
  { x: 8, y: 1 },
  { x: 5, y: 4 },
  { x: 9, y: 6 },
];

const PATROL_PATHS: Pos[][] = [
  [
    { x: 1, y: 5 },
    { x: 2, y: 5 },
    { x: 3, y: 5 },
    { x: 2, y: 5 },
  ],
  [
    { x: 7, y: 3 },
    { x: 8, y: 3 },
    { x: 9, y: 3 },
    { x: 8, y: 3 },
  ],
] as const;

const START = findTile('S');
const EXIT = findTile('O');

function findTile(tile: string): Pos {
  for (let y = 0; y < CITY_MAP.length; y += 1) {
    const x = CITY_MAP[y].indexOf(tile);
    if (x >= 0) return { x, y };
  }
  return { x: 1, y: 1 };
}

function isSamePos(a: Pos, b: Pos) {
  return a.x === b.x && a.y === b.y;
}

function isWalkable(next: Pos) {
  return CITY_MAP[next.y]?.[next.x] && CITY_MAP[next.y][next.x] !== '#';
}

function formatTurns(turns: number) {
  return turns === 1 ? '1 turn' : `${turns} turns`;
}

export default function LucidAvenue() {
  const [phase, setPhase] = useState<Phase>('menu');
  const [player, setPlayer] = useState<Pos>(START);
  const [collectedShardIds, setCollectedShardIds] = useState<number[]>([]);
  const [patrolSteps, setPatrolSteps] = useState<number[]>(PATROL_PATHS.map(() => 0));
  const [turns, setTurns] = useState(0);
  const [status, setStatus] = useState('Collect every signal shard, then reach the observatory.');

  const patrols = useMemo(
    () => PATROL_PATHS.map((path, index) => path[patrolSteps[index] % path.length]),
    [patrolSteps],
  );

  const startGame = useCallback(() => {
    setPhase('playing');
    setPlayer(START);
    setCollectedShardIds([]);
    setPatrolSteps(PATROL_PATHS.map(() => 0));
    setTurns(0);
    setStatus('Beach boot complete. Route through Lucid Angeles and light the skyline.');
  }, []);

  useGameAutoStart(phase === 'menu' ? startGame : null);

  const movePlayer = useCallback((dx: number, dy: number) => {
    if (phase !== 'playing') return;

    const nextPlayer = { x: player.x + dx, y: player.y + dy };
    if (!isWalkable(nextPlayer)) {
      setStatus('That block is sealed off by traffic and towers.');
      return;
    }

    const nextCollected = collectedShardIds.includes(
      SHARDS.findIndex((shard) => isSamePos(shard, nextPlayer)),
    )
      ? collectedShardIds
      : (() => {
        const shardIndex = SHARDS.findIndex((shard) => isSamePos(shard, nextPlayer));
        if (shardIndex === -1) return collectedShardIds;
        setStatus(`Signal shard ${shardIndex + 1} captured. ${SHARDS.length - (collectedShardIds.length + 1)} left.`);
        return [...collectedShardIds, shardIndex];
      })();

    if (patrols.some((patrol) => isSamePos(patrol, nextPlayer))) {
      setPlayer(nextPlayer);
      setPhase('lose');
      setStatus('A patrol boxed you in before you could slip through.');
      return;
    }

    const nextPatrolSteps = patrolSteps.map((step, index) => (step + 1) % PATROL_PATHS[index].length);
    const nextPatrols = PATROL_PATHS.map((path, index) => path[nextPatrolSteps[index]]);

    setPlayer(nextPlayer);
    setCollectedShardIds(nextCollected);
    setPatrolSteps(nextPatrolSteps);
    setTurns((current) => current + 1);

    if (nextPatrols.some((patrol) => isSamePos(patrol, nextPlayer))) {
      setPhase('lose');
      setStatus('You made the block, but a patrol swept the lane on the same turn.');
      return;
    }

    if (isSamePos(nextPlayer, EXIT) && nextCollected.length === SHARDS.length) {
      setPhase('win');
      setStatus(`Observatory synced. Lucid Angeles is glowing again in ${formatTurns(turns + 1)}.`);
      return;
    }

    if (isSamePos(nextPlayer, EXIT)) {
      setStatus(`Observatory locked — ${SHARDS.length - nextCollected.length} shard(s) still offline.`);
      return;
    }

    if (nextCollected.length === collectedShardIds.length) {
      setStatus('Slip through the district and stay ahead of the patrol rhythm.');
    }
  }, [collectedShardIds, patrolSteps, patrols, phase, player, turns]);

  useEffect(() => {
    if (phase !== 'playing') return undefined;

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        event.preventDefault();
        movePlayer(0, -1);
      } else if (key === 'arrowdown' || key === 's') {
        event.preventDefault();
        movePlayer(0, 1);
      } else if (key === 'arrowleft' || key === 'a') {
        event.preventDefault();
        movePlayer(-1, 0);
      } else if (key === 'arrowright' || key === 'd') {
        event.preventDefault();
        movePlayer(1, 0);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [movePlayer, phase]);

  const legend = [
    { emoji: '😎', label: 'Runner' },
    { emoji: '✨', label: 'Signal shard' },
    { emoji: '🚓', label: 'Patrol' },
    { emoji: '🔭', label: 'Observatory' },
  ] as const;

  if (phase === 'menu') {
    return (
      <div style={{ background: 'linear-gradient(180deg, #120c22, #090f1f)', borderRadius: 16, padding: 28, display: 'grid', gap: 16, textAlign: 'center' }}>
        <div style={{ fontSize: 30, fontWeight: 900, color: '#fef08a', letterSpacing: '-0.04em' }}>🌴 Lucid Avenue</div>
        <div style={{ maxWidth: 440, margin: '0 auto', color: 'rgba(226,232,240,0.8)', fontSize: 13, lineHeight: 1.7 }}>
          An original LA-inspired retro city quest: sweep from the beach to the hilltop observatory, recover four signal shards,
          and avoid the patrol rhythm. Built as a fresh handheld-style adventure, not a copy of the archive’s copyrighted content.
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
          {legend.map((item) => (
            <div key={item.label} style={{ borderRadius: 999, padding: '8px 12px', background: 'rgba(15,23,42,0.75)', border: '1px solid rgba(148,163,184,0.2)', color: '#e2e8f0', fontSize: 12, fontWeight: 700 }}>
              {item.emoji} {item.label}
            </div>
          ))}
        </div>
        <button onClick={startGame} style={{ justifySelf: 'center', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 999, fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
          ▶ Start Lucid Run
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: 'linear-gradient(180deg, #120c22, #090f1f)', borderRadius: 16, padding: 16, display: 'grid', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fef08a' }}>🌴 Lucid Avenue</div>
          <div style={{ fontSize: 12, color: 'rgba(226,232,240,0.74)' }}>{status}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ borderRadius: 999, padding: '8px 12px', background: 'rgba(15,23,42,0.82)', color: '#f8fafc', fontSize: 12, fontWeight: 700 }}>
            ✨ {collectedShardIds.length}/{SHARDS.length}
          </div>
          <div style={{ borderRadius: 999, padding: '8px 12px', background: 'rgba(15,23,42,0.82)', color: '#f8fafc', fontSize: 12, fontWeight: 700 }}>
            🌀 {formatTurns(turns)}
          </div>
          <button onClick={startGame} style={{ borderRadius: 999, padding: '8px 14px', background: 'rgba(239,68,68,0.16)', border: '1px solid rgba(248,113,113,0.35)', color: '#fecaca', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
            Restart
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${CITY_MAP[0].length}, minmax(0, 1fr))`,
          gap: 6,
          width: '100%',
          maxWidth: 520,
          margin: '0 auto',
        }}
      >
        {CITY_MAP.flatMap((row, y) => (
          row.split('').map((tile, x) => {
            const pos = { x, y };
            const playerHere = isSamePos(player, pos);
            const patrolHere = patrols.some((patrol) => isSamePos(patrol, pos));
            const shardIndex = SHARDS.findIndex((shard) => isSamePos(shard, pos));
            const shardHere = shardIndex >= 0 && !collectedShardIds.includes(shardIndex);
            const exitHere = isSamePos(EXIT, pos);
            const startHere = isSamePos(START, pos);

            let label = '';
            let background = 'rgba(30,41,59,0.8)';
            let border = '1px solid rgba(148,163,184,0.14)';

            if (tile === '#') {
              background = 'linear-gradient(180deg, rgba(30,41,59,0.95), rgba(15,23,42,0.98))';
              border = '1px solid rgba(71,85,105,0.35)';
            } else if (exitHere) {
              background = 'linear-gradient(180deg, rgba(15,118,110,0.4), rgba(8,47,73,0.9))';
              label = '🔭';
            } else if (startHere) {
              background = 'linear-gradient(180deg, rgba(59,130,246,0.22), rgba(30,41,59,0.88))';
              label = '🌊';
            }

            if (shardHere) label = '✨';
            if (patrolHere) label = '🚓';
            if (playerHere) label = phase === 'lose' ? '😵' : phase === 'win' ? '🤩' : '😎';

            return (
              <div
                key={`${x}-${y}`}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background,
                  border,
                  color: '#f8fafc',
                  fontSize: 20,
                  boxShadow: tile === '#' ? 'none' : 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              >
                {label}
              </div>
            );
          })
        ))}
      </div>

      <div style={{ display: 'grid', gap: 10, justifyItems: 'center' }}>
        {(phase === 'win' || phase === 'lose') && (
          <div style={{ color: phase === 'win' ? '#86efac' : '#fca5a5', fontSize: 14, fontWeight: 800 }}>
            {phase === 'win' ? 'Skyline restored.' : 'Patrol lockout.'} Press restart for another run.
          </div>
        )}

        <div style={{ display: 'grid', gap: 8 }}>
          <button onClick={() => movePlayer(0, -1)} disabled={phase !== 'playing'} style={controlButtonStyle}>
            ↑
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => movePlayer(-1, 0)} disabled={phase !== 'playing'} style={controlButtonStyle}>
              ←
            </button>
            <button onClick={() => movePlayer(0, 1)} disabled={phase !== 'playing'} style={controlButtonStyle}>
              ↓
            </button>
            <button onClick={() => movePlayer(1, 0)} disabled={phase !== 'playing'} style={controlButtonStyle}>
              →
            </button>
          </div>
        </div>

        <div style={{ fontSize: 11, color: 'rgba(226,232,240,0.62)', textAlign: 'center' }}>
          Keyboard: Arrow keys / WASD · Shared GameRemote directions also work in the dedicated play session.
        </div>
      </div>
    </div>
  );
}

const controlButtonStyle: CSSProperties = {
  minWidth: 56,
  minHeight: 48,
  borderRadius: 14,
  border: '1px solid rgba(250,204,21,0.28)',
  background: 'rgba(15,23,42,0.9)',
  color: '#f8fafc',
  fontSize: 20,
  fontWeight: 800,
  cursor: 'pointer',
};
