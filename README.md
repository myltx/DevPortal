# DevPortal (开发者门户)

本项目是原 Java Spring Boot 后端的重构版本（Next.js 版），旨在打造一个**集导航、文档、资源管理于一体的团队门户系统**。

---

## ⚡ 快速开始

### 1. 安装与启动

```bash
npm install
cp .env.example .env   # 配置数据库与密钥
npm run dev
```

### 2. 初始化数据库 (Prisma)

```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## 📖 核心文档目录

我们已将会员手册与技术细节拆分为以下专题，请点击查阅：

### 🚀 [快速入门 (安装与部署)](./docs/deploy.md)

了解如何使用 Docker 容器化部署、数据库迁移以及生产环境上线流程。

### ⚙️ [环境配置指南](./docs/env-setup.md)

详细的 `.env` 变量说明以及生产环境上线 CheckList (包含内网网关、Apifox 云端拉取等配置)。

### 🔄 [Swagger 聚合与自动同步手册](./docs/swagger-sync-guide.md)

针对微服务架构的自动同步策略、Jenkins 接入及钉钉监控配置。

### 🧩 [功能模块详解](./docs/features.md)

了解项目、分类、名词定义、团队导航的核心能力。

### ⌨️ [快捷键与命令面板](./docs/shortcuts.md)

提升效率的高阶技巧：`Cmd + K` 命令面板说明。

---

## 🧩 [Chrome 插件安装指南](./chrome-extension/README.md)

配套浏览扩展，实现账号密码自动匹配。

---

## 🛠️ 技术栈

- **框架**: [Next.js 16](https://nextjs.org/) (App Router)
- **数据库**: MySQL (via [Prisma ORM](https://www.prisma.io/))
- **接口文档**: [Swagger UI / API](http://localhost:3000/doc)
- **批量处理**: Excel 导入导出支持 (`xlsx`)

---

Powered by Next.js & Prisma
