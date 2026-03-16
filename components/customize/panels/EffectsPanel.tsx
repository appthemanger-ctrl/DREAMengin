'use client';

import React from 'react';
import { useCustomizeMode } from '@/lib/ui/CustomizeModeContext';
import { SlidePanel } from './ColorPanel';

/**
 * EffectsPanel — control glass blur, brightness, saturation, and widget opacity.
 */
export default function EffectsPanel() {
  const { activePanel, closePanel, draftSkin, updateDraft } = useCustomizeMode();

  if (activePanel !== 'effects') return null;

  return (
    <SlidePanel title="Effects" onClose={closePanel}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Widget Opacity */}
        <SliderRow
          label="Widget Opacity"
          value={Math.round(draftSkin.widgetOpacity * 100)}
          displaySuffix="%"
          min={10} max={100} step={5}
          rawValue={draftSkin.widgetOpacity}
          onChange={(v) => updateDraft({ widgetOpacity: v / 100 })}
          leftLabel="Transparent"
          rightLabel="Solid"
        />

        {/* Glass Blur */}
        <SliderRow
          label="Glass Blur"
          value={draftSkin.glassBlur}
          displaySuffix="px"
          min={0} max={48} step={2}
          rawValue={draftSkin.glassBlur}
          onChange={(v) => updateDraft({ glassBlur: v })}
          leftLabel="Sharp"
          rightLabel="Frosted"
        />

        {/* Brightness */}
        <SliderRow
          label="Brightness"
          value={Math.round(draftSkin.brightness * 100)}
          displaySuffix="%"
          min={60} max={140} step={5}
          rawValue={draftSkin.brightness * 100}
          onChange={(v) => updateDraft({ brightness: v / 100 })}
          leftLabel="Dim"
          rightLabel="Bright"
        />

        {/* Saturation */}
        <SliderRow
          label="Saturation"
          value={Math.round(draftSkin.saturation * 100)}
          displaySuffix="%"
          min={0} max={200} step={10}
          rawValue={draftSkin.saturation * 100}
          onChange={(v) => updateDraft({ saturation: v / 100 })}
          leftLabel="Greyscale"
          rightLabel="Vivid"
        />

      </div>
    </SlidePanel>
  );
}

// ── Reusable slider row ───────────────────────────────────────────────────────

function SliderRow({
  label, value, displaySuffix,
  min, max, step,
  rawValue,
  onChange,
  leftLabel, rightLabel,
}: {
  label: string;
  value: number;
  displaySuffix: string;
  min: number;
  max: number;
  step: number;
  rawValue: number;
  onChange: (v: number) => void;
  leftLabel: string;
  rightLabel: string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#3a6fd8' }}>
          {value}{displaySuffix}
        </span>
      </div>
      <input
        type="range"
        min={min} max={max} step={step}
        value={rawValue}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
        aria-label={label}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--de-text-dim)', marginTop: 4 }}>
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
