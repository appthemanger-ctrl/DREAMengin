import { useCallback, useRef, useState } from 'react';

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface UseAgentSessionReturn {
  sessionId: string | null;
  messages: AgentMessage[];
  isLoading: boolean;
  isActive: boolean;
  startSession: () => Promise<void>;
  sendPrompt: (prompt: string) => Promise<void>;
  closeSession: () => Promise<void>;
}

export function useAgentSession(): UseAgentSessionReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const activeRef = useRef(false);

  const startSession = useCallback(async () => {
    const res = await fetch('/api/agent/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create' }),
    });
    const data = await res.json() as { sessionId: string };
    setSessionId(data.sessionId);
    activeRef.current = true;
  }, []);

  const sendPrompt = useCallback(
    async (prompt: string) => {
      if (!sessionId) return;
      setIsLoading(true);
      setMessages((prev) => [...prev, { role: 'user', content: prompt }]);
      const res = await fetch('/api/agent/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'prompt', sessionId, prompt }),
      });
      const data = await res.json() as { response: string };
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response },
      ]);
      setIsLoading(false);
    },
    [sessionId],
  );

  const closeSession = useCallback(async () => {
    if (!sessionId) return;
    await fetch('/api/agent/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'close', sessionId }),
    });
    setSessionId(null);
    setMessages([]);
    activeRef.current = false;
  }, [sessionId]);

  return {
    sessionId,
    messages,
    isLoading,
    isActive: activeRef.current,
    startSession,
    sendPrompt,
    closeSession,
  };
}