import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Infinity, Music, Gamepad2, Users, Palette } from 'lucide-react';
import Logo3D from '@/components/Logo3D';
import { Button } from '@/components/ui/button';

export default function Landing() {
  const features = [
    { icon: Infinity, title: 'Your Digital Home', description: 'A personalized space that reflects who you are' },
    { icon: Music, title: 'Music Integration', description: 'Stream and share your favorite tracks' },
    { icon: Gamepad2, title: 'Gaming Hub', description: 'Connect Roblox and showcase your games' },
    { icon: Users, title: 'Friends & Feed', description: 'Stay connected with your community' },
    { icon: Palette, title: 'Fully Customizable', description: 'Make it uniquely yours with themes and widgets' },
    { icon: Sparkles, title: 'Dream Assistant', description: 'AI-powered help right at your fingertips' },
  ];

  return (
    <div className="min-h-screen dream-bg overflow-hidden">
      {/* Animated background particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white/20"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
            }}
            animate={{
              y: [null, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Logo3D size="sm" interactive={false} />
          <span className="text-xl font-bold gradient-text">DREAMengin</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost" className="text-foreground/80 hover:text-foreground" data-testid="link-login">
              Login
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-primary hover:bg-primary/90 glow-orange" data-testid="link-signup">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 flex justify-center"
          >
            <Logo3D size="xl" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl sm:text-7xl font-extrabold mb-6 leading-tight"
          >
            <span className="gradient-text">Dream</span>
            <span className="text-foreground">page</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl sm:text-3xl text-muted-foreground mb-4"
          >
            Your home on the internet
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto"
          >
            Private by default. Calm. Composable. Create your personalized digital space in minutes with music, games, feeds, and more.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap gap-4 justify-center"
          >
            <Link href="/signup">
              <Button size="lg" className="glass-button bg-primary/80 hover:bg-primary glow-orange text-lg px-8 py-6" data-testid="button-create-account">
                Create your space
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/home">
              <Button size="lg" variant="outline" className="glass-button text-lg px-8 py-6" data-testid="button-explore">
                Explore as guest
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.8 }}
          className="mt-24 max-w-6xl mx-auto w-full"
        >
          <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Everything You Need</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                className="glass p-6 hover:bg-white/10 transition-all group cursor-pointer"
                data-testid={`card-feature-${index}`}
              >
                <feature.icon className="w-10 h-10 mb-4 text-primary group-hover:text-accent transition-colors" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-24 text-center"
        >
          <p className="text-sm text-muted-foreground/60">
            By continuing you accept our Terms & Privacy
          </p>
        </motion.div>
      </main>
    </div>
  );
}
