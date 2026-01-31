import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MessageSquare, Send, User } from 'lucide-react';

export default async function MessagesPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <MessageSquare className="w-8 h-8 mr-3 text-slate-700" />
          <h1 className="text-3xl font-bold text-slate-900">Messages</h1>
        </div>

        <div className="grid grid-cols-12 gap-0 bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Conversations List */}
          <div className="col-span-4 border-r border-slate-200">
            <div className="p-4 border-b border-slate-200">
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
            </div>
            <div className="h-96 overflow-y-auto">
              {/* Demo conversations */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`p-4 hover:bg-slate-50 cursor-pointer ${i === 1 ? 'bg-slate-50' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">User {i}</p>
                      <p className="text-sm text-slate-600 truncate">
                        Last message preview...
                      </p>
                    </div>
                    <span className="text-xs text-slate-400">2h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Message Area */}
          <div className="col-span-8 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <span className="font-medium text-slate-900">User 1</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {/* Received message */}
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="bg-slate-100 rounded-lg p-3 max-w-xs">
                    <p className="text-sm text-slate-700">Hey! How are you doing?</p>
                  </div>
                </div>

                {/* Sent message */}
                <div className="flex items-start space-x-3 justify-end">
                  <div className="bg-slate-800 text-white rounded-lg p-3 max-w-xs">
                    <p className="text-sm">I'm doing great! Thanks for asking.</p>
                  </div>
                  <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-medium text-white">You</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-200">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
                <button className="p-2 bg-slate-800 text-white rounded-md hover:bg-slate-700">
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
