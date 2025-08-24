/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode for better React 18 compatibility
  reactStrictMode: true,
  
  // Optimize images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/blog/:slug/images/:image',
        destination: 'https://raw.githubusercontent.com/Nevvulo/blog/main/posts/assets/:slug/:image',
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