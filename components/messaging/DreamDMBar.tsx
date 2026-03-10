'use client';

/**
 * DreamDMBar — Pass 2
 *
 * Persistent spatial-divider interaction rail with real messaging capability.
 *
 * Pass 2 upgrades:
 *   - Real inline message send via useMessagingCore (spec §21, §64)
 *   - Universal search with Dr. Eams toggle in Dream Space (spec §31–50, §71)
 *   - Compact conversation list in Dream Space (spec §18, §68)
 *   - Conversation selection + message thread view (spec §4, §24)
 *   - Draft persistence via useDreamDMDraft (spec §9–10, §23)
 *   - Attachment picker (compact) via useMessagingCore (spec §8, §22)
 *   - Unread count badge on bar rail (spec §19, §26)
 *   - Notification-driven conversation open (spec §11–12)
 *   - Dr. Eams mode toggle (spec §41–45, §78)
 *
 * Architecture: Component layer — logic lives in lib/dreamdm/ hooks.
 * Privacy: drafts localStorage-only; messages via RLS-enforced API.
 *
 * Spec: README.md §22 / §29 / docs/dreamdm_messaging_phase2.md
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Bot,
  FileText,
  GripHorizontal,
  Loader2,
  MessageCircle,
  Music,
  Paperclip,
  Search,
  Send,
  X,
} from 'lucide-react';

import { useDreamDMBar, type DreamDMSnapPoint } from '@/lib/daydream/useDreamDMBar';
import { useDreamDMMessages }                    from '@/lib/dreamdm/useDreamDMMessages';
import { useDreamDMDraft }                        from '@/lib/dreamdm/useDreamDMDraft';
import { useDreamSearch, type SearchResult }      from '@/lib/dreamdm/useDreamSearch';
import { useMessagingCore, type MediaType }       from '@/lib/dreamdm/useMessagingCore';
import { useNotifications }                       from '@/lib/dreamdm/useNotifications';
import {
  useDreamDMConversations,
  type DMConversation,
} from '@/lib/dreamdm/useDreamDMConversations';
import type { DMMessage } from '@/lib/dreamdm/useDreamDMMessages';

/** Height of the interaction rail in pixels */
const BAR_H = 48;

const SPRING_TRANSITION = '0.40s cubic-bezier(0.34, 1.56, 0.64, 1)';

const SNAP_LABELS: Record<DreamDMSnapPoint, string> = {
  'surface-focus': 'Surface focus — expand surface space',
  'balanced':      'Balanced — equal split',
  'dream-focus':   'Dream focus — expand dream space',
};

const DEMO_CONVERSATIONS: DMConversation[] = [
  {
    id:        'demo-1',
    otherUser: { id: 'demo-user-1', display_name: 'Dr. Eams', handle: 'dreams', avatar_url: '/dr-eams.jpeg' },
    updatedAt: new Date().toISOString(),
  },
];

const DEMO_MESSAGES: DMMessage[] = [
  { id: '1', sender_id: 'demo-user-1', content: 'Hey! How can I help you today?', created_at: new Date(Date.now() - 60_000).toISOString() },
];

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000)    return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return `${Math.floor(diff / 86_400_000)}d`;
}

