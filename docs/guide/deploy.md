# 项目部署文档

> [!IMPORTANT]
> 由于服务器操作系统较旧 (Glibc 版本过低)，无法直接运行 Node.js 20。
> **我们已切换为 Docker 容器化部署方案**。这可以完美避开系统环境不兼容的问题。

> [!NOTE]
> 当前 `Dockerfile` **不会在容器里执行 `next build`**，而是直接复制本地生成的 `.next-prod/standalone` 运行时产物，并额外复制 `.next-prod/static`。
> 因此无论你选择“离线镜像包部署”还是“服务器端 docker build”，都必须先在本地完成 `pnpm build:prod`（或直接运行 `pnpm docker:pack`）。
>
> 同时，Docker 构建会在中间层单独生成 Linux 版本的 Prisma / sharp 原生运行时文件，再只把这些必要目录复制到最终镜像中，因此最终镜像会明显小于“容器内完整安装依赖”的旧方案。
>
> 使用 `docker compose` 的 `env_file` 读取 `.env` 时，请不要把值写成 `KEY="value"` 这种带双引号的形式，尤其是 `DATABASE_URL`。
> 例如要写成 `DATABASE_URL=mysql://user:pass@host:3306/db`，否则某些运行时会把双引号也当成值的一部分，进而导致 Prisma 认为连接串不是以 `mysql://` 开头。

> [!TIP]
> 本仓库当前默认采用的是 **“Mac/本机构建 Next 产物 + Docker 内补齐 Linux 原生依赖”** 策略。
> 这样做的主要原因是：在 Apple Silicon Mac 上直接使用 `docker buildx --platform linux/amd64` 执行 `next build`，通常会落到 QEMU 跨架构模拟，构建速度慢、稳定性也较差。
>
> 如果你是开源使用者，请不要把这条策略理解为唯一标准答案：
>
> - 如果你和本项目一样，主要在 **Mac Apple Silicon** 上离线打包并发布到 **Linux AMD64** 服务器，建议保留当前方案。
> - 如果你有 **Linux CI/CD**、原生 **AMD64 构建机**，或可以直接在目标 Linux 环境完成构建，通常更建议改回“Linux 原生构建 standalone，再直接复制产物”的标准做法，维护成本会更低。
> - 如果你更看重“实现简单、尽量少碰打包细节”，也可以回退到“镜像内完整安装生产依赖并使用 `pnpm start`”的保守方案，只是镜像体积会更大。

## A. 部署方式总览

本项目本质上是一个 **Next.js App Router + Prisma + MySQL + 多个服务端 API Route** 的全栈应用。
因此它不是“只上传静态文件”即可运行的站点，部署时需要同时考虑：

- Node.js 运行环境
- MySQL 数据库可达性
- Prisma Client 生成与迁移
- `NEXT_PUBLIC_*` 构建时注入
- 文档预览、插件版本等运行时文件读取能力
- Jenkins / Apifox / 钉钉等外部集成链路

### A.1 方案对比

| 方式 | 适用场景 | 优点 | 主要问题 / 风险 | 推荐度 |
| :--- | :--- | :--- | :--- | :--- |
| Docker 离线镜像包部署 | 旧服务器、内网环境、无法稳定联网拉依赖 | 环境一致、可避开宿主机 Glibc/Node 兼容问题、最接近当前项目实践 | 需要本地先构建；镜像 tar 较大；需要手动清理磁盘 | **强烈推荐** |
| Docker 服务器端 build | 服务器能联网，且可访问 Docker Hub / npm | 操作直观，服务器端可直接重建 | 仍依赖本地先产出 `.next-prod`；服务器网络不稳定时容易失败 | 推荐 |
| Vercel 部署 | 前端为主、希望快速托管、数据库可公网访问 | 上线快、域名/HTTPS/回滚方便、适合公开访问场景 | Serverless 运行时约束更多；数据库连接与函数时长要额外关注；部分运行时读文件能力需验证 | 条件满足时可选 |
| 直接 Node.js 部署（非 Docker） | 新服务器环境干净、Node 版本和系统兼容、团队有 Node 运维经验 | 部署链路简单、无需容器 | 宿主机环境差异大；容易踩 Node/Glibc/依赖兼容问题；与当前项目默认方案不一致 | 不推荐作为默认方案 |

