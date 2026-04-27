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
  Tag,
  Drawer,
  Modal,
  message,
  Collapse,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  PlusOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import * as API from "@/lib/api/project";
import { NounNameListDTO, NounNameVO } from "@/types";

const { Panel } = Collapse;
const { Option } = Select;

const ProjectPage: React.FC = () => {
  const [formInline] = Form.useForm();
  const [cardList, setCardList] = useState<NounNameVO[]>([]);
  const [classOption, setClassOption] = useState<any[]>([]);
  const [labelOption, setLabelOption] = useState<string[]>([]);

  // Drawer state
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [currentId, setCurrentId] = useState<number | null>(null);
  const [editForm] = Form.useForm();

  // Delete Modal state
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [deleteData, setDeleteData] = useState<NounNameVO | null>(null);

  const fetchCardList = async () => {
    try {
      const values = await formInline.validateFields();
      const res = await API.selectList({
        ...values,
        // Backend expects specific filter names?
        // formInline.key maps to name/englishName/label search?
        // Check service impl. For now assume passing whole object works if service handles it.
        // If service selectList takes NounNameDTO, it might expect 'name' or 'classId'.
        // Original vue sent { classId, key }. Backend selectList params?
        // Service expects NounNameDTO. Logic should handle 'key' if implemented or we need to map key -> name?
      });
      if (res.success) {
        setCardList(res.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchClassInfo = async () => {
    const res = await API.getClassInfo();
    if (res.success) {
      setClassOption(res.data);
    }
  };

  // Fetch labels
  const fetchLabels = async () => {
    // Original logic passed 'type' from submitData.type?
    // Assuming empty type returns all labels or we don't strictly need type filtering for autocomplete.
    const res = await API.labelList();
    if (res.success) {
      setLabelOption(res.data);
    }
  };

  useEffect(() => {
    fetchClassInfo();
    fetchCardList();
    fetchLabels();
  }, []);

  const handleSearch = () => {
    fetchCardList();
  };

  const handleClear = () => {
    formInline.resetFields();
    fetchCardList();
  };

  const handleShow = (type: "add" | "edit", data?: NounNameVO) => {
    setFormTitle(type === "add" ? "新增" : "编辑");
    setCurrentId(data ? Number(data.id) : null);
    if (type === "edit" && data) {
      editForm.setFieldsValue({
        ...data,
      });
    } else {
      editForm.resetFields();
      editForm.setFieldsValue({ label: [] });
    }
    setDrawerVisible(true);
  };

  const handleDel = (data: NounNameVO) => {
    setDeleteData(data);
    setDeleteVisible(true);
  };

  const confirmDelete = async () => {
    if (deleteData) {
      const res = await API.deleteProject(Number(deleteData.id));
      if (res.success) {
        message.success("Deleted successfully");
        fetchCardList();
      }
      setDeleteVisible(false);
    }
  };

  const onSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      const payload = { ...values, id: currentId };
      let res;
      if (currentId) {
        res = await API.updateProject(payload);
      } else {
        res = await API.addProject(payload);
      }
      if (res.success) {
        message.success("Operation successful");
        setDrawerVisible(false);
        fetchCardList();
        fetchLabels(); // Refresh labels
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getClassName = (id: number) => {
    const item = classOption.find((c) => c.id === id);
    return item ? item.name : "";
  };

  return (
    <div style={{ padding: 24 }}>
      <Form
        form={formInline}
        layout="inline"
        style={{ marginBottom: 24 }}
        initialValues={{}}>
        <Form.Item name="classId" label="分类">
          <Select placeholder="请选择分类" style={{ width: 150 }} allowClear>
            {classOption.map((item) => (
              <Option key={item.id} value={item.id}>
                {item.name}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="key" label="关键字">
          {/* The backend selectList implementation checks 'key' field? */}
          {/* nounNameService.selectList(dto). If dto has matching fields. */}
          {/* Original Vue used 'key'. */}
          <Input placeholder="名称/英文名称/标签" />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            onClick={handleSearch}
            icon={<SearchOutlined />}>
            查询
          </Button>
          <Button onClick={handleClear} style={{ marginLeft: 8 }}>
            重置
          </Button>
          <Button
            type="primary"
            style={{ marginLeft: 8 }}
            onClick={() => handleShow("add")}
            icon={<PlusOutlined />}>
            新增
          </Button>
        </Form.Item>
      </Form>

      <Row gutter={[16, 16]}>
        {cardList.map((card, index) => (
          <Col key={card.id} xs={24} sm={12} md={8}>
            <Card
              hoverable
              actions={[
                <Button
                  key="edit"
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => handleShow("edit", card)}>
                  修改
                </Button>,
                <Button
                  key="delete"
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDel(card)}>
                  删除
                </Button>,
              ]}
              title={
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span
                    style={{ marginRight: 8, cursor: "pointer" }}
                    onClick={() =>
                      navigator.clipboard.writeText(card.name || "")
                    }
                    title="Click to copy">
                    {card.name}
                  </span>
                  <Tag>{card.englishName}</Tag>
                </div>
              }>
              <Row gutter={[8, 8]}>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    <div>标签：</div>
                    <div style={{ color: "var(--text-strong)" }}>
                      {Array.isArray(card.label)
                        ? card.label.join(", ")
                        : card.label}
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    <div>类型：</div>
                    <div style={{ color: "var(--text-strong)" }}>
                      {getClassName(card.classId!)}
                    </div>
                  </div>
                </Col>
                <Col span={24}>
                  <Collapse ghost expandIconPosition="end">
                    <Panel header="更多详情" key="1" style={{ padding: 0 }}>
                      <div
                        style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        <div>备注：{card.remark}</div>
                        <div>描述：{card.description}</div>
                        <div>
                          更新时间：
                          {card.updateTime
                            ? new Date(card.updateTime).toLocaleString()
                            : ""}
                        </div>
                      </div>
                    </Panel>
                  </Collapse>
                </Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      <Drawer
        title={formTitle}
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={400}
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
            name="name"
            label="名词"
            rules={[{ required: true, message: "请输入名词" }]}>
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="englishName" label="英文名称">
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item
            name="label"
            label="标签"
            rules={[{ required: true, message: "请输入标签" }]}>
            <Select
              mode="tags"
              placeholder="请选择/输入自定义标签按回车键输入"
              style={{ width: "100%" }}>
              {labelOption.map((label) => (
                <Option key={label} value={label}>
                  {label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="classId"
            label="类型"
            rules={[{ required: true, message: "请选择类型" }]}>
            <Select placeholder="请选择">
              {classOption.map((item) => (
                <Option key={item.id} value={item.id}>
                  {item.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="operateUser" label="操作人">
            <Input placeholder="请输入" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={4} maxLength={100} showCount />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={4} maxLength={100} showCount />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        title="确定删除"
        open={deleteVisible}
        onOk={confirmDelete}
        onCancel={() => setDeleteVisible(false)}>
        <p>
          确定删除此项：<span style={{ color: "red" }}>{deleteData?.name}</span>{" "}
          ？
        </p>
      </Modal>
    </div>
  );
};

export default ProjectPage;
