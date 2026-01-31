import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { VolumeX, TrendingUp, Filter, DollarSign, Plus, Trash2 } from 'lucide-react';

export default async function FeedSettingsPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch user's feed rules
  const { data: rulesData } = await supabase
    .from('feed_rules')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Demo rules when no real data exists
  const demoRules = [
    { id: 'demo-1', type: 'mute', target: 'Channel: Random Spam', value: { channel: 'random_spam' } },
    { id: 'demo-2', type: 'boost', target: 'Category: Science', value: { multiplier: 2 } },
    { id: 'demo-3', type: 'digest', target: 'News Updates', value: { frequency: 'daily' } },
  ];

  const rules = rulesData && rulesData.length > 0 ? rulesData : demoRules;

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Feed Rules</h1>

        <p className="text-slate-600 mb-8">
          Customize how content appears in your feed. Create rules to mute, boost, or filter content.
        </p>

        {/* Rule Types */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <VolumeX className="w-8 h-8 mx-auto mb-3 text-red-500" />
            <h3 className="font-semibold text-slate-900 mb-2">Mute</h3>
            <p className="text-sm text-slate-600">Hide content from specific sources</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <TrendingUp className="w-8 h-8 mx-auto mb-3 text-green-500" />
            <h3 className="font-semibold text-slate-900 mb-2">Boost</h3>
            <p className="text-sm text-slate-600">Prioritize content you care about</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <Filter className="w-8 h-8 mx-auto mb-3 text-blue-500" />
            <h3 className="font-semibold text-slate-900 mb-2">Digest</h3>
            <p className="text-sm text-slate-600">Group similar content together</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <DollarSign className="w-8 h-8 mx-auto mb-3 text-purple-500" />
            <h3 className="font-semibold text-slate-900 mb-2">Budget</h3>
            <p className="text-sm text-slate-600">Limit content from certain sources</p>
          </div>
        </div>

        {/* Current Rules */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Your Rules</h2>
            <button className="flex items-center bg-slate-800 text-white px-4 py-2 rounded-md hover:bg-slate-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Rule
            </button>
          </div>

          {rules && rules.length > 0 ? (
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {rule.type === 'mute' && <VolumeX className="w-5 h-5 text-red-500" />}
                      {rule.type === 'boost' && <TrendingUp className="w-5 h-5 text-green-500" />}
                      {rule.type === 'digest' && <Filter className="w-5 h-5 text-blue-500" />}
                      {rule.type === 'budget' && <DollarSign className="w-5 h-5 text-purple-500" />}
                      <div>
                        <span className="font-medium text-slate-900 capitalize">{rule.type}</span>
                        <span className="text-slate-600 ml-2">{rule.target}</span>
                      </div>
                    </div>
                    <button className="text-red-600 hover:text-red-800">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {rule.value && (
                    <p className="text-sm text-slate-600 mt-2">
                      {JSON.stringify(rule.value)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600">No rules yet. Create your first rule to customize your feed!</p>
            </div>
          )}
        </div>

        {/* Quick Add */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Quick Add</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Mute a Channel</h3>
              <p className="text-sm text-slate-600 mb-3">Hide content from a specific YouTube channel or source</p>
              <input
                type="text"
                placeholder="Channel name"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
              />
              <button className="mt-3 w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">
                Add Mute Rule
              </button>
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-2">Boost Science Content</h3>
              <p className="text-sm text-slate-600 mb-3">Prioritize science and research content in your feed</p>
              <select className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500">
                <option>Boost by 1.5x</option>
                <option>Boost by 2x</option>
                <option>Boost by 3x</option>
              </select>
              <button className="mt-3 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm">
                Add Boost Rule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
