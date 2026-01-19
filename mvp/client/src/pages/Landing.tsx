import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useState } from "react";
import { 
  Zap, Globe, Shield, Sparkles, ArrowRight, Play, 
  Instagram, Youtube, MessageCircle, Gamepad2, Tv, Users, Key, X
} from "lucide-react";
import { SiTiktok, SiDiscord, SiTwitch, SiSpotify, SiNetflix } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import ArtCanvas from "@/components/ArtCanvas";

const platforms = [
  { icon: Instagram, color: "#E4405F", name: "Instagram" },
  { icon: SiTiktok, color: "#00F2EA", name: "TikTok" },
  { icon: Youtube, color: "#FF0000", name: "YouTube" },
  { icon: SiDiscord, color: "#5865F2", name: "Discord" },
  { icon: SiTwitch, color: "#9146FF", name: "Twitch" },
  { icon: SiSpotify, color: "#1DB954", name: "Spotify" },
  { icon: SiNetflix, color: "#E50914", name: "Netflix" },
  { icon: MessageCircle, color: "#25D366", name: "WhatsApp" },
];

const features = [
  {
    icon: Globe,
    title: "40+ Platforms",
    description: "Connect all your social media, streaming, gaming, and creative platforms in one unified dashboard."
  },
  {
    icon: Zap,
    title: "Real-Time Control",
    description: "Manage notifications, switch between accounts, and control your digital presence instantly."
  },
  {
    icon: Shield,
    title: "Your Data, Your Way",
    description: "Privacy-first design. Your links, your rules. Build your public page or keep it private."
  },
  {
    icon: Sparkles,
    title: "Monetization Ready",
    description: "Add affiliate links, tip jars, and subscription buttons. Turn your audience into income."
  }
];

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Landing() {
  const [showKeyLogin, setShowKeyLogin] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAdminLogin = async () => {
    if (!adminKey.trim()) {
      toast({ title: "Error", description: "Please enter a key", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ key: adminKey }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json();
        toast({ title: "Access Denied", description: data.error || "Invalid key", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to authenticate", variant: "destructive" });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#020617] overflow-x-hidden">
      {showKeyLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0f172a] border border-cyan-500/30 rounded-2xl p-6 w-full max-w-sm mx-4 shadow-2xl shadow-cyan-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white font-display">Admin Access</h3>
              <button onClick={() => setShowKeyLogin(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-400 mb-4">Enter your master key to access the dashboard.</p>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
              placeholder="Enter master key..."
              className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none mb-4"
              data-testid="input-admin-key"
              autoFocus
            />
            <Button 
              onClick={handleAdminLogin}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white border-0"
              data-testid="button-submit-key"
            >
              {isLoading ? "Authenticating..." : "Unlock Dashboard"}
            </Button>
          </motion.div>
        </div>
      )}

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#0c1929]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[150px]" />
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-[#020617]/70 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white font-display">Dreamengin</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition-colors" data-testid="link-features">Features</a>
            <a href="#platforms" className="text-sm text-slate-400 hover:text-white transition-colors" data-testid="link-platforms">Platforms</a>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowKeyLogin(true)}
              className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800/50 transition-colors"
              title="Admin Login"
              data-testid="button-admin-key"
            >
              <Key size={18} />
            </button>
            <a href="/login" data-testid="button-login">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 shadow-lg shadow-cyan-500/25">
                Launch Control Room
                <ArrowRight size={16} className="ml-2" />
              </Button>
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-24">
        <section className="min-h-[90vh] flex items-center justify-center px-4 sm:px-6 relative overflow-hidden">
          {/* Procedural hero art (no external images) */}
          <div className="absolute inset-0 -z-10 pointer-events-none">
            <ArtCanvas scene="orbitMock" className="w-full h-full opacity-[0.22]" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/20 via-[#020617]/70 to-[#020617]" />
          </div>
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeInUp} className="mb-4">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Sparkles size={12} />
                Your Digital Empire Starts Here
              </span>
            </motion.div>
            
            <motion.h1 
              variants={fadeInUp}
              className="text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 font-display"
            >
              One Dashboard.
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                All Your Platforms.
              </span>
            </motion.h1>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed"
            >
              The homepage for your homepages. Connect 40+ platforms, customize your public page, 
              and monetize your audience—all from one powerful control room.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <a href="/login" data-testid="button-get-started">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 shadow-xl shadow-cyan-500/30 text-base px-8">
                  Get Started Free
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </a>
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-slate-700 text-slate-300 hover:bg-slate-800/50" data-testid="button-demo">
                <Play size={18} className="mr-2" />
                Watch Demo
              </Button>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
              <span>Free forever</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>No credit card</span>
              <span className="w-1 h-1 rounded-full bg-slate-600" />
              <span>40+ integrations</span>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="mt-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 max-w-xl mx-auto">
              <div className="flex items-center justify-center gap-2 text-emerald-400 text-sm font-semibold mb-1">
                <Shield size={16} />
                Your Data, Your Money
              </div>
              <p className="text-xs text-slate-400 text-center">
                We never see personal data—only public info, analytics, and ad stats you choose to share. 
                Sell ad space, buy promos, self-promote, or land sponsors. You keep your revenue—we only take 10% on withdrawals.
              </p>
            </motion.div>
          </motion.div>
        </section>

        <section id="platforms" className="py-20 px-4 sm:px-6">
          <motion.div 
            className="max-w-5xl mx-auto"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">Connect Everything</h2>
              <p className="text-slate-400">Social, streaming, gaming, messaging—all in one place.</p>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              {platforms.map((platform, i) => (
                <motion.div
                  key={platform.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="group"
                >
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg"
                    style={{ 
                      background: `linear-gradient(135deg, ${platform.color}15, ${platform.color}30)`,
                      boxShadow: `0 0 0 1px ${platform.color}30`
                    }}
                  >
                    <platform.icon size={28} style={{ color: platform.color }} />
                  </div>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center bg-slate-800/50 border border-slate-700/50"
              >
                <span className="text-slate-400 text-sm font-bold">+32</span>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="py-20 px-4 sm:px-6">
          <motion.div 
            className="max-w-6xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeInUp} className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                Built for Creators
              </h2>
              <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Everything you need to manage your digital presence and grow your audience.
              </p>
            </motion.div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  variants={fadeInUp}
                  className="group p-6 rounded-2xl bg-gradient-to-b from-slate-800/50 to-slate-900/30 border border-slate-700/50 hover:border-cyan-500/30 transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon size={24} className="text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="py-20 px-4 sm:px-6">
          <motion.div 
            className="max-w-4xl mx-auto text-center"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-cyan-500/10 via-teal-600/10 to-emerald-600/10 border border-cyan-500/20">
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
                Ready to Take Control?
              </h2>
              <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
                Join thousands of creators managing their digital empires with Dreamengin.
              </p>
              <a href="/login" data-testid="button-launch-cta">
                <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white border-0 shadow-xl shadow-cyan-500/30 text-base px-10">
                  Launch Your Control Room
                  <ArrowRight size={18} className="ml-2" />
                </Button>
              </a>
            </div>
          </motion.div>
        </section>

        <footer className="py-12 px-4 sm:px-6 border-t border-slate-800/50">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="text-sm font-bold text-slate-400">Dreamengin</span>
            </div>
            <p className="text-sm text-slate-500">
              2025 Dreamengin. The homepage for your homepages.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
