'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bot, Maximize2, Minimize2, Send, X, Sparkles, 
  Brain, Lightbulb, TrendingUp, Zap 
} from 'lucide-react';

import { onInnerDreamsEvent } from '@/lib/agents/agentBus';
import { getDrEamsMode, onDrEamsModeChange } from '@/lib/agents/drEamsMode';
import { hasTaught, markTaught, onTeach } from '@/lib/agents/teachBus';
import { executeUiAction, getUiCapabilities } from '@/lib/agents/uiActions';

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

export default function AIAssistantEnhanced() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hello! I'm Dr. Eams, your creative companion in DREAMengin. Think of me as your guide through this platform—I'm here to help you discover features, understand complex concepts, and even run safe operations on your behalf. What brings you here today?",
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    
    // Update context based on conversation
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
    } catch (e: unknown) {
      return `⚠️ I encountered an error communicating with iDari: ${e?.message || 'Unknown error'}. This might be a temporary network issue—would you like me to try again?`;
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

    // Analyze user intent and generate contextual response
    const response = await generateResponse(userText);
    addAssistantMessage(response.content, response.emotion);
    setIsLoading(false);
  };

  const generateResponse = async (query: string): Promise<{ content: string; emotion: Message['emotion'] }> => {
    const lower = query.toLowerCase();

    // Greeting detection
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|sup|what's up|yo)\b/i.test(query.trim())) {
      return {
        content: getGreeting(),
        emotion: 'helpful',
      };
    }

    // Capability inquiry
    if (/\b(what can you do|help|capabilities|commands|features|assist)\b/.test(lower)) {
      return {
        content: getDetailedCapabilities(),
        emotion: 'excited',
      };
    }

    // Physics/Lab queries
    if (/\b(physics|experiment|lab|science|theory|quantum|ccc|confirmed connected chaos)\b/.test(lower)) {
      return {
        content: getPhysicsGuidance(lower),
        emotion: 'thoughtful',
      };
    }

    // Revenue/Monetization queries
    if (/\b(money|revenue|earn|payment|payout|monetiz|income)\b/.test(lower)) {
      return {
        content: getRevenueGuidance(),
        emotion: 'helpful',
      };
    }

    // UI Actions with Full Experience
    if (fullExperience) {
      const ui = executeUiAction(query, {
        navigate: (path) => router.push(path),
      });
      if (ui?.handled) {
        return {
          content: ui.reply,
          emotion: 'helpful',
        };
      }
    }

    // iDari bridge
    if (
      lower.includes('innerdreams') ||
      lower.includes('inner dreams') ||
      (/(fix|patch|update|repair)\b/.test(lower) && /(bug|error|issue|problem|build|deploy|vercel|site)/.test(lower))
    ) {
      const mode = lower.includes('bug') || lower.includes('check') || lower.includes('scan') ? 'bug-check' : 'update';
      const cleaned = query.replace(/inner\s*dreams\s*[:\-]?/i, '').trim();
      const reply = await callInnerDreams(mode, cleaned || query);
      return {
        content: reply,
        emotion: 'helpful',
      };
    }

    // Contextual smart response
    return {
      content: getContextualResponse(query, context),
      emotion: 'thoughtful',
    };
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
I understand the Confirmed Connected Chaos framework and can help you design experiments, interpret results, and explore theoretical connections. I'm particularly equipped to assist with the 99-layer coherence architecture.

**💰 Revenue & Monetization**
I can explain our creator-first revenue model (85% to creators, 15% platform fee), help you optimize your earnings, and track your financial performance.

**🎯 Smart Actions**
When Full Experience mode is enabled, I can perform safe UI operations on your behalf—like navigating to pages, opening tools, or configuring settings.

**🛠️ System Maintenance**
I can communicate with iDari, our automated system manager, to check for issues or request updates. This requires admin access.

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

**Custom Agreements**
High-volume creators or verified accounts may qualify for custom revenue share agreements with even better terms.

Would you like me to navigate you to your earnings dashboard, or do you have questions about a specific revenue stream?`;
  };

  const getContextualResponse = (query: string, ctx: ConversationContext): string => {
    const lower = query.toLowerCase();

    // Analyze query intent
    if (/\b(post|create|upload|publish|share)\b/.test(lower)) {
      return `Creating content is the heart of DREAMengin! To create a post:

1. Click **Create** in the navigation (or ask me to open it)
2. Choose your content type: text, images, video, or a mix
3. Add tags to help others discover your work
4. Set visibility: public, followers, or private
5. Hit publish!

