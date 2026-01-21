# 环境变量配置手册 (.env)

为了确保 DevPortal 在不同环境下正常工作，请在项目根目录创建或修改 `.env` 文件。

---

## 1. 基础服务配置

| 变量名                        | 必填 | 示例          | 描述             |
| :---------------------------- | :--- | :------------ | :--------------- |
| `DATABASE_URL`                | 是   | `mysql://...` | 数据库连接字符串 |
| `DEVPORTAL_EXTENSION_API_KEY` | 是   | `yw-dev-2026` | 内部组件通信密钥 |

---

## 2. API 同步与 Apifox 配置

本模块涉及 Jenkins 自动触发同步以及公网拉取逻辑。

| 变量名                   | 必填 | 示例                      | 描述                                             |
| :----------------------- | :--- | :------------------------ | :----------------------------------------------- |
| `APIFOX_ACCESS_TOKEN`    | 是   | `APS-xxxxxx`              | Apifox 的个人访问令牌                            |
| `PUBLIC_URL`             | 是   | `http://portal.cn`        | **重点**：本服务公网域名，供 Apifox 云端拉取数据 |
| `INTERNAL_WEBHOOK_URL`   | 否   | `http://192.168.x.x:3001` | **推荐**：内网固定地址，供 Jenkins 回调使用      |
| `SWAGGER_EXPORT_SECRET`  | 是   | `rand_str_123`            | 导出接口的安全验证密钥 (秘密)                    |
| `JENKINS_WEBHOOK_SECRET` | 是   | `yw_2026`                 | 与 Jenkins 约定的认证 Token (x-jenkins-token)    |

---

## 3. 社交与监控配置

| 变量名                 | 必填 | 示例              | 描述                    |
| :--------------------- | :--- | :---------------- | :---------------------- |
| `DINGTALK_WEBHOOK_URL` | 是   | `https://oapi...` | 钉钉机器人 Webhook 地址 |
| `DINGTALK_SECRET`      | 是   | `SECxxxxxx`       | 钉钉机器人加签密钥      |

---

## 4. 生产环境 CheckList (上线前核对)

- [ ] `.env` 文件中的 `PUBLIC_URL` 是否是公网可访问的？
- [ ] 域名对应的 NGINX 是否已经透传了正确的 `Host` 头？
- [ ] Apifox 开放 API 的 IP 白名单是否已允许本服务器（如果开启了白名单）？
- [ ] 数据库是否执行了最新的脚本？
- [ ] Jenkins 脚本中的地址是否使用了 `INTERNAL_WEBHOOK_URL` 配置的 IP？
