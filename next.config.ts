import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ── Experimental features ──────────────────────────────────────────────────
  experimental: {
    // PPR (Partial Pre-rendering) for hybrid static/dynamic pages
    ppr: true,
    // Typed routes for type-safe navigation
    typedRoutes: true,
  },

  // ── Webpack customisation ──────────────────────────────────────────────────
  webpack(config) {
    // Allow importing .wasm files (lib/bus.wasm, WebAssembly GPU VM)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      layers: true,
    };
    return config;
  },

  // ── Image domains ──────────────────────────────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'supabase.co' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
      { protocol: 'https', hostname: 'yt3.ggpht.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  // ── Headers ───────────────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      // SSE routes need no buffering
      {
        source: '/api/forge/build',
        headers: [
          { key: 'X-Accel-Buffering', value: 'no' },
          { key: 'Cache-Control', value: 'no-cache, no-store' },
        ],
      },
    ];
  },

  // ── Rewrites ──────────────────────────────────────────────────────────────
  async rewrites() {
    return [
      // Legacy Dr. Eams route → new /api/ai/eams (308 redirect handled in route too)
      {
        source: '/api/dr-eams/run',
        destination: '/api/ai/eams',
      },
    ];
  },

  // ── TypeScript ────────────────────────────────────────────────────────────
  typescript: {
    // Don't block builds on type errors (type checking handled by CI separately)
    ignoreBuildErrors: false,
  },

  // ── ESLint ────────────────────────────────────────────────────────────────
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
