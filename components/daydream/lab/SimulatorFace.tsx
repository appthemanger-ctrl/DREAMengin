'use client';
import React, { useEffect, useRef, useState } from 'react';
import { DSection, DCard, DBtn, FACE_WRAPPER } from '../DayDreamShell';

const A = '#22d3ee';
type Param = { id: string; label: string; unit: string; min: number; max: number; value: number };

const DEFAULT_PARAMS: Param[] = [
  { id: 'mass',     label: 'Mass',      unit: 'kg',   min: 0.1, max: 100,  value: 10  },
  { id: 'force',    label: 'Force',     unit: 'N',    min: 0,   max: 500,  value: 50  },
  { id: 'friction', label: 'Friction',  unit: 'μ',    min: 0,   max: 1,    value: 0.3 },
  { id: 'gravity',  label: 'Gravity',   unit: 'm/s²', min: 0,   max: 20,   value: 9.8 },
];

export default function SimulatorFace() {
  const [params, setParams] = useState<Param[]>(DEFAULT_PARAMS);
  const [running, setRunning] = useState(false);
  const [dataPoints, setDataPoints] = useState<number[]>([]);
  const [snapshots, setSnapshots] = useState<{ label: string; data: number[] }[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const get = (id: string) => params.find(p => p.id === id)?.value ?? 0;

  // Simulate: F = ma → a = F/m, v increases, modulated by friction
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        const a = (get('force') - get('mass') * get('gravity') * get('friction')) / get('mass');
        setDataPoints(prev => {
          const next = [...prev, Math.max(0, (prev.at(-1) ?? 0) + a * 0.1)].slice(-60);
          return next;
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [running, params]);

  // Draw graph
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    // Grid
    ctx.strokeStyle = 'rgba(100,150,255,0.1)'; ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) { const y = H * i / 4; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (dataPoints.length < 2) return;
    const max = Math.max(...dataPoints, 1);
    ctx.strokeStyle = A; ctx.lineWidth = 2; ctx.beginPath();
    dataPoints.forEach((v, i) => {
      const x = W * i / 59, y = H - (v / max) * (H - 8) - 4;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [dataPoints]);

  const setParam = (id: string, v: number) => setParams(ps => ps.map(p => p.id === id ? { ...p, value: v } : p));

  return (
    <div style={FACE_WRAPPER}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Parameters */}
        <div>
          <DSection title="Parameters" action={<DBtn label="Reset" accent={A} small ghost onClick={() => { setParams(DEFAULT_PARAMS); setDataPoints([]); }} />}>
            {params.map(p => (
              <DCard key={p.id} accent={A} style={{ marginBottom: 8, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(220,235,255,0.85)' }}>{p.label}</span>
                  <span style={{ fontSize: 11, color: A, fontVariantNumeric: 'tabular-nums' }}>{p.value.toFixed(1)} {p.unit}</span>
                </div>
                <input type="range" min={p.min} max={p.max} step={(p.max - p.min) / 100} value={p.value}
                  onChange={e => setParam(p.id, +e.target.value)} style={{ width: '100%', cursor: 'pointer', accentColor: A }} />
              </DCard>
            ))}
          </DSection>
        </div>

        {/* Graph + controls */}
        <div>
          <DSection title="Velocity Graph" action={
            <DBtn label={running ? '⏹ Stop' : '▶ Run'} accent={A} small onClick={() => setRunning(v => !v)} />
          }>
            <DCard accent={A} style={{ padding: 8 }}>
              <canvas ref={canvasRef} width={280} height={140} style={{ width: '100%', height: 140, borderRadius: 8 }} />
            </DCard>
          </DSection>

          <DSection title="Results">
            <DCard accent={A} style={{ padding: '10px 12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  { label: 'Acceleration', value: `${((get('force') - get('mass')*get('gravity')*get('friction'))/get('mass')).toFixed(2)} m/s²` },
                  { label: 'Net Force',    value: `${(get('force') - get('mass')*get('gravity')*get('friction')).toFixed(1)} N` },
                  { label: 'Current V',   value: `${(dataPoints.at(-1) ?? 0).toFixed(2)} m/s` },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: 'rgba(160,185,255,0.5)' }}>{r.label}</span>
                    <span style={{ fontSize: 11, color: A, fontVariantNumeric: 'tabular-nums' }}>{r.value}</span>
                  </div>
                ))}
              </div>
            </DCard>
          </DSection>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            <DBtn label="Snapshot" icon="📷" accent={A} small onClick={() => {
              if (dataPoints.length > 0) setSnapshots(ss => [...ss, { label: `Run ${ss.length+1}`, data: [...dataPoints] }]);
            }} />
            <DBtn label="Export CSV" icon="⬇" accent={A} small ghost onClick={() => {
              const csv = 'time,velocity\n' + dataPoints.map((v,i) => `${(i*0.1).toFixed(1)},${v.toFixed(3)}`).join('\n');
              const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download = 'simulation.csv'; a.click();
            }} />
          </div>

          {snapshots.length > 0 && (
            <DSection title="Snapshots" action={<DBtn label="Clear" accent="#666" small ghost onClick={() => setSnapshots([])} />}>
              {snapshots.map(s => <div key={s.label} style={{ fontSize: 11, color: 'rgba(160,185,255,0.6)', padding: '4px 0', borderBottom: '1px solid rgba(100,150,255,0.08)' }}>{s.label} — {s.data.length} points</div>)}
            </DSection>
          )}
        </div>
      </div>
    </div>
  );
}
