// lib/ai/handlers/navigation.ts
// Navigation Intent Handlers

import { ToolHandler } from '../tool-router';
import {
  NavDeltaPayload,
  HomeAnchorSetStatePayload,
  HomeMenuOpenPayload,
} from '@/types/ai-system';

// ============================================================================
// NAV_DELTA Handler
// ============================================================================

export const handleNavDelta: ToolHandler = async (ctx) => {
  const payload = ctx.intent.payload as unknown as NavDeltaPayload;

  // Navigation changes are UI-only, no DB writes
  // Return UI delta with navigation patch
  return {
    ok: true,
    data: {
      nav_delta: payload.delta_nav,
      route_delta: payload.delta_route,
    },
    ui_delta: {
      nav_patch: payload.delta_nav
        ? [
            {
              op: 'replace' as const,
              path: '/nav',
              value: payload.delta_nav,
            },
          ]
        : undefined,
      toast: {
        kind: 'info' as const,
        message: 'Navigation updated',
      },
    },
  };
};

// ============================================================================
// HOME_ANCHOR_SET_STATE Handler
// ============================================================================

export const handleHomeAnchorSetState: ToolHandler = async (ctx) => {
  const payload = ctx.intent.payload as unknown as HomeAnchorSetStatePayload;

  return {
    ok: true,
    data: {
      home_anchor_state: payload.state,
    },
    ui_delta: {
      nav_patch: [
        {
          op: 'replace' as const,
          path: '/nav/home_anchor_state',
          value: payload.state,
        },
      ],
    },
  };
};

// ============================================================================
// HOME_MENU_OPEN Handler
// ============================================================================

export const handleHomeMenuOpen: ToolHandler = async (ctx) => {
  return {
    ok: true,
    data: {},
    ui_delta: {
      open_overlay: 'HOME_MENU',
    },
  };
};
