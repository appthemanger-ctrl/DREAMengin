import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  User, 
  Shield, 
  Plug, 
  Sliders, 
  LogOut,
  ChevronRight
} from 'lucide-react';

export default async function SettingsPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Settings</h1>

        <div className="bg-white rounded-lg shadow-sm">
          {/* Account Section */}
          <div className="border-b border-slate-200">
            <div className="px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Account
              </h2>
            </div>
            <div className="px-6 pb-4">
              <Link
                href="/edit-profile"
                className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-md px-3 -mx-3"
              >
                <span className="text-slate-700">Edit Profile</span>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
              <Link
                href="/settings/account"
                className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-md px-3 -mx-3"
              >
                <span className="text-slate-700">Account Information</span>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Privacy Section */}
          <div className="border-b border-slate-200">
            <div className="px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Privacy & Security
              </h2>
            </div>
            <div className="px-6 pb-4">
              <Link
                href="/settings/privacy"
                className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-md px-3 -mx-3"
              >
                <span className="text-slate-700">Privacy Settings</span>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
              <Link
                href="/settings/security"
                className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-md px-3 -mx-3"
              >
                <span className="text-slate-700">Security</span>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Connectors Section */}
          <div className="border-b border-slate-200">
            <div className="px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <Plug className="w-5 h-5 mr-2" />
                Connectors
              </h2>
            </div>
            <div className="px-6 pb-4">
              <Link
                href="/connectors"
                className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-md px-3 -mx-3"
              >
                <span className="text-slate-700">Manage Connections</span>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
              <Link
                href="/feed-settings"
                className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-md px-3 -mx-3"
              >
                <span className="text-slate-700">Feed Rules</span>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="border-b border-slate-200">
            <div className="px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center">
                <Sliders className="w-5 h-5 mr-2" />
                Preferences
              </h2>
            </div>
            <div className="px-6 pb-4">
              <Link
                href="/settings/notifications"
                className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-md px-3 -mx-3"
              >
                <span className="text-slate-700">Notifications</span>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
              <Link
                href="/settings/appearance"
                className="flex items-center justify-between py-3 hover:bg-slate-50 rounded-md px-3 -mx-3"
              >
                <span className="text-slate-700">Appearance</span>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Logout */}
          <div className="px-6 py-4">
            <form action={async () => {
              'use server';
              await supabase.auth.signOut();
            }}>
              <button
                type="submit"
                className="flex items-center w-full py-3 text-red-600 hover:bg-red-50 rounded-md px-3 -mx-3"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}