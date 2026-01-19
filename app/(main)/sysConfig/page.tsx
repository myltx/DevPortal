"use client";

import React, { useEffect, useState } from "react";
import { Card, Form, Input, Button, message, Typography } from "antd";
import { SaveOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

export default function SysConfigPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Move fetchConfigs inside useEffect or use useCallback
  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const res = await fetch("/api/system-config");
        if (res.ok) {
          const data = await res.json();
          // 如果数据库没有数据，默认显示 1.0
          if (!data.extension_version) {
            data.extension_version = "1.0";
          }
          form.setFieldsValue(data);
        }
      } catch (error) {
        console.error("Failed to load configs", error);
      }
    };
    fetchConfigs();
  }, [form]);

  interface ConfigValues {
    extension_version: string;
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
            localStorage.getItem("currentUser") || "Unknown"
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

      <Card title="Chrome 扩展配置" bordered={false} style={{ marginTop: 24 }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            extension_version: "1.0",
            extension_download_url: "",
          }}>
          <Form.Item
            name="extension_version"
            label="当前版本号 (Latest Version)"
            extra="客户端会自动检测此版本号，若高于本地版本则提示更新。"
            rules={[{ required: true, message: "请输入版本号" }]}>
            <Input placeholder="例如: 1.0" style={{ maxWidth: 300 }} />
          </Form.Item>

          <Form.Item
            name="extension_download_url"
            label="下载地址 (Download URL)"
            extra="点击更新提示后跳转的链接 (支持 HTTP/HTTPS 链接)。">
            <Input placeholder="http://..." />
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
