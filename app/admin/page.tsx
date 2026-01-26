import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Bot, Send, CircleCheck } from 'lucide-react';

export default async function AdminPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  // In MVP, we'll check for a specific admin flag in user metadata
  // In production, you'd want a more robust role system
  const isAdmin = user.user_metadata?.role === 'admin' || profile?.handle === 'admin';

  if (!isAdmin) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Bot className="w-8 h-8 mr-3 text-slate-700" />
          <h1 className="text-3xl font-bold text-slate-900">Admin - AI Updater</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">AI Update Request</h2>
          <p className="text-slate-600 mb-6">
            Submit a prompt describing the changes you want to make to the site. 
            The AI will generate the code changes for review.
          </p>

          <form action={async (formData) => {
            'use server';
            const prompt = formData.get('prompt') as string;
            
            // Log the request (MVP - no actual AI yet)
            await supabase
              .from('admin_audit_log')
              .insert({
                admin_id: user.id,
                action: 'ai_update_request',
                details: { prompt, status: 'pending' }
              });

            // In V2, this would call an Edge Function to generate code
          }}>
            <div className="mb-4">
              <label htmlFor="prompt" className="block text-sm font-medium text-slate-700 mb-2">
                Describe the changes you want to make:
              </label>
              <textarea
                id="prompt"
                name="prompt"
                rows={6}
                placeholder="Example: Add a dark mode toggle to the navbar with a moon icon that switches the theme..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
                <CircleCheck className="w-4 h-4 inline mr-1 text-green-500" />
                Request will be logged for manual review (MVP)
              </p>
              <button
                type="submit"
                className="flex items-center bg-slate-800 text-white px-6 py-2 rounded-md hover:bg-slate-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </button>
            </div>
          </form>
        </div>

        {/* Recent Requests */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Recent Requests</h2>
          <div className="space-y-3">
            <div className="border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">
                "Add a physics simulation widget to the lab page using PhET embeds"
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">2 hours ago</span>
                <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                  Pending Review
                </span>
              </div>
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <p className="text-sm text-slate-600 mb-2">
                "Update the navbar to include a messages icon with unread count badge"
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">1 day ago</span>
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  Completed
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}