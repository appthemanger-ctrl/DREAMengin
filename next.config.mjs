/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],

  productionBrowserSourceMaps: false,

  // Partial Prerendering (PPR) — static shell + dynamic streaming slots.
  // In Next.js 16+ PPR is activated via `cacheComponents: true`.
  // All routes have been migrated from `dynamic = 'force-dynamic'` to
  // `connection()` from 'next/server', which is PPR-compatible.
  cacheComponents: true,

  images: {
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
        ],
      },
    ];
  },
};

export default nextConfig;
