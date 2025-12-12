import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack configuration - dynamically set root to current directory
  turbopack: {
    root: __dirname,
  },

  // Experimental features for maximum performance
  experimental: {
    swcTraceProfiling: false,
    scrollRestoration: true,
  },

  // Strict mode for better React 19 compatibility
  reactStrictMode: true,

  // Optimize images - use modern formats
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        // Vercel Blob storage for user uploads
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        // YouTube thumbnails for embeds
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        // Discord CDN for emojis and attachments
        protocol: "https",
        hostname: "cdn.discordapp.com",
      },
      {
        // Discord media proxy for attachments
        protocol: "https",
        hostname: "media.discordapp.net",
      },
    ],
    // Configure valid quality values to prevent warnings
    qualities: [25, 50, 75, 100],
    // Minimize image sizes
    minimumCacheTTL: 31536000, // 1 year cache
  },

  // Rewrites - map /@username to /u/username
  async rewrites() {
    return [
      {
        source: "/@:username",
        destination: "/u/:username",
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: "/blog/:slug/images/:image",
        destination:
          "https://raw.githubusercontent.com/Nevvulo/blog/main/posts/assets/:slug/:image",
        permanent: true,
        basePath: false,
      },
    ];
  },

  // Styled components compiler with modern JS targeting
  compiler: {
    styledComponents: true,
  },

  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;
