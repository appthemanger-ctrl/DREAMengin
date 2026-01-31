import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MessageSquare, Send, User, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function MessagesPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/');
  }

  // Demo conversations data
  const conversations = [
    { id: 1, name: 'Dr. Eams', handle: 'dreams', lastMessage: 'Your project looks amazing! Let me know if you need help with the AI integration.', time: '2m', unread: 2, online: true, avatar: '/dr-eams.jpeg' },
    { id: 2, name: 'Night Producer', handle: 'nightbeats', lastMessage: 'Just sent you the new beat. Check it out when you get a chance!', time: '1h', unread: 0, online: true, avatar: null },
    { id: 3, name: 'Quantum Lab', handle: 'quantum', lastMessage: 'The simulation results are in. This is groundbreaking!', time: '3h', unread: 1, online: false, avatar: null },
    { id: 4, name: 'Creative Mind', handle: 'creative', lastMessage: 'Thanks for the collab invite!', time: '1d', unread: 0, online: false, avatar: null },
    { id: 5, name: 'Tech Wizard', handle: 'techwiz', lastMessage: 'Have you seen the new API updates?', time: '2d', unread: 0, online: false, avatar: null },
  ];

  // Demo messages for selected conversation
  const messages = [
    { id: 1, sender: 'them', text: 'Hey! I saw your latest project in the Labs.', time: '10:30 AM' },
    { id: 2, sender: 'them', text: 'Your project looks amazing! Let me know if you need help with the AI integration.', time: '10:31 AM' },
    { id: 3, sender: 'me', text: 'Thanks! I have been working on it for weeks. The hardest part was getting the neural network to work properly.', time: '10:35 AM' },
    { id: 4, sender: 'them', text: 'I can imagine. What framework are you using?', time: '10:36 AM' },
    { id: 5, sender: 'me', text: 'Using TensorFlow with a custom model. Want to check it out in the Lab?', time: '10:38 AM' },
    { id: 6, sender: 'them', text: 'Absolutely! Send me the link and I will take a look tonight.', time: '10:40 AM' },
  ];

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
        <div className="hidden md:flex items-center mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mr-3">
            <MessageSquare className="w-5 h-5 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
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
                  className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border-0 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[44px]"
                />
              </div>
            </div>
            <div className="max-h-[60vh] md:h-[60vh] overflow-y-auto">
              {conversations.map((conv, i) => (
                <div
                  key={conv.id}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${i === 0 ? 'bg-muted/50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      {conv.avatar ? (
                        <img src={conv.avatar} alt={conv.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">{conv.name[0]}</span>
                        </div>
                      )}
                      {conv.online && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-card" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-foreground">{conv.name}</p>
                        <span className="text-xs text-muted-foreground">{conv.time}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.lastMessage}
                      </p>
                    </div>
                    {conv.unread > 0 && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-primary-foreground">{conv.unread}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Area */}
          <div className="md:col-span-8 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src="/dr-eams.jpeg" alt="Dr. Eams" className="w-10 h-10 rounded-full object-cover" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                </div>
                <div>
                  <span className="font-medium text-foreground block">Dr. Eams</span>
                  <span className="text-xs text-green-500">Online</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'me' ? 'justify-end' : ''}`}>
                    {msg.sender === 'them' && (
                      <img src="/dr-eams.jpeg" alt="Dr. Eams" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    )}
                    <div className={`max-w-[75%] ${msg.sender === 'me' ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'} rounded-2xl ${msg.sender === 'me' ? 'rounded-br-md' : 'rounded-bl-md'} p-3`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-muted/50 border-0 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[48px]"
                />
                <button className="p-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors active:scale-95 min-w-[48px] min-h-[48px] flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
