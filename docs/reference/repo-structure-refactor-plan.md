# 仓库目录重构迁移清单

> [!NOTE]
> **状态说明（2026-04）**：本文档是目录重构的历史规划稿。`src/`、`deploy/`、`scripts/build|db|ops/` 等调整已经落地；
> 当前应以正式文档和实际目录结构为准，尤其是 [docs/guide/deploy.md](../guide/deploy.md) 与仓库根目录下的真实文件布局。

## 1. 背景与目标

当前仓库的主要问题不是“业务模块太多”，而是根目录混放了以下几类职责：

- 项目级入口：`package.json`、`tsconfig.json`、`next.config.js`
- 运行时代码：`app/`、`components/`、`lib/`、`services/`、`types/`
- 内容资源：`docs/`、`chrome-extension/`
- 构建与运维：`Dockerfile`、`docker-compose*.yml`、`server-deploy.sh`、`ecosystem.config.js`
- 打包产物：`dev-portal.tar`、Chrome 插件 zip、`.next-prod`

本次重构目标不是一步到位改造成 monorepo，而是在尽量不影响现有开发与部署的前提下，逐步收敛根目录职责，提高以下能力：

- 新成员进入仓库后更容易理解“哪些是源码，哪些是部署文件，哪些是产物”
- 后续新增功能时更容易按领域聚合代码，而不是继续横跨 `app`、`lib`、`services`
- 降低部署脚本、运行时读取路径与本地构建产物之间的偶然耦合

## 2. 当前约束

以下约束决定了本次不能做激进迁移：

### 2.1 运行时直接依赖 `docs/`

`app/api/docs/content/route.ts` 当前通过 `process.cwd()/docs` 读取 Markdown 文档内容，因此第一阶段不适合直接移动 `docs/` 的物理位置。

### 2.2 运行时直接依赖 `chrome-extension/`

以下接口直接读取 `process.cwd()/chrome-extension/manifest.json`：

- `app/api/extension-version/route.ts`
- `app/api/system-config/route.ts`

因此第一阶段也不适合直接移动 `chrome-extension/`。

### 2.3 构建链路依赖根目录脚本和路径

以下文件对当前目录布局有直接依赖：

- `package.json`
- `Dockerfile`
- `scripts/prepare-runtime-deps.sh`
- `scripts/pack-extension.mjs`
- `server-deploy.sh`
- `docs/guide/deploy.md`

这意味着目录重构必须分 PR 推进，并且每一步都要可单独回滚。

## 3. 目标结构

本次重构建议分两层目标推进。

### 3.1 第一阶段目标

```text
.
├─ src/
│  ├─ app/
│  ├─ components/
│  ├─ lib/
│  ├─ services/
│  └─ types/
├─ docs/
├─ chrome-extension/
├─ public/
├─ prisma/
├─ scripts/
│  ├─ build/
│  ├─ db/
│  └─ ops/
├─ deploy/
│  ├─ docker/
│  ├─ pm2/
│  └─ scripts/
├─ artifacts/
├─ package.json
├─ tsconfig.json
├─ next.config.js
└─ .env.example
```

### 3.2 第二阶段目标

```text
src/
├─ app/
├─ components/
├─ features/
│  ├─ docs/
│  ├─ extension/
│  ├─ project/
│  ├─ swagger/
│  └─ system-config/
├─ server/
│  ├─ audit/
│  ├─ db/
│  └─ services/
└─ shared/
   ├─ api/
   ├─ client/
   ├─ config/
   ├─ types/
   └─ utils/
```

## 4. 实施原则

- 先整理“目录职责”，后整理“领域聚合”
- 先抽路径常量，再移动物理目录
- 每个 PR 只解决一种主要问题，避免把结构调整和业务改动混在一起
- 每个 PR 都要保证 `npm run lint` 可通过
- 涉及 Next.js 构建链路的 PR，至少补跑一次 `npm run build`
- 涉及 Docker/离线打包链路的 PR，至少补跑一次 `npm run build:prod`

## 5. 四个 PR 的迁移方案

## PR-1 收敛产物与脚本职责

### 目标

不动业务代码目录，只先消除根目录最明显的噪音，把“脚本”和“产物出口”规范起来。

### 计划改动

新增目录：

- `artifacts/`
- `artifacts/docker/`
- `artifacts/extension/`
- `scripts/build/`
- `scripts/db/`
- `scripts/ops/`

建议迁移：

