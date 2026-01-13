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
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import * as API from "@/lib/api/project";

interface AreaManagerDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; // Trigger refresh of main page
}

const AreaManagerDrawer: React.FC<AreaManagerDrawerProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null); // null = add, obj = edit
  const [formName, setFormName] = useState("");
  const [formSort, setFormSort] = useState<number>(0);

  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await API.getAreaList();
      if (res.success) {
        setList(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchList();
    }
  }, [open]);

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormSort(item.sort);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormName("");
    setFormSort(0);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    const res = await API.deleteArea(id);
    if (res.success) {
      message.success("删除成功");
      fetchList();
      onSuccess();
    }
  };

  const handleModalOk = async () => {
    if (!formName.trim()) {
      message.error("请输入地区名称");
      return;
    }

    if (editingItem) {
      // Update
      const res = await API.updateArea(editingItem.id, formName, formSort);
      if (res.success) {
        message.success("更新成功");
        setIsModalOpen(false);
        fetchList();
        onSuccess();
      }
    } else {
      // Add
      const res = await API.addArea(formName, formSort);
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
        title="地区管理 (Area Management)"
        width={500}
        open={open}
        onClose={onClose}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            新增地区
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
                  title="确认删除此地区？"
                  description="删除后，相关项目将不再显示此地区标签。"
                  onConfirm={() => handleDelete(item.id)}>
                  <Button type="text" danger icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
              ]}>
              <List.Item.Meta
                title={<span>{item.name}</span>}
                description={<span>排序值: {item.sort}</span>}
              />
            </List.Item>
          )}
        />
      </Drawer>

      <Modal
        title={editingItem ? "编辑地区" : "新增地区"}
        open={isModalOpen}
        onOk={handleModalOk}
        onCancel={() => setIsModalOpen(false)}>
        <Space direction="vertical" style={{ width: "100%" }}>
          <div>
            <div style={{ marginBottom: 4 }}>名称:</div>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="请输入地区名称"
            />
          </div>
          <div>
            <div style={{ marginBottom: 4 }}>排序 (越小越靠前):</div>
            <InputNumber
              style={{ width: "100%" }}
              value={formSort}
              onChange={(val) => setFormSort(Number(val))}
            />
          </div>
        </Space>
      </Modal>
    </>
  );
};

export default AreaManagerDrawer;
