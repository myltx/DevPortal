# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router 页面与 API 路由（如 `app/(main)/**`、`app/api/**/route.ts`）。
- `components/`: 通用 UI 组件（布局、主题、命令面板等）。
- `services/` 与 `lib/`: 业务服务层、请求封装、工具函数与配置。
- `prisma/`: 数据模型与迁移（`schema.prisma`、`migrations/`）。
- `docs/`: 部署、环境变量、功能说明与排障文档。
- `public/` 与 `chrome-extension/`: 静态资源与浏览器插件源码。

## Build, Test, and Development Commands
- `npm run dev`: 本地开发（会先生成 OpenAPI 与 Prisma Client）。
- `npm run build`: 生产构建（Next.js）。
- `npm run build:prod`: 生成 `.next-prod`，用于 Docker/离线部署。
- `npm run start`: 启动生产包。
- `npm run lint`: 运行 ESLint（Next.js + TypeScript 规则）。
- `npm run gen:openapi`: 手动生成 OpenAPI 产物。
- `npm run docker:pack`: 本地打包镜像并导出 `dev-portal.tar`。

## Coding Style & Naming Conventions
- 语言与框架：TypeScript + React（Next.js App Router）。
- 缩进与格式：遵循现有代码风格（默认 2 空格、双引号、分号）。
- 组件文件使用 `PascalCase`（如 `MainLayout.tsx`）。
- 服务与工具使用 `camelCase`（如 `projectService.ts`）。
- API 路由使用目录语义命名（如 `app/api/project/getList/route.ts`）。
- 提交前至少执行 `npm run lint`，保持 `strict` TypeScript 可通过。

## Testing Guidelines
- 当前仓库未配置统一自动化测试框架（无 `test` 脚本）。
- 合并前最低要求：`npm run lint` + 关键路径手工验证。
- 涉及数据库变更时验证 Prisma 迁移：开发用 `npx prisma migrate dev`，部署用 `npx prisma migrate deploy`。

## Commit & Pull Request Guidelines
- 使用 Conventional Commits：`feat: ...`、`fix: ...`、`docs: ...`、`refactor(scope): ...`。
- 建议格式：`type(scope): 简明变更说明`，单次提交聚焦单一主题。
- PR 需说明变更动机、影响范围与回滚方式，并关联任务/Issue。
- UI 变更附截图或录屏；部署相关改动补充 `.env`、Docker、迁移步骤变化。

## Security & Configuration Tips
- 复制 `.env.example` 为 `.env` 后再启动，禁止提交真实密钥。
- 重点保护：`DATABASE_URL`、`APIFOX_ACCESS_TOKEN`、`SWAGGER_EXPORT_SECRET`、`JENKINS_WEBHOOK_SECRET`。
- `NEXT_PUBLIC_*` 为构建期注入；修改后需重新构建镜像/前端产物。
