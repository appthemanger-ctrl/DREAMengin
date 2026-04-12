'use client';
import { useEffect, useRef } from 'react';

interface QuantumCircuitCanvasProps {
  active: boolean;
  accentColor: string;
  secondaryColor: string;
  height: number;
}

export default function QuantumCircuitCanvas({ active, accentColor, secondaryColor, height }: QuantumCircuitCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = active ? accentColor : secondaryColor;
    ctx.lineWidth = 1.5;

    const lines = 3;
    const lineSpacing = canvas.height / (lines + 1);
    for (let i = 1; i <= lines; i++) {
      const y = i * lineSpacing;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.globalAlpha = active ? 0.8 : 0.3;
      ctx.stroke();
    }

    if (active) {
      const gatePositions = [0.2, 0.5, 0.8];
      gatePositions.forEach((pos) => {
        const x = pos * canvas.width;
        for (let i = 1; i <= lines; i++) {
          const y = i * lineSpacing;
          ctx.beginPath();
          ctx.strokeStyle = accentColor;
          ctx.globalAlpha = 0.9;
          ctx.rect(x - 8, y - 8, 16, 16);
          ctx.stroke();
        }
      });
    }
  }, [active, accentColor, secondaryColor]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={height}
      style={{ width: '100%', height }}
      aria-label="Quantum circuit visualization"
    />
  );
}
