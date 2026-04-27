const path = require("path");

const projectRoot = path.resolve(__dirname, "../..");

module.exports = {
  apps: [
    {
      name: "nextjs-nav",
      cwd: projectRoot,
      script: "npm",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      // 如果需要指定 Node 版本路径 (例如使用 nvm)
      // interpreter: "/root/.nvm/versions/node/v20.10.0/bin/node",
    },
  ],
};
