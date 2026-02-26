'use client';

import { useState, useRef, use, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, Copy, Check, Download, Upload, ExternalLink, Terminal } from 'lucide-react';

type Language = 'html' | 'css' | 'js' | 'python';

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { font-family: sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    h1 { font-size: 2rem; text-align: center; }
  </style>
</head>
<body>
  <h1>Hello DREAMengin! ✨</h1>
</body>
</html>`;

const SNIPPETS: Record<Language, string[]> = {
  html: ['<div></div>', '<p></p>', '<span></span>', 'class=""', 'style=""', '<!-- -->', '<a href="">', '<img src="">'],
  css: ['display: flex;', 'margin: 0;', 'padding: 0;', 'color: #', 'background: ', 'border-radius: ', 'font-size: ', 'width: 100%;'],
  js: ['const ', 'let ', 'function()', '=>', 'console.log()', 'document.', 'fetch()', '.then()'],
  python: ['print()', 'def ', 'for i in', 'if ', 'import ', 'return ', 'class ', 'list()'],
};

const LANG_EXTENSIONS: Record<Language, string> = {
  html: 'html',
  css: 'css',
  js: 'js',
  python: 'py',
};

interface Props {
  params: Promise<{ id: string }>;
}

export default function CodeSpacePage({ params }: Props) {
  const { id } = use(params);

  const [code, setCode] = useState(DEFAULT_HTML);
  const [language, setLanguage] = useState<Language>('html');
  const [previewSrc, setPreviewSrc] = useState(DEFAULT_HTML);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const refreshPreview = useCallback(() => {
    setPreviewSrc(code);
  }, [code]);

  const insertSnippet = useCallback((snippet: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const newCode = code.substring(0, start) + snippet + code.substring(end);
    setCode(newCode);
    // Restore cursor after snippet
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  }, [code]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [code]);

  const handleDownload = useCallback(() => {
    const ext = LANG_EXTENSIONS[language];
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `codespace.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [code, language]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === 'string') setCode(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const panelHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '7px 12px',
    background: '#1a1a2e',
    borderBottom: '1px solid #2d2d44',
    flexShrink: 0,
  };

  const panelLabelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 700,
    color: '#a0a0c0',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  };

  const iconBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 30,
    height: 30,
    borderRadius: 7,
    background: '#2d2d44',
    border: '1px solid #3d3d5a',
    color: '#a0a0c0',
    cursor: 'pointer',
    transition: 'background 0.15s',
  };

  return (
    <div
      className="dream-bg"
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#0d0d1a',
      }}
    >
      {/* ── Top bar ── */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          background: '#12122a',
          borderBottom: '1px solid #2d2d44',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        <Link
          href={`/lab/${id}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 10,
            background: '#2d2d44',
            border: '1px solid #3d3d5a',
            color: '#a0a0c0',
          }}
        >
          <ArrowLeft size={16} />
        </Link>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#e0e0f0', lineHeight: 1.1 }}>
            CodeSpace
          </div>
          <div style={{ fontSize: 11, color: '#6060a0' }}>Lab Project #{id.slice(0, 8)}</div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 10px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          <Terminal size={12} />
          CODESPACE
        </div>
      </header>

      {/* ── Preview Panel (~35vh) ── */}
      <div style={{ height: '35vh', display: 'flex', flexDirection: 'column', borderBottom: '2px solid #6366f1' }}>
        <div style={panelHeaderStyle}>
          <span style={panelLabelStyle}>Preview</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={refreshPreview}
              style={iconBtnStyle}
              title="Refresh preview"
            >
              <RefreshCw size={13} />
            </button>
            <button
              type="button"
              onClick={() => {
                const blob = new Blob([previewSrc], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
                setTimeout(() => URL.revokeObjectURL(url), 5000);
              }}
              style={iconBtnStyle}
              title="Open in new tab"
            >
              <ExternalLink size={13} />
            </button>
          </div>
        </div>
        <iframe
          srcDoc={previewSrc}
          sandbox="allow-scripts allow-forms"
          style={{
            flex: 1,
            width: '100%',
            border: 'none',
            background: 'white',
          }}
          title="Code preview"
        />
      </div>

      {/* ── Editor Panel (~35vh) ── */}
      <div style={{ height: '35vh', display: 'flex', flexDirection: 'column', borderBottom: '2px solid #8b5cf6' }}>
        <div style={panelHeaderStyle}>
          <span style={panelLabelStyle}>Editor</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* Language selector */}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              style={{
                background: '#2d2d44',
                border: '1px solid #3d3d5a',
                color: '#c0c0e0',
                fontSize: 11,
                fontWeight: 700,
                padding: '4px 8px',
                borderRadius: 7,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="js">JS</option>
              <option value="python">Python</option>
            </select>
            <button
              type="button"
              onClick={handleCopy}
              style={{ ...iconBtnStyle, color: copied ? '#22c55e' : '#a0a0c0' }}
              title="Copy code"
            >
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
            flex: 1,
            width: '100%',
            padding: '12px 14px',
            background: '#0d0d1a',
            color: '#e0e0f0',
            fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
            fontSize: 13,
            lineHeight: 1.6,
            resize: 'none',
            border: 'none',
            outline: 'none',
            overflowY: 'auto',
            overflowX: 'auto',
            whiteSpace: 'pre',
            tabSize: 2,
            boxSizing: 'border-box',
          }}
          placeholder="Write your code here..."
          aria-label="Code editor"
        />
      </div>

      {/* ── Snippets + Actions Panel (~30vh) ── */}
      <div style={{ flex: 1, minHeight: '30vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={panelHeaderStyle}>
          <span style={panelLabelStyle}>Quick Snippets</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {/* File upload */}
            <label
              style={{ ...iconBtnStyle, cursor: 'pointer' }}
              title="Upload file"
            >
              <Upload size={13} />
              <input
                type="file"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                accept=".html,.css,.js,.py,.txt"
              />
            </label>
            <button
              type="button"
              onClick={handleDownload}
              style={iconBtnStyle}
              title="Download file"
            >
              <Download size={13} />
            </button>
          </div>
        </div>

        {/* Snippet buttons */}
        <div
          style={{
            padding: '10px 10px 6px',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 7,
            overflowY: 'auto',
          }}
        >
          {SNIPPETS[language].map((snippet) => (
            <button
              key={snippet}
              type="button"
              onClick={() => insertSnippet(snippet)}
              className="codespace-snippet-btn"
              style={{
                padding: '7px 12px',
                borderRadius: 8,
                background: '#1e1e38',
                border: '1px solid #3d3d5a',
                color: '#c0c0e0',
                fontSize: 12,
                fontFamily: '"JetBrains Mono", Consolas, monospace',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {snippet}
            </button>
          ))}
        </div>

        {/* Open in Preview full-width button */}
        <div style={{ padding: '8px 10px 12px', marginTop: 'auto' }}>
          <button
            type="button"
            onClick={refreshPreview}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: 'none',
              color: 'white',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              letterSpacing: '0.02em',
            }}
          >
            <RefreshCw size={14} />
            Run &amp; Preview
          </button>
        </div>
      </div>
    </div>
  );
}
