// lib/ai/handlers/index.ts
// Handler Registry - Register all intent handlers

import { registerHandler } from '../tool-router';

// Import navigation handlers
import {
  handleNavDelta,
  handleHomeAnchorSetState,
  handleHomeMenuOpen,
} from './navigation';

// Import dream handlers
import {
  handleDreamPreview,
  handleDreamOpen,
  handleDreamConfigPatch,
  handleDreamReorder,
  handleDreamAddFromPreset,
  handleDreamRemove,
} from './dreams';

// Import social handlers
import {
  handlePostCreate,
  handlePostLike,
  handleFollowUser,
  handleSearch,
  handleDraftSave,
} from './social';

// ============================================================================
// REGISTER ALL HANDLERS
// ============================================================================

export function registerAllHandlers(): void {
  // Navigation handlers
  registerHandler('NAV_DELTA', handleNavDelta);
  registerHandler('HOME_ANCHOR_SET_STATE', handleHomeAnchorSetState);
  registerHandler('HOME_MENU_OPEN', handleHomeMenuOpen);

  // Dream handlers
  registerHandler('DREAM_PREVIEW', handleDreamPreview);
  registerHandler('DREAM_OPEN', handleDreamOpen);
  registerHandler('DREAM_CONFIG_PATCH', handleDreamConfigPatch);
  registerHandler('DREAM_REORDER', handleDreamReorder);
  registerHandler('DREAM_ADD_FROM_PRESET', handleDreamAddFromPreset);
  registerHandler('DREAM_REMOVE', handleDreamRemove);

  // Social handlers
  registerHandler('POST_CREATE', handlePostCreate);
  registerHandler('POST_LIKE', handlePostLike);
  registerHandler('FOLLOW_USER', handleFollowUser);
  registerHandler('SEARCH', handleSearch);
  registerHandler('DRAFT_SAVE', handleDraftSave);

  // Admin handlers would go here (not implemented yet - diagnostic tools)
  // registerHandler('DIAG_SCHEMA_SNAPSHOT', handleDiagSchemaSnapshot);
  // etc.
}

// Auto-register on import
registerAllHandlers();
