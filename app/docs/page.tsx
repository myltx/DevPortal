"use client";

import React from "react";
import {
  Typography,
  Card,
  Timeline,
  Tag,
  Descriptions,
  Divider,
  Space,
  Tooltip,
  Button,
} from "antd";
import {
  AppstoreOutlined,
  ChromeOutlined,
  ApiOutlined,
  CloudServerOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

const { Title, Paragraph, Text } = Typography;

export default function DocsPage() {
  const router = useRouter();

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      {/* Header with Navigation */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 40,
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
        <Tooltip title="返回工作台">
          <div
            style={{
              position: "absolute",
              left: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              cursor: "pointer",
              borderRadius: 4,
              transition: "background 0.2s",
            }}
            onClick={() => router.push("/middle")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }>
            <AppstoreOutlined style={{ fontSize: "18px" }} />
          </div>
        </Tooltip>
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>
            DevPortal 技术文档
          </Title>
          <Text type="secondary">集成化研发效能平台 · 功能概览与更新日志</Text>
        </div>
      </div>

      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* 1. Core Feature: Project Site */}
        <Card
          title={
            <Space>
              <AppstoreOutlined />
              <span>核心功能: 项目空间 (Project Site)</span>
            </Space>
          }>
          <Paragraph>
            DevPortal
            的核心模块，用于统一管理公司内部各行业线、各环境的服务入口。
          </Paragraph>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="多环境支持">
              支持 <Tag color="green">生产</Tag> <Tag color="orange">开发</Tag>{" "}
              <Tag color="blue">测试</Tag> <Tag color="gold">灰度</Tag>{" "}
              <Tag color="red">演示</Tag> 等多套环境并行管理
            </Descriptions.Item>
            <Descriptions.Item label="快速跳转">
              提供服务直达链接、账号密码快捷复制功能
            </Descriptions.Item>
            <Descriptions.Item label="后台管理">
              支持按行业线 (Class)、地区 (Area)、项目 (Project)
              三级维度进行服务归类
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 2. Efficiency Tool: Swagger Merge */}
        <Card
          title={
            <Space>
              <ApiOutlined />
              <span>效能工具: Swagger Merge Tool</span>
            </Space>
          }>
          <Paragraph>
            解决微服务架构下 Swagger 文档分散、导入繁琐的痛点。
            <a onClick={() => router.push("/tool/swagger")}> [前往体验]</a>
          </Paragraph>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="聚合模式">
              <Text strong>Merge Mode</Text>: 将多个微服务的
              `v2/api-docs?group=xxx` 聚合为一个完整的 `swagger.json`
            </Descriptions.Item>
            <Descriptions.Item label="智能处理">
              <ul>
                <li>自动识别 URL 后缀 (如 `/doc.html`) 并归一化</li>
                <li>自动重写 Tag 防止冲突 (Format: `GroupName/TagName`)</li>
                <li>
                  <Tag color="blue">Strict Mode</Tag>: 仅保留 `200`, `40001`,
                  `40003` 状态码，净化文档
                </li>
              </ul>
            </Descriptions.Item>
            <Descriptions.Item label="CI/CD 集成">
              提供 Jenkins Webhook 接口，构建成功后自动触发 Apifox 文档同步
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* 3. Chrome Extension */}
        <Card
          title={
            <Space>
              <ChromeOutlined />
              <span>浏览器扩展: DevPortal Helper</span>
            </Space>
          }
          extra={
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              href="/extension/chrome-extension-latest.zip"
              target="_blank">
              下载插件 (Latest)
            </Button>
          }>
          <Paragraph>
            配合 DevPortal 使用的 Chrome 插件，打通 Web 端与浏览器操作。
          </Paragraph>
          <Timeline style={{ marginTop: 16 }}>
            <Timeline.Item color="green">
              <Text strong>一键填充 (Auto-Fill)</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                在 DevPortal 点击账号的 &quot;填充&quot;
                按钮，插件自动将账号密码填入当前的系统登录框。
              </Text>
            </Timeline.Item>
            <Timeline.Item color="blue">
              <Text strong>智能文本识别 (Smart Parse)</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 12 }}>
                浏览纯文本日志或配置时，自动高亮识别 `User/Pass`
                格式凭据，并提供复制/填充快捷操作。
              </Text>
            </Timeline.Item>
          </Timeline>
        </Card>

        {/* Architecture */}
        <Card
          title={
            <Space>
              <CloudServerOutlined />
              <span>技术架构</span>
            </Space>
          }
          size="small">
          <Space wrap>
            <Tag color="#000000">Next.js 14 (App Router)</Tag>
            <Tag color="#3178c6">TypeScript</Tag>
            <Tag color="#1890ff">Ant Design</Tag>
            <Tag color="#0c344b">Prisma ORM</Tag>
            <Tag color="#339933">Node.js</Tag>
            <Tag color="#4285f4">Chrome Extension MV3</Tag>
          </Space>
        </Card>

        <Divider orientation={"left" as "left" | "right" | "center"}>
          📖 系统使用与维护手册
        </Divider>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}>
          <Card
            hoverable
            size="small"
            title="🚀 快速入门 (部署)"
            onClick={() => router.push("/docs/preview?file=deploy.md")}>
            <Text type="secondary">
              了解 Docker 容器化部署及数据库初始化流程。
            </Text>
          </Card>
          <Card
            hoverable
            size="small"
            title="⚙️ 环境配置说明"
            onClick={() => router.push("/docs/preview?file=env-setup.md")}>
            <Text type="secondary">详尽的 .env 变量含义及上线 CheckList。</Text>
          </Card>
          <Card
            hoverable
            size="small"
            title="🔄 Swagger 同步指南"
            onClick={() =>
              router.push("/docs/preview?file=swagger-sync-guide.md")
            }>
            <Text type="secondary">
              针对微服务架构的自动同步策略与排错技巧。
            </Text>
          </Card>
          <Card
            hoverable
            size="small"
            title="✨ 功能模块详解"
            onClick={() => router.push("/docs/preview?file=features.md")}>
            <Text type="secondary">
              深入了解项目管理、对象定义及团队导航等核心能力。
            </Text>
          </Card>
          <Card
            hoverable
            size="small"
            title="🧩 插件安装手册"
            onClick={() => router.push("/docs/preview?file=extension.md")}>
            <Text type="secondary">
              Chrome 扩展的详细安装步骤与 Zero-Config 更新机制说明。
            </Text>
          </Card>
          <Card
            hoverable
            size="small"
            title="⌨️ 快捷键说明"
            onClick={() => router.push("/docs/preview?file=shortcuts.md")}>
            <Text type="secondary">
              掌握 Cmd+K 等全局快捷键，提升系统操作效率。
            </Text>
          </Card>
          <Card
            hoverable
            size="small"
            title="📅 版本迭代规划"
            onClick={() => router.push("/docs/preview?file=roadmap.md")}>
            <Text type="secondary">
              查看 DevPortal 的未来功能路线图与开发计划。
            </Text>
          </Card>
        </div>
        <Divider style={{ margin: "40px 0" }} />

        <Paragraph style={{ textAlign: "center", color: "#999" }}>
          © {new Date().getFullYear()} DevPortal Internal System
        </Paragraph>
      </Space>
    </div>
  );
}
