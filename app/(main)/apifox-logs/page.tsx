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
} from "antd";
import {
  SearchOutlined,
  SyncOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
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
      <Typography.Title level={4} style={{ marginBottom: 24 }}>
        Apifox 同步日志
      </Typography.Title>

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
                background: "#f5f5f5",
                padding: "12px",
                borderRadius: "4px",
                fontSize: "12px",
                marginTop: 8,
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
    </div>
  );
};

export default ApifoxLogsPage;
