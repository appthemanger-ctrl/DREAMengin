/**
 * transcriptEditor – transcript ↔ timeline mapping logic.
 *
 * Parses SRT/VTT subtitle files, maps transcript words to timeline segments,
 * and produces edit-cut instructions when the user deletes/inserts words.
 */

export interface TranscriptWord {
  index: number;
  word: string;
  startMs: number;
  endMs: number;
}

export interface TranscriptSegment {
  id: number;
  startMs: number;
  endMs: number;
  text: string;
  words: TranscriptWord[];
}

export interface TimelineCut {
  /** Start time in ms to remove from the timeline */
  cutStartMs: number;
  /** End time in ms to remove */
  cutEndMs: number;
  /** Optional replacement text (for insert operations) */
  replacement?: string;
}

/** Parse an SRT string into transcript segments. */
export function parseSRT(srt: string): TranscriptSegment[] {
  const blocks = srt.trim().split(/\n\s*\n/);
  const segments: TranscriptSegment[] = [];

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length < 3) continue;
    const id = parseInt(lines[0], 10);
    const timeLine = lines[1];
    const text = lines.slice(2).join(' ').replace(/<[^>]+>/g, '');

    const timeMatch = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/
    );
    if (!timeMatch) continue;

    const startMs = srtTimeToMs(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
    const endMs = srtTimeToMs(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);
    const words = interpolateWords(text, startMs, endMs, segments.flatMap(s => s.words).length);

    segments.push({ id, startMs, endMs, text, words });
  }

  return segments;
}

/** Parse a WebVTT string into transcript segments. */
export function parseVTT(vtt: string): TranscriptSegment[] {
  const lines = vtt.replace(/\r\n/g, '\n').split('\n');
  const segments: TranscriptSegment[] = [];
  let id = 1;
  let i = 0;

  // skip header
  while (i < lines.length && !lines[i].includes('-->')) i++;

  while (i < lines.length) {
    const timeLine = lines[i];
    if (!timeLine.includes('-->')) { i++; continue; }

    const timeMatch = timeLine.match(
      /(\d{2}):(\d{2}):(\d{2})\.(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})\.(\d{3})/
    );
    if (!timeMatch) { i++; continue; }

    const startMs = srtTimeToMs(timeMatch[1], timeMatch[2], timeMatch[3], timeMatch[4]);
    const endMs = srtTimeToMs(timeMatch[5], timeMatch[6], timeMatch[7], timeMatch[8]);
    i++;

    const textLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== '') {
      textLines.push(lines[i].trim());
      i++;
    }
    const text = textLines.join(' ').replace(/<[^>]+>/g, '');
    const words = interpolateWords(text, startMs, endMs, segments.flatMap(s => s.words).length);
    segments.push({ id: id++, startMs, endMs, text, words });
    i++;
  }

  return segments;
}

function srtTimeToMs(h: string, m: string, s: string, ms: string): number {
  return (
    parseInt(h, 10) * 3_600_000 +
    parseInt(m, 10) * 60_000 +
    parseInt(s, 10) * 1_000 +
    parseInt(ms, 10)
  );
}

/** Linearly interpolate word timings within a segment. */
function interpolateWords(
  text: string,
  startMs: number,
  endMs: number,
  indexOffset: number
): TranscriptWord[] {
  const rawWords = text.split(/\s+/).filter(Boolean);
  const duration = endMs - startMs;
  const wordDuration = duration / Math.max(rawWords.length, 1);
  return rawWords.map((word, i) => ({
    index: indexOffset + i,
    word,
    startMs: startMs + i * wordDuration,
    endMs: startMs + (i + 1) * wordDuration,
  }));
}

/**
 * Compute timeline cuts when words are deleted from the transcript.
 *
 * @param segments   All transcript segments.
 * @param deletedIdx Set of word indices to delete.
 * @returns Merged list of TimelineCut operations.
 */
export function computeCuts(
  segments: TranscriptSegment[],
  deletedIdx: Set<number>
): TimelineCut[] {
  const allWords = segments.flatMap(s => s.words);
  const toDelete = allWords.filter(w => deletedIdx.has(w.index));
  if (toDelete.length === 0) return [];

  // merge adjacent deletions into single cuts
  const sorted = [...toDelete].sort((a, b) => a.startMs - b.startMs);
  const cuts: TimelineCut[] = [];
  let cur: TimelineCut = { cutStartMs: sorted[0].startMs, cutEndMs: sorted[0].endMs };

  for (let i = 1; i < sorted.length; i++) {
    const w = sorted[i];
    if (w.startMs <= cur.cutEndMs + 50) {
      // merge — allow 50 ms gap
      cur.cutEndMs = Math.max(cur.cutEndMs, w.endMs);
    } else {
      cuts.push(cur);
      cur = { cutStartMs: w.startMs, cutEndMs: w.endMs };
    }
  }
  cuts.push(cur);
  return cuts;
}

/**
 * Flatten all segments back to plain text for display.
 */
export function segmentsToPlainText(segments: TranscriptSegment[]): string {
  return segments.map(s => s.text).join(' ');
}
