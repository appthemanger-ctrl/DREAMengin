'use client';

/**
 * Dreamengin — CodeSpace client component.
 * Receives `isAdminUser` from the server wrapper.
 * The 🔒 admin icon is ONLY rendered when isAdminUser is true.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, RefreshCw, Copy, Check, Download, Upload,
  ExternalLink, Terminal, Lock, Unlock, FolderOpen,
  Folder, FileCode, ChevronRight, ChevronDown, X, LoaderCircle,
  MessageSquare, Bot, Send,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
type Language = 'html' | 'css' | 'js' | 'python';

interface FileNode {
  name: string;
  type: 'file' | 'dir';
  path: string;
  children?: FileNode[];
}

interface AiMessage {
  role: 'user' | 'ai';
  text: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const DEFAULT_CODE = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      font-family: sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 12px;
    }
    h1 { font-size: 2rem; text-align: center; margin: 0; }
    p  { opacity: 0.8; text-align: center; margin: 0; }
  </style>
</head>
<body>
  <h1>✨ Dreamengin CodeSpace</h1>
  <p>Edit the code in the editor below, then press Run & Preview.</p>
</body>
</html>`;

const SNIPPETS: Record<Language, string[]> = {
  html: ['<div></div>', '<p></p>', '<span></span>', 'class=""', 'style=""', '<!-- -->', '<a href="">', '<img src="" alt="">'],
  css:  ['display: flex;', 'margin: 0;', 'padding: 0;', 'color: #', 'background: ', 'border-radius: ', 'font-size: ', 'width: 100%;'],
  js:   ['const ', 'let ', 'function() {}', '() => ', 'console.log()', 'document.querySelector()', 'fetch()', '.then(() => )'],
  python: ['print()', 'def name():', 'for i in range():', 'if :', 'import ', 'return ', 'class Name:', '[]'],
};

const LANG_EXT: Record<Language, string> = { html: 'html', css: 'css', js: 'js', python: 'py' };

// ── Admin session key (per-tab) ──────────────────────────────────────────────
const ADMIN_SESSION_KEY = 'de_admin_code_auth';

// ── Shared styles ────────────────────────────────────────────────────────────
const panelHeaderStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '7px 12px', background: '#1a1a2e', borderBottom: '1px solid #2d2d44', flexShrink: 0,
};
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#a0a0c0', letterSpacing: '0.1em', textTransform: 'uppercase',
};
const iconBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  width: 30, height: 30, borderRadius: 7,
  background: '#2d2d44', border: '1px solid #3d3d5a', color: '#a0a0c0', cursor: 'pointer',
};

// ── Sub-components ───────────────────────────────────────────────────────────

/** Recursive file-tree node */
function TreeNode({ node, onSelect }: { node: FileNode; onSelect: (n: FileNode) => void }) {
  const [open, setOpen] = useState(false);
  if (node.type === 'dir') {
    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            width: '100%', padding: '5px 8px', background: 'none', border: 'none',
            color: '#c0c0e8', fontSize: 13, cursor: 'pointer', borderRadius: 6, textAlign: 'left',
          }}
        >
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          {open ? <FolderOpen size={14} color="#f59e0b" /> : <Folder size={14} color="#f59e0b" />}
          <span style={{ fontWeight: 600 }}>{node.name}</span>
        </button>
        {open && node.children && (
          <div style={{ paddingLeft: 18 }}>
            {node.children.map((child) => (
              <TreeNode key={child.path} node={child} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={() => onSelect(node)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        width: '100%', padding: '5px 8px', background: 'none', border: 'none',
        color: '#a8d8ea', fontSize: 13, cursor: 'pointer', borderRadius: 6,
        textAlign: 'left', wordBreak: 'break-all',
      }}
    >
      <span style={{ width: 13, flexShrink: 0 }} />
      <FileCode size={13} color="#6ee7b7" />
      {node.name}
    </button>
  );
}

// ── AiChatPanel sub-component ─────────────────────────────────────────────────
interface AiChatPanelProps {
  agent: 'idari' | 'boogieman';
  label: string;
  accentColor: string;
  description: string;
  messages: AiMessage[];
  input: string;
  loading: boolean;
  chatEndRef: React.RefObject<HTMLDivElement | null>;
  onInputChange: (v: string) => void;
  onSend: () => void;
}

function AiChatPanel({
  agent, label, accentColor, description, messages,
  input, loading, chatEndRef, onInputChange, onSend,
}: AiChatPanelProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, height: '100%' }}>
      {/* Agent label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Bot size={16} color={accentColor} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#e0e0f0' }}>{label}</div>
          <div style={{ fontSize: 11, color: '#6060a0' }}>{description}</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10,
        minHeight: 120, maxHeight: '38dvh',
        background: '#0d0d1a', border: '1px solid #2d2d44', borderRadius: 10, padding: 12,
        marginBottom: 10,
      }}>
        {messages.length === 0 && (
          <p style={{ color: '#6060a0', fontSize: 13, margin: 'auto', textAlign: 'center' }}>
            Ask {label} anything…
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%', padding: '8px 12px', borderRadius: 10, fontSize: 13, lineHeight: 1.55,
              background: m.role === 'user'
                ? `linear-gradient(135deg, ${accentColor}, #8b5cf6)`
                : '#1e1e38',
              color: m.role === 'user' ? 'white' : '#c0d0f0',
              border: m.role === 'ai' ? '1px solid #2d2d44' : 'none',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6, color: '#6060a0', fontSize: 13 }}>
            <LoaderCircle size={14} className="animate-spin" /> Thinking…
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input row */}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
          placeholder={`Ask ${label}…`}
          disabled={loading}
          style={{
            flex: 1, padding: '10px 12px', borderRadius: 10,
            background: '#1e1e38', border: '1px solid #3d3d5a',
            color: '#e0e0f0', fontSize: 13, outline: 'none',
            opacity: loading ? 0.6 : 1,
          }}
          aria-label={`Message ${label}`}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={loading || !input.trim()}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 42, height: 42, borderRadius: 10, border: 'none', flexShrink: 0,
            background: loading || !input.trim() ? '#2d2d44' : `linear-gradient(135deg, ${accentColor}, #8b5cf6)`,
            color: 'white', cursor: loading || !input.trim() ? 'default' : 'pointer',
          }}
          title={`Send to ${label}`}
          aria-label={`Send to ${label}`}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CodeSpaceClient({ isAdminUser }: { isAdminUser: boolean }) {
  // ── Editor state ──
  const [code, setCode]           = useState(DEFAULT_CODE);
  const [language, setLanguage]   = useState<Language>('html');
  const [previewSrc, setPreview]  = useState(DEFAULT_CODE);
  const [copied, setCopied]       = useState(false);
  const textareaRef               = useRef<HTMLTextAreaElement>(null);

  // ── Admin panel state ──
  const [adminOpen, setAdminOpen]         = useState(false);
  const [adminAuthed, setAdminAuthed]     = useState(false);
  const [pw, setPw]                       = useState('');
  const [pwError, setPwError]             = useState('');
  const [authLoading, setAuthLoading]     = useState(false);
  const [tree, setTree]                   = useState<FileNode[]>([]);
  const [treeLoading, setTreeLoading]     = useState(false);
  const [selectedFile, setSelectedFile]   = useState<{ path: string; content: string } | null>(null);
  const [fileLoading, setFileLoading]     = useState(false);
  const [fileCopied, setFileCopied]       = useState(false);
  const adminPwRef                        = useRef(''); // store pw in ref after auth

  // ── AI chat state ──
  const [adminTab, setAdminTab]             = useState<'files' | 'idari' | 'boogieman'>('files');
  const [idariMessages, setIdariMessages]   = useState<AiMessage[]>([]);
  const [boogieMessages, setBoogieMessages] = useState<AiMessage[]>([]);
  const [idariInput, setIdariInput]         = useState('');
  const [boogieInput, setBoogieInput]       = useState('');
  const [aiLoading, setAiLoading]           = useState(false);
  const chatEndRef                          = useRef<HTMLDivElement>(null);

  // Restore session auth on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (stored) {
      adminPwRef.current = stored;
      setAdminAuthed(true);
    }
  }, []);

  // ── Helpers ──
  const refreshPreview = useCallback(() => setPreview(code), [code]);

  const openInNewTab = useCallback(() => {
    const blob = new Blob([previewSrc], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const tab  = window.open(url, '_blank');
    if (tab) setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [previewSrc]);

  const insertSnippet = useCallback((snippet: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart, e = ta.selectionEnd;
    const next = code.slice(0, s) + snippet + code.slice(e);
    setCode(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + snippet.length, s + snippet.length);
    });
  }, [code]);

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(code); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [code]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `codespace.${LANG_EXT[language]}`;
    a.click(); URL.revokeObjectURL(url);
  }, [code, language]);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { if (typeof ev.target?.result === 'string') setCode(ev.target.result); };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  // ── Admin auth ──
  const handleAdminLogin = useCallback(async () => {
    if (!pw.trim()) { setPwError('Enter a password.'); return; }
    setAuthLoading(true); setPwError('');
    try {
      const res = await fetch('/api/admin/code-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw, action: 'tree' }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error ?? 'Authentication failed.'); return; }
      adminPwRef.current = pw;
      sessionStorage.setItem(ADMIN_SESSION_KEY, pw);
      setAdminAuthed(true);
      setTree(data.tree ?? []);
      setPw('');
    } catch {
      setPwError('Network error. Try again.');
    } finally {
      setAuthLoading(false);
    }
  }, [pw]);

  const loadFileTree = useCallback(async () => {
    if (!adminAuthed) return;
    setTreeLoading(true);
    try {
      const res = await fetch('/api/admin/code-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPwRef.current, action: 'tree' }),
      });
      const data = await res.json();
      if (res.ok) setTree(data.tree ?? []);
    } catch { /* ignore */ } finally { setTreeLoading(false); }
  }, [adminAuthed]);

  // Load tree when panel opens and user is already authed
  useEffect(() => {
    if (adminOpen && adminAuthed && tree.length === 0) loadFileTree();
  }, [adminOpen, adminAuthed, tree.length, loadFileTree]);

  // Scroll AI chat to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [idariMessages, boogieMessages]);

  const handleFileSelect = useCallback(async (node: FileNode) => {
    if (node.type !== 'file') return;
    setFileLoading(true); setSelectedFile(null);
    try {
      const res = await fetch('/api/admin/code-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPwRef.current, action: 'read', filePath: node.path }),
      });
      const data = await res.json();
      if (res.ok) setSelectedFile({ path: node.path, content: data.content });
      else setSelectedFile({ path: node.path, content: `Error: ${data.error}` });
    } catch {
      setSelectedFile({ path: node.path, content: 'Network error.' });
    } finally { setFileLoading(false); }
  }, []);

  const handleFileCopy = useCallback(async () => {
    if (!selectedFile) return;
    try { await navigator.clipboard.writeText(selectedFile.content); } catch { /* ignore */ }
    setFileCopied(true); setTimeout(() => setFileCopied(false), 1800);
  }, [selectedFile]);

  const loadFileIntoEditor = useCallback(() => {
    if (!selectedFile) return;
    setCode(selectedFile.content);
    // Guess language from extension
    const ext = selectedFile.path.split('.').pop() ?? '';
    if (ext === 'css') setLanguage('css');
    else if (ext === 'py') setLanguage('python');
    else if (ext === 'js' || ext === 'mjs') setLanguage('js');
    else setLanguage('html');
    setAdminOpen(false);
  }, [selectedFile]);

  const adminLogout = useCallback(() => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    adminPwRef.current = '';
    setAdminAuthed(false);
    setTree([]);
    setSelectedFile(null);
    setPw('');
    setAdminTab('files');
    setIdariMessages([]);
    setBoogieMessages([]);
    setIdariInput('');
    setBoogieInput('');
  }, []);

  // ── AI chat send ──
  const handleAiChat = useCallback(async (agent: 'idari' | 'boogieman') => {
    const input = agent === 'idari' ? idariInput : boogieInput;
    const setInput = agent === 'idari' ? setIdariInput : setBoogieInput;
    const msg = input.trim();
    if (!msg || aiLoading) return;
    setInput('');
    setAiLoading(true);
    const addMsg = agent === 'idari' ? setIdariMessages : setBoogieMessages;
    addMsg((prev) => [...prev, { role: 'user', text: msg }]);
    try {
      const res = await fetch('/api/admin/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPwRef.current, agent, message: msg }),
      });
      const data = await res.json();
      addMsg((prev) => [...prev, {
        role: 'ai',
        text: res.ok ? (data.response ?? 'No response.') : `Error: ${data.error ?? 'Unknown error'}`,
      }]);
    } catch {
      addMsg((prev) => [...prev, { role: 'ai', text: 'Network error. Try again.' }]);
    } finally {
      setAiLoading(false);
    }
  }, [idariInput, boogieInput, aiLoading]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', background: '#0d0d1a', position: 'relative',
      }}
    >
      {/* ── Top bar ── */}
      <header
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', background: '#12122a',
          borderBottom: '1px solid #2d2d44', flexShrink: 0, zIndex: 10,
        }}
      >
        <Link
          href="/home"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36, borderRadius: 10,
            background: '#2d2d44', border: '1px solid #3d3d5a', color: '#a0a0c0',
          }}
          aria-label="Back to home"
        >
          <ArrowLeft size={16} />
        </Link>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e0e0f0', lineHeight: 1.1 }}>
            CodeSpace
          </div>
          <div style={{ fontSize: 11, color: '#6060a0' }}>Dreamengin IDE</div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px',
            borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', fontSize: 11, fontWeight: 700,
          }}>
            <Terminal size={12} /> CODESPACE
          </div>

          {/* 🔒 Admin icon — only shown to the owner account */}
          {isAdminUser && (
            <button
              type="button"
              onClick={() => setAdminOpen(true)}
              style={{
                ...iconBtn,
                background: adminAuthed ? '#1a3a1a' : '#2d2d44',
                borderColor: adminAuthed ? '#22c55e' : '#3d3d5a',
                color: adminAuthed ? '#22c55e' : '#a0a0c0',
              }}
              title="Admin file browser"
              aria-label="Open admin code viewer"
            >
              {adminAuthed ? <Unlock size={14} /> : <Lock size={14} />}
            </button>
          )}
        </div>
      </header>

      {/* ── Preview Panel (~35vh) ── */}
      <div style={{ height: '35vh', display: 'flex', flexDirection: 'column', borderBottom: '2px solid #6366f1' }}>
        <div style={panelHeaderStyle}>
          <span style={labelStyle}>Preview</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" onClick={refreshPreview} style={iconBtn} title="Run & refresh preview">
              <RefreshCw size={13} />
            </button>
            <button type="button" onClick={openInNewTab} style={iconBtn} title="Open in new tab">
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
        <iframe
          srcDoc={previewSrc}
          sandbox="allow-scripts allow-forms"
          style={{ flex: 1, width: '100%', border: 'none', background: 'white' }}
          title="Code preview"
        />
      </div>

      {/* ── Editor Panel (~35vh) ── */}
      <div style={{ height: '35vh', display: 'flex', flexDirection: 'column', borderBottom: '2px solid #8b5cf6' }}>
        <div style={panelHeaderStyle}>
          <span style={labelStyle}>Editor</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              style={{
                background: '#2d2d44', border: '1px solid #3d3d5a', color: '#c0c0e0',
                fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 7, cursor: 'pointer', outline: 'none',
              }}
              aria-label="Language selector"
            >
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="js">JS</option>
              <option value="python">Python</option>
            </select>
            <button type="button" onClick={handleCopy} style={{ ...iconBtn, color: copied ? '#22c55e' : '#a0a0c0' }} title="Copy code">
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </div>
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          style={{
            flex: 1, width: '100%', padding: '12px 14px',
            background: '#0d0d1a', color: '#e0e0f0',
            fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code",Consolas,monospace',
            fontSize: 13, lineHeight: 1.6, resize: 'none', border: 'none', outline: 'none',
            overflowY: 'auto', overflowX: 'auto', whiteSpace: 'pre', tabSize: 2, boxSizing: 'border-box',
          }}
          placeholder="Write your code here…"
          aria-label="Code editor"
        />
      </div>

      {/* ── Snippets + Actions Panel ── */}
      <div style={{ flex: 1, minHeight: '30vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={panelHeaderStyle}>
          <span style={labelStyle}>Quick Snippets</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <label style={{ ...iconBtn, cursor: 'pointer' }} title="Upload file">
              <Upload size={13} />
              <input type="file" onChange={handleUpload} style={{ display: 'none' }} accept=".html,.css,.js,.py,.txt,.ts,.tsx" />
            </label>
            <button type="button" onClick={handleDownload} style={iconBtn} title="Download file">
              <Download size={13} />
            </button>
          </div>
        </div>

        <div style={{ padding: '10px 10px 6px', display: 'flex', flexWrap: 'wrap', gap: 7, overflowY: 'auto' }}>
          {SNIPPETS[language].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => insertSnippet(s)}
              style={{
                padding: '7px 12px', borderRadius: 8, background: '#1e1e38',
                border: '1px solid #3d3d5a', color: '#c0c0e0', fontSize: 12,
                fontFamily: '"JetBrains Mono",Consolas,monospace', cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div style={{ padding: '8px 10px 12px', marginTop: 'auto' }}>
          <button
            type="button"
            onClick={refreshPreview}
            style={{
              width: '100%', padding: '11px', borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none', color: 'white', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
          >
            <RefreshCw size={14} /> Run &amp; Preview
          </button>
        </div>
      </div>

      {/* ── Admin Panel (slide-up overlay) ── */}
      {adminOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 50,
            background: 'rgba(0,0,0,0.75)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setAdminOpen(false); }}
        >
          <div
            style={{
              background: '#12122a', borderRadius: '20px 20px 0 0',
              border: '1px solid #2d2d44', borderBottom: 'none',
              maxHeight: '85dvh', display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Panel header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #2d2d44' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {adminAuthed ? <Unlock size={16} color="#22c55e" /> : <Lock size={16} color="#f59e0b" />}
                <span style={{ fontSize: 15, fontWeight: 700, color: '#e0e0f0' }}>
                  {adminAuthed ? 'Admin Console' : 'Admin Access'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {adminAuthed && (
                  <button type="button" onClick={adminLogout} style={{ ...iconBtn, color: '#f87171', borderColor: '#4a1a1a', background: '#2a1010' }} title="Logout">
                    <Lock size={13} />
                  </button>
                )}
                <button type="button" onClick={() => setAdminOpen(false)} style={iconBtn} title="Close">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Tab bar — shown only when authenticated */}
            {adminAuthed && (
              <div style={{ display: 'flex', gap: 4, padding: '8px 12px', borderBottom: '1px solid #2d2d44', flexShrink: 0 }}>
                {([
                  { id: 'files',     label: 'Files',    icon: <FileCode size={13} /> },
                  { id: 'idari',     label: 'IDARi',    icon: <Bot size={13} /> },
                  { id: 'boogieman', label: 'Boogieman', icon: <MessageSquare size={13} /> },
                ] as const).map(({ id, label, icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setAdminTab(id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      border: '1px solid',
                      background: adminTab === id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#1e1e38',
                      borderColor: adminTab === id ? '#6366f1' : '#3d3d5a',
                      color: adminTab === id ? 'white' : '#a0a0c0',
                    }}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ overflowY: 'auto', flex: 1, padding: 16 }}>

              {/* ── Not authenticated: password form ── */}
              {!adminAuthed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 360, margin: '0 auto', paddingTop: 8 }}>
                  <p style={{ fontSize: 13, color: '#8080b0', margin: 0, lineHeight: 1.5 }}>
                    Enter the admin password to browse and copy app source files.
                    Set <code style={{ background: '#1e1e38', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>IDARI_PASSWORD</code> in your environment.
                  </p>
                  <input
                    type="password"
                    value={pw}
                    onChange={(e) => { setPw(e.target.value); setPwError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAdminLogin(); }}
                    placeholder="Enter admin password…"
                    style={{
                      padding: '12px 14px', borderRadius: 10,
                      background: '#1e1e38', border: `1px solid ${pwError ? '#f87171' : '#3d3d5a'}`,
                      color: '#e0e0f0', fontSize: 14, outline: 'none',
                    }}
                    aria-label="Admin password"
                    autoComplete="current-password"
                  />
                  {pwError && <p style={{ color: '#f87171', fontSize: 13, margin: 0 }}>{pwError}</p>}
                  <button
                    type="button"
                    onClick={handleAdminLogin}
                    disabled={authLoading}
                    style={{
                      padding: '12px', borderRadius: 10, border: 'none',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      opacity: authLoading ? 0.7 : 1,
                    }}
                  >
                    {authLoading ? <><LoaderCircle size={15} className="animate-spin" /> Verifying…</> : <><Unlock size={15} /> Unlock File Browser</>}
                  </button>
                </div>
              )}

              {/* ── Authenticated: file browser ── */}
              {adminAuthed && adminTab === 'files' && !selectedFile && (
                <div>
                  {treeLoading ? (
                    <div style={{ textAlign: 'center', padding: 24, color: '#6060a0' }}>
                      <LoaderCircle size={22} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                      <p style={{ margin: 0, fontSize: 13 }}>Loading file tree…</p>
                    </div>
                  ) : tree.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 24, color: '#6060a0' }}>
                      <p style={{ margin: 0, fontSize: 13 }}>No source files found. Make sure the server has access to the project root.</p>
                    </div>
                  ) : (
                    tree.map((node) => <TreeNode key={node.path} node={node} onSelect={handleFileSelect} />)
                  )}
                </div>
              )}

              {/* ── File viewer ── */}
              {adminAuthed && adminTab === 'files' && selectedFile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button type="button" onClick={() => setSelectedFile(null)} style={{ ...iconBtn, flexShrink: 0 }} title="Back to tree">
                      <ArrowLeft size={13} />
                    </button>
                    <span style={{ fontSize: 12, color: '#a0a0c0', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                      {selectedFile.path}
                    </span>
                  </div>
                  {fileLoading ? (
                    <div style={{ textAlign: 'center', padding: 24, color: '#6060a0' }}>
                      <LoaderCircle size={22} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    </div>
                  ) : (
                    <>
                      <pre
                        style={{
                          background: '#0d0d1a', border: '1px solid #2d2d44', borderRadius: 10,
                          padding: '12px 14px', overflowX: 'auto', overflowY: 'auto', maxHeight: '45dvh',
                          color: '#c0e0ff', fontSize: 12, lineHeight: 1.6,
                          fontFamily: '"JetBrains Mono","Fira Code",Consolas,monospace',
                          margin: 0, whiteSpace: 'pre', tabSize: 2,
                        }}
                      >
                        {selectedFile.content}
                      </pre>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          onClick={handleFileCopy}
                          style={{
                            flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                            background: fileCopied ? 'linear-gradient(135deg,#16a34a,#22c55e)' : '#2d2d44',
                            color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                          }}
                        >
                          {fileCopied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Code</>}
                        </button>
                        <button
                          type="button"
                          onClick={loadFileIntoEditor}
                          style={{
                            flex: 1, padding: '10px', borderRadius: 10, border: 'none',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                          }}
                        >
                          <FileCode size={14} /> Load in Editor
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── IDARi chat tab ── */}
              {adminAuthed && adminTab === 'idari' && (
                <AiChatPanel
                  agent="idari"
                  label="IDARi"
                  accentColor="#6366f1"
                  description="Admin AI — debugger & system overseer"
                  messages={idariMessages}
                  input={idariInput}
                  loading={aiLoading}
                  chatEndRef={chatEndRef}
                  onInputChange={setIdariInput}
                  onSend={() => handleAiChat('idari')}
                />
              )}

              {/* ── Boogieman chat tab ── */}
              {adminAuthed && adminTab === 'boogieman' && (
                <AiChatPanel
                  agent="boogieman"
                  label="Boogieman"
                  accentColor="#f59e0b"
                  description="Policy & enforcement AI"
                  messages={boogieMessages}
                  input={boogieInput}
                  loading={aiLoading}
                  chatEndRef={chatEndRef}
                  onInputChange={setBoogieInput}
                  onSend={() => handleAiChat('boogieman')}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
