'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import {
  Home, Search, PlusCircle, Music, FlaskConical, Store,
  MessageSquare, Settings, LogOut, Bot, X, Send, Sparkles,
  Brain, Lightbulb, Zap, LogIn
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useTick } from '@/hooks/useTick';
import { onInnerDreamsEvent } from '@/lib/agents/agentBus';
import { getDrEamsMode, onDrEamsModeChange } from '@/lib/agents/drEamsMode';
import { hasTaught, markTaught, onTeach } from '@/lib/agents/teachBus';
import { executeUiAction } from '@/lib/agents/uiActions';

interface HomeRadialNavProps {
  user: User | null;
}

interface RadialMenuItem {
  id: string;
  label: string;
  icon: typeof Home;
  action: () => void;
  path?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotion?: 'neutral' | 'excited' | 'thoughtful' | 'helpful' | 'concerned';
}

interface ConversationContext {
  recentTopics: string[];
  userPreferences: Record<string, any>;
  sessionGoals: string[];
}

const DRAG_THRESHOLD = 10; // pixels
const LONG_PRESS_DURATION = 400; // ms
const RADIAL_RADIUS = 80; // pixels from center
const ITEM_HIT_RADIUS = 30; // pixels
const JUST_CLOSED_MS = 280; // guardrail
const OVERLAY_CLOSE_COOLDOWN = 250; // ms - prevent accidental navigation after overlay close

