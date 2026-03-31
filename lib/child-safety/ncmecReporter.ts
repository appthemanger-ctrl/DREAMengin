// lib/child-safety/ncmecReporter.ts
// NCMEC CyberTipline Reporter
//
// Reports confirmed CSAM and child predator incidents to the National Center
// for Missing & Exploited Children (NCMEC) CyberTipline as required by US
// federal law (18 U.S.C. § 2258A).
//
// Every confirmed C22_CSAM, C32_MINOR_IMAGE, C33_SOLICITING_IMAGES, or high-confidence
// C31_GROOMING detection MUST be reported via this module.
//
// The DB record is always written first. The external API call is best-effort —
// if it fails, the incident remains in child_safety_incidents for admin follow-up
// and retry.
//
// Set environment variables:
//   NCMEC_API_KEY    — your NCMEC CyberTipline API key
//   NCMEC_ORG_ID     — your registered ESP organisation ID
//   NCMEC_API_URL    — API base URL (default: https://api.missingkids.org/cybertip)
//
// See: https://www.missingkids.org/gethelpnow/cybertipline/esp

import { createServerClient } from '@/lib/supabase/server';
import type { ChildSafetyResult } from './childSafetyDetector';

// ============================================================================
// TYPES
// ============================================================================

export interface NcmecIncidentInput {
  /** Internal platform user ID of the account that posted/sent the content */
  reportedUserId: string;
  /** Platform user ID of the account that reported the content (null = auto-detected) */
  reporterUserId?: string | null;
  /** Rule code: C22_CSAM | C31_GROOMING | C32_MINOR_IMAGE | C33_SOLICITING_IMAGES */
  ruleCode: string;
  /** Detection result from childSafetyDetector */
  detectionResult: ChildSafetyResult;
  /** Surface where the content was found: 'post' | 'message' | 'comment' | 'profile' | 'upload' */
  surface: string;
  /** Opaque content reference (post_id, message_id, etc.) — never the raw content */
  contentRef: string;
  /** SHA-256 hash of the offending text/file (to avoid storing raw content) */
  contentHash?: string;
  /** IP address of the submitting client (optional, for NCMEC report) */
  clientIp?: string;
}

export interface NcmecReportResult {
  /** DB row ID of the child_safety_incidents record */
  incidentId: string;
  /** Whether a CyberTipline submission was attempted */
  ncmecSubmitted: boolean;
  /** NCMEC report ID returned by the CyberTipline API (if available) */
  ncmecReportId?: string;
  /** Any error that occurred during NCMEC submission (for admin alert) */
  ncmecError?: string;
}

// ============================================================================
// NCMEC CYBERTIPLINE PAYLOAD (simplified — extend per full API spec)
// ============================================================================

interface NcmecPayload {
  orgId: string;
  incidentDateTime: string;
  reportType: 'CSAM' | 'APPARENT_CHILD_SEXUAL_EXPLOITATION';
  reportedPerson: {
    platformUserId: string;
    ipAddress?: string;
  };
  contentLocation: {
    url?: string;
    platform: string;
    contentRef: string;
    contentHashSha256?: string;
  };
  additionalInfo?: string;
}

// ============================================================================
// DB WRITER (always runs — NCMEC submission is best-effort on top)
// ============================================================================

