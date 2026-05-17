'use client';
/**
 * ENGIN: FRACTURE — fusion of engin-battle + dreamwars + avatar-maker.
 *
 * Pilot Vesh, defected from the Lattice. Build your engin in a parts-based
 * creator (chassis, weapon arm, leg type) — every choice is real frame data
 * (HP, dmg, speed, special). Fight a 90-second 1v1 duel against the next
 * faction champion. Wins compound into a faction-war meta tracker.
 *
 * Render: 2-D canvas, OS-scaffolding arena, Dreamcast-saturation grid floor.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameAutoStart, useGamePhase, useSubmitScore } from '@/lib/games/hooks';

type Phase = 'menu' | 'build' | 'fight' | 'victory' | 'defeat';
type Faction = 'lattice' | 'choir' | 'kindling';
type ChassisId = 'lance' | 'bastion' | 'wraith';
type ArmId = 'pulse' | 'cannon' | 'beam';
type LegId = 'jet' | 'tread' | 'spider';

interface Build { chassis: ChassisId; arm: ArmId; leg: LegId; faction: Faction; }
interface Frames { hp: number; dmg: number; speed: number; cooldown: number; special: string; }

const CHASSIS: Record<ChassisId, Frames & { label: string; color: string }> = {
  lance:   { label: 'LANCE',   hp: 100, dmg: 14, speed: 220, cooldown: 0.45, special: 'Dash slash', color: '#8aa9ff' },
  bastion: { label: 'BASTION', hp: 160, dmg: 12, speed: 140, cooldown: 0.65, special: 'Anchor block', color: '#f1a23a' },
  wraith:  { label: 'WRAITH',  hp: 80,  dmg: 18, speed: 280, cooldown: 0.35, special: 'Phase dodge', color: '#c47bd6' },
};
const ARMS: Record<ArmId, { dmg: number; range: number; cd: number; label: string; color: string }> = {
  pulse:  { dmg: 10, range: 180, cd: 0.25, label: 'PULSE',  color: '#7be7ff' },
  cannon: { dmg: 28, range: 320, cd: 0.85, label: 'CANNON', color: '#ff6a3d' },
  beam:   { dmg: 5,  range: 420, cd: 0.10, label: 'BEAM',   color: '#ffe76b' },
};
const LEGS: Record<LegId, { spd: number; jump: number; label: string }> = {
  jet:    { spd: 1.3, jump: 1.4, label: 'JET'    },
  tread:  { spd: 0.9, jump: 0.7, label: 'TREAD'  },
  spider: { spd: 1.0, jump: 1.2, label: 'SPIDER' },
};

const W = 720;
const H = 360;
const GROUND = 290;

interface Mech {
  side: 'p' | 'e';
  x: number; y: number; vx: number; vy: number;
  hp: number; maxHp: number;
  facing: 1 | -1;
  cooldown: number;
  build: Build;
}
interface Bullet { x: number; y: number; vx: number; dmg: number; ttl: number; from: 'p' | 'e'; col: string; }

export default function EnginFracture() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, phaseRef, setPhase] = useGamePhase<Phase>('menu');
  const [build, setBuild] = useState<Build>({ chassis: 'lance', arm: 'pulse', leg: 'jet', faction: 'kindling' });
  const playerRef = useRef<Mech | null>(null);
  const enemyRef = useRef<Mech | null>(null);
  const bulletsRef = useRef<Bullet[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const timerRef = useRef(90);
  const tickRef = useRef(0);
  const scoreRef = useRef(0);
  const submit = useSubmitScore('engin-fracture');

  const buildMech = useCallback((b: Build, side: 'p' | 'e'): Mech => {
    const c = CHASSIS[b.chassis]; const a = ARMS[b.arm]; const l = LEGS[b.leg];
    const hp = c.hp + Math.floor(a.dmg < 12 ? 10 : 0);
    return {
      side, x: side === 'p' ? 120 : W - 120, y: GROUND, vx: 0, vy: 0,
      hp, maxHp: hp, facing: side === 'p' ? 1 : -1, cooldown: 0,
      build: b,
    };
  }, []);

  const startFight = useCallback(() => {
    playerRef.current = buildMech(build, 'p');
    // Enemy chooses a counter-build
    const enemyBuild: Build = {
      chassis: build.chassis === 'wraith' ? 'bastion' : build.chassis === 'bastion' ? 'lance' : 'wraith',
      arm: build.arm === 'beam' ? 'cannon' : 'pulse',
      leg: 'jet',
      faction: build.faction === 'lattice' ? 'choir' : 'lattice',
    };
    enemyRef.current = buildMech(enemyBuild, 'e');
    bulletsRef.current = []; timerRef.current = 90; scoreRef.current = 0;
    setPhase('fight');
  }, [build, buildMech, setPhase]);

  const start = useCallback(() => setPhase('build'), [setPhase]);
  useGameAutoStart(phase === 'menu' ? start : null);
  useEffect(() => { if (phase === 'victory' || phase === 'defeat') submit(scoreRef.current); }, [phase, submit]);

  // Input
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keysRef.current.add(e.key); if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault(); };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener('keydown', down); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // Loop
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf = 0; let lastT = performance.now();

    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - lastT) / 1000); lastT = t;

      if (phaseRef.current === 'fight') {
        const p = playerRef.current!, e = enemyRef.current!;
        timerRef.current -= dt;

        // Player input
        const k = keysRef.current;
        const c = CHASSIS[p.build.chassis]; const a = ARMS[p.build.arm]; const l = LEGS[p.build.leg];
        const left = k.has('ArrowLeft') || k.has('a') || k.has('A');
        const right = k.has('ArrowRight') || k.has('d') || k.has('D');
        const jump = k.has('ArrowUp') || k.has('w') || k.has('W');
        const fire = k.has(' ') || k.has('z') || k.has('Z');
        const sp = c.speed * l.spd;
        p.vx = (right ? sp : 0) - (left ? sp : 0);
        if (jump && p.y >= GROUND - 0.5) p.vy = -360 * l.jump;
        p.vy += 900 * dt; p.x += p.vx * dt; p.y = Math.min(GROUND, p.y + p.vy * dt);
        if (p.y === GROUND) p.vy = 0;
        p.x = Math.max(40, Math.min(W - 40, p.x));
        p.facing = e.x > p.x ? 1 : -1;
        p.cooldown -= dt;
        if (fire && p.cooldown <= 0) {
          bulletsRef.current.push({ x: p.x + p.facing * 22, y: p.y - 32, vx: p.facing * 600, dmg: a.dmg, ttl: a.range / 600, from: 'p', col: a.color });
          p.cooldown = a.cd;
        }

        // Enemy AI — close to optimal range, fire when in range
        const eA = ARMS[e.build.arm]; const eC = CHASSIS[e.build.chassis]; const eL = LEGS[e.build.leg];
        const dx = p.x - e.x;
        const targetDist = eA.range * 0.7;
        e.vx = Math.abs(dx) > targetDist + 30 ? Math.sign(dx) * eC.speed * eL.spd
              : Math.abs(dx) < targetDist - 30 ? -Math.sign(dx) * eC.speed * eL.spd
              : 0;
        if (Math.random() < dt * 1.2 && e.y >= GROUND - 0.5) e.vy = -360 * eL.jump;
        e.vy += 900 * dt; e.x += e.vx * dt; e.y = Math.min(GROUND, e.y + e.vy * dt);
        if (e.y === GROUND) e.vy = 0;
        e.x = Math.max(40, Math.min(W - 40, e.x));
        e.facing = p.x > e.x ? 1 : -1;
        e.cooldown -= dt;
        if (e.cooldown <= 0 && Math.abs(dx) < eA.range) {
          bulletsRef.current.push({ x: e.x + e.facing * 22, y: e.y - 32, vx: e.facing * 580, dmg: eA.dmg, ttl: eA.range / 580, from: 'e', col: eA.color });
          e.cooldown = eA.cd;
        }

        // Bullets
        for (const b of bulletsRef.current) { b.x += b.vx * dt; b.ttl -= dt; }
        // Resolve hits
        for (const b of bulletsRef.current) {
          const target = b.from === 'p' ? e : p;
          if (Math.abs(b.x - target.x) < 26 && Math.abs(b.y - (target.y - 32)) < 28) {
            target.hp -= b.dmg; b.ttl = -1;
            if (b.from === 'p') scoreRef.current += b.dmg;
          }
        }
        bulletsRef.current = bulletsRef.current.filter(b: Record<string, unknown> => b.ttl > 0);

        // End conditions
        if (p.hp <= 0) setPhase('defeat');
        else if (e.hp <= 0) { scoreRef.current += Math.floor(timerRef.current * 5); setPhase('victory'); }
        else if (timerRef.current <= 0) {
          if (p.hp > e.hp) setPhase('victory'); else setPhase('defeat');
        }
      }

      // ── Render ───────────────────────────────────────────────────────────
      // Saturation grid floor
      ctx.fillStyle = '#0a0d1c'; ctx.fillRect(0, 0, W, H);
      const grad = ctx.createLinearGradient(0, GROUND, 0, H);
      grad.addColorStop(0, '#1a1f3a'); grad.addColorStop(1, '#0a0d1c');
      ctx.fillStyle = grad; ctx.fillRect(0, GROUND, W, H - GROUND);
      // Grid lines
      ctx.strokeStyle = 'rgba(122,130,210,0.35)'; ctx.lineWidth = 1;
      for (let i = 0; i < 12; i++) {
        const y = GROUND + (i * i) * 1.0;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      // Floating menu-bar platforms
      ctx.fillStyle = 'rgba(138,169,255,0.2)';
      ctx.fillRect(120, 220, 120, 8); ctx.fillRect(W - 240, 220, 120, 8); ctx.fillRect(W / 2 - 60, 170, 120, 8);

      if (phaseRef.current === 'fight' || phaseRef.current === 'victory' || phaseRef.current === 'defeat') {
        const drawMech = (m: Mech) => {
          const c = CHASSIS[m.build.chassis]; const a = ARMS[m.build.arm];
          ctx.save();
          ctx.translate(m.x, m.y);
          ctx.scale(m.facing, 1);
          // legs
          ctx.fillStyle = '#3a3a52'; ctx.fillRect(-12, -16, 24, 16);
          // chassis
          ctx.fillStyle = c.color; ctx.shadowColor = c.color; ctx.shadowBlur = 10;
          ctx.fillRect(-14, -42, 28, 28);
          // arm
          ctx.fillStyle = a.color; ctx.fillRect(10, -36, 22, 8);
          // head visor
          ctx.fillStyle = '#fff'; ctx.shadowBlur = 0;
          ctx.fillRect(-6, -52, 12, 8);
          ctx.restore();
          // HP bar
          ctx.fillStyle = '#000'; ctx.fillRect(m.x - 28, m.y - 60, 56, 5);
          ctx.fillStyle = m.side === 'p' ? '#7be7ff' : '#ff6a8a';
          ctx.fillRect(m.x - 28, m.y - 60, 56 * (m.hp / m.maxHp), 5);
        };
        if (playerRef.current) drawMech(playerRef.current);
        if (enemyRef.current) drawMech(enemyRef.current);
        for (const b of bulletsRef.current) {
          ctx.fillStyle = b.col; ctx.shadowColor = b.col; ctx.shadowBlur = 6;
          ctx.fillRect(b.x - 4, b.y - 2, 8, 4);
          ctx.shadowBlur = 0;
        }
        // HUD
        ctx.fillStyle = '#fff'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`${Math.max(0, Math.ceil(timerRef.current))}`, W / 2, 30);
        ctx.font = '11px monospace';
        ctx.fillText('VESH', 100, 30);
        ctx.fillText('CHAMPION', W - 100, 30);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phaseRef, setPhase]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 12, background: 'linear-gradient(180deg, #07081a 0%, #0e0f24 100%)', color: '#dcdcff', minHeight: '100%', fontFamily: '"Courier New", monospace' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: W }}>
        <canvas ref={canvasRef} width={W} height={H} style={{ width: '100%', height: 'auto', maxWidth: W, borderRadius: 4, boxShadow: '0 8px 30px rgba(0,0,0,0.7)' }} />
        {phase === 'menu' && (
          <Overlay>
            <h1 style={{ color: '#8aa9ff', margin: 0, fontSize: 32, letterSpacing: 4 }}>⚙️ ENGIN: FRACTURE</h1>
            <p style={{ maxWidth: 460, textAlign: 'center', lineHeight: 1.5 }}>
              You are Vesh — deleted from the patch notes once and rebuilt from a stranger&apos;s memory. Build an engin. Cross factions. Rewrite physics.
            </p>
            <button onClick={start} style={btn}>Open the Forge</button>
          </Overlay>
        )}
        {phase === 'build' && (
          <Overlay>
            <div style={{ color: '#8aa9ff', fontSize: 13, letterSpacing: 4 }}>FORGE · BUILD VESH</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, width: '90%', maxWidth: 560 }}>
              <Picker label="CHASSIS" options={Object.entries(CHASSIS).map(([id, v]) => ({ id, label: v.label, info: `HP ${v.hp} · ${v.special}` }))} value={build.chassis} onChange={(v) => setBuild({ ...build, chassis: v as ChassisId })} />
              <Picker label="ARM" options={Object.entries(ARMS).map(([id, v]) => ({ id, label: v.label, info: `dmg ${v.dmg} · rng ${v.range}` }))} value={build.arm} onChange={(v) => setBuild({ ...build, arm: v as ArmId })} />
              <Picker label="LEG" options={Object.entries(LEGS).map(([id, v]) => ({ id, label: v.label, info: `spd x${v.spd} · jmp x${v.jump}` }))} value={build.leg} onChange={(v) => setBuild({ ...build, leg: v as LegId })} />
            </div>
            <Picker label="FACTION" options={[
              { id: 'lattice', label: 'LATTICE', info: 'corporate engins' },
              { id: 'choir', label: 'CHOIR', info: 'rogue dream-pilots' },
              { id: 'kindling', label: 'KINDLING', info: 'pre-Schism survivors' },
            ]} value={build.faction} onChange={(v) => setBuild({ ...build, faction: v as Faction })} />
            <button onClick={startFight} style={btn}>Drop Into Arena</button>
          </Overlay>
        )}
        {phase === 'victory' && (<Overlay><h1 style={{ color: '#7be7ff' }}>The patch notes update.</h1><p>Vesh advances. Score: {scoreRef.current}</p><button onClick={() => setPhase('build')} style={btn}>Rebuild</button></Overlay>)}
        {phase === 'defeat' && (<Overlay><h1 style={{ color: '#ff6a8a' }}>Vesh is overwritten.</h1><p>Score: {scoreRef.current}</p><button onClick={() => setPhase('build')} style={btn}>Forge Again</button></Overlay>)}
      </div>
      {phase === 'fight' && (
        <div style={{ fontSize: 11, color: '#9aa' }}>← → move · ↑ jump · SPACE fire</div>
      )}
    </div>
  );
}

function Picker() { label, options, value, onChange }: {
  label: string;
  options: Array<{ id: string; label: string; info: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ color: '#8aa9ff', fontSize: 11, letterSpacing: 3 }}>{label}</div>
      {options.map((o: Record<string, unknown>) => (
        <button key={o.id} onClick={() => onChange(o.id)} style={{
          textAlign: 'left', padding: '6px 8px', fontSize: 12,
          background: value === o.id ? 'rgba(138,169,255,0.2)' : 'rgba(20,24,48,0.6)',
          border: `1px solid ${value === o.id ? '#8aa9ff' : 'rgba(138,169,255,0.3)'}`,
          color: '#dcdcff', cursor: 'pointer', borderRadius: 3, fontFamily: 'inherit',
        }}>
          <div style={{ fontWeight: 'bold' }}>{o.label}</div>
          <div style={{ fontSize: 10, color: '#9aa' }}>{o.info}</div>
        </button>
      ))}
    </div>
  );
}

const Overlay = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, background: 'radial-gradient(ellipse at center, rgba(7,8,26,0.88), rgba(7,8,26,0.97))', borderRadius: 4, padding: 16, overflow: 'auto' }}>{children}</div>
);
const btn: React.CSSProperties = {
  background: 'linear-gradient(180deg, #1a1f3a 0%, #0a0d1c 100%)',
  border: '1px solid #8aa9ff', color: '#8aa9ff',
  padding: '10px 26px', borderRadius: 4, fontSize: 14, letterSpacing: 3, cursor: 'pointer',
  fontFamily: 'inherit',
};
