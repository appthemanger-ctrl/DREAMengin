import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  Palette, 
  Bell, 
  Shield, 
  Link as LinkIcon,
  Save,
  Camera,
  Gamepad2,
  Music,
  MessageCircle
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import Logo3D from '@/components/Logo3D';

export default function Settings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('profile');

  const { data: user } = useQuery<{
    id: string;
    email: string;
    username: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    accentColor?: string;
  }>({
    queryKey: ['/api/auth/me'],
  });

  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    accentColor: '#f97316',
  });

  // Sync form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        bio: user.bio || '',
        accentColor: user.accentColor || '#f97316',
      });
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('PATCH', '/api/users/me', data);
    },
    onSuccess: () => {
      toast({ title: 'Settings saved!', description: 'Your changes have been applied.' });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
    onError: () => {
      toast({ title: 'Error saving settings', variant: 'destructive' });
    },
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'connections', label: 'Connections', icon: LinkIcon },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
  ];

  const connections = [
    { id: 'roblox', name: 'Roblox', icon: Gamepad2, color: 'text-red-400', connected: false },
    { id: 'spotify', name: 'Spotify', icon: Music, color: 'text-green-400', connected: false },
    { id: 'discord', name: 'Discord', icon: MessageCircle, color: 'text-indigo-400', connected: false },
  ];

  const accentColors = [
    '#f97316', // Orange
    '#0ea5e9', // Cyan
    '#8b5cf6', // Purple
    '#ef4444', // Red
    '#22c55e', // Green
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#06b6d4', // Teal
  ];

  return (
    <div className="min-h-screen dream-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/home">
            <Button size="icon" variant="ghost" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Logo3D size="sm" interactive={false} />
          <h1 className="text-xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="glass p-4 h-fit">
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${
                    activeTab === tab.id
                      ? 'bg-primary/20 text-primary'
                      : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="md:col-span-3 space-y-6">
            {activeTab === 'profile' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-6"
              >
                <h2 className="text-2xl font-bold mb-6">Profile Settings</h2>

                {/* Avatar */}
                <div className="flex items-center gap-6 mb-8">
                  <div className="relative">
                    <Avatar className="w-24 h-24 border-2 border-primary/50">
                      <AvatarImage src={user?.avatarUrl} />
                      <AvatarFallback className="bg-primary/20 text-primary text-2xl">
                        {(user?.displayName || user?.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary"
                      data-testid="button-change-avatar"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  <div>
                    <p className="font-semibold text-lg">{user?.displayName || user?.username}</p>
                    <p className="text-muted-foreground">@{user?.username}</p>
                  </div>
                </div>

                {/* Form */}
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">Display Name</label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                      className="glass-input w-full"
                      placeholder="Your display name"
                      data-testid="input-display-name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Bio</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      className="glass-input w-full h-24 resize-none"
                      placeholder="Tell the world about yourself..."
                      data-testid="input-bio"
                    />
                  </div>

                  <Button
                    onClick={() => updateMutation.mutate(formData)}
                    disabled={updateMutation.isPending}
                    className="bg-primary hover:bg-primary/90 gap-2"
                    data-testid="button-save-profile"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </Button>
                </div>
              </motion.div>
            )}

            {activeTab === 'appearance' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-6"
              >
                <h2 className="text-2xl font-bold mb-6">Appearance</h2>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-4">Accent Color</label>
                    <div className="flex flex-wrap gap-3">
                      {accentColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setFormData(prev => ({ ...prev, accentColor: color }))}
                          className={`w-10 h-10 rounded-full transition-all ${
                            formData.accentColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''
                          }`}
                          style={{ backgroundColor: color }}
                          data-testid={`color-${color}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="glass-card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">Use dark theme</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-dark-mode" />
                  </div>

                  <div className="glass-card p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">Animated Background</p>
                      <p className="text-sm text-muted-foreground">Enable gradient animations</p>
                    </div>
                    <Switch defaultChecked data-testid="switch-animated-bg" />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'connections' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-6"
              >
                <h2 className="text-2xl font-bold mb-6">Connected Accounts</h2>
                <p className="text-muted-foreground mb-6">
                  Connect your accounts to enhance your DREAMengin experience.
                </p>

                <div className="space-y-4">
                  {connections.map((conn) => (
                    <div key={conn.id} className="glass-card p-4 flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center ${conn.color}`}>
                        <conn.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{conn.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {conn.connected ? 'Connected' : 'Not connected'}
                        </p>
                      </div>
                      <Button
                        variant={conn.connected ? 'outline' : 'default'}
                        className={conn.connected ? '' : 'bg-accent hover:bg-accent/90'}
                        data-testid={`button-connect-${conn.id}`}
                      >
                        {conn.connected ? 'Disconnect' : 'Connect'}
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'notifications' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-6"
              >
                <h2 className="text-2xl font-bold mb-6">Notifications</h2>

                <div className="space-y-4">
                  {[
                    { title: 'Friend Requests', desc: 'Notify when someone sends a friend request' },
                    { title: 'Comments', desc: 'Notify when someone comments on your posts' },
                    { title: 'Likes', desc: 'Notify when someone likes your content' },
                    { title: 'New Features', desc: 'Get updates about new DREAMengin features' },
                  ].map((item, index) => (
                    <div key={index} className="glass-card p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch defaultChecked={index < 2} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'privacy' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="glass p-6"
              >
                <h2 className="text-2xl font-bold mb-6">Privacy & Security</h2>

                <div className="space-y-4">
                  {[
                    { title: 'Private Profile', desc: 'Only friends can see your full profile' },
                    { title: 'Show Online Status', desc: 'Let others see when you\'re online' },
                    { title: 'Allow Friend Requests', desc: 'Receive friend requests from others' },
                  ].map((item, index) => (
                    <div key={index} className="glass-card p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch defaultChecked={index !== 0} />
                    </div>
                  ))}
                </div>

                <div className="mt-8 pt-6 border-t border-white/10">
                  <h3 className="font-semibold text-destructive mb-4">Danger Zone</h3>
                  <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                    Delete Account
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
