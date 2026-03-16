'use client';

import React from 'react';
import CustomizeModeBar from './CustomizeModeBar';
import CustomizeToolbar from './CustomizeToolbar';
import ColorPanel from './panels/ColorPanel';
import FontPanel from './panels/FontPanel';
import LayoutPanel from './panels/LayoutPanel';
import EffectsPanel from './panels/EffectsPanel';

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
