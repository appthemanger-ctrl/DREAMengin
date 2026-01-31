'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Search, ArrowLeft, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatRelativeTime } from '@/lib/utils';

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    display_name: string | null;
    handle: string | null;
    avatar_url: string | null;
  };
  lastMessage?: string;
  updatedAt: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    display_name: string | null;
    handle: string | null;
    avatar_url: string | null;
  };
}

interface MessagesClientProps {
  userId: string;
  initialConversations: Conversation[];
}

export default function MessagesClient({ userId, initialConversations }: MessagesClientProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(initialConversations[0] || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Demo messages for demo conversations
  const demoMessages: Message[] = [
    { id: '1', sender_id: 'demo-user-1', content: 'Hey! I saw your latest project in the Labs.', created_at: new Date(Date.now() - 300000).toISOString() },
    { id: '2', sender_id: 'demo-user-1', content: 'Your project looks amazing! Let me know if you need help with the AI integration.', created_at: new Date(Date.now() - 240000).toISOString() },
    { id: '3', sender_id: userId, content: 'Thanks! I have been working on it for weeks.', created_at: new Date(Date.now() - 180000).toISOString() },
    { id: '4', sender_id: 'demo-user-1', content: 'What framework are you using?', created_at: new Date(Date.now() - 120000).toISOString() },
    { id: '5', sender_id: userId, content: 'Using TensorFlow with a custom model. Want to check it out?', created_at: new Date(Date.now() - 60000).toISOString() },
  ];

  useEffect(() => {
    if (selectedConv) {
      loadMessages(selectedConv.id);
    }
  }, [selectedConv]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async (conversationId: string) => {
    // For demo conversations, use demo messages
    if (conversationId.startsWith('demo-')) {
      setMessages(demoMessages);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/messages?conversation_id=${conversationId}`);
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv || isSending) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Optimistically add message
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      sender_id: userId,
      content: messageContent,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMessage]);

    // For demo conversations, just keep the optimistic message
    if (selectedConv.id.startsWith('demo-')) {
      setIsSending(false);
      return;
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConv.id,
          recipient_id: selectedConv.otherUser.id,
          content: messageContent,
        }),
      });

      const data = await res.json();
      if (data.message) {
        // Replace optimistic message with real one
        setMessages(prev => prev.map(m => 
          m.id === optimisticMessage.id ? data.message : m
        ));
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      setNewMessage(messageContent); // Restore message input
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.otherUser.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors">
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-xl font-bold text-foreground">Messages</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mr-3">
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Messages</h1>
          </div>
          <Link
            href="/messages/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Message
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 bg-card rounded-2xl border border-border overflow-hidden min-h-[70vh]">
          {/* Conversations List */}
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-border">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border-0 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[44px]"
                />
              </div>
            </div>
            <div className="max-h-[60vh] md:h-[60vh] overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">No conversations yet</p>
                  <Link
                    href="/messages/new"
                    className="text-primary text-sm hover:underline mt-2 inline-block"
                  >
                    Start a new conversation
                  </Link>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className={`w-full p-4 hover:bg-muted/50 transition-colors text-left ${
                      selectedConv?.id === conv.id ? 'bg-muted/50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        {conv.otherUser.avatar_url ? (
                          <Image
                            src={conv.otherUser.avatar_url}
                            alt={conv.otherUser.display_name || 'User'}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary">
                              {(conv.otherUser.display_name || conv.otherUser.handle || 'U')[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-foreground truncate">
                            {conv.otherUser.display_name || conv.otherUser.handle}
                          </p>
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {formatRelativeTime(conv.updatedAt)}
                          </span>
                        </div>
                        {conv.lastMessage && (
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.lastMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message Area */}
          <div className="md:col-span-8 flex flex-col">
            {selectedConv ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    {selectedConv.otherUser.avatar_url ? (
                      <Image
                        src={selectedConv.otherUser.avatar_url}
                        alt={selectedConv.otherUser.display_name || 'User'}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {(selectedConv.otherUser.display_name || selectedConv.otherUser.handle || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-foreground block">
                        {selectedConv.otherUser.display_name || selectedConv.otherUser.handle}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        @{selectedConv.otherUser.handle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto min-h-[40vh]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-12 h-12 text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground text-sm">No messages yet</p>
                      <p className="text-muted-foreground/70 text-xs">Send a message to start the conversation</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => {
                        const isMe = msg.sender_id === userId;
                        return (
                          <div key={msg.id} className={`flex items-end gap-2 ${isMe ? 'justify-end' : ''}`}>
                            {!isMe && selectedConv.otherUser.avatar_url && (
                              <Image
                                src={selectedConv.otherUser.avatar_url}
                                alt=""
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                            )}
                            {!isMe && !selectedConv.otherUser.avatar_url && (
                              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-semibold text-primary">
                                  {(selectedConv.otherUser.display_name || 'U')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div className={`max-w-[75%] ${
                              isMe 
                                ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md' 
                                : 'bg-muted text-foreground rounded-2xl rounded-bl-md'
                            } p-3`}>
                              <p className="text-sm">{msg.content}</p>
                              <p className={`text-xs mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {formatRelativeTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 px-4 py-3 bg-muted/50 border-0 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[48px]"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || isSending}
                      className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors active:scale-95 min-w-[48px] min-h-[48px] flex items-center justify-center disabled:opacity-50"
                    >
                      {isSending ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
