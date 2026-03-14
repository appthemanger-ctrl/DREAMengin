'use client';

import { useState, useRef } from 'react';
import { Camera, Upload, X, Check, User, Image as ImageIcon, Link as LinkIcon, Palette, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ProfileData {
  id: string;
  handle: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_storage_path: string | null;
  cover_image_url: string | null;
  cover_storage_path: string | null;
  bio: string | null;
  links: unknown[];
  theme: unknown;
}

export default function ProfileEditor({ profile }: { profile: ProfileData }) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  
  const [formData, setFormData] = useState({
    display_name: profile.display_name || '',
    bio: profile.bio || '',
    avatar_url: profile.avatar_url || '',
    cover_image_url: profile.cover_image_url || '',
  });

  const [links, setLinks] = useState<Array<{ platform: string; url: string }>>(
    Array.isArray(profile.links) ? (profile.links as Array<{ platform: string; url: string }>) : []
  );

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    setUploadingAvatar(true);

    try {
      // Generate unique filename
      const ext = file.name.split('.').pop();
      const filename = `${profile.id}/${Date.now()}.${ext}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filename);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          avatar_storage_path: filename
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      // Update local state
      setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
      
      alert('Avatar updated successfully!');
    } catch (error: unknown) {
      console.error('Avatar upload error:', error);
      alert(`Failed to upload avatar: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be smaller than 10MB');
      return;
    }

    setUploadingCover(true);

    try {
      const ext = file.name.split('.').pop();
      const filename = `${profile.id}/${Date.now()}.${ext}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('covers')
        .upload(filename, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('covers')
        .getPublicUrl(filename);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          cover_image_url: publicUrl,
          cover_storage_path: filename
        })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setFormData(prev => ({ ...prev, cover_image_url: publicUrl }));
      
      alert('Cover image updated successfully!');
    } catch (error: unknown) {
      console.error('Cover upload error:', error);
      alert(`Failed to upload cover: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          bio: formData.bio,
          links: links.filter(l => l.url),
        })
        .eq('id', profile.id);

      if (error) throw error;

      alert('Profile updated successfully!');
    } catch (error: unknown) {
      console.error('Save error:', error);
      alert(`Failed to save profile: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    setLinks([...links, { platform: '', url: '' }]);
  };

  const updateLink = (index: number, field: 'platform' | 'url', value: string) => {
    const newLinks = [...links];
    newLinks[index][field] = value;
    setLinks(newLinks);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-950 dark:via-blue-950 dark:to-purple-950">
      {/* Mobile-optimized layout */}
      <div className="max-w-2xl mx-auto">
        {/* Cover Image Section */}
        <div className="relative h-48 md:h-64 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
          {formData.cover_image_url ? (
            <img
              src={formData.cover_image_url}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-white opacity-50" />
            </div>
          )}
          
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploadingCover}
            className="absolute bottom-4 right-4 bg-white dark:bg-slate-900 text-slate-900 dark:text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            {uploadingCover ? (
              <div className="w-4 h-4 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Change Cover</span>
          </button>
          
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverUpload}
            className="hidden"
          />
        </div>

        {/* Avatar Section */}
        <div className="px-4 sm:px-6 -mt-16 relative z-10 mb-6">
          <div className="flex items-end gap-4">
            <div className="relative">
              {formData.avatar_url ? (
                <img
                  src={formData.avatar_url}
                  alt="Avatar"
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-slate-900 shadow-xl object-cover"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white dark:border-slate-900 shadow-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-3xl font-bold">
                  {getInitials(formData.display_name || profile.handle)}
                </div>
              )}
              
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 bg-white dark:bg-slate-900 p-2 rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                {uploadingAvatar ? (
                  <div className="w-5 h-5 border-2 border-slate-900 dark:border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 text-slate-900 dark:text-white" />
                )}
              </button>
              
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                capture="user"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1 pb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {formData.display_name || profile.handle}
              </h2>
              <p className="text-slate-600 dark:text-slate-400">@{profile.handle}</p>
            </div>
          </div>
        </div>

        {/* Form Sections */}
        <div className="px-4 sm:px-6 space-y-6 pb-24">
          {/* Basic Info */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Basic Information
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={formData.display_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  placeholder="Your name"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell us about yourself..."
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition-all"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {formData.bio.length}/500 characters
                </p>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <LinkIcon className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Social Links
                </h3>
              </div>
              <button
                onClick={addLink}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Add Link
              </button>
            </div>

            <div className="space-y-3">
              {links.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                  No links added yet. Click "Add Link" to get started.
                </p>
              ) : (
                links.map((link, index) => (
                  <div key={index} className="flex gap-2">
                    <select
                      value={link.platform}
                      onChange={(e) => updateLink(index, 'platform', e.target.value)}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                    >
                      <option value="">Platform</option>
                      <option value="twitter">Twitter</option>
                      <option value="instagram">Instagram</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="website">Website</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => updateLink(index, 'url', e.target.value)}
                      placeholder="https://..."
                      className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      onClick={() => removeLink(index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Theme (Coming Soon) */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 opacity-60">
            <div className="flex items-center gap-3 mb-4">
              <Palette className="w-5 h-5 text-pink-600" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Theme Customization
              </h3>
              <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded">
                Coming Soon
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Customize your profile colors, fonts, and layout. Feature rolling out to Pro tier creators first.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Save Button (Mobile-Optimized) */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shadow-2xl z-50">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl font-bold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
