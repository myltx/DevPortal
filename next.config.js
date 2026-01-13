const nextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: false,
  compress: false, // Sometimes helps with "Invalid string length" on large static pages
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // Disable source maps completely in production to avoid "Invalid string length"
      config.devtool = false;
    }
    return config;
  },
  /* config options here */
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
