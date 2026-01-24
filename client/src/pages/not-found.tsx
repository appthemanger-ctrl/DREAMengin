import { Link } from "wouter";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Logo3D from "@/components/Logo3D";

export default function NotFound() {
  return (
    <div className="min-h-screen dream-bg flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="mb-8 flex justify-center">
          <Logo3D size="lg" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-strong p-10 max-w-md"
        >
          <h1 className="text-7xl font-bold gradient-text mb-4">404</h1>
          <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>
          <p className="text-muted-foreground mb-8">
            Looks like you've wandered into uncharted dream territory. 
            Let's get you back on track.
          </p>
          
          <div className="flex gap-4 justify-center">
            <Link href="/">
              <Button className="bg-primary hover:bg-primary/90 gap-2 glow-orange" data-testid="button-go-home">
                <Home className="w-4 h-4" />
                Go Home
              </Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="gap-2"
              data-testid="button-go-back"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
