"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
  Statistic,
  Row,
  Col,
  Pagination,
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
  const [stats, setStats] = useState<{
    total: number;
    success: number;
    failure: number;
    projectCount: number;
  } | null>(null);

  // Modal for raw JSON
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  // Manual cleanup modal
  const [cleanupModalOpen, setCleanupModalOpen] = useState(false);
  const [cleanupToken, setCleanupToken] = useState("");
  const [cleanupLoading, setCleanupLoading] = useState(false);

  const tableSectionRef = useRef<HTMLDivElement | null>(null);
  const paginationRef = useRef<HTMLDivElement | null>(null);
  const [tableBodyY, setTableBodyY] = useState<number>(420);

  const fetchLogs = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const values = form.getFieldsValue();
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        withStats: "1",
        ...Object.fromEntries(
          Object.entries(values).filter(([_, v]) => v != null && v !== ""),
        ),
      });

      const res = await fetch(`/api/apifox-logs?${params.toString()}`);
      const result = await res.json();
      if (result.success) {
        setData(result.data.records);
        setTotal(result.data.total);
        setStats(result.data.stats || null);
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

  const recalcTableBodyY = useCallback(() => {
    const root = tableSectionRef.current;
    if (!root) return;

    const sectionHeight = root.getBoundingClientRect().height;
    const paginationHeight = paginationRef.current
      ? paginationRef.current.getBoundingClientRect().height
      : 56;

    const thead = root.querySelector(".ant-table-thead") as HTMLElement | null;
    const headerHeight = thead ? thead.getBoundingClientRect().height : 55;

    // Keep a small buffer for borders/gaps.
    const nextY = Math.max(220, Math.floor(sectionHeight - paginationHeight - headerHeight - 16));
    setTableBodyY(nextY);
  }, []);

  useLayoutEffect(() => {
    const raf = requestAnimationFrame(recalcTableBodyY);
    window.addEventListener("resize", recalcTableBodyY);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", recalcTableBodyY);
    };
  }, [recalcTableBodyY]);

  useEffect(() => {
    const raf = requestAnimationFrame(recalcTableBodyY);
    return () => cancelAnimationFrame(raf);
  }, [data.length, pagination.current, pagination.pageSize, recalcTableBodyY]);

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
    <div
      style={{
        // MainLayout.Content 默认有 padding: 24；这里用负 margin 抵消，避免 height:100% 时触发外层滚动
        // 同时把 padding 还回来，保证页面内边距一致
        margin: -24,
        padding: 24,
        boxSizing: "border-box",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
        }}>
        <div>
          <Typography.Title level={5} style={{ margin: 0 }}>
            同步日志
          </Typography.Title>
          <Typography.Text type="secondary">
            用于快速查看 Jenkins 自动同步到 Apifox 的最近结果
          </Typography.Text>
        </div>
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={() => setCleanupModalOpen(true)}>
          清理日志
        </Button>
      </div>

      {stats && (
        <Card
          variant="borderless"
          style={{ marginBottom: 12 }}
          styles={{ body: { padding: "12px 16px" } }}>
          <Row gutter={[16, 8]}>
            <Col xs={12} sm={8} md={6} lg={5}>
              <Statistic title="项目数" value={stats.projectCount} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={5}>
              <Statistic title="总记录" value={stats.total} />
            </Col>
            <Col xs={12} sm={8} md={6} lg={5}>
              <Statistic
                title="成功"
                value={stats.success}
                valueStyle={{ color: "var(--primary)" }}
              />
            </Col>
            <Col xs={12} sm={8} md={6} lg={5}>
              <Statistic
                title="失败"
                value={stats.failure}
                valueStyle={{ color: "var(--text-muted)" }}
              />
            </Col>
          </Row>
        </Card>
      )}

      <Card variant="borderless" style={{ marginBottom: 12 }}>
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

      <div style={{ flex: 1, minHeight: 0 }}>
        <div
          ref={tableSectionRef}
          style={{ height: "100%", display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <Table
              columns={columns}
              dataSource={data}
              rowKey="id"
              loading={loading}
              pagination={false}
              bordered
              sticky
              scroll={{ y: tableBodyY, x: true }}
            />
          </div>

          <div ref={paginationRef} style={{ paddingTop: 12 }}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={total}
              showSizeChanger
              showTotal={(t) => `共 ${t} 条记录`}
              onChange={(page, pageSize) => {
                const next = { current: page, pageSize };
                setPagination(next);
                fetchLogs(page, pageSize);
              }}
              style={{ display: "flex", justifyContent: "flex-end" }}
            />
          </div>
        </div>
      </div>

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
