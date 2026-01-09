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
