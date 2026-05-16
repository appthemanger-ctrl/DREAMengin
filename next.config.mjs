/** @type {import('next').NextConfig} */

// Safely extract the hostname for Next.js Image Optimization
const getSupabaseHostname = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return "localhost";
  try {
    const absoluteUrl = url.startsWith("http") ? url : `https://${url}`;
    return new URL(absoluteUrl).hostname;
  } catch (e) {
    return "supabase.co"; // Graceful fallback to prevent build crashes
  }
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseWss = supabaseUrl.replace(/^https:/, "wss:");

const nextConfig = {
  serverExternalPackages: ["@supabase/supabase-js"],
  productionBrowserSourceMaps: false,

  // Next.js 16+ native PPR model (replaces experimental.ppr and dynamicIO)
  cacheComponents: true,

  experimental: {},

  // Exclude build tooling from route tracing zips
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
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: getSupabaseHostname(),
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
        destination: "/dreamdmbar",
        permanent: false,
      },
      {
        source: "/homedream",
        destination: "/dreamdmbar/homedream", // Fixed infinite loop
        permanent: false,
      },
      {
        source: "/homedream/:path*",
        destination: "/dreamdmbar/homedream/:path*", // Preserved path parameters
        permanent: false,
      },
      {
        source: "/dreamspace",
        destination: "/dreamdmbar/dreamspace",
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

  async headers() {
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'", // Crucial for WASM/Next streaming
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          `img-src 'self' data: blob: ${supabaseUrl} https://*.googleapis.com https://*.gstatic.com https://i.ytimg.com https://*.scdn.co`,
          `connect-src 'self' ${supabaseUrl} ${supabaseWss} https://*.googleusercontent.com https://api.spotify.com https://api.github.com https://assets.babylonjs.com`, // Fixed mangled domains
          `media-src 'self' blob: ${supabaseUrl}`,
          "worker-src 'self' blob:",
          "frame-ancestors 'self'",
        ].join("; "),
      },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(self), payment=()" },
    ];

    const sabIsolationHeaders = [
      { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
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
