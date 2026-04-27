import {
  AppstoreOutlined,
  ProjectOutlined,
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  TagsOutlined,
  DatabaseOutlined,
  ApiOutlined,
  HistoryOutlined,
} from "@ant-design/icons";
import React from "react";

// --- Types ---

export interface AppRegistryItem {
  key: string;
  title: string;
  desc: string;
  icon?: React.ReactNode;
  path: string;
  color?: string; // Text color class (Tailwind)
  bg?: string; // Bg color class (Tailwind)
  primary?: boolean; // Highlight style
}

// --- Constants ---

export const STORAGE_KEYS = {
  DASHBOARD_APPS: "devportal_dashboard_apps",
  PROJECT_SITE_PREFS: "devportal_project_site_prefs",
  ACCOUNT_VIEW_PREF: "account_default_view_preference",
  RECENT_VISITS: "devportal_recent_visits",
};

export const ACCOUNT_VIEW_OPTIONS = [
  { label: "文本模式 (默认)", value: "text" },
  { label: "列表模式", value: "table" },
];

// --- Registry (The Master List) ---

export const APP_REGISTRY: AppRegistryItem[] = [
  {
    key: "project",
    title: "项目空间",
    desc: "浏览各行业项目详情",
    icon: React.createElement(AppstoreOutlined, { className: "text-xl" }),
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    path: "/projectSite",
    primary: true,
  },
  {
    key: "swagger",
    title: "Swagger 工具",
    desc: "API 文档聚合与导入",
    icon: React.createElement(ProjectOutlined, { className: "text-xl" }),
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    path: "/tool/swagger",
  },
  {
    key: "admin",
    title: "系统后台(概览)",
    desc: "系统运行状态监控",
    icon: React.createElement(DashboardOutlined, { className: "text-xl" }),
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    path: "/dashboard",
  },
  {
    key: "docs",
    title: "技术文档",
    desc: "查阅系统开发与API文档",
    icon: React.createElement(FileTextOutlined, { className: "text-xl" }),
    color: "text-cyan-500",
    bg: "bg-cyan-500/10",
    path: "/docs",
  },
  // --- Admin Sub-Modules ---
  {
    key: "admin-project",
    title: "词条管理",
    desc: "统一管理系统名词与术语",
    icon: React.createElement(TagsOutlined, { className: "text-xl" }),
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    path: "/project",
  },
  {
    key: "admin-object",
    title: "对象管理",
    desc: "定义业务对象与属性结构",
    icon: React.createElement(DatabaseOutlined, { className: "text-xl" }),
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    path: "/objectPage",
  },
  {
    key: "admin-doc",
    title: "接口浏览",
    desc: "实时接口定义与调试",
    icon: React.createElement(ApiOutlined, { className: "text-xl" }),
    color: "text-blue-600",
    bg: "bg-blue-600/10",
    path: "/doc",
  },
  {
    key: "admin-apifox-logs",
    title: "Apifox 同步日志",
    desc: "追踪接口自动化同步历史与详情",
    icon: React.createElement(HistoryOutlined, { className: "text-xl" }),
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    path: "/apifox-logs",
  },
  {
    key: "sys-config",
    title: "系统配置",
    desc: "管理全局参数与偏好设置",
    icon: React.createElement(SettingOutlined, { className: "text-xl" }),
    color: "text-gray-600",
    bg: "bg-gray-100",
    path: "/sysConfig", // Deep link
  },
];

// --- Default Configuration ---

export const DEFAULT_APP_KEYS = [
  "project",
  "admin-object",
  "admin-project",
  "admin",
];

export const getDefaultAppKeys = (): string[] => {
  if (typeof window === "undefined") return DEFAULT_APP_KEYS;
  
  // 1. Env Var Priority
  const envDefaults = process.env.NEXT_PUBLIC_DEFAULT_APPS;
  if (envDefaults) {
    return envDefaults.split(",").map((k) => k.trim());
  }
  
  // 2. Hardcoded Fallback
  return DEFAULT_APP_KEYS;
};
