"use client";

import React, { useState } from "react";
import { Empty, Tooltip } from "antd";
import { useRouter } from "next/navigation";
import {
  ArrowRightOutlined,
  SearchOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useKBar } from "kbar";
import {
  APP_REGISTRY,
  AppRegistryItem,
  STORAGE_KEYS,
  getDefaultAppKeys,
} from "@/lib/config/app-registry";
import {
  clearRecentVisitsByKind,
  getFrequentVisits,
  getRecentVisits,
  recordRecentVisit,
  RecentVisitEntry,
} from "@/lib/client/recent-visits";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const ENV_META: Record<
  string,
  { label: string; className: string; dotClassName: string }
> = {
  prod: {
    label: "生产",
    className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    dotClassName: "bg-emerald-500",
  },
  gray: {
    label: "灰度",
    className: "bg-slate-50 text-slate-700 border-slate-100",
    dotClassName: "bg-slate-500",
  },
  test: {
    label: "测试",
    className: "bg-blue-50 text-blue-700 border-blue-100",
    dotClassName: "bg-blue-500",
  },
  dev: {
    label: "开发",
    className: "bg-amber-50 text-amber-700 border-amber-100",
    dotClassName: "bg-amber-500",
  },
  demo: {
    label: "演示",
    className: "bg-rose-50 text-rose-700 border-rose-100",
    dotClassName: "bg-rose-500",
  },
};

