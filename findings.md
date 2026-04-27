# Findings & Decisions

## Requirements
- 用户要求直接进入 PR-2，继续落地仓库重构方案中的 `src/` 迁移阶段。
- 需要把运行时代码目录集中到 `src/` 下，同时尽量不影响现有 API 路由、页面路由和构建链路。
- 不要在这一步顺手做领域聚合、接口契约调整或业务逻辑优化。

## Research Findings
- 当前运行时代码主要位于 `app/`、`components/`、`lib/`、`services/`、`types/`。
- `tsconfig.json` 当前 `@/*` 指向 `./*`，迁移后需要改为 `./src/*`。
- `scripts/build/generate-openapi.mjs` 当前 `apiFolder` 写死为 `"app/api"`，迁移到 `src/` 后需要同步调整。
- `next.config.js` 当前没有显式依赖根目录 `app/`，Next.js 对 `src/app` 是天然支持的。
- `eslint.config.mjs` 当前忽略的是产物目录，不依赖 `app/` 根路径，理论上无需因 `src/` 迁移额外改规则。
- 代码引用层面大多已经统一使用 `@/lib/*`、`@/services/*`、`@/components/*`、`@/types`，这意味着目录移动后可以主要靠别名切换维持兼容。
- 当前没有发现 `package.json`、`Dockerfile`、`next.config.js` 等文件硬编码依赖 `components/`、`lib/`、`services/`、`types/` 根路径。
- 迁移执行后，`src/lib/swagger.ts` 也需要同步从 `app/api` 改到 `src/app/api`，否则 Swagger 运行时扫描路径会失效。
- `tsconfig.json` 的 `include` 需要适度收窄到 `src/**` 和 `scripts/**`，避免继续把根目录已迁出的历史路径纳入类型分析。

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 保持 `src/app` 作为 App Router 入口 | 兼容 Next.js 约定，减少自定义配置 |
| 尽量不改业务文件内部导入语句 | 利用路径别名切换，降低大规模文本替换风险 |
| 先做文件系统迁移，再跑构建验证 | 这类结构改动的主要风险来自路径断裂，构建验证最直接 |
| 继续保留 `public/openapi.json` 在根目录 | 它既是构建产物，也是 `api/doc` 的运行时输入，没必要在 PR-2 一并重构 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| `npm run lint` 在仓库现状下已有大量历史错误 | 作为背景风险记录，本次不以 lint 全绿作为 PR-2 成功标准，重点看本次迁移是否打断构建链路 |
| `src/app/api/doc/route.ts` 仍使用迁移前的 `public/openapi.json` 相对路径 | 修正为新的四级相对路径，避免 `src/` 增加一层目录后构建找不到 JSON |

## Resources
- `tsconfig.json`
- `next.config.js`
- `eslint.config.mjs`
- `scripts/build/generate-openapi.mjs`
- `docs/reference/repo-structure-refactor-plan.md`

## Visual/Browser Findings
- 无