### A.2 快速选择建议

- 如果你的服务器系统较旧，或你们更看重“稳定可复现”，选 **Docker 离线镜像包部署**。
- 如果你们希望保留完整后端能力，并且服务器能稳定联网，选 **Docker 服务器端 build**。
- 如果你们希望快速上线到公网，且数据库能提供公网访问或连接代理，可评估 **Vercel**。
- 如果只是临时演示，且服务器环境完全可控，可以考虑 **直接 Node.js 部署**，但不建议作为长期标准方案。

### A.3 各方式的常见误区

#### Docker 方案常见误区

- 误以为只更新服务器 `.env` 就能让前端配置变更生效。
  - 实际上 `NEXT_PUBLIC_*` 属于构建时注入，必须重新构建并重新部署镜像。
- 误以为 `docker compose up -d` 一定会切到新版本。
  - 如果新镜像没有真正 `load` 成功，容器可能只是基于旧镜像重建。
- 误以为 `pnpm exec prisma generate` 就等于“数据库已经更新”。
  - 它只生成 Prisma Client，不会自动执行数据库迁移。
- 误以为当前仓库的 Docker 打包方式适合所有机器和团队。
  - 实际上这套方案是针对 “Mac Apple Silicon 本地构建 + Linux AMD64 运行” 这一特定组合优化的；如果你有 Linux 原生构建环境，完全可以简化。

### A.4 开源使用者如何选择构建策略

如果你不是本项目原始部署环境，而是基于开源仓库自行部署，建议先根据自己的机器和交付方式选择构建策略：

| 构建策略 | 适用场景 | 优点 | 代价 / 风险 |
| :--- | :--- | :--- | :--- |
| 当前默认：本地构建 `.next-prod/standalone` + Docker 内补齐 Linux 原生依赖 | Apple Silicon Mac 本地打包，目标服务器为 Linux AMD64，且希望保留离线 `tar` 分发 | 避开 Mac 上 `buildx/QEMU` 执行 `next build` 的性能和稳定性问题；最终镜像较小 | Dockerfile 依赖 `standalone` 与 `pnpm` 内部结构，后续升级 `Next.js` / `Prisma` / `sharp` 时要重点回归 |
| 标准方案：Linux 原生构建 standalone 后直接装箱 | 有 Linux CI/CD、AMD64 构建机、或可以在目标 Linux 上原生构建 | 结构最标准、维护成本最低、后续升级最稳 | 需要额外准备 Linux 构建环境 |
| 保守方案：镜像内完整安装生产依赖并用 `pnpm start` 运行 | 更看重实现直观，接受更大的镜像和 tar | 逻辑最简单，对 `standalone` 内部结构依赖最低 | 镜像与离线包更大，启动和运行时更重 |

建议：

- 优先看你的 **构建机器架构**，再看你的 **交付方式**。
- 如果你长期维护这个仓库，并且会频繁升级依赖，优先考虑 Linux 原生构建方案。
- 如果你只是需要快速在 Mac 上打一个可离线分发的 Linux 镜像，当前默认方案更省事。

#### Vercel 方案常见误区

- 误以为“能跑 Next.js”就一定能零改动迁到 Vercel。
  - 本项目不仅有页面，还有数据库、Webhook、Swagger 聚合、文档预览、插件版本接口等服务端能力。
- 误以为 Vercel 适合任何数据库拓扑。
  - 如果 MySQL 只允许内网访问，Vercel 无法直接连接，除非你额外提供公网访问或连接代理。
- 误以为所有本地文件都能在运行时直接读取。
  - 本项目存在读取 `docs/`、`chrome-extension/` 等目录文件的接口，迁移到 Vercel 时要确认这些文件被正确打包到函数中。
