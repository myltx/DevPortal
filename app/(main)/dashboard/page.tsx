"use client";

import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, List, Typography, Button, Tag } from "antd";
import {
  ProjectOutlined,
  AppstoreOutlined,
  UserOutlined,
  BookOutlined,
  ReloadOutlined,
  RocketOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/navigation";
import Link from "next/link";

const { Title, Text } = Typography;

interface Project {
  id: number;
  projectName: string;
  projectDescribe: string;
  createTime: string;
  updateTime: string;
  area?: {
    name: string;
  };
}

interface Account {
  id: number;
  account: string;
  moduleId: number;
  remark: string;
}

interface DashboardStats {
  counts: {
    projects: number;
    modules: number;
    accounts: number;
    nouns: number;
  };
  recentProjects: Project[];
  recentAccounts: Account[];
}

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

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
      prefix: "个",
    },
    {
      title: "模块总数",
      value: stats?.counts.modules || 0,
      icon: <AppstoreOutlined style={{ fontSize: 24, color: "#52c41a" }} />,
      prefix: "个",
    },
    {
      title: "收录账号",
      value: stats?.counts.accounts || 0,
      icon: <UserOutlined style={{ fontSize: 24, color: "#722ed1" }} />,
      prefix: "个",
    },
    {
      title: "名词定义",
      value: stats?.counts.nouns || 0,
      icon: <BookOutlined style={{ fontSize: 24, color: "#faad14" }} />,
      prefix: "条",
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}>
        <Title level={2} style={{ margin: 0 }}>
          研发概览
        </Title>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchStats}
          loading={loading}>
          刷新数据
        </Button>
      </div>

      <Row gutter={[24, 24]}>
        {statCards.map((item, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <Card bordered={false} hoverable>
              <Statistic
                title={item.title}
                value={item.value}
                prefix={item.icon}
                suffix={item.prefix}
                valueStyle={{ fontWeight: "bold" }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center" }}>
                <RocketOutlined style={{ marginRight: 8, color: "#1890ff" }} />
                <span>最近更新项目</span>
              </div>
            }
            bordered={false}
            extra={<Link href="/projectSite">查看全部</Link>}>
            <List
              loading={loading}
              itemLayout="horizontal"
              dataSource={stats?.recentProjects || []}
              renderItem={(item: Project) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      key="view"
                      onClick={() => router.push(`/projectSite`)}>
                      进入
                    </Button>,
                  ]}>
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          background: "#e6f7ff",
                          borderRadius: 6,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#1890ff",
                          fontWeight: "bold",
                        }}>
                        {item.projectName?.[0]?.toUpperCase()}
                      </div>
                    }
                    title={
                      <span style={{ fontWeight: 500 }}>
                        {item.projectName}
                      </span>
                    }
                    description={
                      <div>
                        {item.area ? (
                          <Tag color="blue">{item.area.name}</Tag>
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
          <Card title="快捷导航" bordered={false} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Button
                type="dashed"
                block
                style={{ height: 48 }}
                onClick={() => router.push("/project")}>
                <ProjectOutlined /> 项目管理
              </Button>
              <Button
                type="dashed"
                block
                style={{ height: 48 }}
                onClick={() => router.push("/doc")}>
                <BookOutlined /> API 文档
              </Button>
              <Button
                type="dashed"
                block
                style={{ height: 48 }}
                onClick={() => router.push("/sysConfig")}>
                <RocketOutlined /> 系统配置
              </Button>
            </div>
          </Card>

          <Card title="最近收录账号" bordered={false}>
            <List
              loading={loading}
              size="small"
              dataSource={stats?.recentAccounts || []}
              renderItem={(item: Account) => (
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
                      <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
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
  );
};

export default DashboardPage;
