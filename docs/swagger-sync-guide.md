# Swagger 聚合与 Apifox 自动同步使用手册

本手册旨在指导开发者如何利用 DevPortal 的 Swagger 工具实现多服务接口聚合，并将其全自动同步至 Apifox 环境。

---

## 1. 核心流程图（当前版本）

```mermaid
graph TD
    A[后端服务 Swagger] -->|手动/自动| B(DevPortal 聚合)
    B -->|Webhook 触发| C[导入前 Diff]
    C -->|URL 导入| D[Apifox 云端服务器]
    C -->|摘要+明细| E[钉钉机器人]
    D -->|导入成功后更新| F[快照基线表]
    D -->|拉取数据| B
```

---

## 2. 环境配置清单 (.env)

在服务器部署前，请确保服务器端的 `.env` 文件中包含以下核心变量：

| 变量名                   | 必填 | 描述                                                                                          |
| :----------------------- | :--- | :-------------------------------------------------------------------------------------------- |
| `PUBLIC_URL`             | 是   | **公网拉取地址**：Apifox 云端拉取接口数据时访问的地址（需公网通）。                           |
| `INTERNAL_WEBHOOK_URL`   | 否   | **内网回调地址**：用于 Jenkins 回调。建议配置为内网固定 IP，如 `http://192.168.60.201:3001`。 |
| `SWAGGER_EXPORT_SECRET`  | 是   | 导出接口的安全验证密钥，建议设置为复杂的随机字符串。                                          |
| `APIFOX_ACCESS_TOKEN`    | 是   | Apifox 个人访问令牌（在 Apifox 账号设置中获取）。                                             |
| `JENKINS_WEBHOOK_SECRET` | 是   | 与 Jenkins 约定的认证 Token (x-jenkins-token)。                                               |
| `DINGTALK_WEBHOOK_URL`   | 是   | 钉钉机器人的 Webhook 地址。                                                                   |

---

## 3. 手动操作指南

1.  **快速填单**：打开 `DevPortal > 工具箱 > Swagger 聚合`。
2.  **智能粘贴**：复制后端服务的任意 Swagger 地址（如 `http://test-api.com/doc.html`），粘贴到 **Target URL**，系统自动拆分域名和前缀。
3.  **验证连接**：点击“**测试连接**”，确保 DevPortal 能解析该服务的 Swagger。
4.  **Apifox 预览**：在“聚合导入链接”区域查看生成的 URL，可直接点击“浏览器访问”检查数据流。

---

## 4. Diff 验证与模拟推送（本地联调）

在 `Swagger Efficiency Kit` 中已内置 `Diff 验证` Tab，支持两种模式：

1. `JSON 对比`：手动粘贴 before/after 两份文档做对比。
2. `接口自动对比`：输入两个 URL，系统自动拉取文档后做对比。

对比完成后可点击：

1. `对比后推送钉钉（模拟）`：仅发送钉钉消息，不写快照、不触发 Apifox 导入。

---

## 5. 自动化同步 (Jenkins 接入)

1.  **准备参数**：在 Webhook 配置区填入 Apifox 的 **Project ID** 和 **项目名称**。
2.  **获取脚本**：系统自动生成 **Groovy** (用于 Pipeline) 或 **cURL** (用于 Shell)。
3.  **Jenkins 配置**：将脚本拷贝到 Jenkins 任务的构建后操作中。
4.  **效果**：构建成功后自动触发 Apifox 同步，同步完成后，钉钉会收到包含“接口统计 + Diff 摘要 + 接口路径明细”的推送。

---

## 6. 初始化基线（推荐先执行）

在 `CI/CD 自动化插件` Tab 中，提供 `初始化基线` 按钮。

1. 作用：按 `projectId` 写入或覆盖当前快照基线。
2. 不会做的事：不会触发 Apifox 导入，不会推送钉钉。
3. 建议：首次上线前先执行一次，再触发自动化构建，第二次开始就能稳定看到 Diff 变更结果。

---

## 7. 同步日志与排查

### 7.1 钉钉通知内容

同步完成后，钉钉通知将清晰地分行展示：

1. 摘要表格：新增、删除、修改、无变化、Before、After。
2. 接口明细表格：类型 + 接口路径（压缩显示，便于手机查看）。
3. 兜底提示：若 Diff 失败，会降级为统计结果并标注失败原因。

### 7.2 可视化日志查询

若需要排查同步异常（如字段未生效），可前往系统后台：

1. 进入 **[系统配置] -> [同步日志]** 菜单。
2. 查看每一次同步的详细状态与统计。
3. 点击 **[详情]** 按钮，查看 Apifox 返回的 **完整原始 JSON 报文**，快速定位问题根源。

---

## 8. 常见问题排查 (Troubleshooting)

### Q1: Apifox 报错 422001 (Invalid Parameter)

- **原因**：Apifox 云端无法连接到你配置的 `PUBLIC_URL`，或 `SWAGGER_EXPORT_SECRET` 校验失败。
- **对策**：确保 `PUBLIC_URL` 是真实公网地址（非 localhost），且 Token 正确。

### Q2: 复制按钮报错 'writeText'...

- **原因**：浏览器限制非 HTTPS 域名调取剪贴板。
- **对策**：代码已内置兜底方案。如果失效，请手动复制或升级系统到 HTTPS。

### Q3: 钉钉通知信息不全

1. 确保服务器已部署最新版代码。
2. 若显示“首次基线导入”，属于预期；下一次同步才会输出完整 Diff 明细。
3. 若显示“Diff 明细生成失败”，请先检查快照表是否存在，以及服务是否已重新加载最新 Prisma Client。

### Q4: 初始化基线时报错 `Cannot read properties of undefined (reading 'upsert')`

1. 原因：服务进程仍在使用旧 Prisma Client（常见于只更新代码未重启）。
2. 对策：
   1. 执行 `npx prisma generate`。
   2. 重启应用进程（或重建容器）。
   3. 确认数据库已应用迁移并存在 `apifox_spec_snapshot` 表。

---

> [!TIP]
> **推荐方案**：Jenkins 脚本使用 `INTERNAL_WEBHOOK_URL` (内网 IP) 保证推送稳定；`.env` 正确配置 `PUBLIC_URL` (公网域名) 保证 Apifox 抓取成功。
