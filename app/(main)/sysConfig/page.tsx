"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Button,
  message,
  Typography,
  Checkbox,
  Radio,
  Divider,
  Row,
  Col,
  Select,
} from "antd";

const { Option } = Select;
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
  const [accountView, setAccountView] = useState("text");

  // Load configs once on mount
  useEffect(() => {
    const fetchConfigs = async () => {
      // 1. Load Server Configs
      try {
        const res = await fetch("/api/system-config");
        if (res.ok) {
          const data = await res.json();
          setVersion(data.extension_version || "1.0");
          form.setFieldsValue({
            extension_download_url: data.extension_download_url || "",
          });
        }
      } catch (error) {
        console.error("Failed to load server configs", error);
      }

      // 2. Load Local Personal Prefs
      if (typeof window !== "undefined") {
        const loadedApps = localStorage.getItem(STORAGE_KEYS.DASHBOARD_APPS);
        if (loadedApps) {
          try {
            setDashboardApps(JSON.parse(loadedApps));
          } catch (e) {
            setDashboardApps(getDefaultAppKeys());
          }
        } else {
          setDashboardApps(getDefaultAppKeys());
        }

        const loadedView = localStorage.getItem(STORAGE_KEYS.ACCOUNT_VIEW_PREF);
        setAccountView(loadedView || "text");
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
    localStorage.setItem(
      STORAGE_KEYS.DASHBOARD_APPS,
      JSON.stringify(dashboardApps),
    );
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
          <Form.Item label="首页仪表盘排版 (支持排序，最多 4 个)">
            <div
              style={{
                background: "#fafafa",
                padding: "16px",
                borderRadius: "8px",
                border: "1px solid #f0f0f0",
              }}>
              {[0, 1, 2, 3].map((index) => {
                const currentValue = dashboardApps[index];
                return (
                  <div
                    key={index}
                    style={{
                      marginBottom: 12,
                      display: "flex",
                      alignItems: "center",
                    }}>
                    <span
                      style={{
                        width: 60,
                        color: "#666",
                        fontWeight: 500,
                        marginRight: 8,
                      }}>
                      位置 {index + 1}
                    </span>
                    <Select
                      style={{ flex: 1 }}
                      placeholder="（空位）"
                      allowClear
                      value={currentValue}
                      onChange={(val) => {
                        const tempSlots = [...dashboardApps];
                        // Pad with empty strings if needed to ensure index accessibility
                        while (tempSlots.length <= index) tempSlots.push("");

                        if (val) {
                          tempSlots[index] = val;
                          // Standardize: Filter out empty strings to keep list compact
                          setDashboardApps(tempSlots.filter(Boolean));
                        } else {
                          // Remove item at index
                          tempSlots.splice(index, 1);
                          setDashboardApps(tempSlots.filter(Boolean));
                        }
                      }}>
                      {APP_REGISTRY.map((app) => {
                        const isSelectedElsewhere =
                          dashboardApps.includes(app.key) &&
                          app.key !== currentValue;
                        return (
                          <Option
                            key={app.key}
                            value={app.key}
                            disabled={isSelectedElsewhere}>
                            <span style={{ marginRight: 8 }}>{app.title}</span>
                            <span style={{ color: "#999", fontSize: 12 }}>
                              {app.desc}
                            </span>
                          </Option>
                        );
                      })}
                    </Select>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 8, color: "#999", fontSize: 12 }}>
              通过下拉框选择每个位置显示的内容。若要调整顺序，可直接修改对应位置的选项。
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
