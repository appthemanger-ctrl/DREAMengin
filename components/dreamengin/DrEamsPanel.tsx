// DrEamsPanel.tsx
// Stub for Dr. Eams chat interface.  Provides a simple prompt and conversation history.

'use client';

import React, { useState } from 'react';

interface DrEamsPanelProps {
  onClose: () => void;
}

export default function DrEamsPanel({ onClose }: DrEamsPanelProps) {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'hello what you daydreaming about today?' },
  ]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', text: input.trim() }];
    setMessages(newMessages);
    setInput('');
    // Echo back a placeholder response.  Real integration would call an API.
    setTimeout(() => {
      setMessages((msgs) => [...msgs, { role: 'ai', text: 'Thanks for sharing your dream!' }]);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black bg-opacity-50">
      <div
        className="bg-white dark:bg-gray-900 w-full sm:w-[500px] max-h-[80vh] rounded-t-lg sm:rounded-lg flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Dr. Eams</h2>
          <button
            className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`px-3 py-2 rounded-lg max-w-[80%] ${
                m.role === 'ai'
                  ? 'bg-gray-100 dark:bg-gray-800 self-start'
                  : 'bg-blue-500 text-white self-end'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 flex">
          <input
            className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-black dark:text-white"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                send();
              }
            }}
          />
          <button
            className="ml-2 px-4 py-2 rounded bg-blue-600 text-white"
            onClick={send}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
