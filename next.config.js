module.exports = {
  webpack: (config, { dev, isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve = {
        ...config.resolve,
        fallback: {
          fs: false,
        },
      };
    }
    if (!dev && !isServer) {
      Object.assign(config.resolve.alias, {
        react: "preact/compat",
        "react-dom/test-utils": "preact/test-utils",
        "react-dom": "preact/compat",
      });
    }

    return config;
  },
  images: {
    domains: ["nevulo.xyz", "raw.githubusercontent.com", "images.unsplash.com"],
  },
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
};
