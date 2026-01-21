# Apifox & Swagger 自动同步指南

本项目提供了一套健壮的 Swagger 数据合并与自动同步方案，特别对超大项目（3000+ 接口）和分层安全进行了深度优化。

## 1. 核心架构

采用了“双层隔离”的安全设计：

- **内部端点 (`/api/tool/swagger-merge`)**: 原始接口，无 Token 校验，建议仅供内网/信任环境访问。
- **安全出口 (`/api/swagger/public-export`)**: 专用端点，必须携带 `token` 参数方可访问，适合映射到公网供 Apifox Cloud 使用。

## 2. 处理大负载 (URL 模式)

针对大型项目（如 4.7MB 的 Swagger JSON），本项目弃用了直接推送模式，改为 **URL 拉取指令**:

1. Jenkins Webhook 触发。
2. 门户生成一个带鉴权的临时 URL。
3. Apifox 收到通知后主动拉取数据。
   _注：这彻底解决了网关超时和 POST 负载过大的问题。_

## 3. 环境变量配置

在 `.env` 中完成以下配置：

```bash
# 本服务的公网 URL (例如 http://your-domain.com)
PUBLIC_URL=

# 自动同步的鉴权令牌
SWAGGER_EXPORT_SECRET=your_auth_token

# Apifox 接入配置
APIFOX_ACCESS_TOKEN=APS-xxxxxxxxxxxxxxxxx
```

## 4. 钉钉监控

无论同步成功或失败，系统都会第一时间通过钉钉机器人通知：

- **成功**: 展示新增/更新统计。
- **失败**: 红色告警，展示具体错误码（如鉴权失败、URL 不通等）。
- **配置项**: `DINGTALK_WEBHOOK_URL` 和 `DINGTALK_SECRET`。

---

> 详细演练记录请参考：[演练文档](../walkthrough.md) (由 AI 助手生成)
