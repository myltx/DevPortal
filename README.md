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

### 🚀 [功能模块详解](./docs/features.md)

了解项目、分类、名词定义及配套 Chrome 插件的核心能力。

### 🔄 [Apifox & Swagger 自动同步指南](./docs/swagger-sync.md)

针对超大型项目的自动同步策略、双层安全隔离及钉钉监控配置。

### ⌨️ [快捷键与命令面板](./docs/shortcuts.md)

提升效率的高阶技巧：`Cmd + K` 命令面板及 Vim 风格快捷键说明。

### 🧩 [Chrome 插件安装指南](./chrome-extension/README.md)

配套浏览扩展，实现账号密码自动匹配。

---

## 🛠️ 技术栈

- **框架**: [Next.js 16](https://nextjs.org/) (App Router)
- **数据库**: MySQL (via [Prisma ORM](https://www.prisma.io/))
- **接口文档**: [Swagger UI / API](http://localhost:3000/doc)
- **批量处理**: Excel 导入导出支持 (`xlsx`)

---

Powered by Next.js & Prisma