- 误以为长耗时同步链路天然适合 Serverless。
  - Jenkins / Apifox / Swagger Diff / 钉钉通知这类链路要关注函数超时、重试与外部网络稳定性。

#### 直接 Node.js 部署常见误区

- 误以为“本地能跑 `pnpm dev`，服务器就能跑 `pnpm start`”。
  - 生产环境还涉及 Node 版本、系统库、进程守护、反向代理和日志管理。
- 误以为直接上传代码后执行 `pnpm install && pnpm build` 就结束了。
  - 还需要 `.env`、数据库迁移、静态资源、重启策略和异常恢复方案。

## B. Vercel 部署说明（评估用）

Vercel **可以作为可选部署方式**，但更适合下面的条件：

- 数据库可被公网安全访问，或已经配置连接池 / 代理
- 主要诉求是快速上线与托管，而不是深度控制服务器
- 接受对部分运行时行为做兼容性处理

### B.1 适合上 Vercel 的前提

- 在 Vercel 项目中完整配置 `.env` 里的生产环境变量
- `DATABASE_URL` 指向 Vercel 可访问的 MySQL
- 已确认 Prisma 在生产环境可以正常连接数据库
- 已验证运行时读文件相关能力
- 已验证 Jenkins / Apifox / 钉钉等外部链路不会因函数超时失败

### B.2 迁移到 Vercel 时重点自查

1. 数据库
   - MySQL 是否允许公网访问？
   - 是否需要连接池或数据库代理？

2. 文件读取
   - 文档预览接口会读取 `docs/*.md`
   - 插件版本和系统配置接口会读取 `chrome-extension/manifest.json`
   - 这些文件在 Vercel 函数中是否可用，需要上线后实测

3. 外部集成
   - `PUBLIC_URL` 是否改成 Vercel 域名？
   - Webhook 来源地址、回调地址、白名单是否同步调整？

4. 数据库迁移
   - 不要只执行 `prisma generate`
   - 需要明确生产数据库初始化/迁移策略

### B.3 不建议优先选 Vercel 的情况

- 数据库只能内网访问
- 项目高度依赖公司内网 Jenkins / 服务治理 / 内部系统
- 需要较稳定地执行较长时间的同步或聚合任务
- 团队更熟悉服务器 / Docker 运维，而不是 Serverless 运行时问题排查

## C. 直接 Node.js 部署说明（不推荐默认使用）

如果你确实要跳过 Docker，至少要满足以下条件：

- 服务器系统能兼容当前 Node 版本
- 能稳定执行 `pnpm install`、`pnpm build`
- 已准备进程守护（如 `pm2` / `systemd`）
- 已准备反向代理（如 Nginx）
- 已明确数据库迁移和日志管理方式

更重要的是：本项目当前的主文档、排障经验和交付流程都以 Docker 为基准，因此直接 Node.js 部署的维护成本通常更高。

## 0. 文件说明（建议必读）

- `docker-compose.yml`：偏开发/本机使用（可能包含 `build:`）。
- `docker-compose.prod.yml`：偏服务器使用（应为 `image: dev-portal:latest`，配合 `dev-portal.tar` 离线部署）。
- 在服务器上你可以：
  - **方案 A（推荐）**：把 `docker-compose.prod.yml` 改名为 `docker-compose.yml`，之后直接 `docker compose up -d ...`。
  - **方案 B**：保留 `docker-compose.prod.yml`，每次都用 `-f docker-compose.prod.yml` 指定。
- `server-deploy.sh`：部署辅助脚本（会在当前目录查找 `dev-portal.tar`、compose、`.env` 并执行更新/重建）。

## 1. 前置要求

确保服务器已安装 Docker。
由于 Docker 版本较新 (24+)，我们将使用内置的 **Docker Compose V2** 插件。

```bash
# 检查是否安装
docker compose version
# 如果报错 'docker: 'compose' is not a docker command'，则尝试旧版命令：
# docker-compose version
```