async function writeIncidentToDB(input: NcmecIncidentInput): Promise<string> {
  const supabase = await createServerClient();

  const { data, error } = await (supabase as any)
    .from('child_safety_incidents')
    .insert({
      reported_user_id: input.reportedUserId,
      reporter_user_id: input.reporterUserId ?? null,
      rule_code: input.ruleCode,
      category: input.detectionResult.category,
      severity: input.detectionResult.severity,
      confidence: input.detectionResult.confidence,
      signal_count: input.detectionResult.signal_count,
      surface: input.surface,
      content_ref: input.contentRef,
      content_hash: input.contentHash ?? null,
      client_ip: input.clientIp ?? null,
      status: 'PENDING_REVIEW',
      hash_match: input.detectionResult._audit.hash_match,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(`[ncmec] Failed to write incident to DB: ${error?.message}`);
  }

  return (data as { id: string }).id;
}

// ============================================================================
// NCMEC CYBERTIPLINE SUBMISSION (best-effort)
// ============================================================================

async function submitToNcmec(
  incidentId: string,
  input: NcmecIncidentInput,
): Promise<{ reportId?: string; error?: string }> {
  const apiKey = process.env.NCMEC_API_KEY;
  const orgId = process.env.NCMEC_ORG_ID;
  const apiUrl = process.env.NCMEC_API_URL ?? 'https://api.missingkids.org/cybertip';

  if (!apiKey || !orgId) {
    return { error: 'NCMEC_API_KEY or NCMEC_ORG_ID not configured — manual review required' };
  }

  const reportType: NcmecPayload['reportType'] =
    input.ruleCode === 'C22_CSAM'
      ? 'CSAM'
      : 'APPARENT_CHILD_SEXUAL_EXPLOITATION';

  const payload: NcmecPayload = {
    orgId,
    incidentDateTime: new Date().toISOString(),
    reportType,
    reportedPerson: {
      platformUserId: input.reportedUserId,
      ipAddress: input.clientIp,
    },
    contentLocation: {
      platform: 'DREAMengin',
      contentRef: input.contentRef,
      contentHashSha256: input.contentHash,
    },
    additionalInfo: `Internal incident ID: ${incidentId}. Surface: ${input.surface}.`,
  };

  try {
    const res = await fetch(`${apiUrl}/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-Org-Id': orgId,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      return { error: `NCMEC API error ${res.status}: ${body}` };
    }

    const json = await res.json().catch(() => null) as { reportId?: string } | null;
    return { reportId: json?.reportId };
  } catch (err) {
    return { error: `NCMEC network error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ============================================================================
// UPDATE INCIDENT STATUS IN DB
// ============================================================================

async function updateIncidentStatus(
  incidentId: string,
  status: string,
  ncmecReportId?: string,
  ncmecError?: string,
): Promise<void> {
  try {
    const supabase = await createServerClient();
    await (supabase as any)
      .from('child_safety_incidents')
      .update({
        status,
        ncmec_report_id: ncmecReportId ?? null,
        ncmec_error: ncmecError ?? null,
        reported_at: new Date().toISOString(),
      })
      .eq('id', incidentId);
  } catch (err) {
    console.error('[ncmec] Failed to update incident status:', err);
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * reportChildSafetyIncident — the single public API for NCMEC reporting.
 *
 * 1. Writes the incident to child_safety_incidents (always, before network call).
 * 2. Submits to NCMEC CyberTipline (best-effort).
 * 3. Updates the incident record with the NCMEC result.
 *
 * Never throws — all errors are returned in the result for admin alerting.
 */
export async function reportChildSafetyIncident(
  input: NcmecIncidentInput,
): Promise<NcmecReportResult> {
  let incidentId: string;

  // Step 1 — Write to DB (required before any NCMEC API call)
  try {
    incidentId = await writeIncidentToDB(input);
  } catch (err) {
    console.error('[ncmec] CRITICAL: failed to write incident to DB', err);
    return {
      incidentId: 'DB_WRITE_FAILED',
      ncmecSubmitted: false,
      ncmecError: err instanceof Error ? err.message : String(err),
    };
  }

  // Step 2 — Submit to NCMEC
  const { reportId, error: ncmecError } = await submitToNcmec(incidentId, input);

  // Step 3 — Update DB status
  const status = ncmecError ? 'NCMEC_SUBMISSION_FAILED' : 'NCMEC_SUBMITTED';
  await updateIncidentStatus(incidentId, status, reportId, ncmecError);

  if (ncmecError) {
    console.warn(`[ncmec] Incident ${incidentId} written to DB but NCMEC submission failed: ${ncmecError}`);
  } else {
    console.info(`[ncmec] Incident ${incidentId} reported to NCMEC (report ID: ${reportId ?? 'N/A'})`);
  }

  return {
    incidentId,
    ncmecSubmitted: !ncmecError,
    ncmecReportId: reportId,
    ncmecError,
  };
}
