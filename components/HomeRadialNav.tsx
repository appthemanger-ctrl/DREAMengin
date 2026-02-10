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
        setIsChatOpen(false);
      } else {
        // Second press (nothing open): navigate to /home
        router.push('/home');
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
    setIsLoading(true);

    const response = await generateResponse(userText);
    addAssistantMessage(response.content, response.emotion);
    setIsLoading(false);
  };

  const generateResponse = async (query: string): Promise<{ content: string; emotion: Message['emotion'] }> => {
    const lower = query.toLowerCase();

    if (/^(hi|hello|hey|good morning|good afternoon|good evening|sup|what's up|yo)\b/i.test(query.trim())) {
      return { content: getGreeting(), emotion: 'helpful' };
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
    return `I'm designed to be your intelligent companion throughout DREAMengin. Here's what I can do for you:

**🧭 Navigation & Discovery**
I can guide you to any section of the platform, explain features as you encounter them, and help you discover capabilities you might not know about yet.

**🔬 Physics Lab Assistance**
I understand the Confirmed Connected Chaos framework and can help you design experiments, interpret results, and explore theoretical connections.

**💰 Revenue & Monetization**
I can explain our creator-first revenue model (85% to creators, 15% platform fee), help you optimize your earnings, and track your financial performance.

**🎯 Smart Actions**
When Full Experience mode is enabled, I can perform safe UI operations on your behalf—like navigating to pages, opening tools, or configuring settings.

**🛠️ System Maintenance**
I can communicate with InnerDreams, our automated system manager, to check for issues or request updates. This requires admin access.

**💬 Natural Conversation**
Most importantly, I'm here to have genuine conversations about your goals, answer questions, and help you think through creative challenges.

What aspect interests you most right now?`;
  };

  const getPhysicsGuidance = (query: string): string => {
    if (/\b(what is|explain|tell me about)\b.*\b(ccc|confirmed connected chaos)\b/i.test(query)) {
      return `The Confirmed Connected Chaos (CCC) framework is a constraint-layer approach to unification physics. Rather than introducing new particles or forces, it enforces a closed-ledger requirement linking chaos, entropy, and information.

The key insight is that what appears as "information loss" in systems like black holes is actually **information redistribution** to boundaries and records—nothing is fundamentally lost.

In DREAMengin's Physics Lab, you can:
- Design experiments testing CCC predictions
- Explore the 99-layer transfer architecture (ADA)
- Simulate coherence functionals across spectral windows
- Collaborate with other researchers on unified frameworks

Would you like me to help you set up your first experiment, or would you prefer to explore existing frameworks first?`;
    }

    if (/\b(create|start|new|design)\b.*\b(experiment|test|simulation)\b/i.test(query)) {
      return `Excellent! Let's set up a physics experiment. The Lab provides a structured environment for testing theories and hypotheses.

To create an experiment, we'll need to define:
1. **Hypothesis** - What are you testing?
2. **Methodology** - How will you test it?
3. **Parameters** - What variables are you controlling?
4. **Expected outcomes** - What would validate your hypothesis?

For CCC-based experiments, you can configure:
- Number of layers (traditionally 99, but adjustable)
- Coherence thresholds
- Spectral window definitions
- Boundary conditions

I can navigate you to the Lab now, or we can discuss your hypothesis first. What would be most helpful?`;
    }

    return `The Physics Lab is one of DREAMengin's most innovative features. It allows you to:

- Design and run theoretical experiments
- Test predictions from frameworks like CCC
- Collaborate with other researchers in real-time
- Visualize complex data relationships
- Share findings with the community

The Lab supports the full CCC/ADA architecture, including the 99-layer coherence model, entropy ledgers, and boundary-record channels.

What aspect of physics are you most interested in exploring?`;
  };

  const getRevenueGuidance = (): string => {
    return `DREAMengin implements a **creator-first revenue model** that's designed to be fair and transparent:

**💎 Revenue Split**
- **85% to creators** (you!)
- **15% to platform** (operational costs)

This is significantly more generous than most platforms. We believe creators deserve the lion's share of value they generate.

**💰 Revenue Sources**
- **Ad placements** on your profile/content
- **Merch sales** through the Shop
- **Music sales & streaming** revenue
- **Tip/donation** systems (coming soon)
- **Premium content** subscriptions (coming soon)

**📊 Transparent Tracking**
Every transaction is logged in your earnings dashboard. You can see:
- Gross revenue by source
- Platform fee calculations
- Net payouts
- Payment status and history

**⚡ Fast Payouts**
We process payments on a rolling basis. Once you reach the minimum threshold, funds are transferred directly to your connected account.

Would you like me to navigate you to your earnings dashboard, or do you have questions about a specific revenue stream?`;
  };

  const getContextualResponse = (query: string, ctx: ConversationContext): string => {
    const lower = query.toLowerCase();

    if (/\b(post|create|upload|publish|share)\b/.test(lower)) {
      return `Creating content is the heart of DREAMengin! To create a post:

1. Click **Create** in the navigation (or ask me to open it)
2. Choose your content type: text, images, video, or a mix
3. Add tags to help others discover your work
4. Set visibility: public, followers, or private
5. Hit publish!

**Pro tip:** Posts with clear descriptions and relevant tags get ~3x more engagement.

Want me to open the Create page for you?`;
    }

    if (/\b(profile|avatar|bio|about|page)\b/.test(lower)) {
      return `Your profile is your creative identity on DREAMengin. Here's what makes a great profile:

**Essential elements:**
- **Avatar** - A clear, recognizable image
- **Bio** - Tell people who you are and what you create
- **Links** - Connect your other platforms
- **Theme** - Customize colors and layout

Shall I navigate you to Edit Profile?`;
    }

    if (ctx.recentTopics.length > 0) {
      return `I notice we've been discussing ${ctx.recentTopics.slice(0, 2).join(' and ')}. I'm here to help with whatever you need.

You can ask me about features, navigation, your earnings, experiments, content strategy, or anything else related to DREAMengin.

What would you like to explore next?`;
    }

    return `I'm not entirely sure what you're looking for, but I'm here to help! Could you tell me more about what you'd like to accomplish?

Some things I excel at:
- Explaining platform features
- Helping with navigation
- Discussing the physics lab and experiments
- Clarifying revenue and monetization
- Performing safe UI actions

What's on your mind?`;
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
              onClick={() => setIsChatOpen(false)}
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
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
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
