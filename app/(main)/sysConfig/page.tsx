"use client";

import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, message, Typography } from "antd";
import { SaveOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function SysConfigPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState("");

  // Load configs once on mount
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const res = await fetch("/api/system-config");
        if (res.ok) {
          const data = await res.json();
          console.log("SysConfig Loaded:", data);

          // Set version for display
          setVersion(data.extension_version || "1.0");

          // Set form values (only editable ones)
          form.setFieldsValue({
            extension_download_url: data.extension_download_url || "",
          });
        }
      } catch (error) {
        console.error("Failed to load configs", error);
      }
    };
    fetchConfigs();
  }, []); // Empty dependency array -> Run once

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
        message.success("配置已更新");
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

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto" }}>
      <Title level={2}>系统配置</Title>
      <Paragraph type="secondary">
        管理全站通用的系统参数，更新后即时生效 (无需重启服务)。
      </Paragraph>

      <Card
        title="Chrome 扩展配置"
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
              保存配置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
