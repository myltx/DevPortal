"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Row,
  Col,
  Tabs,
  Menu,
  Avatar,
  Tooltip,
  Drawer,
  Popconfirm,
  List,
  Modal,
  Table,
  Space,
  App,
  message,
} from "antd";
import {
  SearchOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  LinkOutlined,
} from "@ant-design/icons";
import * as API from "@/lib/api/project";
import { useSearchParams } from "next/navigation";

const { Option } = Select;

const WebNavContent: React.FC = () => {
  const searchParams = useSearchParams();
  const classIdParam = searchParams.get("id"); // from query id

  const [formInline] = Form.useForm();
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [projectIdOptions, setProjectIdOptions] = useState<any[]>([]);
  const [cardList, setCardList] = useState<any[]>([]);
  const [selectedAreaIndex, setSelectedAreaIndex] = useState("0");
  const [envOption] = useState([
    { label: "测试环境", value: "test", color: "#409EFF" },
    { label: "生产环境", value: "prod", color: "#67C23A" },
    { label: "开发环境", value: "dev", color: "#E6A23C" },
    { label: "灰度环境", value: "gray", color: "#909399" },
    { label: "演示环境", value: "demo", color: "#F56C6C" },
  ]);
  const [areaList, setAreaList] = useState<string[]>([]);

  // Drawer
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [editForm] = Form.useForm();
  const [currentModule, setCurrentModule] = useState<any>(null);

  // Account Modal
  const [accountModalVisible, setAccountModalVisible] = useState(false);
  const [currentAccountModule, setCurrentAccountModule] = useState<any>(null);
  const [accountList, setAccountList] = useState<any[]>([]);
  const [editingKey, setEditingKey] = useState<string>("");

  useEffect(() => {
    fetchProjectNames();
    fetchAreaList();
  }, [classIdParam]);

  const fetchProjectNames = async () => {
    const res = await API.getProjectNameList(
      classIdParam ? Number(classIdParam) : undefined
    );
    if (res.success && res.data && res.data.length > 0) {
      setProjectIdOptions(res.data);
      if (!activeProjectId) {
        setActiveProjectId(String(res.data[0].id));
      }
    }
  };

  const fetchAreaList = async () => {
    const res = await API.getAreaList();
    if (res.success) {
      setAreaList(res.data);
    }
  };

  const fetchProjectList = async () => {
    if (!activeProjectId) return;
    const values = await formInline.validateFields();
    const payload = {
      ...values,
      projectId: Number(activeProjectId),
      classId: classIdParam ? Number(classIdParam) : undefined,
    };
    const res = await API.projectList(payload);
    if (res.success) {
      // Sort logic from vue
      const list = res.data
        .map((item: any, index: number) => ({
          ...item,
          sort: item.areaName === "其他" ? res.data.length : index,
        }))
        .sort((a: any, b: any) => a.sort - b.sort);
      setCardList(list);
    }
  };

  useEffect(() => {
    fetchProjectList();
  }, [activeProjectId]);

  const handleSearch = () => {
    fetchProjectList();
  };

  const handleShow = (type: "add" | "edit", data?: any) => {
    setFormTitle(type === "add" ? "新增" : "编辑");
    setCurrentModule(data);
    setDrawerVisible(true);
    if (type === "edit" && data) {
      editForm.setFieldsValue(data);
    } else {
      editForm.resetFields();
      editForm.setFieldValue(
        "projectId",
        activeProjectId ? Number(activeProjectId) : undefined
      );
    }
  };

  const onSubmit = async () => {
    const values = await editForm.validateFields();
    const payload = { ...values, id: currentModule?.id };
    // Map 'moduleDescribe'
    let res;
    if (currentModule?.id) {
      res = await API.editProject(payload);
    } else {
      res = await API.createProject(payload);
    }
    if (res.success) {
      message.success("Success");
      setDrawerVisible(false);
      fetchProjectList();
    }
  };

  const handleDelete = async (id: number) => {
    const res = await API.removeProject(id);
    if (res.success) {
      message.success("Deleted");
      fetchProjectList();
    }
  };

  // Account Logic
  const handleShowAccount = async (moduleData: any) => {
    setCurrentAccountModule(moduleData);
    setAccountModalVisible(true);
    fetchAccounts(moduleData.id);
  };

  const fetchAccounts = async (moduleId: number) => {
    const res = await API.accountList({ moduleId });
    if (res.success) {
      setAccountList(res.data);
    }
  };

  const handleAddAccount = () => {
    setAccountList([
      { id: -1, account: "", password: "", isNew: true },
      ...accountList,
    ]);
    setEditingKey("-1");
  };

  const handleSaveAccount = async (record: any) => {
    const payload = {
      id: record.id === -1 ? null : record.id,
      account: record.account,
      password: record.password,
      moduleId: currentAccountModule.id,
    };
    const res = await API.addOrUpdateAccount(payload);
    if (res.success) {
      message.success("Saved");
      setEditingKey("");
      fetchAccounts(currentAccountModule.id);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    const res = await API.deleteAccount([id]);
    if (res.success) {
      message.success("Deleted");
      fetchAccounts(currentAccountModule.id);
    }
  };

  const columns = [
    {
      title: "Account",
      dataIndex: "account",
      render: (text: string, record: any) => {
        if (editingKey === String(record.id)) {
          return (
            <Input
              value={text}
              onChange={(e) => {
                const newList = [...accountList];
                const index = newList.findIndex(
                  (item) => item.id === record.id
                );
                newList[index].account = e.target.value;
                setAccountList(newList);
              }}
            />
          );
        }
        return (
          <Space>
            {text}
            <CopyOutlined onClick={() => navigator.clipboard.writeText(text)} />
          </Space>
        );
      },
    },
    {
      title: "Password",
      dataIndex: "password",
      render: (text: string, record: any) => {
        if (editingKey === String(record.id)) {
          return (
            <Input
              value={text}
              onChange={(e) => {
                const newList = [...accountList];
                const index = newList.findIndex(
                  (item) => item.id === record.id
                );
                newList[index].password = e.target.value;
                setAccountList(newList);
              }}
            />
          );
        }
        return (
          <Space>
            {text}
            <CopyOutlined onClick={() => navigator.clipboard.writeText(text)} />
          </Space>
        );
      },
    },
    {
      title: "Action",
      render: (_: any, record: any) => {
        const editable = editingKey === String(record.id);
        return editable ? (
          <Space>
            <a onClick={() => handleSaveAccount(record)}>Save</a>
            <a
              onClick={() => {
                setEditingKey("");
                if (record.isNew) {
                  setAccountList(accountList.filter((item) => item.id !== -1));
                }
              }}>
              Cancel
            </a>
          </Space>
        ) : (
          <Space>
            <a onClick={() => setEditingKey(String(record.id))}>Edit</a>
            <Popconfirm
              title="Delete?"
              onConfirm={() => handleDeleteAccount(record.id)}>
              <a style={{ color: "red" }}>Delete</a>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: 24, height: "100%" }}>
      <Form form={formInline} layout="inline" style={{ marginBottom: 16 }}>
        <Form.Item name="typeName" label="环境">
          <Select style={{ width: 120 }} allowClear placeholder="请选择">
            {envOption.map((env) => (
              <Option key={env.value} value={env.value}>
                {env.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="moduleName" label="模块名称">
          <Input placeholder="模块名称" />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            onClick={handleSearch}
            icon={<SearchOutlined />}>
            查询
          </Button>
          <Button
            onClick={() => formInline.resetFields()}
            style={{ marginLeft: 8 }}>
            重置
          </Button>
          <Button
            type="primary"
            style={{ marginLeft: 8, background: "#67C23A" }}
            icon={<PlusOutlined />}
            onClick={() => handleShow("add")}>
            新增
          </Button>
        </Form.Item>
      </Form>

      {/* Color Legend */}
      <div style={{ display: "flex", marginBottom: 16 }}>
        {envOption.map((env) => (
          <div
            key={env.value}
            style={{ display: "flex", alignItems: "center", marginRight: 16 }}>
            <div
              style={{
                width: 16,
                height: 16,
                background: env.color,
                marginRight: 8,
                borderRadius: 2,
              }}></div>
            <span>{env.label}</span>
          </div>
        ))}
      </div>

      <Tabs
        activeKey={activeProjectId}
        onChange={setActiveProjectId}
        items={projectIdOptions.map((p) => ({
          label: p.projectName,
          key: String(p.id),
        }))}
      />

      <div style={{ display: "flex", height: "calc(100vh - 250px)" }}>
        {cardList.length > 0 && (
          <Menu
            mode="inline"
            selectedKeys={[selectedAreaIndex]}
            onClick={(e) => setSelectedAreaIndex(e.key)}
            style={{ width: 200, height: "100%", overflowY: "auto" }}
            items={cardList.map((area, index) => ({
              label: area.areaName || "其他",
              key: String(index),
            }))}
          />
        )}

        <div style={{ flex: 1, padding: "0 16px", overflowY: "auto" }}>
          <Row gutter={[16, 16]}>
            {cardList[Number(selectedAreaIndex)]?.list?.map((card: any) => {
              const envColor =
                envOption.find((e) => e.value === card.typeName)?.color ||
                "#909399";
              return (
                <Col span={6} key={card.id}>
                  <Card
                    hoverable
                    style={{ borderTop: `4px solid ${envColor}` }}
                    actions={[
                      <InfoCircleOutlined
                        key="info"
                        onClick={() => handleShowAccount(card)}
                      />,
                      <EditOutlined
                        key="edit"
                        onClick={() => handleShow("edit", card)}
                      />,
                      <Popconfirm
                        title="Delete?"
                        onConfirm={() => handleDelete(card.id)}>
                        <DeleteOutlined key="delete" style={{ color: "red" }} />
                      </Popconfirm>,
                    ]}>
                    <Card.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: envColor }}>
                          {card.typeName?.charAt(0).toUpperCase()}
                        </Avatar>
                      }
                      title={
                        <Tooltip title={card.moduleName}>
                          {card.moduleName}
                        </Tooltip>
                      }
                      description={
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}>
                          <a
                            href={card.moduleUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              maxWidth: "80%",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}>
                            跳转
                          </a>
                          <CopyOutlined
                            onClick={() =>
                              navigator.clipboard.writeText(card.moduleUrl)
                            }
                          />
                        </div>
                      }
                    />
                  </Card>
                </Col>
              );
            })}
          </Row>
        </div>
      </div>

      <Drawer
        title={formTitle}
        width={500}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        footer={
          <div style={{ textAlign: "right" }}>
            <Button
              onClick={() => setDrawerVisible(false)}
              style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" onClick={onSubmit}>
              确定
            </Button>
          </div>
        }>
        <Form form={editForm} layout="vertical">
          <Form.Item
            name="moduleName"
            label="模块名称"
            rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="projectId"
            label="所属项目"
            rules={[{ required: true }]}>
            <Select>
              {projectIdOptions.map((p) => (
                <Option key={p.id} value={p.id}>
                  {p.projectName}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="areaName"
            label="所属区划"
            rules={[{ required: true }]}>
            <Select showSearch allowClear mode="tags">
              {areaList.map((a) => (
                <Option key={a} value={a}>
                  {a}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="moduleUrl"
            label="访问地址"
            rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="typeName"
            label="所属环境"
            rules={[{ required: true }]}>
            <Select>
              {envOption.map((e) => (
                <Option key={e.value} value={e.value}>
                  {e.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea />
          </Form.Item>
          <Form.Item name="moduleDescribe" label="账号信息(描述)">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title={`账号信息: ${currentAccountModule?.moduleName}`}
        open={accountModalVisible}
        onCancel={() => setAccountModalVisible(false)}
        footer={null}
        width={800}>
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" onClick={handleAddAccount}>
            新增账号
          </Button>
        </div>
        <Table
          dataSource={accountList}
          columns={columns}
          rowKey="id"
          pagination={false}
        />
      </Modal>
    </div>
  );
};

const WebNavPage = () => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <WebNavContent />
    </React.Suspense>
  );
};

export default WebNavPage;
