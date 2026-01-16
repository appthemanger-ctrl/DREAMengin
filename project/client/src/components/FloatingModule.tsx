import { useRef, useCallback, useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { X, Minus, ExternalLink, Send, Image, CheckCircle2, Clock, AlertCircle, LogOut, Link2, Share2, Heart, MessageCircle, Repeat2, Users, Sparkles } from "lucide-react";
import { SiInstagram, SiTiktok, SiX, SiYoutube, SiLinkedin, SiThreads, SiDiscord, SiTwitch, SiSpotify } from "react-icons/si";
import { ModuleId, MODULES, SOCIAL_LINKS, STREAMING_LINKS, GAMING_LINKS, MESSAGING_LINKS, CREATIVE_LINKS, WindowState } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const CONNECTED_PLATFORMS_KEY = "DREAMENGIN_CONNECTED_PLATFORMS";
const FOLLOWED_FRIENDS_KEY = "DREAMENGIN_FOLLOWED_FRIENDS";

interface Friend {
  id: string;
  name: string;
  username: string;
  avatar: string;
  platforms: string[];
}

interface FeedPost {
  id: string;
  platform: string;
  platformIcon: any;
  platformColor: string;
  authorId: string;
  author: string;
  avatar: string;
  content: string;
  image?: string;
  likes: number;
  comments: number;
  shares: number;
  time: string;
}

const availableFriends: Friend[] = [
  { id: "f1", name: "Alex Rivera", username: "alexcreates", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex", platforms: ["twitch", "youtube", "discord"] },
  { id: "f2", name: "Maya Chen", username: "mayavibes", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya", platforms: ["spotify", "instagram"] },
  { id: "f3", name: "Jordan Smith", username: "jordantech", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan", platforms: ["youtube", "tiktok", "x"] },
  { id: "f4", name: "Sam Taylor", username: "samtaylor", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam", platforms: ["instagram", "tiktok"] },
  { id: "f5", name: "Casey Moore", username: "caseydesigns", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=casey", platforms: ["instagram", "youtube"] },
  { id: "f6", name: "Riley Johnson", username: "rileygames", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=riley", platforms: ["twitch", "discord"] },
];

const allFeedPosts: FeedPost[] = [
  { id: "1", platform: "Instagram", platformIcon: SiInstagram, platformColor: "#E4405F", authorId: "f2", author: "mayavibes", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya", content: "New music dropping this Friday! Been working on this for months.", likes: 234, comments: 18, shares: 12, time: "2m ago" },
  { id: "2", platform: "TikTok", platformIcon: SiTiktok, platformColor: "#00F2EA", authorId: "f3", author: "jordantech", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan", content: "This new tech trend is wild! Had to break it down for you all.", likes: 1542, comments: 89, shares: 234, time: "15m ago" },
  { id: "3", platform: "X", platformIcon: SiX, platformColor: "#ffffff", authorId: "f3", author: "jordantech", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan", content: "The future of AI is here. Just tested the new model and the results are incredible.", likes: 892, comments: 156, shares: 445, time: "32m ago" },
  { id: "4", platform: "Discord", platformIcon: SiDiscord, platformColor: "#5865F2", authorId: "f6", author: "rileygames", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=riley", content: "Server event tonight at 8PM EST! Join us for the tournament.", likes: 67, comments: 23, shares: 8, time: "1h ago" },
  { id: "5", platform: "YouTube", platformIcon: SiYoutube, platformColor: "#FF0000", authorId: "f1", author: "alexcreates", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex", content: "New video just uploaded: How to grow your channel in 2024!", likes: 3421, comments: 287, shares: 156, time: "2h ago" },
  { id: "6", platform: "Twitch", platformIcon: SiTwitch, platformColor: "#9146FF", authorId: "f1", author: "alexcreates", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex", content: "Going LIVE in 30 minutes! Speedrunning the new expansion.", likes: 445, comments: 67, shares: 23, time: "3h ago" },
  { id: "7", platform: "Instagram", platformIcon: SiInstagram, platformColor: "#E4405F", authorId: "f4", author: "samtaylor", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam", content: "Morning workout complete! Starting the day right.", likes: 567, comments: 34, shares: 12, time: "4h ago" },
  { id: "8", platform: "Instagram", platformIcon: SiInstagram, platformColor: "#E4405F", authorId: "f5", author: "caseydesigns", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=casey", content: "New UI concept I've been working on. Thoughts?", likes: 892, comments: 67, shares: 45, time: "5h ago" },
  { id: "9", platform: "TikTok", platformIcon: SiTiktok, platformColor: "#00F2EA", authorId: "f4", author: "samtaylor", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam", content: "Quick 5-minute ab workout you can do anywhere!", likes: 2341, comments: 123, shares: 567, time: "6h ago" },
  { id: "10", platform: "Twitch", platformIcon: SiTwitch, platformColor: "#9146FF", authorId: "f6", author: "rileygames", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=riley", content: "That was an INSANE stream! Thanks everyone who showed up!", likes: 234, comments: 45, shares: 12, time: "8h ago" },
];

function loadConnectedPlatforms(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(CONNECTED_PLATFORMS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function saveConnectedPlatforms(platforms: Record<string, boolean>) {
  localStorage.setItem(CONNECTED_PLATFORMS_KEY, JSON.stringify(platforms));
}

function loadFollowedFriends(): Record<string, boolean> {
  try {
    const stored = localStorage.getItem(FOLLOWED_FRIENDS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function saveFollowedFriends(friends: Record<string, boolean>) {
  localStorage.setItem(FOLLOWED_FRIENDS_KEY, JSON.stringify(friends));
}

interface FloatingModuleProps {
  id: ModuleId;
  windowState: WindowState;
  onClose: () => void;
  onMinimize: () => void;
  onBringToFront: () => void;
  onUpdatePosition: (x: number, y: number) => void;
  onUpdateSize: (w: number, h: number) => void;
}

export function FloatingModule({
  id,
  windowState,
  onClose,
  onMinimize,
  onBringToFront,
  onUpdatePosition,
  onUpdateSize,
}: FloatingModuleProps) {
  const moduleRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isMobile = useIsMobile();
  const [isResizing, setIsResizing] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const { toast } = useToast();

  const [composeText, setComposeText] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Record<string, boolean>>({
    Instagram: true,
    TikTok: true,
    X: true,
    YouTube: false,
    LinkedIn: true,
    Threads: false,
  });
  const [isPosting, setIsPosting] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, type: "success", platform: "Instagram", message: "Post published successfully", time: "2 min ago", read: false },
    { id: 2, type: "pending", platform: "TikTok", message: "Video processing...", time: "5 min ago", read: false },
    { id: 3, type: "success", platform: "X", message: "Tweet sent! 12 likes already", time: "1 hour ago", read: false },
    { id: 4, type: "alert", platform: "Discord", message: "5 new messages in #general", time: "2 hours ago", read: false },
    { id: 5, type: "success", platform: "LinkedIn", message: "Post reached 500 views", time: "3 hours ago", read: true },
  ]);

  const [followedFriends, setFollowedFriends] = useState<Record<string, boolean>>(() => loadFollowedFriends());
  const [connectedPlatforms, setConnectedPlatforms] = useState<Record<string, boolean>>(() => loadConnectedPlatforms());
  const [showFriendPicker, setShowFriendPicker] = useState(false);

  const toggleFollowFriend = (friendId: string) => {
    setFollowedFriends(prev => {
      const updated = { ...prev, [friendId]: !prev[friendId] };
      saveFollowedFriends(updated);
      return updated;
    });
  };

  const connectPlatform = (platformId: string) => {
    setConnectedPlatforms(prev => {
      const updated = { ...prev, [platformId]: true };
      saveConnectedPlatforms(updated);
      toast({ title: "Connected!", description: `${platformId} is now connected to your hub.` });
      return updated;
    });
  };

  const disconnectAllPlatforms = () => {
    setConnectedPlatforms({});
    saveConnectedPlatforms({});
    setFollowedFriends({});
    saveFollowedFriends({});
    toast({ title: "Logged Out", description: "All platforms have been disconnected." });
  };

  const deleteAllUserData = async () => {
    localStorage.removeItem(CONNECTED_PLATFORMS_KEY);
    localStorage.removeItem(FOLLOWED_FRIENDS_KEY);
    localStorage.removeItem("DREAMENGIN_HUB_STATE_V1");
    localStorage.removeItem("DREAMENGIN_COLOR_PREF");
    setConnectedPlatforms({});
    setFollowedFriends({});
    try {
      await fetch("/api/delete-account", { method: "POST", credentials: "include" });
    } catch {}
    toast({ title: "Account Closed", description: "All your data has been permanently deleted." });
    window.location.href = "/landing";
  };

  const filteredFeedPosts = allFeedPosts.filter(post => followedFriends[post.authorId]);

  const togglePlatform = (name: string) => {
    setSelectedPlatforms(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const handlePostToAll = async () => {
    const activePlatforms = Object.entries(selectedPlatforms)
      .filter(([, active]) => active)
      .map(([name]) => name);
    
    if (!composeText.trim()) {
      toast({ title: "Error", description: "Please write something to post.", variant: "destructive" });
      return;
    }
    if (activePlatforms.length === 0) {
      toast({ title: "Error", description: "Please select at least one platform.", variant: "destructive" });
      return;
    }

    setIsPosting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newNotif = {
      id: Date.now(),
      type: "success" as const,
      platform: activePlatforms.join(", "),
      message: `Posted: "${composeText.slice(0, 30)}${composeText.length > 30 ? "..." : ""}"`,
      time: "Just now",
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
    setComposeText("");
    setIsPosting(false);
    toast({ title: "Posted!", description: `Your post was shared to ${activePlatforms.length} platform(s).` });
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast({ title: "Done", description: "All notifications marked as read." });
  };

  const moduleInfo = MODULES[id];
  const socialInfo = SOCIAL_LINKS[id];
  const streamingInfo = STREAMING_LINKS[id];
  const gamingInfo = GAMING_LINKS[id];
  const messagingInfo = MESSAGING_LINKS[id];
  const creativeInfo = CREATIVE_LINKS[id];

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest(".mod-btn") || (e.target as HTMLElement).closest(".resize-handle")) {
        return;
      }
      onBringToFront();
      setIsDragging(true);
      dragOffset.current = {
        x: e.clientX - windowState.x,
        y: e.clientY - windowState.y,
      };
      e.preventDefault();
    },
    [windowState.x, windowState.y, onBringToFront]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if ((e.target as HTMLElement).closest(".mod-btn") || (e.target as HTMLElement).closest(".resize-handle")) {
        return;
      }
      onBringToFront();
      setIsDragging(true);
      const touch = e.touches[0];
      dragOffset.current = {
        x: touch.clientX - windowState.x,
        y: touch.clientY - windowState.y,
      };
    },
    [windowState.x, windowState.y, onBringToFront]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent) => {
      onBringToFront();
      setIsResizing(true);
      resizeStart.current = {
        x: e.clientX,
        y: e.clientY,
        w: windowState.w,
        h: windowState.h,
      };
      e.preventDefault();
      e.stopPropagation();
    },
    [windowState.w, windowState.h, onBringToFront]
  );

  const handleResizeTouchStart = useCallback(
    (e: React.TouchEvent) => {
      onBringToFront();
      setIsResizing(true);
      const touch = e.touches[0];
      resizeStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        w: windowState.w,
        h: windowState.h,
      };
      e.stopPropagation();
    },
    [windowState.w, windowState.h, onBringToFront]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - 100, e.clientX - dragOffset.current.x));
        const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y));
        onUpdatePosition(newX, newY);
      }
      if (isResizing) {
        const deltaX = e.clientX - resizeStart.current.x;
        const deltaY = e.clientY - resizeStart.current.y;
        const newW = Math.max(260, resizeStart.current.w + deltaX);
        const newH = Math.max(220, resizeStart.current.h + deltaY);
        onUpdateSize(newW, newH);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (isDragging) {
        const newX = Math.max(0, Math.min(window.innerWidth - 100, touch.clientX - dragOffset.current.x));
        const newY = Math.max(0, Math.min(window.innerHeight - 100, touch.clientY - dragOffset.current.y));
        onUpdatePosition(newX, newY);
        e.preventDefault();
      }
      if (isResizing) {
        const deltaX = touch.clientX - resizeStart.current.x;
        const deltaY = touch.clientY - resizeStart.current.y;
        const newW = Math.max(260, resizeStart.current.w + deltaX);
        const newH = Math.max(220, resizeStart.current.h + deltaY);
        onUpdateSize(newW, newH);
        e.preventDefault();
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove, { passive: false });
      document.addEventListener("touchend", handleTouchEnd);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [isDragging, isResizing, onUpdatePosition, onUpdateSize]);

  const renderContent = () => {
    if (socialInfo) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{socialInfo.emoji}</span>
            <div>
              <div className="font-black text-sm" style={{ color: "var(--text-primary)" }}>
                {socialInfo.name}
              </div>
              <div className="text-xs text-secondary-glass">{socialInfo.handle}</div>
            </div>
          </div>
          <p className="text-sm text-secondary-glass">{socialInfo.hint}</p>
          <a
            href={socialInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient inline-flex items-center gap-2"
            data-testid={`link-${id}`}
          >
            Open {socialInfo.name}
            <ExternalLink size={14} />
          </a>
        </div>
      );
    }

    if (streamingInfo) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{streamingInfo.emoji}</span>
            <div>
              <div className="font-black text-sm" style={{ color: "var(--text-primary)" }}>
                {streamingInfo.name}
              </div>
            </div>
          </div>
          <p className="text-sm text-secondary-glass">{streamingInfo.hint}</p>
          <a
            href={streamingInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient inline-flex items-center gap-2"
            data-testid={`link-${id}`}
          >
            Open {streamingInfo.name}
            <ExternalLink size={14} />
          </a>
        </div>
      );
    }

    if (gamingInfo) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{gamingInfo.emoji}</span>
            <div>
              <div className="font-black text-sm" style={{ color: "var(--text-primary)" }}>
                {gamingInfo.name}
              </div>
              <div className="text-[10px] text-secondary-glass mt-1">
                {id === "roblox" && "Your games & experiences"}
                {id === "twitch" && "Live streams & clips"}
                {id === "discord" && "Servers & communities"}
              </div>
            </div>
          </div>
          <p className="text-sm text-secondary-glass">{gamingInfo.hint}</p>
          {id === "roblox" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.6)" }}>
                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>My Games</div>
                <div className="text-[10px] text-secondary-glass mt-1">3 published</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.6)" }}>
                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Robux</div>
                <div className="text-[10px] text-secondary-glass mt-1">2,450 R$</div>
              </div>
            </div>
          )}
          {id === "discord" && (
            <div className="p-3 rounded-lg" style={{ background: "rgba(88,101,242,0.15)", border: "1px solid rgba(88,101,242,0.3)" }}>
              <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                5 unread messages
              </div>
              <div className="text-[10px] text-secondary-glass mt-1">Across 3 servers</div>
            </div>
          )}
          <a
            href={gamingInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient inline-flex items-center gap-2"
            data-testid={`link-${id}`}
          >
            Open {gamingInfo.name}
            <ExternalLink size={14} />
          </a>
        </div>
      );
    }

    if (messagingInfo) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{messagingInfo.emoji}</span>
            <div>
              <div className="font-black text-sm" style={{ color: "var(--text-primary)" }}>
                {messagingInfo.name}
              </div>
              <div className="text-xs text-secondary-glass">{messagingInfo.handle}</div>
            </div>
          </div>
          <p className="text-sm text-secondary-glass">{messagingInfo.hint}</p>
          <a
            href={messagingInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient inline-flex items-center gap-2"
            data-testid={`link-${id}`}
          >
            Open {messagingInfo.name}
            <ExternalLink size={14} />
          </a>
        </div>
      );
    }

    if (creativeInfo) {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{creativeInfo.emoji}</span>
            <div>
              <div className="font-black text-sm" style={{ color: "var(--text-primary)" }}>
                {creativeInfo.name}
              </div>
              <div className="text-xs text-secondary-glass">{creativeInfo.handle}</div>
            </div>
          </div>
          <p className="text-sm text-secondary-glass">{creativeInfo.hint}</p>
          <a
            href={creativeInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gradient inline-flex items-center gap-2"
            data-testid={`link-${id}`}
          >
            Open {creativeInfo.name}
            <ExternalLink size={14} />
          </a>
        </div>
      );
    }

    switch (id) {
      case "customize":
        return (
          <div className="space-y-4">
            <p className="text-sm text-secondary-glass">
              Customize your Dreamengin homepage. Set your profile, choose which apps to display, and personalize your control room.
            </p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.6)" }}>
                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Profile Settings</div>
                <div className="text-[10px] text-secondary-glass mt-1">Display name, avatar, bio</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.6)" }}>
                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>App Layout</div>
                <div className="text-[10px] text-secondary-glass mt-1">Choose visible apps and order</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.6)" }}>
                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Public Page</div>
                <div className="text-[10px] text-secondary-glass mt-1">Your front-facing link hub</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.6)" }}>
                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Monetization</div>
                <div className="text-[10px] text-secondary-glass mt-1">Tips, subscriptions, affiliate links</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)" }}>
                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Theme</div>
                <div className="text-[10px] text-secondary-glass mt-1">Blue Mist (current)</div>
              </div>
            </div>
          </div>
        );
      case "feed":
        const followedCount = Object.values(followedFriends).filter(Boolean).length;
        return (
          <div className="space-y-3 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary-glass">
                {followedCount > 0 ? `Following ${followedCount} friends` : "Choose friends to follow"}
              </p>
              <button
                onClick={() => setShowFriendPicker(!showFriendPicker)}
                className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                style={{ background: "rgba(6,182,212,0.2)", border: "1px solid rgba(6,182,212,0.4)", color: "#06b6d4" }}
                data-testid="button-manage-friends"
              >
                <Users size={12} />
                {showFriendPicker ? "Hide" : "Manage"}
              </button>
            </div>
            
            {showFriendPicker && (
              <div className="p-3 rounded-lg space-y-2" style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(51,65,85,0.6)" }}>
                <div className="text-[10px] uppercase tracking-wider text-secondary-glass mb-2">Choose friends to follow:</div>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {availableFriends.map(friend => (
                    <button
                      key={friend.id}
                      onClick={() => toggleFollowFriend(friend.id)}
                      className="flex items-center gap-2 p-2 rounded-lg text-left transition-all"
                      style={{ 
                        background: followedFriends[friend.id] ? "rgba(6,182,212,0.2)" : "rgba(51,65,85,0.3)",
                        border: `1px solid ${followedFriends[friend.id] ? "rgba(6,182,212,0.5)" : "rgba(51,65,85,0.5)"}`
                      }}
                      data-testid={`toggle-friend-${friend.id}`}
                    >
                      <img src={friend.avatar} alt={friend.name} className="w-6 h-6 rounded-full" />
                      <div className="min-w-0">
                        <div className="text-[10px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{friend.name}</div>
                        <div className="text-[9px] text-secondary-glass truncate">@{friend.username}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide" style={{ maxHeight: showFriendPicker ? "180px" : "320px" }}>
              {filteredFeedPosts.length > 0 ? (
                filteredFeedPosts.map(post => (
                  <div 
                    key={post.id} 
                    className="p-3 rounded-lg space-y-2"
                    style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.6)" }}
                  >
                    <div className="flex items-center gap-2">
                      <img src={post.avatar} alt={post.author} className="w-8 h-8 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>@{post.author}</div>
                        <div className="flex items-center gap-1">
                          <post.platformIcon size={10} style={{ color: post.platformColor }} />
                          <span className="text-[9px] text-secondary-glass">{post.platform} • {post.time}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-primary)" }}>{post.content}</p>
                    <div className="flex items-center gap-4 pt-1">
                      <button className="flex items-center gap-1 text-[10px] text-secondary-glass hover:text-rose-400 transition-colors">
                        <Heart size={12} /> {post.likes}
                      </button>
                      <button className="flex items-center gap-1 text-[10px] text-secondary-glass hover:text-cyan-400 transition-colors">
                        <MessageCircle size={12} /> {post.comments}
                      </button>
                      <button className="flex items-center gap-1 text-[10px] text-secondary-glass hover:text-emerald-400 transition-colors">
                        <Repeat2 size={12} /> {post.shares}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-lg text-center" style={{ background: "rgba(30,64,175,0.2)", border: "1px solid rgba(30,64,175,0.4)" }}>
                  <Users size={24} className="mx-auto mb-2 text-cyan-400" />
                  <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                    No posts yet
                  </div>
                  <div className="text-[10px] text-secondary-glass mt-1">
                    Click "Manage" above to follow friends and see their posts
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case "page":
        return (
          <div className="space-y-3">
            <p className="text-sm text-secondary-glass">
              Your creative canvas. Build ideas, plan projects, and visualize dreams.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-lg" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.6)" }}>
                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>New Page</div>
              </div>
              <div className="p-3 rounded-lg" style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(51,65,85,0.6)" }}>
                <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Templates</div>
              </div>
            </div>
          </div>
        );
      case "messages":
        return (
          <div className="space-y-3">
            <p className="text-sm text-secondary-glass">
              All your signals in one place. DMs, mentions, and notifications.
            </p>
            <div className="p-3 rounded-lg" style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)" }}>
              <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                2 unread messages
              </div>
            </div>
          </div>
        );
      case "store":
        return (
          <div className="space-y-3">
            <p className="text-sm text-secondary-glass">
              Digital marketplace. Apps, extensions, and tools to enhance your runtime.
            </p>
            <div className="p-4 rounded-lg text-center" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(236,72,153,0.2))", border: "1px solid rgba(139,92,246,0.3)" }}>
              <Sparkles size={24} className="mx-auto mb-2 text-violet-400" />
              <div className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>Make Your Dream Bubble</div>
              <div className="text-[10px] text-secondary-glass mt-1">Build in-app apps—sell them, use them yourself, or share free</div>
              <div className="text-[9px] text-violet-400/70 mt-1">Design your app with Replit • Only on Dreamengin</div>
              <div className="mt-2 px-3 py-1 rounded-full text-[10px] font-semibold inline-block" style={{ background: "rgba(139,92,246,0.3)", color: "#a78bfa" }}>
                Coming Soon
              </div>
            </div>
          </div>
        );
      case "settings":
        const connectedCount = Object.values(connectedPlatforms).filter(Boolean).length;
        const friendsFollowedCount = Object.values(followedFriends).filter(Boolean).length;
        return (
          <div className="space-y-4">
            <p className="text-sm text-secondary-glass">
              Configure your personal runtime. Customize everything.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(15,23,42,0.6)" }}>
                <span className="text-xs" style={{ color: "var(--text-primary)" }}>Theme</span>
                <span className="text-xs text-secondary-glass">Neon Ice</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(15,23,42,0.6)" }}>
                <span className="text-xs" style={{ color: "var(--text-primary)" }}>Notifications</span>
                <span className="text-xs text-secondary-glass">On</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(15,23,42,0.6)" }}>
                <span className="text-xs" style={{ color: "var(--text-primary)" }}>Connected Platforms</span>
                <span className="text-xs text-secondary-glass">{connectedCount} active</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: "rgba(15,23,42,0.6)" }}>
                <span className="text-xs" style={{ color: "var(--text-primary)" }}>Following</span>
                <span className="text-xs text-secondary-glass">{friendsFollowedCount} friends</span>
              </div>
            </div>
            
            <div className="pt-2 border-t space-y-3" style={{ borderColor: "rgba(51,65,85,0.5)" }}>
              <div className="text-[10px] uppercase tracking-wider text-secondary-glass">Account Actions</div>
              <button
                onClick={disconnectAllPlatforms}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ 
                  background: "rgba(251,191,36,0.15)", 
                  border: "1px solid rgba(251,191,36,0.3)",
                  color: "#fbbf24"
                }}
                data-testid="button-logout-all"
              >
                <LogOut size={14} />
                Log Out of All Platforms
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Are you sure? This will permanently delete ALL your data and cannot be undone.")) {
                    deleteAllUserData();
                  }
                }}
                className="w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ 
                  background: "rgba(239,68,68,0.2)", 
                  border: "1px solid rgba(239,68,68,0.4)",
                  color: "#ef4444"
                }}
                data-testid="button-delete-account"
              >
                <X size={14} />
                Close Account & Delete All Data
              </button>
              <p className="text-[9px] text-secondary-glass text-center">
                We don't store your data - closing your account removes everything permanently
              </p>
            </div>
            
            <div className="p-3 rounded-lg" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)" }}>
              <div className="text-[10px] font-semibold text-emerald-400 mb-1">Privacy & Your Money</div>
              <p className="text-[9px] text-secondary-glass leading-relaxed">
                We never see personal data—only public info, analytics, and ad stats you share. Sell ad space, buy promos, 
                self-promote, or land sponsors. You keep your revenue—we only take 10% on withdrawals.
              </p>
            </div>
          </div>
        );
      case "vault":
        return (
          <div className="space-y-3">
            <p className="text-sm text-secondary-glass">
              Secure storage for your most important data. Encrypted and private.
            </p>
            <div className="p-3 rounded-lg" style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)" }}>
              <div className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                1 item needs attention
              </div>
            </div>
          </div>
        );
      case "compose":
        const platforms = [
          { icon: SiInstagram, name: "Instagram", color: "#E4405F" },
          { icon: SiTiktok, name: "TikTok", color: "#00F2EA" },
          { icon: SiX, name: "X", color: "#ffffff" },
          { icon: SiYoutube, name: "YouTube", color: "#FF0000" },
          { icon: SiLinkedin, name: "LinkedIn", color: "#0A66C2" },
          { icon: SiThreads, name: "Threads", color: "#ffffff" },
        ];
        return (
          <div className="space-y-4">
            <p className="text-sm text-secondary-glass">
              Post to all your connected platforms at once. Write once, share everywhere.
            </p>
            <div>
              <textarea
                placeholder="What's on your mind? Write your post here..."
                className="w-full h-24 p-3 rounded-lg text-sm resize-none"
                style={{ 
                  background: "rgba(15,23,42,0.8)", 
                  border: "1px solid rgba(51,65,85,0.6)",
                  color: "var(--text-primary)"
                }}
                value={composeText}
                onChange={(e) => setComposeText(e.target.value)}
                data-testid="input-compose"
              />
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg" style={{ background: "rgba(51,65,85,0.4)" }} data-testid="button-add-image">
                <Image size={16} className="text-slate-400" />
              </button>
            </div>
            <div className="space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-secondary-glass">Post to:</div>
              <div className="flex flex-wrap gap-2">
                {platforms.map((platform) => {
                  const isActive = selectedPlatforms[platform.name];
                  return (
                    <button
                      key={platform.name}
                      onClick={() => togglePlatform(platform.name)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs transition-all"
                      style={{ 
                        background: isActive ? `${platform.color}20` : "rgba(51,65,85,0.3)",
                        border: `1px solid ${isActive ? `${platform.color}40` : "rgba(51,65,85,0.5)"}`,
                        opacity: isActive ? 1 : 0.5
                      }}
                      data-testid={`toggle-${platform.name.toLowerCase()}`}
                    >
                      <platform.icon size={14} style={{ color: platform.color }} />
                      <span style={{ color: "var(--text-primary)" }}>{platform.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <button 
              onClick={handlePostToAll}
              disabled={isPosting}
              className="w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              style={{ 
                background: "linear-gradient(135deg, #06b6d4, #3b82f6)",
                color: "white"
              }}
              data-testid="button-post-all"
            >
              <Send size={16} />
              {isPosting ? "Posting..." : "Post to All Platforms"}
            </button>
          </div>
        );
      case "notifications":
        const unreadCount = notifications.filter(n => !n.read).length;
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-secondary-glass">
                {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
              </p>
              <button onClick={markAllRead} className="text-xs text-cyan-400" data-testid="button-mark-read">
                Mark all read
              </button>
            </div>
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {notifications.map((notif) => (
                <div 
                  key={notif.id}
                  className="p-3 rounded-lg flex items-start gap-3 transition-opacity"
                  style={{ 
                    background: "rgba(15,23,42,0.6)", 
                    border: "1px solid rgba(51,65,85,0.4)",
                    opacity: notif.read ? 0.6 : 1
                  }}
                  data-testid={`notification-${notif.id}`}
                >
                  <div className="mt-0.5">
                    {notif.type === "success" && <CheckCircle2 size={16} className="text-emerald-400" />}
                    {notif.type === "pending" && <Clock size={16} className="text-yellow-400" />}
                    {notif.type === "alert" && <AlertCircle size={16} className="text-cyan-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{notif.platform}</span>
                      <span className="text-[10px] text-slate-500">{notif.time}</span>
                    </div>
                    <p className="text-xs text-secondary-glass mt-0.5 truncate">{notif.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      default:
        return (
          <div className="text-sm text-secondary-glass">
            Module content for {moduleInfo.name}
          </div>
        );
    }
  };

  return (
    <div
      ref={moduleRef}
      className="module-container module-pop-in"
      style={{
        position: isMobile ? "fixed" : "absolute",
        left: isMobile ? 0 : windowState.x,
        top: isMobile ? 0 : windowState.y,
        width: isMobile ? "100vw" : windowState.w,
        height: isMobile ? "100dvh" : windowState.h,
        zIndex: windowState.z,
      }}
      onClick={onBringToFront}
      data-testid={`module-${id}`}
    >
      <div className="module-header" onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg">{moduleInfo.emoji}</span>
          <span
            className="text-[10px] tracking-[.22em] uppercase whitespace-nowrap overflow-hidden text-ellipsis text-secondary-glass"
          >
            {moduleInfo.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            className="mod-btn"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            title="Minimize"
            data-testid={`button-minimize-${id}`}
          >
            <Minus size={12} />
          </button>
          <button
            className="mod-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close"
            data-testid={`button-close-${id}`}
          >
            <X size={12} />
          </button>
        </div>
      </div>
      <div
        className="h-[calc(100%-46px)] overflow-auto p-3"
        style={{ color: "var(--text-primary)" }}
      >
        {renderContent()}
      </div>
      <div
        className="resize-handle"
        onMouseDown={handleResizeMouseDown}
        onTouchStart={handleResizeTouchStart}
        data-testid={`resize-handle-${id}`}
      />
    </div>
  );
}