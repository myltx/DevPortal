"use client";

import React from "react";
import {
  KBarProvider,
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  KBarResults,
  useMatches,
  Action,
  useKBar,
  useRegisterActions,
} from "kbar";
import { useRouter } from "next/navigation";
import {
  HomeOutlined,
  ProjectOutlined,
  SettingOutlined,
  BookOutlined,
  RocketOutlined,
} from "@ant-design/icons";

const searchStyle = {
  padding: "16px 24px",
  fontSize: "16px",
  width: "100%",
  boxSizing: "border-box" as const,
  outline: "none",
  border: "none",
  background: "var(--background, #fff)",
  color: "var(--foreground, #000)",
  borderRadius: "12px 12px 0 0",
};

const animatorStyle = {
  maxWidth: "600px",
  width: "100%",
  background: "var(--background, #fff)",
  color: "var(--foreground, #000)",
  borderRadius: "12px",
  boxShadow: "0px 6px 20px rgba(0, 0, 0, 0.2)",
  overflow: "hidden",
};

const groupNameStyle = {
  padding: "8px 16px",
  fontSize: "10px",
  textTransform: "uppercase" as const,
  opacity: 0.5,
  fontWeight: 600,
  letterSpacing: "0.5px",
};

const RenderResults = () => {
  const { results } = useMatches();

  return (
    <div
      style={{
        maxHeight: "400px", // 限制高度，允许滚动
        overflow: "auto",
        paddingBottom: "8px",
      }}>
      <KBarResults
        items={results}
        onRender={({ item, active }) =>
          typeof item === "string" ? (
            <div style={groupNameStyle}>{item}</div>
          ) : (
            <div
              style={{
                background: active ? "var(--bg-hover, #f5f5f5)" : "transparent",
                borderLeft: `2px solid ${active ? "#1890ff" : "transparent"}`,
                padding: "12px 24px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "background 0.1s",
              }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {item.icon && (
                  <span style={{ fontSize: "18px", opacity: 0.6 }}>
                    {item.icon}
                  </span>
                )}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontWeight: 500, fontSize: "14px" }}>
                    {item.name}
                  </span>
                  {item.subtitle && (
                    <span style={{ fontSize: "12px", opacity: 0.5 }}>
                      {item.subtitle}
                    </span>
                  )}
                </div>
              </div>
              {item.shortcut && (
                <div style={{ display: "flex", gap: "4px" }}>
                  {item.shortcut.map((sc) => (
                    <kbd
                      key={sc}
                      style={{
                        padding: "2px 6px",
                        background: "rgba(0,0,0,0.05)",
                        borderRadius: "4px",
                        fontSize: "10px",
                        fontWeight: 600,
                      }}>
                      {sc}
                    </kbd>
                  ))}
                </div>
              )}
            </div>
          )
        }
      />
    </div>
  );
};

// ... imports

// ... styles

// ... RenderResults component

const CommandPaletteInner = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  // const { query } = useKBar();

  const actions: Action[] = React.useMemo(
    () => [
      {
        id: "home",
        name: "超级工作台",
        shortcut: ["g", "h"],
        keywords: "home workbench middle",
        section: "Navigation",
        perform: () => router.push("/middle"),
        icon: <HomeOutlined />,
        subtitle: "回到首页",
      },
      // ... same other actions
      {
        id: "dashboard",
        name: "系统监控",
        shortcut: ["g", "d"],
        keywords: "dashboard stats monitor",
        section: "Navigation",
        perform: () => router.push("/dashboard"),
        icon: <RocketOutlined />,
        subtitle: "查看系统统计与日志",
      },
      {
        id: "projects",
        name: "项目空间",
        shortcut: ["g", "p"],
        keywords: "project site list",
        section: "Navigation",
        perform: () => router.push("/projectSite"),
        icon: <ProjectOutlined />,
        subtitle: "浏览所有项目",
      },
      {
        id: "noun",
        name: "名词管理",
        shortcut: ["g", "n"],
        keywords: "noun definition manage",
        section: "Navigation",
        perform: () => router.push("/project"),
        icon: <BookOutlined />,
        subtitle: "管理系统名词定义",
      },
      {
        id: "config",
        name: "系统配置",
        shortcut: ["g", "c"],
        keywords: "config system settings",
        section: "Navigation",
        perform: () => router.push("/sysConfig"),
        icon: <SettingOutlined />,
        subtitle: "管理全局配置",
      },
      {
        id: "docs",
        name: "开发文档",
        keywords: "doc api help",
        section: "Help",
        perform: () => router.push("/doc"),
        icon: <BookOutlined />,
        subtitle: "查看API与开发指南",
      },
    ],
    [router]
  );

  useRegisterActions(actions);

  return (
    <>
      <KBarPortal>
        <KBarPositioner style={{ zIndex: 9999, background: "rgba(0,0,0,0.3)" }}>
          <KBarAnimator style={animatorStyle}>
            <KBarSearch style={searchStyle} placeholder="输入命令或搜索..." />
            <RenderResults />
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};

export default function CommandPalette({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <KBarProvider>
      <CommandPaletteInner>{children}</CommandPaletteInner>
    </KBarProvider>
  );
}
