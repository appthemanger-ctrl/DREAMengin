'use client';

/**
 * AIPanel — AI code assistant panel for the Code Engine app.
 *
 * Chat-style interface for AI-assisted code generation, explanation,
 * refactoring suggestions, and debugging help.
 * Lives at /engines/code/ai.
 */

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, Copy, CheckCheck, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  'Explain this function',
  'Optimize for performance',
  'Add TypeScript types',
  'Write unit tests',
  'Find potential bugs',
  'Refactor to async/await',
];

const SIMULATED_RESPONSES: Record<string, string> = {
  default: `I can help with that! Here's my suggestion:

\`\`\`typescript
// Optimized version
export async function processData<T>(
  items: T[],
  processor: (item: T) => Promise<void>,
  concurrency = 5
): Promise<void> {
  const batches = chunk(items, concurrency);
  for (const batch of batches) {
    await Promise.all(batch.map(processor));
  }
}
\`\`\`

This approach uses concurrent batch processing to improve throughput while controlling memory usage. The \`concurrency\` parameter lets you tune the parallelism based on your workload.`,
  tests: `Here are comprehensive unit tests:

\`\`\`typescript
import { describe, it, expect, vi } from 'vitest';

describe('processData', () => {
  it('processes all items', async () => {
    const items = [1, 2, 3, 4, 5];
    const processed: number[] = [];
    await processData(items, async (n) => { processed.push(n); });
    expect(processed).toHaveLength(5);
  });

  it('respects concurrency limit', async () => {
    const concurrent = vi.fn().mockResolvedValue(undefined);
    await processData([1,2,3], concurrent, 2);
    expect(concurrent).toHaveBeenCalledTimes(3);
  });
});
\`\`\``,
};

function getSimResponse(prompt: string): string {
  if (prompt.toLowerCase().includes('test')) return SIMULATED_RESPONSES.tests;
  return SIMULATED_RESPONSES.default;
}

export default function AIPanel() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hey! I'm DREAMengin's AI code assistant. Paste some code or ask me anything — I can explain, refactor, optimize, write tests, and more.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function sendMessage(prompt?: string) {
    const text = (prompt ?? input).trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));
    const reply: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: getSimResponse(text),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, reply]);
    setLoading(false);
  }

  function copyMessage(content: string, id: string) {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 bg-black/20 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#22d3ee]/20 flex items-center justify-center">
            <Bot size={16} className="text-[#22d3ee]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">AI Code Assistant</div>
            <div className="text-xs text-white/40">DREAMengin · Code Intelligence</div>
          </div>
        </div>

        {/* Quick prompts */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {QUICK_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.05] hover:bg-[#22d3ee]/15 text-white/50 hover:text-[#22d3ee] border border-white/[0.07] hover:border-[#22d3ee]/30 transition-all"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-[#22d3ee]/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                <Sparkles size={12} className="text-[#22d3ee]" />
              </div>
            )}
            <div
              className="max-w-[85%] rounded-2xl px-4 py-3 text-sm relative group"
              style={
                msg.role === 'user'
                  ? { background: '#22d3ee22', color: 'white', borderBottomRightRadius: '4px' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.85)', borderBottomLeftRadius: '4px' }
              }
            >
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{msg.content}</pre>
              {msg.role === 'assistant' && (
                <button
                  onClick={() => copyMessage(msg.content, msg.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-white/30 hover:text-white/60"
                >
                  {copied === msg.id ? <CheckCheck size={12} /> : <Copy size={12} />}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-[#22d3ee]/20 flex items-center justify-center mr-2 mt-1 flex-shrink-0">
              <Sparkles size={12} className="text-[#22d3ee]" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-white/5 text-white/40 text-sm flex items-center gap-2">
              <Loader2 size={13} className="animate-spin text-[#22d3ee]" />
              Thinking…
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/10 bg-black/20">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="Ask the AI or paste code… (Enter to send)"
            rows={2}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-white/30 resize-none focus:outline-none focus:border-[#22d3ee]/50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="self-end flex items-center justify-center w-9 h-9 rounded-xl bg-[#22d3ee] hover:bg-[#06b6d4] text-black transition-colors disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
