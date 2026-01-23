"use client";

import React, { useState } from "react";
import { Layout, Menu, theme, Tooltip } from "antd";
import {
  AppstoreOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  ProjectOutlined,
  BookOutlined,
  FunctionOutlined,
  SettingOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import { useRouter, usePathname } from "next/navigation";
import { ThemeSwitch } from "@/components/theme/ThemeSwitch";
import { recordRecentVisit } from "@/lib/client/recent-visits";

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
      label: "系统监控", // New Homepage
      onClick: () => {
        recordRecentVisit({
          id: "app:/dashboard",
          kind: "app",
          title: "系统监控",
          path: "/dashboard",
        });
        router.push("/dashboard");
      },
    },
    {
      key: "/project",
      icon: <ProjectOutlined />,
      label: "名词管理",
      onClick: () => {
        recordRecentVisit({
          id: "app:/project",
          kind: "app",
          title: "名词管理",
          path: "/project",
        });
        router.push("/project");
      },
    },
    {
      key: "/objectPage",
      icon: <FunctionOutlined />,
      label: "对象定义",
      onClick: () => {
        recordRecentVisit({
          id: "app:/objectPage",
          kind: "app",
          title: "对象定义",
          path: "/objectPage",
        });
        router.push("/objectPage");
      },
    },
    {
      key: "/doc",
      icon: <BookOutlined />,
      label: "API 文档",
      onClick: () => {
        recordRecentVisit({
          id: "app:/doc",
          kind: "app",
          title: "API 文档",
          path: "/doc",
        });
        router.push("/doc");
      },
    },
    {
      key: "/apifox-logs",
      icon: <HistoryOutlined />,
      label: "同步日志",
      onClick: () => {
        recordRecentVisit({
          id: "app:/apifox-logs",
          kind: "app",
          title: "同步日志",
          path: "/apifox-logs",
        });
        router.push("/apifox-logs");
      },
    },
    {
      key: "/sysConfig",
      icon: <SettingOutlined />,
      label: "系统配置",
      onClick: () => {
        recordRecentVisit({
          id: "app:/sysConfig",
          kind: "app",
          title: "系统配置",
          path: "/sysConfig",
        });
        router.push("/sysConfig");
      },
    },
  ];

  return (
    <Layout style={{ height: "100vh", overflow: "hidden" }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        style={{ overflowY: "auto" }}>
        <div
          className="demo-logo-vertical"
          style={{
            height: 32,
            margin: 16,
            color: "white",
            textAlign: "center",
            marginBottom: 20,
            display: collapsed ? "none" : "block",
            fontSize: 16,
            fontWeight: "bold",
            background: "rgba(255, 255, 255, 0.2)",
            borderRadius: borderRadiusLG,
            padding: "0 16px",
            lineHeight: "32px",
          }}>
          云滃公共管理
        </div>
        {/* <div
          style={{
            color: "white",
            textAlign: "center",
            marginBottom: 20,
            display: collapsed ? "none" : "block",
          }}>
          Admin System
        </div> */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout
        style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: "flex",
            alignItems: "center",
            flexShrink: 0, // Prevent header from shrinking
          }}>
          <div
            style={{ padding: "0 24px", cursor: "pointer" }}
            onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>

          <Tooltip title="工作台">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                cursor: "pointer",
                borderRadius: 6,
                marginRight: 16,
                transition: "background 0.2s",
              }}
              onClick={() => {
                recordRecentVisit({
                  id: "app:/middle",
                  kind: "app",
                  title: "工作台",
                  path: "/middle",
                });
                router.push("/middle");
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }>
              <AppstoreOutlined style={{ fontSize: "18px" }} />
            </div>
          </Tooltip>
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
            overflowY: "auto", // Allow content to scroll
            flex: 1, // Fill remaining space
          }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