## 2. 部署步骤

1.  **推荐方式：离线镜像包部署（最稳定）**:
    - 在本地执行 `pnpm docker:pack` 生成 `dev-portal.tar`（不会影响本地开发用的 `.next`）。
    - 上传到服务器（放到同一个目录）：`dev-portal.tar` + `docker-compose.prod.yml`（可改名为 `docker-compose.yml`）+ `.env` + 可选 `server-deploy.sh`。
    - 服务器侧（不使用脚本时）执行：
      ```bash
      docker load -i dev-portal.tar
      docker compose -f docker-compose.yml up -d --force-recreate
      ```
    - 服务器侧（使用脚本时）执行：
      ```bash
      chmod +x server-deploy.sh
      ./server-deploy.sh
      # 选择「2. 更新应用（加载 tar 并重建）」
      ```

2.  **备选方式：服务器端 docker build（不推荐）**:
    - 你仍然需要先在本地执行 `pnpm build:prod`，并将生成的目录 **保持为 `.next-prod`（不要改名）** 一起上传到服务器。
    - 然后在服务器目录中运行 `docker compose up -d --build`。
    - 注意：如果你修改的是 `NEXT_PUBLIC_*`（例如 `NEXT_PUBLIC_DEFAULT_APPS`），它属于“构建时注入”，仅改服务器 `.env` 不会让前端生效，必须重新打包镜像。

3.  **构建并启动（仅当你不使用 server-deploy.sh 时）**:
    进入包含 `docker-compose.yml` 的目录并运行：

    ```bash
    # 方式 1: 如果文件名是 docker-compose.yml (标准)
    docker compose up -d

    # 方式 2: 如果文件名是 docker-compose.prod.yml (未重命名)
    docker compose -f docker-compose.prod.yml up -d
    ```

    _(如果是第一次运行，构建过程可能需要几分钟)_

4.  **验证**:
    ```bash
    docker compose ps
    ```
    状态应为 `Up`。访问 `http://服务器IP:3001` 即可。

## 2.1 验证与排障（强烈建议）

### 2.1.1 验证“是否真的更新成功”

离线部署时，务必确认 **新 tar 已成功 load**、且 **容器已使用新镜像重建**：

```bash
# 1) 上传文件是否完整（大小/时间是否符合预期）
ls -lh dev-portal.tar

# 2) load 成功标志：输出应包含 "Loaded image: dev-portal:latest"
docker load -i dev-portal.tar

# 3) 镜像是否更新（Id/Created 应变化）
docker image inspect dev-portal:latest --format '{{.Id}} {{.Created}}'

# 4) 容器是否已切到新镜像（Image ID 应与上面一致）
docker inspect dev-portal --format '{{.Image}} {{.Config.Image}} {{.State.StartedAt}}'
```

> [!TIP]
> 如果 `docker load` 失败，但你仍继续执行了 `docker compose up ...`，最终只会“重建旧容器”，页面看起来就会“一直没变化”。

### 2.1.2 常见问题：`docker load` 报 `no space left on device`

这代表服务器磁盘空间不足（常见在 Docker 数据目录所在分区）。建议按顺序处理：

```bash
# 看磁盘/镜像占用
df -h
docker system df

# 清理无用资源（按需，慎用 -a）
docker container prune -f
docker image prune -f
docker builder prune -f
# docker image prune -a -f
```

### 2.1.3 常见原因：反复 `docker load` 导致旧镜像堆积

即使每次加载的都是同一个 tag（例如 `dev-portal:latest`），`docker load` 也会导入一份“新的镜像内容”，原先的镜像会变成 **dangling（无 tag）**，如果不清理会持续占用磁盘。

排查与处理建议：

```bash
# 1) 查看 dev-portal 镜像与大小
docker image ls | head
docker image ls | rg "dev-portal"

# 2) 查看 dangling 镜像数量/大小（重点）
docker image ls -f dangling=true

# 3) 安全清理：只删 dangling（推荐）
docker image prune -f
```

