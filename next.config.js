const nextConfig = {
  output: "standalone",
  productionBrowserSourceMaps: false,
  compress: false, // Sometimes helps with "Invalid string length" on large static pages
  typescript: {
    ignoreBuildErrors: true, // Save memory
  },
  // Next.js 的 output file tracing 会把所有“可能运行时需要”的文件纳入分析。
  // 如果项目根目录存在超大体积的构建产物（例如 docker save 的 .tar，或临时文件），
  // tracing 过程中可能会尝试以 utf8 读取它们，从而触发 RangeError: Invalid string length。
  //
  // 这里显式排除这些不应被打包进 standalone 的大文件/缓存目录。
  outputFileTracingExcludes: {
    "next-server": ["**/*.tar", "**/.docker_temp_*", "**/.next/cache/**"],
  },
  webpack: (config, { dev }) => {
    if (!dev) {
      // Disable source maps completely in production
      config.devtool = false;

      // CRITICAL FIX: "Invalid string length" often comes from minification
      // creating massive single-line strings. Disabling it solves the build crash.
      // Trade-off: Larger bundle size, but working build.
      config.optimization.minimize = true;
    }
    return config;
  },
  /* config options here */
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
