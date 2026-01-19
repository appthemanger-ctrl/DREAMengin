import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, Zap, Users, TrendingUp, Star, ExternalLink, 
  Instagram, Youtube, ArrowLeft, Filter, Grid, List, MapPin
} from "lucide-react";
import { SiTiktok, SiTwitch, SiDiscord, SiSpotify } from "react-icons/si";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

const mockCreators = [
  {
    id: "1",
    name: "Alex Rivera",
    username: "alexcreates",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=alex",
    bio: "Digital creator & streamer. Building communities one stream at a time.",
    followers: "125K",
    platforms: ["twitch", "youtube", "discord"],
    featured: true,
    category: "Gaming",
    age: 24,
    city: "Los Angeles, CA"
  },
  {
    id: "2", 
    name: "Maya Chen",
    username: "mayavibes",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=maya",
    bio: "Music producer & content creator. New beats every week.",
    followers: "89K",
    platforms: ["spotify", "youtube", "instagram"],
    featured: true,
    category: "Music",
    age: 28,
    city: "New York, NY"
  },
  {
    id: "3",
    name: "Jordan Smith",
    username: "jordantech",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=jordan",
    bio: "Tech reviews & tutorials. Making technology accessible for everyone.",
    followers: "210K",
    platforms: ["youtube", "tiktok", "discord"],
    featured: false,
    category: "Tech",
    age: 31,
    city: "San Francisco, CA"
  },
  {
    id: "4",
    name: "Sam Taylor",
    username: "samtaylor",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=sam",
    bio: "Fitness coach & lifestyle creator. Transform your life with me.",
    followers: "156K",
    platforms: ["instagram", "youtube", "tiktok"],
    featured: false,
    category: "Fitness",
    age: 26,
    city: "Miami, FL"
  },
  {
    id: "5",
    name: "Casey Moore",
    username: "caseydesigns",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=casey",
    bio: "UI/UX designer sharing tips & inspiration. Design is everywhere.",
    followers: "67K",
    platforms: ["instagram", "youtube"],
    featured: true,
    category: "Design",
    age: 29,
    city: "Austin, TX"
  },
  {
    id: "6",
    name: "Riley Johnson",
    username: "rileygames",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=riley",
    bio: "Esports pro & content creator. Grinding ranked 24/7.",
    followers: "342K",
    platforms: ["twitch", "discord", "youtube"],
    featured: false,
    category: "Gaming",
    age: 22,
    city: "Seattle, WA"
  }
];

const categories = ["All", "Gaming", "Music", "Tech", "Fitness", "Design", "Lifestyle"];

const platformIcons: Record<string, any> = {
  twitch: SiTwitch,
  youtube: Youtube,
  discord: SiDiscord,
  spotify: SiSpotify,
  instagram: Instagram,
  tiktok: SiTiktok
};

const platformColors: Record<string, string> = {
  twitch: "#9146FF",
  youtube: "#FF0000",
  discord: "#5865F2",
  spotify: "#1DB954",
  instagram: "#E4405F",
  tiktok: "#00F2EA"
};

