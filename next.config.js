const nextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: false,
  swcMinify: true,
  /* config options here */
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
