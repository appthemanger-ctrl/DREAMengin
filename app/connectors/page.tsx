import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Youtube, Sparkles, Link2, Trash2 } from 'lucide-react';

export default async function ConnectorsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's connected accounts
  const { data: tokensData } = await supabase
    .from('connectors_tokens')
    .select('*')
    .eq('user_id', user.id)
    .eq('revoked', false);

  // Demo tokens when no real data exists
  const demoTokens = [
    { id: 'demo-1', source: 'youtube', token: {} },
    { id: 'demo-2', source: 'demo', token: {} },
  ];

  const tokens = tokensData && tokensData.length > 0 ? tokensData : demoTokens;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Connected Accounts</h1>

        <p className="text-slate-600 mb-8">
          Connect your external accounts to automatically import content into your feed.
        </p>

        {/* Connected Accounts */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Your Connections</h2>
          
          {tokens && tokens.length > 0 ? (
            <div className="space-y-3">
              {tokens.map((token) => (
                <div key={token.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {token.source === 'youtube' && (
                      <Youtube className="w-6 h-6 text-red-500" />
                    )}
                    {token.source === 'demo' && (
                      <Sparkles className="w-6 h-6 text-purple-500" />
                    )}
                    <div>
                      <span className="font-medium text-slate-900 capitalize">{token.source}</span>
                      <p className="text-sm text-slate-600">Connected</p>
                    </div>
                  </div>
                  <button className="text-red-600 hover:text-red-800">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Link2 className="w-12 h-12 mx-auto text-slate-400 mb-3" />
              <p className="text-slate-600">No accounts connected yet.</p>
            </div>
          )}
        </div>

        {/* Available Connections */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Available Connections</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* YouTube */}
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Youtube className="w-8 h-8 mr-3 text-red-500" />
                <div>
                  <h3 className="font-semibold text-slate-900">YouTube</h3>
                  <p className="text-sm text-slate-600">Import videos from subscriptions</p>
                </div>
              </div>
              <button className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                Connect YouTube
              </button>
            </div>

            {/* Demo Connector */}
            <div className="border border-slate-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <Sparkles className="w-8 h-8 mr-3 text-purple-500" />
                <div>
                  <h3 className="font-semibold text-slate-900">Demo Connector</h3>
                  <p className="text-sm text-slate-600">Sample content for testing</p>
                </div>
              </div>
              <form action={async () => {
                'use server';
                // Add demo connector
                await supabase
                  .from('connectors_tokens')
                  .insert({
                    user_id: user.id,
                    source: 'demo',
                    token: {},
                    revoked: false
                  });
              }}>
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Connect Demo
                </button>
              </form>
            </div>

            {/* Spotify (Coming Soon) */}
            <div className="border border-slate-200 rounded-lg p-4 opacity-50">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Spotify</h3>
                  <p className="text-sm text-slate-600">Coming soon</p>
                </div>
              </div>
              <button disabled className="w-full px-4 py-2 bg-slate-300 text-slate-500 rounded-md cursor-not-allowed">
                Coming Soon
              </button>
            </div>

            {/* Twitter (Coming Soon) */}
            <div className="border border-slate-200 rounded-lg p-4 opacity-50">
              <div className="flex items-center mb-3">
                <div className="w-8 h-8 bg-sky-500 rounded flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">X (Twitter)</h3>
                  <p className="text-sm text-slate-600">Coming soon</p>
                </div>
              </div>
              <button disabled className="w-full px-4 py-2 bg-slate-300 text-slate-500 rounded-md cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
