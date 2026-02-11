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
  const justClosedOverlayRef = useRef(0); // Timestamp when overlay was closed

  // User pattern tracking
  const [userPatterns, setUserPatterns] = useState({
    frequentDestinations: [] as string[],
    recentSearches: [] as string[],
    commonActions: [] as string[],
  });

  // Load user patterns from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('dr-eam-patterns');
    if (saved) {
      try {
        setUserPatterns(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // Save user patterns to localStorage
  const saveUserPatterns = (patterns: typeof userPatterns) => {
    localStorage.setItem('dr-eam-patterns', JSON.stringify(patterns));
    setUserPatterns(patterns);
  };

  // Track navigation
  const trackNavigation = (destination: string) => {
    const updated = { ...userPatterns };
    updated.frequentDestinations = [
      destination,
      ...updated.frequentDestinations.filter(d => d !== destination)
    ].slice(0, 10);
    saveUserPatterns(updated);
  };

  // Track search
  const trackSearch = (query: string) => {
    const updated = { ...userPatterns };
    updated.recentSearches = [
      query,
      ...updated.recentSearches.filter(q => q !== query)
    ].slice(0, 20);
    saveUserPatterns(updated);
  };

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
        `🔧 InnerDreams Update: ${evt.message}${evt.details ? `\n\nDetails: ${evt.details}` : ''}`,
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

      if (res.status === 401) return '🔐 InnerDreams requires admin authentication. Please sign in with an admin account first, then we can proceed.';
      if (res.status === 403) return '⚠️ InnerDreams is restricted to administrator accounts. Your current account doesn\'t have the necessary permissions.';
      if (!res.ok) return `❌ InnerDreams encountered an issue (Status ${res.status}). Let me know if you'd like me to try a different approach.`;

      const json = await res.json();
      if (mode === 'bug-check') {
        const bugs = json?.bugsFound ?? 0;
        return bugs > 0
          ? `🔍 InnerDreams scan detected ${bugs} potential ${bugs === 1 ? 'issue' : 'issues'}. I've logged the details in the admin audit system. Would you like me to help prioritize the fixes?`
          : '✅ InnerDreams reports all systems nominal. Everything is running smoothly!';
      }

      return json?.message ? `✨ InnerDreams: ${json.message}` : '✅ InnerDreams has accepted the update request and is working on it.';
    } catch (e: any) {
      return `⚠️ I encountered an error communicating with InnerDreams: ${e?.message || 'Unknown error'}. This might be a temporary network issue—would you like me to try again?`;
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

    const response = await generateResponse(userText);
    setInterpretingIntent('');
    addAssistantMessage(response.content, response.emotion);
    setIsLoading(false);
  };

  // Interpret user intent immediately for instant feedback
  const interpretIntent = (query: string): string => {
    const lower = query.toLowerCase();
    
    // Navigation intents
    if (/\b(go to|open|show|navigate|take me|find)\b/.test(lower)) {
      if (/home|profile|widget/.test(lower)) return 'Opening your home...';
      if (/discover|explore|search/.test(lower)) return 'Opening discovery...';
      if (/music|audio|track/.test(lower)) return 'Opening music...';
      if (/lab|physics|experiment/.test(lower)) return 'Opening lab...';
      if (/shop|store|merch/.test(lower)) return 'Opening shop...';
      if (/message|chat|dm/.test(lower)) return 'Opening messages...';
      if (/setting|config|preference/.test(lower)) return 'Opening settings...';
      return 'Navigating...';
    }
    
    // Search intents
    if (/\b(search|find|look for|where)\b/.test(lower)) {
      return 'Searching...';
    }
    
    // Action intents
    if (/\b(create|make|new|add)\b/.test(lower)) {
      return 'Preparing...';
    }
    
    // Question intents
    if (/\b(how|what|why|when|who|can|does)\b/.test(lower)) {
      return 'Analyzing...';
    }
    
    return 'Processing...';
  };

  // Comprehensive navigation handler - decisive and action-first
  const handleNavigation = (query: string, lower: string): { path: string; message: string } | null => {
    // Direct navigation commands
    if (/\b(go to|open|show|navigate|take me to?|find)\b.*\b(home|profile|widget|dashboard)\b/.test(lower)) {
      return { path: '/home', message: 'Opening your home.' };
    }
    
    if (/\b(discover|explore|search|browse|find)\b/.test(lower) && !/\blab\b/.test(lower)) {
      return { path: '/discover', message: 'Opening discovery.' };
    }
    
    if (/\b(create|new post|make|upload|share)\b/.test(lower)) {
      return { path: '/home?modal=create', message: 'Opening creator.' };
    }
    
    if (/\b(music|audio|track|song|playlist|sound)\b/.test(lower)) {
      return { path: '/music', message: 'Opening music.' };
    }
    
    if (/\b(lab|physics|experiment|science|research)\b/.test(lower)) {
      return { path: '/lab', message: 'Opening lab.' };
    }
    
    if (/\b(shop|store|merch|buy|purchase|sell)\b/.test(lower)) {
      return { path: '/shop', message: 'Opening shop.' };
    }
    
    if (/\b(message|chat|dm|inbox|conversation)\b/.test(lower)) {
      return { path: '/messages', message: 'Opening messages.' };
    }
    
    if (/\b(setting|config|preference|account|privacy)\b/.test(lower)) {
      return { path: '/settings', message: 'Opening settings.' };
    }
    
    if (/\b(edit|update|change).*\b(profile|bio|avatar|picture)\b/.test(lower)) {
      return { path: '/edit-profile', message: 'Opening profile editor.' };
    }
    
    if (/\b(analytics|stats|data|metrics|performance)\b/.test(lower)) {
      return { path: '/analytics', message: 'Opening analytics.' };
    }
    
    // Check recent patterns for ambiguous queries
    if (userPatterns.frequentDestinations.length > 0 && /\b(usual|normal|regular|common)\b/.test(lower)) {
      const dest = userPatterns.frequentDestinations[0];
      return { path: dest, message: `Opening ${dest.split('/')[1] || 'home'}.` };
    }
    
    return null;
  };

  const generateResponse = async (query: string): Promise<{ content: string; emotion: Message['emotion'] }> => {
    const lower = query.toLowerCase();

    if (/^(hi|hello|hey|good morning|good afternoon|good evening|sup|what's up|yo)\b/i.test(query.trim())) {
      return { content: getGreeting(), emotion: 'helpful' };
    }

    // Enhanced navigation - comprehensive and action-first
    const navResult = handleNavigation(query, lower);
    if (navResult) {
      trackNavigation(navResult.path);
      router.push(navResult.path);
      return { content: navResult.message, emotion: 'helpful' };
    }

    if (/\b(what can you do|help|capabilities|commands|features|assist)\b/.test(lower)) {
      return { content: getDetailedCapabilities(), emotion: 'excited' };
    }

    if (/\b(physics|experiment|lab|science|theory|quantum|ccc|confirmed connected chaos)\b/.test(lower)) {
      return { content: getPhysicsGuidance(lower), emotion: 'thoughtful' };
    }

    if (/\b(money|revenue|earn|payment|payout|monetiz|income)\b/.test(lower)) {
      return { content: getRevenueGuidance(), emotion: 'helpful' };
    }

    if (fullExperience) {
      const ui = executeUiAction(query, {
        navigate: (path) => router.push(path),
      });
      if (ui?.handled) {
        return { content: ui.reply, emotion: 'helpful' };
      }
    }

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

    return { content: getContextualResponse(query, context), emotion: 'thoughtful' };
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
    if (userPatterns.recentSearches.length > 0) {
      const recent = userPatterns.recentSearches[0];
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
        <div
          className="fixed inset-0 z-[10000] bg-white dark:bg-slate-950 flex flex-col safe-area"
          style={{ 
            animation: 'slideUpIn 300ms ease-out',
            paddingBottom: 'max(env(safe-area-inset-bottom), 16px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="relative">
                <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
                <div className="absolute -top-1 -right-1 w-2 h-2 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div>
                <span className="font-bold text-base sm:text-lg">Dr. Eam</span>
                <p className="text-[10px] sm:text-xs opacity-90">Your Creative AI Companion</p>
              </div>
            </div>
            <button
              onClick={() => {
                justClosedOverlayRef.current = Date.now();
                setIsChatOpen(false);
              }}
              className="p-1.5 sm:p-2 hover:bg-white/20 active:bg-white/30 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-3 sm:p-4 rounded-2xl shadow-md ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {message.role === 'assistant' && message.emotion && (
                    <div className="flex items-center gap-2 mb-2 text-sm opacity-70">
                      {getEmotionIcon(message.emotion)}
                      <span className="capitalize text-xs">{message.emotion}</span>
                    </div>
                  )}
                  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <span className="text-[10px] sm:text-xs opacity-60 mt-1.5 sm:mt-2 block">{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 sm:p-4 rounded-2xl shadow-md">
                  <div className="flex gap-2 items-center">
                    <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 animate-pulse" />
                    {interpretingIntent ? (
                      <span className="text-xs sm:text-sm text-purple-600 font-medium">{interpretingIntent}</span>
                    ) : (
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shrink-0">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white transition-all"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                aria-label="Send message"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1.5 sm:mt-2 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
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
