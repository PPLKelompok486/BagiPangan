import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── Turbopack workspace root ────────────────────────────────────────────────
  // Suppresses "multiple lockfiles" warning when the monorepo root also has
  // a package-lock.json.
  turbopack: {
    root: ".",
  },

  // ── Images ─────────────────────────────────────────────────────────────────
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Allow Next.js Image to serve the Laravel backend's avatar URLs
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "*.laravel.cloud",
        pathname: "/storage/**",
      },
    ],
  },

  // ── Compression ─────────────────────────────────────────────────────────────
  compress: true,

  // ── Package tree-shaking ────────────────────────────────────────────────────
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "react-icons",
      "framer-motion",
      "@supabase/supabase-js",
    ],
  },

  // ── Headers: cache public images (stale-while-revalidate) ───────────────────
  // Note: _next/static is handled automatically by Next.js with immutable headers.
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
