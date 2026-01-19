"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  List,
  Typography,
  Button,
  Table,
  Tag,
  Space,
} from "antd";
import {
  ProjectOutlined,
  AppstoreOutlined,
  UserOutlined,
  BookOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ConsoleSqlOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

// --- Interfaces ---
interface Account {
  id: number;
  account: string;
  remark?: string;
}

interface DashboardStats {
  counts: {
    projects: number;
    modules: number;
    accounts: number;
    nouns: number;
  };
  recentAccounts: Account[];
}

interface LogItem {
  key: string;
  time: string;
  user: string;
  action: string;
  module: string;
  status: "success" | "error";
}

// Mock Logs Data
const mockLogs: LogItem[] = [
  {
    key: "1",
    time: "2024-01-19 10:30:00",
    user: "admin",
    action: "Updated System Config",
    module: "Configuration",
    status: "success",
  },
  {
    key: "2",
    time: "2024-01-19 10:15:23",
    user: "developer_01",
    action: "Created New Project",
    module: "Project Space",
    status: "success",
  },
  {
    key: "3",
    time: "2024-01-19 09:45:10",
    user: "system_bot",
    action: "Sync API Docs",
    module: "Documentation",
    status: "error",
  },
  {
    key: "4",
    time: "2024-01-19 09:30:00",
    user: "admin",
    action: "Deleted Account",
    module: "Account Management",
    status: "success",
  },
  {
    key: "5",
    time: "2024-01-19 09:00:00",
    user: "admin",
    action: "Login",
    module: "Auth",
    status: "success",
  },
];

const DashboardPage: React.FC = () => {
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

  const columns = [
    {
      title: "时间",
      dataIndex: "time",
      key: "time",
      width: 180,
    },
    {
      title: "用户",
      dataIndex: "user",
      key: "user",
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "模块",
      dataIndex: "module",
      key: "module",
    },
    {
      title: "操作",
      dataIndex: "action",
      key: "action",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: "success" | "error") => (
        <Tag color={status === "success" ? "success" : "error"}>
          {status === "success" ? "成功" : "失败"}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>
            系统监控
          </Title>
          <Text type="secondary">DevPortal 后台管理系统数据概览与日志审计</Text>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchStats}
          loading={loading}>
          刷新数据
        </Button>
      </div>

      {/* 1. Statistics Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
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

      {/* 2. Main Content */}
      <Row gutter={[24, 24]}>
        {/* Left: System Logs */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <Space>
                <ConsoleSqlOutlined />
                <span>系统操作日志 (最近5条)</span>
              </Space>
            }
            bordered={false}
            extra={<Button type="link">查看全部</Button>}>
            <Table
              columns={columns}
              dataSource={mockLogs}
              pagination={false}
              size="middle"
            />
          </Card>
        </Col>

        {/* Right: Recent Accounts */}
        <Col xs={24} lg={8}>
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined />
                <span>新进账号收录</span>
              </Space>
            }
            bordered={false}>
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
