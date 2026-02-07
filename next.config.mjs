/** @type {import('next').NextConfig} */
const nextConfig = {
  productionBrowserSourceMaps: false,
  serverExternalPackages: ["@supabase/supabase-js"],
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