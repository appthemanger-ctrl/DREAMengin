// app/api/ai/boogieman/child-safety/route.ts
// TheBoogieMan.Ai — Child Safety Scan Endpoint
//
// POST /api/ai/boogieman/child-safety
//
// Accepts content (text + optional media hashes) and runs the child safety
// detector. If a violation is detected:
//   1. Calls boogieEnforce to produce the enforcement decision (zero-tolerance).
//   2. Writes to child_safety_incidents via ncmecReporter.
//   3. Reports to NCMEC CyberTipline.
//   4. Returns enforcement result to the caller.
//
// Access: admin + service-role. End-user surfaces call this internally
// (posts route, messages route, upload route) — never directly.
//
// Rate limit: 120 req/min (automated callers need higher budget).

import { NextRequest, NextResponse } from 'next/server';
import { jsonApiError } from '@/lib/api/route';
import { createServerClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { scanContent, isZeroTolerance } from '@/lib/child-safety/childSafetyDetector';
import { classifyImage } from '@/lib/child-safety/imageClassifier';
import { reportChildSafetyIncident } from '@/lib/child-safety/ncmecReporter';
import { boogieEnforce, BOOGIE_POLICY_VERSION } from '@/lib/ai/boogieman';
import { writeAuditLog } from '@/lib/ai/audit';
import { checkRateLimit } from '@/lib/ai/rateLimit';
import { isOwnerEmail } from '@/lib/ai/triad';
import { createHash } from 'crypto';

// ============================================================================
// REQUEST SCHEMA
// ============================================================================

const ChildSafetyScanBodySchema = z.object({
  /** Text content to scan (post body, DM text, comment, profile bio, etc.) */
  text: z.string().max(10_000).optional(),
  /** SHA-256 hex hashes of any attached media files */
  mediaHashes: z.array(z.string().regex(/^[0-9a-f]{64}$/i)).max(20).optional(),
  /**
   * Base64-encoded image data for LLM classification (Layer 4).
   * Max 5 MB base64 (~3.75 MB decoded). MIME type defaults to image/jpeg.
   * Omit for text-only scans.
   */
  imageBase64: z.string().max(5_100_000).optional(),
  /** MIME type of the imageBase64 payload (default: image/jpeg) */
  imageMime: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']).optional(),
  /** Platform surface where the content was found */
  surface: z.enum(['post', 'message', 'comment', 'profile', 'upload']),
  /** Opaque content reference (post_id, message_id, etc.) */
  contentRef: z.string().max(128),
  /** User ID of the account that created the content */
  reportedUserId: z.string().uuid(),
  /** User ID of the account that triggered the scan (null = automated) */
  reporterUserId: z.string().uuid().optional(),
});

type ChildSafetyScanBody = z.infer<typeof ChildSafetyScanBodySchema>;

// ============================================================================
// LOAD KNOWN-BAD HASHES FROM DB
// Returns a Set of lowercase SHA-256 hashes from child_safety_hash_registry.
// The Set is returned empty (not null) on error — scan proceeds without hash matching.
// ============================================================================

async function loadKnownBadHashes(supabase: Awaited<ReturnType<typeof createServerClient>>): Promise<Set<string>> {
  try {
    const { data, error } = await (supabase as any)
      .from('child_safety_hash_registry')
      .select('hash_sha256');

    if (error || !data) return new Set();
    return new Set(
      (data as { hash_sha256: string }[]).map((r) => r.hash_sha256.toLowerCase()),
    );
  } catch {
    return new Set();
  }
}

// ============================================================================
// POST — scan handler
// ============================================================================

export async function POST(req: NextRequest) {
  const requestStart = Date.now();
  const request_id = uuidv4();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonApiError(400, 'BAD_JSON', 'Body must be valid JSON.');
  }

  const parseResult = ChildSafetyScanBodySchema.safeParse(body);
  if (!parseResult.success) {
    return jsonApiError(400, 'VALIDATION_ERROR', 'Invalid request body', parseResult.error.flatten());
  }

  const request: ChildSafetyScanBody = parseResult.data;

  const supabase = await createServerClient();
  const { data: { user }, error: userErr } = await supabase.auth.getUser();
  if (userErr || !user) {
    return jsonApiError(401, 'NOT_AUTHENTICATED', 'You must be signed in.');
  }

  // Access control: admin or owner only
  const { data: roleData } = await (supabase as any)
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  const isOwner = isOwnerEmail(user.email);
  const isAdmin = isOwner || (roleData as { role?: string } | null)?.role === 'admin';

  if (!isAdmin) {
    return jsonApiError(403, 'FORBIDDEN', 'Admin access required.');
  }

  // Rate limit: 120/min for automated scanning callers
  const rateOk = await checkRateLimit(user.id, '/api/ai/boogieman/child-safety', 120, 60);
  if (!rateOk.allowed) {
    return jsonApiError(429, 'RATE_LIMIT', 'Too many requests.', {
      retry_after_seconds: rateOk.retry_after_seconds,
    });
  }

  // ── Load known-bad hash set ──────────────────────────────────────────────
  const knownBadHashes = await loadKnownBadHashes(supabase);

  // ── Layer 4: LLM image classification (runs before scanContent) ──────────
  // classifyImage is async so we run it here and pass the result into scanContent.
  let imageClassification: import('@/lib/child-safety/imageClassifier').ImageClassificationResult | undefined;
  if (request.imageBase64) {
    imageClassification = await classifyImage(
      request.imageBase64,
      request.imageMime ?? 'image/jpeg',
    );
  }

  // ── Run child safety detector ────────────────────────────────────────────
  const detection = scanContent({
    text: request.text,
    mediaHashes: request.mediaHashes,
    knownBadHashes,
    imageClassification,
  });

  // ── If clean, return early ───────────────────────────────────────────────
  if (!detection.flagged) {
    return NextResponse.json(
      {
        ok: true,
        flagged: false,
        category: 'CLEAN',
        enforcement: null,
        incident_id: null,
        policy_version: BOOGIE_POLICY_VERSION,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  // ── Enforce via BoogieMan ─────────────────────────────────────────────────
  const enforcement = boogieEnforce({
    userId: request.reportedUserId,
    ruleCode: detection.rule_code!,
    severity: detection.severity,
    confidence: detection.confidence,
    strikeCount: 0, // zero-tolerance: strike count doesn't soften CSAM/grooming
    blastRadius: 1,
  });

  // ── Report to NCMEC + write to DB ─────────────────────────────────────────
  const contentHash = request.text
    ? createHash('sha256').update(request.text).digest('hex')
    : undefined;

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? undefined;

  let incidentResult: { incidentId: string; ncmecSubmitted: boolean; ncmecReportId?: string; ncmecError?: string } | null = null;

  // Report for CSAM or zero-tolerance grooming
  if (isZeroTolerance(detection)) {
    incidentResult = await reportChildSafetyIncident({
      reportedUserId: request.reportedUserId,
      reporterUserId: request.reporterUserId ?? null,
      ruleCode: detection.rule_code!,
      detectionResult: detection,
      surface: request.surface,
      contentRef: request.contentRef,
      contentHash,
      clientIp,
    });
  } else {
    // Lower-confidence grooming: write to DB for review but don't auto-submit to NCMEC
    incidentResult = await reportChildSafetyIncident({
      reportedUserId: request.reportedUserId,
      reporterUserId: request.reporterUserId ?? null,
      ruleCode: detection.rule_code!,
      detectionResult: detection,
      surface: request.surface,
      contentRef: request.contentRef,
      contentHash,
      clientIp,
    });
  }

  // ── Write audit log ───────────────────────────────────────────────────────
  await writeAuditLog({
    request_id,
    user_id: user.id,
    agent: 'boogieman',
    ok: false,
    error_code: detection.rule_code ?? undefined,
    latency_ms: Date.now() - requestStart,
    policy_version: BOOGIE_POLICY_VERSION,
    payload: {
      child_safety: true,
      rule_code: detection.rule_code,
      category: detection.category,
      severity: detection.severity,
      confidence: detection.confidence,
      signal_count: detection.signal_count,
      surface: request.surface,
      content_ref: request.contentRef,
      reported_user_id: request.reportedUserId,
      enforcement_action: enforcement.action,
      zero_tolerance: isZeroTolerance(detection),
      incident_id: incidentResult?.incidentId,
      image_classification: imageClassification
        ? { risk: imageClassification.risk, confidence: imageClassification.confidence, skipped: imageClassification.skipped }
        : null,
    },
  });

  return NextResponse.json(
    {
      ok: false,
      flagged: true,
      category: detection.category,
      rule_code: detection.rule_code,
      severity: detection.severity,
      confidence: detection.confidence,
      zero_tolerance: isZeroTolerance(detection),
      image_classification: imageClassification
        ? { risk: imageClassification.risk, confidence: imageClassification.confidence, skipped: imageClassification.skipped }
        : null,
      enforcement: {
        action: enforcement.action,
        scopes: enforcement.audit_event.scopes_restricted,
        expires_at: enforcement.audit_event.expiry,
        user_explanation: enforcement.user_explanation,
        should_escalate: enforcement.should_escalate,
      },
      incident_id: incidentResult?.incidentId ?? null,
      ncmec_submitted: incidentResult?.ncmecSubmitted ?? false,
      policy_version: BOOGIE_POLICY_VERSION,
    },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