function AvatarChip({ name, url, size = 28 }: { name: string; url?: string | null; size?: number }) {
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, width: size, height: size }}
      />
    );
  }
  return (
    <div
      style={{
        width: size, height: size, borderRadius: '50%',
        background: 'rgba(42,138,184,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: size * 0.4, fontWeight: 700, color: 'var(--de-accent)',
      }}
    >
      {(name || 'U')[0].toUpperCase()}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DreamDMBar() {
  const {
    snapPoint, setSnapPoint, barTopPct, isDragging,
    draft: quickDraft, setDraft: setQuickDraft,
    containerRef, handleDragStart, handleDragMove, handleDragEnd,
  } = useDreamDMBar();

  const [mounted,        setMounted]        = useState(false);
  const [composeFocused, setComposeFocused] = useState(false);
  const [userId,         setUserId]         = useState('');
  const [selectedConv,   setSelectedConv]   = useState<DMConversation | null>(null);

  const { conversations, reload: reloadConvs } = useDreamDMConversations(userId, DEMO_CONVERSATIONS);
  const { unreadCount, markAllRead }            = useNotifications();

  const isDemoConv = selectedConv?.id.startsWith('demo-') ?? false;
  const { messages, isLoading: msgsLoading, addOptimistic, replaceOptimistic, removeOptimistic } =
    useDreamDMMessages(selectedConv?.id ?? null, isDemoConv, DEMO_MESSAGES);

  const { draft, saveDraft, clearDraft, draftRestored } =
    useDreamDMDraft(selectedConv?.id ?? null);

  const [messageBody,    setMessageBody]    = useState('');
  const [selectedFile,   setSelectedFile]   = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const msgsEndRef   = useRef<HTMLDivElement>(null);

  const { isSending, sendError, validateFile, getFileType, sendMessage, clearSendError } =
    useMessagingCore(addOptimistic, replaceOptimistic, removeOptimistic);

  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch,  setShowSearch]  = useState(false);
  const { results: searchResults, isSearching, drEamsMode, toggleDrEams, clearResults } =
    useDreamSearch(searchQuery);

  // Restore draft on conversation change
  useEffect(() => {
    setMessageBody(draft?.body ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConv?.id]);

  // Scroll to bottom
  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Resolve userId
  useEffect(() => {
    setMounted(true);
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient().auth.getUser().then(({ data }) => {
        if (data.user) { setUserId(data.user.id); reloadConvs(); }
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quick-compose send
  const handleQuickSend = useCallback(async () => {
    if (!quickDraft.trim()) return;
    if (selectedConv) {
      await sendMessage({ conversationId: selectedConv.id, recipientId: selectedConv.otherUser.id, content: quickDraft.trim(), userId });
      clearDraft(selectedConv.id);
      setQuickDraft('');
    } else {
      window.location.href = `/messages?compose=${encodeURIComponent(quickDraft.trim())}`;
    }
  }, [quickDraft, selectedConv, sendMessage, clearDraft, setQuickDraft, userId]);

  // Panel compose send
  const handlePanelSend = useCallback(async () => {
    if (!selectedConv) return;
    const result = await sendMessage({
      conversationId: selectedConv.id, recipientId: selectedConv.otherUser.id,
      content: messageBody.trim(), file: selectedFile, userId,
    });
    if (result) {
      clearDraft(selectedConv.id);
      setMessageBody('');
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      setSelectedFile(null);
      setFilePreviewUrl(null);
    }
  }, [selectedConv, sendMessage, messageBody, selectedFile, filePreviewUrl, clearDraft, userId]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateFile(file);
    if (err) { alert(err); return; }
    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
  };

  const removeFile = () => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSearchResultSelect = useCallback((result: SearchResult) => {
    setSearchQuery('');
    clearResults();
    setShowSearch(false);
    if (result.type === 'conversation' && result.targetId) {
      const conv = conversations.find((c) => c.id === result.targetId);
      if (conv) { setSelectedConv(conv); markAllRead(); }
      else window.location.href = result.href ?? '/messages';
    } else if (result.type === 'person' && result.targetId) {
      window.location.href = `/messages/new?recipient=${result.targetId}`;
    } else if (result.href) {
      window.location.href = result.href;
    }
  }, [conversations, clearResults, markAllRead]);

  if (!mounted) return null;

  const springTransition = isDragging ? 'none' : SPRING_TRANSITION;
  const isExpanded = snapPoint !== 'surface-focus';

  return (
    <div
      ref={containerRef}
      aria-label="DreamDM Bar"
      style={{ position: 'fixed', inset: 0, zIndex: 20, pointerEvents: 'none', overflow: 'hidden' }}
    >
      {/* ── Dream Space ─────────────────────────────────────────────────────── */}
      <div
        aria-label="Dream Space"
        style={{
          position: 'absolute', top: `calc(${barTopPct * 100}% + ${BAR_H}px)`,
          left: 0, right: 0, bottom: 0,
          background: 'linear-gradient(180deg, rgba(220,232,248,0.97) 0%, rgba(200,218,242,0.99) 100%)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          overflowY: 'auto', overflowX: 'hidden', pointerEvents: 'auto', transition: springTransition,
        }}
      >
        {isExpanded ? (
          <DreamSpaceMessaging
            conversations={conversations} selectedConv={selectedConv}
            onSelectConv={(c) => { setSelectedConv(c); markAllRead(); }}
            messages={messages} msgsLoading={msgsLoading} msgsEndRef={msgsEndRef}
            userId={userId} messageBody={messageBody}
            onMessageBodyChange={(v) => { setMessageBody(v); saveDraft({ subject: '', body: v }); }}
            draftRestored={draftRestored} selectedFile={selectedFile} filePreviewUrl={filePreviewUrl}
            fileInputRef={fileInputRef} onFileSelect={handleFileSelect} onRemoveFile={removeFile}
            getFileType={getFileType} isSending={isSending} sendError={sendError}
            onClearSendError={clearSendError} onPanelSend={handlePanelSend}
            searchQuery={searchQuery}
            onSearchQueryChange={(v) => { setSearchQuery(v); setShowSearch(true); }}
            showSearch={showSearch} onShowSearch={setShowSearch}
            searchResults={searchResults} isSearching={isSearching}
            drEamsMode={drEamsMode} onToggleDrEams={toggleDrEams}
            onSearchResultSelect={handleSearchResultSelect}
          />
        ) : (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px', gap: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Dream Space</span>
            <button
              type="button" onClick={() => setSnapPoint('balanced')}
              aria-label="Expand Dream Space"
              style={{ fontSize: 11, color: 'var(--de-blue)', background: 'transparent', border: '1px solid rgba(42,138,184,0.35)', borderRadius: 9999, padding: '2px 10px', cursor: 'pointer' }}
            >
              Expand
            </button>
          </div>
        )}
      </div>

      {/* ── Bar rail ────────────────────────────────────────────────────────── */}
      <div
        role="separator" aria-label="DreamDM Bar — drag to resize"
        onPointerDown={handleDragStart} onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd} onPointerCancel={handleDragEnd}
        style={{
          position: 'absolute', top: `${barTopPct * 100}%`, left: 0, right: 0, height: BAR_H,
          display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px',
          cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none', userSelect: 'none',
          pointerEvents: 'auto', zIndex: 1, transition: springTransition,
          background: 'linear-gradient(135deg, rgba(200,152,26,0.16) 0%, rgba(42,138,184,0.14) 100%)',
          backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
          borderTop: '1.5px solid rgba(200,152,26,0.38)', borderBottom: '1px solid rgba(42,138,184,0.22)',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.07)',
        }}
      >
        <GripHorizontal size={16} aria-hidden style={{ color: 'var(--de-gold)', opacity: 0.75, flexShrink: 0 }} />

        {/* DreamDM icon + unread badge */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <MessageCircle size={17} aria-hidden style={{ color: 'var(--de-blue)' }} />
          {unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} unread`}
              style={{
                position: 'absolute', top: -6, right: -6,
                background: 'var(--de-gold)', color: 'white',
                borderRadius: 9999, fontSize: 9, fontWeight: 700,
                lineHeight: 1, padding: '2px 4px', minWidth: 14, textAlign: 'center',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>

        {/* Quick compose */}
        <input
          type="text" value={quickDraft}
          onChange={(e) => setQuickDraft(e.target.value)}
          onFocus={() => setComposeFocused(true)} onBlur={() => setComposeFocused(false)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleQuickSend(); } }}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder={selectedConv
            ? `Message ${selectedConv.otherUser.display_name || selectedConv.otherUser.handle}…`
            : 'DreamDM…'}
          aria-label="Quick compose"
          style={{
            flex: 1, minWidth: 0,
            background: composeFocused ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.40)',
            border: composeFocused ? '1.5px solid rgba(200,152,26,0.55)' : '1px solid rgba(160,195,240,0.45)',
            borderRadius: 9999, padding: '5px 12px', fontSize: 13,
            color: 'var(--de-text)', outline: 'none', cursor: 'text',
            transition: 'background 0.18s ease, border 0.18s ease',
          }}
        />

        {/* Send */}
        {quickDraft.trim() && (
          <button
            type="button" onClick={handleQuickSend} onPointerDown={(e) => e.stopPropagation()}
            disabled={isSending} aria-label="Send DreamDM"
            style={{
              background: 'linear-gradient(135deg, var(--de-gold) 0%, var(--de-blue) 100%)',
              border: 'none', borderRadius: '50%', width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: isSending ? 'not-allowed' : 'pointer', flexShrink: 0, color: 'white',
              opacity: isSending ? 0.6 : 1,
            }}
          >
            {isSending ? <Loader2 size={14} aria-hidden style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} aria-hidden />}
          </button>
        )}

        {/* Snap dots */}
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }} onPointerDown={(e) => e.stopPropagation()}>
          {(['surface-focus', 'balanced', 'dream-focus'] as const).map((snap) => (
            <button
              key={snap} type="button" onClick={() => setSnapPoint(snap)}
              aria-label={SNAP_LABELS[snap]} aria-pressed={snapPoint === snap}
              style={{
                width: 8, height: 8, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: snapPoint === snap ? 'var(--de-gold)' : 'rgba(42,138,184,0.35)',
                transition: 'background 0.18s', padding: 0,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DreamSpaceMessaging
// ─────────────────────────────────────────────────────────────────────────────

interface DreamSpaceMessagingProps {
  conversations:       DMConversation[];
  selectedConv:        DMConversation | null;
  onSelectConv:        (c: DMConversation) => void;
  messages:            DMMessage[];
  msgsLoading:         boolean;
  msgsEndRef:          React.RefObject<HTMLDivElement | null>;
  userId:              string;
  messageBody:         string;
  onMessageBodyChange: (v: string) => void;
  draftRestored:       boolean;
  selectedFile:        File | null;
  filePreviewUrl:      string | null;
  fileInputRef:        React.RefObject<HTMLInputElement | null>;
  onFileSelect:        (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile:        () => void;
  getFileType:         (f: File) => MediaType;
  isSending:           boolean;
  sendError:           string | null;
  onClearSendError:    () => void;
  onPanelSend:         () => void;
  searchQuery:         string;
  onSearchQueryChange: (v: string) => void;
  showSearch:          boolean;
  onShowSearch:        (v: boolean) => void;
  searchResults:       SearchResult[];
  isSearching:         boolean;
  drEamsMode:          boolean;
  onToggleDrEams:      () => void;
  onSearchResultSelect:(r: SearchResult) => void;
}

function DreamSpaceMessaging({
  conversations, selectedConv, onSelectConv,
  messages, msgsLoading, msgsEndRef, userId,
  messageBody, onMessageBodyChange, draftRestored,
  selectedFile, filePreviewUrl, fileInputRef, onFileSelect, onRemoveFile, getFileType,
  isSending, sendError, onClearSendError, onPanelSend,
  searchQuery, onSearchQueryChange, showSearch, onShowSearch,
  searchResults, isSearching, drEamsMode, onToggleDrEams, onSearchResultSelect,
}: DreamSpaceMessagingProps) {
  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>

      {/* ── Compact conversation list ──────────────────────────────────────── */}
      <div style={{ width: 200, flexShrink: 0, borderRight: '1px solid rgba(160,195,240,0.22)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {/* Search + Dr. Eams toggle */}
        <div style={{ padding: '10px 10px 6px', borderBottom: '1px solid rgba(160,195,240,0.15)' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Search size={12} aria-hidden style={{ color: 'var(--de-text-dim)', position: 'absolute', left: 8, pointerEvents: 'none', zIndex: 1 }} />
            <input
              type="text" value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              onFocus={() => onShowSearch(true)}
              placeholder={drEamsMode ? 'Dr. Eams…' : 'Search…'}
              aria-label={drEamsMode ? 'Dr. Eams search' : 'Universal search'}
              style={{
                flex: 1, paddingLeft: 26, paddingRight: 8, paddingTop: 5, paddingBottom: 5,
                borderRadius: 9999,
                border: drEamsMode ? '1.5px solid rgba(200,152,26,0.65)' : '1px solid rgba(160,195,240,0.45)',
                background: drEamsMode ? 'rgba(255,245,215,0.75)' : 'rgba(255,255,255,0.45)',
                fontSize: 11, color: 'var(--de-text)', outline: 'none',
              }}
            />
            <button
              type="button" onClick={onToggleDrEams}
              aria-pressed={drEamsMode}
              aria-label={drEamsMode ? 'Dr. Eams mode active — click to switch to standard search' : 'Switch to Dr. Eams mode'}
              title={drEamsMode ? 'Dr. Eams ON' : 'Dr. Eams OFF'}
              style={{
                flexShrink: 0, background: drEamsMode ? 'var(--de-gold)' : 'rgba(160,195,240,0.18)',
                border: 'none', borderRadius: '50%', width: 24, height: 24,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: drEamsMode ? 'white' : 'var(--de-text-dim)',
                transition: 'background 0.18s, color 0.18s',
              }}
            >
              <Bot size={12} aria-hidden />
            </button>
          </div>
          {drEamsMode && (
            <p style={{ fontSize: 9, color: 'var(--de-gold)', marginTop: 4, textAlign: 'center' }}>
              Dr. Eams mode
            </p>
          )}
        </div>

        {/* Search suggestions */}
        {showSearch && (searchQuery.trim() || isSearching) && (
          <div role="listbox" aria-label="Search suggestions" style={{ background: 'rgba(255,255,255,0.96)', borderBottom: '1px solid rgba(160,195,240,0.2)', maxHeight: 180, overflowY: 'auto' }}>
            {isSearching && (
              <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Loader2 size={11} aria-hidden style={{ color: 'var(--de-text-dim)' }} />
                <span style={{ fontSize: 11, color: 'var(--de-text-dim)' }}>Searching…</span>
              </div>
            )}
            {!isSearching && searchResults.length === 0 && searchQuery.trim() && (
              <p style={{ padding: '8px 12px', fontSize: 11, color: 'var(--de-text-dim)' }}>No results</p>
            )}
            {searchResults.map((result) => (
              <button
                key={`${result.type}-${result.id}`}
                role="option" aria-selected={false} type="button"
                onClick={() => onSearchResultSelect(result)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 12px', background: 'transparent', border: 'none',
                  cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid rgba(160,195,240,0.1)',
                }}
              >
                <AvatarChip name={result.label} url={result.avatarUrl} size={22} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{result.label}</p>
                  {result.sublabel && (
                    <p style={{ fontSize: 10, color: 'var(--de-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{result.sublabel}</p>
                  )}
                </div>
                <span style={{ fontSize: 9, color: 'var(--de-text-dim)', opacity: 0.7, flexShrink: 0 }}>{result.type}</span>
              </button>
            ))}
          </div>
        )}

        {/* Conversation list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.map((conv) => (
            <button
              key={conv.id} type="button" onClick={() => onSelectConv(conv)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '9px 10px',
                background: selectedConv?.id === conv.id ? 'rgba(42,138,184,0.10)' : 'transparent',
                border: 'none', borderBottom: '1px solid rgba(160,195,240,0.10)',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <AvatarChip name={conv.otherUser.display_name || conv.otherUser.handle || 'U'} url={conv.otherUser.avatar_url} size={28} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--de-heading)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                  {conv.otherUser.display_name || conv.otherUser.handle || 'Unknown'}
                </p>
                {conv.lastMessage && (
                  <p style={{ fontSize: 10, color: 'var(--de-text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>{conv.lastMessage}</p>
                )}
              </div>
              <span style={{ fontSize: 9, color: 'var(--de-text-dim)', flexShrink: 0 }}>{relTime(conv.updatedAt)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Message panel ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {selectedConv ? (
          <>
            {/* Header */}
            <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(160,195,240,0.18)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <AvatarChip name={selectedConv.otherUser.display_name || selectedConv.otherUser.handle || 'U'} url={selectedConv.otherUser.avatar_url} size={26} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--de-heading)', margin: 0 }}>{selectedConv.otherUser.display_name || selectedConv.otherUser.handle}</p>
                {selectedConv.otherUser.handle && <p style={{ fontSize: 10, color: 'var(--de-text-dim)', margin: 0 }}>@{selectedConv.otherUser.handle}</p>}
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 0' }}>
              {msgsLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 60 }}>
                  <Loader2 size={16} aria-hidden style={{ color: 'var(--de-text-dim)' }} />
                </div>
              ) : messages.length === 0 ? (
                <p style={{ fontSize: 11, color: 'var(--de-text-dim)', textAlign: 'center', marginTop: 20 }}>No messages yet — say hello!</p>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_id === userId;
                  return (
                    <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', marginBottom: 8 }}>
                      <div style={{
                        maxWidth: '80%', borderRadius: 12, padding: '6px 10px', fontSize: 11,
                        ...(isMe
                          ? { background: 'var(--de-heading)', color: 'white', borderBottomRightRadius: 3 }
                          : { background: 'rgba(42,138,184,0.10)', color: 'var(--de-text)', borderBottomLeftRadius: 3, border: '1px solid rgba(160,195,240,0.25)' }),
                      }}>
                        {msg.media_url && msg.media_type === 'image' && (
                          <Image src={msg.media_url} alt="Shared image" width={160} height={100} style={{ borderRadius: 8, marginBottom: 4 }} />
                        )}
                        {msg.content && <p style={{ margin: 0 }}>{msg.content}</p>}
                        <p style={{ margin: 0, fontSize: 9, opacity: 0.55, marginTop: 2 }}>{relTime(msg.created_at)}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={msgsEndRef} />
            </div>

            {/* Compose */}
            <form onSubmit={(e) => { e.preventDefault(); onPanelSend(); }} style={{ padding: '8px 10px', borderTop: '1px solid rgba(160,195,240,0.18)', flexShrink: 0 }}>
              {sendError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <p style={{ fontSize: 10, color: '#dc4444', flex: 1, margin: 0 }}>{sendError}</p>
                  <button type="button" onClick={onClearSendError} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc4444', padding: 0 }}><X size={12} /></button>
                </div>
              )}
              {draftRestored && (
                <p style={{ fontSize: 10, color: 'var(--de-text-dim)', marginBottom: 4 }} aria-live="polite">Draft restored</p>
              )}
              {selectedFile && filePreviewUrl && (
                <div style={{ marginBottom: 8, position: 'relative', display: 'inline-block' }}>
                  <div style={{ background: 'rgba(160,195,240,0.15)', borderRadius: 8, padding: 6 }}>
                    {getFileType(selectedFile) === 'image' && (
                      <Image src={filePreviewUrl} alt="Preview" width={80} height={60} style={{ borderRadius: 6 }} />
                    )}
                    {(getFileType(selectedFile) === 'audio' || getFileType(selectedFile) === 'file') && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px' }}>
                        {getFileType(selectedFile) === 'audio' ? <Music size={12} style={{ color: 'var(--de-text-dim)' }} /> : <FileText size={12} style={{ color: 'var(--de-text-dim)' }} />}
                        <span style={{ fontSize: 10, color: 'var(--de-text)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</span>
                      </div>
                    )}
                  </div>
                  <button type="button" onClick={onRemoveFile} style={{ position: 'absolute', top: -4, right: -4, background: '#dc4444', border: 'none', borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', padding: 0 }}>
                    <X size={9} />
                  </button>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input ref={fileInputRef} type="file" accept="image/*,video/*,audio/*" onChange={onFileSelect} style={{ display: 'none' }} />
                <button
                  type="button" onClick={() => fileInputRef.current?.click()} disabled={isSending}
                  aria-label="Attach file"
                  style={{ background: 'rgba(160,195,240,0.15)', border: 'none', borderRadius: 8, padding: '5px 7px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: isSending ? 'not-allowed' : 'pointer', color: 'var(--de-text-dim)', flexShrink: 0, opacity: isSending ? 0.5 : 1 }}
                >
                  <Paperclip size={12} aria-hidden />
                </button>
                <input
                  type="text" value={messageBody} onChange={(e) => onMessageBodyChange(e.target.value)}
                  placeholder="Type a message…" aria-label="Message body"
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onPanelSend(); } }}
                  style={{ flex: 1, padding: '5px 10px', borderRadius: 9999, border: '1px solid rgba(160,195,240,0.35)', background: 'rgba(255,255,255,0.55)', fontSize: 11, color: 'var(--de-text)', outline: 'none' }}
                />
                <button
                  type="submit" aria-label="Send message"
                  disabled={(!messageBody.trim() && !selectedFile) || isSending}
                  style={{ background: 'linear-gradient(135deg, var(--de-gold) 0%, var(--de-blue) 100%)', border: 'none', borderRadius: '50%', width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: (!messageBody.trim() && !selectedFile) || isSending ? 'not-allowed' : 'pointer', color: 'white', flexShrink: 0, opacity: (!messageBody.trim() && !selectedFile) || isSending ? 0.5 : 1 }}
                >
                  {isSending ? <Loader2 size={13} aria-hidden /> : <Send size={13} aria-hidden />}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8 }}>
            <MessageCircle size={28} style={{ color: 'var(--de-text-dim)', opacity: 0.3 }} aria-hidden />
            <p style={{ fontSize: 11, color: 'var(--de-text-dim)', margin: 0 }}>Select a conversation</p>
            <a href="/messages" style={{ fontSize: 11, color: 'var(--de-blue)', textDecoration: 'none' }}>Open DreamDMessaging →</a>
          </div>
        )}
      </div>
    </div>
  );
}
