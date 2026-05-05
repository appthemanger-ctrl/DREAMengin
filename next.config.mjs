/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],

  productionBrowserSourceMaps: false,

  // Partial Prerendering (PPR) — static shell + dynamic streaming slots.
  // In Next.js 16+ PPR is activated via `cacheComponents: true`.
  // All routes have been migrated from `dynamic = 'force-dynamic'` to
  // `connection()` from 'next/server', which is PPR-compatible.
  cacheComponents: true,

  experimental: {},

  // Exclude build-time config and tooling files from the server-function
  // output file tracing of routes that use fs/child_process host tools
  // (e.g. app/api/agent/session).  This prevents Turbopack's NFT tracer
  // from bundling next.config.mjs, tailwind.config.ts, and similar files
  // into serverless function zips.
  outputFileTracingExcludes: {
    "/api/agent/session": [
      "./next.config.mjs",
      "./tailwind.config.ts",
      "./postcss.config.*",
      "./tsconfig*.json",
      "./eslint.config.mjs",
      "./vitest.config.ts",
      "./playwright.config.ts",
    ],
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
        source: "/admin",
        destination: "/idari-console",
        permanent: false,
      },
      {
        source: "/admin/:path*",
        destination: "/idari-console/:path*",
        permanent: false,
      },
      {
        source: "/home",
        destination: "/homedream",
        permanent: false,
      },
      {
        source: "/edit-profile",
        destination: "/edit-profiledream",
        permanent: false,
      },
      {
        source: "/codespace",
        destination: "/engines/code",
        permanent: false,
      },
      {
        source: "/dreamengin",
        destination: "/homedream",
        permanent: false,
      },
      {
        source: "/physics-lab",
        destination: "/engines/lab",
        permanent: false,
      },
      {
        source: "/music",
        destination: "/daydream/music",
        permanent: false,
      },
      {
        source: "/music/:path*",
        destination: "/daydream/music/:path*",
        permanent: false,
      },
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
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          // unsafe-inline needed for Next.js inline scripts (RSC streaming, hydration data)
          // wasm-unsafe-eval allows WebAssembly.instantiate without enabling general eval()
          "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https://*.supabase.co https://*.googleapis.com https://*.gstatic.com https://i.ytimg.com https://*.scdn.co",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.spotify.com https://api.github.com https://assets.babylonjs.com",
          "media-src 'self' blob: https://*.supabase.co",
          "worker-src 'self' blob:",
          "frame-ancestors 'self'",
        ].join("; "),
      },
      {
        key: "X-Frame-Options",
        value: "SAMEORIGIN",
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
    ];

    const sabIsolationHeaders = [
      {
        key: "Cross-Origin-Embedder-Policy",
        value: "credentialless",
      },
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin",
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
      {
        source: "/daydream/:path*",
        headers: sabIsolationHeaders,
      },
      {
        source: "/engines/:path*",
        headers: sabIsolationHeaders,
      },
    ];
  },
};

export default nextConfig;
