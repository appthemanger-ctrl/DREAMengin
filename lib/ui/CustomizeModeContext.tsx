'use client';

import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import {
  type SkinData,
  type SkinPage,
  type AllPageSkins,
  DEFAULT_SKIN,
  applySkin,
  loadAllSkins,
  saveAllSkins,
  resolveSkin,
} from '@/lib/ui/skin-engine';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CustomizeModeContextValue {
  /** Whether the user is currently in customize mode */
  isCustomizeMode: boolean;
  /** Which page is being customized */
  activePage: SkinPage | null;
  /** Which bottom panel is open */
  activePanel: 'color' | 'font' | 'layout' | 'effects' | null;
  /** The live (unsaved) skin being edited */
  draftSkin: SkinData;
  /** All persisted page skins */
  allSkins: AllPageSkins;

  /** Enter customize mode for a specific page */
  enterCustomizeMode: (page: SkinPage) => void;
  /** Exit without saving */
  exitCustomizeMode: () => void;
  /** Open a customization panel */
  openPanel: (panel: 'color' | 'font' | 'layout' | 'effects') => void;
  /** Close the open panel */
  closePanel: () => void;
  /** Update draft skin (live preview) */
  updateDraft: (partial: Partial<SkinData>) => void;
  /** Save the current draft and exit customize mode */
  saveSkin: () => void;
  /** Reset the current page skin to the global default */
  resetPageSkin: () => void;
  /** Apply a full preset */
  applyPreset: (skin: SkinData) => void;
}

const CustomizeModeContext = createContext<CustomizeModeContextValue | null>(null);

export function useCustomizeMode(): CustomizeModeContextValue {
  const ctx = useContext(CustomizeModeContext);
  if (!ctx) throw new Error('useCustomizeMode must be used inside CustomizeModeProvider');
  return ctx;
}

// ── Provider ───────────────────────────────────────────────────────────────────

export function CustomizeModeProvider({ children }: { children: React.ReactNode }) {
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [activePage, setActivePage] = useState<SkinPage | null>(null);
  const [activePanel, setActivePanel] = useState<'color' | 'font' | 'layout' | 'effects' | null>(null);
  const [allSkins, setAllSkins] = useState<AllPageSkins>(() => {
    const saved = loadAllSkins();
    // Apply the global skin on mount
    applySkin(saved.global ?? DEFAULT_SKIN);
    return saved;
  });
  const [draftSkin, setDraftSkin] = useState<SkinData>(DEFAULT_SKIN);

  const enterCustomizeMode = useCallback((page: SkinPage) => {
    setActivePage(page);
    setIsCustomizeMode(true);
    setActivePanel(null);
    const loaded = loadAllSkins();
    const effective = resolveSkin(loaded, page);
    setDraftSkin({ ...effective });
  }, []);

  const exitCustomizeMode = useCallback(() => {
    // Restore the saved skin (discard draft)
    const effective = resolveSkin(allSkins, activePage ?? 'global');
    applySkin(effective);
    setIsCustomizeMode(false);
    setActivePage(null);
    setActivePanel(null);
  }, [allSkins, activePage]);

  const openPanel = useCallback((panel: 'color' | 'font' | 'layout' | 'effects') => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  }, []);

  const closePanel = useCallback(() => setActivePanel(null), []);

  const updateDraft = useCallback((partial: Partial<SkinData>) => {
    setDraftSkin((prev) => {
      const next = { ...prev, ...partial };
      // Live preview
      applySkin(next);
      return next;
    });
  }, []);

  const saveSkin = useCallback(() => {
    if (!activePage) return;
    setAllSkins((prev) => {
      const next: AllPageSkins = {
        ...prev,
        [activePage]: { ...draftSkin },
      };
      saveAllSkins(next);
      return next;
    });
    setIsCustomizeMode(false);
    setActivePage(null);
    setActivePanel(null);
  }, [activePage, draftSkin]);

  const resetPageSkin = useCallback(() => {
    if (!activePage) return;
    const globalSkin = allSkins.global ?? DEFAULT_SKIN;
    setDraftSkin({ ...globalSkin });
    applySkin(globalSkin);
  }, [activePage, allSkins]);

  const applyPreset = useCallback((skin: SkinData) => {
    setDraftSkin({ ...skin });
    applySkin(skin);
  }, []);

  const value = useMemo<CustomizeModeContextValue>(() => ({
    isCustomizeMode, activePage, activePanel, draftSkin, allSkins,
    enterCustomizeMode, exitCustomizeMode, openPanel, closePanel,
    updateDraft, saveSkin, resetPageSkin, applyPreset,
  }), [
    isCustomizeMode, activePage, activePanel, draftSkin, allSkins,
    enterCustomizeMode, exitCustomizeMode, openPanel, closePanel,
    updateDraft, saveSkin, resetPageSkin, applyPreset,
  ]);

  return (
    <CustomizeModeContext.Provider value={value}>
      {children}
    </CustomizeModeContext.Provider>
  );
}