- `scripts/generate-openapi.js` -> `scripts/build/generate-openapi.js`
- `scripts/pack-extension.mjs` -> `scripts/build/pack-extension.mjs`
- `scripts/prepare-runtime-deps.sh` -> `scripts/build/prepare-runtime-deps.sh`
- `scripts/migrate-area.ts` -> `scripts/db/migrate-area.ts`
- `scripts/cleanup-apifox-logs.js` -> `scripts/ops/cleanup-apifox-logs.js`

同步修改：

- `package.json`
- `Dockerfile`
- `docs/guide/deploy.md`
- `README.md`

### 需要调整的脚本行为

1. Docker 导出产物输出到：

```text
artifacts/docker/dev-portal.tar
```

2. Chrome 插件打包产物分两类：

- 运行时下载继续输出到 `public/extension/`
- 归档产物额外保留到 `artifacts/extension/`

这样可以同时兼顾：

- 页面和接口仍然通过 `/extension/*.zip` 提供下载
- 根目录不再散落 zip 文件
- 版本归档有明确位置

### 建议额外处理

- 把仓库中的 `.DS_Store` 清掉
- 确认 `.gitignore` 继续忽略 `artifacts/`、`.next`、`.next-prod`

### 风险

低风险。主要是脚本路径改错会导致 `package.json` 命令失效。

### 验证

```bash
npm run lint
npm run gen:openapi
npm run extension:pack
npm run build:prod
```

### 回滚

如果脚本迁移后命令失效，直接回退当前 PR 即可，不影响业务代码和数据库。

## PR-2 运行时代码迁移到 `src/`

### 目标

把运行时代码整体收进 `src/`，让根目录只保留项目级入口与资源目录。

### 计划改动

目录迁移：

- `app/` -> `src/app/`
- `components/` -> `src/components/`
- `lib/` -> `src/lib/`
- `services/` -> `src/services/`
- `types/` -> `src/types/`

配置调整：

- `tsconfig.json`
- `next.config.js`
- 如有 ESLint 路径约束，也同步检查 `eslint.config.mjs`

### 关键实现方式

`tsconfig.json` 中的路径别名建议从：

```json
"@/*": ["./*"]
```

改为：

```json
"@/*": ["./src/*"]
```

这样现有代码里的以下引用风格可以保持不变：

- `@/lib/prisma`
- `@/services/projectService`
- `@/components/theme/ThemeSwitch`

### 风险

中风险。主要风险是：

- Next.js 对 `src/app` 的识别正常，但路径别名若未同步，编译会直接报错
- `include` 范围若保留得过宽，类型检查可能把历史产物目录带进去

### 验证

```bash
npm run lint
npm run build
npm run build:prod
```

手工验证：

- 首页可打开
- `/docs`
- `/middle`
- `/projectSite`
- `/tool/swagger`

### 回滚

若出现大面积 import 解析失败，整体回退该 PR。不要边修边混入后续 feature 化重构。

## PR-3 收拢部署与运维入口

### 目标

把 Docker、PM2、服务器部署脚本从根目录收进 `deploy/`，降低项目入口噪音。

### 计划改动

新增目录：

- `deploy/docker/`
- `deploy/pm2/`
- `deploy/scripts/`

建议迁移：

- `Dockerfile` -> `deploy/docker/Dockerfile`
- `docker-compose.yml` -> `deploy/docker/docker-compose.yml`
- `docker-compose.prod.yml` -> `deploy/docker/docker-compose.prod.yml`
- `docker-compose.standalone.yml` -> `deploy/docker/docker-compose.standalone.yml`
- `ecosystem.config.js` -> `deploy/pm2/ecosystem.config.js`
- `server-deploy.sh` -> `deploy/scripts/server-deploy.sh`

### 兼容策略

本 PR 不建议立即删除根目录入口，建议保留轻量兼容层：

1. 根目录 `server-deploy.sh` 保留为包装脚本
   内部只负责转调 `deploy/scripts/server-deploy.sh`

2. 根目录保留一个简短的部署说明
   明确新的 compose、Dockerfile、PM2 配置位置

3. `docs/guide/deploy.md` 全面更新
   所有示例命令都统一指向 `deploy/docker/`

### 风险

中风险。最容易出问题的是：

- Docker build 上下文变化
- `COPY` 路径与 `.dockerignore` 失配
- 服务器历史命令还在使用根目录 compose 文件

### 特别注意

如果 `Dockerfile` 被移动到 `deploy/docker/`，构建命令应显式指定：

```bash
docker build -f deploy/docker/Dockerfile .
```

不要默认在 `deploy/docker/` 目录内直接构建，否则上下文会缩小，导致 `COPY .next-prod/standalone`、`COPY prisma` 等路径失效。

### 验证

```bash
npm run lint
npm run build:prod
docker build -f deploy/docker/Dockerfile -t dev-portal:test .
```

手工验证：

