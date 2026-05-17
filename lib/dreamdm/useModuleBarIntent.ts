'use client';

/**
 * lib/dreamdm/useModuleBarIntent.ts — Pass 3
 *
 * Module → DreamDM Bar action injection.
 *
 * Inline comment/action bubbles are dead. Any module that previously rendered
 * its own floating button overlay now calls `focusModuleInBar(actions)` and
 * the DreamDM Bar displays those actions in its existing compose region.
 *
 * This is not a new surface — it is an extension of the existing BarIntent
 * system already wired in DreamSystemContext and useDreamBarContext.
 *
 * Usage (inside any module / Dream Window wrapper):
 *   const { focusModuleInBar, clearModuleFromBar } = useModuleBarIntent('feed-card-abc');
 *
 *   // On focus / user tap:
 *   focusModuleInBar([
 *     { id: 'comment', label: 'Comment', icon: '💬', onAction: openBarCompose },
 *     { id: 'like',    label: 'Like',    icon: '♡',  onAction: handleLike },
 *   ]);
 *
 *   // On blur / unmount:
 *   clearModuleFromBar();
 *
 * The bar reads `barIntent.mode === 'module-actions'` and renders the
 * `barIntent.moduleActions` array as quick-action buttons alongside the
 * compose input. It does NOT render a separate overlay.
 *
 * Architecture: docs/ARCHITECTURE.md §3 (Pass 3 — inline bubbles → DreamDM Bar).
 * Guardrail: no new floating component. The bus IS the context surface.
 */

import { useCallback } from 'react';
import { useDreamSystem } from '@/lib/dreamdm/DreamSystemContext';
import type { ModuleBarAction } from '@/lib/dreamdm/DreamSystemContext';

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseModuleBarIntentResult {
  /**
   * Push this module's contextual actions into the DreamDM Bar.
   * The bar will display them until cleared or overridden by another module.
   */
  focusModuleInBar: (actions: ModuleBarAction[]) => void;
  /**
   * Remove this module's actions from the bar and reset to default intent.
   * Call on unmount or when the module loses focus.
   */
  clearModuleFromBar: () => void;
  /**
   * Convenience: focus the bar in 'comment' mode for a specific post.
   * Equivalent to the existing BarIntent comment mode — no bubble needed.
   */
  openCommentInBar: (targetPostId: string, targetLabel?: string) => void;
}

export function useModuleBarIntent(moduleId: string: UseModuleBarIntentResult) {
  const { setBarIntent, clearBarIntent, barIntent } = useDreamSystem();

  const focusModuleInBar = useCallback(
    (actions: ModuleBarAction[]) => {
      setBarIntent({
        mode: 'module-actions',
        moduleId,
        moduleActions: actions,
      });
    },
    [moduleId, setBarIntent],
  );

  const clearModuleFromBar = useCallback(() => {
    // Only clear if this module is currently the active one.
    if (barIntent.mode === 'module-actions' && barIntent.moduleId === moduleId) {
      clearBarIntent();
    }
  }, [moduleId, barIntent, clearBarIntent]);

  const openCommentInBar = useCallback(
    (targetPostId: string, targetLabel?: string) => {
      setBarIntent({ mode: 'comment', targetPostId, targetLabel });
    },
    [setBarIntent],
  );

  return { focusModuleInBar, clearModuleFromBar, openCommentInBar };
}
