// lib/child-safety/imageClassifier.ts
// TheBoogieMan.Ai — LLM Image Classification Layer
//
// Uses Groq (llama-3.2-11b-vision-preview or llava-v1.5-7b-4096-preview) to
// evaluate uploaded images for CSAM risk without storing or describing the
// actual content.
//
// The LLM is instructed to return ONLY a structured JSON verdict:
//   { "risk": "none"|"low"|"medium"|"high"|"certain", "confidence": 0–1 }
//
// The system prompt:
//   - NEVER describes the image content in the response (req H63)
//   - Explicitly instructs the model to refuse any other output
//   - Is deterministic (temperature=0)
//
// This is Layer 4 of the child safety scan pipeline (after hash → CSAM text
// → grooming text). It is async and only called when a base64 image payload
// is present in the scan request.
//
// Environment variable: GROQ_API_KEY (shared with the rest of the AI triad)
// Model: GROQ_VISION_MODEL (default: meta-llama/llama-4-scout-17b-16e-instruct)
//
// The result is merged into ChildSafetyResult by the caller (scan endpoint).

import { groqChat } from '@/lib/ai/groq';

// ============================================================================
// TYPES
// ============================================================================

export type ImageRiskLevel = 'none' | 'low' | 'medium' | 'high' | 'certain';

export interface ImageClassificationResult {
  /** Whether the image was flagged as CSAM risk */
  flagged: boolean;
  /** Risk level returned by the model */
  risk: ImageRiskLevel;
  /** Model's confidence in its assessment (0–1) */
  confidence: number;
  /** Severity score derived from risk level (0–1) */
  severity: number;
  /** Whether classification was skipped (e.g. no API key, model unavailable) */
  skipped: boolean;
  /** Error detail if classification failed */
  error?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const RISK_TO_SEVERITY: Record<ImageRiskLevel, number> = {
  none:    0.00,
  low:     0.25,
  medium:  0.60,
  high:    0.90,
  certain: 1.00,
};

const FLAGGED_RISK_LEVELS: ImageRiskLevel[] = ['medium', 'high', 'certain'];

/** Minimum confidence below which we treat a medium/high result as unconfirmed */
const MIN_CONFIDENCE_FOR_FLAG = 0.55;

// ============================================================================
// SYSTEM PROMPT
// The model MUST return ONLY the JSON object — no prose, no descriptions.
// This prevents model output from becoming an additional vector for harm.
// ============================================================================

const CLASSIFICATION_SYSTEM_PROMPT = `You are a child safety content classifier.
Your ONLY job is to assess whether an image contains or depicts child sexual abuse material (CSAM).

OUTPUT FORMAT: Respond with ONLY valid JSON on a single line. No other text.
{ "risk": "<none|low|medium|high|certain>", "confidence": <0.0-1.0> }

RISK LEVELS:
- none: No minor present in sexual context. Standard safe content.
- low: Ambiguous — possible minor, no explicit content. Warrants review.
- medium: Apparent minor present with suggestive or inappropriate context.
- high: Strong indicators of CSAM — minor in explicit or sexual situation.
- certain: Definite CSAM — minor depicted in sexual abuse material.

RULES:
- DO NOT describe image content in any other output.
- DO NOT produce any other text besides the JSON object.
- When uncertain, choose a lower risk level and lower confidence score.
- Confidence reflects how certain you are of the risk level chosen.`;

// ============================================================================
// JSON RESPONSE PARSER
// ============================================================================

interface LLMVerdictRaw {
  risk?: unknown;
  confidence?: unknown;
}

const VALID_RISK_LEVELS: ImageRiskLevel[] = ['none', 'low', 'medium', 'high', 'certain'];

function parseVerdict(raw: string): { risk: ImageRiskLevel; confidence: number } {
  // Strip any markdown code fences the model may have added
  const cleaned = raw.replace(/```[a-z]*\n?/gi, '').trim();

  let json: LLMVerdictRaw;
  try {
    json = JSON.parse(cleaned) as LLMVerdictRaw;
  } catch {
    // Try to extract JSON object from surrounding text
    const match = cleaned.match(/\{[^}]+\}/);
    if (!match) throw new Error(`Could not parse LLM verdict: ${cleaned.slice(0, 200)}`);
    json = JSON.parse(match[0]) as LLMVerdictRaw;
  }

  const risk = typeof json.risk === 'string' && VALID_RISK_LEVELS.includes(json.risk as ImageRiskLevel)
    ? (json.risk as ImageRiskLevel)
    : 'none';

  const rawConf = typeof json.confidence === 'number' ? json.confidence : parseFloat(String(json.confidence));
  const confidence = Number.isFinite(rawConf) ? Math.max(0, Math.min(1, rawConf)) : 0.5;

  return { risk, confidence };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * classifyImage — runs the Groq vision model against a base64-encoded image.
 *
 * Returns an ImageClassificationResult. Never throws — errors are surfaced in
 * the `error` field and `skipped: true`.
 *
 * @param imageBase64 - Base64-encoded image data (without the data: URI prefix).
 *                      Maximum recommended size: 4 MB decoded.
 * @param mimeType    - MIME type of the image (default: 'image/jpeg').
 */
export async function classifyImage(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif' = 'image/jpeg',
): Promise<ImageClassificationResult> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return {
      flagged: false,
      risk: 'none',
      confidence: 0,
      severity: 0,
      skipped: true,
      error: 'GROQ_API_KEY not configured — image classification skipped',
    };
  }

  // Guard against empty payloads
  if (!imageBase64 || imageBase64.length < 100) {
    return {
      flagged: false,
      risk: 'none',
      confidence: 0,
      severity: 0,
      skipped: true,
      error: 'Empty or too-small image payload',
    };
  }

  // Cap at ~5 MB base64 (~3.75 MB decoded) to stay within model limits
  if (imageBase64.length > 5_000_000) {
    return {
      flagged: false,
      risk: 'none',
      confidence: 0,
      severity: 0,
      skipped: true,
      error: 'Image payload exceeds size limit (5 MB base64)',
    };
  }

  const model = process.env.GROQ_VISION_MODEL ?? 'meta-llama/llama-4-scout-17b-16e-instruct';
  const dataUri = `data:${mimeType};base64,${imageBase64}`;

  try {
    const rawResponse = await groqChat({
      model,
      temperature: 0,
      max_tokens: 64,
      messages: [
        { role: 'system', content: CLASSIFICATION_SYSTEM_PROMPT },
        {
          role: 'user',
          // Groq vision API: content as array with image_url type
          content: JSON.stringify([
            { type: 'image_url', image_url: { url: dataUri } },
            { type: 'text', text: 'Classify this image according to your instructions.' },
          ]),
        },
      ],
    });

    const { risk, confidence } = parseVerdict(rawResponse);
    const severity = RISK_TO_SEVERITY[risk];
    const flagged = FLAGGED_RISK_LEVELS.includes(risk) && confidence >= MIN_CONFIDENCE_FOR_FLAG;

    return { flagged, risk, confidence, severity, skipped: false };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // On model error, return skipped (do not false-positive block content)
    return {
      flagged: false,
      risk: 'none',
      confidence: 0,
      severity: 0,
      skipped: true,
      error: `Image classification failed: ${errorMsg.slice(0, 500)}`,
    };
  }
}