export default function Discover() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredCreators = mockCreators.filter(creator => {
    const matchesSearch = creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         creator.bio.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || creator.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredCreators = filteredCreators.filter(c => c.featured);

  return (
    <div className="min-h-screen bg-[#020617]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#0c1929]" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px]" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#020617]/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <a className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors" data-testid="link-back">
                <ArrowLeft size={18} />
                <span className="hidden sm:inline text-sm">Back</span>
              </a>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <Users size={18} className="text-white" />
              </div>
              <span className="text-lg font-black tracking-tight text-white">Discover</span>
            </div>
          </div>
          {!isAuthenticated && (
            <a href="/login" data-testid="button-login-discover">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0">
                Sign In
              </Button>
            </a>
          )}
        </div>
      </nav>

      <main className="relative z-10 pt-24 pb-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
              Discover Creators
            </h1>
            <p className="text-slate-400 max-w-xl mx-auto">
              Explore public pages from creators around the world. Find your next favorite content creator.
            </p>
          </motion.div>

          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input
                  placeholder="Search creators, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-11"
                  data-testid="input-search"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-cyan-600" : "border-slate-700 text-slate-400"}
                  data-testid="button-grid-view"
                >
                  <Grid size={18} />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-cyan-600" : "border-slate-700 text-slate-400"}
                  data-testid="button-list-view"
                >
                  <List size={18} />
                </Button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className={selectedCategory === cat 
                    ? "bg-cyan-600 hover:bg-cyan-500" 
                    : "border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"}
                  data-testid={`filter-${cat.toLowerCase()}`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </motion.div>

          {featuredCreators.length > 0 && selectedCategory === "All" && !searchQuery && (
            <motion.section 
              className="mb-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={18} className="text-cyan-400" />
                <h2 className="text-lg font-bold text-white">Featured Creators</h2>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredCreators.map((creator, i) => (
                  <motion.div
                    key={creator.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className="group p-5 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-slate-800/50 to-teal-500/10 border border-cyan-500/20 hover:border-cyan-500/40 transition-all"
                    data-testid={`featured-creator-${creator.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <img 
                        src={creator.avatar} 
                        alt={creator.name}
                        className="w-14 h-14 rounded-full bg-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${creator.username}`}>
                            <a className="font-bold text-white truncate hover:text-cyan-400 transition-colors cursor-pointer" data-testid={`link-featured-${creator.id}`}>
                              {creator.name}
                            </a>
                          </Link>
                          <Star size={14} className="text-yellow-500 flex-shrink-0" />
                        </div>
                        <p className="text-sm text-slate-400">@{creator.username} · {creator.age}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <MapPin size={10} />
                          <span>{creator.city}</span>
                        </div>
                        <p className="text-xs text-cyan-400 mt-1">{creator.followers} followers</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mt-3 line-clamp-2">{creator.bio}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex gap-2">
                        {creator.platforms.map(p => {
                          const Icon = platformIcons[p];
                          return Icon ? (
                            <div 
                              key={p}
                              className="w-7 h-7 rounded-lg flex items-center justify-center"
                              style={{ background: `${platformColors[p]}20` }}
                            >
                              <Icon size={14} style={{ color: platformColors[p] }} />
                            </div>
                          ) : null;
                        })}
                      </div>
                      <span className="text-xs text-slate-500">{creator.category}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-slate-400" />
              <h2 className="text-lg font-bold text-white">
                {searchQuery || selectedCategory !== "All" ? "Results" : "All Creators"}
              </h2>
              <span className="text-sm text-slate-500">({filteredCreators.length})</span>
            </div>

            {filteredCreators.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400">No creators found matching your search.</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCreators.map((creator, i) => (
                  <motion.div
                    key={creator.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="group p-5 rounded-2xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600 transition-all"
                    data-testid={`creator-${creator.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <img 
                        src={creator.avatar} 
                        alt={creator.name}
                        className="w-12 h-12 rounded-full bg-slate-700"
                      />
                      <div className="flex-1 min-w-0">
                        <Link href={`/profile/${creator.username}`}>
                          <a className="font-bold text-white truncate hover:text-cyan-400 transition-colors cursor-pointer block" data-testid={`link-creator-${creator.id}`}>
                            {creator.name}
                          </a>
                        </Link>
                        <p className="text-sm text-slate-400">@{creator.username} · {creator.age}</p>
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                          <MapPin size={10} />
                          <span>{creator.city}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400 mt-3 line-clamp-2">{creator.bio}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex gap-1.5">
                        {creator.platforms.slice(0, 3).map(p => {
                          const Icon = platformIcons[p];
                          return Icon ? (
                            <div 
                              key={p}
                              className="w-6 h-6 rounded flex items-center justify-center"
                              style={{ background: `${platformColors[p]}15` }}
                            >
                              <Icon size={12} style={{ color: platformColors[p] }} />
                            </div>
                          ) : null;
                        })}
                      </div>
                      <span className="text-xs text-slate-500">{creator.followers}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCreators.map((creator, i) => (
                  <motion.div
                    key={creator.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600 transition-all"
                    data-testid={`creator-list-${creator.id}`}
                  >
                    <img 
                      src={creator.avatar} 
                      alt={creator.name}
                      className="w-12 h-12 rounded-full bg-slate-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${creator.username}`}>
                          <a className="font-bold text-white hover:text-cyan-400 transition-colors cursor-pointer" data-testid={`link-list-${creator.id}`}>
                            {creator.name}
                          </a>
                        </Link>
                        <span className="text-sm text-slate-500">@{creator.username} · {creator.age}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {creator.city}
                        </span>
                        <span className="truncate">{creator.bio}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1.5">
                        {creator.platforms.slice(0, 3).map(p => {
                          const Icon = platformIcons[p];
                          return Icon ? (
                            <Icon key={p} size={16} style={{ color: platformColors[p] }} />
                          ) : null;
                        })}
                      </div>
                      <span className="text-sm text-slate-500">{creator.followers}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        </div>
      </main>
    </div>
  );
}
