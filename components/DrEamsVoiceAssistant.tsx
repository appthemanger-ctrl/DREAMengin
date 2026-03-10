'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Bot, Send, X, Minimize2, Maximize2, Mic, MicOff, Volume2, VolumeX, Radio, Sparkles } from 'lucide-react';
import { onInnerDreamsEvent } from '@/lib/agents/agentBus';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isVoice?: boolean;
}

export default function DrEamsVoiceAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m Dr. Eams, your voice-enabled personal guide to Dreamengin. Say "Hey Doc" at any time to activate me, and I\'ll help you navigate the platform hands-free. What would you like to explore today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isWakeWordListening, setIsWakeWordListening] = useState(false);
  const [transcriptBuffer, setTranscriptBuffer] = useState('');
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<unknown>(null);
  const synthRef = useRef<unknown>(null);
  const router = useRouter();
  const pathname = usePathname();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for iDari activity and surface it inside Dr. Eams chat
  useEffect(() => {
    const unsubscribe = onInnerDreamsEvent((evt) => {
      // Avoid spamming: only surface status + errors, and occasional key logs
      const shouldSurface =
        evt.type === 'innerdreams:status' ||
        evt.status === 'error' ||
        (evt.type === 'innerdreams:log' && /completed|failed|queued|initiated|activated|paused|bug/i.test(evt.message));

      if (!shouldSurface) return;

      setMessages(prev => [...prev, {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        role: 'assistant',
        content: `iDari: ${evt.message}${evt.details ? `\n${evt.details}` : ''}`,
        timestamp: new Date(evt.timestamp)
      }]);
    });

    return () => unsubscribe();
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as unknown).SpeechRecognition || (window as unknown).webkitSpeechRecognition;
    const SpeechSynthesis = window.speechSynthesis;

    // Detect browser support once
    setSpeechSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: unknown) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.trim().toLowerCase();
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript + ' ';
          }
        }

        const fullTranscript = (finalTranscript + interimTranscript).toLowerCase();
        setTranscriptBuffer(fullTranscript);

        // Check for wake word
        if (!isListening && (fullTranscript.includes('hey doc') || fullTranscript.includes('hey doctor'))) {
          handleWakeWord();
          setTranscriptBuffer('');
        } 
        // Process command if actively listening
        else if (isListening && finalTranscript.trim()) {
          processVoiceCommand(finalTranscript.trim());
          setTranscriptBuffer('');
        }
      };

      recognition.onerror = (event: unknown) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
          // Restart recognition if no speech detected
          if (voiceEnabled && !isListening) {
            setTimeout(() => recognition.start(), 100);
          }
        }
      };

      recognition.onend = () => {
        // Auto-restart for wake word detection
        if (voiceEnabled && !isListening) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.log('Recognition restart failed:', e);
            }
          }, 100);
        }
      };

      recognitionRef.current = recognition;
    }

    synthRef.current = SpeechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [voiceEnabled, isListening]);

  const handleWakeWord = () => {
    setIsListening(true);
    setIsOpen(true);
    setIsMinimized(false);
    speak('Yes? How can I help you?');
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50]);
    }
  };

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setVoiceEnabled(true);
      setIsWakeWordListening(true);
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      speak('Voice control activated. Say "Hey Doc" whenever you need me!');
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      alert('Microphone access is required for voice control. Please enable it in your browser settings.');
      return false;
    }
  };

  const toggleVoiceControl = async () => {
    if (!voiceEnabled) {
      const granted = await requestMicrophonePermission();
      if (!granted) return;
    } else {
      setVoiceEnabled(false);
      setIsListening(false);
      setIsWakeWordListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  const speak = (text: string) => {
    if (!speechEnabled || !synthRef.current) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to use a male voice for Dr. Eams
    const voices = synthRef.current.getVoices();
    const maleVoice = voices.find((voice: unknown) => 
      voice.name.includes('Male') || voice.name.includes('Daniel') || voice.name.includes('David')
    );
    if (maleVoice) {
      utterance.voice = maleVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  const processVoiceCommand = async (command: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: command,
      timestamp: new Date(),
      isVoice: true
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Execute navigation or action commands
    const response = await executeCommand(command);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      isVoice: true
    };

    setMessages(prev => [...prev, aiMessage]);
    speak(response);
    setIsLoading(false);

    // Stop listening after command execution
    setTimeout(() => {
      setIsListening(false);
    }, 2000);
  };

  const callInnerDreams = async (mode: 'bug-check' | 'update', prompt?: string): Promise<string> => {
    try {
      const endpoint = mode === 'bug-check' ? '/api/innerdreams/check-bugs' : '/api/innerdreams/update';
      const payload: Record<string, unknown> = mode === 'bug-check'
        ? { userId: 'self' }
        : { prompt: prompt || 'General maintenance update', autoRefresh: false, bugCheck: true };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        return 'iDari needs an admin session. Please sign in as admin, then try again.';
      }
      if (res.status === 403) {
        return 'iDari is admin-only. Your account is not marked as admin.';
      }
      if (!res.ok) {
        const text = await res.text();
        return `iDari request failed (${res.status}). ${text?.slice(0, 140) || ''}`;
      }

      const json = await res.json();
      if (mode === 'bug-check') {
        const bugs = json?.bugsFound ?? 0;
        return bugs > 0
          ? `iDari bug check found ${bugs} potential issue(s). Check the admin audit log for details.`
          : 'iDari reports: all systems operational. No issues detected.';
      }

      return json?.message
        ? `iDari: ${json.message}`
        : 'iDari accepted the update request.';
    } catch (e: unknown) {
      return `iDari request error: ${e?.message || 'Unknown error'}`;
    }
  };

  const executeCommand = async (command: string): Promise<string> => {
    const lower = command.toLowerCase();

    // iDari command bridge (admin auto-updater / bug monitor)
    if (lower.includes('innerdreams') || lower.includes('inner dreams')) {
      if (lower.includes('bug') || lower.includes('check')) {
        return await callInnerDreams('bug-check');
      }
      // Everything else treated as an update request
      const cleaned = command
        .replace(/inner\s*dreams\s*[:\-]?/i, '')
        .replace(/please\s+/i, '')
        .trim();
      return await callInnerDreams('update', cleaned || 'Run a safe maintenance update.');
    }

    // Natural-language handoff: "fix the site", "fix a bug", "update the homepage"
    if (/(fix|patch|repair|hotfix|update)\b/.test(lower) && /(bug|error|crash|build|deploy|vercel|site|homepage)/.test(lower)) {
      return await callInnerDreams('update', command);
    }

    // Navigation commands
    if (lower.includes('go to home') || lower.includes('open home') || lower.includes('home page')) {
      router.push('/homedream');
      return 'Navigating to your home feed now.';
    }
    if (lower.includes('go to discover') || lower.includes('open discover') || lower.includes('explore')) {
      router.push('/discover');
      return 'Taking you to the discover page.';
    }
    if (lower.includes('go to messages') || lower.includes('open messages') || lower.includes('check messages')) {
      router.push('/messages');
      return 'Opening your messages.';
    }
    if (lower.includes('go to settings') || lower.includes('open settings')) {
      router.push('/settings');
      return 'Opening settings for you.';
    }
    if (lower.includes('go to analytics') || lower.includes('open analytics') || lower.includes('show analytics')) {
      router.push('/analytics');
      return 'Opening your analytics dashboard.';
    }
    if (lower.includes('go to shop') || lower.includes('open shop') || lower.includes('my store')) {
      router.push('/shop');
      return 'Opening your merch shop.';
    }
    if (lower.includes('go to music') || lower.includes('open music') || lower.includes('my music')) {
      router.push('/music');
      return 'Taking you to your music page.';
    }
    if (lower.includes('go to lab') || lower.includes('open lab') || lower.includes('lab projects')) {
      router.push('/lab');
      return 'Opening the lab for your research projects.';
    }
    if (lower.includes('go to profile') || lower.includes('my profile') || lower.includes('edit profile')) {
      router.push('/edit-profiledream');
      return 'Opening your profile editor.';
    }

    // Action commands
    if (lower.includes('create post') || lower.includes('new post') || lower.includes('make a post')) {
      return 'To create a post, click the Create button in the navigation bar, or use the floating action button in the corner. What would you like to post about?';
    }
    if (lower.includes('scroll up') || lower.includes('go up')) {
      window.scrollBy({ top: -300, behavior: 'smooth' });
      return 'Scrolling up.';
    }
    if (lower.includes('scroll down') || lower.includes('go down')) {
      window.scrollBy({ top: 300, behavior: 'smooth' });
      return 'Scrolling down.';
    }
    if (lower.includes('go back') || lower.includes('previous page')) {
      router.back();
      return 'Going back to the previous page.';
    }
    if (lower.includes('refresh') || lower.includes('reload')) {
      window.location.reload();
      return 'Refreshing the page now.';
    }

    // Information queries
    if (lower.includes('where am i') || lower.includes('current page') || lower.includes('what page')) {
      const pageName = pathname.split('/').pop() || 'home';
      return `You're currently on the ${pageName} page.`;
    }
    if (lower.includes('help') || lower.includes('what can you do')) {
      return 'I can help you navigate anywhere on Dreamengin. Try saying "go to home", "open messages", "show analytics", or "go to settings". I can also scroll pages, go back, refresh, and answer questions about the platform. What would you like to do?';
    }

    // Default: call the real Dr. Eams API
    try {
      const res = await fetch('/api/dr-eams/hf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: command }),
      });
      const data = await res.json().catch(() => ({}));
      return (
        (data && typeof data.reply === 'string' && data.reply) ||
        (data && typeof data.error === 'string' && `Dr. Eams: ${data.error}`) ||
        "I'm processing that for you. One moment..."
      );
    } catch {
      return "I couldn't reach the server right now. Please check your connection and try again.";
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const response = await executeCommand(input);
    
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: response,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMessage]);
    if (speechEnabled) {
      speak(response);
    }
    setIsLoading(false);
  };

  const getSmartResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('post') || lowerQuery.includes('create')) {
      return 'Great question! To create a post, simply click the "+ Create" button in the navigation bar, or you can press Ctrl+P for quick access. You can add text, images, and tags to make your posts engaging. Would you like me to walk you through the posting process step by step?';
    } else if (lowerQuery.includes('profile')) {
      return 'Your profile is your creative hub on Dreamengin! Navigate to Settings → Edit Profile to customize everything about your presence. You can update your bio, change your avatar, select a theme, showcase your music, display merchandise, and highlight your lab projects. Think of it as your personal portfolio that tells your story!';
    } else if (lowerQuery.includes('ad') || lowerQuery.includes('monetize')) {
      return 'Monetization is one of the most powerful features here! The Ad Marketplace lets you create ad slots on your profile and set your own pricing. You manage bookings, track performance, and revenue sharing is built right in. Head to the Ads page to get started. Many creators find this to be a great passive income stream!';
    } else if (lowerQuery.includes('lab') || lowerQuery.includes('science')) {
      return 'The Lab is where science meets collaboration! You can create projects with markdown notebooks, attach research files, embed interactive physics simulations, and invite other researchers to collaborate. It\'s like having your own research journal that\'s also a social platform. Perfect for documenting experiments and sharing discoveries!';
    } else if (lowerQuery.includes('feed') || lowerQuery.includes('dashboard')) {
      return 'Your dashboard is fully customizable to fit your workflow! You can drag and drop widgets to rearrange them however you like. Add widgets for notifications, promotions, quick stats, analytics, and more. Try clicking and dragging one of your widgets now to see how easy it is to personalize your experience!';
    } else if (lowerQuery.includes('music')) {
      return 'Music is a first-class citizen on Dreamengin! Head to the Music page to upload your tracks, create playlists, and embed them directly on your profile. We support Spotify integration, SoundCloud embeds, and direct uploads. Your music becomes part of your creative identity here!';
    } else if (lowerQuery.includes('shop') || lowerQuery.includes('merch')) {
      return 'Your merch shop is your direct line to your audience! You can add products with images, detailed descriptions, and pricing. Your fans can browse and purchase right from your profile without leaving the platform. It\'s a great way to build your brand and connect with supporters through physical goods!';
    } else if (lowerQuery.includes('connector') || lowerQuery.includes('youtube') || lowerQuery.includes('import')) {
      return 'Connectors are incredibly useful for aggregating your content! You can automatically import from platforms like YouTube, and you have full control over what appears in your feed. Set up rules to mute certain content, boost others, or create digest summaries. It\'s all about bringing your digital presence together in one place!';
    } else if (lowerQuery.includes('dark mode') || lowerQuery.includes('theme')) {
      return 'I see you\'re interested in customizing your visual experience! You can toggle between light and dark mode using the moon/sun icon in the navigation bar. Your preference is saved automatically, and you can switch anytime. The entire platform adapts beautifully to your chosen theme!';
    } else if (lowerQuery.includes('analytics')) {
      return 'Analytics help you understand your impact! Visit the Analytics page to see comprehensive metrics including views, likes, comments, follower growth, and revenue tracking. You can filter by time range, identify your top-performing content, and even export data for deeper analysis. Knowledge is power!';
    } else if (lowerQuery.includes('who are you') || lowerQuery.includes('what are you')) {
      return 'I\'m Dr. Eams, your dedicated voice-enabled AI assistant for Dreamengin! Think of me as your knowledgeable companion who knows every corner of this platform. I\'m here to help you succeed hands-free. Just say "Hey Doc" anytime you need me, and I\'ll spring into action!';
    } else {
      return 'I\'m here to help with anything Dreamengin-related! You can ask me about creating posts, customizing your profile, setting up ads, managing lab projects, organizing your feed, exploring analytics, or navigating anywhere on the platform. Try saying "Hey Doc, go to home" or "Hey Doc, open messages". What would you like to do?';
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-3">
        {/* Voice status indicator */}
        {voiceEnabled && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-2 shadow-lg flex items-center space-x-2 animate-in slide-in-from-bottom-2">
            <Radio className={`w-4 h-4 ${isListening ? 'text-red-500 animate-pulse' : 'text-green-500'}`} />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {isListening ? 'Listening...' : 'Say "Hey Doc"'}
            </span>
          </div>
        )}
        
        {/* Main button */}
        <button
          onClick={() => setIsOpen(true)}
          className="relative bg-gradient-to-r from-slate-700 to-slate-900 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
          aria-label="Open Dr. Eams AI Assistant"
        >
          <Bot className="w-6 h-6" />
          {voiceEnabled && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 transition-all ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-700 to-slate-900 text-white rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-semibold">Dr. Eams</span>
          {voiceEnabled && (
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label={speechEnabled ? 'Mute' : 'Unmute'}
            title={speechEnabled ? 'Mute voice' : 'Enable voice'}
          >
            {speechEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleVoiceControl}
            className={`p-1 rounded transition-colors ${
              voiceEnabled ? 'bg-green-500/20 text-green-400' : 'hover:bg-white/20'
            }`}
            aria-label={voiceEnabled ? 'Disable voice control' : 'Enable voice control'}
            title={voiceEnabled ? 'Disable "Hey Doc"' : 'Enable "Hey Doc"'}
          >
            {voiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>
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
          {/* Voice status banner */}
          {voiceEnabled && (
            <div className={`px-4 py-2 text-center text-sm border-b border-slate-200 dark:border-slate-700 ${
              isListening 
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
                : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
            }`}>
              {isListening ? (
                <span className="flex items-center justify-center space-x-2">
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span className="font-medium">I'm listening... speak your command</span>
                </span>
              ) : (
                <span>Say "Hey Doc" to activate voice control</span>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[480px]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {message.isVoice && (
                    <div className="flex items-center space-x-1 mb-1">
                      <Mic className="w-3 h-3 opacity-60" />
                      <span className="text-xs opacity-60">Voice</span>
                    </div>
                  )}
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
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder={voiceEnabled ? 'Type or say "Hey Doc"...' : 'Ask me anything...'}
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
