import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Universe-specific colors
        glow: {
          primary: "hsl(var(--glow-primary))",
          accent: "hsl(var(--glow-accent))",
        },
        node: {
          active: "hsl(var(--node-active))",
          inactive: "hsl(var(--node-inactive))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "torus-rotate": "torus-rotate 20s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "orbit": "orbit 15s linear infinite",
        "pulse-glow": "pulse-glow 3s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.5s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
      },
      keyframes: {
        "torus-rotate": {
          from: { transform: "rotateX(60deg) rotateZ(0deg)" },
          to: { transform: "rotateX(60deg) rotateZ(360deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        orbit: {
          from: { transform: "rotate(0deg) translateX(100px) rotate(0deg)" },
          to: { transform: "rotate(360deg) translateX(100px) rotate(-360deg)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "universe-grid": `linear-gradient(to right, hsl(var(--border) / 0.1) 1px, transparent 1px),
                          linear-gradient(to bottom, hsl(var(--border) / 0.1) 1px, transparent 1px)`,
        "nebula-flow": "var(--grad-nebula-flow)",
        "sunrise-heat": "var(--grad-sunrise-heat)",
        "deep-nebula": "var(--grad-deep-nebula)",
      },
      zIndex: {
        '1': '1',
      },
      boxShadow: {
        "glow-sm": "0 0 10px hsl(var(--glow-primary) / 0.2)",
        "glow-md": "0 0 20px hsl(var(--glow-primary) / 0.2), 0 0 40px hsl(var(--glow-primary) / 0.1)",
        "glow-lg": "0 0 30px hsl(var(--glow-primary) / 0.25), 0 0 60px hsl(var(--glow-primary) / 0.15)",
        "glow-accent": "0 0 20px hsl(var(--glow-accent) / 0.3)",
        "inner-glow": "inset 0 0 20px hsl(var(--glow-primary) / 0.1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
