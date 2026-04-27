# Findings & Decisions

## Requirements
- 用户要求直接进入 PR-3，继续落地仓库重构方案中的部署入口收拢阶段。
- 需要把 `Dockerfile`、`docker-compose*.yml`、`ecosystem.config.js`、`server-deploy.sh` 收进 `deploy/`。
- 需要保留必要的根目录兼容入口，避免打断现有构建、PM2 和服务器部署习惯。

## Research Findings
- `docker-compose*.yml` 移到 `deploy/docker/` 后，`build.context` 不能继续写 `.`，否则会把构建上下文缩到 `deploy/docker/`。
- `env_file` 路径在 compose 中是相对 compose 文件本身解析的，因此需要从 `.env` 改成 `../../.env`。
- `deploy/pm2/ecosystem.config.js` 如果保留 `cwd: "./"`，从新位置启动时会把工作目录错误地落到 `deploy/pm2/`。
- `deploy/scripts/server-deploy.sh` 原先假设 compose 文件位于当前目录；迁移后需要根据脚本位置推导项目根目录，并兼容 `deploy/docker/*.yml`。
- `docker-compose.standalone.yml` 里的 `${DATABASE_URL}` 与 `${MYSQL_ROOT_PASSWORD}` 在新位置下不会自动从根目录 `.env` 做变量替换，更稳妥的做法是依赖 `env_file` 注入。

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 根目录保留 `server-deploy.sh` 包装脚本 | 兼容现有服务器操作习惯，避免要求每台机器立刻改命令 |
| 根目录保留 `ecosystem.config.js` 包装配置 | 兼容 `pm2 start ecosystem.config.js` 这类现有调用方式 |
| `Dockerfile` 不做包装，直接通过 `-f deploy/docker/Dockerfile` 调用 | Dockerfile 没有像 JS/SH 那样自然的包装机制，显式指定路径更稳 |
| 以 `docker compose config` 作为 compose 迁移的主要验证手段 | 能快速验证路径、`env_file` 和构建上下文是否正确展开 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| `docker-compose.standalone.yml` 迁移后变量替换报空值警告 | 改为依赖 `env_file` 注入容器环境，移除需要在 compose 解析期展开的变量项 |

## Resources
- `tsconfig.json`
- `deploy/docker/docker-compose.yml`
- `deploy/docker/docker-compose.prod.yml`
- `deploy/docker/docker-compose.standalone.yml`
- `deploy/pm2/ecosystem.config.js`
- `deploy/scripts/server-deploy.sh`
- `docs/reference/repo-structure-refactor-plan.md`

## Visual/Browser Findings
- 无