**Pro tip:** Posts with clear descriptions and relevant tags get ~3x more engagement. The platform's discovery algorithm prioritizes quality content from active creators.

Want me to open the Create page for you?`;
    }

    if (/\b(profile|avatar|bio|about|page)\b/.test(lower)) {
      return `Your profile is your creative identity on DREAMengin. Here's what makes a great profile:

**Essential elements:**
- **Avatar** - A clear, recognizable image (supports upload via Edit Profile)
- **Bio** - Tell people who you are and what you create (150-500 characters)
- **Links** - Connect your other platforms
- **Theme** - Customize colors and layout

**Advanced features:**
- **Verified badge** - Available for established creators
- **Showcases** - Highlight your best work
- **Creator tier** - Automatically assigned based on engagement

Your profile is also where ad revenue is generated—a well-configured profile can increase your earnings potential significantly.

Shall I navigate you to Edit Profile?`;
    }

    if (/\b(analytics|stats|performance|views|engagement)\b/.test(lower)) {
      return `Analytics help you understand your impact and optimize your strategy. DREAMengin provides:

**📈 Core Metrics**
- Views and unique visitors
- Engagement rate (likes, comments, shares)
- Follower growth over time
- Content performance by type

**💰 Revenue Analytics**
- Earnings by source
- Ad performance (impressions, clicks, CPM)
- Best-performing revenue streams

**🎯 Audience Insights**
- Demographics (when available)
- Peak activity times
- Content preferences

**🔬 Experiment Metrics** (Lab)
- Run success rates
- Collaboration statistics
- Citation counts

The Analytics dashboard updates in real-time and offers exportable reports.

Want me to show you your current stats?`;
    }

    if (/\b(music|audio|track|song|album|playlist)\b/.test(lower)) {
      return `The Music section is built for audio creators. You can:

**🎵 Upload & Share**
- Direct uploads (MP3, WAV, FLAC)
- Platform embeds (SoundCloud, Spotify, etc.)
- Organize into albums or playlists

**💿 Monetization**
- Set prices for downloads
- Enable streaming revenue
- Offer exclusive tracks to premium followers

**🎧 Distribution**
Music you upload becomes part of the platform's discovery feed, where users exploring similar genres can find your work.

**Pro tip:** Add detailed metadata (genre, mood, instruments) to improve discoverability.

Ready to upload your first track?`;
    }

    if (/\b(ad|ads|advertising|promote|promotion)\b/.test(lower)) {
      return `DREAMengin's advertising system is unique—it's designed to empower creators as publishers:

**📺 For Content Creators**
- Configure ad slots on your profile
- Set your own pricing (day/week rates)
- Keep **85% of ad revenue**
- Full control over what ads appear

**📢 For Advertisers**
- Target specific creator audiences
- Transparent pricing
- Performance tracking
- Direct relationships with creators

**How it works:**
1. Create ad slots in your **Ads** settings
2. Set placement and pricing
3. Buyers purchase slots for specific periods
4. You approve or reject campaigns
5. Revenue auto-distributes (85% you, 15% platform)

Unlike traditional platforms where ads feel invasive, this model makes advertising a collaborative revenue stream between you and brands.

Want to configure your first ad slot?`;
    }

    // Fallback with context awareness
    if (ctx.recentTopics.length > 0) {
      return `I notice we've been discussing ${ctx.recentTopics.slice(0, 2).join(' and ')}. I'm here to help with whatever you need.

You can ask me about features, navigation, your earnings, experiments, content strategy, or anything else related to DREAMengin. I can also perform actions like opening pages or checking system status.

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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-4 rounded-full shadow-2xl hover:shadow-pink-500/50 transition-all hover:scale-110 z-50 animate-pulse"
        aria-label="Open Dr. Eams AI Assistant"
      >
        <Bot className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-6 right-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 transition-all ${
        isMinimized ? 'w-80 h-16' : 'w-[420px] h-[680px]'
      }`}
    >
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bot className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-lg">Dr. Eams</span>
            <p className="text-xs opacity-90">Your Creative AI Companion</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label={isMinimized ? 'Maximize' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 className="w-5 h-5" /> : <Minimize2 className="w-5 h-5" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[540px] bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] p-4 rounded-2xl shadow-md ${
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
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                  <span className="text-xs opacity-60 mt-2 block">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-md">
                  <div className="flex gap-2 items-center">
                    <Brain className="w-5 h-5 text-purple-600 animate-pulse" />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-800 dark:text-white transition-all"
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                aria-label="Send message"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </>
      )}
    </div>
  );
}
