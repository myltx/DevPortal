# Docker 部署方案

由于服务器 OS 过旧无法满足 Node 20 的 Glibc 依赖，采用 Docker 容器化部署。

## 1. web/Dockerfile

使用多阶段构建：

- **Base**: `node:20-alpine` (自带兼容的 musl/glibc 环境)
- **Deps**: 安装依赖
- **Builder**: 执行 `next build`
- **Runner**: 仅复制运行所需文件 (`standalone` 模式)

## 2. web/docker-compose.yml

简单的服务编排，映射端口 3001。

## 3. DEPLOY.md

更新为 Docker 操作指南：

- 安装 Docker
- `docker-compose up -d`
