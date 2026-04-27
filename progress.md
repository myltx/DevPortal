# Progress Log

## Session: 2026-04-27

### Phase 1: Requirements & Discovery
- **Status:** complete
- **Started:** 2026-04-27
- Actions taken:
  - 读取 `planning-with-files` 与 `architect-review` 技能说明
  - 检查当前工作区状态、目录分布与关键配置
  - 确认本次 PR-2 的边界和高风险点
- Files created/modified:
  - `task_plan.md` (created)
  - `findings.md` (created)
  - `progress.md` (created)

### Phase 2: Planning & Structure
- **Status:** complete
- Actions taken:
  - 确认本次只做 `src/` 迁移，不做 feature 化
  - 识别需要同步的关键文件：`tsconfig.json`、`scripts/build/generate-openapi.mjs`
  - 形成 architect-review 结论和回滚思路
  - 扫描配置和脚本中的硬编码路径，确认主要风险点集中在路径别名和 OpenAPI 生成入口
- Files created/modified:
  - `task_plan.md`
  - `findings.md`
  - `progress.md`

### Phase 3: Implementation
- **Status:** complete
- Actions taken:
  - 新建 `src/` 并将 `app/`、`components/`、`lib/`、`services/`、`types/` 迁移到新位置
  - 更新 `tsconfig.json` 的 `baseUrl`、`paths` 与 `include`
  - 修正 `scripts/build/generate-openapi.mjs` 与 `src/lib/swagger.ts` 中的 API 扫描路径
  - 修正 `src/app/api/doc/route.ts` 中随 `src/` 增层而失效的 `public/openapi.json` 相对路径
- Files created/modified:
  - `src/` 下迁移后的运行时代码目录
  - `tsconfig.json`
  - `scripts/build/generate-openapi.mjs`
  - `src/lib/swagger.ts`
  - `src/app/api/doc/route.ts`

### Phase 4: Testing & Verification
- **Status:** complete
- Actions taken:
  - 执行 `npm run gen:openapi`
  - 首次执行 `npm run build` / `npm run build:prod` 时定位到 `src/app/api/doc/route.ts` 的相对路径问题
  - 修复后重新执行 `npm run build` 与 `npm run build:prod`
  - 核对最终路由清单，确认 `/docs`、`/tool/swagger`、主要 API 路由仍然被正确识别
- Files created/modified:
  - `public/openapi.json`（重新生成）
  - `task_plan.md`
  - `findings.md`
  - `progress.md`

### Phase 4: Testing & Verification
- **Status:** complete
- Actions taken:
  - 迁移 `Dockerfile`、`docker-compose*.yml`、`ecosystem.config.js`、`server-deploy.sh` 到 `deploy/`
  - 为根目录补充 `server-deploy.sh` 与 `ecosystem.config.js` 包装入口
  - 校验 `bash -n deploy/scripts/server-deploy.sh`
  - 校验 `node -e "require('./ecosystem.config.js')"` 的 `cwd` 指向项目根目录
  - 校验 `docker compose -f deploy/docker/*.yml config`
  - 重新执行 `npm run build:prod`
- Files created/modified:
  - `deploy/docker/Dockerfile`
  - `deploy/docker/docker-compose.yml`
  - `deploy/docker/docker-compose.prod.yml`
  - `deploy/docker/docker-compose.standalone.yml`
  - `deploy/pm2/ecosystem.config.js`
  - `deploy/scripts/server-deploy.sh`
  - `server-deploy.sh`
  - `ecosystem.config.js`
  - `package.json`
  - `docs/guide/deploy.md`

## Test Results
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| PM2 包装入口 | `node -e "const cfg=require('./ecosystem.config.js'); console.log(cfg.apps[0].cwd)"` | 输出项目根目录 | 通过 | ✓ |
| 部署脚本语法 | `bash -n deploy/scripts/server-deploy.sh` | 无语法错误 | 通过 | ✓ |
| 开发 compose 配置 | `docker compose -f deploy/docker/docker-compose.yml config` | 正确展开上下文、Dockerfile 和 env_file | 通过 | ✓ |
| 生产 compose 配置 | `docker compose -f deploy/docker/docker-compose.prod.yml config` | 正确展开生产 compose | 通过 | ✓ |
| standalone compose 配置 | `docker compose -f deploy/docker/docker-compose.standalone.yml config` | 不再出现变量替换空值问题 | 修复后通过 | ✓ |
| 生产构建 | `npm run build:prod` | 目录重构后仍可完成 `.next-prod` 构建 | 通过 | ✓ |

## Error Log
| Timestamp | Error | Attempt | Resolution |
|-----------|-------|---------|------------|
| 2026-04-27 | `docker-compose.standalone.yml` 迁移后因 `${DATABASE_URL}` / `${MYSQL_ROOT_PASSWORD}` 依赖旧位置 `.env` 而出现替换空值问题 | 1 | 改为依赖 `env_file` 注入，移除需要在 compose 解析期展开的变量项 |

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | Phase 5，准备整理 PR-3 交付结果 |
| Where am I going? | 汇总 deploy 目录收口、兼容层和验证结果 |
| What's the goal? | 完成部署入口向 `deploy/` 的迁移并保留根目录兼容用法 |
| What have I learned? | compose 文件迁移的核心风险是 build context、env_file 路径和变量替换时机 |
| What have I done? | 已完成 deploy 目录迁移、兼容包装层和结构级验证 |
