# 项目部署文档 (PM2)

## 1. 前置要求

服务器需安装 Node.js 和 PM2。

```bash
# 安装 PM2 (如果尚未安装)
npm install -g pm2
```

## 2. 部署步骤

1.  **上传代码**: 将 `web` 目录上传至服务器。
2.  **安装依赖**:
    ```bash
    cd web
    npm install
    # 或者如果不使用 package-lock.json
    # npm install --no-package-lock
    ```
3.  **构建项目**:
    ```bash
    npm run build
    ```
4.  **启动服务**:
    ```bash
    # 使用 PM2 启动 (已配置端口 3001)
    pm2 start ecosystem.config.js
    ```

## 3. 常用 PM2 命令

- 查看状态: `pm2 status`
- 查看日志: `pm2 logs nextjs-nav`
- 重启服务: `pm2 restart nextjs-nav`
- 停止服务: `pm2 stop nextjs-nav`

## 4. 端口配置

默认配置在 `ecosystem.config.js` 中使用端口 **3001**。
如需修改，请编辑该文件中的 `PORT` 字段。
