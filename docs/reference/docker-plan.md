# Docker 部署方案

> [!NOTE]
> **状态说明（2026-04）**：本文档为早期 Docker 草案，部分路径和运行方式已经过时，例如文中的 `web/Dockerfile`、`.next`、`web/docker-compose.yml`。
> 当前请以 [docs/guide/deploy.md](../guide/deploy.md) 和 `deploy/docker/` 下的实际文件为准。

由于服务器 OS 过旧无法满足 Node 20 的 Glibc 依赖，采用 Docker 容器化部署。

## 1. web/Dockerfile

采用“本地构建 + Docker 打包”策略：

- 在宿主机先执行 `pnpm build` 生成 `.next`（避免在 Mac Apple Silicon 上用 buildx/QEMU 进行 `next build`）
- Docker 镜像内只做两件事：
  - 安装 Linux x64 生产依赖（确保原生二进制依赖平台正确）
  - 复制 `.next`/`public` 并 `next start` 运行

## 2. web/docker-compose.yml

简单的服务编排，映射端口 3001。

## 3. guide/deploy.md

更新为 Docker 操作指南：

- 安装 Docker
- `docker compose up -d --build`
- 注意：若在服务器上直接构建，需要上传包含 `.next` 的目录（或改用“本地构建并上传”方案）
