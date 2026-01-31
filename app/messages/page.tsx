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
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${i === 1 ? 'bg-muted/50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">User {i}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        Last message preview...
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">2h</span>
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
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <span className="font-medium text-foreground block">User 1</span>
                  <span className="text-xs text-muted-foreground">Online</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Received message */}
                <div className="flex items-end gap-2 max-w-[85%]">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md p-3">
                    <p className="text-sm text-foreground">Hey! How are you doing?</p>
                  </div>
                </div>

                {/* Sent message */}
                <div className="flex items-end gap-2 justify-end max-w-[85%] ml-auto">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md p-3">
                    <p className="text-sm">I am doing great! Thanks for asking.</p>
                  </div>
                </div>
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
