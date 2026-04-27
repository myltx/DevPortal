"use client";

import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  Input,
  Row,
  Space,
  Statistic,
  Table,
  Tabs,
  Typography,
  Upload,
  message,
} from "antd";
import { UploadOutlined, DiffOutlined } from "@ant-design/icons";

type DiffRow = {
  key: string;
  method: string;
  path: string;
};

type ChangedRow = DiffRow & {
  changedFields: string[];
};

type DiffData = {
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

const { TextArea } = Input;

async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsText(file);
  });
}

export default function SwaggerDiffPage() {
  const [beforeText, setBeforeText] = useState("");
  const [afterText, setAfterText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [result, setResult] = useState<DiffData | null>(null);

  const columns = useMemo(
    () => [
      { title: "Method", dataIndex: "method", key: "method", width: 120 },
      { title: "Path", dataIndex: "path", key: "path" },
      {
        title: "变更字段",
        dataIndex: "changedFields",
        key: "changedFields",
        render: (fields?: string[]) => (fields && fields.length > 0 ? fields.join(", ") : "-"),
      },
    ],
    [],
  );

  const compare = async () => {
    setLoading(true);
    setErrorText("");
    setResult(null);

    try {
      if (!beforeText.trim() || !afterText.trim()) {
        throw new Error("请先提供 before / after 两份 JSON");
      }

      const res = await fetch("/api/tool/swagger-diff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          before: beforeText,
          after: afterText,
        }),
      });

      const payload = await res.json();
      if (!res.ok || !payload?.success) {
        throw new Error(payload?.error || "Diff 接口调用失败");
      }
      setResult(payload.data as DiffData);
      message.success("对比完成");
    } catch (error: unknown) {
      const text = error instanceof Error ? error.message : "对比失败";
      setErrorText(text);
      message.error(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "28px 20px", maxWidth: 1400, margin: "0 auto" }}>
      <Space direction="vertical" size={16} style={{ width: "100%" }}>
        <Typography.Title level={3} style={{ marginBottom: 0 }}>
          Swagger Diff 验证
        </Typography.Title>
        <Typography.Text type="secondary">
          上传或粘贴 before/after 两份 Swagger/OpenAPI JSON，先做本地变更验证，再决定是否接入自动化通知。
        </Typography.Text>

        <Card>
          <Row gutter={16}>
            <Col span={12}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Space style={{ justifyContent: "space-between", width: "100%" }}>
                  <Typography.Text strong>Before JSON</Typography.Text>
                  <Upload
                    accept=".json,application/json"
                    maxCount={1}
                    showUploadList={false}
                    beforeUpload={async (file) => {
                      const text = await readTextFile(file);
                      setBeforeText(text);
                      message.success("Before 文件已加载");
                      return false;
                    }}
                  >
                    <Button size="small" icon={<UploadOutlined />}>
                      上传 JSON
                    </Button>
                  </Upload>
                </Space>
                <TextArea
                  value={beforeText}
                  onChange={(e) => setBeforeText(e.target.value)}
                  rows={16}
                  placeholder="粘贴 before JSON"
                />
              </Space>
            </Col>
            <Col span={12}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Space style={{ justifyContent: "space-between", width: "100%" }}>
                  <Typography.Text strong>After JSON</Typography.Text>
                  <Upload
                    accept=".json,application/json"
                    maxCount={1}
                    showUploadList={false}
                    beforeUpload={async (file) => {
                      const text = await readTextFile(file);
                      setAfterText(text);
                      message.success("After 文件已加载");
                      return false;
                    }}
                  >
                    <Button size="small" icon={<UploadOutlined />}>
                      上传 JSON
                    </Button>
                  </Upload>
                </Space>
                <TextArea
                  value={afterText}
                  onChange={(e) => setAfterText(e.target.value)}
                  rows={16}
                  placeholder="粘贴 after JSON"
                />
              </Space>
            </Col>
          </Row>

          <Space style={{ marginTop: 16 }}>
            <Button type="primary" icon={<DiffOutlined />} loading={loading} onClick={compare}>
              开始对比
            </Button>
            <Button
              onClick={() => {
                setBeforeText("");
                setAfterText("");
                setResult(null);
                setErrorText("");
              }}
            >
              清空
            </Button>
          </Space>
        </Card>

        {errorText ? <Alert type="error" message={errorText} showIcon /> : null}

        {result ? (
          <Card>
            <Row gutter={[16, 16]}>
              <Col xs={12} sm={8} md={4}>
                <Statistic title="Before 接口数" value={result.summary.beforeTotal} />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic title="After 接口数" value={result.summary.afterTotal} />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic title="新增" value={result.summary.added} />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic title="删除" value={result.summary.removed} />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic title="修改" value={result.summary.changed} />
              </Col>
              <Col xs={12} sm={8} md={4}>
                <Statistic title="无变化" value={result.summary.unchanged} />
              </Col>
            </Row>

            <Tabs
              style={{ marginTop: 20 }}
              items={[
                {
                  key: "added",
                  label: `新增 (${result.added.length})`,
                  children: (
                    <Table
                      size="small"
                      rowKey="key"
                      columns={columns}
                      dataSource={result.added}
                      pagination={{ pageSize: 20 }}
                    />
                  ),
                },
                {
                  key: "removed",
                  label: `删除 (${result.removed.length})`,
                  children: (
                    <Table
                      size="small"
                      rowKey="key"
                      columns={columns}
                      dataSource={result.removed}
                      pagination={{ pageSize: 20 }}
                    />
                  ),
                },
                {
                  key: "changed",
                  label: `修改 (${result.changed.length})`,
                  children: (
                    <Table
                      size="small"
                      rowKey="key"
                      columns={columns}
                      dataSource={result.changed}
                      pagination={{ pageSize: 20 }}
                    />
                  ),
                },
              ]}
            />
          </Card>
        ) : null}
      </Space>
    </div>
  );
}