export default function MiddlePage() {
  const { query } = useKBar();
  const router = useRouter();
  const [visibleApps] = useState<AppRegistryItem[]>(() => {
    let keys: string[] = getDefaultAppKeys();
    if (typeof window !== "undefined") {
      const local = localStorage.getItem(STORAGE_KEYS.DASHBOARD_APPS);
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed) && parsed.length > 0) {
            keys = parsed;
          }
        } catch {
          // ignore
        }
      }
    }

    return keys
      .map((k) => APP_REGISTRY.find((item) => item.key === k))
      .filter((item): item is AppRegistryItem => !!item);
  });

  const [moduleLaunchers, setModuleLaunchers] = useState<RecentVisitEntry[]>(() => {
    if (typeof window === "undefined") return [];
    const frequent = getFrequentVisits({ kind: "module", limit: 8 });
    const recent = getRecentVisits({ kind: "module", limit: 8 });
    const merged: RecentVisitEntry[] = [];
    const seen = new Set<string>();
    for (const x of [...frequent, ...recent]) {
      if (merged.length >= 8) break;
      if (seen.has(x.id)) continue;
      seen.add(x.id);
      merged.push(x);
    }
    return merged;
  });

  const refreshModuleLaunchers = () => {
    const frequent = getFrequentVisits({ kind: "module", limit: 8 });
    const recent = getRecentVisits({ kind: "module", limit: 8 });
    const merged: RecentVisitEntry[] = [];
    const seen = new Set<string>();

    for (const x of [...frequent, ...recent]) {
      if (merged.length >= 8) break;
      if (seen.has(x.id)) continue;
      seen.add(x.id);
      merged.push(x);
    }
    setModuleLaunchers(merged);
  };

  const openModuleEntry = (entry: RecentVisitEntry) => {
    const moduleUrl =
      typeof entry.meta?.moduleUrl === "string" ? entry.meta.moduleUrl : "";

    recordRecentVisit({
      id: entry.id,
      kind: "module",
      title: entry.title,
      path: entry.path,
      meta: entry.meta,
    });
    refreshModuleLaunchers();

    if (moduleUrl) {
      window.open(moduleUrl, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(entry.path);
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-gray-900 font-sans selection:bg-gray-200">
      <div className="max-w-[1000px] mx-auto px-6 py-16">
        {/* Header Section */}
        <header className="mb-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-6">
            工作台
          </h1>

          {/* Global Search */}
          <div
            className="max-w-2xl mx-auto relative group cursor-pointer"
            onClick={() => query.toggle()}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchOutlined className="text-gray-400 text-lg group-focus-within:text-gray-600 transition-colors" />
            </div>
            <div className="block w-full pl-12 pr-4 py-4 rounded-2xl border-none bg-white shadow-sm ring-1 ring-gray-900/5 hover:ring-2 hover:ring-blue-500 text-lg transition-all text-gray-400 text-left">
              搜索项目、文档或配置...
            </div>
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
            {visibleApps.map((app) => (
              <div
                key={app.key}
                onClick={() => {
                  recordRecentVisit({
                    id: `app:${app.key}`,
                    kind: "app",
                    title: app.title,
                    path: app.path,
                    meta: { appKey: app.key },
                  });
                  router.push(app.path);
                }}
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
                      app.color,
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

        {/* 2. Module Launchers */}
        <section className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              常用模块（快捷启动）
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  clearRecentVisitsByKind("module");
                  refreshModuleLaunchers();
                }}
                className="text-xs font-medium text-gray-400 hover:text-gray-900 transition-colors px-3 py-1 rounded-full hover:bg-gray-100">
                清空
              </button>
              <button
                onClick={() => router.push("/projectSite")}
                className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-1 rounded-full hover:bg-gray-100">
                去项目空间
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden">
            {moduleLaunchers.length > 0 ? (
              <div className="p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {moduleLaunchers.map((x) => {
                    const rawTypeName =
                      typeof x.meta?.typeName === "string"
                        ? x.meta.typeName
                        : "";
                    const key = rawTypeName.toLowerCase();
                    const env = ENV_META[key];
                    const areaName =
                      typeof x.meta?.areaName === "string"
                        ? x.meta.areaName
                        : "";
                    const moduleUrl =
                      typeof x.meta?.moduleUrl === "string"
                        ? x.meta.moduleUrl
                        : "";

                    const tip = (
                      <div className="text-xs">
                        <div className="font-medium text-gray-900 mb-1">
                          {x.title}
                        </div>
                        {env && (
                          <div className="text-gray-600 mb-1">
                            环境：{env.label}
                          </div>
                        )}
                        {areaName && (
                          <div className="text-gray-600 mb-1">
                            分组：{areaName}
                          </div>
                        )}
                        {moduleUrl && (
                          <div className="text-gray-600 mb-1 break-all">
                            URL：{moduleUrl}
                          </div>
                        )}
                        <div className="text-gray-500">
                          {x.visitCount} 次 ·{" "}
                          {new Date(x.lastVisitedAt).toLocaleString()}
                        </div>
                      </div>
                    );

                    return (
                      <Tooltip
                        key={x.id}
                        title={tip}
                        placement="top"
                        color="#ffffff"
                        overlayInnerStyle={{
                          color: "#111827",
                          border: "1px solid #e5e7eb",
                          boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                          maxWidth: 420,
                        }}>
                        <button
                          onClick={() => openModuleEntry(x)}
                          className="group text-left rounded-2xl border border-gray-100 bg-white hover:bg-gray-50/60 hover:border-gray-200 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.06)] transition-all duration-300 p-4 h-[92px] flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <div className="text-sm font-semibold text-gray-900 line-clamp-2">
                              {x.title}
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
                              <ArrowRightOutlined className="text-gray-400 text-xs" />
                            </div>
                          </div>

                          {env ? (
                            <div
                              className={cn(
                                "inline-flex items-center gap-2 text-[10px] font-medium rounded-full border px-2 py-1 w-fit",
                                env.className,
                              )}>
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  env.dotClassName,
                                )}
                              />
                              {env.label}
                            </div>
                          ) : rawTypeName ? (
                            <div className="inline-flex items-center text-[10px] font-medium rounded-full border border-gray-200 bg-gray-50 text-gray-600 px-2 py-1 w-fit">
                              {rawTypeName}
                            </div>
                          ) : (
                            <div className="h-[22px]" />
                          )}
                        </button>
                      </Tooltip>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-10 text-center">
                <Empty
                  description="暂无常用模块（在项目空间里打开账号抽屉/复制链接/跳转模块后会出现在这里）"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
                <div className="mt-4">
                  <button
                    onClick={() => router.push("/projectSite")}
                    className="text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors px-3 py-1 rounded-full hover:bg-gray-100">
                    去项目空间
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
