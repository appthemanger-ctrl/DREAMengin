/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],

  productionBrowserSourceMaps: false,

  // Partial Prerendering (PPR) — static shell + dynamic streaming slots.
  // In Next.js 16+ PPR is activated via `cacheComponents: true`.
  // Currently disabled because 127 route files use `export const dynamic = 'force-dynamic'`
  // which is incompatible with cacheComponents.  To enable PPR:
  //   1. Migrate routes from `dynamic = 'force-dynamic'` to `use cache` / Suspense boundaries.
  //   2. Set `cacheComponents: true` below.
  // cacheComponents: true,

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
};

export default nextConfig;