> [!TIP]
> 如果你使用 `server-deploy.sh`，在“更新应用（加载 tar 并重建）”后会提示是否清理，
> 也可以在菜单中选择「6. 清理未使用镜像」。

### 2.1.4 常见误区：只改服务器 `.env` 但前端没变化

如果你修改的是 `NEXT_PUBLIC_*`（例如 `NEXT_PUBLIC_DEFAULT_APPS`），它属于 **构建时注入**：

- 仅在服务器修改 `.env` 不会改变已打包进镜像的前端内容；
- 需要重新在本地执行 `pnpm docker:pack` 并上传新的 `dev-portal.tar` 再更新。

## 3. 常用命令

- **查看日志**:
  ```bash
  docker compose logs -f
  ```
- **重启服务**:
  ```bash
  docker compose restart
  ```
- **停止服务**:
  ```bash
  docker compose down
  ```
- **更新代码后重新部署**:
  ```bash
  # 方式 A（离线镜像包）：上传新的 dev-portal.tar 后
  docker load -i dev-portal.tar
  docker compose up -d --force-recreate

  # 方式 B（服务器端 build）：拉取/更新代码后
  # docker compose up -d --build
  ```

## 3.1 Prisma 数据库迁移（强烈建议保留）

> [!IMPORTANT]
> `pnpm exec prisma generate` **只会生成 Prisma Client（类型/代码）**，不会建表/加字段/删字段。
> 真正让数据库结构“从 0 变成可用”，需要跑迁移（migrations）。

### 开发环境（本地）

当你修改了 `prisma/schema.prisma`（例如新增字段）：

```bash
# 生成并应用迁移（会连接数据库）
pnpm exec prisma migrate dev

# 如果遇到 Prisma Client 字段不一致（例如提示 Unknown argument），可手动再生成一次
pnpm exec prisma generate
```

> [!NOTE]
> 如果你本地正在跑 `pnpm dev`，改完 schema 后仍然报 “Unknown argument xxx”，通常是旧 Prisma Client/旧 dev 进程未刷新：
> 先停掉 `pnpm dev` 再重新启动即可。

### 生产/服务器（Docker）

部署时（无论数据库是空库还是已有数据），建议用 **deploy** 模式执行迁移：

```bash
# 只会应用 prisma/migrations 中尚未执行的迁移（不会生成新迁移）
pnpm exec prisma migrate deploy

# 确保 Prisma Client 与 schema 一致
pnpm exec prisma generate
```

> [!TIP]
> 如果你们确定“每次都是全新空库”，理论上可以用 `pnpm exec prisma db push` 直接同步结构；
> 但它没有迁移历史、不利于排查与回溯，所以本项目选择保留 migrations。

## 3.2 Swagger 自动同步上线后校验（新增）

完成部署后，建议执行一次最小校验：

1. 执行迁移并重启服务，确认存在 `apifox_spec_snapshot` 表。
2. 打开 `Swagger Efficiency Kit -> CI/CD 自动化插件`，点击 `初始化基线`。
3. 触发一次 Jenkins 自动化推送：
   1. 第一次通常会建立或覆盖基线。
   2. 第二次开始应在钉钉中看到 Diff 摘要与接口路径明细。
4. 如初始化时报错 `Cannot read properties of undefined (reading 'upsert')`，通常是 Prisma Client 未刷新：
   1. 重新执行 `pnpm exec prisma generate`。
   2. 重启应用或重建容器。

## 4. (可选) 清理无效的 NVM 环境

由于我们已切换到 Docker 部署，宿主机上之前安装的 NVM 和 Node (因 Glibc 版本过低无法使用) 可以安全清理。

**清理步骤**:

1.  **删除 NVM 目录**:

    ```bash
    rm -rf ~/.nvm
    ```

2.  **清理 Shell 配置**:
    编辑 `~/.bashrc` (或 `~/.zshrc`)，删除以下 NVM 初始化代码：

    ```bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    ```

