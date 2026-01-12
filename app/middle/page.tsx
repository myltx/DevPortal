"use client";

import React from "react";
import { Row, Col, Card, Typography } from "antd";
import { useRouter } from "next/navigation";
import {
  ProjectOutlined,
  AppstoreOutlined,
  ReadOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export default function MiddlePage() {
  const router = useRouter();

  const apps = [
    {
      title: "名词页面",
      desc: "管理系统核心名词定义",
      icon: <ProjectOutlined style={{ fontSize: 24, color: "#1890ff" }} />,
      color: "#e6f7ff",
      path: "/project",
    },
    {
      title: "项目空间",
      desc: "浏览各行业项目详情",
      icon: <AppstoreOutlined style={{ fontSize: 24, color: "#52c41a" }} />,
      color: "#f6ffed",
      path: "/projectSite", // Direct jump to ProjectSite
    },
    {
      title: "对象属性",
      desc: "配置对象及属性元数据",
      icon: <ReadOutlined style={{ fontSize: 24, color: "#722ed1" }} />,
      color: "#f9f0ff",
      path: "/objectPage",
    },
    {
      title: "技术文档",
      desc: "查阅系统开发与API文档",
      icon: <FileTextOutlined style={{ fontSize: 24, color: "#13c2c2" }} />,
      color: "#e6fffb",
      path: "/docs",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
        padding: "48px 24px",
        display: "flex",
        justifyContent: "center",
      }}>
      <div style={{ maxWidth: 1200, width: "100%" }}>
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <Title level={2} style={{ marginBottom: 16 }}>
            工作台
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            欢迎回来，请选择您要进入的应用模块
          </Text>
        </div>

        <Row gutter={[24, 24]}>
          {apps.map((app) => (
            <Col xs={24} sm={12} md={12} lg={6} key={app.title}>
              <Card
                className="middle-card"
                hoverable
                style={{ height: "100%", borderRadius: 16 }}
                bodyStyle={{
                  padding: 32,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  height: "100%",
                }}
                onClick={() => router.push(app.path)}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    background: app.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 24,
                  }}>
                  {app.icon}
                </div>
                <Title level={4} style={{ marginBottom: 8 }}>
                  {app.title}
                </Title>
                <Text type="secondary" style={{ marginBottom: 24, flex: 1 }}>
                  {app.desc}
                </Text>
                <div style={{ color: "#1890ff", fontWeight: 500 }}>
                  进入应用 <ArrowRightOutlined />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
}
