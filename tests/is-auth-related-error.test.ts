import { describe, expect, it } from 'vitest';
import { isAuthRelatedError } from '@/lib/runtime/isAuthRelatedError';

/**
 * Tests for isAuthRelatedError — the classifier that determines whether the
 * root error boundary (app/error.tsx) should force a sign-out + redirect or
 * simply let the user "Try again" without destroying their session.
 *
 * Root cause: the "cracked dream error" was triggered by app/error.tsx
 * unconditionally calling sb.auth.signOut() for ALL route errors, including
 * transient render/network errors that are not auth-related.
 */
describe('isAuthRelatedError', () => {
  // -- Auth / session errors → should force sign-out ------------------------

  it('returns true for "Unauthorized" errors', () => {
    expect(isAuthRelatedError(new Error('Unauthorized'))).toBe(true);
  });

  it('returns true for "Forbidden" errors', () => {
    expect(isAuthRelatedError(new Error('Forbidden'))).toBe(true);
  });

  it('returns true for JWT errors', () => {
    expect(isAuthRelatedError(new Error('invalid JWT token'))).toBe(true);
  });

  it('returns true for expired token errors', () => {
    expect(isAuthRelatedError(new Error('expired token detected'))).toBe(true);
  });

  it('returns true for session errors', () => {
    expect(isAuthRelatedError(new Error('session has expired'))).toBe(true);
  });

  it('returns true for access token errors', () => {
    expect(isAuthRelatedError(new Error('access token is invalid'))).toBe(true);
  });

  it('returns true for refresh token errors', () => {
    expect(isAuthRelatedError(new Error('refresh token revoked'))).toBe(true);
  });

  it('returns true for 401 errors', () => {
    expect(isAuthRelatedError(new Error('Request failed with status 401'))).toBe(true);
  });

  it('returns true for 403 errors', () => {
    expect(isAuthRelatedError(new Error('403 forbidden'))).toBe(true);
  });

  it('returns true when error name contains AuthError', () => {
    const err = new Error('something went wrong');
    err.name = 'AuthError';
    expect(isAuthRelatedError(err)).toBe(true);
  });

  it('returns true for sign-in errors', () => {
    expect(isAuthRelatedError(new Error('sign in required'))).toBe(true);
  });

  // -- Non-auth / transient errors → must NOT force sign-out ----------------

  it('returns false for generic render errors', () => {
    expect(isAuthRelatedError(new Error('Cannot read properties of undefined'))).toBe(false);
  });

  it('returns false for network timeout errors', () => {
    expect(isAuthRelatedError(new Error('Network request timed out'))).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(isAuthRelatedError(null)).toBe(false);
    expect(isAuthRelatedError(undefined)).toBe(false);
  });

  it('returns false for an empty error message', () => {
    expect(isAuthRelatedError(new Error(''))).toBe(false);
  });

  it('returns false for a TypeError', () => {
    expect(isAuthRelatedError(new TypeError('x is not a function'))).toBe(false);
  });

  it('returns false for a plain string that is not auth-related', () => {
    expect(isAuthRelatedError('Something cracked in the dream.')).toBe(false);
  });

  it('returns false for a 500 server error', () => {
    expect(isAuthRelatedError(new Error('Internal server error 500'))).toBe(false);
  });

  it('returns false for a 404 not-found error', () => {
    expect(isAuthRelatedError(new Error('404 not found'))).toBe(false);
  });
});
