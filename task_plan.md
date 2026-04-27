# Task Plan: PR-3 部署入口收拢

## Goal
将 `Dockerfile`、`docker-compose*.yml`、`ecosystem.config.js`、`server-deploy.sh` 收拢到 `deploy/` 下，并通过根目录兼容包装层保持现有操作习惯和部署链路可用。

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
- [x] Move deploy/runtime ops files into `deploy/`
- [x] Add root compatibility wrappers where needed
- [x] Fix compose, PM2 and deploy script paths after the move
- **Status:** complete

### Phase 4: Testing & Verification
- [x] Run compose config validation
- [x] Run shell/config syntax validation
- [x] Run `npm run build:prod`
- [x] Review deployment-facing command paths after the move
- **Status:** complete

### Phase 5: Delivery
- [ ] Review all output files
- [ ] Ensure deliverables are complete
- [ ] Deliver to user
- **Status:** in_progress

## Key Questions
1. `src/app` 迁移后，哪些脚本或配置仍然硬编码依赖根目录 `app/api`？
2. 部署文件迁移到 `deploy/` 后，哪些命令仍需要根目录兼容入口才能避免打断现有习惯？

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| 实际文件移入 `deploy/`，根目录只保留 `server-deploy.sh` 与 `ecosystem.config.js` 包装入口 | 兼顾“收根目录”与“不中断老命令” |
| `docker compose` 文件移动后，统一把 `build.context` 调回项目根目录 | 避免 compose 文件所在目录变化导致 Docker 构建上下文错误 |
| `server-deploy.sh` 改为基于脚本位置推导项目根目录 | 让脚本从根目录包装调用或直接从 `deploy/scripts/` 调用都能正常工作 |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `docker-compose.standalone.yml` 移入 `deploy/docker/` 后，`${DATABASE_URL}` / `${MYSQL_ROOT_PASSWORD}` 不再从根目录 `.env` 自动替换 | 1 | 改为依赖 `env_file` 注入，并去掉需要解析失败的变量展开项 |

## Notes
- 本次改动命中全局 architect-review 硬触发：关键构建配置变更。
- 必须保留回滚简单性，尽量让变更集中在目录移动、兼容层和路径同步。