3.  **生效**:
    ```bash
    source ~/.bashrc
    ```

## 5. (故障排除) Docker 镜像拉取超时

如果构建时卡在 `load metadata for docker.io/library/node:20-alpine`，说明服务器无法连接 Docker Hub。
请配置国内镜像加速器。

**操作步骤**:

1.  **编辑配置**:

    ```bash
    mkdir -p /etc/docker
    vim /etc/docker/daemon.json
    ```

2.  **写入以下内容** (使用国内可用源):

    ```json
    {
      "registry-mirrors": [
        "https://docker.m.daocloud.io",
        "https://huecker.io",
        "https://dockerhub.timeweb.cloud",
        "https://noohub.ru"
      ]
    }
    ```

3.  **重启 Docker**:

    ```bash
    systemctl daemon-reload
    systemctl restart docker
    ```

## 6. (替代方案) 本地构建并上传 (离线部署)

如果服务器网络实在太差，您可以在 **本地电脑** 构建好镜像，然后上传到服务器。
_(注意：需要本地也安装 Docker)_

### 方式 A: 使用 NPM 快捷命令 (推荐)

我们在 `package.json` 中配置了快捷脚本，您只需运行：

1.  **一键构建并打包**:

    ```bash
    pnpm docker:pack
    # 该命令会自动运行 pnpm build:prod 并打包成 dev-portal.tar
    # 且不会影响您本地正在运行的开发环境 (.next)
    ```

2.  **上传文件**:
    您需要上传可以通过离线部署的 **两个核心文件**：
    - `dev-portal.tar` (镜像包)
    - `docker-compose.prod.yml` (**生产环境专用配置**，请在服务器上重命名为 `docker-compose.yml`)

    ```bash
    scp dev-portal.tar root@your-server-ip:/root/project/
    scp docker-compose.prod.yml root@your-server-ip:/root/project/docker-compose.yml
    ```

### 方式 B: 手动执行命令

1.  **本地构建 (指定 x86 架构)**:

    > [!IMPORTANT] > **Mac M1/M2/M3 (Apple Silicon) 用户必须保留 `--platform linux/amd64` 参数**。
    > 否则构建出的镜像（ARM 架构）将无法在普通 Linux 服务器（通常是 x86/AMD64 架构）上运行。

    ```bash
    # 在项目根目录执行
    docker buildx build --platform linux/amd64 -t dev-portal:latest .
    ```

2.  **导出镜像**:

    ```bash
    docker save -o dev-portal.tar dev-portal:latest
    ```

3.  **上传到服务器**:

    ```bash
    # 使用 scp 或其他工具
    scp dev-portal.tar root@your-server-ip:/root/
    ```

4.  **服务器导入**:

    ```bash
    docker load -i dev-portal.tar
    ```

5.  **修改配置启动**:
    编辑服务器上的 `docker-compose.yml`，注释掉 `build` 部分，直接使用镜像：
    ```yaml
    version: "3"
    services:
      dev-portal:
        image: dev-portal:latest # <--- 使用导入的镜像
        # build:                  # <--- 注释掉构建配置
        #   context: .            # <--- 注释掉
        #   dockerfile: Dockerfile # <--- 注释掉
        container_name: dev-portal
        restart: always
        ports:
          - "3001:3001"
        environment:
          - NODE_ENV=production
    ```
    然后运行 `docker compose up -d` 即可。

### 🚀 极简运维 (推荐)

我们为您准备了 `server-deploy.sh` 脚本，将它与 `dev-portal.tar` 一起上传到服务器，然后执行：

```bash
chmod +x server-deploy.sh
./server-deploy.sh
```

会出现交互式中文菜单，您可以选择：

