'use client';

import { useEffect, useRef } from 'react';
import type { LedgerData } from '@/lib/ledger-data';

type Props = {
  data: LedgerData;
  width?: number;
  height?: number;
};

function draw(canvas: HTMLCanvasElement, data: LedgerData) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const cssW = canvas.clientWidth || canvas.width;
  const cssH = canvas.clientHeight || canvas.height;

  canvas.width = Math.floor(cssW * dpr);
  canvas.height = Math.floor(cssH * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = cssW;
  const h = cssH;

  ctx.clearRect(0, 0, w, h);

  const pad = 36;
  const x0 = pad;
  const y0 = h - pad;
  const x1 = w - pad;
  const y1 = pad;

  const { k, I_bulk, I_bound, L_tot } = data;
  const series = [
    { y: I_bulk, stroke: '#4aa3ff' },
    { y: I_bound, stroke: '#ff4a6a' },
    { y: L_tot, stroke: 'rgba(255,255,255,0.75)' },
  ];

  const allY = series.flatMap(s => s.y);
  const ymin = Math.min(...allY);
  const ymax = Math.max(...allY);
  const xr = (k[k.length - 1] - k[0]) || 1;
  const yr = (ymax - ymin) || 1;

  const X = (x: number) => x0 + ((x - k[0]) / xr) * (x1 - x0);
  const Y = (y: number) => y0 - ((y - ymin) / yr) * (y0 - y1);

  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, y1);
  ctx.lineTo(x0, y0);
  ctx.lineTo(x1, y0);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  for (let i = 1; i <= 4; i++) {
    const yy = y1 + (i / 5) * (y0 - y1);
    ctx.beginPath();
    ctx.moveTo(x0, yy);
    ctx.lineTo(x1, yy);
    ctx.stroke();
  }

  for (const s of series) {
    ctx.strokeStyle = s.stroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < k.length; i++) {
      const xx = X(k[i]);
      const yy = Y(s.y[i]);
      if (i === 0) ctx.moveTo(xx, yy);
      else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
}

export default function LedgerChart({ data, width = 800, height = 360 }: Props) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const render = () => draw(canvas, data);
    render();

    const ro = new ResizeObserver(() => render());
    ro.observe(canvas);

    return () => ro.disconnect();
  }, [data]);

  return (
    <div style={{ width: '100%', maxWidth: width }}>
      <canvas
        ref={ref}
        style={{ width: '100%', height }}
        width={width}
        height={height}
      />
    </div>
  );
}
