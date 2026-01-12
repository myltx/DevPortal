"use client";

import React, { useState } from "react";
import { Layout, Menu, theme } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  VideoCameraOutlined,
  UploadOutlined,
  DashboardOutlined,
  ProjectOutlined,
  BookOutlined,
  FunctionOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { ThemeSwitch } from "@/components/theme/ThemeSwitch";

const { Header, Sider, Content } = Layout;

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "首页",
      onClick: () => router.push("/dashboard"),
    },
    {
      key: "/project",
      icon: <ProjectOutlined />,
      label: "项目管理",
      onClick: () => router.push("/project"),
    },
    {
      key: "/objectPage",
      icon: <FunctionOutlined />,
      label: "对象定义",
      onClick: () => router.push("/objectPage"),
    },
    {
      key: "/webNav",
      icon: <BookOutlined />,
      label: "前台导航",
      onClick: () => router.push("/webNav"),
    },
    {
      key: "/doc",
      icon: <BookOutlined />,
      label: "API 文档",
      onClick: () => router.push("/doc"),
    },
  ];

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div
          className="demo-logo-vertical"
          style={{
            height: 32,
            margin: 16,
            background: "rgba(255, 255, 255, 0.2)",
          }}
        />
        <div
          style={{
            color: "white",
            textAlign: "center",
            marginBottom: 20,
            display: collapsed ? "none" : "block",
          }}>
          Admin System
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
          }}>
          <div
            style={{ padding: "0 24px", cursor: "pointer" }}
            onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <div style={{ flex: 1 }} />
          <ThemeSwitch />
          <div style={{ width: 16 }} />
          <div>Username</div>
          <div style={{ width: 24 }} />
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
