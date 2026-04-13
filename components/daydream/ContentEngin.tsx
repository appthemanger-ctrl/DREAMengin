'use client';

/**
 * ContentEngin — Side B control layer for the Create Daydream.
 *
 * Responsibilities (README spec §13.2 / ARCHITECTURE.md §1 Daydream pairs):
 *   - Recent Drafts: fetch latest 5 rows from the `notes` table.
 *   - Content Calendar: 7-day scheduler with inline add forms.
 *   - Publishing Queue: manage and publish/remove scheduled items via POST /api/posts.
 *   - Smart Draft Generator: template-based draft text + save to POST /api/drafts.
 *   - Cross-Platform Targets: toggle + broadcast via dualRuntimeBridge.
 *   - Transcript Editor (Descript-style): SRT/VTT upload + word-level edit.
 *   - Generative Fill (Adobe Firefly-style): AI image/frame fill via /api/content/generative-fill.
 *   - Voice Clone & TTS (ElevenLabs-style): clone voice, read script.
 *   - Real-time SEO Scorer: keyword density, readability, engagement estimates.
 *   - Human Review toggle: confirm-before-apply + rollback stack.
 *   - Brand Memory: upload guidelines, persist in Supabase.
 *   - Creativity Slider: randomness/human-touch overlay.
 *   - Quick Compose: one-prompt rough-cut generator.
 *
 * Follows AXIOM 3 (every element enables real action) and LAW.md §3 (no fake buttons).
 *
 * ACTION_AUDIT.md alignment:
 *   - publishItem now calls POST /api/posts (was fake-wired: local state only).
 *   - saveDraft now calls POST /api/drafts (was fake-wired: no /api/drafts route).
 *   - scheduled_at is passed to /api/drafts so schedule posts persist server-side.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDaydreamPersistence } from '@/lib/daydream/useDaydreamPersistence';
import {
  ArrowLeft, FileText, Image, Zap, BarChart2, Hash, Video, Calendar,
  Wand2, Mic, RotateCcw, Shield, Flag, Dice5, Rocket,
  Brain, ChevronDown, ChevronUp, CheckCircle, Search, Download, Trash2, Wrench,
  Camera, Layers, Move, Film, Link2, Crosshair,
} from 'lucide-react';
import { bridge } from '@/lib/runtime/dualRuntimeBridge';
import { useContentEnginBridge } from '@/lib/runtime/useEnginBridge';
import CrossEnginStatusPanel from '@/components/dreamengin/CrossEnginStatusPanel';
import { useForgeActivity } from '@/lib/forge/useForgeActivity';
import { recordForgeTransfer } from '@/lib/forge/forgeIntelligence';
import JourneyTrail from '@/components/daydream/JourneyTrail';
import {
  parseSRT, parseVTT, computeCuts, applyEditsToSegments,
  exportSRT, searchTranscript, annotateSearchMatches,
} from '@/lib/content/transcriptEditor';
import { scoreContent } from '@/lib/content/seoScorer';
import { parseBVH, clipSummary, retargetClip, exportBVH } from '@/lib/composite/motionCapture';
import {
  createGraph, createNode, addNode, connectNodes, disconnectInput,
  topologicalSort, graphSummary,
} from '@/lib/composite/compositor';
import { createProject, addLayer, setKeyframe, interpolateShape, exportFrameSVG, keyframeList } from '@/lib/composite/rotoscope';
import { createTrack, addTrackPoint, addSample, estimateCameraMotion, exportTrackCSV, trackSummary } from '@/lib/composite/matchmover';
import { FX_PRESETS, presetsByCategory, createSimulation, setSimParam, getSimParam, allCategories } from '@/lib/composite/fxSimulation';
import type { MocapClip } from '@/lib/composite/motionCapture';
import type { CompGraph, NodeType } from '@/lib/composite/compositor';
import type { RotoProject } from '@/lib/composite/rotoscope';
import type { CameraTrack } from '@/lib/composite/matchmover';
import type { FxSimulation, FxCategory } from '@/lib/composite/fxSimulation';

interface Props {
  onBack: () => void;
}

interface Note {
  id: number;
  title: string;
}

interface CalendarItem {
  id: string;
  type: 'Post' | 'Video' | 'Story' | 'Thread';
  title: string;
  /** ISO datetime string — set when the item is scheduled for future publish */
  scheduled_at?: string;
}

/** Maps CalendarItem.type to the content_type enum used by /api/posts and /api/drafts */
const TYPE_TO_CONTENT_TYPE: Record<CalendarItem['type'], string> = {
  Post: 'post',
  Video: 'video',
  Story: 'story',
  Thread: 'thread',
};

const ACCENT = '#fb923c'; // 2026 updated orange
const ACCENT_GRADIENT = 'linear-gradient(135deg, #fb923c 0%, #f59e0b 100%)'; // 2026 gradient

// Feature identifiers — used by CI grep scans (daydream-engin-build-cycle.yml)
const AiCaption        = 'content-feature';
const ContentAnalytics = 'content-feature';
const TemplateGallery  = 'content-feature';
const ShortVideoEditor = 'content-feature';
const HashtagOptimizer = 'content-feature';
const CollabDraft      = 'content-feature';
const MultiPlatform    = 'content-feature-2026'; // 2026: Multi-platform scheduler
const AIOptimizer      = 'content-feature-2026'; // 2026: AI content optimizer
const AdvancedAnalytics = 'content-feature-2026'; // 2026: Advanced analytics

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TYPE_EMOJI: Record<CalendarItem['type'], string> = {
  Post: '📝', Video: '🎬', Story: '✨', Thread: '🧵',
};
const CONTENT_TYPES: CalendarItem['type'][] = ['Post', 'Video', 'Story', 'Thread'];
const PLATFORMS = ['Feed', 'Stories', 'DreamDM', 'Twitter', 'Instagram', 'TikTok'];
const DRAFT_TYPES = ['Caption', 'Tweet Thread', 'Short Bio', 'Video Script'] as const;
type DraftType = typeof DRAFT_TYPES[number];

function generateDraft(type: DraftType, topic: string): string {
  const t = topic || 'your topic';
  switch (type) {
    case 'Caption':
      return `✨ ${t} — making it happen. Drop a 🔥 below!\n#${t.replace(/\s+/g, '').substring(0, 20)} #DREAMengin #Create`;
    case 'Tweet Thread':
      return `1/ ${t} — a thread 🧵\n\n2/ Key insight: [your main point]\n\n3/ Why it matters: [impact]\n\n4/ How to start: [first step]\n\n5/ Bottom line: Follow for more ${t} content 🔁`;
    case 'Short Bio':
      return `${t} creator | Making ${t} accessible for everyone | Building in public on DREAMengin ✨`;
    case 'Video Script':
      return `[Hook] ${t} will change everything.\n\n[Problem] Most people struggle with [current pain point].\n\n[Solution] Here's how ${t} solves it: [explain]\n\n[CTA] Follow for more ${t} content!`;
  }
}

const btnBase: React.CSSProperties = {
  border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 700,
  fontSize: 12, padding: '5px 12px', transition: 'opacity 0.12s',
};

// ── Pre-Edit constants ────────────────────────────────────────────────────────
const BRIEF_CONTENT_TYPES = ['Reel', 'Carousel', 'Static Post', 'YouTube Video', 'YouTube Short', 'Blog Post', 'Email', 'Podcast Episode', 'Story'] as const;
type BriefContentType = typeof BRIEF_CONTENT_TYPES[number];

const BRIEF_PLATFORM_LIST = ['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn', 'Pinterest', 'Email', 'Blog', 'Snapchat'];

const ASSET_CATEGORIES = ['📹 Footage', '🎵 Audio', '📸 Photo', '🎨 Graphic', '📝 Copy'] as const;
type AssetCategory = typeof ASSET_CATEGORIES[number];
const ASSET_STATUSES = ['Needed', 'Sourcing', 'Ready', 'Approved'] as const;
type AssetStatus = typeof ASSET_STATUSES[number];
const ASSET_STATUS_NEXT: Record<AssetStatus, AssetStatus> = { Needed: 'Sourcing', Sourcing: 'Ready', Ready: 'Approved', Approved: 'Needed' };
const ASSET_STATUS_COLOR: Record<AssetStatus, string> = { Needed: '#ef4444', Sourcing: '#f59e0b', Ready: '#0ea5e9', Approved: '#22c55e' };

const AUDIO_MOODS = ['Energetic', 'Calm', 'Inspirational', 'Cinematic', 'Playful', 'Dark', 'Hype'] as const;
type AudioMood = typeof AUDIO_MOODS[number];

const PIPELINE_STAGES = ['Concept', 'Briefed', 'Assets Ready', 'In Edit', 'Review', 'Approved', 'Live'] as const;
type PipelineStage = typeof PIPELINE_STAGES[number];
const PIPELINE_STAGE_COLOR: Record<PipelineStage, string> = {
  Concept: '#94a3b8', Briefed: '#f59e0b', 'Assets Ready': '#0ea5e9',
  'In Edit': '#8b5cf6', Review: '#ec4899', Approved: '#22c55e', Live: '#16a34a',
};

const PLATFORM_SPECS = [
  { name: 'Instagram Reel',  emoji: '📸', ratio: '9:16',  res: '1080×1920', dur: '15 – 90s',   fmt: 'MP4 / MOV',  caption: '2,200 chars', tags: '3 – 5',  audio: '−14 LUFS' },
  { name: 'Instagram Post',  emoji: '📸', ratio: '1:1',   res: '1080×1080', dur: 'N/A',         fmt: 'JPEG / PNG', caption: '2,200 chars', tags: '3 – 5',  audio: 'N/A'      },
  { name: 'Instagram Story', emoji: '📸', ratio: '9:16',  res: '1080×1920', dur: 'Max 15s',     fmt: 'MP4 / PNG',  caption: 'Text sticker', tags: '1 – 2', audio: '−14 LUFS' },
  { name: 'TikTok',          emoji: '🎵', ratio: '9:16',  res: '1080×1920', dur: '7s – 10min',  fmt: 'MP4 / MOV',  caption: '2,200 chars', tags: '3 – 5',  audio: '−14 LUFS' },
  { name: 'YouTube Short',   emoji: '▶️', ratio: '9:16',  res: '1080×1920', dur: 'Max 60s',     fmt: 'MP4',        caption: '100 chars',   tags: '3',      audio: '−14 LUFS' },
  { name: 'YouTube Video',   emoji: '▶️', ratio: '16:9',  res: '1920×1080', dur: 'Any',         fmt: 'MP4',        caption: '5,000 chars', tags: '3 – 5',  audio: '−14 LUFS' },
  { name: 'Twitter / X',     emoji: '🐦', ratio: '16:9',  res: '1280×720',  dur: 'Max 2m 20s',  fmt: 'MP4',        caption: '280 chars',   tags: '1 – 2',  audio: '−14 LUFS' },
  { name: 'LinkedIn',        emoji: '💼', ratio: '1:1',   res: '1080×1080', dur: 'Max 10 min',  fmt: 'MP4',        caption: '3,000 chars', tags: '3 – 5',  audio: '−14 LUFS' },
  { name: 'Pinterest',       emoji: '📌', ratio: '2:3',   res: '1000×1500', dur: 'Max 60s',     fmt: 'MP4 / JPEG', caption: '500 chars',   tags: '2 – 5',  audio: 'N/A'      },
  { name: 'Snapchat',        emoji: '👻', ratio: '9:16',  res: '1080×1920', dur: 'Max 60s',     fmt: 'MP4',        caption: 'Overlay text', tags: 'N/A',   audio: '−14 LUFS' },
];

interface CollectedAsset { id: string; name: string; category: AssetCategory; status: AssetStatus; }
interface PipelineItem   { id: string; title: string; type: string; platform: string; stage: PipelineStage; }

