/**
 * lib/marketplace/request.ts
 *
 * DreamMarketplace contact-request business logic — pure functions.
 *
 * Used by:
 *   - app/api/marketplace/request/route.ts
 *   - tests/phase8e-shop-marketplace.test.ts
 *
 * Architecture: docs/ARCHITECTURE.md §10
 * Phase 8 §E:   Point 46 — "Request" contact flow routes to real system action
 */

import { MARKETPLACE_CONTACT_TABLE } from './listings';

// Re-export so callers can import from a single file
export { MARKETPLACE_CONTACT_TABLE };

// ── Types ─────────────────────────────────────────────────────────────────────

export type ContactRequestInput = {
  item_id:  string;
  message?: string;
};

export type ContactRequestRecord = {
  item_id:      string;
  requester_id: string;
  seller_id:    string;
  message:      string | null;
  status:       'pending';
};

export type ContactRequestValidationResult = {
  valid:  boolean;
  errors: string[];
};

// ── Validation ────────────────────────────────────────────────────────────────

/** Maximum message length for a contact request. */
export const CONTACT_REQUEST_MESSAGE_MAX = 1000;

/**
 * Validates the raw body of a contact-request POST.
 * Caller is responsible for providing the authenticated user id
 * and the seller_id looked up from the listing record.
 */
export function validateContactRequest(body: unknown): ContactRequestValidationResult {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be a JSON object.'] };
  }

  const b = body as Record<string, unknown>;

  const itemId = String(b.item_id ?? '').trim();
  if (!itemId) {
    errors.push('item_id is required.');
  }

  if (b.message !== undefined && b.message !== null) {
    const msg = String(b.message);
    if (msg.length > CONTACT_REQUEST_MESSAGE_MAX) {
      errors.push(`Message must be ${CONTACT_REQUEST_MESSAGE_MAX} characters or fewer.`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Builds the DB-ready contact request record.
 * seller_id must be resolved by the API handler from the listing record
 * before calling this function.
 */
export function buildContactRequestRecord(
  requesterId: string,
  sellerId:    string,
  input:       ContactRequestInput,
): ContactRequestRecord {
  return {
    item_id:      input.item_id,
    requester_id: requesterId,
    seller_id:    sellerId,
    message:      input.message?.trim() || null,
    status:       'pending',
  };
}
