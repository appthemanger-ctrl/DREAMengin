import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
const logoImage = '/dreamengin-logo.png';

interface Logo3DProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  interactive?: boolean;
}

export default function Logo3D({ size = 'md', onClick, interactive = true }: Logo3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useSpring(useTransform(y, [-100, 100], [15, -15]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-100, 100], [-15, 15]), { stiffness: 300, damping: 30 });
  
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-40 h-40',
    xl: 'w-64 h-64'
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };
  
  return (
    <motion.div
      ref={containerRef}
      className={`${sizeClasses[size]} relative cursor-pointer select-none`}
      style={{
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      data-testid="logo-3d"
    >
      <motion.div
        className="w-full h-full relative"
        style={{
          rotateX: interactive ? rotateX : 0,
          rotateY: interactive ? rotateY : 0,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          scale: isHovered ? 1.05 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{
            background: 'linear-gradient(135deg, hsl(24 95% 53% / 0.4), hsl(199 89% 48% / 0.4))',
            transform: 'translateZ(-20px)',
          }}
          animate={{
            opacity: isHovered ? 0.8 : 0.4,
            scale: isHovered ? 1.2 : 1,
          }}
        />
        
        {/* Main logo */}
        <motion.img
          src={logoImage}
          alt="DREAMengin"
          className="w-full h-full object-contain relative z-10"
          style={{
            filter: 'drop-shadow(0 0 20px hsl(24 95% 53% / 0.3)) drop-shadow(0 0 40px hsl(199 89% 48% / 0.2))',
            transform: 'translateZ(30px)',
          }}
          animate={{
            filter: isHovered 
              ? 'drop-shadow(0 0 30px hsl(24 95% 53% / 0.5)) drop-shadow(0 0 60px hsl(199 89% 48% / 0.4))'
              : 'drop-shadow(0 0 20px hsl(24 95% 53% / 0.3)) drop-shadow(0 0 40px hsl(199 89% 48% / 0.2))',
          }}
        />
        
        {/* Rotating ring effect */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-transparent"
          style={{
            borderImage: 'linear-gradient(135deg, hsl(24 95% 53%), hsl(199 89% 48%)) 1',
            transform: 'translateZ(10px)',
          }}
          animate={{
            rotate: isHovered ? 360 : 0,
            opacity: isHovered ? 0.6 : 0,
          }}
          transition={{
            rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
            opacity: { duration: 0.3 },
          }}
        />
      </motion.div>
    </motion.div>
  );
}