export default function HomeRadialNav({ user }: HomeRadialNavProps) {
  const router = useRouter();
  const supabase = createClient();
  const { tickOpen, tickSelect, tickConfirm } = useTick();

  // Position state
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [highlightedItemIndex, setHighlightedItemIndex] = useState<number | null>(null);
  const [justClosedAt, setJustClosedAt] = useState<number>(0);

  // Dr. Eam chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Dr. Eam, your creative companion in DREAMengin. Think of me as your guide through this platform—I'm here to help you discover features, understand complex concepts, and even run safe operations on your behalf. What brings you here today?",
      timestamp: new Date(),
      emotion: 'helpful',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [interpretingIntent, setInterpretingIntent] = useState('');
  const [fullExperience, setFullExperience] = useState(true);
  const [context, setContext] = useState<ConversationContext>({
    recentTopics: [],
    userPreferences: {},
    sessionGoals: [],
  });

  // Refs for gesture tracking
  const pointerStartRef = useRef({ x: 0, y: 0, time: 0 });
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasMovedRef = useRef(false);
  const quickTapArmedRef = useRef(false);
  const justClosedOverlayRef = useRef(0); // Timestamp when overlay was closed

  // Initialize position from localStorage or default
  useEffect(() => {
    const saved = localStorage.getItem('home-btn-pos');
    if (saved) {
      try {
        setPosition(JSON.parse(saved));
      } catch {
        setDefaultPosition();
      }
    } else {
      setDefaultPosition();
    }
  }, []);

  const setDefaultPosition = () => {
    setPosition({
      x: window.innerWidth - 72,
      y: window.innerHeight - 140,
    });
  };

  // Clamp position to viewport
  const clampPosition = (x: number, y: number) => {
    const margin = 8;
    const buttonSize = 56;
    return {
      x: Math.max(margin, Math.min(x, window.innerWidth - buttonSize - margin)),
      y: Math.max(margin, Math.min(y, window.innerHeight - buttonSize - margin)),
    };
  };

  // Save position to localStorage
  const savePosition = (pos: { x: number; y: number }) => {
    localStorage.setItem('home-btn-pos', JSON.stringify(pos));
  };

  // Get radial menu items based on user state
  const getMenuItems = (): RadialMenuItem[] => {
    if (user) {
      return [
        { id: 'home', label: 'Home', icon: Home, path: '/home', action: () => router.push('/home') },
        { id: 'discover', label: 'Discover', icon: Search, path: '/discover', action: () => router.push('/discover') },
        { id: 'create', label: 'Create', icon: PlusCircle, path: '/home?modal=create', action: () => router.push('/home?modal=create') },
        { id: 'music', label: 'Music', icon: Music, path: '/music', action: () => router.push('/music') },
        { id: 'lab', label: 'Lab', icon: FlaskConical, path: '/lab', action: () => router.push('/lab') },
        { id: 'shop', label: 'Shop', icon: Store, path: '/shop', action: () => router.push('/shop') },
        { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/messages', action: () => router.push('/messages') },
        { id: 'settings', label: 'Settings', icon: Settings, path: '/settings', action: () => router.push('/settings') },
        { id: 'dreams', label: 'Dr. Eam', icon: Bot, action: () => { setIsMenuOpen(false); setIsChatOpen(true); } },
        { id: 'logout', label: 'Logout', icon: LogOut, action: async () => { await supabase.auth.signOut(); router.push('/login'); } },
      ];
    } else {
      return [
        { id: 'discover', label: 'Discover', icon: Search, path: '/discover', action: () => router.push('/discover') },
        { id: 'shop', label: 'Shop', icon: Store, path: '/shop', action: () => router.push('/shop') },
        { id: 'dreams', label: 'Dr. Eam', icon: Bot, action: () => { setIsMenuOpen(false); setIsChatOpen(true); } },
        { id: 'login', label: 'Login', icon: LogIn, path: '/login', action: () => router.push('/login') },
      ];
    }
  };

  const menuItems = getMenuItems();

  // Calculate radial item positions (edge-aware)
  const getRadialItemPosition = (index: number, total: number) => {
    // Determine which quadrant the button is in
    const isNearBottom = position.y > window.innerHeight / 2;
    const isNearRight = position.x > window.innerWidth / 2;
    const isNearLeft = position.x < window.innerWidth / 3;
    const isNearTop = position.y < window.innerHeight / 3;

    // Calculate arc based on position
    let startAngle = 0;
    let arcSize = Math.PI * 2; // Full circle by default

    if (isNearBottom && !isNearLeft && !isNearRight) {
      // Bottom center - arc upward
      startAngle = -Math.PI;
      arcSize = Math.PI;
    } else if (isNearBottom && isNearRight) {
      // Bottom right - arc up and left
      startAngle = -Math.PI * 0.75;
      arcSize = Math.PI * 1.5;
    } else if (isNearBottom && isNearLeft) {
      // Bottom left - arc up and right
      startAngle = -Math.PI * 0.25;
      arcSize = Math.PI * 1.5;
    } else if (isNearTop && isNearRight) {
      // Top right - arc down and left
      startAngle = Math.PI * 0.25;
      arcSize = Math.PI * 1.5;
    } else if (isNearTop && isNearLeft) {
      // Top left - arc down and right
      startAngle = -Math.PI * 0.25;
      arcSize = Math.PI * 1.5;
    }

    const angle = startAngle + (index / (total - 1 || 1)) * arcSize;
    const x = position.x + 28 + Math.cos(angle) * RADIAL_RADIUS;
    const y = position.y + 28 + Math.sin(angle) * RADIAL_RADIUS;

    return { x, y, angle };
  };

  // Check if pointer is over an item
  const getItemUnderPointer = (pointerX: number, pointerY: number): number | null => {
    for (let i = 0; i < menuItems.length; i++) {
      const itemPos = getRadialItemPosition(i, menuItems.length);
      const dx = pointerX - itemPos.x;
      const dy = pointerY - itemPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < ITEM_HIT_RADIUS) {
        return i;
      }
    }
    return null;
  };

  // Pointer down handler
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: Date.now(),
    };
    hasMovedRef.current = false;
    setIsDragging(false);

    // Start long-press timer
    longPressTimerRef.current = setTimeout(() => {
      if (!hasMovedRef.current && !isDragging) {
        // Long press detected - open menu
        setIsMenuOpen(true);
        tickOpen();
        try {
          navigator.vibrate?.(10);
        } catch {}
        // Trigger scale animation
        if (buttonRef.current) {
          buttonRef.current.style.animation = 'none';
          setTimeout(() => {
            if (buttonRef.current) {
              buttonRef.current.style.animation = 'buttonPress 150ms ease-out';
            }
          }, 10);
        }
      }
    }, LONG_PRESS_DURATION);

    // Capture pointer
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  // Pointer move handler
  const handlePointerMove = (e: React.PointerEvent) => {
    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > DRAG_THRESHOLD) {
      hasMovedRef.current = true;
      
      // Cancel long-press if we start dragging
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      if (isMenuOpen) {
        // Drag-to-select mode
        const itemIndex = getItemUnderPointer(e.clientX, e.clientY);
        if (itemIndex !== highlightedItemIndex) {
          setHighlightedItemIndex(itemIndex);
          if (itemIndex !== null) {
            tickSelect(itemIndex);
            try {
              navigator.vibrate?.(5);
            } catch {}
          }
        }
      } else {
        // Drag mode - reposition button
        setIsDragging(true);
        const newPos = clampPosition(
          position.x + dx,
          position.y + dy
        );
        setPosition(newPos);
        pointerStartRef.current = { x: e.clientX, y: e.clientY, time: pointerStartRef.current.time };
      }
    }
  };

  // Pointer up handler
  const handlePointerUp = (e: React.PointerEvent) => {
    // Cancel long-press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isMenuOpen) {
      // Check if we're releasing on a highlighted item
      if (highlightedItemIndex !== null) {
        const item = menuItems[highlightedItemIndex];
        tickConfirm();
        try {
          navigator.vibrate?.(15);
        } catch {}
        setTimeout(() => {
          item.action();
          setIsMenuOpen(false);
          setHighlightedItemIndex(null);
        }, 100);
      } else {
        // Released on nothing - close menu
        justClosedOverlayRef.current = Date.now();
        setIsMenuOpen(false);
        setHighlightedItemIndex(null);
      }
    } else if (isDragging) {
      // Save position after drag
      savePosition(position);
      setIsDragging(false);
    } else if (!hasMovedRef.current) {
      // Quick tap - new behavior
      if (isChatOpen) {
        // First press: close Dr. Eam chat
        justClosedOverlayRef.current = Date.now();
        setIsChatOpen(false);
      } else if (isMenuOpen) {
        // Close menu without navigation
        justClosedOverlayRef.current = Date.now();
        setIsMenuOpen(false);
        setHighlightedItemIndex(null);
      } else {
        // Second press (nothing open): navigate to /home
        // But only if we're outside the cooldown window
        const timeSinceClose = Date.now() - justClosedOverlayRef.current;
        if (timeSinceClose > OVERLAY_CLOSE_COOLDOWN) {
          router.push('/home');
        }
      }
    }

    hasMovedRef.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Dr. Eam chat functions (from AIAssistantEnhanced)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isChatOpen]);

  useEffect(() => {
    setFullExperience(getDrEamsMode());
    const off = onDrEamsModeChange((v) => setFullExperience(v));
    return () => off();
  }, []);

  useEffect(() => {
    const off = onTeach((evt) => {
      if (!fullExperience) return;
      if (hasTaught(evt.featureId)) return;
      markTaught(evt.featureId);
      addAssistantMessage(
        `I noticed you're exploring ${evt.title}. ${evt.message}\n\nWould you like me to explain more about how this feature works in the context of your creative workflow?`,
        'helpful'
      );
    });
    return () => off();
  }, [fullExperience]);

  useEffect(() => {
    const unsubscribe = onInnerDreamsEvent((evt) => {
      const shouldSurface =
        evt.type === 'innerdreams:status' ||
        evt.status === 'error' ||
        (evt.type === 'innerdreams:log' &&
          /completed|failed|queued|initiated|activated|paused|bug/i.test(evt.message));

      if (!shouldSurface) return;

      const emotion = evt.status === 'error' ? 'concerned' : 'neutral';
      addAssistantMessage(
        `🔧 iDari Update: ${evt.message}${evt.details ? `\n\nDetails: ${evt.details}` : ''}`,
        emotion
      );
    });
    return () => unsubscribe();
  }, []);

  const addAssistantMessage = (content: string, emotion: Message['emotion'] = 'neutral') => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        role: 'assistant',
        content,
        timestamp: new Date(),
        emotion,
      },
    ]);
    
    updateConversationContext(content);
  };

  const updateConversationContext = (content: string) => {
    const topics = extractTopics(content);
    setContext(prev => ({
      ...prev,
      recentTopics: [...new Set([...topics, ...prev.recentTopics])].slice(0, 5),
    }));
  };

  const extractTopics = (text: string): string[] => {
    const topicPatterns = [
      /physics|experiment|lab|science|theory/i,
      /revenue|money|earnings|payment|monetiz/i,
      /post|content|create|upload/i,
      /profile|avatar|bio|settings/i,
      /analytics|stats|performance|metrics/i,
      /music|audio|track|playlist/i,
      /ad|advertising|promotion/i,
    ];
    
    const topics: string[] = [];
    topicPatterns.forEach((pattern, i) => {
      if (pattern.test(text)) {
        const topicNames = ['physics', 'revenue', 'content', 'profile', 'analytics', 'music', 'advertising'];
        topics.push(topicNames[i]);
      }
    });
    
    return topics;
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

      if (res.status === 401) return '🔐 iDari requires admin authentication. Please sign in with an admin account first, then we can proceed.';
      if (res.status === 403) return '⚠️ iDari is restricted to administrator accounts. Your current account doesn\'t have the necessary permissions.';
      if (!res.ok) return `❌ iDari encountered an issue (Status ${res.status}). Let me know if you'd like me to try a different approach.`;

      const json = await res.json();
      if (mode === 'bug-check') {
        const bugs = json?.bugsFound ?? 0;
        return bugs > 0
          ? `🔍 iDari scan detected ${bugs} potential ${bugs === 1 ? 'issue' : 'issues'}. I've logged the details in the admin audit system. Would you like me to help prioritize the fixes?`
          : '✅ iDari reports all systems nominal. Everything is running smoothly!';
      }

      return json?.message ? `✨ iDari: ${json.message}` : '✅ iDari has accepted the update request and is working on it.';
    } catch (e: any) {
      return `⚠️ I encountered an error communicating with iDari: ${e?.message || 'Unknown error'}. This might be a temporary network issue—would you like me to try again?`;
    }
  };

  const callDrEams = async (message: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/dr-eams/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (res.status === 401) {
        return "🔐 Please sign in first so I can act on your behalf.";
      }

      if (!res.ok) {
        return null;
      }

      const json = await res.json();
      return typeof json?.response_text === 'string' ? json.response_text : null;
    } catch {
      return null;
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
    
    // Track search immediately
    trackSearch(userText);
    
    // Show immediate intent interpretation
    const intent = interpretIntent(userText);
    setInterpretingIntent(intent);
    setIsLoading(true);

    
    // Instant intent acknowledgment
    const navigated = handleNavigation(userText);
    trackSearch(userText);

    if (navigated) {
      setIsLoading(false);
      return;
    }

    const response = await generateResponse(userText);
    
    setInterpretingIntent('');
    addAssistantMessage(response.content, response.emotion);
    setIsLoading(false);
  };

  // Interpret user intent immediately for instant feedback

  // ─────────────────────────────────────────────────────────────
  // Dr. Eam: fast intent → decisive action → compact reply
  //
  // Design goals:
  // - Immediate acknowledgement (perceived omniscience)
  // - Confident routing (decisions, not dumps)
  // - Lightweight memory via localStorage (continuity)
  // - No verbose explanations unless asked
  // ─────────────────────────────────────────────────────────────

  type IntentKind =
    | 'navigate'
    | 'create'
    | 'manage'
    | 'search'
    | 'question'
    | 'greeting'
    | 'unknown';

  type InterpretedIntent = {
    kind: IntentKind;
    label: string;
    destination?: string;
    confidence: 'high' | 'med' | 'low';
  };

  type DrEamsMemory = {
    navCounts: Record<string, number>;
    recentSearches: string[];
    lastDestination?: string;
  };

  const MEMORY_KEY = 'dr-eams-memory-v1';

  const loadMemory = (): DrEamsMemory => {
    try {
      const raw = localStorage.getItem(MEMORY_KEY);
      if (!raw) return { navCounts: {}, recentSearches: [] };
      const parsed = JSON.parse(raw);
      return {
        navCounts: parsed?.navCounts || {},
        recentSearches: Array.isArray(parsed?.recentSearches) ? parsed.recentSearches : [],
        lastDestination: typeof parsed?.lastDestination === 'string' ? parsed.lastDestination : undefined,
      };
    } catch {
      return { navCounts: {}, recentSearches: [] };
    }
  };

  const saveMemory = (mem: DrEamsMemory) => {
    try {
      localStorage.setItem(MEMORY_KEY, JSON.stringify(mem));
    } catch {
      // ignore
    }
  };

  const trackNavigation = (destination: string) => {
    const mem = loadMemory();
    mem.navCounts[destination] = (mem.navCounts[destination] || 0) + 1;
    mem.lastDestination = destination;
    saveMemory(mem);
  };

  const trackSearch = (query: string) => {
    const mem = loadMemory();
    const next = [query, ...mem.recentSearches.filter((q) => q !== query)].slice(0, 10);
    mem.recentSearches = next;
    saveMemory(mem);
  };

  const topDestinations = (): string[] => {
    const mem = loadMemory();
    return Object.entries(mem.navCounts)
      .sort((a, b) => (b[1] || 0) - (a[1] || 0))
      .slice(0, 3)
      .map(([k]) => k);
  };

  const NAV_MAP: Array<{ key: string; match: RegExp; path: string; label: string }> = [
    { key: 'home', match: /\b(home|profile|widgets|widget|layout|configure)\b/i, path: '/home', label: 'Home & Widgets' },
    { key: 'discover', match: /\b(discover|explore|find|browse)\b/i, path: '/discover', label: 'Discover' },
    { key: 'music', match: /\b(music|audio|track|playlist|upload music|songs?)\b/i, path: '/music', label: 'Music' },
    { key: 'lab', match: /\b(lab|physics|experiment|science|quantum)\b/i, path: '/lab', label: 'Lab' },
    { key: 'shop', match: /\b(shop|store|merch|sell|buy)\b/i, path: '/shop', label: 'Shop' },
    { key: 'messages', match: /\b(message|dm|chat|inbox)\b/i, path: '/messages', label: 'Messages' },
    { key: 'settings', match: /\b(settings?|preferences?|privacy|security|account)\b/i, path: '/settings', label: 'Settings' },
    { key: 'create', match: /\b(create|new post|post|upload|publish)\b/i, path: '/home?modal=create', label: 'Create' },
    { key: 'analytics', match: /\b(analytics|stats|metrics|performance)\b/i, path: '/analytics', label: 'Analytics' },
  ];

  const interpretIntent = (queryRaw: string): InterpretedIntent => {
    const query = queryRaw.trim();
    const lower = query.toLowerCase();

    if (/^(hi|hello|hey|yo|sup|good\s+(morning|afternoon|evening))\b/i.test(query)) {
      return { kind: 'greeting', label: 'Greeting', confidence: 'high' };
    }

    // Navigation / direct destinations
    for (const m of NAV_MAP) {
      if (m.match.test(query)) {
        return { kind: 'navigate', label: `Opening ${m.label}…`, destination: m.path, confidence: 'high' };
      }
    }

    // Search-like queries
    if (/(search|find|look up|where is|how do i|how to)\b/i.test(query) || query.length > 18) {
      return { kind: 'search', label: 'Searching DREAMengin…', confidence: 'med' };
    }

    // Questions
    if (/[?]$/.test(query) || /\b(what|why|how|can you|do you|is there|where)\b/i.test(query)) {
      return { kind: 'question', label: 'Thinking…', confidence: 'med' };
    }

    return { kind: 'unknown', label: 'Working…', confidence: 'low' };
  };

  const handleNavigation = (intent: InterpretedIntent) => {
    if (!intent.destination) return false;
    trackNavigation(intent.destination);
    router.push(intent.destination);
    return true;
  };

  const buildDecisiveReply = (intent: InterpretedIntent, query: string): { content: string; emotion: Message['emotion'] } => {
    if (intent.kind === 'navigate' && intent.destination) {
      return { content: intent.label, emotion: 'helpful' };
    }

    if (intent.kind === 'search') {
      trackSearch(query);
      const favorites = topDestinations();
      const favLine = favorites.length
        ? `\n\nQuick picks: ${favorites.map((d) => d.replace('/','')).join(' • ')}`
        : '';
      return {
        content: `Got it. Tell me what you want to do and I’ll take you there.${favLine}`,
        emotion: 'thoughtful',
      };
    }

    if (intent.kind === 'greeting') {
      return { content: getGreeting(), emotion: 'helpful' };
    }

    // Default: concise concierge response
    return {
      content: `I can route you instantly. Try: “Open music”, “Go to lab”, “Edit profile”, “Create a post”.`,
      emotion: 'helpful',
    };
  };

  const generateResponse = async (query: string): Promise<{ content: string; emotion: Message['emotion'] }> => {
    const intent = interpretIntent(query);

    // Full Experience: act immediately for high-confidence navigation
    if (fullExperience && intent.kind === 'navigate' && intent.destination) {
      handleNavigation(intent);
      return { content: intent.label, emotion: 'helpful' };
    }

    // iDari routing remains as before
    const lower = query.toLowerCase();
    if (
      lower.includes('innerdreams') ||
      lower.includes('inner dreams') ||
      (/(fix|patch|update|repair)\b/.test(lower) && /(bug|error|issue|problem|build|deploy|vercel|site)/.test(lower))
    ) {
      const mode = lower.includes('bug') || lower.includes('check') || lower.includes('scan') ? 'bug-check' : 'update';
      const cleaned = query.replace(/inner\s*dreams\s*[:\-]?/i, '').trim();
      const reply = await callInnerDreams(mode, cleaned || query);
      return { content: reply, emotion: 'helpful' };
    }

    // Capability / guidance intents
    if (/\b(what can you do|help|capabilities|commands|features|assist)\b/i.test(lower)) {
      return { content: getDetailedCapabilities(), emotion: 'excited' };
    }

    if (/\b(physics|experiment|lab|science|theory|quantum|ccc|confirmed connected chaos)\b/i.test(lower)) {
      return { content: getPhysicsGuidance(lower), emotion: 'thoughtful' };
    }

    if (/\b(money|revenue|earn|payment|payout|monetiz|income)\b/i.test(lower)) {
      return { content: getRevenueGuidance(), emotion: 'helpful' };
    }

    // Ask Dr. Eams (server) for everything else. Keep it fast and decisive.
    if (fullExperience) {
      const server = await callDrEams(query);
      if (server) {
        return { content: server, emotion: 'helpful' };
      }
    }

    // Otherwise: decisive, compact reply that nudges toward action
    return buildDecisiveReply(intent, query);
  };
  const getGreeting = (): string => {
    const greetings = [
      "Hello! Great to see you. How can I help with your creative journey today?",
      "Hey there! I'm ready to assist. What would you like to explore?",
      "Hi! I'm here to make your DREAMengin experience smoother. What's on your mind?",
      "Welcome back! What can I help you accomplish today?",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const getDetailedCapabilities = (): string => {
    return `I can take you anywhere in DREAMengin:

**Navigate**: Home • Discover • Music • Lab • Shop • Messages • Settings
**Create**: Posts • Experiments • Content
**Manage**: Profile • Widgets • Analytics • Revenue

Just tell me where you want to go or what you want to do.`;
  };

  const getPhysicsGuidance = (query: string): string => {
    if (/\b(what is|explain|tell me about)\b.*\b(ccc|confirmed connected chaos)\b/i.test(query)) {
      return `**CCC Framework**: Constraint-layer unification physics. Information redistributes to boundaries—nothing lost.

**Lab features**: 99-layer ADA architecture • Coherence simulation • Collaborative research

Opening lab?`;
    }

    if (/\b(create|start|new|design)\b.*\b(experiment|test|simulation)\b/i.test(query)) {
      return `Setting up experiment. Define: hypothesis, methodology, parameters, expected outcomes.

Opening lab now.`;
    }

    return `**Physics Lab**: Design experiments • Test CCC predictions • Visualize data • Collaborate

Ready to explore?`;
  };

  const getRevenueGuidance = (): string => {
    return `**Revenue Split:** 85% you, 15% platform

**Sources:** Ads • Merch • Music • Tips (soon) • Subscriptions (soon)

Check your earnings dashboard for real-time tracking.`;
  };

  const getContextualResponse = (query: string, ctx: ConversationContext): string => {
    const lower = query.toLowerCase();

    if (/\b(post|create|upload|publish|share)\b/.test(lower)) {
      return `Opening creator. Choose your content type, add tags, set visibility, and publish.`;
    }

    if (/\b(profile|avatar|bio|about|page)\b/.test(lower)) {
      return `Opening profile editor. Update your avatar, bio, links, and theme.`;
    }

    if (ctx.recentTopics.length > 0) {
      return `Recently: ${ctx.recentTopics.slice(0, 2).join(', ')}. Where to next?`;
    }

    // Use recent searches to provide context
    const mem = loadMemory();
    if (mem.recentSearches.length > 0) {
      const recent = mem.recentSearches[0];
      return `Try: "${recent}" or ask me to navigate anywhere.`;
    }

    return `Tell me where you want to go or what you want to do.`;
  };

  const getEmotionIcon = (emotion?: Message['emotion']) => {
    switch (emotion) {
      case 'excited': return <Sparkles className="w-4 h-4" />;
      case 'thoughtful': return <Brain className="w-4 h-4" />;
      case 'helpful': return <Lightbulb className="w-4 h-4" />;
      case 'concerned': return <Zap className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <>
      {/* Home Button */}
      <div
        ref={buttonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          touchAction: 'none',
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 9999,
        }}
        className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center text-white transition-shadow hover:shadow-xl"
      >
        <Home className="w-6 h-6" />
      </div>

      {/* Radial Menu Items */}
      {isMenuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9998,
            pointerEvents: 'none',
          }}
        >
          {menuItems.map((item, index) => {
            const itemPos = getRadialItemPosition(index, menuItems.length);
            const isHighlighted = highlightedItemIndex === index;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${itemPos.x - 22}px`,
                  top: `${itemPos.y - 22}px`,
                  transform: isHighlighted
                    ? 'scale(1.3)'
                    : 'scale(1.0)',
                  transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  animation: `radialItemIn 200ms ease-out ${index * 40}ms both`,
                }}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-white shadow-lg ${
                  isHighlighted
                    ? 'bg-gradient-to-br from-pink-500 to-purple-600 shadow-pink-500/50'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                {isHighlighted && (
                  <div className="absolute inset-0 rounded-full animate-ping bg-purple-400 opacity-75" />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Dr. Eam Chat Panel */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[10000]">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close Dr. Eam"
            onClick={() => {
              justClosedOverlayRef.current = Date.now();
              setIsChatOpen(false);
            }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Bottom sheet */}
          <div
            className="absolute inset-x-0 bottom-0 mx-auto w-full max-w-[720px] rounded-t-3xl border border-white/10 bg-slate-950/85 backdrop-blur-xl shadow-2xl flex flex-col"
            style={{
              maxHeight: '86vh',
              paddingBottom: 'max(env(safe-area-inset-bottom), 14px)',
              animation: 'sheetUpIn 260ms cubic-bezier(0.2, 0.9, 0.2, 1)',
            }}
          >
            {/* Grab handle */}
            <div className="pt-3 pb-2 flex items-center justify-center">
              <div className="h-1 w-10 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="px-4 pb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-2xl bg-nebula-flow flex items-center justify-center cosmic-glow">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
                </div>
                <div className="leading-tight">
                  <div className="text-white font-semibold text-base">Dr. Eam</div>
                  <div className="text-white/60 text-xs">Concierge navigation + answers</div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  justClosedOverlayRef.current = Date.now();
                  setIsChatOpen(false);
                }}
                className="h-9 w-9 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>

            {/* Quick actions (inside Dr. Eam only) */}
            <div className="px-4 pb-3 overflow-x-auto scrollbar-hide">
              <div className="flex gap-2 w-max">
                {[
                  { label: 'Home', q: 'go home' },
                  { label: 'Discover', q: 'open discover' },
                  { label: 'Music', q: 'open music' },
                  { label: 'Lab', q: 'open lab' },
                  { label: 'Shop', q: 'open shop' },
                  { label: 'Messages', q: 'open messages' },
                  { label: 'Settings', q: 'open settings' },
                  { label: 'Profile', q: 'edit profile' },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    type="button"
                    onClick={async () => {
                      // Treat like a user query (gives immediate ack + history)
                      setInput('');
                      setMessages((prev) => [
                        ...prev,
                        { id: `${Date.now()}_${Math.random().toString(16).slice(2)}`, role: 'user', content: chip.q, timestamp: new Date() },
                      ]);
                      setIsLoading(true);
                      // Instant ack
                      addAssistantMessage(interpretIntent(chip.q).label, 'helpful');
                      const response = await generateResponse(chip.q);
                      // Avoid duplicating the same ack line
                      if (response.content !== interpretIntent(chip.q).label) addAssistantMessage(response.content, response.emotion);
                      setIsLoading(false);
                    }}
                    className="px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/15 border border-white/10 text-white/85 text-xs whitespace-nowrap"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-3">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={
                      message.role === 'user'
                        ? 'max-w-[86%] rounded-2xl px-4 py-3 text-sm text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg'
                        : 'max-w-[86%] rounded-2xl px-4 py-3 text-sm text-white/90 bg-white/5 border border-white/10 backdrop-blur-md shadow-lg'
                    }
                  >
                    {message.role === 'assistant' && message.emotion && (
                      <div className="mb-2 flex items-center gap-2 text-[11px] text-white/55">
                        {getEmotionIcon(message.emotion)}
                        <span className="capitalize">{message.emotion}</span>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    <div className="mt-2 text-[10px] text-white/40">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 bg-white/5 border border-white/10 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-white/70 animate-pulse" />
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 pt-2">
              {input.trim() && (
                <div className="mb-2 text-[11px] text-white/55">
                  <span className="mr-2">Intent:</span>
                  <span className="text-white/80">{interpretIntent(input).label}</span>
                </div>
              )}

              <div className="flex items-end gap-2 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md px-3 py-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask Dr. Eam or say where to go…"
                  className="flex-1 bg-transparent outline-none text-white placeholder:text-white/35 text-sm py-2"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="h-10 w-10 rounded-xl bg-nebula-flow text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                  aria-label="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-2 text-[10px] text-white/35 text-center">
                Enter to send • Long-press Home for menu
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes buttonPress {
          0% { transform: scale(1.0); filter: blur(0px); }
          20% { transform: scale(0.92); filter: blur(2px); }
          50% { transform: scale(1.08); filter: blur(0px); }
          100% { transform: scale(1.0); filter: blur(0px); }
        }

        @keyframes radialItemIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1.0);
            opacity: 1;
          }
        }

        @keyframes slideUpIn {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
