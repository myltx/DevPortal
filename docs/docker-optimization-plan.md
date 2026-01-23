# Dockerfile 优化实施方案

> [!NOTE]
> **状态说明（2026-01）**：近期排查发现，服务器磁盘空间飙升的主要原因是 **反复执行 `docker load` 导致旧镜像变为 dangling 并持续堆积**，
> 而不是本文件最初假设的“`npm start` 导致 node_modules 全量加载”。
>
> - 如果你的目标是“立刻解决服务器磁盘占用”，请优先按 `docs/deploy.md` 的「反复 docker load 导致旧镜像堆积」章节处理，并使用 `server-deploy.sh` 的更新流程（会标记 `dev-portal:previous` 并提示清理）。
> - 本文档保留作为**可选的后续优化方向**（镜像体积/运行方式），但不再是解决磁盘问题的必选项。

## 目标描述

通过利用 Next.js 的 `standalone` 输出模式，减少 Docker 容器的内存占用和镜像体积。
当前问题：容器使用 `npm start` 运行，加载了完整的 node_modules 开发/生产依赖树，导致内存占用过高（用户报告 40GB，即使是误报也表明存在优化空间）。
解决方案：修改 Dockerfile 使用 `node server.js` 运行 `standalone` 构建产物，并只安装必要的生产依赖，去除冗余文件。

## 用户审查要求

> [!IMPORTANT]
> 此变更修改了 Docker 镜像的构建与运行方式。
>
> 1. **前置条件**：主机上必须先执行 `npm run build:prod` 生成 `.next-prod` 目录。
> 2. **依赖重装**：构建过程中会**删除**从主机拷贝进来的 `standalone/node_modules`（macOS 架构），并在容器内**重新安装** Linux 版本的依赖（特别是 Prisma Client），以确保架构兼容性。

## 构建与部署流程说明 (Workflow Clarification)

您的操作流程**完全不变**，依然是“本地打包 -> 上传 -> 服务器运行”。

| 步骤            | 执行位置       | 操作命令              | 网络需求 | 说明                                                                    |
| :-------------- | :------------- | :-------------------- | :------- | :---------------------------------------------------------------------- |
| **1. 代码构建** | 本地电脑 (Mac) | `npm run build:prod`  | 无       | 生成 Standalone 文件                                                    |
| **2. 镜像打包** | 本地电脑 (Mac) | `npm run docker:pack` | **需要** | 读取 Dockerfile，**利用本地网络**下载 Linux 依赖，封装成镜像文件 (.tar) |
| **3. 传输镜像** | -              | scp / upload          | -        | 将 `.tar` 文件传到服务器                                                |
| **4. 加载镜像** | 服务器 (Linux) | `docker load`         | 无       | 导入本地打好的镜像                                                      |
| **5. 启动服务** | 服务器 (Linux) | `docker run`          | **无**   | 镜像内已包含所有依赖，**服务器完全不需要联网**                          |

## 提议的更改

### Dockerfile

#### [MODIFY] `Dockerfile`

- **原有逻辑**：拷贝整个项目 -> `npm ci` -> `npm start`。
- **新逻辑**：
  1. 拷贝 `.next-prod/standalone`（包含基本运行结构）。
  2. 删除其中的 `node_modules`（避免架构不兼容）。
  3. 拷贝 `package.json` 并执行 `npm ci`（Linux 环境下安装依赖）。
  4. 拷贝静态资源 `.next-prod/static` 和 `public` 到正确位置。
  5. 使用轻量级命令 `CMD ["node", "server.js"]` 启动。

```dockerfile
# ... (基础设置保持不变)

# 1. 复制 Standalone 文件 (包含代码结构 + Server)
# 注意：这里包含主机的 node_modules，我们需要在后续步骤替换它
COPY .next-prod/standalone ./

# 2. 清理并重新安装依赖 (Linux 环境)
# 删除可能不兼容的 Mac 二进制依赖
RUN rm -rf node_modules
# 复制完整的包定义 (Standalone 生成的可能是不完整的)
COPY package.json package-lock.json* ./
# 配置国内镜像源以确保下载成功 (针对国内服务器环境)
RUN npm config set registry https://registry.npmmirror.com
# 安装生产依赖 & 生成 Prisma Client
RUN npm ci \
  && npx prisma generate \
  && rm -rf /root/.cache/prisma \
  && npm prune --production \
  && npm cache clean --force

# 3. 复制静态资源
# Standalone 模式需要手动复制 static 和 public 文件夹
# 根据 next.config.js 的 distDir (.next-prod) 调整路径
COPY .next-prod/static ./.next-prod/static
COPY public ./public

# ... (权限设置保持不变)

# 使用优化的轻量级服务器启动
CMD ["node", "server.js"]
```

## 验证计划

### 手动验证

1. **执行构建**：
   在终端运行：
   ```bash
   npm run build:prod
   npm run docker:pack
   ```
2. **运行检查**：
   ```bash
   npm run docker:dev
   # 或
   docker run -it --rm --entrypoint sh dev-portal:latest
   ```
3. **性能监控**：
   运行 `docker stats` 查看内存占用是否显著下降（预期应在 200MB-1GB 之间，取决于应用负载，而非 40GB）。
4. **功能测试**：
  访问 `http://localhost:3001`，确保页面加载正常，API 调用成功（验证 Prisma 连接）。

## 针对“磁盘空间”的补充说明（与本方案正交）

如果你的核心诉求是“服务器磁盘空间占用过多”，优先处理镜像堆积：

- 现象：每次 `docker load -i dev-portal.tar` 后，旧的 `dev-portal:latest` 会变成 dangling 镜像（无 tag），不清理会持续占用磁盘。
- 建议：使用 `server-deploy.sh` 更新流程（会标记 `dev-portal:previous` 便于回滚/删除），或手动执行：
  - `docker image ls -f dangling=true`
  - `docker image prune -f`
