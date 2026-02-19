import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Skip TypeScript errors during build (temporary for deployment)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Turbopack configuration
  turbopack: {
    root: __dirname,
    resolveAlias: {
      // Pages Router doesn't respect "use server" module boundaries, so Turbopack
      // traces @clerk/nextjs/server into client bundles and hits "server-only".
      // { browser } applies only to client bundles — server keeps the real module.
      "@clerk/nextjs/server": {
        browser: "./src/lib/clerk-server-stub.ts",
      },
    },
  },

  // Same fix for Webpack: on client builds, replace @clerk/nextjs/server with
  // an empty module so its "server-only" guard doesn't fire.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias["@clerk/nextjs/server"] = false;
    }
    return config;
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
        // GitHub user avatars
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
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
        // YouTube thumbnails for embeds (alternate domain)
        protocol: "https",
        hostname: "img.youtube.com",
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
      {
        // Clerk user avatars
        protocol: "https",
        hostname: "img.clerk.com",
      },
    ],
    // Configure valid quality values to prevent warnings
    qualities: [25, 50, 75, 100],
    // Minimize image sizes
    minimumCacheTTL: 31536000, // 1 year cache
  },

  // Rewrites
  async rewrites() {
    return {
      // beforeFiles: proxy ActivityPub/federation requests to Fly.io backend
      beforeFiles: [
        // Well-known endpoints for federation discovery
        {
          source: "/.well-known/webfinger",
          destination: "https://api.nev.so/.well-known/webfinger",
        },
        {
          source: "/.well-known/nodeinfo",
          destination: "https://api.nev.so/.well-known/nodeinfo",
        },
        {
          source: "/.well-known/host-meta",
          destination: "https://api.nev.so/.well-known/host-meta",
        },
        {
          source: "/.well-known/oauth-authorization-server",
          destination: "https://api.nev.so/.well-known/oauth-authorization-server",
        },
        // Matrix delegation
        {
          source: "/.well-known/matrix/:path*",
          destination: "https://api.nev.so/.well-known/matrix/:path*",
        },
        // NodeInfo
        {
          source: "/nodeinfo/:path*",
          destination: "https://api.nev.so/nodeinfo/:path*",
        },
        // ActivityPub actor profiles & inbox
        {
          source: "/users/:username",
          destination: "https://api.nev.so/users/:username",
        },
        {
          source: "/users/:username/:path*",
          destination: "https://api.nev.so/users/:username/:path*",
        },
        {
          source: "/inbox",
          destination: "https://api.nev.so/inbox",
        },
        // Mastodon API (for apps that use nev.so as instance domain)
        {
          source: "/api/v1/:path*",
          destination: "https://api.nev.so/api/v1/:path*",
        },
        {
          source: "/api/v2/:path*",
          destination: "https://api.nev.so/api/v2/:path*",
        },
        // OAuth (for Mastodon app login flow)
        {
          source: "/oauth/:path*",
          destination: "https://api.nev.so/oauth/:path*",
        },
      ],
      // afterFiles: regular rewrites
      afterFiles: [
        {
          source: "/@:username",
          destination: "/u/:username",
        },
      ],
      fallback: [],
    };
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
      // Blog -> Learn redirects (keep both routes working)
      // Note: These are soft redirects, the old routes still work
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
