'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Search, ArrowLeft, Loader2, Plus, Music, FileText, X, Mail } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { formatRelativeTime } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

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
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio' | 'file';
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

/** Parse a subject line from message content formatted as "**Subject:** [subject]\n\n[body]" */
function parseSubject(content: string): { subject: string | null; body: string } {
  const match = content.match(/^\*\*Subject:\*\* (.+?)\n\n([\s\S]*)$/);
  if (match) return { subject: match[1].trim(), body: match[2].trimStart() };
  return { subject: null, body: content };
}

/** Format a message with an optional subject */
function formatMessageContent(subject: string, body: string): string {
  if (subject.trim()) return `**Subject:** ${subject.trim()}\n\n${body}`;
  return body;
}

/** Render message content with optional subject heading */
function MessageContent({ content, isMe }: { content: string; isMe: boolean }) {
  const { subject, body } = parseSubject(content);
  return (
    <>
      {subject && (
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ opacity: isMe ? 0.75 : 0.6 }}>
          📧 {subject}
        </p>
      )}
      <p className="text-sm">{body}</p>
    </>
  );
}

/** Get a preview string for a conversation list item */
function getConversationPreview(lastMessage: string): string {
  const { subject, body } = parseSubject(lastMessage);
  return subject ? `Re: ${subject}` : body;
}

