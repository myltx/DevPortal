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
  Select,
} from "antd";
import { useRouter } from "next/navigation";
import {
  CopyOutlined,
  LinkOutlined,
  RocketOutlined,
  ReloadOutlined,
  AppstoreOutlined,
} from "@ant-design/icons";
import * as API from "@/lib/api/project"; // Import API

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

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
  const [moduleOptions, setModuleOptions] = useState<any[]>([]); // simplified type for groups
  const [moduleDataMap, setModuleDataMap] = useState<Record<number, any>>({}); // ID -> Module Detail map
  const [loadingModules, setLoadingModules] = useState(false);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const [testResult, setTestResult] = useState<{
    success: boolean;
    data: any;
  } | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  const [webhookTestLoading, setWebhookTestLoading] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{
    success: boolean;
    data: any;
  } | null>(null);

  const [appConfig, setAppConfig] = useState<{
    jenkinsSecret: string;
    publicUrl: string;
  }>({ jenkinsSecret: "", publicUrl: "" });

  const INIT_VALUES = {
    timeout: 10000,
    debugLimit: 0,
    apiPrefix: "/api",
  };

  useEffect(() => {
    // Client-side execution
    setBaseUrl(window.location.origin);

    // Fetch Config
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/tool/swagger/config");
        const data = await res.json();
        setAppConfig(data);
      } catch (err) {
        console.error("Failed to fetch app config", err);
      }
    };
    fetchConfig();

    // Fetch Modules
    fetchModules();

    // Trigger initial generation
    setTimeout(handleGenerate, 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Helper component for JSON display
  const JsonDisplay = ({ data, success }: { data: any; success: boolean }) => (
    <div
      style={{
        marginTop: 12,
        borderRadius: 8,
        overflow: "hidden",
        border: `1px solid ${success ? "rgba(82, 196, 26, 0.2)" : "rgba(255, 77, 79, 0.2)"}`,
      }}>
      <div
        style={{
          background: success
            ? "rgba(82, 196, 26, 0.05)"
            : "rgba(255, 77, 79, 0.05)",
          padding: "8px 12px",
          borderBottom: `1px solid ${success ? "rgba(82, 196, 26, 0.1)" : "rgba(255, 77, 79, 0.1)"}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
        <Text strong style={{ color: success ? "#52c41a" : "#ff4d4f" }}>
          {success ? "Success" : "Error"} Response
        </Text>
        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          onClick={() => copyToClipboard(JSON.stringify(data, null, 2))}>
          Copy JSON
        </Button>
      </div>
      <pre
        style={{
          margin: 0,
          padding: 12,
          maxHeight: 300,
          overflow: "auto",
          fontSize: "13px",
          lineHeight: "1.6",
          background: "#fafafa",
          color: "#4a4a4a",
          fontFamily:
            "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
        }}>
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );

  const fetchModules = async () => {
    setLoadingModules(true);
    try {
      const res = await API.projectList({});
      if (res.success && Array.isArray(res.data)) {
        // Flatten first: extracting all modules from Areas
        /* eslint-disable @typescript-eslint/no-explicit-any */
        const allModules: any[] = [];
        res.data.forEach((area: any) => {
          if (area.list) {
            allModules.push(...area.list);
          }
        });

        // Filter: Only keep DOC/文档 area modules
        const docModules = allModules.filter((m) => {
          const area = (m.areaName || "").toUpperCase();
          return area.includes("DOC") || area.includes("文档");
        });

        // Group by Project Name
        const grouped: Record<string, any[]> = {};
        const dataMap: Record<number, any> = {};

        docModules.forEach((m) => {
          const pName = m.projectName || "未分类项目";
          if (!grouped[pName]) {
            grouped[pName] = [];
          }

          // Populate Data Map
          if (m.moduleId) {
            dataMap[m.moduleId] = m;
          }

          // Push to group
          grouped[pName].push(m);
        });

        setModuleDataMap(dataMap);

        // Transform to Antd Options format
        const options = Object.keys(grouped).map((pName) => ({
          label: pName,
          options: grouped[pName].map((m) => ({
            label: m.moduleName,
            value: m.moduleId,
          })),
        }));

        setModuleOptions(options);

        if (docModules.length === 0) {
          // Optional: console log or silent
          console.log("No DOC modules found.");
        }
      }
    } catch (e) {
      console.error("Failed to fetch modules", e);
    } finally {
      setLoadingModules(false);
    }
  };

  const parseSwaggerUrl = (urlStr: string) => {
    try {
      const u = new URL(urlStr);
      let path = u.pathname;
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

      return {
        origin: u.origin,
        prefix: path === "/" ? "" : path,
      };
    } catch {
      return { origin: urlStr, prefix: "" };
    }
  };

  const handleDocSelect = (moduleId: number) => {
    const m = moduleDataMap[moduleId];
    if (m && m.moduleUrl) {
      const { origin, prefix } = parseSwaggerUrl(m.moduleUrl);
      form.setFieldsValue({
        targetUrl: origin,
        apiPrefix: prefix,
      });
      message.success(`已快速回填 ${m.moduleName} 的配置`);

      // Reset selector
      form.setFieldValue("docModuleId", undefined);
      handleGenerate();
    }
  };

  const handleGenerate = () => {
    const values = form.getFieldsValue();
    const { targetUrl, apiPrefix, timeout, debugLimit } = values;

    if (!baseUrl) return;

    if (!targetUrl) {
      setGeneratedLink("");
      return;
    }

    const url = new URL(`${baseUrl}/api/tool/swagger-merge`);

    // Only use TargetURL now (Simplified)
    url.searchParams.set("targetUrl", targetUrl);

    if (apiPrefix) url.searchParams.set("apiPrefix", apiPrefix);
    if (timeout && timeout !== 10000) url.searchParams.set("timeout", timeout);
    if (debugLimit && debugLimit !== 0)
      url.searchParams.set("debugLimit", debugLimit);

    setGeneratedLink(url.toString());

    // Sync to Webhook form
    if (targetUrl) webhookForm.setFieldsValue({ webhookTargetUrl: targetUrl });
    if (apiPrefix) webhookForm.setFieldsValue({ webhookApiPrefix: apiPrefix });

    handleWebhookGenerate();
  };

  const handleSmartPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (!text || !text.startsWith("http")) return;

    e.preventDefault();
    const { origin, prefix } = parseSwaggerUrl(text);

    form.setFieldsValue({
      targetUrl: origin,
      apiPrefix: prefix,
    });

    message.success("智能粘贴成功: 已自动拆分域名和前缀");
    handleGenerate();
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
    const secretValue =
      appConfig.jenkinsSecret || "YOUR_JENKINS_WEBHOOK_SECRET";

    const groovy = `httpRequest(
    url: "${fullUrl}",
    httpMode: 'POST',
    customHeaders: [[name: 'x-jenkins-token', value: '${secretValue}']],
    requestBody: '{"status": "SUCCESS"}',
    contentType: 'APPLICATION_JSON'
)`;
    setJenkinsScript(groovy);

    const curl = `curl -X POST "${fullUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-jenkins-token: ${secretValue}" \\
  -d '{"status": "SUCCESS"}'`;
    setCurlScript(curl);
  };

  const handleTestWebhook = async () => {
    if (!webhookUrl) return;
    setWebhookTestLoading(true);
    setWebhookTestResult(null);

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-jenkins-token": appConfig.jenkinsSecret, // Use the real token from config
        },
        body: JSON.stringify({
          status: "SUCCESS",
          debug: true,
        }),
      });
      const data = await res.json();
      setWebhookTestResult({ success: res.ok, data });
      if (res.ok) message.success("Webhook 测试发送成功");
      else message.error("Webhook 测试反馈异常");
    } catch (err: any) {
      setWebhookTestResult({ success: false, data: { message: err.message } });
      message.error("Webhook 发送请求失败");
    } finally {
      setWebhookTestLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      message.success("已复制到剪贴板");
    });
  };

  return (
    <div style={{ padding: "40px 24px", maxWidth: 1000, margin: "0 auto" }}>
      {/* Page Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 48,
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
        <Tooltip title="返回工作区">
          <Button
            type="text"
            icon={<AppstoreOutlined style={{ fontSize: "20px" }} />}
            style={{ position: "absolute", left: 0, height: 40, width: 40 }}
            onClick={() => router.push("/middle")}
          />
        </Tooltip>
        <div>
          <Title level={2} style={{ marginBottom: 8, fontWeight: 700 }}>
            Swagger Efficiency Kit
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            多模块聚合、URL 归一化与自动化导入流程
          </Text>
        </div>
      </div>

      <Tabs
        defaultActiveKey="generator"
        size="large"
        type="line"
        items={[
          {
            key: "generator",
            label: (
              <Space>
                <LinkOutlined />
                导入链接生成器
              </Space>
            ),
            children: (
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                  background: "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(10px)",
                }}
                extra={
                  <Button
                    type="text"
                    icon={<ReloadOutlined />}
                    onClick={() => {
                      form.resetFields();
                      handleGenerate();
                    }}>
                    重置
                  </Button>
                }>
                <Alert
                  message="核心逻辑"
                  description="支持智能粘贴与 DOC 模块快速解析。生成的链接可直接用于 Apifox 的 'URL 导入' 模式，自动识别并聚合各模块定义。"
                  type="info"
                  showIcon
                  style={{ marginBottom: 32, borderRadius: 8 }}
                />

                <Form
                  form={form}
                  layout="vertical"
                  initialValues={INIT_VALUES}
                  onValuesChange={handleGenerate}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 24,
                    }}>
                    <Form.Item
                      label="Target URL (源域名)"
                      name="targetUrl"
                      tooltip="后端服务的 base path，支持智能解析">
                      <Input
                        size="large"
                        placeholder="http://192.168.x.x:8080"
                        onPaste={handleSmartPaste}
                        allowClear
                      />
                    </Form.Item>
                    <Form.Item
                      label="Quick Select (DOC 快捷填单)"
                      name="docModuleId"
                      tooltip="从 DOC 库中快速同步已有服务配置">
                      <Select
                        size="large"
                        showSearch
                        placeholder="搜索服务名快速回填"
                        optionFilterProp="label"
                        loading={loadingModules}
                        allowClear
                        options={moduleOptions}
                        onChange={handleDocSelect}
                      />
                    </Form.Item>
                  </div>

                  <Form.Item label="API Prefix (前缀路径)" name="apiPrefix">
                    <Input
                      size="large"
                      placeholder="自动提取或手动输入，例如 /api"
                    />
                  </Form.Item>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 24,
                    }}>
                    <Form.Item label="超时时间 (ms)" name="timeout">
                      <InputNumber size="large" style={{ width: "100%" }} />
                    </Form.Item>
                    <Form.Item
                      label="调试限制 (Debug Limit)"
                      name="debugLimit"
                      tooltip="设为 0 表示聚合全部分组">
                      <InputNumber size="large" style={{ width: "100%" }} />
                    </Form.Item>
                  </div>

                  <Divider dashed />

                  <Paragraph strong style={{ fontSize: 16 }}>
                    聚合导入链接 (Apifox 专用)
                  </Paragraph>
                  <div
                    style={{
                      background: "#f8f9fa",
                      padding: "16px 20px",
                      borderRadius: 12,
                      marginBottom: 20,
                      wordBreak: "break-all",
                      fontFamily: "var(--font-mono)",
                      border: "1px solid #eee",
                      color: generatedLink ? "#1a1a1a" : "#999",
                    }}>
                    {generatedLink || "等待输入参数..."}
                  </div>
                  <Space size="middle">
                    <Button
                      type="primary"
                      size="large"
                      icon={<CopyOutlined />}
                      disabled={!generatedLink}
                      onClick={() => copyToClipboard(generatedLink)}>
                      复制链接
                    </Button>
                    <Button
                      size="large"
                      icon={<LinkOutlined />}
                      disabled={!generatedLink}
                      onClick={() => window.open(generatedLink, "_blank")}>
                      浏览器访问
                    </Button>
                    <Button
                      size="large"
                      icon={<RocketOutlined />}
                      onClick={handleTest}
                      loading={testLoading}
                      disabled={!generatedLink}>
                      测试连接
                    </Button>
                  </Space>

                  {testResult && (
                    <JsonDisplay
                      data={testResult.data}
                      success={testResult.success}
                    />
                  )}
                </Form>
              </Card>
            ),
          },
          {
            key: "webhook",
            label: (
              <Space>
                <RocketOutlined />
                CI/CD 自动化插件
              </Space>
            ),
            children: (
              <Card
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
                  background: "rgba(255,255,255,0.8)",
                  backdropFilter: "blur(10px)",
                }}>
                <Paragraph style={{ fontSize: 15, marginBottom: 32 }}>
                  在 Jenkins 构建流水线中加入以下脚本，当流水线
                  <Text code>SUCCESS</Text> 后将自动更新 Apifox 文档。
                </Paragraph>

                <Form
                  form={webhookForm}
                  layout="vertical"
                  onValuesChange={handleWebhookGenerate}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 24,
                      marginBottom: 12,
                    }}>
                    <Form.Item
                      label="Apifox Project ID"
                      name="projectId"
                      required>
                      <Input size="large" placeholder="例如: 1234567" />
                    </Form.Item>
                    <Form.Item label="Webhook 本地调试">
                      <Button
                        size="large"
                        icon={<RocketOutlined />}
                        block
                        onClick={handleTestWebhook}
                        loading={webhookTestLoading}>
                        发送模拟 Webhook 测试
                      </Button>
                    </Form.Item>
                  </div>

                  {webhookTestResult && (
                    <JsonDisplay
                      data={webhookTestResult.data}
                      success={webhookTestResult.success}
                    />
                  )}

                  <Divider />

                  <Tabs
                    type="card"
                    items={[
                      {
                        key: "jenkins",
                        label: "Jenkins Pipeline",
                        children: (
                          <div style={{ position: "relative" }}>
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              style={{
                                position: "absolute",
                                right: 12,
                                top: 12,
                                color: "#888",
                                zIndex: 10,
                              }}
                              onClick={() => copyToClipboard(jenkinsScript)}>
                              Copy
                            </Button>
                            <Input.TextArea
                              value={jenkinsScript}
                              autoSize={{ minRows: 8, maxRows: 12 }}
                              readOnly
                              style={{
                                fontFamily: "var(--font-mono)",
                                background: "#2d2d2d",
                                color: "#ccc",
                                borderRadius: 12,
                                padding: "20px",
                              }}
                            />
                          </div>
                        ),
                      },
                      {
                        key: "shell",
                        label: "Shell Console",
                        children: (
                          <div style={{ position: "relative" }}>
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined />}
                              style={{
                                position: "absolute",
                                right: 12,
                                top: 12,
                                color: "#888",
                                zIndex: 10,
                              }}
                              onClick={() => copyToClipboard(curlScript)}>
                              Copy
                            </Button>
                            <Input.TextArea
                              value={curlScript}
                              autoSize={{ minRows: 6, maxRows: 10 }}
                              readOnly
                              style={{
                                fontFamily: "var(--font-mono)",
                                background: "#2d2d2d",
                                color: "#ccc",
                                borderRadius: 12,
                                padding: "20px",
                              }}
                            />
                          </div>
                        ),
                      },
                    ]}
                  />
                </Form>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
