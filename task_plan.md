# Task Plan: PR-2 src 目录迁移

## Goal
将 `app/`、`components/`、`lib/`、`services/`、`types/` 迁移到 `src/` 下，并同步修正 TypeScript/Next.js/ESLint 配置，确保现有导入风格和主要构建链路继续可用。

## Current Phase
Phase 5

## Phases

### Phase 1: Requirements & Discovery
- [x] Understand user intent
- [x] Identify constraints and requirements
- [x] Document findings in findings.md
- **Status:** complete

### Phase 2: Planning & Structure
- [x] Define technical approach
- [x] Create project structure if needed
- [x] Document decisions with rationale
- **Status:** complete

### Phase 3: Implementation
- [x] Move runtime directories into `src/`
- [x] Update path aliases and include/exclude config
- [x] Fix script/config references impacted by the move
- **Status:** complete

### Phase 4: Testing & Verification
- [x] Run `npm run gen:openapi`
- [x] Run `npm run build`
- [x] Run `npm run build:prod`
- [x] Review runtime-sensitive routes after the move
- **Status:** complete

### Phase 5: Delivery
- [ ] Review all output files
- [ ] Ensure deliverables are complete
- [ ] Deliver to user
- **Status:** in_progress

## Key Questions
1. `src/app` 迁移后，哪些脚本或配置仍然硬编码依赖根目录 `app/api`？
2. `@/*` 路径别名切到 `./src/*` 后，是否还存在需要保留根目录解析的文件？

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| PR-2 只做 `src/` 迁移，不做 feature 化聚合 | 降低风险，避免把目录移动和职责重组耦合在同一批改动 |
| 保持 `@/xxx` 导入风格不变，只调整 `tsconfig` 别名 | 让应用层文件尽量无需批量重写 import |
| `docs/`、`chrome-extension/`、`public/`、`prisma/` 继续留在根目录 | 这几类目录当前被运行时、构建链路或框架约定直接依赖 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `src/app/api/doc/route.ts` 仍引用迁移前的 `public/openapi.json` 相对路径，导致 `build`/`build:prod` 失败 | 1 | 将相对路径从 `../../../public/openapi.json` 修正为 `../../../../public/openapi.json` |

## Notes
- 本次改动命中全局 architect-review 硬触发：关键构建配置变更 + 跨多个业务目录迁移。
- 必须保留回滚简单性，尽量让变更集中在目录移动和配置同步。
