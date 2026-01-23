"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Modal,
  Space,
  Form,
  Input,
  Select,
  Card,
  Typography,
  message,
} from "antd";
import {
  SearchOutlined,
  SyncOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

const { Option } = Select;

const ApifoxLogsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // Modal for raw JSON
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Manual cleanup modal
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);
  const [cleanupToken, setCleanupToken] = useState("");
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const fetchLogs = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...Object.fromEntries(
          Object.entries(values).filter(([_, v]) => v != null && v !== ""),
        ),
      });

      const res = await fetch(`/api/apifox-logs?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data.records);
        setTotal(result.data.total);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const runCleanup = async () => {
    setCleanupLoading(true);
    try {
      const res = await fetch("/api/apifox-logs/cleanup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cleanup-token": cleanupToken,
        },
      });

      const result = await res.json().catch(() => null);
      if (!res.ok || !result?.success) {
        message.error(result?.error || "清理失败");
        return;
      }

      message.success(
        `清理完成：删除 ${result.data.deletedTotal} 条，项目数 ${result.data.projectCount}，耗时 ${result.data.durationMs}ms`,
      );
      setCleanupModalOpen(false);
      fetchLogs(1, pagination.pageSize);
    } catch (error) {
      console.error("Cleanup failed:", error);
      message.error("清理失败");
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleTableChange = (pag: any) => {
    setPagination(pag);
    fetchLogs(pag.current, pag.pageSize);
  };

  const showDetail = (record: any) => {
    setSelectedLog(record);
    setIsModalVisible(true);
  };

  const columns = [
    {
      title: "同步时间",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (text: string) => new Date(text).toLocaleString("zh-CN"),
    },
    {
      title: "项目名称",
      dataIndex: "projectName",
      key: "projectName",
    },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag
          icon={
            status === "SUCCESS" ? (
              <CheckCircleOutlined />
            ) : (
              <CloseCircleOutlined />
            )
          }
          color={status === "SUCCESS" ? "success" : "error"}>
          {status === "SUCCESS" ? "成功" : "失败"}
        </Tag>
      ),
    },
    {
      title: "接口变动 (新/改/忽)",
      key: "endpointStats",
      render: (_: any, record: any) => (
        <Space>
          <Tag color="blue">+{record.endpointCreated}</Tag>
          <Tag color="orange">~{record.endpointUpdated}</Tag>
          <Tag color="default">#{record.endpointIgnored}</Tag>
        </Space>
      ),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => showDetail(record)}>
          详情
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 24,
        }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          Apifox 同步日志
        </Typography.Title>
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => setCleanupModalOpen(true)}>
          清理日志
        </Button>
      </div>

      <Card variant="borderless" style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          onFinish={() => fetchLogs(1, pagination.pageSize)}>
          <Form.Item name="projectName" label="项目名称">
            <Input placeholder="输入项目名搜索" allowClear />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="全部" style={{ width: 120 }} allowClear>
              <Option value="SUCCESS">成功</Option>
              <Option value="FAILURE">失败</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                htmlType="submit">
                查询
              </Button>
              <Button
                icon={<SyncOutlined />}
                onClick={() => {
                  form.resetFields();
                  fetchLogs(1, pagination.pageSize);
                }}>
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          ...pagination,
          total,
          showSizeChanger: true,
          showTotal: (t) => `共 ${t} 条记录`,
        }}
        onChange={handleTableChange}
        bordered
      />

      <Modal
        title="同步详情 (原始响应)"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>,
        ]}
        width={800}>
        {selectedLog && (
          <div style={{ maxHeight: 600, overflow: "auto" }}>
            <div style={{ marginBottom: 16 }}>
              <strong>错误信息:</strong> {selectedLog.errorMessage || "无"}
            </div>
            <Typography.Text strong>Raw Response JSON:</Typography.Text>
            <pre
              style={{
                background: "var(--surface-2)",
                border: "1px solid var(--border-color)",
                padding: "12px",
                borderRadius: "4px",
                fontSize: "12px",
                marginTop: 8,
                color: "var(--text-muted)",
              }}>
              {(() => {
                try {
                  return JSON.stringify(
                    JSON.parse(selectedLog.rawResponse || "{}"),
                    null,
                    2,
                  );
                } catch {
                  return selectedLog.rawResponse || "{}";
                }
              })()}
            </pre>
          </div>
        )}
      </Modal>

      <Modal
        title="清理 Apifox 同步日志"
        open={cleanupModalOpen}
        onCancel={() => setCleanupModalOpen(false)}
        okText="确认清理"
        okButtonProps={{ danger: true, loading: cleanupLoading }}
        onOk={runCleanup}>
        <div style={{ marginBottom: 12 }}>
          将执行一次全库清理：对每个项目仅保留最近 10 条推送日志（条数可通过环境变量调整）。
        </div>
        <div style={{ marginBottom: 8 }}>
          如服务端配置了清理口令，请在下方输入（可留空）。
        </div>
        <Input.Password
          placeholder="清理口令（可选）"
          value={cleanupToken}
          onChange={(e) => setCleanupToken(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default ApifoxLogsPage;