export default function MessagesClient({ userId, initialConversations }: MessagesClientProps) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(initialConversations[0] || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [showSubjectField, setShowSubjectField] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File must be smaller than 50MB');
      return;
    }

    setSelectedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
  };

  const removeFile = () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileType = (file: File): 'image' | 'video' | 'audio' | 'file' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'file';
  };

  const uploadFile = async (file: File): Promise<string> => {
    const fileType = getFileType(file);
    const bucketMap: Record<string, string> = {
      image: 'images',
      video: 'videos',
      audio: 'audio',
      file: 'files',
    };

    const bucket = bucketMap[fileType];
    const ext = file.name.split('.').pop();
    const filename = `${userId}/messages/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filename);

    return publicUrl;
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
    if ((!newMessage.trim() && !selectedFile) || !selectedConv || isSending) return;

    const rawBody = newMessage.trim();
    const messageContent = formatMessageContent(newSubject, rawBody);
    setNewMessage('');
    setNewSubject('');
    setShowSubjectField(false);
    setIsSending(true);

    let mediaUrl: string | undefined;
    let mediaType: 'image' | 'video' | 'audio' | 'file' | undefined;

    try {
      // Upload file if present
      if (selectedFile) {
        mediaUrl = await uploadFile(selectedFile);
        mediaType = getFileType(selectedFile);
        removeFile();
      }

      // Optimistically add message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        sender_id: userId,
        content: messageContent,
        created_at: new Date().toISOString(),
        media_url: mediaUrl,
        media_type: mediaType,
      };
      setMessages(prev => [...prev, optimisticMessage]);

      // For demo conversations, just keep the optimistic message
      if (selectedConv.id.startsWith('demo-')) {
        setIsSending(false);
        return;
      }

      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: selectedConv.id,
          recipient_id: selectedConv.otherUser.id,
          content: messageContent,
          media_url: mediaUrl,
          media_type: mediaType,
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
      alert(err instanceof Error ? err.message : 'Failed to send message');
      // Remove only the failed optimistic message
      setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
      setNewMessage(rawBody); // Restore message input
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv => 
    conv.otherUser.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen de-sky-bg">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 backdrop-blur-xl" style={{ background: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(160,195,240,0.3)' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-2 -ml-2 rounded-full" style={{ background: 'rgba(160,195,240,0.12)' }} aria-label="Go home">
            <ArrowLeft className="w-5 h-5" style={{ color: 'var(--de-text-dim)' }} />
          </Link>
          <h1 className="text-xl font-bold" style={{ color: 'var(--de-heading)' }}>Messages</h1>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 md:py-8">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mr-3" style={{ background: 'rgba(42,138,184,0.1)' }}>
              <MessageSquare className="w-5 h-5" style={{ color: 'var(--de-accent)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--de-heading)' }}>Messages</h1>
          </div>
          <Link
            href="/messages/new"
            className="de-btn de-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Compose
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0 rounded-2xl overflow-hidden min-h-[70vh]" style={{ background: 'rgba(255,255,255,0.93)', border: '1px solid rgba(160,195,240,0.3)', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
          {/* Conversations List */}
          <div className="md:col-span-4" style={{ borderBottom: '1px solid rgba(160,195,240,0.2)' }}>
            <div className="p-4" style={{ borderBottom: '1px solid rgba(160,195,240,0.2)' }}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--de-text-dim)' }} />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none min-h-[44px]"
                  style={{ background: 'rgba(160,195,240,0.12)', border: '1px solid rgba(160,195,240,0.3)', color: 'var(--de-text)' }}
                />
              </div>
            </div>
            <div className="max-h-[60vh] md:h-[60vh] overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--de-text-dim)', opacity: 0.3 }} />
                  <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>No conversations yet</p>
                  <Link
                    href="/messages/new"
                    className="text-sm mt-2 inline-block"
                    style={{ color: 'var(--de-accent)' }}
                  >
                    Start a new conversation
                  </Link>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConv(conv)}
                    className="w-full p-4 text-left transition-colors"
                    style={{ background: selectedConv?.id === conv.id ? 'rgba(42,138,184,0.07)' : 'transparent', borderBottom: '1px solid rgba(160,195,240,0.12)' }}
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
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(42,138,184,0.12)' }}>
                            <span className="text-sm font-semibold" style={{ color: 'var(--de-accent)' }}>
                              {(conv.otherUser.display_name || conv.otherUser.handle || 'U')[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate" style={{ color: 'var(--de-heading)' }}>
                            {conv.otherUser.display_name || conv.otherUser.handle}
                          </p>
                          <span className="text-xs flex-shrink-0" style={{ color: 'var(--de-text-dim)' }}>
                            {formatRelativeTime(conv.updatedAt)}
                          </span>
                        </div>
                        {conv.lastMessage && (
                          <p className="text-sm truncate" style={{ color: 'var(--de-text-dim)' }}>
                            {getConversationPreview(conv.lastMessage)}
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
                <div className="p-4" style={{ borderBottom: '1px solid rgba(160,195,240,0.2)' }}>
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
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(42,138,184,0.12)' }}>
                        <span className="text-sm font-semibold" style={{ color: 'var(--de-accent)' }}>
                          {(selectedConv.otherUser.display_name || selectedConv.otherUser.handle || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="font-medium block" style={{ color: 'var(--de-heading)' }}>
                        {selectedConv.otherUser.display_name || selectedConv.otherUser.handle}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--de-text-dim)' }}>
                        @{selectedConv.otherUser.handle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 p-4 overflow-y-auto min-h-[40vh]">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--de-text-dim)' }} />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <MessageSquare className="w-12 h-12 mb-3" style={{ color: 'var(--de-text-dim)', opacity: 0.3 }} />
                      <p className="text-sm" style={{ color: 'var(--de-text-dim)' }}>No messages yet</p>
                      <p className="text-xs" style={{ color: 'var(--de-text-dim)', opacity: 0.7 }}>Send a message to start the conversation</p>
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
                              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(42,138,184,0.12)' }}>
                                <span className="text-xs font-semibold" style={{ color: 'var(--de-accent)' }}>
                                  {(selectedConv.otherUser.display_name || 'U')[0].toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div
                              className="max-w-[75%] rounded-2xl p-3"
                              style={isMe
                                ? { background: 'var(--de-heading)', color: 'white', borderBottomRightRadius: 6 }
                                : { background: 'rgba(42,138,184,0.08)', color: 'var(--de-text)', borderBottomLeftRadius: 6, border: '1px solid rgba(160,195,240,0.3)' }
                              }
                            >
                              {msg.media_url && msg.media_type && (
                                <div className="mb-2">
                                  {msg.media_type === 'image' && (
                                    <Image
                                      src={msg.media_url}
                                      alt="Shared image"
                                      width={300}
                                      height={200}
                                      className="rounded-lg max-w-full h-auto"
                                    />
                                  )}
                                  {msg.media_type === 'video' && (
                                    <video
                                      src={msg.media_url}
                                      controls
                                      className="rounded-lg max-w-full"
                                      style={{ maxHeight: '300px' }}
                                    />
                                  )}
                                  {msg.media_type === 'audio' && (
                                    <audio src={msg.media_url} controls className="w-full" />
                                  )}
                                  {msg.media_type === 'file' && (
                                    <a
                                      href={msg.media_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-sm underline"
                                    >
                                      <FileText className="w-4 h-4" />
                                      View file
                                    </a>
                                  )}
                                </div>
                              )}
                              {msg.content && <MessageContent content={msg.content} isMe={isMe} />}
                              <p className="text-xs mt-1" style={{ opacity: 0.6 }}>
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
                <form onSubmit={sendMessage} className="p-4" style={{ borderTop: '1px solid rgba(160,195,240,0.2)' }}>
                  {/* Subject field (email-style, toggleable) */}
                  {showSubjectField && (
                    <div className="mb-2">
                      <input
                        type="text"
                        placeholder="Subject (optional)"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl text-sm focus:outline-none"
                        style={{ background: 'rgba(160,195,240,0.12)', border: '1px solid rgba(160,195,240,0.3)', color: 'var(--de-text)' }}
                      />
                    </div>
                  )}

                  {/* File Preview */}
                  {selectedFile && filePreviewUrl && (
                    <div className="mb-3 relative inline-block">
                      <div className="relative rounded-lg p-2 max-w-xs" style={{ background: 'rgba(160,195,240,0.12)' }}>
                        {getFileType(selectedFile) === 'image' && (
                          <Image
                            src={filePreviewUrl}
                            alt="Preview"
                            width={200}
                            height={150}
                            className="rounded max-h-32 w-auto"
                          />
                        )}
                        {getFileType(selectedFile) === 'video' && (
                          <video src={filePreviewUrl} className="rounded max-h-32" />
                        )}
                        {(getFileType(selectedFile) === 'audio' || getFileType(selectedFile) === 'file') && (
                          <div className="flex items-center gap-2 p-2" style={{ color: 'var(--de-text)' }}>
                            {getFileType(selectedFile) === 'audio' ? <Music className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                            <span className="text-sm truncate max-w-[150px]">{selectedFile.name}</span>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={removeFile}
                          className="absolute -top-2 -right-2 rounded-full p-1"
                          style={{ background: '#dc4444', color: 'white' }}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {/* Hidden File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,audio/*"
                      capture="environment"
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* Email-compose toggle */}
                    <button
                      type="button"
                      onClick={() => setShowSubjectField((v) => !v)}
                      disabled={isSending}
                      className="p-3 rounded-xl transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center disabled:opacity-50"
                      style={{ background: showSubjectField ? 'rgba(42,138,184,0.15)' : 'rgba(160,195,240,0.12)', color: showSubjectField ? 'var(--de-accent)' : 'var(--de-text-dim)' }}
                      title="Toggle subject (email-style)"
                    >
                      <Mail className="w-5 h-5" />
                    </button>

                    {/* File Upload Buttons */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSending}
                      className="p-3 rounded-xl transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center disabled:opacity-50"
                      style={{ background: 'rgba(160,195,240,0.12)', color: 'var(--de-text-dim)' }}
                      title="Attach file"
                    >
                      <Plus className="w-5 h-5" />
                    </button>

                    <input
                      type="text"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none min-h-[48px]"
                      style={{ background: 'rgba(160,195,240,0.12)', border: '1px solid rgba(160,195,240,0.3)', color: 'var(--de-text)' }}
                    />
                    <button
                      type="submit"
                      disabled={(!newMessage.trim() && !selectedFile) || isSending}
                      className="p-3 rounded-xl transition-colors active:scale-95 min-w-[48px] min-h-[48px] flex items-center justify-center disabled:opacity-50"
                      style={{ background: 'var(--de-heading)', color: 'white' }}
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
                  <MessageSquare className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--de-text-dim)', opacity: 0.2 }} />
                  <p style={{ color: 'var(--de-text-dim)' }}>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
