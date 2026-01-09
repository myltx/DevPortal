# 项目部署文档 (Docker)

> [!IMPORTANT]
> 由于服务器操作系统较旧 (Glibc 版本过低)，无法直接运行 Node.js 20。
> **我们已切换为 Docker 容器化部署方案**。这可以完美避开系统环境不兼容的问题。

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

1.  **上传代码**: 将 `web` 目录上传至服务器。
2.  **构建并启动**:
    进入目录并运行：

    ```bash
    cd web
    # 使用 V2 命令 (推荐)
    docker compose up -d --build

    # 如果 V2 不可用，尝试旧版：
    # docker-compose up -d --build
    ```

    _(如果是第一次运行，构建过程可能需要几分钟)_

3.  **验证**:
    ```bash
    docker compose ps
    ```
    状态应为 `Up`。访问 `http://服务器IP:3001` 即可。

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
  # 拉取/更新代码后
  docker compose up -d --build
  ```

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
    npm run docker:pack
    # 等待完成后，当前目录会生成 nextjs-nav.tar
    ```

2.  **上传**:
    ```bash
    scp nextjs-nav.tar root@your-server-ip:/root/
    ```

### 方式 B: 手动执行命令

1.  **本地构建 (指定 x86 架构)**:

    > [!IMPORTANT] > **Mac M1/M2/M3 (Apple Silicon) 用户必须保留 `--platform linux/amd64` 参数**。
    > 否则构建出的镜像（ARM 架构）将无法在普通 Linux 服务器（通常是 x86/AMD64 架构）上运行。

    ```bash
    # 在项目根目录执行
    docker buildx build --platform linux/amd64 -t nextjs-nav:latest .
    ```

2.  **导出镜像**:

    ```bash
    docker save -o nextjs-nav.tar nextjs-nav:latest
    ```

3.  **上传到服务器**:

    ```bash
    # 使用 scp 或其他工具
    scp nextjs-nav.tar root@your-server-ip:/root/
    ```

4.  **服务器导入**:

    ```bash
    docker load -i nextjs-nav.tar
    ```

5.  **修改配置启动**:
    编辑服务器上的 `docker-compose.yml`，注释掉 `build` 部分，直接使用镜像：
    ```yaml
    version: "3"
    services:
      nextjs-nav:
        image: nextjs-nav:latest # <--- 使用导入的镜像
        # build:                  # <--- 注释掉构建配置
        #   context: .            # <--- 注释掉
        #   dockerfile: Dockerfile # <--- 注释掉
        container_name: nextjs-nav
        restart: always
        ports:
          - "3001:3001"
        environment:
          - NODE_ENV=production
    ```
    然后运行 `docker compose up -d` 即可。
