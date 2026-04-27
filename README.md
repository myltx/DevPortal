# DevPortal (开发者门户)

本项目是原 Java Spring Boot 后端的重构版本（Next.js 版），旨在打造一个**集导航、文档、资源管理于一体的团队门户系统**。

---

## ⚡ 快速开始

### 1. 安装与启动

```bash
pnpm install
cp .env.example .env   # 配置数据库与密钥
pnpm dev
```

### 2. 初始化数据库 (Prisma)

```bash
pnpm exec prisma migrate dev --name init
pnpm exec prisma generate
```

---

## 📖 文档入口

项目文档正文统一维护在 `docs/` 目录，并同时供主站 `/docs` 与静态文档站使用。

### 🚀 [文档总览](./docs/index.md)

查看部署、环境配置、功能说明、集成指南与插件使用手册。

### ⚙️ [部署指南](./docs/guide/deploy.md)

了解 Docker、Vercel、直接 Node.js 部署的适用场景、差异、数据库迁移与生产上线流程。

### 🧩 [功能模块详解](./docs/usage/features.md)

了解项目、分类、名词定义、团队导航与 Swagger 工具的核心能力。

### 🔄 [Swagger 聚合与自动同步手册](./docs/integration/swagger-sync-guide.md)

针对微服务架构的自动同步策略、Jenkins 接入及钉钉监控配置。

### 🧩 [Chrome 插件安装指南](./docs/extension.md)

配套浏览扩展，实现账号密码自动匹配与版本更新。

---

## 🛠️ 技术栈

- **框架**: [Next.js 16](https://nextjs.org/) (App Router)
- **数据库**: MySQL (via [Prisma ORM](https://www.prisma.io/))
- **接口文档**: [Swagger UI / API](http://localhost:3000/doc)
- **批量处理**: Excel 导入导出支持 (`xlsx`)

---

Powered by Next.js & Prisma
