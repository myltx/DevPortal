---
name: devportal-repo-assistant
description: 面向 DevPortal 仓库（Next.js + Prisma）的开发执行技能。用于需求实现、缺陷修复、接口和数据库改动、部署脚本调整及交付校验，确保改动符合仓库规范并可验证。
---

# Devportal Repo Assistant

## 概述

在 DevPortal 仓库里执行改动时，使用此技能统一「定位 -> 修改 -> 校验 -> 汇报」流程，减少遗漏并保持交付一致性。

## 何时使用

- 需要在本仓库实现需求或修复缺陷（前端、API、服务层、数据库、部署脚本）。
- 需要遵循仓库约定执行校验（至少 `npm run lint`，按改动范围追加构建或 Prisma 校验）。
- 需要输出可审计的变更说明（改动文件、校验命令、风险与后续建议）。

## 仓库关键路径

- `app/`：Next.js App Router 页面与 API 路由（`app/api/**/route.ts`）。
- `components/`：通用 UI 组件。
- `services/`、`lib/`：业务逻辑、请求封装、工具函数、配置。
- `prisma/`：`schema.prisma` 与迁移目录。
- `docs/`：部署、环境变量、故障排查文档。
- `scripts/`：构建与辅助脚本。

## 执行流程

1. 读取上下文  
   优先查看 `AGENTS.md`、目标模块与最近相关文件；用 `rg` 定位符号和调用链，避免盲改。

2. 实施变更  
   保持现有风格（TypeScript、2 空格、双引号、分号），遵循目录语义命名；仅修改与需求直接相关文件，不做无关重构。

3. 按范围校验  
   默认执行：
   - `npm run lint`

   按改动追加：
   - 前端或路由行为变化：`npm run build`
   - OpenAPI 相关变更：`npm run gen:openapi`
   - Prisma schema 变化：`npx prisma generate`
   - 需要验证迁移时：开发环境 `npx prisma migrate dev`，部署链路 `npx prisma migrate deploy`

4. 输出结果  
   交付必须包含：
   - 改动目的与实现方式
   - 变更文件清单
   - 已执行命令与结果
   - 未完成校验与原因（如环境限制）
   - 潜在风险和建议下一步

## 关键约束

- 默认使用简体中文回复。
- 禁止提交真实密钥，涉及环境变量时引用 `.env.example` 约定。
- 不执行破坏性 Git 操作（如 `reset --hard`）除非明确要求。
- 若发现工作区存在意外外部改动，先暂停并与用户确认处理策略。
