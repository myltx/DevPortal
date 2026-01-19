"use client";

import React, { useEffect, useState } from "react";
import { Avatar, Empty } from "antd";
import { useRouter } from "next/navigation";
import {
  ProjectOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  RocketOutlined,
  ArrowRightOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- Interfaces ---
interface Project {
  id: number;
  projectName: string;
  projectDescribe: string;
  createTime: string;
  updateTime: string;
  area?: {
    name: string;
  };
  classId?: number;
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

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function MiddlePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  // --- Apps Config ---
  const apps = [
    {
      title: "项目空间",
      desc: "浏览各行业项目详情",
      icon: <AppstoreOutlined className="text-xl" />,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      path: "/projectSite",
      primary: true,
    },
    {
      title: "名词管理",
      desc: "维护系统核心名词定义",
      icon: <ProjectOutlined className="text-xl" />,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      path: "/project",
    },
    {
      title: "系统配置",
      desc: "管理全局参数与设置",
      icon: <RocketOutlined className="text-xl" />,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      path: "/sysConfig",
    },
    {
      title: "技术文档",
      desc: "查阅系统开发与API文档",
      icon: <FileTextOutlined className="text-xl" />,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      path: "/docs",
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

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans selection:bg-gray-200">
      <div className="max-w-[1000px] mx-auto px-6 py-16">
        {/* Header Section */}
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-6">
            工作台
          </h1>

          {/* Global Search */}
          <div className="max-w-2xl mx-auto relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchOutlined className="text-gray-400 text-lg group-focus-within:text-gray-600 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="搜索项目、文档或配置..."
              className="block w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-white shadow-sm ring-1 ring-gray-900/5 focus:ring-2 focus:ring-blue-500 focus:outline-none text-lg transition-all placeholder:text-gray-400"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 rounded-md">
                ⌘ K
              </kbd>
            </div>
          </div>
        </header>

        {/* 1. Applications Grid */}
        <section className="mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {apps.map((app) => (
              <div
                key={app.title}
                onClick={() => router.push(app.path)}
                className="group relative bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden">
                {/* Decoration gradient for primary item */}
                {app.primary && (
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <AppstoreOutlined
                      style={{ fontSize: "100px", color: "#10b981" }}
                    />
                  </div>
                )}

                <div className="relative z-10">
                  <div
                    className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center mb-5 transition-colors",
                      app.bg,
                      app.color
                    )}>
                    {app.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-black transition-colors">
                    {app.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6 line-clamp-2 leading-relaxed">
                    {app.desc}
                  </p>
                  <div className="flex items-center text-xs font-medium text-gray-400 group-hover:text-gray-900 transition-colors">
                    进入模块{" "}
                    <ArrowRightOutlined className="ml-1 text-[10px] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Recent Projects */}
        <section className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <RocketOutlined className="mr-2 text-gray-400" />
              最近更新项目
            </h2>
            <button
              onClick={() => router.push("/projectSite")}
              className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-1 rounded-full hover:bg-gray-100">
              查看全部
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
            {loading ? (
              <div className="p-8 space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
                      <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats?.recentProjects?.length ? (
              <div className="divide-y divide-gray-50">
                {stats.recentProjects.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    onClick={() =>
                      router.push(
                        `/projectSite?classId=${item.classId}&projectId=${item.id}`
                      )
                    }
                    className="group p-6 hover:bg-gray-50/80 transition-colors cursor-pointer flex items-center gap-5">
                    <Avatar
                      shape="square"
                      size={48}
                      className="bg-blue-50 text-blue-600 font-semibold border border-blue-100 rounded-xl flex-shrink-0">
                      {item.projectName?.[0]?.toUpperCase()}
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h4 className="text-base font-semibold text-gray-900 truncate">
                          {item.projectName}
                        </h4>
                        {item.area && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600">
                            {item.area.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate max-w-[400px]">
                          {item.projectDescribe || "暂无描述"}
                        </p>
                        <span className="text-xs text-gray-300 font-mono whitespace-nowrap group-hover:text-gray-400 transition-colors">
                          {new Date(
                            item.updateTime || item.createTime
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="pl-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                      <ArrowRightOutlined className="text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 flex flex-col items-center justify-center text-gray-400">
                <Empty
                  description="暂无最近项目"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
