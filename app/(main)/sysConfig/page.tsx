"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Radio,
  Divider,
} from "antd";
import { SaveOutlined } from "@ant-design/icons";
import {
  APP_REGISTRY,
  STORAGE_KEYS,
  getDefaultAppKeys,
  ACCOUNT_VIEW_OPTIONS,
} from "@/lib/config/app-registry";

const { Title, Paragraph } = Typography;

export default function SysConfigPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState("");

  // Personal Prefs State
  const [dashboardApps, setDashboardApps] = useState<string[]>([]);
  const [accountView, setAccountView] = useState("table");

  // Load configs once on mount
  useEffect(() => {
    const fetchConfigs = async () => {
      // ...

      // 2. Load Local Personal Prefs
      if (typeof window !== "undefined") {
        // ...
        const defaultApps = getDefaultAppKeys()
          .filter((k) => APP_REGISTRY.some((a) => a.key === k))
          .slice(0, 4);

        const loadedAppsRaw = localStorage.getItem(STORAGE_KEYS.DASHBOARD_APPS);
        if (loadedAppsRaw) {
          try {
            const parsed = JSON.parse(loadedAppsRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const validKeys = parsed
                .filter((k): k is string => typeof k === "string")
                .filter((k) => APP_REGISTRY.some((a) => a.key === k))
                .slice(0, 4);
              setDashboardApps(validKeys);
            } else {
              setDashboardApps(defaultApps);
            }
          } catch {
            setDashboardApps(defaultApps);
          }
        } else {
          setDashboardApps(defaultApps);
        }

        const loadedView = localStorage.getItem(STORAGE_KEYS.ACCOUNT_VIEW_PREF);
        setAccountView(loadedView || "table");
      }
    };
    fetchConfigs();
  }, [form]);

  interface ConfigValues {
    extension_download_url?: string;
  }

  const onFinish = async (values: ConfigValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/system-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-name": encodeURIComponent(
            localStorage.getItem("currentUser") || "Unknown",
          ),
        },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        message.success("系统配置已更新");
      } else {
        const data = await res.json().catch(() => null);
        message.error(data?.error || "更新失败");
      }
    } catch (error) {
      console.error("Request failed", error);
      message.error("请求出错");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonal = () => {
    const defaultApps = getDefaultAppKeys()
      .filter((k) => APP_REGISTRY.some((a) => a.key === k))
      .slice(0, 4);
    const normalizedApps = dashboardApps
      .filter((k) => APP_REGISTRY.some((a) => a.key === k))
      .slice(0, 4);

    const isSameAsDefault =
      normalizedApps.length === defaultApps.length &&
      normalizedApps.every((k, i) => k === defaultApps[i]);

    if (normalizedApps.length === 0 || isSameAsDefault) {
      localStorage.removeItem(STORAGE_KEYS.DASHBOARD_APPS);
    } else {
      localStorage.setItem(
        STORAGE_KEYS.DASHBOARD_APPS,
        JSON.stringify(normalizedApps),
      );
    }
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_VIEW_PREF, accountView);
    message.success("个人偏好已保存 (刷新生效)");
  };

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <Title level={2}>系统配置</Title>
      <Paragraph type="secondary">管理全站通用的系统参数与个人偏好。</Paragraph>

      {/* Part 1: Personal Preferences (New) */}
      <Card
        title="个人工作台偏好 (Local Preferences)"
        variant="borderless"
        style={{ marginTop: 24 }}>
        <Form layout="vertical">
          <Form.Item label="首页仪表盘排版 (拖拽排序，最多 4 个)">
            {/* 1. Selected List (Draggable) */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
                已选模块 ({dashboardApps.length}/4) - 按住拖拽可调整顺序
              </div>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {dashboardApps.map((key, index) => {
                  const app = APP_REGISTRY.find((a) => a.key === key);
                  if (!app) return null;
                  return (
                    <div
                      key={key}
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("dragIndex", String(index))
                      }
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const dragIndex = Number(
                          e.dataTransfer.getData("dragIndex"),
                        );
                        if (dragIndex === index) return;
                        const newApps = [...dashboardApps];
                        const [moved] = newApps.splice(dragIndex, 1);
                        newApps.splice(index, 0, moved);
                        setDashboardApps(newApps);
                      }}
                      style={{
                        width: 140,
                        height: 90,
                        border: "1px solid #d9d9d9",
                        borderRadius: 8,
                        background: "#fff",
                        padding: 12,
                        cursor: "move",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        userSelect: "none",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                      }}>
                      <div
                        style={{
                          position: "absolute",
                          top: 4,
                          right: 6,
                          cursor: "pointer",
                          color: "#ff4d4f",
                          padding: 4,
                        }}
                        onClick={() => {
                          setDashboardApps(
                            dashboardApps.filter((k) => k !== key),
                          );
                        }}>
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </div>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>
                        {app.icon}
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          textAlign: "center",
                          lineHeight: 1.2,
                        }}>
                        {app.title}
                      </div>
                    </div>
                  );
                })}

                {dashboardApps.length === 0 && (
                  <div
                    style={{
                      width: "100%",
                      height: 80,
                      border: "1px dashed #d9d9d9",
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ccc",
                      background: "#fafafa",
                    }}>
                    暂未选择任何模块（将使用默认配置）
                  </div>
                )}
              </div>
            </div>

            <Divider dashed style={{ margin: "16px 0" }} />

            {/* 2. Available Pool */}
            <div>
              <div style={{ fontSize: 12, color: "#999", marginBottom: 8 }}>
                全部可用模块 (点击添加)
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {APP_REGISTRY.map((app) => {
                  const isSelected = dashboardApps.includes(app.key);
                  const isFull = dashboardApps.length >= 4;
                  const disabled = !isSelected && isFull;

                  return (
                    <div
                      key={app.key}
                      onClick={() => {
                        if (isSelected) return; // Already present
                        if (isFull) {
                          message.warning(
                            "最多只能选择 4 个，请先移除已选模块",
                          );
                          return;
                        }
                        setDashboardApps([...dashboardApps, app.key]);
                      }}
                      style={{
                        padding: "6px 16px",
                        background: isSelected
                          ? "#e6f7ff"
                          : disabled
                            ? "#f5f5f5"
                            : "#fff",
                        border: `1px solid ${
                          isSelected ? "#1890ff" : "#d9d9d9"
                        }`,
                        borderRadius: 20,
                        cursor:
                          disabled || isSelected ? "not-allowed" : "pointer",
                        opacity: disabled ? 0.5 : 1,
                        color: isSelected ? "#1890ff" : "rgba(0,0,0,0.85)",
                        fontSize: 13,
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}>
                      {app.icon} {app.title} {isSelected && "✓"}
                    </div>
                  );
                })}
              </div>
            </div>
          </Form.Item>

          <Divider />

          <Form.Item label="账号信息默认视图 (ProjectSite)">
            <Radio.Group
              options={ACCOUNT_VIEW_OPTIONS}
              value={accountView}
              onChange={(e) => setAccountView(e.target.value)}
              optionType="button"
              buttonStyle="solid"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              onClick={handleSavePersonal}
              icon={<SaveOutlined />}>
              保存个人偏好
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Part 2: System Config (Existing) */}
      <Card
        title="Chrome 扩展配置 (Global)"
        variant="borderless"
        style={{ marginTop: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            extension_download_url: "",
          }}>
          <Form.Item
            label="当前版本号 (Latest Version)"
            extra="客户端会自动检测此版本号，若高于本地版本则提示更新。">
            <Input
              value={version}
              placeholder="正在获取版本..."
              style={{ maxWidth: 300, background: "#f5f5f5", color: "#666" }}
              readOnly
            />
            <div style={{ marginTop: 4, color: "#faad14", fontSize: 12 }}>
              ℹ️ 版本号已由服务器 manifest.json 托管，无需手动配置。
            </div>
          </Form.Item>

          <Form.Item
            name="extension_download_url"
            label="下载地址 (Download URL)"
            extra={
              <span>
                点击更新提示后跳转的链接。
                <br />
                <span style={{ color: "#faad14" }}>
                  留空则默认使用本机地址：/extension/chrome-extension-latest.zip
                </span>
              </span>
            }>
            <Input placeholder="默认为本机最新版，需要使用 CDN 或 OSS 时可在此覆盖" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}>
              保存系统配置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
