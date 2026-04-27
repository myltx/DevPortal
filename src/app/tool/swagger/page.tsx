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
  theme,
  Segmented,
  Table,
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

type DiffRow = {
  key: string;
  method: string;
  path: string;
};

type ChangedRow = DiffRow & {
  changedFields: string[];
};

type DiffResult = {
  summary: {
    beforeTotal: number;
    afterTotal: number;
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
  };
  added: DiffRow[];
  removed: DiffRow[];
  changed: ChangedRow[];
};

export default function SwaggerToolPage() {
  const router = useRouter(); // Initialize router
  const { token } = theme.useToken();
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
  const [baselineInitLoading, setBaselineInitLoading] = useState(false);
  const [baselineInitResult, setBaselineInitResult] = useState<{
    success: boolean;
    data: any;
  } | null>(null);
  const [diffMode, setDiffMode] = useState<"json" | "url">("json");
  const [beforeJsonText, setBeforeJsonText] = useState("");
  const [afterJsonText, setAfterJsonText] = useState("");
  const [beforeDiffUrl, setBeforeDiffUrl] = useState("");
  const [afterDiffUrl, setAfterDiffUrl] = useState("");
  const [diffLoading, setDiffLoading] = useState(false);
  const [diffNotifyLoading, setDiffNotifyLoading] = useState(false);
  const [diffError, setDiffError] = useState("");
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [diffProjectName, setDiffProjectName] = useState("本地测试项目");

  const [appConfig, setAppConfig] = useState<{
    jenkinsSecret: string;
    publicUrl: string;
    internalWebhookUrl: string;
  }>({ jenkinsSecret: "", publicUrl: "", internalWebhookUrl: "" });

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
        <Text
          strong
          style={{ color: success ? token.colorSuccess : token.colorError }}>
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
          background: "var(--surface-2)",
          color: "var(--text-muted)",
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
        apiPrefix: prefix || "/api",
      });
      // 并同步更新 Webhook 表单中的名称
      webhookForm.setFieldsValue({
        projectName: m.projectName,
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
    if (targetUrl) {
      webhookForm.setFieldsValue({ webhookTargetUrl: targetUrl });
    }
    if (apiPrefix) {
      webhookForm.setFieldsValue({ webhookApiPrefix: apiPrefix });
    }

    // Force regeneration with the values we just set
    handleWebhookGenerate();
  };

  const handleSmartPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (!text || !text.startsWith("http")) return;

    e.preventDefault();
    const { origin, prefix } = parseSwaggerUrl(text);

    form.setFieldsValue({
      targetUrl: origin,
      apiPrefix: prefix || "/api",
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
    const {
      projectId,
      webhookTargetUrl,
      webhookApiPrefix,
      webhookModuleId,
      projectName,
    } = values;

    // 1. URL for UI Testing (Clicking "模拟测试" in browser)
    const testUrl = new URL(`${baseUrl}/api/webhook/jenkins`);
    testUrl.searchParams.set("projectId", projectId || "YOUR_PROJECT_ID");
    if (projectName) testUrl.searchParams.set("projectName", projectName);
    if (webhookModuleId) testUrl.searchParams.set("moduleId", webhookModuleId);
    if (webhookTargetUrl)
      testUrl.searchParams.set("targetUrl", webhookTargetUrl);
    if (webhookApiPrefix)
      testUrl.searchParams.set("apiPrefix", webhookApiPrefix);
    setWebhookUrl(testUrl.toString());

    // 2. URL for Scripts (For Jenkins to use)
    // If internalWebhookUrl is configured, use it. Otherwise fallback to current origin.
    const scriptBase = appConfig.internalWebhookUrl || baseUrl;
    const scriptUrl = new URL(`${scriptBase}/api/webhook/jenkins`);
    scriptUrl.searchParams.set("projectId", projectId || "YOUR_PROJECT_ID");
    if (projectName) scriptUrl.searchParams.set("projectName", projectName);
    if (webhookModuleId)
      scriptUrl.searchParams.set("moduleId", webhookModuleId);
    if (webhookTargetUrl)
      scriptUrl.searchParams.set("targetUrl", webhookTargetUrl);
    if (webhookApiPrefix)
      scriptUrl.searchParams.set("apiPrefix", webhookApiPrefix);
    const fullScriptUrl = scriptUrl.toString();

    // Scripts
    const secretValue =
      appConfig.jenkinsSecret || "YOUR_JENKINS_WEBHOOK_SECRET";

    const groovy = `httpRequest(
    url: "${fullScriptUrl}",
    httpMode: 'POST',
    customHeaders: [[name: 'x-jenkins-token', value: '${secretValue}']],
    requestBody: '{"status": "SUCCESS"}',
    contentType: 'APPLICATION_JSON'
)`;
    setJenkinsScript(groovy);

    const curl = `curl -X POST "${fullScriptUrl}" \\
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
      const simulateUrl = new URL(webhookUrl);
      simulateUrl.searchParams.set("simulateOnly", "1");

      const res = await fetch(simulateUrl.toString(), {
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
      if (res.ok) message.success("模拟对比通知发送成功（未导入 Apifox）");
      else message.error("Webhook 测试反馈异常");
    } catch (err: any) {
      setWebhookTestResult({ success: false, data: { message: err.message } });
      message.error("Webhook 发送请求失败");
    } finally {
      setWebhookTestLoading(false);
    }
  };

  const handleInitBaseline = async () => {
    const webhookValues = webhookForm.getFieldsValue();
    const mainValues = form.getFieldsValue();

    const projectId = webhookValues.projectId;
    const moduleId = webhookValues.webhookModuleId;
    const targetUrl = webhookValues.webhookTargetUrl || mainValues.targetUrl;
    const apiPrefix = webhookValues.webhookApiPrefix || mainValues.apiPrefix;
    const timeout = mainValues.timeout;
    const debugLimit = mainValues.debugLimit;

    if (!projectId || !targetUrl) {
      message.warning("初始化基线需要 projectId 和 targetUrl");
      return;
    }

    setBaselineInitLoading(true);
    setBaselineInitResult(null);
    try {
      const res = await fetch("/api/tool/swagger-diff/init-baseline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          moduleId,
          targetUrl,
          apiPrefix,
          timeout,
          debugLimit,
        }),
      });
      const data = await res.json();
      setBaselineInitResult({ success: res.ok, data });
      if (res.ok && data?.success) {
        message.success("基线初始化成功");
      } else {
        message.error(data?.error || "基线初始化失败");
      }
    } catch (err: any) {
      setBaselineInitResult({ success: false, data: { error: err.message } });
      message.error("基线初始化请求失败");
    } finally {
      setBaselineInitLoading(false);
    }
  };

  const diffColumns = [
    { title: "Method", dataIndex: "method", key: "method", width: 120 },
    { title: "Path", dataIndex: "path", key: "path" },
    {
      title: "变更字段",
      dataIndex: "changedFields",
      key: "changedFields",
      render: (fields?: string[]) =>
        Array.isArray(fields) && fields.length > 0 ? fields.join(", ") : "-",
    },
  ];

  const runDiff = async (before: string, after: string) => {
    const response = await fetch("/api/tool/swagger-diff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        before,
        after,
      }),
    });

    const payload = await response.json();
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || "Diff 对比失败");
    }

    setDiffResult(payload.data as DiffResult);
  };

  const handleJsonDiffCompare = async () => {
    if (!beforeJsonText.trim() || !afterJsonText.trim()) {
      message.warning("请先填写 before / after JSON");
      return;
    }

    setDiffLoading(true);
    setDiffError("");
    setDiffResult(null);
    try {
      await runDiff(beforeJsonText, afterJsonText);
      message.success("JSON 对比完成");
    } catch (error: any) {
      const text = error?.message || "JSON 对比失败";
      setDiffError(text);
      message.error(text);
    } finally {
      setDiffLoading(false);
    }
  };

  const handleAutoDiffCompare = async () => {
    if (!beforeDiffUrl.trim() || !afterDiffUrl.trim()) {
      message.warning("请先填写 before / after 接口地址");
      return;
    }

    setDiffLoading(true);
    setDiffError("");
    setDiffResult(null);
    try {
      const [beforeRes, afterRes] = await Promise.all([
        fetch(beforeDiffUrl.trim()),
        fetch(afterDiffUrl.trim()),
      ]);

      if (!beforeRes.ok || !afterRes.ok) {
        throw new Error(`接口拉取失败：before(${beforeRes.status}) / after(${afterRes.status})`);
      }

      const [beforeData, afterData] = await Promise.all([
        beforeRes.json(),
        afterRes.json(),
      ]);
      await runDiff(JSON.stringify(beforeData), JSON.stringify(afterData));
      message.success("接口自动对比完成");
    } catch (error: any) {
      const text = error?.message || "接口自动对比失败";
      setDiffError(text);
      message.error(text);
    } finally {
      setDiffLoading(false);
    }
  };

  const handleMockNotify = async () => {
    if (!webhookUrl) {
      message.warning("请先配置 Webhook 参数");
      return;
    }

    setDiffNotifyLoading(true);
    try {
      const simulateUrl = new URL(webhookUrl);
      simulateUrl.searchParams.set("simulateOnly", "1");
      if (diffProjectName.trim()) {
        simulateUrl.searchParams.set("projectName", diffProjectName.trim());
      }

      const res = await fetch(simulateUrl.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-jenkins-token": appConfig.jenkinsSecret,
        },
        body: JSON.stringify({
          status: "SUCCESS",
          debug: true,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || "模拟推送失败");
      }
      message.success("已发送模拟钉钉通知");
    } catch (error: any) {
      message.error(error?.message || "模拟推送失败");
    } finally {
      setDiffNotifyLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          message.success("已复制到剪贴板");
        })
        .catch(() => {
          fallbackCopyTextToClipboard(text);
        });
    } else {
      fallbackCopyTextToClipboard(text);
    }
  };

  const fallbackCopyTextToClipboard = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand("copy");
      if (successful) {
        message.success("已复制到剪贴板");
      } else {
        message.error("复制失败，请手动选择");
      }
    } catch (err) {
      message.error("浏览器不支持自动复制");
    }
    document.body.removeChild(textArea);
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
                      background: "var(--surface-2)",
                      padding: "16px 20px",
                      borderRadius: 12,
                      marginBottom: 20,
                      wordBreak: "break-all",
                      fontFamily: "var(--font-mono)",
                      border: "1px solid var(--border-color)",
                      color: generatedLink
                        ? "var(--text-strong)"
                        : "var(--text-muted-2)",
                    }}>
                    {generatedLink || "等待输入参数..."}
                  </div>

                  <div style={{ marginBottom: 24 }}>
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
                  </div>

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
                  initialValues={{
                    ...INIT_VALUES,
                    webhookApiPrefix: "/api",
                  }}
                  onValuesChange={handleWebhookGenerate}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 24,
                      marginBottom: 12,
                    }}>
                    <Form.Item
                      label="Project Name (项目中文名)"
                      name="projectName"
                      tooltip="填入后，钉钉通知将显示该项目名。支持中文。">
                      <Input size="large" placeholder="例如: 智能政务系统" />
                    </Form.Item>
                    <Form.Item
                      label="Apifox Project ID"
                      name="projectId"
                      required>
                      <Input size="large" placeholder="例如: 1234567" />
                    </Form.Item>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 24,
                      marginBottom: 12,
                    }}>
                    <Form.Item
                      label="Target URL (覆盖)"
                      name="webhookTargetUrl">
                      <Input size="large" placeholder="默认使用上方配置" />
                    </Form.Item>
                    <Form.Item
                      label="API Prefix (覆盖)"
                      name="webhookApiPrefix">
                      <Input size="large" placeholder="默认使用上方配置" />
                    </Form.Item>
                  </div>
                  <Form.Item
                    label="Apifox Module ID (可选)"
                    name="webhookModuleId"
                    tooltip="用于区分同一项目下不同模块的基线快照">
                    <Input size="large" placeholder="例如: 1001（可选）" />
                  </Form.Item>

                  <Divider dashed />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}>
                    <Paragraph strong style={{ fontSize: 16, margin: 0 }}>
                      自动化脚本 (Jenkins / cURL)
                    </Paragraph>
                    <Space>
                      <Button
                        type="default"
                        icon={<ReloadOutlined />}
                        onClick={handleInitBaseline}
                        loading={baselineInitLoading}>
                        初始化基线
                      </Button>
                      <Button
                        type="default"
                        icon={<RocketOutlined />}
                        onClick={handleTestWebhook}
                        loading={webhookTestLoading}
                        disabled={!webhookUrl}>
                        模拟对比通知（不导入）
                      </Button>
                    </Space>
                  </div>

                  {baselineInitResult && (
                    <div style={{ marginBottom: 20 }}>
                      <JsonDisplay
                        data={baselineInitResult.data}
                        success={baselineInitResult.success}
                      />
                    </div>
                  )}

                  {webhookTestResult && (
                    <div style={{ marginBottom: 20 }}>
                      <JsonDisplay
                        data={webhookTestResult.data}
                        success={webhookTestResult.success}
                      />
                    </div>
                  )}

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
                                color: "var(--text-muted-2)",
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
                                background: "var(--surface-2)",
                                color: "var(--text-muted)",
                                border: "1px solid var(--border-color)",
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
                                color: "var(--text-muted-2)",
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
                                background: "var(--surface-2)",
                                color: "var(--text-muted)",
                                border: "1px solid var(--border-color)",
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
          {
            key: "diff",
            label: (
              <Space>
                <ReloadOutlined />
                Diff 验证
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
                <Space direction="vertical" size={16} style={{ width: "100%" }}>
                  <Alert
                    type="info"
                    showIcon
                    message="本地验证建议"
                    description="先用 JSON 对比验证规则是否符合预期，再用接口自动对比验证和 swagger-merge 链路一致。"
                  />

                  <Segmented
                    options={[
                      { label: "JSON 对比", value: "json" },
                      { label: "接口自动对比", value: "url" },
                    ]}
                    value={diffMode}
                    onChange={(value) => setDiffMode(value as "json" | "url")}
                  />

                  {diffMode === "json" ? (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                      }}>
                      <div>
                        <Text strong>Before JSON</Text>
                        <Input.TextArea
                          rows={14}
                          value={beforeJsonText}
                          onChange={(e) => setBeforeJsonText(e.target.value)}
                          placeholder="粘贴 before.json"
                          style={{ marginTop: 8 }}
                        />
                      </div>
                      <div>
                        <Text strong>After JSON</Text>
                        <Input.TextArea
                          rows={14}
                          value={afterJsonText}
                          onChange={(e) => setAfterJsonText(e.target.value)}
                          placeholder="粘贴 after.json"
                          style={{ marginTop: 8 }}
                        />
                      </div>
                    </div>
                  ) : (
                    <Space direction="vertical" style={{ width: "100%" }} size={12}>
                      <Input
                        value={beforeDiffUrl}
                        onChange={(e) => setBeforeDiffUrl(e.target.value)}
                        placeholder="Before 接口地址，例如 http://localhost:3000/api/tool/swagger-merge?targetUrl=..."
                      />
                      <Input
                        value={afterDiffUrl}
                        onChange={(e) => setAfterDiffUrl(e.target.value)}
                        placeholder="After 接口地址，例如 http://localhost:3000/api/tool/swagger-merge?targetUrl=..."
                      />
                      <Space>
                        <Button
                          onClick={() => setAfterDiffUrl(generatedLink)}
                          disabled={!generatedLink}>
                          使用当前生成链接作为 After
                        </Button>
                        <Button onClick={() => setBeforeDiffUrl(generatedLink)} disabled={!generatedLink}>
                          使用当前生成链接作为 Before
                        </Button>
                      </Space>
                    </Space>
                  )}

                  <Space>
                    <Input
                      style={{ width: 220 }}
                      placeholder="钉钉通知项目名"
                      value={diffProjectName}
                      onChange={(e) => setDiffProjectName(e.target.value)}
                    />
                    <Button
                      type="primary"
                      loading={diffLoading}
                      onClick={diffMode === "json" ? handleJsonDiffCompare : handleAutoDiffCompare}>
                      开始对比
                    </Button>
                    <Button
                      type="dashed"
                      loading={diffNotifyLoading}
                      onClick={handleMockNotify}
                      disabled={!webhookUrl}>
                      模拟自动推送（统一链路）
                    </Button>
                    <Button
                      onClick={() => {
                        setDiffError("");
                        setDiffResult(null);
                        setBeforeJsonText("");
                        setAfterJsonText("");
                        setBeforeDiffUrl("");
                        setAfterDiffUrl("");
                      }}>
                      清空
                    </Button>
                  </Space>

                  {diffError ? <Alert type="error" showIcon message={diffError} /> : null}

                  {diffResult ? (
                    <Space direction="vertical" style={{ width: "100%" }} size={12}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
                          gap: 12,
                        }}>
                        <Card size="small">
                          <Text type="secondary">Before</Text>
                          <div>{diffResult.summary.beforeTotal}</div>
                        </Card>
                        <Card size="small">
                          <Text type="secondary">After</Text>
                          <div>{diffResult.summary.afterTotal}</div>
                        </Card>
                        <Card size="small">
                          <Text type="secondary">新增</Text>
                          <div>{diffResult.summary.added}</div>
                        </Card>
                        <Card size="small">
                          <Text type="secondary">删除</Text>
                          <div>{diffResult.summary.removed}</div>
                        </Card>
                        <Card size="small">
                          <Text type="secondary">修改</Text>
                          <div>{diffResult.summary.changed}</div>
                        </Card>
                        <Card size="small">
                          <Text type="secondary">无变化</Text>
                          <div>{diffResult.summary.unchanged}</div>
                        </Card>
                      </div>

                      <Tabs
                        type="card"
                        items={[
                          {
                            key: "diff-added",
                            label: `新增 (${diffResult.added.length})`,
                            children: (
                              <Table
                                size="small"
                                rowKey="key"
                                columns={diffColumns}
                                dataSource={diffResult.added}
                                pagination={{ pageSize: 10 }}
                              />
                            ),
                          },
                          {
                            key: "diff-removed",
                            label: `删除 (${diffResult.removed.length})`,
                            children: (
                              <Table
                                size="small"
                                rowKey="key"
                                columns={diffColumns}
                                dataSource={diffResult.removed}
                                pagination={{ pageSize: 10 }}
                              />
                            ),
                          },
                          {
                            key: "diff-changed",
                            label: `修改 (${diffResult.changed.length})`,
                            children: (
                              <Table
                                size="small"
                                rowKey="key"
                                columns={diffColumns}
                                dataSource={diffResult.changed}
                                pagination={{ pageSize: 10 }}
                              />
                            ),
                          },
                        ]}
                      />
                    </Space>
                  ) : null}
                </Space>
              </Card>
            ),
          },
        ]}
      />
    </div>
  );
}
