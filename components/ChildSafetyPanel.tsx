'use client';

/**
 * ChildSafetyPanel — Admin UI for the child safety enforcement system.
 *
 * Surfaces:
 *   1. Stats bar     — live incident counts by status
 *   2. Incident queue — paginated list of PENDING_REVIEW incidents
 *   3. Hash upload   — paste or upload known-bad SHA-256 hashes
 *
 * Tabs:
 *   • Queue   — review pending incidents
 *   • Hashes  — manage known-bad hash registry
 *
 * All API calls go to /api/admin/child-safety (admin-only).
 * Incidents contain no raw content — only metadata (severity, surface, rule).
 *
 * Architecture: AXIOM 4 Security by Default — no end-user access; admin only.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Shield, AlertTriangle, CheckCircle, XCircle, Clock,
  RefreshCw, Upload, Trash2, Eye, Hash, ChevronRight,
  AlertCircle, ShieldCheck, Activity,
} from 'lucide-react';

// ============================================================================
// TYPES (mirroring the DB schema — no raw content fields)
// ============================================================================

interface ChildSafetyIncident {
  id: string;
  created_at: string;
  rule_code: 'C22_CSAM' | 'C31_GROOMING';
  category: 'CSAM' | 'GROOMING';
  severity: number;
  confidence: number;
  signal_count: number;
  surface: string;
  status: string;
  ncmec_report_id: string | null;
  ncmec_error: string | null;
  reported_at: string | null;
  hash_match: boolean;
  reported_user_id: string;
  reporter_user_id: string | null;
}

interface IncidentCounts {
  pending: number;
  submitted: number;
  failed: number;
  actioned: number;
  dismissed: number;
}

// ============================================================================
// STATUS CONFIG
// ============================================================================

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: typeof Clock }> = {
  PENDING_REVIEW:           { label: 'Pending Review',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',   Icon: Clock },
  NCMEC_SUBMITTED:          { label: 'NCMEC Submitted',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)',    Icon: CheckCircle },
  NCMEC_SUBMISSION_FAILED:  { label: 'Submit Failed',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    Icon: AlertCircle },
  REVIEWED_ACTIONED:        { label: 'Actioned',         color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   Icon: ShieldCheck },
  REVIEWED_DISMISSED:       { label: 'Dismissed',        color: '#6b7280', bg: 'rgba(107,114,128,0.1)',  Icon: XCircle },
};

const RULE_CONFIG: Record<string, { label: string; color: string; emoji: string }> = {
  C22_CSAM:    { label: 'CSAM',     color: '#dc2626', emoji: '🚨' },
  C31_GROOMING:{ label: 'Grooming', color: '#dc4444', emoji: '⚠️' },
};

// ============================================================================
// HELPERS
// ============================================================================

function severityBar(severity: number) {
  const pct = Math.round(severity * 100);
  const color = severity >= 0.8 ? '#dc2626' : severity >= 0.5 ? '#f59e0b' : '#22c55e';
  return (
    <div className="flex items-center gap-1.5" title={`Severity: ${pct}%`}>
      <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden" style={{ minWidth: 40 }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ============================================================================
// COMPONENT
// ============================================================================

interface ChildSafetyPanelProps {
  isAdmin: boolean;
}

export default function ChildSafetyPanel({ isAdmin }: ChildSafetyPanelProps) {
  const [activeTab, setActiveTab] = useState<'queue' | 'hashes'>('queue');

  // ── Queue state ──────────────────────────────────────────────────────────
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_REVIEW');
  const [incidents, setIncidents] = useState<ChildSafetyIncident[]>([]);
  const [counts, setCounts] = useState<IncidentCounts>({ pending: 0, submitted: 0, failed: 0, actioned: 0, dismissed: 0 });
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  // ── Hash upload state ────────────────────────────────────────────────────
  const [hashInput, setHashInput] = useState('');
  const [hashSource, setHashSource] = useState('NCMEC');
  const [uploadingHashes, setUploadingHashes] = useState(false);
  const [hashUploadResult, setHashUploadResult] = useState<{ inserted: number; submitted: number } | null>(null);
  const [hashError, setHashError] = useState<string | null>(null);

  // ── General error ────────────────────────────────────────────────────────
  const [error, setError] = useState<string | null>(null);

  // ── Fetch incidents ──────────────────────────────────────────────────────
  const fetchIncidents = useCallback(async (status = statusFilter) => {
    setLoadingQueue(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/child-safety?status=${encodeURIComponent(status)}&limit=50`);
      const json = await res.json() as { incidents?: ChildSafetyIncident[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setIncidents(json.incidents ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingQueue(false);
    }
  }, [statusFilter]);

  // ── Fetch counts for all statuses ────────────────────────────────────────
  const fetchCounts = useCallback(async () => {
    const statuses: [string, keyof IncidentCounts][] = [
      ['PENDING_REVIEW', 'pending'],
      ['NCMEC_SUBMITTED', 'submitted'],
      ['NCMEC_SUBMISSION_FAILED', 'failed'],
      ['REVIEWED_ACTIONED', 'actioned'],
      ['REVIEWED_DISMISSED', 'dismissed'],
    ];
    const results = await Promise.allSettled(
      statuses.map(([s]) =>
        fetch(`/api/admin/child-safety?status=${encodeURIComponent(s)}&limit=1`)
          .then((r) => r.json() as Promise<{ count?: number }>)
          .then((d) => d.count ?? 0)
          .catch(() => 0),
      ),
    );
    const newCounts: IncidentCounts = { pending: 0, submitted: 0, failed: 0, actioned: 0, dismissed: 0 };
    results.forEach((r, i) => {
      const key = statuses[i][1];
      newCounts[key] = r.status === 'fulfilled' ? (r.value as number) : 0;
    });
    setCounts(newCounts);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    void fetchIncidents(statusFilter);
    void fetchCounts();
  }, [isAdmin, statusFilter, fetchIncidents, fetchCounts]);

  // ── Review an incident ───────────────────────────────────────────────────
  const reviewIncident = async (incidentId: string, newStatus: string) => {
    setError(null);
    try {
      const res = await fetch('/api/admin/child-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'review',
          incident_id: incidentId,
          status: newStatus,
          notes: reviewNotes.trim() || undefined,
        }),
      });
      const json = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setReviewingId(null);
      setReviewNotes('');
      await fetchIncidents();
      await fetchCounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // ── Upload known-bad hashes ──────────────────────────────────────────────
  const uploadHashes = async () => {
    setHashError(null);
    setHashUploadResult(null);
    const lines = hashInput
      .split(/[\n,\s]+/)
      .map((l) => l.trim().toLowerCase())
      .filter((l) => /^[0-9a-f]{64}$/.test(l));

    if (lines.length === 0) {
      setHashError('No valid SHA-256 hashes found. Each hash must be exactly 64 hex characters.');
      return;
    }

    setUploadingHashes(true);
    try {
      const res = await fetch('/api/admin/child-safety', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_hashes',
          hashes: lines.map((h) => ({ hash_sha256: h, source: hashSource, content_type: 'image' })),
        }),
      });
      const json = await res.json() as { ok?: boolean; inserted_count?: number; submitted_count?: number; error?: string };
      if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
      setHashUploadResult({ inserted: json.inserted_count ?? 0, submitted: json.submitted_count ?? 0 });
      setHashInput('');
    } catch (err) {
      setHashError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploadingHashes(false);
    }
  };

  if (!isAdmin) return null;

  return (
    <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl border-2 border-red-200 dark:border-red-800 p-6">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-red-600 to-orange-500 rounded-lg">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Child Safety</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">TheBoogieMan.Ai · Zero-Tolerance Enforcement</p>
          </div>
        </div>
        <button
          onClick={() => { void fetchIncidents(); void fetchCounts(); }}
          disabled={loadingQueue}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-white/60 dark:bg-slate-800/60 border border-red-200 dark:border-red-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingQueue ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-5 gap-2 mb-5">
        {([
          { label: 'Pending',   value: counts.pending,   color: '#f59e0b', status: 'PENDING_REVIEW' },
          { label: 'Submitted', value: counts.submitted, color: '#22c55e', status: 'NCMEC_SUBMITTED' },
          { label: 'Failed',    value: counts.failed,    color: '#ef4444', status: 'NCMEC_SUBMISSION_FAILED' },
          { label: 'Actioned',  value: counts.actioned,  color: '#3b82f6', status: 'REVIEWED_ACTIONED' },
          { label: 'Dismissed', value: counts.dismissed, color: '#6b7280', status: 'REVIEWED_DISMISSED' },
        ] as const).map(({ label, value, color, status }) => (
          <button
            key={label}
            onClick={() => setStatusFilter(status)}
            className={`p-3 rounded-lg border-2 text-left transition-all hover:opacity-90 ${
              statusFilter === status
                ? 'border-current shadow-sm scale-[1.02]'
                : 'border-transparent bg-white/50 dark:bg-slate-800/50'
            }`}
            style={statusFilter === status ? { borderColor: color, background: `${color}18` } : {}}
          >
            <div className="text-2xl font-bold tabular-nums" style={{ color }}>{value}</div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      {/* ── Tab bar ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-5 bg-white/60 dark:bg-slate-800/60 rounded-lg p-1">
        {([
          { id: 'queue',  label: 'Incident Queue', icon: Activity },
          { id: 'hashes', label: 'Hash Registry',  icon: Hash },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              activeTab === id
                ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ── Global error ─────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center gap-2 mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* ── Tab: Queue ───────────────────────────────────────────────────── */}
      {activeTab === 'queue' && (
        <div>
          {/* Status filter pill */}
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">Showing:</span>
            {(() => {
              const cfg = STATUS_CONFIG[statusFilter];
              if (!cfg) return null;
              const { Icon } = cfg;
              return (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </span>
              );
            })()}
            <span className="text-xs text-slate-400">({incidents.length})</span>
          </div>

          {/* Incident list */}
          {loadingQueue ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              Loading incidents…
            </div>
          ) : incidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <ShieldCheck className="w-10 h-10 mb-3 text-green-400" />
              <p className="font-medium text-slate-600 dark:text-slate-300">No incidents in this queue</p>
              <p className="text-sm mt-1">Zero-tolerance enforcement is active.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incidents.map((inc) => {
                const ruleConf = RULE_CONFIG[inc.rule_code] ?? { label: inc.rule_code, color: '#6b7280', emoji: '❓' };
                const statusConf = STATUS_CONFIG[inc.status] ?? STATUS_CONFIG['PENDING_REVIEW'];
                const StatusIcon = statusConf.Icon;
                const isExpanded = reviewingId === inc.id;

                return (
                  <div
                    key={inc.id}
                    className="bg-white/70 dark:bg-slate-800/70 rounded-lg border border-red-100 dark:border-red-900/40 overflow-hidden"
                  >
                    {/* Row */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        {/* Left: rule + surface + time */}
                        <div className="flex items-start gap-3 min-w-0">
                          <span className="text-lg flex-shrink-0" aria-hidden>{ruleConf.emoji}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold" style={{ color: ruleConf.color }}>
                                {ruleConf.label}
                              </span>
                              <span className="text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                                {inc.surface}
                              </span>
                              {inc.hash_match && (
                                <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 font-semibold">
                                  HASH MATCH
                                </span>
                              )}
                            </div>
                            <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                              <span className="text-xs text-slate-500">{relativeTime(inc.created_at)}</span>
                              <span className="text-xs text-slate-400">Signals: {inc.signal_count}</span>
                              <span className="text-xs text-slate-400">Conf: {Math.round(inc.confidence * 100)}%</span>
                            </div>
                            <div className="mt-2 max-w-48">
                              {severityBar(inc.severity)}
                            </div>
                          </div>
                        </div>

                        {/* Right: status + expand */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-semibold"
                            style={{ background: statusConf.bg, color: statusConf.color }}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusConf.label}
                          </span>
                          {inc.status === 'PENDING_REVIEW' || inc.status === 'NCMEC_SUBMISSION_FAILED' ? (
                            <button
                              onClick={() => setReviewingId(isExpanded ? null : inc.id)}
                              className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                              title="Review incident"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                            </button>
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* NCMEC result */}
                      {inc.ncmec_report_id && (
                        <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                          NCMEC Report ID: <code className="font-mono">{inc.ncmec_report_id}</code>
                        </div>
                      )}
                      {inc.ncmec_error && (
                        <div className="mt-2 text-xs text-red-600 dark:text-red-400 truncate" title={inc.ncmec_error}>
                          ⚠ {inc.ncmec_error}
                        </div>
                      )}
                    </div>

                    {/* Expanded review panel */}
                    {isExpanded && (
                      <div className="border-t border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 p-4">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">Admin Review Notes (optional)</p>
                        <textarea
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          placeholder="Add context or notes for this review decision…"
                          className="w-full text-sm rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                          rows={3}
                        />
                        <div className="flex gap-2 mt-2 flex-wrap">
                          <button
                            onClick={() => reviewIncident(inc.id, 'REVIEWED_ACTIONED')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-all"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Mark Actioned
                          </button>
                          <button
                            onClick={() => reviewIncident(inc.id, 'REVIEWED_DISMISSED')}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium transition-all"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Dismiss (False Positive)
                          </button>
                          {inc.status === 'NCMEC_SUBMISSION_FAILED' && (
                            <button
                              onClick={() => reviewIncident(inc.id, 'NCMEC_SUBMITTED')}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-all"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              Mark as Manually Submitted
                            </button>
                          )}
                          <button
                            onClick={() => { setReviewingId(null); setReviewNotes(''); }}
                            className="ml-auto px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Hash Registry ───────────────────────────────────────────── */}
      {activeTab === 'hashes' && (
        <div>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 mb-5">
            <div className="flex gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <strong>Hash Registry</strong> — Add SHA-256 hashes of known CSAM media from authorised sources
                (NCMEC, IWF, INHOPE). These are cryptographic fingerprints only — no actual content is stored.
                Hashes are matched against every uploaded file before it reaches the database.
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Source selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Hash Source</label>
              <div className="flex gap-2 flex-wrap">
                {['NCMEC', 'IWF', 'INHOPE', 'internal'].map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setHashSource(src)}
                    className={`px-3 py-1.5 text-sm rounded-lg border font-medium transition-all ${
                      hashSource === src
                        ? 'bg-red-600 border-red-600 text-white'
                        : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    {src}
                  </button>
                ))}
              </div>
            </div>

            {/* Hash input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                SHA-256 Hashes
                <span className="ml-2 text-xs text-slate-400 font-normal">One per line, comma, or space-separated. 64 hex characters each.</span>
              </label>
              <textarea
                value={hashInput}
                onChange={(e) => setHashInput(e.target.value)}
                placeholder={'e.g.\na3f2b1c4d5e6... (64 hex chars)\nb7e1d2c3f4a5...'}
                className="w-full font-mono text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white p-3 resize-none focus:outline-none focus:ring-2 focus:ring-red-400"
                rows={6}
              />
              <div className="mt-1 text-xs text-slate-400">
                Valid hashes detected: {
                  hashInput.split(/[\n,\s]+/).filter((l) => /^[0-9a-f]{64}$/i.test(l.trim())).length
                }
              </div>
            </div>

            {/* Upload button */}
            <button
              onClick={uploadHashes}
              disabled={uploadingHashes || !hashInput.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingHashes ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploadingHashes ? 'Uploading…' : 'Add to Registry'}
            </button>

            {/* Result / Error */}
            {hashUploadResult && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-sm text-green-700 dark:text-green-400">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Added {hashUploadResult.inserted} new hash{hashUploadResult.inserted !== 1 ? 'es' : ''} to the registry
                ({hashUploadResult.submitted} submitted, duplicates skipped).
              </div>
            )}
            {hashError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {hashError}
              </div>
            )}

            {/* Clear button */}
            {hashInput.trim() && (
              <button
                type="button"
                onClick={() => { setHashInput(''); setHashError(null); setHashUploadResult(null); }}
                className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear input
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
