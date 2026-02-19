'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Maximize2, Minimize2, Send, X } from 'lucide-react';

import { onInnerDreamsEvent } from '@/lib/agents/agentBus';
import { getDrEamsMode, onDrEamsModeChange } from '@/lib/agents/drEamsMode';
import { hasTaught, markTaught, onTeach } from '@/lib/agents/teachBus';
import { executeUiAction, getUiCapabilities } from '@/lib/agents/uiActions';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello. I'm Dr. Eams. I can guide you through DREAMengin, explain features as you use them, and perform safe UI actions on request.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fullExperience, setFullExperience] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Dr. Eams Full Experience mode (guidance + safe UI actions)
  useEffect(() => {
    setFullExperience(getDrEamsMode());
    const off = onDrEamsModeChange((v) => setFullExperience(v));
    return () => off();
  }, []);

  // Teach-on-first-use: UI can emit teach events; Dr. Eams explains once.
  useEffect(() => {
    const off = onTeach((evt) => {
      if (!fullExperience) return;
      if (hasTaught(evt.featureId)) return;
      markTaught(evt.featureId);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
          role: 'assistant',
          content: `${evt.title}\n${evt.message}`,
          timestamp: new Date(evt.timestamp),
        },
      ]);
    });
    return () => off();
  }, [fullExperience]);

  // Surface InnerDreams activity inside this assistant as well
  useEffect(() => {
    const unsubscribe = onInnerDreamsEvent((evt) => {
      const shouldSurface =
        evt.type === 'innerdreams:status' ||
        evt.status === 'error' ||
        (evt.type === 'innerdreams:log' &&
          /completed|failed|queued|initiated|activated|paused|bug/i.test(evt.message));

      if (!shouldSurface) return;

      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
          role: 'assistant',
          content: `InnerDreams: ${evt.message}${evt.details ? `\n${evt.details}` : ''}`,
          timestamp: new Date(evt.timestamp),
        },
      ]);
    });
    return () => unsubscribe();
  }, []);

  const addAssistantMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        role: 'assistant',
        content,
        timestamp: new Date(),
      },
    ]);
  };

  const callInnerDreams = async (mode: 'bug-check' | 'update', prompt?: string): Promise<string> => {
    try {
      const endpoint = mode === 'bug-check' ? '/api/innerdreams/check-bugs' : '/api/innerdreams/update';
      const payload: Record<string, unknown> =
        mode === 'bug-check'
          ? { userId: 'self' }
          : { prompt: prompt || 'General maintenance update', autoRefresh: false, bugCheck: true };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) return 'InnerDreams needs an admin session. Please sign in as admin, then try again.';
      if (res.status === 403) return 'InnerDreams is admin-only. Your account is not marked as admin.';
      if (!res.ok) return `InnerDreams request failed (${res.status}).`;

      const json = await res.json();
      if (mode === 'bug-check') {
        const bugs = json?.bugsFound ?? 0;
        return bugs > 0
          ? `InnerDreams bug check found ${bugs} potential issue(s). Check the admin audit log for details.`
          : 'InnerDreams reports: all systems operational. No issues detected.';
      }

      return json?.message ? `InnerDreams: ${json.message}` : 'InnerDreams accepted the update request.';
    } catch (e: unknown) {
      return `InnerDreams request error: ${e?.message || 'Unknown error'}`;
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const lower = userText.toLowerCase();

    // Capability discovery
    if (/\b(what can you do|help|capabilities|commands)\b/.test(lower)) {
      addAssistantMessage(getUiCapabilities());
      setIsLoading(false);
      return;
    }

    // UI Actions: Dr. Eams can run safe UI operations when Full Experience is ON.
    if (fullExperience) {
      const ui = executeUiAction(userText, {
        navigate: (path) => router.push(path),
      });
      if (ui?.handled) {
        addAssistantMessage(ui.reply);
        setIsLoading(false);
        return;
      }
    }

    // InnerDreams bridge: let Dr. Eams hand tasks to the admin auto-updater
    if (
      lower.includes('innerdreams') ||
      lower.includes('inner dreams') ||
      (/(fix|patch|update)\b/.test(lower) && /(bug|error|build|deploy|vercel|site)/.test(lower))
    ) {
      const mode = lower.includes('bug') || lower.includes('check') ? 'bug-check' : 'update';
      const cleaned = userText.replace(/inner\s*dreams\s*[:\-]?/i, '').trim();
      const reply = await callInnerDreams(mode, cleaned || userText);
      addAssistantMessage(reply);
      setIsLoading(false);
      return;
    }

    // Fallback: simple smart canned guidance
    addAssistantMessage(getSmartResponse(userText));
    setIsLoading(false);
  };

  const getSmartResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('post') || lowerQuery.includes('create')) {
      return 'To create a post, use the Create entry in the nav. You can add text, images, and tags. Ask me to open Create and I will do it.';
    }
    if (lowerQuery.includes('profile')) {
      return 'Edit Profile lets you tune your presence: bio, avatar, theme, showcases, and more. Ask me to open Edit Profile.';
    }
    if (lowerQuery.includes('ad') || lowerQuery.includes('monetize')) {
      return 'Ads is your monetization surface. You can configure slots and pricing, then track performance. Ask me to open Ads.';
    }
    if (lowerQuery.includes('lab')) {
      return 'Lab is for projects and experiments. Think notebooks, files, and collaboration. Ask me to open Lab.';
    }
    if (lowerQuery.includes('music')) {
      return 'Music is for tracks, playlists, and embeds. Ask me to open Music.';
    }
    if (lowerQuery.includes('analytics')) {
      return 'Analytics shows views, growth, and performance. Ask me to open Analytics.';
    }
    return 'Tell me what you want to do in the app. If it is a safe UI action, I can do it. If it needs admin work, I can hand it to InnerDreams.';
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-slate-700 to-slate-900 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50"
        aria-label="Open Dr. Eams AI Assistant"
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 transition-all ${
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">Dr. Eams</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[480px]">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <span className="text-xs opacity-60 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything"
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 dark:bg-slate-800 dark:text-white"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-slate-700 text-white p-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
