import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './app/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Space-dark palette (HomeDream + dark-UI components).
      // CSS variables in globals.css provide the Dream-Ice light-mode palette.
      colors: {
        'de-sky':       '#7DD3FC',
        'de-sky-dark':  '#0EA5E9',
        'de-gold':      '#F59E0B',
        'de-gold-light':'#FCD34D',
        'de-navy':      '#0F172A',
        'de-sheet':     '#0C1A2E',
        'de-card':      '#111D30',
        'de-border':    'rgba(125,211,252,0.15)',
        'de-heading':   '#F0F9FF',
        'de-text':      'rgba(255,255,255,0.85)',
        'de-text-dim':  'rgba(255,255,255,0.45)',
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      // Premium radii: docs/ARCHITECTURE.md §8 — radius family
      borderRadius: {
        'premium': '20px',
        'pill':    '9999px',
        'card':    '16px',
      },
      // Spring + expo easing for native-feel motion
      transitionTimingFunction: {
        'spring':    'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'expo-out':  'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring-md': 'cubic-bezier(0.25, 1.25, 0.5, 1)',
      },
      backgroundImage: {
        'sky-gradient':     'linear-gradient(135deg, #0C1A2E 0%, #0F2A4A 50%, #0C1A2E 100%)',
        'gold-shine':       'linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)',
        'sky-deep':         'linear-gradient(135deg, #020818 0%, #071428 50%, #020818 100%)',
        'gold-glow-grad':   'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
        'surface-elevated': 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)',
        'btn-sky':          'linear-gradient(135deg, #0EA5E9, #0284C7)',
      },
      boxShadow: {
        'sky-glow':        '0 0 24px rgba(125,211,252,0.25)',
        'gold-glow':       '0 0 24px rgba(245,158,11,0.35)',
        'card':            '0 4px 32px rgba(0,0,0,0.4)',
        'glass-elevated':  '0 2px 40px rgba(0,0,0,0.4), 0 0 80px rgba(125,211,252,0.05)',
        'btn-primary':     '0 4px 24px rgba(14,165,233,0.4)',
        'btn-primary-hov': '0 8px 32px rgba(14,165,233,0.6)',
      },
      animation: {
        'float':      'float 6s ease-in-out infinite',
        'gold-shine': 'goldShine 3s ease-in-out infinite',
        'fade-up':    'fadeUp 0.6s ease-out forwards',
        'pulse-ring': 'pulseRing 2s ease-out infinite',
        'entrance':   'pageEnter 0.4s cubic-bezier(0.16,1,0.3,1) forwards',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-12px)' },
        },
        goldShine: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseRing: {
          '0%':   { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        pageEnter: {
          '0%':   { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
