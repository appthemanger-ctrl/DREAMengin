'use client';

import React from 'react';
import CustomizeModeBar from './dream.bar.CustomizeModeBar';
import CustomizeToolbar from './dream.bar.CustomizeToolbar';
import ColorPanel from './panels/dream.panel.ColorPanel';
import FontPanel from './panels/dream.panel.FontPanel';
import LayoutPanel from './panels/dream.panel.LayoutPanel';
import EffectsPanel from './panels/dream.panel.EffectsPanel';

/**
 * GlobalCustomizeUI — assembles all customize mode UI into one component.
 * Rendered once in app/layout.tsx so it's available on every page.
 */
export default function GlobalCustomizeUI() {
  return (
    <>
      {/* Fixed top banner while in customize mode */}
      <CustomizeModeBar />

      {/* Fixed bottom toolbar */}
      <CustomizeToolbar />

      {/* Slide-up panels (rendered above toolbar) */}
      <ColorPanel />
      <FontPanel />
      <LayoutPanel />
      <EffectsPanel />
    </>
  );
}