- `server-deploy.sh` 包装入口仍可执行
- `docker compose -f deploy/docker/docker-compose.prod.yml config` 可通过

### 回滚

如果部署命令与路径兼容层处理不完整，优先回退该 PR，不要把问题带到生产环境排查。

## PR-4 领域聚合与路径常量收敛

### 目标

在目录职责已经稳定之后，再逐步把跨目录功能聚合成领域模块，减少后续维护时的跳转成本。

### 计划改动

优先抽出统一路径常量模块，例如：

```text
src/shared/config/paths.ts
```

集中管理：

- `docs` 根目录路径
- `chrome-extension` 根目录路径
- `public/extension` 输出路径
- `artifacts` 输出路径

然后逐步进行领域聚合。

### 建议的聚合顺序

1. `docs` 领域

收敛以下代码到 `src/features/docs/`：

- `src/app/docs/**`
- `src/app/api/docs/**`
- `src/lib/docs-manifest.ts`

2. `extension` 领域

收敛以下代码到 `src/features/extension/`：

- `src/app/api/extension-version/**`
- `src/app/api/system-config/**` 中与扩展配置有关的逻辑
- 以后若新增扩展打包元数据，也统一落这里

3. `swagger` 领域

收敛以下代码到 `src/features/swagger/`：

- `src/lib/swagger.ts`
- `src/lib/swagger-diff.ts`
- `src/lib/swagger-merge/**`
- `src/app/tool/swagger/**`
- `src/app/tool/swagger-diff/**`
- 相关 API Route

4. 服务端能力聚合

把纯服务端依赖逐步从 `src/services/`、`src/lib/` 收到：

```text
src/server/
  audit/
  db/
  services/
```

例如：

- `src/lib/prisma.ts` -> `src/server/db/prisma.ts`
- `src/lib/audit.ts` -> `src/server/audit/createAuditLog.ts`

### 风险

中高风险。虽然不改接口契约，但会涉及较多 import 重写和职责边界调整。

### 验证

```bash
npm run lint
npm run build
npm run build:prod
npm run docs:build
```

手工验证：

- `/docs` 文档卡片与预览
- `/api/docs/content`
- `/api/extension-version`
- 系统配置页扩展下载地址读写
- `/tool/swagger`
- Jenkins Webhook 相关路径不受影响

### 回滚

该 PR 必须拆成多个小提交。若出现领域边界拆分不清，优先保留原路径包装层，而不是一次性删除旧文件。

## 6. 推荐的路径常量方案

为了避免后续每次移动目录都全仓替换 `process.cwd()` 路径，建议尽早引入统一配置：

```ts
import path from "path";

const ROOT_DIR = process.cwd();

export const REPO_PATHS = {
  docsRoot: path.join(ROOT_DIR, "docs"),
  extensionRoot: path.join(ROOT_DIR, "chrome-extension"),
  publicExtensionRoot: path.join(ROOT_DIR, "public", "extension"),
  artifactsRoot: path.join(ROOT_DIR, "artifacts"),
};
```

优先替换以下位置：

- `app/api/docs/content/route.ts`
- `app/api/extension-version/route.ts`
- `app/api/system-config/route.ts`
- `scripts/pack-extension.mjs`

这样即使后续目录移动，也只需要调整一处配置。

## 7. 验证基线

每个 PR 合并前，至少执行以下校验中的相关子集：

### 通用校验

```bash
npm run lint
```

### 前端/路由校验

```bash
npm run build
```

### 生产打包校验

```bash
npm run build:prod
```

### 文档站校验

```bash
npm run docs:build
```

### 手工验证重点

- 根目录是否只保留项目级入口与稳定资源目录
- `/docs` 页面和文档预览是否正常
- Chrome 扩展下载地址与版本接口是否正常
- Docker 打包、离线包导出与部署脚本是否仍可执行

## 8. 不建议现在就做的事情

- 不建议当前阶段直接拆成 monorepo
- 不建议同时改 Prisma 目录位置
- 不建议把 `public/` 从根目录移走
- 不建议在结构重构 PR 里顺手做业务逻辑优化
- 不建议在同一个 PR 内同时完成 `src/` 迁移和 feature 化聚合

## 9. 最终建议

推荐执行顺序：

1. 先做 PR-1，尽快降低根目录噪音
2. 再做 PR-2，让运行时代码统一进入 `src/`
3. 然后做 PR-3，把部署链路从根目录收口
4. 最后做 PR-4，按领域逐步聚合，避免后续功能继续散落

如果执行资源有限，最低优先级组合建议是：

- 必做：PR-1 + PR-2
- 可择机做：PR-3
- 作为长期演进做：PR-4