1. **首次部署（初始化）**：自动检查 `.env`、加载 `dev-portal.tar` 并启动服务。
2. **更新应用（加载 tar 并重建）**：上传新的 `dev-portal.tar` 后使用；更新前会询问是否需要备份（默认不备份）。
3. **仅重启服务**：不更新镜像，仅重启容器。
4. **查看日志（Ctrl+C 返回）**：进入 `docker compose logs -f` 跟随日志，按 `Ctrl+C` 返回菜单。
5. **进入容器 Shell（exit 返回）**：进入容器后输入 `exit` 返回菜单。
6. **清理未使用镜像**：执行 `docker image prune -f`。
7. **备份当前版本（镜像 + 配置 + tar）**：备份到 `./backups/<时间戳>/`。
8. **回滚到备份版本**：从 `./backups/` 选择一个备份回滚（可选同时恢复 `.env/compose`）。

每次执行完一项操作后，脚本会询问是否继续；默认不继续并自动退出。

#### 备份与空间占用说明

- 备份目录：`./backups/YYYYMMDD-HHMMSS/`
- 环境检查：脚本会检查 `.env` 中的 `DEVPORTAL_EXTENSION_API_KEY`，未配置会提示输入（否则插件可能提示 `Server not configured`）。
- 备份内容（尽力而为，缺少就跳过）：
  - `dev-portal.tar`（如果当前目录存在，会复制一份进去）
  - `image.tar`（如果服务器上存在 `dev-portal:latest` 镜像，会 `docker save` 备份一份）
  - `.env` 与 `docker-compose*.yml`
- 空间占用：`dev-portal.tar` 与 `image.tar` 体积通常同量级（都可能比较大），因此默认只保留最近 1 份备份。
- 保留策略：脚本内置 `BACKUP_KEEP=1`，每次备份后会自动清理旧备份（只会清理 `./backups/` 下符合时间戳格式的目录，不会影响容器、数据库或其他文件）。

### 🔄 服务器端如何更新 (重启)?

当您上传了新的 `dev-portal.tar` 到服务器后，请按以下步骤更新服务：

1.  **导入新镜像**:
    ```bash
    docker load -i dev-portal.tar
    ```
2.  **重启服务 (加载新镜像)**:

    ```bash
    # 停止并删除旧容器
    docker compose down

    # 启动新容器
    docker compose up -d
    ```

    _(注：必须执行 down 再 up，或者使用 `docker compose up -d --force-recreate`，否则 Docker 可能会认为容器没变而不更新)_

## 7. (附录) 技术原理：为什么这样快且稳？

为了解决 Mac Apple Silicon (ARM) 模拟 Linux (x86) 构建慢且易崩溃的问题，我们采用了 **“本地构建 standalone + Docker 内补齐 Linux 原生依赖”** 策略。

### 核心流程可视化

```mermaid
graph TD
    %% Define Styles
    classDef local fill:#e6f7ff,stroke:#1890ff,stroke-width:2px;
    classDef server fill:#f6ffed,stroke:#52c41a,stroke-width:2px;
    classDef artifact fill:#fff7e6,stroke:#fa8c16,stroke-width:2px,stroke-dasharray: 5 5;

    subgraph Local ["💻 本地环境 (Mac M-Chip)"]
        direction TB
        Code[Source Code] --> |1. pnpm build:prod| NextDist[.next-prod 文件夹]:::artifact
        NextDist --> |2. COPY standalone + static| DockerBuild["Docker Build (x86)"]
        Pkg[package.json / prisma] --> |3. 仅生成 Linux Prisma / sharp 运行时依赖| DockerBuild
        DockerBuild --> |4. docker save| TarFile[dev-portal.tar]:::artifact
    end

    TarFile --> |5. scp 上传| ServerEnv
    Config[docker-compose.prod.yml] --> |5. scp 上传| ServerEnv

    subgraph ServerEnv ["☁️ 生产服务器 (Linux)"]
        direction TB
        LoadedImage[Loaded Image]
        RunningContainer[🟢 Running Container]

        TarFile --> |6. docker load| LoadedImage
        Config --> |7. docker compose up| RunningContainer
        LoadedImage -.-> RunningContainer
    end

    class Local local
    class ServerEnv server
```

