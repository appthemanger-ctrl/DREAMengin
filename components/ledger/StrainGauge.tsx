'use client';

/**
 * StrainGauge — animated radial arc that visualises the LedgerAI strain value.
 *
 * Strain normally lives in [0, ~3]; anything above 2 is "hot".
 */

interface StrainGaugeProps {
  strain: number;
  /** Max value the gauge represents (default 3). */
  max?: number;
  size?: number;
}

export default function StrainGauge({ strain, max = 3, size = 160 }: StrainGaugeProps) {
  const pct = Math.min(strain / max, 1);

  // SVG arc math
  const r = (size / 2) * 0.72;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = -220; // degrees (bottom-left)
  const sweepTotal = 260;  // degrees
  const sweepFilled = sweepTotal * pct;

  function polarToXY(angleDeg: number, radius: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  }

  function describeArc(startDeg: number, endDeg: number, radius: number) {
    const s = polarToXY(startDeg, radius);
    const e = polarToXY(endDeg, radius);
    const largeArc = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${largeArc} 1 ${e.x} ${e.y}`;
  }

  // Colour interpolation: green → yellow → red
  const hue = Math.round((1 - pct) * 120); // 120 = green, 0 = red

  const bgArcPath = describeArc(startAngle, startAngle + sweepTotal, r);
  const fillArcPath =
    sweepFilled > 0.1
      ? describeArc(startAngle, startAngle + sweepFilled, r)
      : '';

  const strokeWidth = size * 0.09;

  return (
    <div className="flex flex-col items-center gap-1" role="img" aria-label={`Strain: ${strain.toFixed(4)}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-lg">
        {/* Track */}
        <path
          d={bgArcPath}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Fill */}
        {fillArcPath && (
          <path
            d={fillArcPath}
            fill="none"
            stroke={`hsl(${hue} 80% 55%)`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            style={{ transition: 'stroke 0.4s, d 0.4s' }}
          />
        )}
        {/* Centre text */}
        <text
          x={cx}
          y={cy - size * 0.06}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={size * 0.18}
          fontWeight="700"
          fontFamily="monospace"
        >
          {strain.toFixed(3)}
        </text>
        <text
          x={cx}
          y={cy + size * 0.15}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(255,255,255,0.5)"
          fontSize={size * 0.1}
        >
          STRAIN
        </text>
      </svg>
    </div>
  );
}