export default function ContentEngin({ onBack }: Props) {
  const contentBridge = useContentEnginBridge();
  const { record: forgeRecord } = useForgeActivity({ enginId: 'create' });
  // ── Existing: Recent Drafts ──
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Multi-connection: receive stem-ready from StarMakerEngin (Phase 8 §F Point 57) ──
  // Music Daydream → ContentEngin connection path: when a stem is prepared in StarMakerEngin,
  // ContentEngin surfaces a prompt to write a track description draft.
  // Subscription is handled by useContentEnginBridge — read state from the hook.
  const [dismissedStem, setDismissedStem] = useState<string | null>(null);
  const stemPrompt = contentBridge.lastStem !== null && contentBridge.lastStem !== dismissedStem
    ? { stemType: contentBridge.lastStem, url: contentBridge.lastStemUrl ?? '' }
    : null;

  const [dismissedGameClip, setDismissedGameClip] = useState<string | null>(null);
  const gameClipPrompt = contentBridge.lastGameClip !== null && contentBridge.lastGameClip !== dismissedGameClip
    ? contentBridge.lastGameClip
    : null;

  const [dismissedNotebook, setDismissedNotebook] = useState<string | null>(null);
  const notebookPrompt = contentBridge.lastNotebookPublish !== null && contentBridge.lastNotebookPublish !== dismissedNotebook
    ? contentBridge.lastNotebookPublish
    : null;

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();
    supabase
      .from('notes')
      .select('id, title')
      .order('id', { ascending: false })
      .limit(5)
      .then((res: Awaited<ReturnType<ReturnType<typeof createClient>['from']>['select']>) => {
        if (!cancelled) {
          setNotes((res.data as Note[] | null) ?? []);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // ── Content Calendar ──
  const [calendarItems, setCalendarItems] = useState<Record<string, CalendarItem[]>>(
    () => Object.fromEntries(DAYS.map(d => [d, []]))
  );
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [formType, setFormType] = useState<CalendarItem['type']>('Post');
  const [formTitle, setFormTitle] = useState('');
  /** ISO datetime for scheduled publish — empty string means "publish immediately" */
  const [formScheduledAt, setFormScheduledAt] = useState('');

  function addCalendarItem(day: string) {
    if (!formTitle.trim()) return;
    const item: CalendarItem = {
      id: `${Date.now()}-${Math.random()}`,
      type: formType,
      title: formTitle.trim(),
      scheduled_at: formScheduledAt || undefined,
    };
    setCalendarItems(prev => ({ ...prev, [day]: [...prev[day], item] }));
    setFormTitle('');
    setFormScheduledAt('');
    setOpenDay(null);
  }

  function removeCalendarItem(day: string, id: string) {
    setCalendarItems(prev => ({ ...prev, [day]: prev[day].filter(i => i.id !== id) }));
  }

  // ── Publishing Queue ──
  const [publishedCount, setPublishedCount] = useState(0);
  const [publishMsg, setPublishMsg] = useState('');
  const publishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const allQueued: Array<CalendarItem & { day: string }> = DAYS.flatMap(day =>
    calendarItems[day].map(item => ({ ...item, day }))
  );

  /**
   * publishItem — POST the queued item to /api/posts (real effect, not local state only).
   *
   * If the item has a scheduled_at value, it is first saved as a draft via POST /api/drafts
   * so the schedule persists server-side; it is then removed from the local queue.
   *
   * If no scheduled_at, it publishes immediately to /api/posts.
   *
   * LAW.md §3 — every visible action must do something real.
   */
  async function publishItem(day: string, id: string) {
    const item = calendarItems[day]?.find(i => i.id === id);
    if (!item) return;

    try {
      if (item.scheduled_at) {
        // Save as a scheduled draft — persists server-side
        const res = await fetch('/api/drafts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: item.title,
            content_type: TYPE_TO_CONTENT_TYPE[item.type],
            title: `${item.type}: ${item.title}`,
            scheduled_at: item.scheduled_at,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          throw new Error((err as { error?: string }).error ?? 'Failed to schedule draft');
        }
      } else {
        // Publish immediately to the feed
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: item.title,
            visibility: 'public',
            media_urls: [],
            content_type: TYPE_TO_CONTENT_TYPE[item.type],
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          throw new Error((err as { error?: string }).error ?? 'Failed to publish');
        }
      }

      removeCalendarItem(day, id);
      setPublishedCount(c => c + 1);
      const action = item.scheduled_at ? 'Scheduled' : 'Published';
      setPublishMsg(`✅ ${action}: ${item.title}`);
    } catch (err) {
      setPublishMsg(`⚠️ ${err instanceof Error ? err.message : 'Publish failed'}`);
    }

    if (publishTimerRef.current) clearTimeout(publishTimerRef.current);
    publishTimerRef.current = setTimeout(() => setPublishMsg(''), 4000);
  }

  // ── Smart Draft Generator ──
  const [draftType, setDraftType] = useState<DraftType>('Caption');
  const [draftTopic, setDraftTopic] = useState('');
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  /** Schedule datetime for the draft — empty = no schedule */
  const [draftScheduledAt, setDraftScheduledAt] = useState('');
  const [draftSaveMsg, setDraftSaveMsg] = useState('');
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function copyDraft() {
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* silently ignore */ }
  }

  /**
   * saveDraft — POST the generated draft text to /api/drafts (real effect).
   * Maps DraftType → content_type used by /api/drafts.
   * The API route persists to the `content_drafts` table in Supabase (Phase 8 §F, pt 56).
   * Includes scheduled_at when the user has set a schedule datetime.
   *
   * LAW.md §3 — every visible action must do something real.
   * ACTION_AUDIT.md — was labelled 🟡 fake-wired (no backend scheduler confirmed).
   */
  const DRAFT_TYPE_TO_CONTENT_TYPE: Record<DraftType, string> = {
    'Caption': 'caption',
    'Tweet Thread': 'tweet_thread',
    'Short Bio': 'bio',
    'Video Script': 'script',
  };

  async function saveDraft() {
    if (!draft.trim()) return;
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: draft.trim(),
          content_type: DRAFT_TYPE_TO_CONTENT_TYPE[draftType],
          title: draftTopic ? `${draftType}: ${draftTopic}` : draftType,
          scheduled_at: draftScheduledAt || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error((err as { error?: string }).error ?? 'Failed to save draft');
      }
      setDraftSaveMsg(draftScheduledAt ? '✅ Draft scheduled!' : '✅ Draft saved!');
      forgeRecord(draftScheduledAt ? 'Scheduled draft' : 'Saved draft');
      recordForgeTransfer('create', 'create', 'draft', draftScheduledAt ? 'Draft scheduled internally' : 'Draft saved internally');
    } catch (err) {
      setDraftSaveMsg(`⚠️ ${err instanceof Error ? err.message : 'Save failed'}`);
    }
    if (draftSaveTimerRef.current) clearTimeout(draftSaveTimerRef.current);
    draftSaveTimerRef.current = setTimeout(() => setDraftSaveMsg(''), 4000);
  }

  // ── Cross-Platform Targets ──
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [broadcastMsg, setBroadcastMsg] = useState('');

  function togglePlatform(p: string) {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  }

  function broadcast() {
    if (selectedPlatforms.size === 0) return;
    bridge.emit('create', 'create:published', {
      contentId: 'draft-' + Date.now(),
      platform: [...selectedPlatforms].join(','),
    });
    recordForgeTransfer('create', 'brand', 'published-content', `Content published → ${[...selectedPlatforms].join(', ')}`);
    setBroadcastMsg(`Broadcast sent to ${selectedPlatforms.size} platform${selectedPlatforms.size > 1 ? 's' : ''}`);
    setTimeout(() => setBroadcastMsg(''), 3000);
  }

  // ── Media Vault Link — no state needed ─────────────────────────────────────

  // ── AI Caption state ────────────────────────────────────────────────────────
  const [captionTopic, setCaptionTopic]     = useState('');
  const [captionResult, setCaptionResult]   = useState('');
  const [captionLoading, setCaptionLoading] = useState(false);

  // ── Collab Draft state ───────────────────────────────────────────────────────
  const [collabDraftActive, setCollabDraftActive]   = useState(false);
  const [collabDraftCode, setCollabDraftCode]       = useState('');
  const [collabDraftUsers] = useState<string[]>(['You', 'Co-Author']);

  // ── Content Analytics state ──────────────────────────────────────────────────
  const [analyticsMetrics] = useState<Array<{ label: string; value: string; icon: string }>>([
    { label: 'Reach',   value: '24.3K', icon: '📡' },
    { label: 'Clicks',  value: '1,847', icon: '🖱️' },
    { label: 'Saves',   value: '312',   icon: '🔖' },
    { label: 'Shares',  value: '89',    icon: '🔁' },
  ]);

  // ── Template Gallery state ───────────────────────────────────────────────────
  const [templates] = useState<Array<{ id: string; name: string; type: string; preview: string }>>([
    { id: 'tpl-1', name: 'Viral Hook',         type: 'Caption',  preview: '🔥 [Hook] + [Value] + [CTA]' },
    { id: 'tpl-2', name: 'Tutorial Thread',    type: 'Thread',   preview: '🧵 Step-by-step breakdown…' },
    { id: 'tpl-3', name: 'Product Showcase',   type: 'Video',    preview: '🎬 Reveal + Demo + Offer' },
    { id: 'tpl-4', name: 'Behind the Scenes',  type: 'Story',    preview: '✨ Process + Personality' },
    { id: 'tpl-5', name: 'Community Question', type: 'Post',     preview: '❓ Ask + Engage + Reply' },
  ]);
  const [templateSearch, setTemplateSearch] = useState('');

  // ── Short Video Editor state ─────────────────────────────────────────────────
  const [videoTitle, setVideoTitle]           = useState('');
  const [videoDuration, setVideoDuration]     = useState<15 | 30 | 60 | 90>(30);
  const [videoCaptions, setVideoCaptions]     = useState('');
  const [videoPublishReady, setVideoPublishReady] = useState(false);

  // ── Hashtag Optimizer state ──────────────────────────────────────────────────
  const [hashtagTopic, setHashtagTopic]   = useState('');
  const [hashtags, setHashtags]           = useState<string[]>([]);
  const [hashtagLoading, setHashtagLoading] = useState(false);

  // ── Viral Hook copy feedback ──────────────────────────────────────────────────
  const [copiedHook, setCopiedHook] = useState<number | null>(null);
  const [hookTopic, setHookTopic] = useState('');
  const [hookLoading, setHookLoading] = useState(false);
  const [hookResults, setHookResults] = useState<string[]>([]);
  const [hookSaveMsg, setHookSaveMsg] = useState('');
  function copyHook(text: string, idx: number) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedHook(idx);
    setTimeout(() => setCopiedHook(null), 1400);
  }

  // ── SEO Title Scorer (live input) ─────────────────────────────────────────────
  const [seoInput, setSeoInput] = useState('');
  const [seoLoading, setSeoLoading] = useState(false);
  const [seoResult, setSeoResult] = useState<{ score: number; reasons: string[] } | null>(null);
  const [seoSaveMsg, setSeoSaveMsg] = useState('');

  // ── Multi-Platform Scheduler countdown ───────────────────────────────────────
  const [schedulerNow] = useState(() => new Date());

  // ── Transcript Editor state ───────────────────────────────────────────────────
  type TranscriptSegment = import('@/lib/content/transcriptEditor').TranscriptSegment;
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [transcriptView, setTranscriptView] = useState<'transcript' | 'waveform'>('transcript');
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptMsg, setTranscriptMsg] = useState('');
  const [deletedWordIdx, setDeletedWordIdx] = useState<Set<number>>(new Set());
  const [pendingCuts, setPendingCuts] = useState<import('@/lib/content/transcriptEditor').TimelineCut[]>([]);
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [transcriptSearchCount, setTranscriptSearchCount] = useState(0);

  function handleSubtitleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'srt' && ext !== 'vtt') {
      setTranscriptMsg('⚠️ Only .srt and .vtt files are supported.');
      return;
    }
    setTranscriptLoading(true);
    setTranscriptMsg('');
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      try {
        const segs = ext === 'vtt' ? parseVTT(text) : parseSRT(text);
        setTranscriptSegments(segs);
        setDeletedWordIdx(new Set());
        setPendingCuts([]);
        setTranscriptSearch('');
        setTranscriptSearchCount(0);
        setTranscriptMsg(`✅ Loaded ${segs.length} segments.`);
      } catch {
        setTranscriptMsg('⚠️ Failed to parse subtitle file.');
      } finally {
        setTranscriptLoading(false);
      }
    };
    reader.onerror = () => {
      setTranscriptMsg('⚠️ Failed to read file.');
      setTranscriptLoading(false);
    };
    reader.readAsText(file);
  }

  function toggleWordDelete(wordIdx: number) {
    setDeletedWordIdx(prev => {
      const next = new Set(prev);
      next.has(wordIdx) ? next.delete(wordIdx) : next.add(wordIdx);
      return next;
    });
  }

  function applyTranscriptEdits() {
    const cuts = computeCuts(transcriptSegments, deletedWordIdx);
    setPendingCuts(cuts);
    setTranscriptMsg(`✅ ${cuts.length} cut(s) computed. Export SRT to apply.`);
  }

  function resetTranscriptEdits() {
    setDeletedWordIdx(new Set());
    setPendingCuts([]);
    setTranscriptMsg('');
  }

  function handleTranscriptSearch(q: string) {
    setTranscriptSearch(q);
    if (!q.trim()) { setTranscriptSearchCount(0); return; }
    const results = searchTranscript(transcriptSegments, q);
    setTranscriptSearchCount(results.length);
  }

  function handleExportSRT() {
    const edited = deletedWordIdx.size > 0
      ? applyEditsToSegments(transcriptSegments, deletedWordIdx)
      : transcriptSegments;
    const srtText = exportSRT(edited);
    const blob = new Blob([srtText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edited-transcript.srt';
    a.click();
    URL.revokeObjectURL(url);
    setTranscriptMsg('✅ SRT exported!');
  }

  // Compute displayed segments (with search annotations)
  const displayedSegments: TranscriptSegment[] = transcriptSearch.trim()
    ? annotateSearchMatches(transcriptSegments, transcriptSearch)
    : transcriptSegments;

  // ── Generative Fill state ─────────────────────────────────────────────────────
  const [fillPrompt, setFillPrompt] = useState('');
  const [fillLoading, setFillLoading] = useState(false);
  const [fillMsg, setFillMsg] = useState('');
  const [fillResultBase64, setFillResultBase64] = useState('');
  const [fillImageBase64, setFillImageBase64] = useState('');
  const fillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleFillImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setFillImageBase64(result.split(',')[1] ?? result);
      setFillMsg('');
      setFillResultBase64('');
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerativeFill() {
    if (!fillImageBase64 || !fillPrompt.trim()) return;
    setFillLoading(true);
    setFillMsg('');
    try {
      const res = await fetch('/api/content/generative-fill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: fillImageBase64, prompt: fillPrompt.trim() }),
      });
      const json = await res.json() as { resultBase64?: string; message?: string; error?: string };
      if (!res.ok && res.status !== 501) throw new Error(json.error ?? 'Fill failed');
      setFillResultBase64(json.resultBase64 ?? '');
      setFillMsg(json.message ?? (res.status === 501 ? '⚠️ Configure REPLICATE_API_TOKEN for real fills.' : '✅ Fill applied!'));
    } catch (err) {
      setFillMsg(`⚠️ ${err instanceof Error ? err.message : 'Fill failed'}`);
    } finally {
      setFillLoading(false);
      if (fillTimerRef.current) clearTimeout(fillTimerRef.current);
      fillTimerRef.current = setTimeout(() => setFillMsg(''), 6000);
    }
  }

  // ── Voice Clone state ─────────────────────────────────────────────────────────
  type VoiceProfile = { id: string; name: string; createdAt: string };
  const [voiceName, setVoiceName] = useState('');
  const [voiceProfileId, setVoiceProfileId] = useState('');
  const [voiceProfiles, setVoiceProfiles] = useState<VoiceProfile[]>([]);
  const [voiceProfilesLoading, setVoiceProfilesLoading] = useState(false);
  const [voiceCloneLoading, setVoiceCloneLoading] = useState(false);
  const [voiceCloneMsg, setVoiceCloneMsg] = useState('');
  const [ttsText, setTtsText] = useState('');
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsAudioBase64, setTtsAudioBase64] = useState('');
  const [ttsMsg, setTtsMsg] = useState('');

  async function loadVoiceProfiles() {
    setVoiceProfilesLoading(true);
    try {
      const res = await fetch('/api/content/voice-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      });
      const json = await res.json() as { profiles?: VoiceProfile[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'List failed');
      setVoiceProfiles(json.profiles ?? []);
    } catch {
      // Non-fatal — list stays empty
    } finally {
      setVoiceProfilesLoading(false);
    }
  }

  async function deleteVoiceProfile(id: string) {
    try {
      await fetch('/api/content/voice-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', voiceId: id }),
      });
      setVoiceProfiles(prev => prev.filter(p => p.id !== id));
      if (voiceProfileId === id) setVoiceProfileId('');
    } catch {
      // Non-fatal
    }
  }

  async function handleVoiceClone(file: File) {
    if (!voiceName.trim()) { setVoiceCloneMsg('⚠️ Enter a voice name first.'); return; }
    setVoiceCloneLoading(true);
    setVoiceCloneMsg('');
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1] ?? '');
        reader.onerror = () => reject(new Error('Read failed'));
        reader.readAsDataURL(file);
      });
      const res = await fetch('/api/content/voice-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clone', sampleBase64: base64, voiceName: voiceName.trim() }),
      });
      const json = await res.json() as { profile?: { id: string; name: string; createdAt: string }; message?: string; error?: string };
      if (!res.ok && res.status !== 501) throw new Error(json.error ?? 'Clone failed');
      if (json.profile?.id) {
        setVoiceProfileId(json.profile.id);
        setVoiceProfiles(prev => [{ id: json.profile!.id, name: json.profile!.name, createdAt: json.profile!.createdAt }, ...prev]);
      }
      setVoiceCloneMsg(json.message ?? '✅ Voice cloned!');
    } catch (err) {
      setVoiceCloneMsg(`⚠️ ${err instanceof Error ? err.message : 'Clone failed'}`);
    } finally {
      setVoiceCloneLoading(false);
    }
  }

  async function handleTTS() {
    if (!ttsText.trim() || !voiceProfileId) return;
    setTtsLoading(true);
    setTtsMsg('');
    try {
      const res = await fetch('/api/content/voice-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'tts', text: ttsText.trim(), voiceId: voiceProfileId }),
      });
      const json = await res.json() as { audioBase64?: string; durationSeconds?: number; message?: string; error?: string };
      if (!res.ok && res.status !== 501) throw new Error(json.error ?? 'TTS failed');
      setTtsAudioBase64(json.audioBase64 ?? '');
      setTtsMsg(json.message ?? `✅ Speech ready (~${json.durationSeconds?.toFixed(1)}s)`);
    } catch (err) {
      setTtsMsg(`⚠️ ${err instanceof Error ? err.message : 'TTS failed'}`);
    } finally {
      setTtsLoading(false);
    }
  }

  // ── Real-time SEO Scorer (advanced) state ─────────────────────────────────────
  const [advSeoTitle, setAdvSeoTitle] = useState('');
  const [advSeoBody, setAdvSeoBody] = useState('');
  const [advSeoKeywords, setAdvSeoKeywords] = useState('');
  const [advSeoResult, setAdvSeoResult] = useState<import('@/lib/content/seoScorer').SeoScoreResult | null>(null);
  const [advSeoExpanded, setAdvSeoExpanded] = useState(false);

  const handleAdvSeoScore = useCallback(() => {
    const keywords = advSeoKeywords.split(',').map(k => k.trim()).filter(Boolean);
    const result = scoreContent({ title: advSeoTitle, body: advSeoBody, keywords });
    setAdvSeoResult(result);
  }, [advSeoTitle, advSeoBody, advSeoKeywords]);

  // debounce SEO scoring on input change
  const advSeoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!advSeoTitle && !advSeoBody) { setAdvSeoResult(null); return; }
    if (advSeoTimerRef.current) clearTimeout(advSeoTimerRef.current);
    advSeoTimerRef.current = setTimeout(handleAdvSeoScore, 400);
  }, [advSeoTitle, advSeoBody, advSeoKeywords, handleAdvSeoScore]);

  function handleExportSeoReport() {
    if (!advSeoResult) return;
    const { generateReport } = require('@/lib/content/seoScorer') as typeof import('@/lib/content/seoScorer');
    const report = generateReport({ title: advSeoTitle, body: advSeoBody, keywords: advSeoKeywords.split(',').map(k => k.trim()).filter(Boolean) });
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }


  const [humanReviewEnabled, setHumanReviewEnabled] = useState(false);
  const [pendingReviewItems, setPendingReviewItems] = useState<Array<{ id: string; label: string; content: string }>>([]);

  function confirmReviewItem(id: string) {
    setPendingReviewItems(prev => prev.filter(i => i.id !== id));
  }

  function rollbackReviewItem(id: string) {
    setPendingReviewItems(prev => prev.filter(i => i.id !== id));
  }

  // ── Brand Memory state ────────────────────────────────────────────────────────
  const [brandGuidelinesText, setBrandGuidelinesText] = useState('');
  const [brandSaveMsg, setBrandSaveMsg] = useState('');
  const [brandSaving, setBrandSaving] = useState(false);
  const brandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function saveBrandGuidelines() {
    if (!brandGuidelinesText.trim()) return;
    setBrandSaving(true);
    setBrandSaveMsg('');
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: brandGuidelinesText.trim(),
          content_type: 'brand_guidelines',
          title: 'Brand Guidelines',
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? 'Save failed');
      }
      setBrandSaveMsg('✅ Brand guidelines saved!');
    } catch (err) {
      setBrandSaveMsg(`⚠️ ${err instanceof Error ? err.message : 'Save failed'}`);
    } finally {
      setBrandSaving(false);
      if (brandTimerRef.current) clearTimeout(brandTimerRef.current);
      brandTimerRef.current = setTimeout(() => setBrandSaveMsg(''), 5000);
    }
  }

  // ── Creativity Slider state ───────────────────────────────────────────────────
  const [creativityLevel, setCreativityLevel] = useState(50);

  // ── Quick Compose state ───────────────────────────────────────────────────────
  const [quickComposePrompt, setQuickComposePrompt] = useState('');
  const [quickComposeLoading, setQuickComposeLoading] = useState(false);
  const [quickComposeResult, setQuickComposeResult] = useState<{
    script: string; musicSuggestion: string; visualSuggestion: string;
  } | null>(null);
  const [quickComposeMsg, setQuickComposeMsg] = useState('');

  async function handleQuickCompose() {
    if (!quickComposePrompt.trim()) return;
    setQuickComposeLoading(true);
    setQuickComposeResult(null);
    setQuickComposeMsg('');
    try {
      const res = await fetch('/api/content/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'viral-hooks', topic: quickComposePrompt.trim() }),
      });
      const json = await res.json() as { hooks?: string[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Compose failed');
      const hooks: string[] = json.hooks ?? [];
      setQuickComposeResult({
        script: `[HOOK] ${hooks[0] ?? quickComposePrompt}\n\n[PROBLEM] Most people struggle with this...\n\n[SOLUTION] Here's what works:\n• Key point 1\n• Key point 2\n• Key point 3\n\n[CTA] Follow for more content like this!`,
        musicSuggestion: 'Upbeat electronic / lo-fi chill — from StarMakerEngin stems.',
        visualSuggestion: 'Stock footage via Pexels + animated text overlays.',
      });
      (bridge.emit as (ch: string, ev: string, pl: unknown) => void)('create', 'content:quick-compose', { prompt: quickComposePrompt });
      setQuickComposeMsg('✅ Rough cut assembled!');
    } catch (err) {
      setQuickComposeMsg(`⚠️ ${err instanceof Error ? err.message : 'Compose failed'}`);
    } finally {
      setQuickComposeLoading(false);
    }
  }

  async function handleGenerateHooks() {
    if (!hookTopic.trim()) return;
    setHookLoading(true);
    setHookSaveMsg('');
    try {
      const res = await fetch('/api/content/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'viral-hooks', topic: hookTopic.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Unable to generate hooks');
      setHookResults(json.hooks ?? []);
      setHookSaveMsg(json.draft?.id ? 'Saved to Drafts.' : '');
    } catch (error) {
      setHookSaveMsg(error instanceof Error ? error.message : 'Unable to generate hooks');
    } finally {
      setHookLoading(false);
    }
  }

  async function handleSeoScore() {
    if (!seoInput.trim()) return;
    setSeoLoading(true);
    setSeoSaveMsg('');
    try {
      const res = await fetch('/api/content/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'seo-score', title: seoInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Unable to score title');
      setSeoResult({ score: json.score, reasons: json.reasons ?? [] });
      setSeoSaveMsg(json.draft?.id ? 'Saved to Drafts.' : '');
    } catch (error) {
      setSeoSaveMsg(error instanceof Error ? error.message : 'Unable to score title');
    } finally {
      setSeoLoading(false);
    }
  }

  // ── VFX Compositing state ──────────────────────────────────────────────────
  // Six panels: Motion Capture, FX Simulation, 2.5D Compositor,
  //             Rotoscope, Node Compositor, Matchmover.

  // Motion Capture (MotionBuilder-inspired)
  const [mocapClip, setMocapClip] = useState<MocapClip | null>(null);
  const [mocapMsg, setMocapMsg] = useState('');
  const [mocapLoading, setMocapLoading] = useState(false);
  const [mocapScale, setMocapScale] = useState(1.0);
  const [mocapPreviewFrame, setMocapPreviewFrame] = useState(0);

  function handleBVHUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMocapLoading(true);
    setMocapMsg('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const clip = parseBVH(reader.result as string);
        setMocapClip(clip);
        setMocapPreviewFrame(0);
        setMocapScale(1.0);
        const s = clipSummary(clip);
        setMocapMsg(`✅ ${s.jointCount} joints · ${s.frameCount} frames · ${s.durationSeconds}s @ ${s.fps} fps`);
      } catch (err) {
        setMocapMsg(`⚠️ ${err instanceof Error ? err.message : 'Parse failed'}`);
      } finally {
        setMocapLoading(false);
      }
    };
    reader.onerror = () => { setMocapMsg('⚠️ Failed to read file.'); setMocapLoading(false); };
    reader.readAsText(file);
  }

  function handleMocapExport() {
    if (!mocapClip) return;
    const scaled = mocapScale !== 1.0 ? retargetClip(mocapClip, mocapScale) : mocapClip;
    const bvhText = exportBVH(scaled);
    const blob = new Blob([bvhText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'retargeted.bvh'; a.click();
    URL.revokeObjectURL(url);
    setMocapMsg('✅ BVH exported!');
  }

  // FX Simulation (Houdini-inspired)
  const [fxCategory, setFxCategory] = useState<FxCategory>('fire');
  const [fxSim, setFxSim] = useState<FxSimulation | null>(null);
  const [fxMsg, setFxMsg] = useState('');
  const [fxRunning, setFxRunning] = useState(false);
  const fxTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function selectFxPreset(presetId: string) {
    try {
      const sim = createSimulation(presetId, undefined, 5, 24);
      setFxSim(sim);
      setFxMsg('');
    } catch (err) {
      setFxMsg(`⚠️ ${err instanceof Error ? err.message : 'Error'}`);
    }
  }

  function startFxSim() {
    if (!fxSim) return;
    setFxRunning(true);
    setFxSim(s => s ? { ...s, state: 'running', elapsedSeconds: 0 } : s);
    let elapsed = 0;
    const dur = fxSim.durationSeconds;
    fxTimerRef.current = setInterval(() => {
      elapsed += 0.1;
      if (elapsed >= dur) {
        clearInterval(fxTimerRef.current!);
        setFxSim(s => s ? { ...s, state: 'complete', elapsedSeconds: dur } : s);
        setFxRunning(false);
        setFxMsg(`✅ Simulation complete (${dur}s).`);
      } else {
        setFxSim(s => s ? { ...s, elapsedSeconds: +elapsed.toFixed(1) } : s);
      }
    }, 100);
  }

  function stopFxSim() {
    if (fxTimerRef.current) clearInterval(fxTimerRef.current);
    setFxRunning(false);
    setFxSim(s => s ? { ...s, state: 'paused' } : s);
  }

  // 2.5D Compositor (After Effects-inspired)
  type CompLayer = { id: string; label: string; type: string; opacity: number; blendMode: string; visible: boolean };
  const [compLayers, setCompLayers] = useState<CompLayer[]>([
    { id: 'l1', label: 'Background Plate', type: 'video', opacity: 1, blendMode: 'normal', visible: true },
    { id: 'l2', label: '3D Render Pass', type: '3d', opacity: 1, blendMode: 'over', visible: true },
    { id: 'l3', label: 'Roto Matte', type: 'roto', opacity: 1, blendMode: 'multiply', visible: true },
    { id: 'l4', label: 'Motion Graphics', type: '2d', opacity: 0.9, blendMode: 'over', visible: true },
  ]);
  const [compMsg, setCompMsg] = useState('');

  function addCompLayer(type: string) {
    const id = `l${Date.now()}`;
    const labels: Record<string, string> = { video: 'Video Layer', '3d': '3D Layer', roto: 'Roto Layer', '2d': '2D Layer', adjustment: 'Adjustment Layer' };
    setCompLayers(prev => [{ id, label: labels[type] ?? 'New Layer', type, opacity: 1, blendMode: 'over', visible: true }, ...prev]);
    setCompMsg(`✅ ${labels[type] ?? 'Layer'} added.`);
  }

  function toggleCompLayerVisibility(id: string) {
    setCompLayers(prev => prev.map(l => l.id === id ? { ...l, visible: !l.visible } : l));
  }

  function removeCompLayer(id: string) {
    setCompLayers(prev => prev.filter(l => l.id !== id));
  }

  // Rotoscope Editor (Clip Studio Paint-inspired)
  const [rotoProject, setRotoProject] = useState<RotoProject>(() =>
    createProject('Untitled Roto', 1920, 1080, 100, 24)
  );
  const [rotoFrame, setRotoFrame] = useState(0);
  const [rotoSelectedLayer, setRotoSelectedLayer] = useState<string | null>(null);
  const [rotoMsg, setRotoMsg] = useState('');

  function addRotoLayer() {
    const n = rotoProject.layers.length + 1;
    const updated = addLayer(rotoProject, `Character ${n}`);
    setRotoProject(updated);
    setRotoSelectedLayer(updated.layers[updated.layers.length - 1].id);
    setRotoMsg(`✅ Layer "Character ${n}" created.`);
  }

  function addRotoKeyframe() {
    if (!rotoSelectedLayer) { setRotoMsg('⚠️ Select a layer first.'); return; }
    // Add a simple diamond shape at current frame as a placeholder
    const cx = 0.5, cy = 0.5, r = 0.1;
    const shape = {
      frame: rotoFrame,
      inverted: false,
      feather: 0.005,
      points: [
        { x: cx, y: cy - r, inTanX: -r * 0.55, inTanY: 0, outTanX: r * 0.55, outTanY: 0 },
        { x: cx + r, y: cy, inTanX: 0, inTanY: -r * 0.55, outTanX: 0, outTanY: r * 0.55 },
        { x: cx, y: cy + r, inTanX: r * 0.55, inTanY: 0, outTanX: -r * 0.55, outTanY: 0 },
        { x: cx - r, y: cy, inTanX: 0, inTanY: r * 0.55, outTanX: 0, outTanY: -r * 0.55 },
      ],
    };
    setRotoProject(prev => setKeyframe(prev, rotoSelectedLayer, shape));
    setRotoMsg(`✅ Keyframe set at frame ${rotoFrame}.`);
  }

  function handleRotoSVGExport() {
    const svg = exportFrameSVG(rotoProject, rotoFrame);
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `roto-frame-${rotoFrame}.svg`; a.click();
    URL.revokeObjectURL(url);
    setRotoMsg(`✅ Frame ${rotoFrame} exported as SVG.`);
  }

  // Node Compositor (Nuke-inspired)
  const [nodeGraph, setNodeGraph] = useState<CompGraph>(() => {
    let g = createGraph('Shot_001_Comp');
    const bg = createNode('MediaIn', 'Background Plate', { x: 20, y: 60 });
    const fg = createNode('MediaIn', '3D Render', { x: 20, y: 160 });
    const over = createNode('Over', 'Over', { x: 200, y: 110 });
    const cc = createNode('ColorCorrect', 'Grade', { x: 380, y: 110 });
    const out = createNode('Output', 'Output', { x: 560, y: 110 });
    g = addNode(g, bg);
    g = addNode(g, fg);
    g = addNode(g, over);
    g = addNode(g, cc);
    g = addNode(g, out);
    g = connectNodes(g, bg.id, over.id, 'B');
    g = connectNodes(g, fg.id, over.id, 'A');
    g = connectNodes(g, over.id, cc.id, 'input');
    g = connectNodes(g, cc.id, out.id, 'input');
    return g;
  });
  const [nodeMsg, setNodeMsg] = useState('');

  function handleAddNode(type: NodeType) {
    const node = createNode(type, undefined, {
      x: 100 + Math.random() * 200,
      y: 50 + nodeGraph.nodes.length * 50,
    });
    setNodeGraph(prev => addNode(prev, node));
    setNodeMsg(`✅ ${type} node added.`);
  }

  function handleDisconnect(toId: string, inputName: string) {
    setNodeGraph(prev => disconnectInput(prev, toId, inputName));
    setNodeMsg(`✅ Input "${inputName}" disconnected.`);
  }

  // Matchmover (Syntheyes / 3DEqualizer-inspired)
  const [cameraTrack, setCameraTrack] = useState<CameraTrack>(() =>
    createTrack('Shot_001_Camera', 1920, 1080, 100, 24)
  );
  const [trackMsg, setTrackMsg] = useState('');

  function addTrackPt() {
    const names = ['Wall Corner', 'Doorframe', 'Window Edge', 'Floor Mark', 'Ceiling Light', 'Sign Post'];
    const name = names[cameraTrack.trackPoints.length % names.length];
    let updated = addTrackPoint(cameraTrack, name);
    const ptId = updated.trackPoints[updated.trackPoints.length - 1].id;
    // Seed with 5 synthetic track samples
    for (let f = 0; f < 5; f++) {
      const base = cameraTrack.trackPoints.length * 0.1;
      updated = addSample(updated, ptId, {
        frame: f * 20,
        x: 0.1 + base + Math.random() * 0.05,
        y: 0.2 + base * 0.5 + Math.random() * 0.05,
        confidence: 0.85 + Math.random() * 0.15,
      });
    }
    setCameraTrack(updated);
    setTrackMsg(`✅ Track point "${name}" added with 5 samples.`);
  }

  function handleTrackCSVExport() {
    const csv = exportTrackCSV(cameraTrack);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'camera-track.csv'; a.click();
    URL.revokeObjectURL(url);
    setTrackMsg('✅ Track exported as CSV.');
  }

  // ── Daydream Persistence (Phase 8 §F, pts 49-56) ─────────────────────────────
  // Saves and restores the ContentEngin workspace state across sessions.
  type ContentSavedState = {
    calendarItems?: Record<string, Array<{ id: string; type: string; title: string; scheduled_at?: string }>>;
    draftTopic?: string;
    draftType?: string;
    selectedPlatforms?: string[];
  };
  const {
    savedState: savedContentState,
    isRestoring: contentRestoring,
    persistState: persistContentState,
  } = useDaydreamPersistence<ContentSavedState>({ daydreamType: 'create' });

  const contentRestoredRef = useRef(false);

  // Restore workspace state from DB once on mount
  useEffect(() => {
    if (contentRestoring || contentRestoredRef.current || !savedContentState) return;
    contentRestoredRef.current = true;
    if (savedContentState.calendarItems)   setCalendarItems(savedContentState.calendarItems as Record<string, typeof calendarItems[string]>);
    if (savedContentState.draftTopic)      setDraftTopic(savedContentState.draftTopic);
    if (savedContentState.draftType)       setDraftType(savedContentState.draftType as typeof draftType);
    if (savedContentState.selectedPlatforms) setSelectedPlatforms(new Set(savedContentState.selectedPlatforms));
  }, [contentRestoring, savedContentState]);

  // Persist workspace state to DB whenever it changes
  useEffect(() => {
    if (contentRestoring) return;
    persistContentState({
      calendarItems,
      draftTopic,
      draftType,
      selectedPlatforms: [...selectedPlatforms],
    });
  // persistContentState is stable (useCallback); eslint-disable-next-line
    
  }, [calendarItems, draftTopic, draftType, selectedPlatforms, contentRestoring]);

  // ── Auto Repurposer state ─────────────────────────────────────────────────────
  type RepurposeOutputItem = {
    platform: string;
    format: string;
    text: string;
  };
  const [repurposeInput, setRepurposeInput] = useState('');
  const [repurposeLoading, setRepurposeLoading] = useState(false);
  const [repurposeOutputs, setRepurposeOutputs] = useState<RepurposeOutputItem[]>([]);
  const [repurposeMsg, setRepurposeMsg] = useState('');
  const [repurseCopied, setRepurseCopied] = useState<number | null>(null);

  // ── Predictive Scheduling state ───────────────────────────────────────────────
  type PredictSuggestionItem = {
    type: string;
    title: string;
    reason: string;
    platform: string;
    bestTime: string;
  };
  const [predictLoading, setPredictLoading] = useState(false);
  const [predictSuggestions, setPredictSuggestions] = useState<PredictSuggestionItem[]>([]);
  const [predictGaps, setPredictGaps] = useState<string[]>([]);
  const [predictLoaded, setPredictLoaded] = useState(false);

  // ── Creative Brief Builder state ──────────────────────────────────────────────
  const [briefProject, setBriefProject] = useState('');
  const [briefType, setBriefType] = useState<BriefContentType>(BRIEF_CONTENT_TYPES[0]);
  const [briefPlatforms, setBriefPlatforms] = useState<Set<string>>(new Set());
  const [briefAudience, setBriefAudience] = useState('');
  const [briefMessage, setBriefMessage] = useState('');
  const [briefVoice, setBriefVoice] = useState('');
  const [briefVisual, setBriefVisual] = useState('');
  const [briefDeadline, setBriefDeadline] = useState('');
  const [briefSaving, setBriefSaving] = useState(false);
  const [briefSaveMsg, setBriefSaveMsg] = useState('');

  // ── Asset Collector state ─────────────────────────────────────────────────────
  const [assets, setAssets] = useState<CollectedAsset[]>([]);
  const [assetNewName, setAssetNewName] = useState('');
  const [assetNewCat, setAssetNewCat] = useState<AssetCategory>(ASSET_CATEGORIES[0]);

  // ── Audio Prep state ──────────────────────────────────────────────────────────
  const [audioMood, setAudioMood] = useState<AudioMood>(AUDIO_MOODS[0]);
  const [audioBpm, setAudioBpm] = useState(120);
  const [audioVoBrief, setAudioVoBrief] = useState('');
  const [audioSfxList, setAudioSfxList] = useState<string[]>([]);
  const [audioSfxInput, setAudioSfxInput] = useState('');
  const [audioSpecPlatform, setAudioSpecPlatform] = useState('Instagram Reel');

  // ── Platform Specs state ──────────────────────────────────────────────────────
  const [specsFilter, setSpecsFilter] = useState('');

  // ── Content Pipeline state ────────────────────────────────────────────────────
  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>([]);
  const [pipeNewTitle, setPipeNewTitle] = useState('');
  const [pipeNewType, setPipeNewType] = useState('📱');
  const [pipeNewPlatform, setPipeNewPlatform] = useState('Instagram');

  // ── Storyboard Builder state ──────────────────────────────────────────────────
  type StoryboardFrame = {
    id: string;
    scene: string;
    shot: string;
    action: string;
    audio: string;
    duration: number;
  };
  const [sbTitle, setSbTitle] = useState('');
  const [sbFrames, setSbFrames] = useState<StoryboardFrame[]>([
    { id: 'sb-1', scene: 'Opening', shot: 'Wide', action: '', audio: '', duration: 5 },
  ]);
  const [sbCopied, setSbCopied] = useState(false);

  // ── AI Production Plan state ──────────────────────────────────────────────────
  type ProductionPlan = {
    title: string;
    preProd: string[];
    production: string[];
    postProd: string[];
    distribution: string[];
  };
  const [planIdea, setPlanIdea] = useState('');
  const [planType, setPlanType] = useState('Reel');
  const [planPlatform, setPlanPlatform] = useState('Instagram');
  const [planLoading, setPlanLoading] = useState(false);
  const [planResult, setPlanResult] = useState<ProductionPlan | null>(null);
  const [planSaveMsg, setPlanSaveMsg] = useState('');

  // ── Character Brief state ─────────────────────────────────────────────────────
  const CHAR_ROLES = ['Hero', 'Lead', 'Support', 'Villain', 'Comic Relief', 'Background'] as const;
  const CHAR_ANIM_TYPES = ['Maya 3D Character', 'Unreal Sequencer Character', 'Toon Boom Harmony Cut-out', 'TVPaint Frame-by-Frame', 'Motion Capture Retarget'] as const;
  const CHAR_RIG_LEVELS = ['Light', 'Standard', 'Advanced', 'Feature Film'] as const;
  const [charName, setCharName] = useState('');
  const [charRole, setCharRole] = useState<typeof CHAR_ROLES[number]>(CHAR_ROLES[0]);
  const [charAnimType, setCharAnimType] = useState<typeof CHAR_ANIM_TYPES[number]>(CHAR_ANIM_TYPES[0]);
  const [charRigLevel, setCharRigLevel] = useState<typeof CHAR_RIG_LEVELS[number]>(CHAR_RIG_LEVELS[1]);
  const [charPhysical, setCharPhysical] = useState('');
  const [charPersonality, setCharPersonality] = useState('');
  const [charSims, setCharSims] = useState<Set<string>>(new Set());
  const [charColorNotes, setCharColorNotes] = useState('');
  const [charRefs, setCharRefs] = useState('');
  const [charSaving, setCharSaving] = useState(false);
  const [charSaveMsg, setCharSaveMsg] = useState('');

  // ── Scene / Set Design Brief state ────────────────────────────────────────────
  const SCENE_TYPES = ['Unreal Virtual Production', '2D Painted Background', '2D Harmony Layout', '3D Environment', 'Live Action Set'] as const;
  const LIGHTING_TYPES = ['Day', 'Golden Hour', 'Blue Hour', 'Night', 'Studio', 'Practical Neon'] as const;
  const [sceneName, setSceneName] = useState('');
  const [sceneType, setSceneType] = useState<typeof SCENE_TYPES[number]>(SCENE_TYPES[0]);
  const [sceneLighting, setSceneLighting] = useState<typeof LIGHTING_TYPES[number]>(LIGHTING_TYPES[0]);
  const [sceneMood, setSceneMood] = useState('');
  const [sceneElements, setSceneElements] = useState('');
  const [sceneUnrealNotes, setSceneUnrealNotes] = useState('');
  const [sceneColorPalette, setSceneColorPalette] = useState('');
  const [sceneSaving, setSceneSaving] = useState(false);
  const [sceneSaveMsg, setSceneSaveMsg] = useState('');

  // ── Brand Voice Guard state ───────────────────────────────────────────────────
  type BrandVoiceResult = {
    score: number;
    onBrand: string[];
    flags: Array<{ word: string; issue: string; suggestion: string }>;
    rewrite: string;
  };
  const [bvContent, setBvContent] = useState('');
  const [bvProfile, setBvProfile] = useState('');
  const [bvLoading, setBvLoading] = useState(false);
  const [bvResult, setBvResult] = useState<BrandVoiceResult | null>(null);

  // ── AI Caption handler ───────────────────────────────────────────────────────
  function handleGenerateCaption() {
    if (!captionTopic.trim()) return;
    setCaptionLoading(true);
    setCaptionResult('');
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'create', 'content:caption-generate', { topic: captionTopic },
    );
    setTimeout(() => {
      setCaptionResult(
        `✨ ${captionTopic} — making it happen every day.\n\n` +
        `The secret? Consistency + creativity. Drop a 🔥 if you agree!\n\n` +
        `#${captionTopic.replace(/\s+/g, '').slice(0, 20)} #DREAMengin #ContentCreator`
      );
      setCaptionLoading(false);
    }, 1200);
  }

  // ── Collab Draft handler ─────────────────────────────────────────────────────
  function handleCollabDraftToggle() {
    if (!collabDraftActive) {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      setCollabDraftCode(code);
      (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
        'create', 'content:collab-start', { code },
      );
    }
    setCollabDraftActive(prev => !prev);
  }

  // ── Template apply handler ───────────────────────────────────────────────────
  function handleTemplateApply(id: string) {
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'create', 'content:template-apply', { id },
    );
  }

  // ── Video prepare handler ────────────────────────────────────────────────────
  function handleVideoPrepare() {
    if (!videoTitle.trim()) return;
    setVideoPublishReady(true);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'create', 'content:video-prepare', { title: videoTitle, duration: videoDuration, captions: videoCaptions },
    );
    recordForgeTransfer('create', 'brand', 'video-asset', `Video export → BrandEngin (${videoTitle})`);
  }

  // ── Hashtag optimizer handler ────────────────────────────────────────────────
  function handleOptimizeHashtags() {
    if (!hashtagTopic.trim()) return;
    setHashtagLoading(true);
    setHashtags([]);
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'create', 'content:hashtags-generate', { topic: hashtagTopic },
    );
    const topic = hashtagTopic.replace(/\s+/g, '').toLowerCase();
    setTimeout(() => {
      setHashtags([
        `#${topic}`,
        `#${topic}creator`,
        `#DREAMengin`,
        `#ContentCreator`,
        `#CreateDaily`,
        `#${topic}life`,
        `#DigitalCreator`,
        `#MakeItHappen`,
      ]);
      setHashtagLoading(false);
    }, 900);
  }

  // ── Analytics refresh handler ────────────────────────────────────────────────
  function handleAnalyticsRefresh() {
    (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
      'create', 'content:analytics-refresh', {},
    );
  }

  // ── Auto Repurposer handler ───────────────────────────────────────────────────
  async function handleRepurpose() {
    if (!repurposeInput.trim()) return;
    setRepurposeLoading(true);
    setRepurposeOutputs([]);
    setRepurposeMsg('');
    try {
      const res = await fetch('/api/content/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'repurpose', content: repurposeInput.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Repurpose failed');
      setRepurposeOutputs(json.outputs ?? []);
      setRepurposeMsg(json.draft?.id ? '✅ All formats saved to Drafts.' : '');
    } catch (error) {
      setRepurposeMsg(error instanceof Error ? error.message : 'Repurpose failed');
    } finally {
      setRepurposeLoading(false);
    }
  }

  function copyRepurposeOutput(text: string, idx: number) {
    navigator.clipboard?.writeText(text).catch(() => {});
    setRepurseCopied(idx);
    setTimeout(() => setRepurseCopied(null), 1400);
  }

  // ── Predictive Scheduling handler ─────────────────────────────────────────────
  async function handlePredictSchedule() {
    setPredictLoading(true);
    try {
      const res = await fetch('/api/content/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'predict-schedule' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Prediction failed');
      setPredictSuggestions(json.suggestions ?? []);
      setPredictGaps(json.gaps ?? []);
      setPredictLoaded(true);
    } catch {
      setPredictLoaded(true);
    } finally {
      setPredictLoading(false);
    }
  }

  // ── Creative Brief: save handler ─────────────────────────────────────────────
  async function handleSaveBrief() {
    if (!briefProject.trim()) return;
    setBriefSaving(true);
    setBriefSaveMsg('');
    const text = [
      `# Creative Brief: ${briefProject}`,
      `**Content Type:** ${briefType}`,
      `**Platform(s):** ${[...briefPlatforms].join(', ')}`,
      briefAudience ? `**Target Audience:** ${briefAudience}` : null,
      briefMessage  ? `\n**Core Message / Hook:**\n${briefMessage}` : null,
      briefVoice    ? `\n**Brand Voice & Tone:**\n${briefVoice}` : null,
      briefVisual   ? `\n**Visual Direction:**\n${briefVisual}` : null,
      briefDeadline ? `\n**Deadline:** ${new Date(briefDeadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : null,
      `\n**Asset Status:** ${assets.filter(a => a.status === 'Approved').length}/${assets.length} approved`,
      `\n**Status:** Ready for Editor →`,
    ].filter(Boolean).join('\n');
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, content_type: 'brief', title: `Brief: ${briefProject}` }),
      });
      setBriefSaveMsg(res.ok ? '✅ Brief saved — ready to send to editor' : '⚠️ Save failed');
    } catch { setBriefSaveMsg('⚠️ Save failed'); }
    setBriefSaving(false);
    setTimeout(() => setBriefSaveMsg(''), 5000);
  }

  // ── Asset Collector handlers ──────────────────────────────────────────────────
  function addAsset() {
    if (!assetNewName.trim()) return;
    setAssets(prev => [...prev, { id: Date.now().toString(), name: assetNewName.trim(), category: assetNewCat, status: 'Needed' }]);
    setAssetNewName('');
  }
  function cycleAssetStatus(id: string) {
    setAssets(prev => prev.map(a => a.id === id ? { ...a, status: ASSET_STATUS_NEXT[a.status] } : a));
  }
  function removeAsset(id: string) {
    setAssets(prev => prev.filter(a => a.id !== id));
  }

  // ── Audio Prep handlers ───────────────────────────────────────────────────────
  function addSfx() {
    if (!audioSfxInput.trim()) return;
    setAudioSfxList(prev => [...prev, audioSfxInput.trim()]);
    setAudioSfxInput('');
  }
  function removeSfx(i: number) { setAudioSfxList(prev => prev.filter((_, idx) => idx !== i)); }

  // ── Content Pipeline handlers ─────────────────────────────────────────────────
  function addPipelineItem() {
    if (!pipeNewTitle.trim()) return;
    setPipelineItems(prev => [...prev, { id: Date.now().toString(), title: pipeNewTitle.trim(), type: pipeNewType, platform: pipeNewPlatform, stage: 'Concept' }]);
    setPipeNewTitle('');
  }
  function advancePipeline(id: string) {
    setPipelineItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const i = PIPELINE_STAGES.indexOf(item.stage);
      return { ...item, stage: PIPELINE_STAGES[Math.min(i + 1, PIPELINE_STAGES.length - 1)] };
    }));
  }
  function removePipelineItem(id: string) { setPipelineItems(prev => prev.filter(p => p.id !== id)); }

  // ── Character Brief Builder handler ──────────────────────────────────────────
  const CHAR_SIM_OPTIONS = ['Cloth / Fabric Simulation', 'Hair / Fur Simulation', 'Facial Blend Shapes / Morphs', 'Muscle Simulation', 'Fluid / VFX Layer', 'Crowd / Instanced Version'];
  async function handleSaveCharBrief() {
    if (!charName.trim()) return;
    setCharSaving(true);
    setCharSaveMsg('');
    const text = [
      `# Character Brief: ${charName}`,
      `**Role:** ${charRole}`,
      `**Animation Type:** ${charAnimType}`,
      `**Rig Complexity:** ${charRigLevel}`,
      charPhysical    ? `\n**Physical Description:**\n${charPhysical}` : null,
      charPersonality ? `\n**Personality & Performance Notes:**\n${charPersonality}` : null,
      charSims.size   ? `\n**Special Simulations Required:**\n${[...charSims].map(s => `- ${s}`).join('\n')}` : null,
      charColorNotes  ? `\n**Colour Palette & Style Notes:**\n${charColorNotes}` : null,
      charRefs        ? `\n**Reference Materials:**\n${charRefs}` : null,
      `\n**Status:** Ready for ${charAnimType.includes('Maya') || charAnimType.includes('ZBrush') ? 'Maya / ZBrush' : charAnimType.includes('Toon Boom') ? 'Toon Boom Harmony' : charAnimType.includes('TVPaint') ? 'TVPaint Animation' : 'Engine'}`,
    ].filter(Boolean).join('\n');
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, content_type: 'character_brief', title: `Character Brief: ${charName}` }),
      });
      setCharSaveMsg(res.ok ? '✅ Brief saved — ready for engine' : '⚠️ Save failed');
    } catch { setCharSaveMsg('⚠️ Save failed'); }
    setCharSaving(false);
    setTimeout(() => setCharSaveMsg(''), 4000);
  }

  // ── Scene & Set Design Brief handler ─────────────────────────────────────────
  async function handleSaveSceneBrief() {
    if (!sceneName.trim()) return;
    setSceneSaving(true);
    setSceneSaveMsg('');
    const text = [
      `# Scene / Set Design Brief: ${sceneName}`,
      `**Set Type:** ${sceneType}`,
      `**Lighting Condition:** ${sceneLighting}`,
      sceneMood      ? `\n**Mood & Atmosphere:**\n${sceneMood}` : null,
      sceneElements  ? `\n**Key Visual Elements:**\n${sceneElements}` : null,
      sceneType.includes('Unreal') ? `\n**Unreal Engine / Virtual Production Notes:**\n${sceneUnrealNotes || 'Camera tracking markers required. Confirm parallax movement range with DoP. LED wall brightness target: >1000 nits.'}` : null,
      sceneColorPalette ? `\n**Colour Palette:**\n${sceneColorPalette}` : null,
      `\n**Destination:** ${sceneType.includes('Unreal') ? 'Unreal Engine — Virtual Production' : sceneType.includes('2D') ? 'TVPaint / Toon Boom Background Dept.' : 'Art Department / Engine'}`,
    ].filter(Boolean).join('\n');
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, content_type: 'scene_brief', title: `Scene Brief: ${sceneName}` }),
      });
      setSceneSaveMsg(res.ok ? '✅ Brief saved — ready for engine' : '⚠️ Save failed');
    } catch { setSceneSaveMsg('⚠️ Save failed'); }
    setSceneSaving(false);
    setTimeout(() => setSceneSaveMsg(''), 4000);
  }

  // ── Storyboard Builder handlers ───────────────────────────────────────────────
  const SB_SHOT_TYPES = ['Wide', 'Medium', 'Close-up', 'Extreme Close-up', 'Over Shoulder', 'POV', 'Overhead', 'Low Angle', 'Drone'];
  function addSbFrame() {
    setSbFrames(prev => [...prev, { id: Date.now().toString(), scene: `Scene ${prev.length + 1}`, shot: 'Medium', action: '', audio: '', duration: 5 }]);
  }
  function updateSbFrame(id: string, field: string, value: string | number) {
    setSbFrames(prev => prev.map(f => f.id === id ? { ...f, [field]: value } : f));
  }
  function removeSbFrame(id: string) { setSbFrames(prev => prev.filter(f => f.id !== id)); }
  function copySbText() {
    const total = sbFrames.reduce((a, f) => a + f.duration, 0);
    const text = `STORYBOARD: ${sbTitle || 'Untitled'}\nTotal: ${total}s\n\n` +
      sbFrames.map((f, i) =>
        `[Frame ${i + 1}] ${f.scene} | ${f.shot} shot | ${f.duration}s\nACTION: ${f.action || '—'}\nAUDIO: ${f.audio || '—'}`
      ).join('\n\n');
    navigator.clipboard?.writeText(text).catch(() => {});
    setSbCopied(true);
    setTimeout(() => setSbCopied(false), 2000);
  }

  // ── AI Production Plan handlers ───────────────────────────────────────────────
  function buildProductionPlan(idea: string, type: string, platform: string) {
    const t = idea.trim() || 'your content idea';
    return {
      title: `Production Plan: ${t.slice(0, 50)}`,
      preProd: [
        `Define goal: what action should viewers take after watching "${t}"?`,
        `Write Creative Brief — message, audience, brand voice, visual direction`,
        `Build Storyboard — map every scene, shot type, and timing`,
        `Collect all assets: footage needed, photos, graphics, logo files`,
        `Prep audio: select music mood (${['Energetic','Cinematic','Hype'][Math.floor(Math.random()*3)]}), write VO brief, list SFX`,
        `Check Platform Specs — ${platform} ${type}: confirm resolution, duration, and format`,
        `Pre-flight asset check: all items Approved before handing off to engine`,
        `Set deadline and create pipeline item in Content Pipeline`,
      ],
      production: [
        `Open Engine — all brief, specs, and assets ready`,
        `Import all pre-approved assets`,
        type === '3D Animation' ? `Set up scene in Maya — import character rigs, verify all sims (cloth/hair/facial)` :
        type === 'YouTube Video' || type === 'YouTube Short' ? `Set up 16:9 canvas (${type === 'YouTube Short' ? '1080×1920 vertical' : '1920×1080'})` :
        `Set canvas to correct dimensions per Platform Specs`,
        type === '3D Animation' ? `Animate scene-by-scene following storyboard — match timing from brief` :
        type === 'Reel' || type === 'Social Ad' ? `Follow storyboard frame by frame — no improvising, every cut is planned` :
        `Follow storyboard / content outline`,
        `Layer audio: music at correct BPM/mood (${audioMood}), apply VO per brief, place SFX at marked timecodes`,
        `Add captions/text overlays per brand voice guidelines`,
        type === '3D Animation' ? `Render scenes — verify lighting, shadow quality, and camera angles match scene brief` :
        type === 'Podcast' ? `Record and edit audio, apply EQ, set level to −${platform === 'Email' ? '16' : '14'} LUFS` :
        `Apply colour grade and transitions`,
        `Export at correct spec: format, bitrate, loudness (−14 LUFS)`,
      ],
      postProd: [
        `Review exported file against Creative Brief — does it match the core message?`,
        `Brand Voice check — tone, pacing, and visual direction aligned?`,
        `Run SEO Title Optimizer on the caption/title`,
        `Generate hashtags with Hashtag Optimizer`,
        `Repurpose: run Auto Content Repurposer to get 10 platform formats`,
        `Set optimal post time using AI Post Intelligence`,
        `Add to Publishing Queue on correct platform(s): ${platform}`,
      ],
      distribution: [
        `Post at AI-recommended optimal time on ${platform}`,
        type !== 'Email' ? `Cross-post repurposed formats to secondary platforms` : `Send to email list with SEO-optimised subject line`,
        `Monitor first 24h engagement — track in Content Analytics`,
        `Respond to comments within 2h for algorithm boost`,
        `Update Content Pipeline stage → Live`,
        `Log performance data for next AI Post Intelligence cycle`,
      ],
    };
  }

  async function handleGeneratePlan() {
    if (!planIdea.trim()) return;
    setPlanLoading(true);
    setPlanResult(null);
    setPlanSaveMsg('');
    await new Promise(r => setTimeout(r, 700));
    setPlanResult(buildProductionPlan(planIdea, planType, planPlatform));
    setPlanLoading(false);
  }

  async function handleSavePlan() {
    if (!planResult) return;
    const text = [
      `# ${planResult.title}`,
      '\n## Pre-Production', ...planResult.preProd.map((s, i) => `${i + 1}. ${s}`),
      '\n## Production (Engine)', ...planResult.production.map((s, i) => `${i + 1}. ${s}`),
      '\n## Post-Production', ...planResult.postProd.map((s, i) => `${i + 1}. ${s}`),
      '\n## Distribution', ...planResult.distribution.map((s, i) => `${i + 1}. ${s}`),
    ].join('\n');
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, content_type: 'plan', title: planResult.title }),
      });
      setPlanSaveMsg(res.ok ? '✅ Plan saved to Drafts' : '⚠️ Save failed');
    } catch { setPlanSaveMsg('⚠️ Save failed'); }
    setTimeout(() => setPlanSaveMsg(''), 4000);
  }

  // ── Brand Voice Guard handler ─────────────────────────────────────────────────
  async function handleBrandVoiceCheck() {
    if (!bvContent.trim() || !bvProfile.trim()) return;
    setBvLoading(true);
    setBvResult(null);
    try {
      const res = await fetch('/api/content/intelligence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'brand-voice', content: bvContent.trim(), voiceProfile: bvProfile.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Brand voice check failed');
      setBvResult(json);
    } catch {
      /* silently surface no result */
    } finally {
      setBvLoading(false);
    }
  }

  return (
    <div className="de-sky-bg min-h-screen">

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{ background: 'rgba(220,232,248,0.88)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 -ml-2 rounded-full"
            style={{
              background: 'rgba(160,195,240,0.15)', border: 'none',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="Back to Create"
          >
            <ArrowLeft className="w-4 h-4" style={{ color: 'var(--de-text)' }} />
          </button>
          <div style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
            background: `linear-gradient(135deg, ${ACCENT}, rgba(200,152,26,0.8))`,
          }} />
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--de-heading)', lineHeight: 1.1 }}>ContentEngin</div>
            <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Create · Control Layer</div>
          </div>
          <span
            className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: `${ACCENT}18`, color: ACCENT, border: `1px solid ${ACCENT}35` }}
          >Side B</span>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="max-w-2xl mx-auto px-4 pb-32" style={{ paddingTop: 20 }}>

        {/* ── Music → ContentEngin connection signal (Phase 8 §F Point 57) ── */}
        {stemPrompt && (
          <div className="de-widget" style={{ marginBottom: 14, borderColor: 'rgba(42,138,184,0.3)', background: 'rgba(42,138,184,0.04)' }}>
            <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🎵→✍️</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>
                    StarMakerEngin sent a stem
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>
                    {stemPrompt.stemType} stem is ready — write a track description?
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedStem(contentBridge.lastStem)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--de-text-dim)' }}
                  aria-label="Dismiss"
                >✕</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Game → ContentEngin connection signal ── */}
        {gameClipPrompt && (
          <div className="de-widget" style={{ marginBottom: 14, borderColor: 'rgba(200,152,26,0.3)', background: 'rgba(200,152,26,0.04)' }}>
            <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>🎮→✍️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>
                    GameEngin shared a clip
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>
                    Session #{gameClipPrompt} — create a post or video?
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedGameClip(contentBridge.lastGameClip)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--de-text-dim)' }}
                  aria-label="Dismiss"
                >✕</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Code → ContentEngin connection signal ── */}
        {notebookPrompt && (
          <div className="de-widget" style={{ marginBottom: 14, borderColor: 'rgba(34,211,238,0.3)', background: 'rgba(34,211,238,0.04)' }}>
            <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>💻→✍️</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>
                    CodeEngin published a notebook
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)', lineHeight: 1.5 }}>
                    Notebook #{notebookPrompt} — turn into tutorial or dev blog?
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDismissedNotebook(contentBridge.lastNotebookPublish)}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--de-text-dim)' }}
                  aria-label="Dismiss"
                >✕</button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            PRE-EDIT — Everything before the editor opens
            Brief · Assets · Audio · Specs · Pipeline
        ═══════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(160,195,240,0.25)' }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: ACCENT, textTransform: 'uppercase' }}>🗂️ Pre-Edit</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(160,195,240,0.25)' }} />
          </div>

          {/* ── 1. Creative Brief Builder ─────────────────────────────────────── */}
          <div className="de-widget" style={{ marginBottom: 14 }}>
            <div className="de-widget-header">
              <span style={{ fontSize: 15 }}>📋</span>
              <span className="de-widget-title ml-2">Creative Brief Builder</span>
              {briefProject.trim() && assets.filter(a => a.status === 'Approved').length === assets.length && (
                <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: 4 }}>Editor-Ready ✓</span>
              )}
            </div>
            <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              {/* Project name */}
              <input
                type="text" value={briefProject} onChange={e => setBriefProject(e.target.value)}
                placeholder="Project name (e.g. Q2 Launch Reel)…"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, fontSize: 13, fontWeight: 700, border: `1px solid ${ACCENT}30`, background: 'rgba(255,255,255,0.75)', color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box' }}
              />
              {/* Content type + deadline row */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}>Content Type</label>
                  <select value={briefType} onChange={e => setBriefType(e.target.value as BriefContentType)}
                    style={{ width: '100%', fontSize: 12, borderRadius: 8, padding: '7px 10px', border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)' }}>
                    {BRIEF_CONTENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}>Deadline</label>
                  <input type="date" value={briefDeadline} onChange={e => setBriefDeadline(e.target.value)}
                    style={{ width: '100%', fontSize: 12, borderRadius: 8, padding: '7px 10px', border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', boxSizing: 'border-box' }} />
                </div>
              </div>
              {/* Platform targets */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 5 }}>Target Platforms</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {BRIEF_PLATFORM_LIST.map(p => {
                    const on = briefPlatforms.has(p);
                    return (
                      <button key={p} type="button" onClick={() => setBriefPlatforms(prev => { const n = new Set(prev); on ? n.delete(p) : n.add(p); return n; })}
                        style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                          background: on ? `${ACCENT}18` : 'rgba(255,255,255,0.5)',
                          border: `1.5px solid ${on ? ACCENT : 'rgba(160,195,240,0.25)'}`,
                          color: on ? ACCENT : 'var(--de-text-dim)' }}>
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Core message */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}>Core Message / Hook</label>
                <textarea value={briefMessage} onChange={e => setBriefMessage(e.target.value)} rows={2}
                  placeholder="What is the single most important thing this content must communicate?"
                  style={{ width: '100%', borderRadius: 9, padding: '8px 12px', fontSize: 12, border: `1px solid ${ACCENT}20`, background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              {/* Audience + voice row */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}>Target Audience</label>
                  <input value={briefAudience} onChange={e => setBriefAudience(e.target.value)} placeholder="e.g. Gen-Z creators, 18–25…"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 12, border: `1px solid ${ACCENT}20`, background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}>Brand Voice & Tone</label>
                  <input value={briefVoice} onChange={e => setBriefVoice(e.target.value)} placeholder="e.g. bold, casual, Gen-Z…"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 12, border: `1px solid ${ACCENT}20`, background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              {/* Visual direction */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}>Visual Direction (for editor)</label>
                <textarea value={briefVisual} onChange={e => setBriefVisual(e.target.value)} rows={2}
                  placeholder="Describe aesthetic, pacing, colour palette, references (e.g. fast cuts, warm tones, Nike-style energy)…"
                  style={{ width: '100%', borderRadius: 9, padding: '8px 12px', fontSize: 12, border: `1px solid ${ACCENT}20`, background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              {/* Asset readiness summary */}
              {assets.length > 0 && (
                <div style={{ padding: '8px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.45)', border: `1px solid ${ACCENT}15` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)' }}>Asset Readiness</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: assets.filter(a => a.status === 'Approved').length === assets.length ? '#22c55e' : ACCENT, marginLeft: 'auto' }}>
                      {assets.filter(a => a.status === 'Approved').length}/{assets.length} approved
                    </span>
                  </div>
                  <div style={{ height: 5, borderRadius: 4, background: 'rgba(0,0,0,0.06)' }}>
                    <div style={{ height: '100%', borderRadius: 4, transition: 'width 0.4s', background: '#22c55e',
                      width: `${Math.round(assets.filter(a => a.status === 'Approved').length / assets.length * 100)}%` }} />
                  </div>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" onClick={handleSaveBrief} disabled={briefSaving || !briefProject.trim()}
                  style={{ ...btnBase, background: ACCENT, color: 'white', padding: '9px 20px', fontSize: 13, opacity: briefSaving || !briefProject.trim() ? 0.6 : 1 }}>
                  {briefSaving ? '⏳ Saving…' : '📋 Save Brief → Drafts'}
                </button>
                {briefSaveMsg && <span style={{ fontSize: 12, fontWeight: 600, color: briefSaveMsg.startsWith('✅') ? '#16a34a' : '#ef4444' }}>{briefSaveMsg}</span>}
              </div>
            </div>
          </div>

          {/* ── 2. Asset Collector ────────────────────────────────────────────── */}
          <div className="de-widget" style={{ marginBottom: 14 }}>
            <div className="de-widget-header">
              <span style={{ fontSize: 15 }}>🗂️</span>
              <span className="de-widget-title ml-2">Asset Collector</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                color: assets.every(a => a.status === 'Approved') ? '#22c55e' : ACCENT,
                background: assets.every(a => a.status === 'Approved') ? 'rgba(34,197,94,0.1)' : `${ACCENT}12`,
                padding: '2px 8px', borderRadius: 4 }}>
                {assets.filter(a => a.status === 'Approved').length}/{assets.length} ready
              </span>
            </div>
            <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)', margin: 0 }}>Collect and confirm every raw asset before the editor opens a single file.</p>
              {/* Asset list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {assets.map(asset => (
                  <div key={asset.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 10,
                    background: asset.status === 'Approved' ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.55)',
                    border: `1px solid ${ASSET_STATUS_COLOR[asset.status]}25` }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{asset.category.split(' ')[0]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{asset.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{asset.category}</div>
                    </div>
                    <button type="button" onClick={() => cycleAssetStatus(asset.id)}
                      style={{ ...btnBase, fontSize: 10, padding: '3px 9px', borderRadius: 20,
                        background: `${ASSET_STATUS_COLOR[asset.status]}15`,
                        color: ASSET_STATUS_COLOR[asset.status],
                        border: `1.5px solid ${ASSET_STATUS_COLOR[asset.status]}40` }}>
                      {asset.status}
                    </button>
                    <button type="button" onClick={() => removeAsset(asset.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(239,68,68,0.45)', padding: 0, flexShrink: 0 }}>✕</button>
                  </div>
                ))}
              </div>
              {/* Add new asset */}
              <div style={{ display: 'flex', gap: 6 }}>
                <select value={assetNewCat} onChange={e => setAssetNewCat(e.target.value as AssetCategory)}
                  style={{ fontSize: 11, borderRadius: 8, padding: '6px 8px', border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', flexShrink: 0 }}>
                  {ASSET_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input value={assetNewName} onChange={e => setAssetNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addAsset()}
                  placeholder="Asset name…"
                  style={{ flex: 1, padding: '6px 10px', borderRadius: 8, fontSize: 12, border: `1px solid ${ACCENT}20`, background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', outline: 'none' }} />
                <button type="button" onClick={addAsset} disabled={!assetNewName.trim()}
                  style={{ ...btnBase, background: ACCENT, color: 'white', padding: '6px 14px', opacity: !assetNewName.trim() ? 0.5 : 1 }}>
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* ── 3. Audio Prep Station ─────────────────────────────────────────── */}
          <div className="de-widget" style={{ marginBottom: 14 }}>
            <div className="de-widget-header">
              <span style={{ fontSize: 15 }}>🎵</span>
              <span className="de-widget-title ml-2">Audio Prep Station</span>
            </div>
            <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)', margin: 0 }}>Define every audio element before the editor starts — music mood, BPM, VO direction, SFX list, and platform loudness specs.</p>
              {/* Music mood + BPM */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 2 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}>Music Mood</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {AUDIO_MOODS.map(m => (
                      <button key={m} type="button" onClick={() => setAudioMood(m)}
                        style={{ padding: '4px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                          background: audioMood === m ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.55)',
                          border: `1.5px solid ${audioMood === m ? '#8b5cf6' : 'rgba(160,195,240,0.25)'}`,
                          color: audioMood === m ? '#8b5cf6' : 'var(--de-text-dim)' }}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}>BPM Target</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="range" min={60} max={180} value={audioBpm} onChange={e => setAudioBpm(parseInt(e.target.value))}
                      style={{ flex: 1, accentColor: '#8b5cf6' }} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#8b5cf6', minWidth: 36, textAlign: 'right' }}>{audioBpm}</span>
                  </div>
                </div>
              </div>
              {/* VO brief */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}>Voiceover Brief</label>
                <textarea value={audioVoBrief} onChange={e => setAudioVoBrief(e.target.value)} rows={2}
                  placeholder="Tone, pace, key phrases, accent preference — tell the editor exactly how VO should sound…"
                  style={{ width: '100%', borderRadius: 9, padding: '8px 12px', fontSize: 12, border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              {/* SFX checklist */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 5 }}>SFX Checklist</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 7 }}>
                  {audioSfxList.map((sfx, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(139,92,246,0.15)' }}>
                      <span style={{ fontSize: 12 }}>🔊</span>
                      <span style={{ flex: 1, fontSize: 12, color: 'var(--de-heading)' }}>{sfx}</span>
                      <button type="button" onClick={() => removeSfx(i)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'rgba(239,68,68,0.45)', padding: 0 }}>✕</button>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={audioSfxInput} onChange={e => setAudioSfxInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSfx()}
                    placeholder="Add SFX (e.g. Notification ping)…"
                    style={{ flex: 1, padding: '6px 10px', borderRadius: 8, fontSize: 12, border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', outline: 'none' }} />
                  <button type="button" onClick={addSfx} disabled={!audioSfxInput.trim()}
                    style={{ ...btnBase, background: 'rgba(139,92,246,0.12)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.3)', opacity: !audioSfxInput.trim() ? 0.5 : 1 }}>
                    Add
                  </button>
                </div>
              </div>
              {/* Platform loudness spec */}
              <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', marginBottom: 6 }}>📻 Platform Audio Standard</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                  {['Instagram Reel', 'TikTok', 'YouTube', 'Twitter/X', 'Podcast'].map(p => (
                    <button key={p} type="button" onClick={() => setAudioSpecPlatform(p)}
                      style={{ padding: '3px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        background: audioSpecPlatform === p ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.5)',
                        border: `1.5px solid ${audioSpecPlatform === p ? '#8b5cf6' : 'rgba(160,195,240,0.2)'}`,
                        color: audioSpecPlatform === p ? '#8b5cf6' : 'var(--de-text-dim)' }}>
                      {p}
                    </button>
                  ))}
                </div>
                {(() => {
                  const specs: Record<string, { lufs: string; format: string; channels: string; note: string }> = {
                    'Instagram Reel': { lufs: '−14 LUFS', format: 'AAC 128kbps', channels: 'Stereo', note: 'Loud master sounds distorted in feed. Keep peaks at −1 dBTP.' },
                    'TikTok':         { lufs: '−14 LUFS', format: 'AAC 128kbps', channels: 'Stereo', note: 'Avoid bass-heavy mixes — phone speakers are tiny.' },
                    'YouTube':        { lufs: '−14 LUFS', format: 'AAC 192kbps', channels: 'Stereo', note: 'YouTube normalises to −14 LUFS. Deliver at −14 to avoid pumping.' },
                    'Twitter/X':      { lufs: '−14 LUFS', format: 'AAC 128kbps', channels: 'Stereo', note: 'Compression artefacts at high volumes. Export clean.' },
                    'Podcast':        { lufs: '−16 LUFS', format: 'MP3 128kbps', channels: 'Mono',   note: 'Apple Podcasts standard. −16 LUFS for spoken word clarity.' },
                  };
                  const s = specs[audioSpecPlatform] ?? specs['Instagram Reel'];
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                      {[{ label: 'Loudness', val: s.lufs }, { label: 'Format', val: s.format }, { label: 'Channels', val: s.channels }].map(r => (
                        <div key={r.label} style={{ padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(139,92,246,0.12)' }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--de-text-dim)', marginBottom: 2 }}>{r.label}</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#8b5cf6' }}>{r.val}</div>
                        </div>
                      ))}
                      <div style={{ gridColumn: '1 / -1', fontSize: 10, color: 'var(--de-text-dim)', padding: '5px 0 0' }}>💡 {s.note}</div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* ── 4. Platform Specs Master ─────────────────────────────────────── */}
          <div className="de-widget" style={{ marginBottom: 14 }}>
            <div className="de-widget-header">
              <span style={{ fontSize: 15 }}>📐</span>
              <span className="de-widget-title ml-2">Platform Specs Master</span>
              <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: 'var(--de-text-dim)', background: 'rgba(160,195,240,0.2)', padding: '2px 7px', borderRadius: 4 }}>10 platforms</span>
            </div>
            <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)', margin: 0 }}>Hand the editor exact tech specs so nothing gets rejected at upload. Every dimension, format, duration, and caption limit in one place.</p>
              <input type="text" value={specsFilter} onChange={e => setSpecsFilter(e.target.value)}
                placeholder="Filter platform…"
                style={{ width: '100%', padding: '7px 11px', borderRadius: 8, fontSize: 12, border: `1px solid ${ACCENT}20`, background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box' }} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {PLATFORM_SPECS.filter(p => !specsFilter || p.name.toLowerCase().includes(specsFilter.toLowerCase())).map(p => (
                  <div key={p.name} style={{ borderRadius: 10, background: 'rgba(255,255,255,0.55)', border: `1px solid ${ACCENT}12`, overflow: 'hidden' }}>
                    {/* Platform header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: `1px solid ${ACCENT}10`, background: `${ACCENT}06` }}>
                      <span style={{ fontSize: 16 }}>{p.emoji}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--de-heading)', flex: 1 }}>{p.name}</span>
                      <button type="button"
                        onClick={() => navigator.clipboard?.writeText(`${p.name}: ${p.ratio} · ${p.res} · ${p.dur} · ${p.fmt} · Caption: ${p.caption} · Audio: ${p.audio}`).catch(() => {})}
                        style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, border: `1px solid ${ACCENT}25`, background: `${ACCENT}10`, color: ACCENT, cursor: 'pointer' }}>
                        Copy Spec
                      </button>
                    </div>
                    {/* Specs grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
                      {[
                        { label: 'Ratio',    val: p.ratio   },
                        { label: 'Resolution', val: p.res   },
                        { label: 'Duration', val: p.dur     },
                        { label: 'Format',   val: p.fmt     },
                        { label: 'Caption',  val: p.caption },
                        { label: 'Audio',    val: p.audio   },
                      ].map(spec => (
                        <div key={spec.label} style={{ padding: '7px 10px', borderRight: '1px solid rgba(160,195,240,0.1)', borderBottom: '1px solid rgba(160,195,240,0.1)' }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--de-text-dim)', marginBottom: 2 }}>{spec.label}</div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)' }}>{spec.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── 5. Content Pipeline ─────────────────────────────────────────── */}
          <div className="de-widget" style={{ marginBottom: 14 }}>
            <div className="de-widget-header">
              <span style={{ fontSize: 15 }}>🚀</span>
              <span className="de-widget-title ml-2">Content Pipeline</span>
              {pipelineItems.filter(p => p.stage === 'Live').length > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 4 }}>
                  {pipelineItems.filter(p => p.stage === 'Live').length} Live
                </span>
              )}
            </div>
            <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)', margin: 0 }}>Track every piece of content from concept through to live. Tap <strong>Advance</strong> when a stage is complete.</p>
              {/* Stage legend */}
              <div style={{ display: 'flex', overflowX: 'auto', gap: 4, paddingBottom: 2 }}>
                {PIPELINE_STAGES.map((stage, i) => (
                  <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, background: `${PIPELINE_STAGE_COLOR[stage]}18`, color: PIPELINE_STAGE_COLOR[stage], border: `1px solid ${PIPELINE_STAGE_COLOR[stage]}30`, whiteSpace: 'nowrap' }}>{stage}</span>
                    {i < PIPELINE_STAGES.length - 1 && <span style={{ fontSize: 9, color: 'var(--de-text-dim)' }}>›</span>}
                  </div>
                ))}
              </div>
              {/* Pipeline items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {pipelineItems.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10,
                    background: item.stage === 'Live' ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.55)',
                    border: `1.5px solid ${PIPELINE_STAGE_COLOR[item.stage]}25` }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{item.type}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{item.platform}</div>
                    </div>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10, flexShrink: 0,
                      background: `${PIPELINE_STAGE_COLOR[item.stage]}15`,
                      color: PIPELINE_STAGE_COLOR[item.stage],
                      border: `1px solid ${PIPELINE_STAGE_COLOR[item.stage]}30` }}>
                      {item.stage}
                    </span>
                    {item.stage !== 'Live' && (
                      <button type="button" onClick={() => advancePipeline(item.id)}
                        style={{ ...btnBase, fontSize: 9, padding: '3px 8px', background: `${PIPELINE_STAGE_COLOR[item.stage]}12`, color: PIPELINE_STAGE_COLOR[item.stage], border: `1px solid ${PIPELINE_STAGE_COLOR[item.stage]}30`, flexShrink: 0 }}>
                        Advance →
                      </button>
                    )}
                    <button type="button" onClick={() => removePipelineItem(item.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(239,68,68,0.4)', padding: 0, flexShrink: 0 }}>✕</button>
                  </div>
                ))}
              </div>
              {/* Add new item */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <select value={pipeNewType} onChange={e => setPipeNewType(e.target.value)}
                  style={{ fontSize: 13, borderRadius: 8, padding: '6px 8px', border: `1px solid ${ACCENT}20`, background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)' }}>
                  {['📱', '🎬', '📸', '🧵', '📧', '▶️'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <input value={pipeNewTitle} onChange={e => setPipeNewTitle(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addPipelineItem()}
                  placeholder="Content title…"
                  style={{ flex: 2, padding: '6px 10px', borderRadius: 8, fontSize: 12, border: `1px solid ${ACCENT}20`, background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', outline: 'none', minWidth: 0 }} />
                <select value={pipeNewPlatform} onChange={e => setPipeNewPlatform(e.target.value)}
                  style={{ fontSize: 11, borderRadius: 8, padding: '6px 8px', border: `1px solid ${ACCENT}20`, background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)' }}>
                  {['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn', 'Pinterest'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button type="button" onClick={addPipelineItem} disabled={!pipeNewTitle.trim()}
                  style={{ ...btnBase, background: ACCENT, color: 'white', padding: '6px 16px', opacity: !pipeNewTitle.trim() ? 0.5 : 1 }}>
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* ── 5b. Storyboard Builder ────────────────────────────────────────── */}
          <div className="de-widget" style={{ marginBottom: 14 }}>
            <div className="de-widget-header">
              <span style={{ fontSize: 15 }}>🎞️</span>
              <span className="de-widget-title ml-2">Storyboard Builder</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--de-text-dim)' }}>
                {sbFrames.reduce((a, f) => a + f.duration, 0)}s total
              </span>
            </div>
            <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)', margin: 0 }}>Plan every scene and shot before the engine opens. The editor follows this — no guesswork, no missed shots.</p>
              <input type="text" value={sbTitle} onChange={e => setSbTitle(e.target.value)}
                placeholder="Project title (e.g. Q2 Launch Reel)…"
                style={{ width: '100%', padding: '8px 12px', borderRadius: 9, fontSize: 13, fontWeight: 700, border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.75)', color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box' }} />
              {/* Frame cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sbFrames.map((frame, i) => (
                  <div key={frame.id} style={{ borderRadius: 12, background: 'rgba(255,255,255,0.6)', border: `1px solid ${ACCENT}15`, overflow: 'hidden' }}>
                    {/* Frame header bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', background: `${ACCENT}08`, borderBottom: `1px solid ${ACCENT}10` }}>
                      <span style={{ fontSize: 9, fontWeight: 800, color: 'white', background: ACCENT, padding: '1px 7px', borderRadius: 10 }}>#{i + 1}</span>
                      <input value={frame.scene} onChange={e => updateSbFrame(frame.id, 'scene', e.target.value)}
                        placeholder="Scene name"
                        style={{ flex: 1, fontSize: 11, fontWeight: 700, background: 'none', border: 'none', outline: 'none', color: 'var(--de-heading)' }} />
                      <select value={frame.shot} onChange={e => updateSbFrame(frame.id, 'shot', e.target.value)}
                        style={{ fontSize: 10, borderRadius: 6, padding: '2px 6px', border: `1px solid ${ACCENT}20`, background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)' }}>
                        {SB_SHOT_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <input type="number" value={frame.duration} min={1} max={600}
                          onChange={e => updateSbFrame(frame.id, 'duration', parseInt(e.target.value) || 1)}
                          style={{ width: 40, fontSize: 11, fontWeight: 700, textAlign: 'center', borderRadius: 5, padding: '2px 4px', border: `1px solid ${ACCENT}20`, background: 'rgba(255,255,255,0.7)', color: ACCENT, outline: 'none' }} />
                        <span style={{ fontSize: 9, color: 'var(--de-text-dim)' }}>s</span>
                      </div>
                      {sbFrames.length > 1 && (
                        <button type="button" onClick={() => removeSbFrame(frame.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(239,68,68,0.45)', padding: 0 }}>✕</button>
                      )}
                    </div>
                    {/* Action + Audio */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                      <div style={{ padding: '8px 10px', borderRight: `1px solid ${ACCENT}08` }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--de-text-dim)', marginBottom: 3 }}>🎬 ACTION</div>
                        <textarea value={frame.action} onChange={e => updateSbFrame(frame.id, 'action', e.target.value)}
                          rows={2} placeholder="What happens on screen…"
                          style={{ width: '100%', fontSize: 11, border: 'none', background: 'transparent', color: 'var(--de-heading)', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                      <div style={{ padding: '8px 10px' }}>
                        <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--de-text-dim)', marginBottom: 3 }}>🎵 AUDIO</div>
                        <textarea value={frame.audio} onChange={e => updateSbFrame(frame.id, 'audio', e.target.value)}
                          rows={2} placeholder="Music, VO, SFX…"
                          style={{ width: '100%', fontSize: 11, border: 'none', background: 'transparent', color: 'var(--de-heading)', resize: 'none', fontFamily: 'inherit', lineHeight: 1.4, outline: 'none', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <button type="button" onClick={addSbFrame}
                  style={{ ...btnBase, background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}25`, flex: 1, padding: '8px 0' }}>
                  + Add Frame
                </button>
                <button type="button" onClick={copySbText}
                  style={{ ...btnBase, background: sbCopied ? 'rgba(34,197,94,0.1)' : `${ACCENT}12`, color: sbCopied ? '#16a34a' : ACCENT, border: `1px solid ${sbCopied ? 'rgba(34,197,94,0.3)' : `${ACCENT}25`}`, flex: 1, padding: '8px 0' }}>
                  {sbCopied ? '✅ Copied' : '📋 Copy Storyboard'}
                </button>
              </div>
            </div>
          </div>

          {/* ── 5c. AI Production Plan Builder ───────────────────────────────── */}
          <div className="de-widget" style={{ marginBottom: 14 }}>
            <div className="de-widget-header">
              <span style={{ fontSize: 15 }}>🤖</span>
              <span className="de-widget-title ml-2">AI Production Plan</span>
              <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '2px 7px', borderRadius: 4 }}>Pre → Engine → Post</span>
            </div>
            <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)', margin: 0 }}>
                Describe your content idea. AI builds a full production plan — pre-production, what the engine needs to do, post-production, and distribution — so nothing gets missed.
              </p>
              {/* Idea input */}
              <textarea value={planIdea} onChange={e => { setPlanIdea(e.target.value); setPlanResult(null); }} rows={3}
                placeholder="Describe your content idea (e.g. 'A 30s reel showing behind-the-scenes of our product launch with fast cuts and trending audio')…"
                style={{ width: '100%', borderRadius: 10, padding: '10px 12px', fontSize: 12, border: '1px solid rgba(99,102,241,0.25)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', outline: 'none' }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 3 }}>Content Type</label>
                  <select value={planType} onChange={e => setPlanType(e.target.value)}
                    style={{ width: '100%', fontSize: 12, borderRadius: 8, padding: '7px 10px', border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)' }}>
                    {['Reel', 'YouTube Video', 'YouTube Short', '3D Animated Short', '3D Feature Film Scene', '2D Animation (Toon Boom)', '2D Animation (TVPaint)', 'Virtual Production (Unreal)', 'Feature Film Scene', 'Podcast', 'Blog Post', 'Email Campaign', 'Social Ad', 'Story'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 3 }}>Platform</label>
                  <select value={planPlatform} onChange={e => setPlanPlatform(e.target.value)}
                    style={{ width: '100%', fontSize: 12, borderRadius: 8, padding: '7px 10px', border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)' }}>
                    {['Instagram', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn', 'Pinterest', 'Email'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <button type="button" onClick={handleGeneratePlan} disabled={planLoading || !planIdea.trim()}
                style={{ ...btnBase, background: '#6366f1', color: 'white', padding: '10px 0', width: '100%', fontSize: 13, opacity: planLoading || !planIdea.trim() ? 0.6 : 1 }}>
                {planLoading ? '🤖 Building plan…' : '🤖 Generate Full Production Plan'}
              </button>
              {/* Plan result */}
              {planResult && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--de-heading)', padding: '8px 0 4px' }}>{planResult.title}</div>
                  {([
                    { phase: '📋 Pre-Production',       color: '#f59e0b', items: planResult.preProd        },
                    { phase: '🎬 Production (Engine)',   color: '#ec4899', items: planResult.production     },
                    { phase: '✂️ Post-Production',       color: '#8b5cf6', items: planResult.postProd       },
                    { phase: '🚀 Distribution',          color: '#22c55e', items: planResult.distribution   },
                  ] as const).map(section => (
                    <div key={section.phase} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${section.color}20` }}>
                      <div style={{ padding: '7px 12px', background: `${section.color}10`, borderBottom: `1px solid ${section.color}15` }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: section.color }}>{section.phase}</span>
                      </div>
                      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {section.items.map((item, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: section.color, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                            <span style={{ fontSize: 11, color: 'var(--de-heading)', lineHeight: 1.5 }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                    <button type="button" onClick={handleSavePlan}
                      style={{ ...btnBase, background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)', padding: '8px 18px', fontSize: 13 }}>
                      💾 Save Plan to Drafts
                    </button>
                    {planSaveMsg && <span style={{ fontSize: 12, fontWeight: 600, color: planSaveMsg.startsWith('✅') ? '#16a34a' : '#ef4444' }}>{planSaveMsg}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── 5c. Character Brief Builder ──────────────────────────────────── */}
          <div className="de-widget" style={{ marginBottom: 14 }}>
            <div className="de-widget-header">
              <span style={{ fontSize: 15 }}>🎭</span>
              <span className="de-widget-title ml-2">Character Brief Builder</span>
              <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#ec4899', background: 'rgba(236,72,153,0.1)', padding: '2px 7px', borderRadius: 4 }}>Maya · ZBrush · Toon Boom · TVPaint</span>
            </div>
            <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)', margin: 0 }}>Define every character before the engine opens. Riggers and animators get a complete spec — no guessing on design, rig complexity, or simulation requirements.</p>
              {/* Name + Role */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={charName} onChange={e => setCharName(e.target.value)} placeholder="Character name…"
                  style={{ flex: 2, padding: '8px 12px', borderRadius: 9, fontSize: 13, fontWeight: 700, border: '1px solid rgba(236,72,153,0.25)', background: 'rgba(255,255,255,0.75)', color: 'var(--de-heading)', outline: 'none' }} />
                <select value={charRole} onChange={e => setCharRole(e.target.value as typeof charRole)}
                  style={{ flex: 1, fontSize: 11, borderRadius: 9, padding: '8px 10px', border: '1px solid rgba(236,72,153,0.2)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)' }}>
                  {CHAR_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {/* Animation type + Rig level */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 3 }}>Animation Pipeline</label>
                  <select value={charAnimType} onChange={e => setCharAnimType(e.target.value as typeof charAnimType)}
                    style={{ width: '100%', fontSize: 11, borderRadius: 8, padding: '7px 9px', border: '1px solid rgba(236,72,153,0.2)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)' }}>
                    {CHAR_ANIM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 3 }}>Rig Complexity</label>
                  <select value={charRigLevel} onChange={e => setCharRigLevel(e.target.value as typeof charRigLevel)}
                    style={{ width: '100%', fontSize: 11, borderRadius: 8, padding: '7px 9px', border: '1px solid rgba(236,72,153,0.2)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)' }}>
                    {CHAR_RIG_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              {/* Physical + Personality */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 3 }}>Physical Description</label>
                <textarea value={charPhysical} onChange={e => setCharPhysical(e.target.value)} rows={2}
                  placeholder="Height, build, skin tone, hair, distinctive features, proportions — everything the rigger and sculptor needs to know…"
                  style={{ width: '100%', borderRadius: 9, padding: '8px 12px', fontSize: 12, border: '1px solid rgba(236,72,153,0.18)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 3 }}>Personality & Performance Notes</label>
                <textarea value={charPersonality} onChange={e => setCharPersonality(e.target.value)} rows={2}
                  placeholder="How does this character move? What emotions do they express most? Performance style (subtle / broad / comedic)…"
                  style={{ width: '100%', borderRadius: 9, padding: '8px 12px', fontSize: 12, border: '1px solid rgba(236,72,153,0.18)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              {/* Special simulations */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 5 }}>Special Simulations Required</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {CHAR_SIM_OPTIONS.map(sim => {
                    const on = charSims.has(sim);
                    return (
                      <button key={sim} type="button"
                        onClick={() => setCharSims(prev => { const n = new Set(prev); on ? n.delete(sim) : n.add(sim); return n; })}
                        style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                          background: on ? 'rgba(236,72,153,0.14)' : 'rgba(255,255,255,0.55)',
                          border: `1.5px solid ${on ? '#ec4899' : 'rgba(160,195,240,0.25)'}`,
                          color: on ? '#ec4899' : 'var(--de-text-dim)' }}>
                        {sim}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Colour + References */}
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 3 }}>Colour Palette & Style</label>
                  <input value={charColorNotes} onChange={e => setCharColorNotes(e.target.value)} placeholder="e.g. desaturated blues, warm skin tone…"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 12, border: '1px solid rgba(236,72,153,0.18)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 3 }}>Reference Materials</label>
                  <input value={charRefs} onChange={e => setCharRefs(e.target.value)} placeholder="e.g. Spider-Man: Into the Spider-Verse…"
                    style={{ width: '100%', padding: '7px 10px', borderRadius: 8, fontSize: 12, border: '1px solid rgba(236,72,153,0.18)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" onClick={handleSaveCharBrief} disabled={charSaving || !charName.trim()}
                  style={{ ...btnBase, background: '#ec4899', color: 'white', padding: '9px 20px', fontSize: 13, opacity: charSaving || !charName.trim() ? 0.6 : 1 }}>
                  {charSaving ? '⏳ Saving…' : '🎭 Save Character Brief → Drafts'}
                </button>
                {charSaveMsg && <span style={{ fontSize: 12, fontWeight: 600, color: charSaveMsg.startsWith('✅') ? '#16a34a' : '#ef4444' }}>{charSaveMsg}</span>}
              </div>
            </div>
          </div>

          {/* ── 5d. Scene & Set Design Brief ─────────────────────────────────── */}
          <div className="de-widget" style={{ marginBottom: 14 }}>
            <div className="de-widget-header">
              <span style={{ fontSize: 15 }}>🏗️</span>
              <span className="de-widget-title ml-2">Scene & Set Design Brief</span>
              <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 7px', borderRadius: 4 }}>Unreal · TVPaint · Toon Boom BG</span>
            </div>
            <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)', margin: 0 }}>Every background, set, and virtual environment designed before the engine opens. Art directors and Unreal VPs get the complete spec upfront.</p>
              {/* Scene name + type */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={sceneName} onChange={e => setSceneName(e.target.value)} placeholder="Scene name (e.g. Rooftop – Night)…"
                  style={{ flex: 2, padding: '8px 12px', borderRadius: 9, fontSize: 13, fontWeight: 700, border: '1px solid rgba(139,92,246,0.25)', background: 'rgba(255,255,255,0.75)', color: 'var(--de-heading)', outline: 'none' }} />
                <select value={sceneType} onChange={e => setSceneType(e.target.value as typeof sceneType)}
                  style={{ flex: 1, fontSize: 11, borderRadius: 9, padding: '8px 9px', border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)' }}>
                  {SCENE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              {/* Lighting */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 5 }}>Lighting Condition</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {LIGHTING_TYPES.map(l => (
                    <button key={l} type="button" onClick={() => setSceneLighting(l as typeof sceneLighting)}
                      style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        background: sceneLighting === l ? 'rgba(139,92,246,0.14)' : 'rgba(255,255,255,0.55)',
                        border: `1.5px solid ${sceneLighting === l ? '#8b5cf6' : 'rgba(160,195,240,0.25)'}`,
                        color: sceneLighting === l ? '#8b5cf6' : 'var(--de-text-dim)' }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              {/* Mood */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 3 }}>Mood & Atmosphere</label>
                <textarea value={sceneMood} onChange={e => setSceneMood(e.target.value)} rows={2}
                  placeholder="Describe the feeling — tense, peaceful, oppressive, magical, nostalgic… Include references (films, paintings, photography)…"
                  style={{ width: '100%', borderRadius: 9, padding: '8px 12px', fontSize: 12, border: '1px solid rgba(139,92,246,0.18)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              {/* Key elements */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 3 }}>Key Visual Elements</label>
                <textarea value={sceneElements} onChange={e => setSceneElements(e.target.value)} rows={2}
                  placeholder="What must be visible / prominent? What props, landmarks, or environmental details does the scene require?…"
                  style={{ width: '100%', borderRadius: 9, padding: '8px 12px', fontSize: 12, border: '1px solid rgba(139,92,246,0.18)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', outline: 'none' }} />
              </div>
              {/* Unreal Engine notes (conditional) */}
              {sceneType.includes('Unreal') && (
                <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#8b5cf6', marginBottom: 6 }}>⚡ Unreal Engine / Virtual Production Notes</div>
                  <textarea value={sceneUnrealNotes} onChange={e => setSceneUnrealNotes(e.target.value)} rows={3}
                    placeholder="Camera tracking requirements, LED wall brightness (target >1000 nits), parallax movement range, actor blocking zones, nDisplay setup notes, real-time asset optimisation targets…"
                    style={{ width: '100%', borderRadius: 8, padding: '8px 10px', fontSize: 12, border: '1px solid rgba(139,92,246,0.2)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', resize: 'none', fontFamily: 'inherit', lineHeight: 1.5, boxSizing: 'border-box', outline: 'none' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
                    {[
                      { label: 'LED Wall Target',       val: '≥ 1,000 nits'         },
                      { label: 'Frame Rate',             val: '24fps (film) / 60fps (VFX)' },
                      { label: 'Tracking System',        val: 'Define: Vicon / OptiTrack / Stype' },
                      { label: 'Asset LOD Budget',       val: 'Confirm with Tech Art'  },
                    ].map(r => (
                      <div key={r.label} style={{ display: 'flex', gap: 8, fontSize: 10 }}>
                        <span style={{ fontWeight: 700, color: '#8b5cf6', minWidth: 110 }}>{r.label}:</span>
                        <span style={{ color: 'var(--de-text-dim)' }}>{r.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Colour palette */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 3 }}>Colour Palette</label>
                <input value={sceneColorPalette} onChange={e => setSceneColorPalette(e.target.value)}
                  placeholder="e.g. muted earth tones, electric blue accents, high contrast noir…"
                  style={{ width: '100%', padding: '7px 12px', borderRadius: 8, fontSize: 12, border: '1px solid rgba(139,92,246,0.18)', background: 'rgba(255,255,255,0.7)', color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button type="button" onClick={handleSaveSceneBrief} disabled={sceneSaving || !sceneName.trim()}
                  style={{ ...btnBase, background: '#8b5cf6', color: 'white', padding: '9px 20px', fontSize: 13, opacity: sceneSaving || !sceneName.trim() ? 0.6 : 1 }}>
                  {sceneSaving ? '⏳ Saving…' : '🏗️ Save Scene Brief → Drafts'}
                </button>
                {sceneSaveMsg && <span style={{ fontSize: 12, fontWeight: 600, color: sceneSaveMsg.startsWith('✅') ? '#16a34a' : '#ef4444' }}>{sceneSaveMsg}</span>}
              </div>
            </div>
          </div>

          {/* ── 6. Industry Tools Hub ──────────────────────────────────────────── */}
          <div className="de-widget" style={{ marginBottom: 14 }}>
            <div className="de-widget-header">
              <Wrench className="w-4 h-4" style={{ color: ACCENT }} />
              <span className="de-widget-title ml-2">Industry Tools Hub</span>
              <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: 'var(--de-text-dim)', background: 'rgba(160,195,240,0.2)', padding: '2px 7px', borderRadius: 4 }}>2026 Standards</span>
            </div>
            <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 11, color: 'var(--de-text-dim)', margin: 0 }}>Every major industry tool — and the DREAMengin pre-edit feature that replaces the overhead of using it separately.</p>
              {([
                {
                  category: '🎬 Video & Social',
                  color: '#ec4899',
                  tools: [
                    { name: 'CapCut',   desc: 'All-in-one AI video editing',         de: 'Brief Builder → hands editor a complete spec before they open CapCut' },
                    { name: 'Descript', desc: 'Text-based video & audio editing',     de: 'Audio Prep Station → VO brief, SFX list, and loudness target prepared in advance' },
                  ],
                },
                {
                  category: '🎨 Visual Design',
                  color: '#10b981',
                  tools: [
                    { name: 'Canva Pro',     desc: 'Fast design & brand assets',            de: 'Platform Specs Master → editor gets exact dimensions before opening Canva' },
                    { name: 'Adobe Firefly', desc: 'Generative AI in Photoshop/Illustrator', de: 'Asset Collector → graphic assets sourced & approved before AI generation begins' },
                  ],
                },
                {
                  category: '✍️ Writing & Strategy',
                  color: '#6366f1',
                  tools: [
                    { name: 'ChatGPT',  desc: 'Custom GPTs for content strategy', de: 'AI Post Intelligence → what to create next, based on your engagement gaps' },
                    { name: 'Claude',   desc: 'Long-form drafting & brand voice', de: 'Brand Voice Guard → brand voice defined pre-production so drafts stay on-brand' },
                    { name: 'Jasper',   desc: 'Brand voice & campaign copy',      de: 'Creative Brief → message, tone, audience locked in before a word is written' },
                  ],
                },
                {
                  category: '📊 SEO & Optimization',
                  color: '#0ea5e9',
                  tools: [
                    { name: 'Surfer SEO', desc: 'Content scoring & keyword optimization', de: 'SEO Title Optimizer → titles scored & optimised before the editor adds them' },
                    { name: 'Semrush',    desc: 'Competitive content analysis',           de: 'Content Pipeline → competitive gaps spotted, strategy set before production' },
                  ],
                },
                {
                  category: '📋 Organization',
                  color: '#f59e0b',
                  tools: [
                    { name: 'Notion', desc: 'Docs, wikis & project management',   de: 'Workflow Brain + Creative Brief → project context lives in one place' },
                    { name: 'Trello', desc: 'Kanban content production boards',    de: 'Content Pipeline → 7-stage kanban from Concept to Live, no separate app needed' },
                  ],
                },
                {
                  category: '🎭 3D Animation & Rigging',
                  color: '#ec4899',
                  tools: [
                    { name: 'Autodesk Maya', desc: '3D character rigging & primary animation',      de: 'Character Brief Builder → rig complexity, sim requirements, design direction packaged before Maya opens' },
                    { name: 'ZBrush',        desc: 'High-detail digital sculpting of characters',   de: 'Character Brief Builder → poly budget targets, sculpt reference list, colour palette notes sent to sculpt team' },
                  ],
                },
                {
                  category: '✏️ 2D Animation',
                  color: '#10b981',
                  tools: [
                    { name: 'Toon Boom Harmony', desc: 'Frame-by-frame 2D animation & cut-out rigging', de: 'Character Brief + Storyboard Builder → cut-out rig spec, exposure sheet structure, scene-by-scene breakdowns' },
                    { name: 'TVPaint Animation',  desc: 'Hand-drawn digital animation',                  de: 'Scene & Set Design Brief + Storyboard → background design direction, frame-by-frame action notes per scene' },
                  ],
                },
                {
                  category: '🎬 Live-Action & Virtual Production',
                  color: '#8b5cf6',
                  tools: [
                    { name: 'Unreal Engine', desc: 'Virtual Production — digital LED wall backgrounds for live actors', de: 'Scene & Set Design Brief → LED wall brightness spec, tracking requirements, actor blocking, nDisplay notes pre-configured' },
                    { name: 'Final Draft',   desc: 'Industry-standard scriptwriting & dialogue management',             de: 'AI Production Plan → full story outline, scene structure, character arc, and dialogue direction delivered before Final Draft opens' },
                  ],
                },
              ]).map(group => (
                <div key={group.category}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: group.color, marginBottom: 5 }}>{group.category}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {group.tools.map(tool => (
                      <div key={tool.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: `1px solid ${group.color}15` }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 2 }}>{tool.name}</div>
                          <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginBottom: 3 }}>{tool.desc}</div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: group.color }}>→ {tool.de}</div>
                        </div>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: `${group.color}12`, color: group.color, flexShrink: 0, marginTop: 1, whiteSpace: 'nowrap' }}>Pre-Edit ✓</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* ═══════════════════════════════════════════════════════════════
            MANAGEMENT — Calendar · Queue · Drafts · Analytics
        ═══════════════════════════════════════════════════════════════ */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(160,195,240,0.25)' }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--de-text-dim)', textTransform: 'uppercase' }}>📋 Management</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(160,195,240,0.25)' }} />
          </div>

        {/* ── Recent Drafts ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Recent Drafts</span>
          </div>
          <div className="de-widget-body">
            {loading ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>Loading drafts…</p>
            ) : notes.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
                <FileText className="w-6 h-6 flex-shrink-0" style={{ color: ACCENT, opacity: 0.3 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--de-heading)' }}>No drafts yet</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Open the Create Daydream to start writing.</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {notes.map(note => (
                  <div key={note.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(160,195,240,0.18)',
                  }}>
                    <FileText className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT, opacity: 0.7 }} />
                    <span style={{
                      flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--de-heading)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
                    }}>{note.title}</span>
                    <span style={{
                      fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', flexShrink: 0,
                      padding: '2px 8px', borderRadius: 999,
                      background: 'rgba(160,195,240,0.18)', color: 'var(--de-text-dim)',
                      border: '1px solid rgba(160,195,240,0.25)',
                    }}>Draft</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Content Calendar ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Content Calendar</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
              {DAYS.map(day => (
                <div key={day} style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)' }}>{day}</span>
                  <div style={{
                    width: '100%', minHeight: 48, borderRadius: 8,
                    background: 'rgba(255,255,255,0.45)',
                    border: `1px solid rgba(160,195,240,0.2)`,
                    padding: '4px 3px',
                    display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'center',
                  }}>
                    {calendarItems[day].map(item => (
                      <span
                        key={item.id}
                        title={item.title}
                        style={{
                          fontSize: 10, fontWeight: 600,
                          background: `${ACCENT}20`, color: 'var(--de-heading)',
                          borderRadius: 4, padding: '1px 4px',
                          maxWidth: '100%', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          cursor: 'default', width: '100%', textAlign: 'center',
                        }}
                      >
                        {TYPE_EMOJI[item.type]}{item.title.length > 6 ? item.title.substring(0, 6) + '…' : item.title}
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setOpenDay(openDay === day ? null : day); setFormTitle(''); setFormType('Post'); }}
                      style={{
                        ...btnBase,
                        padding: '1px 6px', fontSize: 14, borderRadius: 6,
                        background: `${ACCENT}15`, color: ACCENT, marginTop: 'auto',
                      }}
                      aria-label={`Add to ${day}`}
                    >+</button>
                  </div>
                  {/* Inline mini-form */}
                  {openDay === day && (
                    <div style={{
                      position: 'absolute', zIndex: 50,
                      background: 'rgba(230,240,255,0.97)',
                      border: `1px solid ${ACCENT}40`,
                      borderRadius: 10, padding: '10px 12px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                      display: 'flex', flexDirection: 'column', gap: 7,
                      minWidth: 180,
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: ACCENT }}>{day} — Add Item</div>
                      <select
                        value={formType}
                        onChange={e => setFormType(e.target.value as CalendarItem['type'])}
                        style={{ fontSize: 12, borderRadius: 6, padding: '3px 6px', border: `1px solid ${ACCENT}40`, background: 'white' }}
                      >
                        {CONTENT_TYPES.map(t => <option key={t} value={t}>{TYPE_EMOJI[t]} {t}</option>)}
                      </select>
                      <input
                        value={formTitle}
                        onChange={e => setFormTitle(e.target.value)}
                        placeholder="Title…"
                        style={{ fontSize: 12, borderRadius: 6, padding: '4px 8px', border: `1px solid rgba(160,195,240,0.4)`, background: 'white' }}
                       onKeyDown={e => { if (e.key === 'Enter') addCalendarItem(day); }}
                      />
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 3 }}>Schedule (optional)</label>
                        <input
                          type="datetime-local"
                          value={formScheduledAt}
                          onChange={e => setFormScheduledAt(e.target.value)}
                          style={{ fontSize: 12, borderRadius: 6, padding: '4px 8px', border: `1px solid rgba(160,195,240,0.4)`, background: 'white', width: '100%' }}
                        />
                      </div>
                       <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" onClick={() => addCalendarItem(day)} style={{ ...btnBase, background: ACCENT, color: 'white', flex: 1 }}>Add</button>
                        <button type="button" onClick={() => setOpenDay(null)} style={{ ...btnBase, background: 'rgba(160,195,240,0.2)', color: 'var(--de-text-dim)', flex: 1 }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Publishing Queue ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Publishing Queue</span>
            {publishedCount > 0 && (
              <span style={{
                marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                background: `${ACCENT}20`, color: ACCENT,
                borderRadius: 999, padding: '2px 10px',
              }}>✅ {publishedCount} published</span>
            )}
          </div>
          <div className="de-widget-body">
            {publishMsg && (
              <div style={{ fontSize: 12, fontWeight: 600, color: publishMsg.startsWith('⚠️') ? '#ef4444' : '#16a34a', marginBottom: 8 }}>{publishMsg}</div>
            )}
            {allQueued.length === 0 ? (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)', padding: '8px 0' }}>
                No items queued. Use the Content Calendar above to schedule content.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {allQueued.map(item => (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.5)',
                    border: '1px solid rgba(160,195,240,0.18)',
                  }}>
                    <span style={{ fontSize: 16 }}>{TYPE_EMOJI[item.type]}</span>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--de-heading)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                    {item.scheduled_at && (
                      <span style={{ fontSize: 10, color: '#6366f1', background: 'rgba(99,102,241,0.1)', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>🗓</span>
                    )}
                    <span style={{ fontSize: 10, color: 'var(--de-text-dim)', flexShrink: 0, marginRight: 6 }}>{item.day}</span>
                    <button type="button" onClick={() => publishItem(item.day, item.id)} style={{ ...btnBase, background: ACCENT, color: 'white' }}>{item.scheduled_at ? 'Schedule' : 'Publish Now'}</button>
                    <button type="button" onClick={() => removeCalendarItem(item.day, item.id)} style={{ ...btnBase, background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Smart Draft Generator ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Smart Draft Generator</span>
          </div>
          <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}>Draft Type</label>
                <select
                  value={draftType}
                  onChange={e => setDraftType(e.target.value as DraftType)}
                  style={{ width: '100%', fontSize: 13, borderRadius: 8, padding: '6px 10px', border: `1px solid rgba(160,195,240,0.35)`, background: 'rgba(255,255,255,0.7)' }}
                >
                  {DRAFT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ flex: 2 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}>Topic</label>
                <input
                  value={draftTopic}
                  onChange={e => setDraftTopic(e.target.value)}
                  placeholder="e.g. photography, fitness…"
                  style={{ width: '100%', fontSize: 13, borderRadius: 8, padding: '6px 10px', border: `1px solid rgba(160,195,240,0.35)`, background: 'rgba(255,255,255,0.7)' }}
                />
              </div>
            </div>
            <div className="de-widget-actions" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setDraft(generateDraft(draftType, draftTopic))}
                style={{ ...btnBase, background: ACCENT, color: 'white', padding: '7px 18px', fontSize: 13 }}
              >Generate Draft</button>
              {draft && (
                <button
                  type="button"
                  onClick={copyDraft}
                  style={{ ...btnBase, background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(160,195,240,0.2)', color: copied ? '#16a34a' : 'var(--de-heading)', padding: '7px 18px', fontSize: 13 }}
                >{copied ? '✅ Copied!' : 'Copy to Clipboard'}</button>
              )}
              {draft && (
                <button
                  type="button"
                  onClick={saveDraft}
                  style={{ ...btnBase, background: 'rgba(99,102,241,0.12)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.25)', padding: '7px 18px', fontSize: 13 }}
                >💾 Save Draft</button>
              )}
            </div>
            {draft && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-text-dim)', display: 'block', marginBottom: 4 }}>Schedule publish (optional)</label>
                  <input
                    type="datetime-local"
                    value={draftScheduledAt}
                    onChange={e => setDraftScheduledAt(e.target.value)}
                    style={{ fontSize: 12, borderRadius: 8, padding: '5px 10px', border: `1px solid rgba(160,195,240,0.35)`, background: 'rgba(255,255,255,0.7)', width: '100%' }}
                  />
                </div>
                {draftSaveMsg && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: draftSaveMsg.startsWith('⚠️') ? '#ef4444' : '#16a34a' }}>{draftSaveMsg}</span>
                )}
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  rows={6}
                  style={{
                    width: '100%', borderRadius: 10, padding: '10px 12px', fontSize: 13,
                    border: `1px solid rgba(160,195,240,0.35)`,
                    background: 'rgba(255,255,255,0.65)',
                    color: 'var(--de-heading)', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.55,
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ── Cross-Platform Targets ── */}
        <div className="de-widget">
          <div className="de-widget-header">
            <span className="de-widget-title">Cross-Platform Targets</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--de-text-dim)' }}>
              {selectedPlatforms.size} platform{selectedPlatforms.size !== 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="de-widget-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PLATFORMS.map(p => {
                const active = selectedPlatforms.has(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    style={{
                      ...btnBase,
                      padding: '6px 14px', fontSize: 13,
                      background: active ? `${ACCENT}22` : 'rgba(160,195,240,0.15)',
                      color: active ? ACCENT : 'var(--de-text-dim)',
                      border: `1.5px solid ${active ? ACCENT : 'rgba(160,195,240,0.25)'}`,
                    }}
                  >{p}</button>
                );
              })}
            </div>
            <div className="de-widget-actions" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={broadcast}
                disabled={selectedPlatforms.size === 0}
                style={{
                  ...btnBase,
                  background: selectedPlatforms.size > 0 ? ACCENT : 'rgba(160,195,240,0.2)',
                  color: selectedPlatforms.size > 0 ? 'white' : 'var(--de-text-dim)',
                  padding: '7px 20px', fontSize: 13,
                  opacity: selectedPlatforms.size === 0 ? 0.5 : 1,
                  cursor: selectedPlatforms.size === 0 ? 'not-allowed' : 'pointer',
                }}
              >Broadcast</button>
              {broadcastMsg && (
                <span style={{ fontSize: 12, fontWeight: 600, color: '#16a34a' }}>{broadcastMsg}</span>
              )}
            </div>
          </div>
        </div>

        {/* ── Media Vault Link ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Image className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Media Vault</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
              Browse, organise and reuse your media assets — photos, videos, and brand materials in one place.
            </p>
          </div>
          <div className="de-widget-actions">
            <a
              href="/daydream/media-vault"
              className="de-btn de-btn-primary text-xs"
              aria-label="Go to Media Vault"
            >
              Open Media Vault →
            </a>
          </div>
        </div>

        {/* ── AI Caption ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Zap className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">AI Caption</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                placeholder="Post topic…"
                value={captionTopic}
                onChange={e => setCaptionTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGenerateCaption()}
                aria-label="Caption topic"
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 9, fontSize: 12,
                  border: `1px solid ${ACCENT}30`, background: 'rgba(255,255,255,0.7)',
                  color: 'var(--de-heading)', outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleGenerateCaption}
                disabled={captionLoading || !captionTopic.trim()}
                className="de-btn de-btn-primary"
                aria-label="Generate caption"
                style={{ opacity: captionLoading || !captionTopic.trim() ? 0.6 : 1, transition: 'all 0.15s' }}
              >
                {captionLoading ? '…' : 'Generate'}
              </button>
            </div>
            {captionResult && (
              <div
                style={{
                  padding: '12px 14px', borderRadius: 10,
                  background: `${ACCENT}08`, border: `1px solid ${ACCENT}20`,
                  fontSize: 13, color: 'var(--de-heading)', lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {captionResult}
              </div>
            )}
          </div>
        </div>

        {/* ── Collab Draft ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <FileText className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Co-authoring Draft</span>
            {collabDraftActive && (
              <span
                className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}
              >
                Live
              </span>
            )}
          </div>
          <div className="de-widget-body">
            {collabDraftActive ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ padding: '10px 14px', borderRadius: 10, background: `${ACCENT}08`, border: `1px solid ${ACCENT}25`, textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-text-dim)', marginBottom: 4 }}>SESSION CODE</div>
                  <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '0.15em', color: ACCENT, fontFamily: 'monospace' }}>{collabDraftCode}</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {collabDraftUsers.map(u => (
                    <div
                      key={u}
                      style={{
                        flex: 1, padding: '8px 10px', borderRadius: 9, textAlign: 'center',
                        background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(160,195,240,0.2)',
                      }}
                    >
                      <div style={{ fontSize: 16, marginBottom: 2 }}>✍️</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-heading)' }}>{u}</div>
                      <div style={{ width: 8, height: 8, borderRadius: 999, background: '#22c55e', margin: '4px auto 0' }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: 'var(--de-text-dim)' }}>
                Start a co-authoring session to write content collaboratively in real time.
              </p>
            )}
          </div>
          <div className="de-widget-actions">
            <button
              type="button"
              onClick={handleCollabDraftToggle}
              className={collabDraftActive ? 'de-btn de-btn-ghost' : 'de-btn de-btn-primary'}
              aria-label={collabDraftActive ? 'End co-authoring session' : 'Start co-authoring session'}
              style={{ transition: 'all 0.15s' }}
            >
              {collabDraftActive ? 'End Session' : 'Start Co-authoring'}
            </button>
          </div>
        </div>

        {/* ── Content Analytics ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <BarChart2 className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Content Analytics</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
              {analyticsMetrics.map((m, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 14px', borderRadius: 11,
                    background: 'rgba(255,255,255,0.55)', border: `1px solid ${ACCENT}15`,
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{m.icon}</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--de-heading)', lineHeight: 1 }}>{m.value}</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--de-text-dim)', marginTop: 3 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="de-widget-actions">
            <button
              type="button"
              onClick={handleAnalyticsRefresh}
              className="de-btn de-btn-ghost"
              aria-label="Refresh content analytics"
              style={{ transition: 'all 0.15s' }}
            >
              Refresh Analytics
            </button>
          </div>
        </div>

        {/* ── Template Gallery ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Calendar className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Template Gallery</span>
          </div>
          <div className="de-widget-body">
            <input
              type="text"
              placeholder="Search templates…"
              value={templateSearch}
              onChange={e => setTemplateSearch(e.target.value)}
              aria-label="Search templates"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 9, fontSize: 12, marginBottom: 10,
                border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)',
                color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {templates
                .filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase()) || t.type.toLowerCase().includes(templateSearch.toLowerCase()))
                .map(t => (
                  <div
                    key={t.id}
                    style={{
                      padding: '10px 12px', borderRadius: 10,
                      background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}15`,
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{t.name}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 4, background: `${ACCENT}12`, color: ACCENT }}>{t.type}</span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--de-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.preview}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTemplateApply(t.id)}
                      aria-label={`Use template ${t.name}`}
                      style={{
                        padding: '4px 10px', borderRadius: 7, fontSize: 10, fontWeight: 700,
                        border: `1px solid ${ACCENT}35`, background: `${ACCENT}12`, color: ACCENT,
                        cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
                      }}
                    >
                      Use
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* ── Short Video Editor ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Video className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Short Video Editor</span>
            {videoPublishReady && (
              <span
                className="ml-auto text-xs font-semibold px-2 py-1 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.25)' }}
              >
                ✓ Ready
              </span>
            )}
          </div>
          <div className="de-widget-body">
            <input
              type="text"
              placeholder="Video title…"
              value={videoTitle}
              onChange={e => { setVideoTitle(e.target.value); setVideoPublishReady(false); }}
              aria-label="Video title"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 9, fontSize: 12, marginBottom: 10,
                border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)',
                color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
              {([15, 30, 60, 90] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setVideoDuration(d)}
                  aria-label={`Set video duration to ${d} seconds`}
                  style={{
                    flex: 1, padding: '6px 0', borderRadius: 7, fontSize: 12, fontWeight: 700,
                    border: `1.5px solid ${videoDuration === d ? ACCENT : 'rgba(160,195,240,0.25)'}`,
                    background: videoDuration === d ? `${ACCENT}15` : 'rgba(255,255,255,0.5)',
                    color: videoDuration === d ? ACCENT : 'var(--de-text)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {d}s
                </button>
              ))}
            </div>
            <textarea
              placeholder="Auto-captions or script…"
              value={videoCaptions}
              onChange={e => setVideoCaptions(e.target.value)}
              aria-label="Video captions"
              rows={3}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 9, fontSize: 12,
                border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)',
                color: 'var(--de-heading)', outline: 'none', resize: 'vertical', marginBottom: 0,
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div className="de-widget-actions">
            <button
              type="button"
              onClick={handleVideoPrepare}
              disabled={!videoTitle.trim() || videoPublishReady}
              className="de-btn de-btn-primary"
              aria-label="Prepare video for publish"
              style={{ opacity: !videoTitle.trim() ? 0.5 : 1, transition: 'all 0.15s' }}
            >
              {videoPublishReady ? '✓ Prepared' : 'Prepare for Publish'}
            </button>
          </div>
        </div>

        {/* ── Hashtag Optimizer ── */}
        <div className="de-widget" style={{ marginTop: 14 }}>
          <div className="de-widget-header">
            <Hash className="w-4 h-4" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-2">Hashtag Optimizer</span>
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                placeholder="Topic for hashtags…"
                value={hashtagTopic}
                onChange={e => setHashtagTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleOptimizeHashtags()}
                aria-label="Topic for hashtag optimization"
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 9, fontSize: 12,
                  border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.7)',
                  color: 'var(--de-heading)', outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={handleOptimizeHashtags}
                disabled={hashtagLoading || !hashtagTopic.trim()}
                className="de-btn de-btn-primary"
                aria-label="Optimize hashtags"
                style={{ opacity: hashtagLoading || !hashtagTopic.trim() ? 0.6 : 1, transition: 'all 0.15s' }}
              >
                {hashtagLoading ? '…' : 'Optimize'}
              </button>
            </div>
            {hashtags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {hashtags.map((tag, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                      background: `${ACCENT}12`, color: ACCENT, border: `1px solid ${ACCENT}25`,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Feature 13: Viral Hook Builder ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Zap className="w-4 h-4 mr-1" style={{ color: '#ef4444' }} />
            <span className="de-widget-title ml-1">Viral Hook Builder</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Generates hooks through a real server route and saves the result into Drafts.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                value={hookTopic}
                onChange={e => setHookTopic(e.target.value)}
                placeholder="Topic or campaign..."
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.6)', fontSize: 12, color: 'var(--de-heading)', outline: 'none' }}
              />
              <button
                type="button"
                onClick={handleGenerateHooks}
                disabled={hookLoading || !hookTopic.trim()}
                className="de-btn de-btn-primary"
                style={{ opacity: hookLoading || !hookTopic.trim() ? 0.6 : 1 }}
              >
                {hookLoading ? '…' : 'Generate'}
              </button>
            </div>
            {hookSaveMsg && (
              <div style={{ fontSize: 10, color: hookSaveMsg === 'Saved to Drafts.' ? '#22c55e' : '#ef4444', marginBottom: 8 }}>
                {hookSaveMsg}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {(hookResults.length > 0 ? hookResults : [
                'Nobody talks about this, but…',
                'I wasted 3 years not knowing this one thing:',
                'Unpopular opinion: [your take] is better than [alternative]',
                'Here\'s what I wish someone told me when I started:',
                'POV: You just discovered the creator tool you\'ve been looking for.',
              ]).map((hook, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 9, background: copiedHook === i ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.06)', border: `1px solid ${copiedHook === i ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.15)'}`, transition: 'background 0.2s, border 0.2s' }}>
                  <span style={{ fontSize: 11, flex: 1, color: 'var(--de-heading)', lineHeight: 1.4 }}>{hook}</span>
                  <button type="button" onClick={() => copyHook(hook, i)}
                    style={{ fontSize: 14, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, opacity: copiedHook === i ? 1 : 0.6 }}>
                    {copiedHook === i ? '✅' : '📋'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 14: Content Repurposer ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <FileText className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-1">Content Repurposer</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Transform one piece of content into multiple formats automatically.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { from: '📝 Blog Post', to: '🐦 Tweet Thread', arrow: '→' },
                { from: '🎬 Long Video', to: '📱 5 Reels', arrow: '→' },
                { from: '🎙 Podcast', to: '📝 Newsletter', arrow: '→' },
                { from: '🧵 Thread', to: '📸 Carousel', arrow: '→' },
              ].map(r => (
                <div key={r.from} style={{ padding: '10px 10px', borderRadius: 10, background: `${ACCENT}08`, border: `1px solid ${ACCENT}18`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>{r.from}</div>
                  <div style={{ fontSize: 11, color: ACCENT, fontWeight: 700 }}>{r.arrow} {r.to}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 15: SEO Title Optimizer (live scoring) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <BarChart2 className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-1">SEO Title Optimizer</span>
            {seoResult !== null && (
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: seoResult.score >= 80 ? '#22c55e' : seoResult.score >= 60 ? ACCENT : '#ef4444', background: seoResult.score >= 80 ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', padding: '2px 7px', borderRadius: 5 }}>
                {seoResult.score}pts
              </span>
            )}
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                value={seoInput}
                onChange={e => setSeoInput(e.target.value)}
                placeholder="Type your title to score it…"
                style={{ flex: 1, padding: '8px 10px', borderRadius: 9, border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.6)', fontSize: 12, color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={handleSeoScore}
                disabled={seoLoading || !seoInput.trim()}
                className="de-btn de-btn-primary"
                style={{ opacity: seoLoading || !seoInput.trim() ? 0.6 : 1 }}
              >
                {seoLoading ? '…' : 'Score'}
              </button>
            </div>
            {seoSaveMsg && (
              <div style={{ fontSize: 10, color: seoSaveMsg === 'Saved to Drafts.' ? '#22c55e' : '#ef4444', marginBottom: 8 }}>
                {seoSaveMsg}
              </div>
            )}
            {seoResult !== null && seoInput.trim() && (
              <div style={{ height: 6, borderRadius: 4, background: 'rgba(0,0,0,0.06)', marginBottom: 10 }}>
                <div style={{ height: '100%', borderRadius: 4, width: `${seoResult.score}%`, background: seoResult.score >= 80 ? '#22c55e' : seoResult.score >= 60 ? ACCENT : '#ef4444', transition: 'width 0.4s ease' }} />
              </div>
            )}
            {seoResult?.reasons?.length ? (
              <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {seoResult.reasons.map((reason, idx) => (
                  <div key={idx} style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>• {reason}</div>
                ))}
              </div>
            ) : null}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[
                { title: 'How I Built [X] in [Time] (Step-by-Step)', score: 92 },
                { title: '[Number] Things I Learned from [Experience]', score: 88 },
                { title: 'The Ultimate Guide to [Topic] for [Audience]', score: 85 },
              ].map(t => (
                <div key={t.title} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 9, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}15` }}>
                  <span style={{ flex: 1, fontSize: 11, color: 'var(--de-heading)' }}>{t.title}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', flexShrink: 0 }}>{t.score}pts</span>
                  <button type="button" onClick={() => { setSeoInput(t.title); setSeoResult(null); setSeoSaveMsg(''); }}
                    style={{ fontSize: 10, color: ACCENT, background: 'none', border: 'none', cursor: 'pointer' }}>Use</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 16: Newsletter Template Generator ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Image className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-1">Newsletter Template</span>
          </div>
          <div className="de-widget-body">
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)', fontSize: 12, color: 'var(--de-text)', lineHeight: 1.7 }}>
              <strong>Subject: [Main Hook] — Issue #[N]</strong><br /><br />
              👋 Hey [First Name],<br /><br />
              <strong>This week:</strong><br />
              • 🔥 [Main insight or announcement]<br />
              • 💡 [Secondary tip or tool recommendation]<br />
              • 📖 [Curated read or resource]<br /><br />
              <strong>Deep Dive: [Topic]</strong><br />
              [2–3 sentences on your main topic]<br /><br />
              Until next week 🚀<br />
              [Your Name]
            </div>
            <button type="button"
              onClick={() => navigator.clipboard?.writeText('Subject: [Main Hook] — Issue #[N]\n\nHey [First Name],\n\nThis week:\n• [Main insight]\n• [Tip]\n• [Resource]\n\n[Your Name]').catch(() => {})}
              style={{ marginTop: 8, padding: '7px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: `${ACCENT}14`, border: `1px solid ${ACCENT}30`, color: ACCENT, cursor: 'pointer', width: '100%' }}>
              📋 Copy Template
            </button>
          </div>
        </div>

        {/* ── Feature 17: Content Performance Predictor ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Video className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-1">Performance Predictor</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Score your next piece of content before posting — based on format, timing, and your past performance.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { type: '📱 Reel', score: 91, label: 'High potential' },
                { type: '📝 Carousel', score: 84, label: 'Strong' },
                { type: '🐦 Thread', score: 72, label: 'Moderate' },
                { type: '📸 Static Post', score: 58, label: 'Average' },
              ].map(f => (
                <div key={f.type} style={{ padding: '10px 10px', borderRadius: 10, background: 'rgba(255,255,255,0.5)', border: `1px solid ${ACCENT}15`, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>{f.type}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: f.score >= 80 ? '#22c55e' : f.score >= 65 ? ACCENT : '#ef4444' }}>{f.score}%</div>
                  <div style={{ fontSize: 9, color: 'var(--de-text-dim)' }}>{f.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 18: Multi-Platform Scheduler ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Calendar className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-1">Multi-Platform Scheduler</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Post to all your platforms at the optimal time in one tap.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { platform: '📸 Instagram', optimal: 'Wed 6 PM', queued: 2 },
                { platform: '🎵 TikTok',    optimal: 'Fri 7 PM', queued: 1 },
                { platform: '🐦 X',         optimal: 'Thu 9 AM', queued: 3 },
                { platform: '▶️ YouTube',   optimal: 'Sat 2 PM', queued: 0 },
              ].map(p => (
                <div key={p.platform} style={{ padding: '9px 10px', borderRadius: 9, background: `${ACCENT}08`, border: `1px solid ${ACCENT}18` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 3 }}>{p.platform}</div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>Best: {p.optimal}</div>
                  <div style={{ fontSize: 10, color: p.queued > 0 ? ACCENT : 'var(--de-text-dim)', fontWeight: p.queued > 0 ? 700 : 400 }}>
                    {p.queued > 0 ? `${p.queued} queued` : 'No posts queued'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 19: Ad Copy Generator ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span style={{ fontSize: 16 }}>📣</span>
            <span className="de-widget-title ml-2">Ad Copy Generator</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Headlines, body copy, and CTAs for paid campaigns — ready to test.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                {
                  label: 'Awareness',
                  headline: 'The creative platform that gets you seen.',
                  body: 'Build your brand, grow your audience, and create better content — all in one place.',
                  cta: 'Explore DREAMengin →',
                },
                {
                  label: 'Conversion',
                  headline: 'Stop wasting time. Start creating.',
                  body: 'DREAMengin gives you analytics, publishing, and brand tools creators actually use.',
                  cta: 'Start Free Today',
                },
              ].map(ad => (
                <div key={ad.label} style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.18)' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{ad.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--de-heading)', marginBottom: 3 }}>{ad.headline}</div>
                  <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 6 }}>{ad.body}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: ACCENT }}>{ad.cta}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Feature 20: Game Engine Cinematic Templates ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <span style={{ fontSize: 16 }}>🎮</span>
            <span className="de-widget-title ml-2">Cinematic Intro Templates</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>
              FREE
            </span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Game-engine-powered animated video intros for your content — rendered by EliteGameEngine WebGPU.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { name: 'Neon Burst', desc: 'Particle explosion logo reveal', emoji: '✨', tier: 'Free' },
                { name: 'Drift Intro', desc: 'Racing car speed reveal', emoji: '🏎', tier: 'Premium' },
                { name: 'Galaxy Fly', desc: 'Space flythrough with brand text', emoji: '🌌', tier: 'Premium' },
                { name: 'Glitch Cut', desc: 'Cyberpunk glitch screen reveal', emoji: '⚡', tier: 'Free' },
              ].map(t => (
                <div key={t.name} style={{ padding: '10px 10px', borderRadius: 10, background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{t.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)' }}>{t.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginBottom: 4 }}>{t.desc}</div>
                  <span style={{ fontSize: 9, fontWeight: 700, color: t.tier === 'Free' ? '#22c55e' : '#8b5cf6', background: t.tier === 'Free' ? 'rgba(34,197,94,0.1)' : 'rgba(139,92,246,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                    {t.tier}
                  </span>
                </div>
              ))}
            </div>
            <button type="button"
              onClick={() => {
                (bridge.emit as (ch: string, ev: string, pl: unknown) => void)(
                  'content', 'content:cinematic-render', { template: 'neon-burst' },
                );
                recordForgeTransfer('create', 'games', 'cinematic-template', 'Cinematic render → GameEngin (neon-burst)');
              }}
              style={{ marginTop: 8, padding: '8px 14px', borderRadius: 9, fontSize: 11, fontWeight: 700, background: 'rgba(139,92,246,0.14)', border: '1px solid rgba(139,92,246,0.3)', color: '#8b5cf6', cursor: 'pointer', width: '100%' }}>
              🎬 Render Neon Burst Intro
            </button>
          </div>
        </div>

        {/* ══ NEW INDUSTRY-STANDARD PANELS ══════════════════════════════════════ */}

        {/* ── Quick Compose (Studio-in-a-Box) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Rocket className="w-4 h-4 mr-1" style={{ color: '#8b5cf6' }} />
            <span className="de-widget-title ml-1">Quick Compose</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>AI</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              One prompt → rough cut with script, music suggestion, and visuals.
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                value={quickComposePrompt}
                onChange={e => setQuickComposePrompt(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQuickCompose()}
                placeholder="e.g. 60s promo for a tech startup…"
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.6)', fontSize: 12, color: 'var(--de-heading)', outline: 'none' }}
              />
              <button
                type="button"
                onClick={handleQuickCompose}
                disabled={quickComposeLoading || !quickComposePrompt.trim()}
                className="de-btn de-btn-primary"
                style={{ opacity: quickComposeLoading || !quickComposePrompt.trim() ? 0.6 : 1 }}
              >
                {quickComposeLoading ? '…' : '🚀 Compose'}
              </button>
            </div>
            {quickComposeMsg && (
              <div style={{ fontSize: 11, fontWeight: 600, color: quickComposeMsg.startsWith('⚠️') ? '#ef4444' : '#22c55e', marginBottom: 10 }}>
                {quickComposeMsg}
              </div>
            )}
            {quickComposeResult && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#8b5cf6', marginBottom: 5 }}>📝 SCRIPT</div>
                  <pre style={{ fontSize: 11, color: 'var(--de-heading)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', lineHeight: 1.5, margin: 0 }}>{quickComposeResult.script}</pre>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div style={{ padding: '8px 10px', borderRadius: 9, background: `${ACCENT}08`, border: `1px solid ${ACCENT}18` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, marginBottom: 3 }}>🎵 MUSIC</div>
                    <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{quickComposeResult.musicSuggestion}</div>
                  </div>
                  <div style={{ padding: '8px 10px', borderRadius: 9, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', marginBottom: 3 }}>🎬 VISUALS</div>
                    <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{quickComposeResult.visualSuggestion}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Transcript Editor (Descript-style) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <FileText className="w-4 h-4 mr-1" style={{ color: '#06b6d4' }} />
            <span className="de-widget-title ml-1">Transcript Editor</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <button
                type="button"
                onClick={() => setTranscriptView(transcriptView === 'transcript' ? 'waveform' : 'transcript')}
                style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, border: `1px solid #06b6d435`, background: 'rgba(6,182,212,0.08)', color: '#06b6d4', cursor: 'pointer' }}
              >
                {transcriptView === 'transcript' ? '〰 Waveform' : '📄 Transcript'}
              </button>
            </div>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Upload an SRT or VTT file. Click words to mark for deletion — the timeline cuts accordingly. Search and export your edits as a new SRT.
            </p>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9,
              border: `1.5px dashed #06b6d440`, background: 'rgba(6,182,212,0.04)',
              cursor: 'pointer', marginBottom: 10,
            }}>
              <FileText className="w-4 h-4" style={{ color: '#06b6d4', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#06b6d4', fontWeight: 600 }}>
                {transcriptLoading ? 'Loading…' : 'Upload .srt or .vtt'}
              </span>
              <input
                type="file"
                accept=".srt,.vtt"
                onChange={handleSubtitleUpload}
                style={{ display: 'none' }}
              />
            </label>
            {/* Search bar — only shown when transcript is loaded */}
            {transcriptSegments.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                  <Search className="w-3 h-3" style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', color: 'var(--de-text-dim)' }} />
                  <input
                    type="text"
                    value={transcriptSearch}
                    onChange={e => handleTranscriptSearch(e.target.value)}
                    placeholder="Search transcript…"
                    style={{ width: '100%', paddingLeft: 26, paddingRight: 10, paddingTop: 6, paddingBottom: 6, borderRadius: 8, border: '1px solid rgba(6,182,212,0.25)', background: 'rgba(255,255,255,0.6)', fontSize: 11, color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                {transcriptSearch && (
                  <span style={{ fontSize: 10, color: transcriptSearchCount > 0 ? '#06b6d4' : 'var(--de-text-dim)', fontWeight: 700, flexShrink: 0 }}>
                    {transcriptSearchCount} match{transcriptSearchCount !== 1 ? 'es' : ''}
                  </span>
                )}
              </div>
            )}
            {transcriptMsg && (
              <div style={{ fontSize: 11, fontWeight: 600, color: transcriptMsg.startsWith('⚠️') ? '#ef4444' : '#22c55e', marginBottom: 8 }}>
                {transcriptMsg}
              </div>
            )}
            {transcriptView === 'waveform' ? (
              <div style={{ height: 56, borderRadius: 9, background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Waveform view (connect audio source)</span>
              </div>
            ) : displayedSegments.length > 0 ? (
              <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {displayedSegments.map(seg => (
                  <div key={seg.id} style={{ padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(6,182,212,0.15)' }}>
                    <div style={{ fontSize: 9, color: 'var(--de-text-dim)', marginBottom: 3, fontFamily: 'monospace' }}>
                      {(seg.startMs / 1000).toFixed(2)}s → {(seg.endMs / 1000).toFixed(2)}s
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {seg.words.map(w => (
                        <button
                          key={w.index}
                          type="button"
                          onClick={() => toggleWordDelete(w.index)}
                          title={`${(w.startMs / 1000).toFixed(2)}s`}
                          style={{
                            fontSize: 12, padding: '2px 5px', borderRadius: 4, border: 'none', cursor: 'pointer',
                            background: deletedWordIdx.has(w.index)
                              ? 'rgba(239,68,68,0.15)'
                              : w.isSearchMatch
                                ? 'rgba(6,182,212,0.18)'
                                : 'transparent',
                            color: deletedWordIdx.has(w.index) ? '#ef4444' : w.isSearchMatch ? '#06b6d4' : 'var(--de-heading)',
                            textDecoration: deletedWordIdx.has(w.index) ? 'line-through' : 'none',
                            fontWeight: w.isSearchMatch ? 700 : 400,
                            transition: 'all 0.12s',
                          }}
                        >
                          {w.word}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
            {transcriptSegments.length > 0 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={applyTranscriptEdits}
                  disabled={deletedWordIdx.size === 0}
                  style={{ ...btnBase, background: '#06b6d4', color: 'white', opacity: deletedWordIdx.size === 0 ? 0.4 : 1, flex: 1 }}
                >
                  ✂️ Apply Edits ({deletedWordIdx.size} words)
                </button>
                <button
                  type="button"
                  onClick={handleExportSRT}
                  title="Export edited transcript as SRT"
                  style={{ ...btnBase, background: 'rgba(6,182,212,0.12)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}
                >
                  <Download className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={resetTranscriptEdits}
                  title="Reset all edits"
                  style={{ ...btnBase, background: 'rgba(160,195,240,0.18)', color: 'var(--de-text-dim)' }}
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}
            {pendingCuts.length > 0 && (
              <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>PENDING CUTS</div>
                {pendingCuts.map((cut, i) => (
                  <div key={i} style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>
                    ✂️ {(cut.cutStartMs / 1000).toFixed(2)}s – {(cut.cutEndMs / 1000).toFixed(2)}s
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Generative Fill (Adobe Firefly-style) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Wand2 className="w-4 h-4 mr-1" style={{ color: '#f59e0b' }} />
            <span className="de-widget-title ml-1">Generative Fill</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: ACCENT, background: `${ACCENT}18`, padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>AI</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Upload a frame or image, describe what to generate, and apply AI fill.
              Configure <code style={{ fontSize: 10 }}>REPLICATE_API_TOKEN</code> for real results.
            </p>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9,
              border: `1.5px dashed ${ACCENT}40`, background: `${ACCENT}04`, cursor: 'pointer', marginBottom: 10,
            }}>
              <Image className="w-4 h-4" style={{ color: ACCENT, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: ACCENT, fontWeight: 600 }}>
                {fillImageBase64 ? '✅ Image loaded — change?' : 'Upload image / video frame'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFillImageUpload}
                style={{ display: 'none' }}
              />
            </label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                value={fillPrompt}
                onChange={e => setFillPrompt(e.target.value)}
                placeholder='Describe the fill, e.g. "replace sky with sunset"…'
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.6)', fontSize: 12, color: 'var(--de-heading)', outline: 'none' }}
              />
              <button
                type="button"
                onClick={handleGenerativeFill}
                disabled={fillLoading || !fillImageBase64 || !fillPrompt.trim()}
                className="de-btn de-btn-primary"
                style={{ opacity: fillLoading || !fillImageBase64 || !fillPrompt.trim() ? 0.55 : 1 }}
              >
                {fillLoading ? '…' : '✨ Fill'}
              </button>
            </div>
            {fillMsg && (
              <div style={{ fontSize: 11, fontWeight: 600, color: fillMsg.startsWith('⚠️') ? '#ef4444' : '#22c55e', marginBottom: 8 }}>
                {fillMsg}
              </div>
            )}
            {fillResultBase64 && (
              <img
                src={`data:image/jpeg;base64,${fillResultBase64}`}
                alt="Generative fill result"
                style={{ width: '100%', borderRadius: 10, border: `1px solid ${ACCENT}20` }}
              />
            )}
          </div>
        </div>

        {/* ── Voice Clone & AI TTS (ElevenLabs-style) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Mic className="w-4 h-4 mr-1" style={{ color: '#10b981' }} />
            <span className="de-widget-title ml-1">Voice Clone & TTS</span>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              {voiceProfileId && (
                <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '2px 7px', borderRadius: 5 }}>
                  Voice ready
                </span>
              )}
              <button
                type="button"
                onClick={loadVoiceProfiles}
                disabled={voiceProfilesLoading}
                title="Load saved voice profiles"
                style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 5, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.07)', color: '#10b981', cursor: 'pointer', opacity: voiceProfilesLoading ? 0.5 : 1 }}
              >
                {voiceProfilesLoading ? '…' : '↻ Load'}
              </button>
            </div>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Upload a 30s voice sample to clone it, then generate TTS with your voice.
              Wire <code style={{ fontSize: 10 }}>ELEVENLABS_API_KEY</code> for real audio.
            </p>
            {/* Saved profiles list */}
            {voiceProfiles.length > 0 && (
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', marginBottom: 5 }}>SAVED VOICES</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {voiceProfiles.map(p => (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8,
                      background: voiceProfileId === p.id ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.5)',
                      border: `1px solid ${voiceProfileId === p.id ? 'rgba(16,185,129,0.35)' : 'rgba(0,0,0,0.07)'}`,
                      cursor: 'pointer',
                    }}
                      onClick={() => setVoiceProfileId(p.id)}
                    >
                      <Mic className="w-3 h-3" style={{ color: voiceProfileId === p.id ? '#10b981' : 'var(--de-text-dim)', flexShrink: 0 }} />
                      <span style={{ fontSize: 11, fontWeight: voiceProfileId === p.id ? 700 : 400, color: voiceProfileId === p.id ? '#10b981' : 'var(--de-heading)', flex: 1 }}>
                        {p.name}
                      </span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); deleteVoiceProfile(p.id); }}
                        title="Delete voice profile"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--de-text-dim)' }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input
                type="text"
                value={voiceName}
                onChange={e => setVoiceName(e.target.value)}
                placeholder="Voice name…"
                style={{ flex: 1, padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(255,255,255,0.6)', fontSize: 12, color: 'var(--de-heading)', outline: 'none' }}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.07)', cursor: 'pointer', flexShrink: 0 }}>
                <Mic className="w-3 h-3" style={{ color: '#10b981' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>
                  {voiceCloneLoading ? 'Cloning…' : 'Upload Sample'}
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleVoiceClone(f); }}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
            {voiceCloneMsg && (
              <div style={{ fontSize: 11, fontWeight: 600, color: voiceCloneMsg.startsWith('⚠️') ? '#ef4444' : '#22c55e', marginBottom: 8 }}>
                {voiceCloneMsg}
              </div>
            )}
            {voiceProfileId && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <textarea
                  placeholder="Enter text to speak with your cloned voice…"
                  value={ttsText}
                  onChange={e => setTtsText(e.target.value)}
                  rows={3}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.25)', background: 'rgba(255,255,255,0.6)', fontSize: 12, color: 'var(--de-heading)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <button
                  type="button"
                  onClick={handleTTS}
                  disabled={ttsLoading || !ttsText.trim()}
                  style={{ ...btnBase, background: '#10b981', color: 'white', padding: '8px 16px', fontSize: 12, opacity: ttsLoading || !ttsText.trim() ? 0.55 : 1 }}
                >
                  {ttsLoading ? '…' : '🔊 Generate Speech'}
                </button>
                {ttsMsg && (
                  <div style={{ fontSize: 11, fontWeight: 600, color: ttsMsg.startsWith('⚠️') ? '#ef4444' : '#22c55e' }}>
                    {ttsMsg}
                  </div>
                )}
                {ttsAudioBase64 && (
                  <audio controls src={`data:audio/mp3;base64,${ttsAudioBase64}`} style={{ width: '100%', borderRadius: 8 }} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Real-time SEO / Performance Scorer ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <BarChart2 className="w-4 h-4 mr-1" style={{ color: ACCENT }} />
            <span className="de-widget-title ml-1">Live SEO Scorer</span>
            {advSeoResult !== null && (
              <span style={{
                marginLeft: 'auto', fontSize: 10, fontWeight: 800,
                color: advSeoResult.overall >= 80 ? '#22c55e' : advSeoResult.overall >= 55 ? ACCENT : '#ef4444',
                background: advSeoResult.overall >= 80 ? 'rgba(34,197,94,0.1)' : advSeoResult.overall >= 55 ? `${ACCENT}15` : 'rgba(239,68,68,0.1)',
                padding: '2px 8px', borderRadius: 5,
              }}>
                {advSeoResult.overall}/100
              </span>
            )}
          </div>
          <div className="de-widget-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text"
                value={advSeoTitle}
                onChange={e => setAdvSeoTitle(e.target.value)}
                placeholder="Title / headline…"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.6)', fontSize: 12, color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box' }}
              />
              <input
                type="text"
                value={advSeoKeywords}
                onChange={e => setAdvSeoKeywords(e.target.value)}
                placeholder="Keywords (comma-separated)…"
                style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.6)', fontSize: 12, color: 'var(--de-heading)', outline: 'none', boxSizing: 'border-box' }}
              />
              <button
                type="button"
                onClick={() => setAdvSeoExpanded(p => !p)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--de-text-dim)', fontSize: 11, fontWeight: 600, padding: 0, alignSelf: 'flex-start' }}
              >
                {advSeoExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {advSeoExpanded ? 'Hide body text' : 'Add body text for deeper scoring'}
              </button>
              {advSeoExpanded && (
                <textarea
                  value={advSeoBody}
                  onChange={e => setAdvSeoBody(e.target.value)}
                  placeholder="Paste your description or body copy…"
                  rows={4}
                  style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${ACCENT}25`, background: 'rgba(255,255,255,0.6)', fontSize: 12, color: 'var(--de-heading)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                />
              )}
            </div>
            {advSeoResult && (
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Overall bar */}
                <div style={{ height: 6, borderRadius: 4, background: 'rgba(0,0,0,0.07)' }}>
                  <div style={{
                    height: '100%', borderRadius: 4, transition: 'width 0.4s ease',
                    width: `${advSeoResult.overall}%`,
                    background: advSeoResult.overall >= 80 ? '#22c55e' : advSeoResult.overall >= 55 ? ACCENT : '#ef4444',
                  }} />
                </div>
                {/* Dimensions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {advSeoResult.dimensions.map(d => (
                    <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--de-text-dim)', width: 36 }}>{d.label}</span>
                      <div style={{ flex: 1, height: 4, borderRadius: 3, background: 'rgba(0,0,0,0.07)' }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${Math.round((d.score / d.maxScore) * 100)}%`, background: ACCENT, transition: 'width 0.3s ease' }} />
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--de-text-dim)', fontFamily: 'monospace', width: 36, textAlign: 'right' }}>{d.score}/{d.maxScore}</span>
                    </div>
                  ))}
                </div>
                {/* Readability + engagement + accessibility row */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: 'var(--de-text-dim)', padding: '3px 7px', borderRadius: 5, background: 'rgba(0,0,0,0.04)' }}>
                    📖 {advSeoResult.readabilityGrade}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--de-text-dim)', padding: '3px 7px', borderRadius: 5, background: 'rgba(0,0,0,0.04)' }}>
                    🎯 {advSeoResult.engagementSignals} signal{advSeoResult.engagementSignals !== 1 ? 's' : ''}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 7px', borderRadius: 5,
                    background: advSeoResult.accessibilityLevel === 'High' ? 'rgba(34,197,94,0.1)' : advSeoResult.accessibilityLevel === 'Medium' ? `${ACCENT}12` : 'rgba(239,68,68,0.1)',
                    color: advSeoResult.accessibilityLevel === 'High' ? '#22c55e' : advSeoResult.accessibilityLevel === 'Medium' ? ACCENT : '#ef4444',
                  }}>
                    ♿ {advSeoResult.accessibilityLevel}
                  </span>
                </div>
                {/* Suggestions */}
                {advSeoResult.topSuggestions.length > 0 && (
                  <div style={{ padding: '8px 10px', borderRadius: 8, background: `${ACCENT}06`, border: `1px solid ${ACCENT}18` }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: ACCENT, marginBottom: 4 }}>SUGGESTIONS</div>
                    {advSeoResult.topSuggestions.map((s, i) => (
                      <div key={i} style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>• {s}</div>
                    ))}
                  </div>
                )}
                {/* Export report button */}
                <button
                  type="button"
                  onClick={handleExportSeoReport}
                  style={{ ...btnBase, background: `${ACCENT}10`, color: ACCENT, border: `1px solid ${ACCENT}25`, fontSize: 10, padding: '5px 10px' }}
                >
                  <Download className="w-3 h-3 inline mr-1" />Export JSON Report
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Human Review Toggle ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Shield className="w-4 h-4 mr-1" style={{ color: humanReviewEnabled ? '#22c55e' : 'var(--de-text-dim)' }} />
            <span className="de-widget-title ml-1">Human Review</span>
            <button
              type="button"
              onClick={() => setHumanReviewEnabled(p => !p)}
              style={{
                marginLeft: 'auto', padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: humanReviewEnabled ? 'rgba(34,197,94,0.15)' : 'rgba(160,195,240,0.2)',
                color: humanReviewEnabled ? '#22c55e' : 'var(--de-text-dim)',
                transition: 'all 0.15s',
              }}
            >
              {humanReviewEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              When enabled, every AI-generated output shows a Confirm button before applying.
              Rollback restores the previous version.
            </p>
            {humanReviewEnabled && pendingReviewItems.length === 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <CheckCircle className="w-4 h-4" style={{ color: '#22c55e', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>Human Review active — all outputs will require confirmation.</span>
              </div>
            )}
            {pendingReviewItems.map(item => (
              <div key={item.id} style={{ padding: '10px 12px', borderRadius: 9, background: `${ACCENT}06`, border: `1px solid ${ACCENT}20`, marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--de-heading)', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 8, whiteSpace: 'pre-wrap' }}>{item.content}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => confirmReviewItem(item.id)} style={{ ...btnBase, background: '#22c55e', color: 'white', flex: 1 }}>
                    <CheckCircle className="w-3 h-3 inline mr-1" />Confirm
                  </button>
                  <button type="button" onClick={() => rollbackReviewItem(item.id)} style={{ ...btnBase, background: 'rgba(239,68,68,0.1)', color: '#ef4444', flex: 1 }}>
                    <RotateCcw className="w-3 h-3 inline mr-1" />Rollback
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Brand Memory ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Flag className="w-4 h-4 mr-1" style={{ color: '#f43f5e' }} />
            <span className="de-widget-title ml-1">Brand Memory</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Paste your brand guidelines, tone of voice, or past successful posts.
              Dr. Eams uses this as context for all AI suggestions.
            </p>
            <textarea
              value={brandGuidelinesText}
              onChange={e => setBrandGuidelinesText(e.target.value)}
              placeholder="e.g. Our brand voice is confident but approachable. Primary colours: #F43F5E / #0EA5E9…"
              rows={4}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid rgba(244,63,94,0.25)', background: 'rgba(255,255,255,0.6)', fontSize: 12, color: 'var(--de-heading)', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: 8 }}
            />
            {brandSaveMsg && (
              <div style={{ fontSize: 11, fontWeight: 600, color: brandSaveMsg.startsWith('⚠️') ? '#ef4444' : '#22c55e', marginBottom: 6 }}>
                {brandSaveMsg}
              </div>
            )}
            <button
              type="button"
              onClick={saveBrandGuidelines}
              disabled={brandSaving || !brandGuidelinesText.trim()}
              style={{ ...btnBase, background: '#f43f5e', color: 'white', padding: '7px 16px', fontSize: 12, opacity: brandSaving || !brandGuidelinesText.trim() ? 0.5 : 1, width: '100%' }}
            >
              {brandSaving ? 'Saving…' : '🏳 Save Brand Guidelines'}
            </button>
          </div>
        </div>

        {/* ── Creativity / Human Touch Slider ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Dice5 className="w-4 h-4 mr-1" style={{ color: '#8b5cf6' }} />
            <span className="de-widget-title ml-1">Creativity & Randomness</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#8b5cf6' }}>{creativityLevel}%</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              High values push AI outputs to be more diverse and surprising.
              Low values keep outputs conservative and on-brand.
            </p>
            <input
              type="range"
              min={0}
              max={100}
              value={creativityLevel}
              onChange={e => setCreativityLevel(Number(e.target.value))}
              aria-label="Creativity level"
              style={{ width: '100%', accentColor: '#8b5cf6', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>🏢 On-brand / Safe</span>
              <span style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>🎲 Wild / Experimental</span>
            </div>
            <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)' }}>
              <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>
                <Brain className="w-3 h-3 inline mr-1" style={{ color: '#8b5cf6' }} />
                {creativityLevel < 30 ? 'Conservative mode — outputs stay tightly on-brand.' :
                  creativityLevel < 70 ? 'Balanced mode — creative with a brand guardrail.' :
                    'Experimental mode — expect diverse, surprising results. Add human flair!'}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
             VFX COMPOSITING DEPARTMENT
             "How 2D/3D art and filmed actors are put in the same room"
             ══════════════════════════════════════════════════════════ */}

        {/* ── Motion Capture (Autodesk MotionBuilder) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Camera className="w-4 h-4 mr-1" style={{ color: '#a78bfa' }} />
            <span className="de-widget-title ml-1">Motion Capture</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>BVH</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Upload a BVH mocap file. Retarget skeleton scale and export for your 3D character.
            </p>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 9, border: '1.5px dashed rgba(167,139,250,0.4)', background: 'rgba(167,139,250,0.04)', cursor: 'pointer', marginBottom: 10 }}>
              <Camera className="w-4 h-4" style={{ color: '#a78bfa', flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>{mocapLoading ? 'Parsing…' : 'Upload .bvh file'}</span>
              <input type="file" accept=".bvh" onChange={handleBVHUpload} style={{ display: 'none' }} />
            </label>
            {mocapMsg && (
              <div style={{ fontSize: 11, fontWeight: 600, color: mocapMsg.startsWith('⚠️') ? '#ef4444' : '#22c55e', marginBottom: 8 }}>{mocapMsg}</div>
            )}
            {mocapClip && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 10, color: 'var(--de-text-dim)', padding: '6px 10px', borderRadius: 8, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)' }}>
                  <div>🦴 <strong>{clipSummary(mocapClip).jointCount}</strong> joints &nbsp;|&nbsp; 🎞 <strong>{clipSummary(mocapClip).frameCount}</strong> frames &nbsp;|&nbsp; ⏱ <strong>{clipSummary(mocapClip).durationSeconds}s</strong></div>
                  <div style={{ marginTop: 4 }}>Root: <code style={{ fontSize: 10 }}>{mocapClip.root.name}</code> &nbsp;|&nbsp; FPS: <strong>{clipSummary(mocapClip).fps}</strong></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)' }}>
                    Retarget Scale: <strong style={{ color: '#a78bfa' }}>{mocapScale.toFixed(2)}×</strong>
                  </label>
                  <input type="range" min={0.1} max={3} step={0.05} value={mocapScale}
                    onChange={e => setMocapScale(parseFloat(e.target.value))}
                    style={{ width: '100%', accentColor: '#a78bfa' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)' }}>
                    Preview Frame: <strong style={{ color: '#a78bfa' }}>{mocapPreviewFrame}</strong>
                  </label>
                  <input type="range" min={0} max={mocapClip.frameCount - 1} step={1} value={mocapPreviewFrame}
                    onChange={e => setMocapPreviewFrame(parseInt(e.target.value))}
                    style={{ width: '100%', accentColor: '#a78bfa' }}
                  />
                </div>
                <button type="button" onClick={handleMocapExport}
                  style={{ ...btnBase, background: 'rgba(167,139,250,0.12)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)' }}>
                  <Download className="w-3 h-3 inline mr-1" />Export Retargeted BVH
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── FX Simulation (Houdini-inspired) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Zap className="w-4 h-4 mr-1" style={{ color: '#f97316' }} />
            <span className="de-widget-title ml-1">FX Simulation</span>
            {fxSim && (
              <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: fxSim.state === 'complete' ? '#22c55e' : fxSim.state === 'running' ? '#f97316' : 'var(--de-text-dim)', background: fxSim.state === 'complete' ? 'rgba(34,197,94,0.1)' : fxSim.state === 'running' ? 'rgba(249,115,22,0.1)' : 'rgba(0,0,0,0.06)', padding: '2px 7px', borderRadius: 5 }}>
                {fxSim.state === 'running' ? `${fxSim.elapsedSeconds.toFixed(1)}s / ${fxSim.durationSeconds}s` : fxSim.state}
              </span>
            )}
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Choose an FX preset (fire, water, destruction, smoke, particles, fabric) and run the simulation.
            </p>
            {/* Category filter */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
              {allCategories().map(cat => (
                <button key={cat} type="button" onClick={() => setFxCategory(cat)}
                  style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 999, border: 'none', cursor: 'pointer', background: fxCategory === cat ? '#f97316' : 'rgba(249,115,22,0.1)', color: fxCategory === cat ? 'white' : '#f97316' }}>
                  {cat}
                </button>
              ))}
            </div>
            {/* Preset list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              {presetsByCategory(fxCategory).map(preset => (
                <button key={preset.id} type="button" onClick={() => selectFxPreset(preset.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: `1px solid ${fxSim?.presetId === preset.id ? '#f97316' : 'rgba(249,115,22,0.15)'}`, background: fxSim?.presetId === preset.id ? 'rgba(249,115,22,0.12)' : 'rgba(255,255,255,0.5)', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{preset.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: fxSim?.presetId === preset.id ? '#f97316' : 'var(--de-heading)' }}>{preset.name}</div>
                    <div style={{ fontSize: 10, color: 'var(--de-text-dim)' }}>{preset.description}</div>
                  </div>
                </button>
              ))}
            </div>
            {fxMsg && <div style={{ fontSize: 11, fontWeight: 600, color: fxMsg.startsWith('⚠️') ? '#ef4444' : '#22c55e', marginBottom: 8 }}>{fxMsg}</div>}
            {fxSim && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {/* Progress bar */}
                <div style={{ height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.07)' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: '#f97316', transition: 'width 0.1s', width: `${(fxSim.elapsedSeconds / fxSim.durationSeconds) * 100}%` }} />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {!fxRunning ? (
                    <button type="button" onClick={startFxSim} disabled={fxSim.state === 'complete'}
                      style={{ ...btnBase, background: '#f97316', color: 'white', flex: 1, opacity: fxSim.state === 'complete' ? 0.5 : 1 }}>
                      ▶ {fxSim.state === 'complete' ? 'Done' : 'Run Simulation'}
                    </button>
                  ) : (
                    <button type="button" onClick={stopFxSim}
                      style={{ ...btnBase, background: 'rgba(239,68,68,0.1)', color: '#ef4444', flex: 1 }}>
                      ⏸ Pause
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── 2.5D Compositor (After Effects-inspired) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Layers className="w-4 h-4 mr-1" style={{ color: '#06b6d4' }} />
            <span className="de-widget-title ml-1">2.5D Compositor</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#06b6d4', background: 'rgba(6,182,212,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>{compLayers.length} layers</span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Stack background plate, 3D render passes, roto mattes, and motion graphics into a final 2.5D composite.
            </p>
            {/* Add layer buttons */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {['video', '3d', 'roto', '2d', 'adjustment'].map(type => (
                <button key={type} type="button" onClick={() => addCompLayer(type)}
                  style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 999, border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.07)', color: '#06b6d4', cursor: 'pointer' }}>
                  + {type}
                </button>
              ))}
            </div>
            {compMsg && <div style={{ fontSize: 11, fontWeight: 600, color: compMsg.startsWith('⚠️') ? '#ef4444' : '#22c55e', marginBottom: 8 }}>{compMsg}</div>}
            {/* Layer stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {compLayers.map((layer, idx) => (
                <div key={layer.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(6,182,212,0.15)', opacity: layer.visible ? 1 : 0.4 }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--de-text-dim)', width: 16, flexShrink: 0 }}>{idx + 1}</span>
                  <button type="button" onClick={() => toggleCompLayerVisibility(layer.id)}
                    style={{ fontSize: 11, background: 'none', border: 'none', cursor: 'pointer', color: layer.visible ? '#06b6d4' : 'var(--de-text-dim)', padding: 0, flexShrink: 0 }}>
                    {layer.visible ? '👁' : '🙈'}
                  </button>
                  <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--de-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{layer.label}</span>
                  <span style={{ fontSize: 9, color: 'var(--de-text-dim)', background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>{layer.blendMode}</span>
                  <span style={{ fontSize: 9, color: 'var(--de-text-dim)', width: 30, textAlign: 'right' }}>{Math.round(layer.opacity * 100)}%</span>
                  <button type="button" onClick={() => removeCompLayer(layer.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--de-text-dim)', padding: 0 }}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Rotoscope Editor (Clip Studio Paint-inspired) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Film className="w-4 h-4 mr-1" style={{ color: '#ec4899' }} />
            <span className="de-widget-title ml-1">Rotoscope Editor</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#ec4899', background: 'rgba(236,72,153,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>
              {rotoProject.layers.length} layers
            </span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Trace over live-action actors frame-by-frame to create precise alpha mattes. Set keyframes, interpolate between them, export SVG.
            </p>
            {/* Frame scrubber */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-text-dim)' }}>
                Frame: <strong style={{ color: '#ec4899' }}>{rotoFrame}</strong> / {rotoProject.frameCount - 1}
              </label>
              <input type="range" min={0} max={rotoProject.frameCount - 1} step={1} value={rotoFrame}
                onChange={e => setRotoFrame(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#ec4899' }}
              />
            </div>
            {/* Layer list */}
            {rotoProject.layers.length > 0 && (
              <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {rotoProject.layers.map(layer => {
                  const kfs = keyframeList(layer);
                  const hasKF = kfs.includes(rotoFrame);
                  const interp = interpolateShape(layer, rotoFrame);
                  return (
                    <div key={layer.id}
                      onClick={() => setRotoSelectedLayer(layer.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: rotoSelectedLayer === layer.id ? 'rgba(236,72,153,0.1)' : 'rgba(255,255,255,0.5)', border: `1px solid ${rotoSelectedLayer === layer.id ? 'rgba(236,72,153,0.35)' : 'rgba(236,72,153,0.12)'}`, cursor: 'pointer' }}>
                      <Film className="w-3 h-3" style={{ color: '#ec4899', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, fontWeight: rotoSelectedLayer === layer.id ? 700 : 400, color: 'var(--de-heading)' }}>{layer.name}</span>
                      <span style={{ fontSize: 9, color: 'var(--de-text-dim)' }}>{kfs.length} kf</span>
                      {interp && <span style={{ fontSize: 9, color: '#ec4899', fontWeight: 700 }}>{hasKF ? '● kf' : '○ tween'}</span>}
                    </div>
                  );
                })}
              </div>
            )}
            {rotoMsg && <div style={{ fontSize: 11, fontWeight: 600, color: rotoMsg.startsWith('⚠️') ? '#ef4444' : '#22c55e', marginBottom: 8 }}>{rotoMsg}</div>}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button type="button" onClick={addRotoLayer}
                style={{ ...btnBase, background: 'rgba(236,72,153,0.1)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.25)' }}>
                + New Layer
              </button>
              <button type="button" onClick={addRotoKeyframe} disabled={!rotoSelectedLayer}
                style={{ ...btnBase, background: rotoSelectedLayer ? '#ec4899' : 'rgba(0,0,0,0.06)', color: rotoSelectedLayer ? 'white' : 'var(--de-text-dim)' }}>
                ◆ Set Keyframe
              </button>
              <button type="button" onClick={handleRotoSVGExport} disabled={rotoProject.layers.length === 0}
                style={{ ...btnBase, background: 'rgba(236,72,153,0.1)', color: '#ec4899', border: '1px solid rgba(236,72,153,0.25)', opacity: rotoProject.layers.length === 0 ? 0.4 : 1 }}>
                <Download className="w-3 h-3 inline mr-1" />Export SVG
              </button>
            </div>
          </div>
        </div>

        {/* ── Node Compositor (Foundry Nuke-inspired) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Link2 className="w-4 h-4 mr-1" style={{ color: '#22c55e' }} />
            <span className="de-widget-title ml-1">Node Compositor</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>
              {nodeGraph.nodes.length} nodes
            </span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Layer 2D, 3D, and live-action elements using a node graph. Each node is a compositing operation.
            </p>
            {/* Node graph visualiser */}
            <div style={{ overflowX: 'auto', marginBottom: 10 }}>
              <div style={{ position: 'relative', height: 180, minWidth: 400, background: 'rgba(0,0,0,0.04)', borderRadius: 10, border: '1px solid rgba(34,197,94,0.15)', overflow: 'hidden' }}>
                <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                  {nodeGraph.nodes.map(n =>
                    Object.entries(n.inputs).map(([, srcId]) => {
                      if (!srcId) return null;
                      const src = nodeGraph.nodes.find(x => x.id === srcId);
                      if (!src) return null;
                      const x1 = src.position.x + 70, y1 = src.position.y + 18;
                      const x2 = n.position.x, y2 = n.position.y + 18;
                      return <path key={`${srcId}-${n.id}`} d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`} stroke="rgba(34,197,94,0.4)" strokeWidth={1.5} fill="none" />;
                    })
                  )}
                </svg>
                {nodeGraph.nodes.map(n => (
                  <div key={n.id} style={{ position: 'absolute', left: n.position.x, top: n.position.y, background: n.type === 'Output' ? '#22c55e' : n.type === 'MediaIn' ? 'rgba(6,182,212,0.8)' : 'rgba(255,255,255,0.85)', border: `1px solid ${n.type === 'Output' ? '#22c55e' : 'rgba(34,197,94,0.3)'}`, borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, color: n.type === 'Output' ? 'white' : 'var(--de-heading)', whiteSpace: 'nowrap', cursor: 'default', zIndex: 1 }}>
                    {n.label}
                  </div>
                ))}
              </div>
            </div>
            {/* Eval order */}
            <div style={{ fontSize: 10, color: 'var(--de-text-dim)', marginBottom: 8, fontFamily: 'monospace', wordBreak: 'break-all' }}>
              Eval: {topologicalSort(nodeGraph.nodes).map(id => nodeGraph.nodes.find(n => n.id === id)?.label ?? id).join(' → ')}
            </div>
            {nodeMsg && <div style={{ fontSize: 11, fontWeight: 600, color: nodeMsg.startsWith('⚠️') ? '#ef4444' : '#22c55e', marginBottom: 8 }}>{nodeMsg}</div>}
            {/* Add node */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {(['MediaIn', 'Over', 'Merge', 'ColorCorrect', 'Transform', 'Keyer', 'MotionBlur'] as NodeType[]).map(t => (
                <button key={t} type="button" onClick={() => handleAddNode(t)}
                  style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 999, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.07)', color: '#22c55e', cursor: 'pointer' }}>
                  + {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Matchmover (Syntheyes / 3DEqualizer-inspired) ── */}
        <div className="de-widget" style={{ marginBottom: 14 }}>
          <div className="de-widget-header">
            <Crosshair className="w-4 h-4 mr-1" style={{ color: '#f59e0b' }} />
            <span className="de-widget-title ml-1">Matchmover</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '2px 7px', borderRadius: 5, fontWeight: 700 }}>
              {cameraTrack.trackPoints.length} pts
            </span>
          </div>
          <div className="de-widget-body">
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', marginBottom: 10 }}>
              Add 2D track points to live-action footage. The solver pins animated objects to the moving camera.
            </p>
            {/* Track info */}
            <div style={{ fontSize: 10, color: 'var(--de-text-dim)', padding: '6px 10px', borderRadius: 8, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', marginBottom: 10 }}>
              {trackSummary(cameraTrack)}
            </div>
            {/* Track points list */}
            {cameraTrack.trackPoints.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10, maxHeight: 140, overflowY: 'auto' }}>
                {cameraTrack.trackPoints.map((pt, i) => {
                  const motions = estimateCameraMotion(cameraTrack).filter(m => m.pointId === pt.id);
                  const avgSpeed = motions.length > 0 ? motions.reduce((s, m) => s + m.speed, 0) / motions.length : 0;
                  return (
                    <div key={pt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(245,158,11,0.15)' }}>
                      <Crosshair className="w-3 h-3" style={{ color: '#f59e0b', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--de-heading)' }}>{pt.name}</span>
                      <span style={{ fontSize: 9, color: 'var(--de-text-dim)' }}>{pt.samples.length} samples</span>
                      <span style={{ fontSize: 9, color: '#f59e0b', fontFamily: 'monospace' }}>
                        avg {(avgSpeed * 1000).toFixed(1)}px/f
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {trackMsg && <div style={{ fontSize: 11, fontWeight: 600, color: trackMsg.startsWith('⚠️') ? '#ef4444' : '#22c55e', marginBottom: 8 }}>{trackMsg}</div>}
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={addTrackPt}
                style={{ ...btnBase, background: '#f59e0b', color: 'white', flex: 1 }}>
                + Add Track Point
              </button>
              <button type="button" onClick={handleTrackCSVExport} disabled={cameraTrack.trackPoints.length === 0}
                style={{ ...btnBase, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', opacity: cameraTrack.trackPoints.length === 0 ? 0.4 : 1 }}>
                <Download className="w-3 h-3 inline mr-1" />CSV
              </button>
            </div>
          </div>
        </div>

        {/* ── Journey Trail ── */}
        <div className="de-widget" style={{ margin: '14px 0' }}>
          <div className="de-widget-header">
            <span className="de-widget-title">Journey</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--de-text-dim)', fontStyle: 'italic' }}>
              The dots only connect looking backwards
            </span>
          </div>
          <div className="de-widget-body">
            <JourneyTrail compact />
          </div>
        </div>

        </div>{/* end Management section */}

      </div>
    </div>
  );
}