### 构建流程图解

1.  **本地编译 (Local Build)**:
    - 在您的 Mac 上利用原生 CPU 性能执行 `pnpm build:prod`。
    - **产出**: `.next-prod` 文件夹（包含 `standalone`、`static` 以及通用的 JS/CSS/HTML 产物）。
    - **隔离**: 此过程**不影响**您本地 `.next` 目录（即不影响 `pnpm dev`）。
    - _注意：此时构建产物中的原生依赖仍然带有宿主机平台特征，不能直接假设适用于 Linux。_

2.  **Docker 原生依赖生成 (Container Native Deps)**:
    - Docker 构建时，不会重新执行 `next build`。
    - 它会在 Linux x86 环境中单独执行依赖安装与 `prisma generate`，提取 Linux 版的 Prisma / sharp 运行时文件。
    - **产出**: 仅包含 Linux 原生运行时所需的依赖目录，而不是完整重建整个应用。

3.  **运行时装箱 (Runtime Packaging)**:
    - 最终镜像复制第 1 步生成的 `.next-prod/standalone` 与 `.next-prod/static`。
    - 然后用第 2 步生成的 Linux 原生运行时文件替换构建产物中的宿主机版本。
    - 结果：获得一个既包含最新业务代码、又能在 Linux 上正确运行 Prisma / sharp 的镜像。

### 7.1 这不是唯一方案

对于开源使用者，请将本节理解为“当前仓库默认策略的设计原因”，而不是唯一的部署标准：

- 如果你直接在 Linux AMD64 环境构建，本节这套“补齐 Linux 原生依赖”的额外复杂度通常可以省掉。
- 如果你更看重可维护性而不是镜像大小，也可以回到 `pnpm start` 的传统方案。
- 如果你修改了 `Next.js`、`Prisma`、`sharp` 版本，建议重新验证 Docker 打包流程，而不要假设当前 Dockerfile 永远无需调整。

## 8. 公司内网部署与分发指南

如果您需要在公司内部推广使用本系统，请参考以下流程：

### 8.1 服务端部署 (后端)

请按照本文档第 2 节或第 6 节的步骤，将服务部署在公司内网服务器上（例如 `192.168.x.x`）。
假设部署后的服务地址为：`http://192.168.1.100:3001`

### 8.2 Chrome 扩展打包与分发 (客户端)

为了让同事们无需安装 Git 或 Node.js 环境也能使用扩展，您需要打包并分发配置好的扩展程序。

#### 第一步：修改 API 地址

打开代码中的 `chrome-extension/popup.js` 文件，将顶部的 `API_URL` 修改为内网服务器地址：

```javascript
// chrome-extension/popup.js
// const API_URL = "http://localhost:3000/api/match-credentials";
const API_URL = "http://192.168.1.100:3001/api/match-credentials"; // <--- 修改这里
const API_KEY = "YOUR_SHARED_KEY"; // <--- 同时配置 Key（与服务端 DEVPORTAL_EXTENSION_API_KEY 一致）
```

#### 第二步：打包扩展

1.  进入 `chrome-extension` 目录。
2.  将该目录下的所有文件（`manifest.json`, `popup.html`, `popup.js`, `background.js`, `README.md` 等）打包成一个 `.zip` 压缩包。
3.  命名建议：`DevPortal-Extension-v1.0.zip`。

#### 第三步：分发与安装

1.  将 `DevPortal-Extension-v1.0.zip` 发送给同事，或上传到公司网盘。
2.  **同事需执行的操作**：
    - 解压 `.zip` 包到一个固定文件夹。
    - 打开 Chrome 浏览器，访问 `chrome://extensions/`。
    - 开启右上角的 **“开发者模式”**。
    - 点击左上角的 **“加载已解压的扩展程序”**，选择解压后的文件夹。
    - 推荐点击浏览器工具栏的“拼图”图标，将插件 **固定 (Pin)** 在工具栏上。

---

Powered by Next.js & Prisma
