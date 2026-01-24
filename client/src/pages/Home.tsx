import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home as HomeIcon, 
  Music, 
  Gamepad2, 
  Users, 
  Settings, 
  Plus, 
  Sparkles,
  BookmarkIcon,
  LayoutGrid,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import Logo3D from '@/components/Logo3D';
import MiniWall from '../components/widgets/MiniWall';
import MusicPlayer from '../components/widgets/MusicPlayer';
import GamesWidget from '../components/widgets/GamesWidget';
import FriendsWidget from '../components/widgets/FriendsWidget';
import DreamAssistant from '../components/widgets/DreamAssistant';
import FeedCard from '@/components/FeedCard';
import CreatePostDialog from '@/components/CreatePostDialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  accentColor?: string;
}

export default function HomePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [showCreatePost, setShowCreatePost] = useState(false);

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/auth/me'],
  });

  const { data: feedItems = [], isLoading: feedLoading } = useQuery<any[]>({
    queryKey: ['/api/feed'],
    enabled: !!user,
  });

  const { data: widgets = [] } = useQuery({
    queryKey: ['/api/widgets'],
    enabled: !!user,
  });

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      queryClient.clear();
      setLocation('/');
    } catch (error) {
      toast({ title: 'Error logging out', variant: 'destructive' });
    }
  };

  const menuItems = [
    { id: 'home', label: 'Dream Home', icon: HomeIcon },
    { id: 'wall', label: 'Mini Wall', icon: LayoutGrid },
    { id: 'music', label: 'Music', icon: Music },
    { id: 'games', label: 'Games', icon: Gamepad2 },
    { id: 'friends', label: 'Friends', icon: Users },
    { id: 'saved', label: 'Saved Items', icon: BookmarkIcon },
  ];

  const displayName = user?.displayName || user?.username || 'Dreamer';

  if (userLoading) {
    return (
      <div className="min-h-screen dream-bg flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Logo3D size="lg" interactive={false} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen dream-bg flex">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        className="h-screen sticky top-0 glass-card border-r border-white/10 flex flex-col"
      >
        {/* Header */}
        <div className="p-4 flex items-center gap-3 border-b border-white/10">
          <Logo3D size="sm" onClick={() => setLocation('/')} />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1"
              >
                <h1 className="font-bold gradient-text">Dream Home</h1>
                <p className="text-xs text-muted-foreground truncate">{displayName}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto"
            data-testid="button-toggle-sidebar"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>

        {/* User Profile Card */}
        <div className="p-4">
          <div className={`glass p-4 ${sidebarCollapsed ? 'p-2' : ''}`}>
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border-2 border-primary/50">
                <AvatarImage src={user?.avatarUrl} />
                <AvatarFallback className="bg-primary/20 text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="font-medium truncate">{displayName}</p>
                    <p className="text-xs text-muted-foreground">@{user?.username}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeSection === item.id
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'hover:bg-white/5 text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`nav-${item.id}`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-white/10 space-y-2">
          <Link href="/settings">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all" data-testid="nav-settings">
              <Settings className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>Settings</span>}
            </button>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
            data-testid="button-logout"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">
                {activeSection === 'home' ? `Welcome back, ${displayName}` : menuItems.find(m => m.id === activeSection)?.label}
              </h1>
              <p className="text-muted-foreground">
                {activeSection === 'home' ? 'Your personalized digital space' : 'Explore and manage your content'}
              </p>
            </div>
            <Button 
              onClick={() => setShowCreatePost(true)}
              className="bg-primary hover:bg-primary/90 glow-orange gap-2" 
              data-testid="button-add-content"
            >
              <Plus className="w-4 h-4" />
              Add Content
            </Button>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {activeSection === 'home' && (
                <>
                  <MiniWall />
                  {feedLoading ? (
                    <div className="glass p-6 animate-pulse">
                      <div className="h-4 bg-white/10 rounded w-1/3 mb-4"></div>
                      <div className="h-20 bg-white/5 rounded"></div>
                    </div>
                  ) : feedItems.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="glass p-8 text-center"
                    >
                      <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
                      <h3 className="text-xl font-semibold mb-2">Your DreamFeed is empty</h3>
                      <p className="text-muted-foreground mb-4">
                        Start by adding content, connecting sources, or creating your first post.
                      </p>
                      <Button 
                        onClick={() => setShowCreatePost(true)}
                        className="bg-accent hover:bg-accent/90 glow-cyan"
                        data-testid="button-create-first-post"
                      >
                        Create First Post
                      </Button>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      {feedItems.map((item: any) => (
                        <FeedCard key={item.id} item={item} />
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeSection === 'wall' && <MiniWall fullView />}
              {activeSection === 'music' && <MusicPlayer fullView />}
              {activeSection === 'games' && <GamesWidget fullView />}
              {activeSection === 'friends' && <FriendsWidget fullView />}
              {activeSection === 'saved' && (
                <div className="glass p-8 text-center">
                  <BookmarkIcon className="w-12 h-12 mx-auto mb-4 text-accent" />
                  <h3 className="text-xl font-semibold mb-2">Saved Items</h3>
                  <p className="text-muted-foreground">Your bookmarked content will appear here.</p>
                </div>
              )}
            </div>

            {/* Sidebar Widgets */}
            <div className="space-y-6">
              <DreamAssistant />
              {activeSection === 'home' && (
                <>
                  <MusicPlayer />
                  <GamesWidget />
                  <FriendsWidget />
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Create Post Dialog */}
      <CreatePostDialog isOpen={showCreatePost} onClose={() => setShowCreatePost(false)} />
    </div>
  );
}
