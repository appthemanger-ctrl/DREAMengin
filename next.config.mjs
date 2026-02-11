/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],

  // Vercel builds were crashing during the TypeScript phase with
  // "Map maximum size exceeded". This is commonly triggered by a
  // TypeScript worker crash / runaway diagnostics. We keep strict
  // typechecking available via `npm run typecheck`, but do not block
  // production builds on it.
  typescript: {
    ignoreBuildErrors: true,
  },
  // Next.js 16+ no longer supports configuring eslint via next.config.
  // If you want to skip lint in CI/build, do it in your workflow/scripts.

  // Reduce bundle/source-map pressure in constrained build workers.
  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "*.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "*.gstatic.com",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "*.scdn.co",
      },
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