/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],

  productionBrowserSourceMaps: false,

  // Partial Prerendering (PPR) — static shell + dynamic streaming slots.
  // In Next.js 16+ PPR is activated via `cacheComponents: true`.
  // All routes have been migrated from `dynamic = 'force-dynamic'` to
  // `connection()` from 'next/server', which is PPR-compatible.
  cacheComponents: true,

  // Stream 3.1 — React Compiler (Next.js 16 / React 19)
  // Enables automatic memoization and reduced re-render overhead.
  // docs/ARCHITECTURE.md §10 — performance-first runtime.
  experimental: {
    reactCompiler: true,
  },

  images: {
    // Stream 8.2 — AVIF/WebP next-gen formats
    // AVIF ~50% smaller than JPEG; WebP fallback for older browsers.
    // Performance impact: better — smaller image payloads.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      { protocol: "https", hostname: "*.googleapis.com" },
      { protocol: "https", hostname: "*.gstatic.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "*.scdn.co" },
    ],
  },

  async redirects() {
    return [
      {
        source: "/edit",
        destination: "/settings",
        permanent: false,
      },
    ];
  },

  // COOP/COEP headers for SharedArrayBuffer (WebGPU, game engine, WASM threads)
  // Stream 7.1 — CSP Level 3 + security headers
  // docs/SECURITY.md — least-privilege content policy
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // unsafe-inline needed for Next.js inline scripts; strict-dynamic overrides in modern browsers
              "script-src 'self' 'strict-dynamic' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.googleapis.com https://*.gstatic.com https://i.ytimg.com https://*.scdn.co",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.spotify.com https://api.github.com",
              "media-src 'self' blob: https://*.supabase.co",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(self), payment=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
