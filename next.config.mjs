/** @type {import('next').NextConfig} */
const nextConfig = {
  // IMPORTANT: no static export. This app uses SSR with Supabase.
  // output: 'export',
  experimental: {
    serverActions: { allowedOrigins: ['*'] },
  },
};

export default nextConfig;
