/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],

  // Do NOT ignore TypeScript errors
  typescript: {
    ignoreBuildErrors: false,
  },

  // Reduce bundle/source-map pressure
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
