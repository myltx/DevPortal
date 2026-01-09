# 项目部署文档 (PM2)

## 1. 前置要求

**注意**: 本项目基于 **Next.js 16** 和 **React 19**，**必须**使用 Node.js **v18.17.0** 或更高版本（推荐 v20+）。
**服务器现有的 Node.js v16 无法运行本项目。**

### 解决方案：使用 NVM 管理多版本 Node (推荐)

> [!NOTE] > **无需卸载系统自带的 Node v16**。
> nvm 安装后，只会在当前用户的 Shell 环境中生效。当您使用 `nvm` 时，它会临时修改 PATH 变量，优先使用 nvm 管理的 Node 版本，不会影响服务器上其他依赖系统 Node 的服务。

> [!WARNING] > **切勿使用 `npm install -g nvm` 安装！**
> npm 上的 `nvm` 包不是真正的版本管理工具。如果您已经执行了该命令，请先运行 `npm uninstall -g nvm` 进行卸载。

请使用官方脚本安装真正的 nvm：

```bash
# 1. 安装 NVM (使用 curl)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 或者使用 wget
# wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# 2. 使 nvm 立即生效 (或重新连接 SSH)
source ~/.bashrc

# 故障排除：如果报错 "-bash: /usr/bin/nvm: 没有那个文件或目录"
# 说明之前错误的 npm 安装留下了残留，请执行以下清理命令：
# rm -rf /usr/bin/nvm /usr/local/bin/nvm
# export NVM_DIR="$HOME/.nvm"
# [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 3. 安装 Node 20 (LTS)
nvm install 20

# 3. 确认版本
node -v
# 应输出 v20.x.x
```

---

## 2. 部署步骤

1.  **上传代码**: 将 `web` 目录上传至服务器。
2.  **安装依赖**:
    ```bash
    cd web
    # 确保当前使用 Node 20+
    nvm use 20
    npm install
    ```
3.  **构建项目**:
    ```bash
    npm run build
    ```
4.  **启动服务 (PM2)**:

    如果 PM2 是用旧版 Node 全局安装的，可能有兼容问题。建议：

    **方式 A (推荐)**: 在 Node 20 环境下安装 PM2 并启动：

    ```bash
    npm install -g pm2
    pm2 start ecosystem.config.js
    ```

    **方式 B (指定解释器)**: 如果不想重装 PM2，可以在 `ecosystem.config.js` 中指定 Node 20 的路径。

    1. 获取 Node 20 路径: `nvm which 20` (例如 `/root/.nvm/versions/node/v20.10.0/bin/node`)
    2. 修改 `ecosystem.config.js` (见下一节)。

## 3. 常用 PM2 命令

- 查看状态: `pm2 status`
- 查看日志: `pm2 logs nextjs-nav`
- 重启服务: `pm2 restart nextjs-nav`
- 停止服务: `pm2 stop nextjs-nav`

## 4. 端口配置

默认使用端口 **3001**。如需修改，请编辑 `ecosystem.config.js` 中的 `PORT` 字段。
