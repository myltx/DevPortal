import React, { useEffect, useState } from "react";
import {
  Drawer,
  List,
  Button,
  Input,
  Space,
  Popconfirm,
  message,
  Modal,
  InputNumber,
  Select,
  Tag,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import * as API from "@/lib/api/project";

interface ProjectManagerDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; // Trigger refresh
  classInfoList: any[]; // To select Industry
  activeClassId: string;
}

const ProjectManagerDrawer: React.FC<ProjectManagerDrawerProps> = ({
  open,
  onClose,
  onSuccess,
  classInfoList,
  activeClassId,
}) => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null); // null = add, obj = edit

  const [formName, setFormName] = useState("");
  const [formSort, setFormSort] = useState<number>(0);
  const [formClassId, setFormClassId] = useState<number | null>(null);
  const [formDescribe, setFormDescribe] = useState("");

  const fetchList = async () => {
    setLoading(true);
    try {
      // Fetch ALL projects for management? Or just current class?
      // Usually management might want to see all or filter.
      // Existing getProjectNameList filters by classId.
      // Let's default to current activeClassId for viewing, but maybe allow switching?
      // For simplicity, let's fetch for activeClassId first.
      if (activeClassId) {
        const res = await API.getProjectNameList(Number(activeClassId));
        if (res.success) {
          setList(res.data);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      if (activeClassId) setFormClassId(Number(activeClassId));
      fetchList();
    }
  }, [open, activeClassId]);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormName(item.projectName);
    setFormSort(item.sort);
    setFormClassId(item.classId);
    setFormDescribe(item.projectDescribe || "");
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormSort(0);
    // Default to currently viewing class
    setFormClassId(activeClassId ? Number(activeClassId) : null);
    setFormDescribe("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const res = await API.deleteProjectTab(id);
    if (res.success) {
      message.success("删除成功");
      fetchList();
      onSuccess();
    }
  };

  const handleModalOk = async () => {
    if (!formName.trim()) {
      message.error("请输入项目(页签)名称");
      return;
    }
    if (!formClassId) {
      message.error("请选择所属行业");
      return;
    }

    if (editingItem) {
      // Update
      const res = await API.updateProjectTab(
        editingItem.id,
        formName,
        formSort,
        formDescribe
      );
      if (res.success) {
        message.success("更新成功");
        setIsModalOpen(false);
        fetchList();
        onSuccess();
      }
    } else {
      // Add
      const res = await API.addProjectTab(
        formName,
        formClassId,
        formSort,
        formDescribe
      );
      if (res.success) {
        message.success("添加成功");
        setIsModalOpen(false);
        fetchList();
        onSuccess();
      }
    }
  };

  return (
    <>
      <Drawer
        title="项目(页签)管理"
        width={600}
        open={open}
        onClose={onClose}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增页签
          </Button>
        }>
        <List
          loading={loading}
          dataSource={list}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="edit"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => handleEdit(item)}>
                  编辑
                </Button>,
                <Popconfirm
                  key="del"
                  title="确认删除？"
                  description="删除前请确保该项目下没有业务模块。"
                  onConfirm={() => handleDelete(item.id)}>
                  <Button type="text" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
              ]}>
              <List.Item.Meta
                title={
                  <Space>
                    <Tag color="blue">
                      {classInfoList.find((c) => c.id === item.classId)?.name}
                    </Tag>
                    <span>{item.projectName}</span>
                  </Space>
                }
                description={
                  <Space direction="vertical" size={0}>
                    <span>排序: {item.sort}</span>
                    {item.projectDescribe && (
                      <span style={{ fontSize: 12, opacity: 0.6 }}>
                        {item.projectDescribe}
                      </span>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>

      <Modal
        title={editingItem ? "编辑页签" : "新增页签"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}>
        <Space direction="vertical" style={{ width: "100%" }} size="middle">
          <div>
            <div style={{ marginBottom: 4 }}>页签名称:</div>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="请输入名称 (如: CRM系统)"
            />
          </div>

          <div>
            <div style={{ marginBottom: 4 }}>所属行业:</div>
            <Select
              style={{ width: "100%" }}
              value={formClassId}
              onChange={setFormClassId}
              disabled={!!editingItem} // Disable changing industry on edit for simplicity (or allow if needed)
            >
              {classInfoList.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.name}
                </Select.Option>
              ))}
            </Select>
          </div>

          <div>
            <div style={{ marginBottom: 4 }}>排序 (越小越靠前):</div>
            <InputNumber
              style={{ width: "100%" }}
              value={formSort}
              onChange={(val) => setFormSort(Number(val))}
            />
          </div>

          <div>
            <div style={{ marginBottom: 4 }}>描述/备注:</div>
            <Input.TextArea
              value={formDescribe}
              onChange={(e) => setFormDescribe(e.target.value)}
              rows={3}
            />
          </div>
        </Space>
      </Modal>
    </>
  );
};

export default ProjectManagerDrawer;
