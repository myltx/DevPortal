"use client";

import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Card,
  Typography,
  Statistic,
  List,
  Tag,
  Button,
  Avatar,
} from "antd";
import { useRouter } from "next/navigation";
import {
  ProjectOutlined,
  AppstoreOutlined,
  ReadOutlined,
  FileTextOutlined,
  UserOutlined,
  BookOutlined,
  RocketOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// --- Interfaces (Copied from Dashboard) ---
interface Project {
  id: number;
  projectName: string;
  projectDescribe: string;
  createTime: string;
  updateTime: string;
  area?: {
    name: string;
  };
  classId?: number; // Added for deep linking
}

interface DashboardStats {
  counts: {
    projects: number;
    modules: number;
    accounts: number;
    nouns: number;
  };
  recentProjects: Project[];
  recentAccounts: any[];
}

export default function MiddlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // --- apps config ---
  const apps = [
    {
      title: "项目空间",
      desc: "浏览各行业项目详情",
      icon: <AppstoreOutlined style={{ fontSize: 24, color: "#52c41a" }} />,
      color: "#f6ffed",
      path: "/projectSite",
      primary: true, // Highlight this one
    },
    {
      title: "名词管理",
      desc: "维护系统核心名词定义",
      icon: <ProjectOutlined style={{ fontSize: 24, color: "#1890ff" }} />,
      color: "#e6f7ff",
      path: "/project",
    },
    {
      title: "系统配置",
      desc: "管理全局参数与设置",
      icon: <RocketOutlined style={{ fontSize: 24, color: "#faad14" }} />,
      color: "#fff7e6",
      path: "/sysConfig", // Updated from objectPage to sysConfig as clearer entry
    },
    {
      title: "技术文档",
      desc: "查阅系统开发与API文档",
      icon: <FileTextOutlined style={{ fontSize: 24, color: "#13c2c2" }} />,
      color: "#e6fffb",
      path: "/docs", // Updated to /docs (or /doc based on routes)
    },
  ];

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "项目总数",
      value: stats?.counts.projects || 0,
      icon: <ProjectOutlined style={{ fontSize: 24, color: "#1890ff" }} />,
      suffix: "个",
    },
    {
      title: "模块总数",
      value: stats?.counts.modules || 0,
      icon: <AppstoreOutlined style={{ fontSize: 24, color: "#52c41a" }} />,
      suffix: "个",
    },
    {
      title: "收录账号",
      value: stats?.counts.accounts || 0,
      icon: <UserOutlined style={{ fontSize: 24, color: "#722ed1" }} />,
      suffix: "个",
    },
    {
      title: "名词定义",
      value: stats?.counts.nouns || 0,
      icon: <BookOutlined style={{ fontSize: 24, color: "#faad14" }} />,
      suffix: "条",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f2f5", // Use a light gray bg for the whole page
        color: "var(--foreground)",
        padding: "32px",
      }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Header Section */}
        <div style={{ marginBottom: 32 }}>
          <Title level={2} style={{ margin: 0 }}>
            工作台
          </Title>
          <Text type="secondary">欢迎回来，这里是您的研发综合管理中心</Text>
        </div>

        {/* 1. Statistics Cards */}
        <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
          {statCards.map((item, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card bordered={false} hoverable style={{ borderRadius: 8 }}>
                <Statistic
                  title={item.title}
                  value={item.value}
                  prefix={item.icon}
                  suffix={<span style={{ fontSize: 14 }}>{item.suffix}</span>}
                  valueStyle={{ fontWeight: "bold" }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* 2. Applications Grid */}
        <div style={{ marginBottom: 32 }}>
          <Title level={4} style={{ marginBottom: 16 }}>
            快速入口
          </Title>
          <Row gutter={[24, 24]}>
            {apps.map((app) => (
              <Col xs={24} sm={12} md={6} key={app.title}>
                <Card
                  bordered={false}
                  hoverable
                  style={{ borderRadius: 12, height: "100%" }}
                  bodyStyle={{ padding: 24 }}
                  onClick={() => router.push(app.path)}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: 16,
                    }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        background: app.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 16,
                      }}>
                      {app.icon}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600 }}>
                        {app.title}
                      </div>
                      <div style={{ fontSize: 12, color: "#888" }}>
                        {app.desc}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      color: "#1890ff",
                      fontSize: 12,
                    }}>
                    进入 <ArrowRightOutlined />
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </div>

        {/* 3. Recent Updates */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <RocketOutlined
                    style={{ marginRight: 8, color: "#1890ff" }}
                  />
                  <span>最近更新项目</span>
                </div>
              }
              bordered={false}
              style={{ borderRadius: 12 }}
              extra={
                <Button type="link" onClick={() => router.push("/projectSite")}>
                  查看全部
                </Button>
              }>
              <List
                loading={loading}
                itemLayout="horizontal"
                dataSource={stats?.recentProjects || []}
                renderItem={(item: Project) => (
                  <List.Item
                    actions={[
                      <Button
                        type="link"
                        key="enter"
                        onClick={() =>
                          router.push(
                            `/projectSite?classId=${item.classId}&projectId=${item.id}`
                          )
                        }>
                        进入
                      </Button>,
                    ]}>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{
                            backgroundColor: "#e6f7ff",
                            color: "#1890ff",
                          }}
                          shape="square">
                          {item.projectName?.[0]?.toUpperCase()}
                        </Avatar>
                      }
                      title={
                        <span style={{ fontWeight: 500 }}>
                          {item.projectName}
                        </span>
                      }
                      description={
                        <div>
                          {item.area ? (
                            <Tag color="blue" style={{ marginRight: 8 }}>
                              {item.area.name}
                            </Tag>
                          ) : null}
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            更新于{" "}
                            {new Date(
                              item.updateTime || item.createTime
                            ).toLocaleDateString()}
                          </Text>
                        </div>
                      }
                    />
                    <div
                      style={{
                        maxWidth: 200,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "#888",
                      }}>
                      {item.projectDescribe}
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title="最近收录账号"
              bordered={false}
              style={{ borderRadius: 12 }}>
              <List
                loading={loading}
                size="small"
                dataSource={stats?.recentAccounts || []}
                renderItem={(item: any) => (
                  <List.Item>
                    <div style={{ width: "100%" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}>
                        <Text strong>{item.account}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          ID: {item.id}
                        </Text>
                      </div>
                      {item.remark && (
                        <Text
                          type="secondary"
                          style={{ fontSize: 12 }}
                          ellipsis>
                          {item.remark}
                        </Text>
                      )}
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
