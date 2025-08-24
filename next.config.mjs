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
    // These features work in stable 15.5.0
    clientSegmentCache: true,

    // These require canary version - uncomment if you switch to canary
    // browserDebugInfoInTerminal: true,
    // devtoolSegmentExplorer: true,
    // globalNotFound: true,
    // turbopackPersistentCaching: true,
    // cacheComponents: true,
  },

  // Strict mode for better React 18 compatibility
  reactStrictMode: true,

  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
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

  // Styled components compiler
  compiler: {
    styledComponents: true,
  },

  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;
