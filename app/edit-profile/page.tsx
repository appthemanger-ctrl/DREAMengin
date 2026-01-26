'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';

export default function EditProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(data);
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
        theme: profile.theme || {},
        links: profile.links || []
      })
      .eq('id', profile.id);

    if (!error) {
      router.push(`/profile/${profile.handle}`);
    }

    setIsSaving(false);
  };

  const addLink = () => {
    setProfile({
      ...profile,
      links: [...(profile.links || []), { name: '', url: '' }]
    });
  };

  const updateLink = (index: number, field: 'name' | 'url', value: string) => {
    const newLinks = [...(profile.links || [])];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setProfile({ ...profile, links: newLinks });
  };

  const removeLink = (index: number) => {
    const newLinks = profile.links.filter((_: any, i: number) => i !== index);
    setProfile({ ...profile, links: newLinks });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  if (!profile) {
    return <div>Profile not found</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Edit Profile</h1>

        <form onSubmit={handleSave} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={profile.display_name || ''}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bio
            </label>
            <textarea
              value={profile.bio || ''}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 resize-none"
            />
          </div>

          {/* Theme */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Theme Color
            </label>
            <input
              type="color"
              value={profile.theme?.primary || '#1E3A5F'}
              onChange={(e) => setProfile({ 
                ...profile, 
                theme: { ...profile.theme, primary: e.target.value } 
              })}
              className="w-full h-10 border border-slate-300 rounded-md cursor-pointer"
            />
          </div>

          {/* Links */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Links
            </label>
            <div className="space-y-3">
              {(profile.links || []).map((link: any, index: number) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Name"
                    value={link.name}
                    onChange={(e) => updateLink(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                  <input
                    type="url"
                    placeholder="URL"
                    value={link.url}
                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeLink(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addLink}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Add link
              </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-slate-800 text-white px-6 py-2 rounded-md hover:bg-slate-700 disabled:opacity-50 flex items-center"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}