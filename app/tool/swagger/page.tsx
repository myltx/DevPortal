"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Typography,
  Space,
  Divider,
  message,
  Tabs,
  Alert,
  Tooltip,
} from "antd";
import { useRouter } from "next/navigation";
import {
  CopyOutlined,
  LinkOutlined,
  RocketOutlined,
  ReloadOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

export default function SwaggerToolPage() {
  const router = useRouter(); // Initialize router
  const [form] = Form.useForm();
  const [webhookForm] = Form.useForm();

  const [generatedLink, setGeneratedLink] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [jenkinsScript, setJenkinsScript] = useState("");
  const [curlScript, setCurlScript] = useState("");

  const [baseUrl, setBaseUrl] = useState("");

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [testResult, setTestResult] = useState<{
    success: boolean;
    data: any;
  } | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    // Client-side execution
    setBaseUrl(window.location.origin);

    // Set defaults
    form.setFieldsValue({
      timeout: 10000,
      debugLimit: 0,
    });

    // Trigger initial generation
    setTimeout(handleGenerate, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const handleGenerate = () => {
    const values = form.getFieldsValue();
    const { targetUrl, apiPrefix, timeout, debugLimit, moduleId } = values;

    if (!baseUrl) return;

    const url = new URL(`${baseUrl}/api/tool/swagger-merge`);

    // Hybrid Logic: ModuleID or TargetURL
    if (moduleId) url.searchParams.set("moduleId", moduleId);
    if (targetUrl) url.searchParams.set("targetUrl", targetUrl);

    if (apiPrefix) url.searchParams.set("apiPrefix", apiPrefix);
    if (timeout && timeout !== 10000) url.searchParams.set("timeout", timeout);
    if (debugLimit && debugLimit !== 0)
      url.searchParams.set("debugLimit", debugLimit);

    setGeneratedLink(url.toString());

    // Sync to Webhook form for convenience
    const wValues = webhookForm.getFieldsValue();
    if (!wValues.webhookTargetUrl && targetUrl)
      webhookForm.setFieldsValue({ webhookTargetUrl: targetUrl });
    if (!wValues.webhookApiPrefix && apiPrefix)
      webhookForm.setFieldsValue({ webhookApiPrefix: apiPrefix });

    handleWebhookGenerate();
  };

  const handleSmartPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (!text || !text.startsWith("http")) return;

    e.preventDefault();
    try {
      const u = new URL(text);

      // 1. Domain (Origin) -> Target URL
      const origin = u.origin;

      // 2. Path Logic
      let path = u.pathname;
      // Remove common suffixes
      const suffixes = [
        "/doc.html",
        "/swagger-ui.html",
        "/swagger-ui/index.html",
        "/swagger-ui/",
      ];
      for (const s of suffixes) {
        if (path.endsWith(s)) {
          path = path.substring(0, path.length - s.length);
          break;
        }
      }
      path = path.replace(/\/$/, "");

      // Strategy: If path depth > 0, it's likely a prefix
      let prefix = "";
      if (path && path !== "/") {
        prefix = path;
      }

      form.setFieldsValue({
        targetUrl: origin,
        apiPrefix: prefix,
      });

      message.success("智能粘贴成功: 已自动拆分域名和前缀");
      handleGenerate();
    } catch (err) {
      // Fallback
      form.setFieldValue("targetUrl", text);
    }
  };

  const handleTest = async () => {
    if (!generatedLink) return;
    setTestLoading(true);
    setTestResult(null);

    try {
      const u = new URL(generatedLink);
      // Force debugLimit=1 to speed up test
      u.searchParams.set("debugLimit", "1");

      const res = await fetch(u.toString());
      const data = await res.json();

      if (res.ok) {
        setTestResult({
          success: true,
          data: {
            info: data.info,
            tagsCount: data.tags?.length,
            pathsCount: Object.keys(data.paths || {}).length,
          },
        });
        message.success("连接测试成功");
      } else {
        setTestResult({ success: false, data });
        message.error("连接失败");
      }
    } catch (err: any) {
      setTestResult({ success: false, data: { message: err.message } });
      message.error("请求异常");
    } finally {
      setTestLoading(false);
    }
  };

  const handleWebhookGenerate = () => {
    if (!baseUrl) return;

    const values = webhookForm.getFieldsValue();
    const { projectId, webhookTargetUrl, webhookApiPrefix, webhookModuleId } =
      values;

    const url = new URL(`${baseUrl}/api/webhook/jenkins`);
    url.searchParams.set("projectId", projectId || "YOUR_PROJECT_ID");

    if (webhookModuleId) url.searchParams.set("moduleId", webhookModuleId);
    if (webhookTargetUrl) url.searchParams.set("targetUrl", webhookTargetUrl);
    if (webhookApiPrefix) url.searchParams.set("apiPrefix", webhookApiPrefix);

    const fullUrl = url.toString();
    setWebhookUrl(fullUrl);

    // Scripts
    const secretPlaceHolder = "env.JENKINS_WEBHOOK_SECRET";

    const groovy = `httpRequest(
    url: "${fullUrl}",
    httpMode: 'POST',
    customHeaders: [[name: 'x-jenkins-token', value: ${secretPlaceHolder}]],
    requestBody: '{"status": "SUCCESS"}',
    contentType: 'APPLICATION_JSON'
)`;
    setJenkinsScript(groovy);

    const curl = `curl -X POST "${fullUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-jenkins-token: YOUR_SECRET_TOKEN" \\
  -d '{"status": "SUCCESS"}'`;
    setCurlScript(curl);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success("已复制到剪贴板");
    });
  };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <div
        style={{
          textAlign: "center",
          marginBottom: 32,
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
        <Tooltip title="工作台">
          <div
            style={{
              position: "absolute",
              left: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 32,
              height: 32,
              cursor: "pointer",
              borderRadius: 4,
              transition: "background 0.2s",
            }}
            onClick={() => router.push("/middle")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }>
            <AppstoreOutlined style={{ fontSize: "18px" }} />
          </div>
        </Tooltip>
        <div>
          <Title level={2} style={{ marginBottom: 4 }}>
            Swagger Merge Tool
          </Title>
          <Text type="secondary">
            多模块 Swagger 文档聚合 & Apifox 自动导入工具
          </Text>
        </div>
      </div>

      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Card 1: Link Generator */}
        <Card
          title={
            <Space>
              <LinkOutlined />
              <span>导入链接生成器</span>
            </Space>
          }
          extra={
            <Button
              type="text"
              icon={<ReloadOutlined />}
              onClick={() => form.resetFields()}>
              重置
            </Button>
          }>
          <Alert
            message="使用说明"
            description={
              <ul>
                <li>
                  支持 <b>智能粘贴</b>: 直接粘贴完整 Swagger 地址 (如
                  http://api.com/my-service/doc.html)，自动拆分 Target URL 和
                  Prefix。
                </li>
                <li>生成的链接可直接用于 Apifox 的 'URL 导入' 功能。</li>
              </ul>
            }
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form form={form} layout="vertical" onValuesChange={handleGenerate}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}>
              <Form.Item
                label="Target URL (通用模式)"
                name="targetUrl"
                tooltip="目标服务的根地址，例如 http://192.168.1.10:8080">
                <Input
                  placeholder="粘贴完整地址自动拆分..."
                  onPaste={handleSmartPaste}
                  allowClear
                />
              </Form.Item>
              <Form.Item
                label="Module ID (托管模式)"
                name="moduleId"
                tooltip="DevPortal 数据库中的模块 ID，自动读取配置">
                <InputNumber style={{ width: "100%" }} placeholder="例如: 12" />
              </Form.Item>
            </div>

            <Form.Item label="API Prefix (可选)" name="apiPrefix">
              <Input placeholder="自动提取或手动输入，例如 /order-service" />
            </Form.Item>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}>
              <Form.Item label="超时时间 (ms)" name="timeout">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
              <Form.Item
                label="调试限制 (Debug Limit)"
                name="debugLimit"
                tooltip="仅拉取前 N 个分组用于调试">
                <InputNumber style={{ width: "100%" }} />
              </Form.Item>
            </div>

            <Divider dashed />

            <Paragraph strong>生成的导入链接</Paragraph>
            <div
              style={{
                background: "#f5f5f5",
                padding: 12,
                borderRadius: 6,
                marginBottom: 12,
                wordBreak: "break-all",
                fontFamily: "monospace",
              }}>
              {generatedLink || "等待输入..."}
            </div>
            <Space style={{ marginBottom: 16 }}>
              <Button
                type="primary"
                icon={<CopyOutlined />}
                onClick={() => copyToClipboard(generatedLink)}>
                复制链接
              </Button>
              <Button
                icon={<LinkOutlined />}
                onClick={() => window.open(generatedLink, "_blank")}>
                在浏览器打开
              </Button>
              <Button
                icon={<RocketOutlined />}
                onClick={handleTest}
                loading={testLoading}>
                测试连接 (预览)
              </Button>
            </Space>

            {testResult && (
              <Alert
                message={testResult.success ? "连接成功" : "连接失败"}
                type={testResult.success ? "success" : "error"}
                showIcon
                description={
                  <div
                    style={{ maxHeight: 200, overflow: "auto", marginTop: 8 }}>
                    <Typography.Text code>
                      {JSON.stringify(testResult.data, null, 2)}
                    </Typography.Text>
                  </div>
                }
              />
            )}
          </Form>
        </Card>

        {/* Card 2: Webhook Generator */}
        <Card
          title={
            <Space>
              <RocketOutlined />
              <span>Jenkins Webhook 生成器</span>
            </Space>
          }>
          <Paragraph type="secondary">
            生成 Jenkins Pipeline 脚本，构建成功后自动触发 Apifox 导入。
          </Paragraph>

          <Form
            form={webhookForm}
            layout="vertical"
            onValuesChange={handleWebhookGenerate}>
            <Form.Item
              label="Apifox Project ID (必填)"
              name="projectId"
              required>
              <Input placeholder="例如: 1234567" />
            </Form.Item>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 16,
              }}>
              <Form.Item label="Module ID (覆盖)" name="webhookModuleId">
                <InputNumber style={{ width: "100%" }} placeholder="ID" />
              </Form.Item>
              <Form.Item label="Target URL (覆盖)" name="webhookTargetUrl">
                <Input placeholder="URL" />
              </Form.Item>
              <Form.Item label="API Prefix (覆盖)" name="webhookApiPrefix">
                <Input placeholder="/api" />
              </Form.Item>
            </div>

            <Tabs
              items={[
                {
                  key: "jenkins",
                  label: "Jenkins Pipeline",
                  children: (
                    <>
                      <Input.TextArea
                        value={jenkinsScript}
                        autoSize={{ minRows: 6, maxRows: 10 }}
                        readOnly
                        style={{
                          fontFamily: "monospace",
                          background: "#282c34",
                          color: "#abb2bf",
                        }}
                      />
                      <Button
                        type="primary"
                        icon={<CopyOutlined />}
                        style={{ marginTop: 12 }}
                        onClick={() => copyToClipboard(jenkinsScript)}>
                        复制脚本
                      </Button>
                    </>
                  ),
                },
                {
                  key: "shell",
                  label: "Shell / Curl",
                  children: (
                    <>
                      <Input.TextArea
                        value={curlScript}
                        autoSize={{ minRows: 4, maxRows: 8 }}
                        readOnly
                        style={{
                          fontFamily: "monospace",
                          background: "#282c34",
                          color: "#abb2bf",
                        }}
                      />
                      <Button
                        type="primary"
                        icon={<CopyOutlined />}
                        style={{ marginTop: 12 }}
                        onClick={() => copyToClipboard(curlScript)}>
                        复制命令
                      </Button>
                    </>
                  ),
                },
              ]}
            />
          </Form>
        </Card>
      </Space>
    </div>
  );
}
