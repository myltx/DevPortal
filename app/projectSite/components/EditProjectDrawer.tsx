import React, { useEffect, useState } from "react";
import { Drawer, Form, Input, Select, Button, message } from "antd";
import * as API from "@/lib/api/project";

const { Option } = Select;

interface EditProjectDrawerProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any; // If null, it's add mode
  projectIdOptions: any[];
  areaList: string[];
  envOption: any[];
  activeProjectId?: string; // Pre-fill for add mode
}

const EditProjectDrawer: React.FC<EditProjectDrawerProps> = ({
  open,
  onClose,
  onSuccess,
  initialData,
  projectIdOptions,
  areaList,
  envOption,
  activeProjectId,
}) => {
  const [form] = Form.useForm();
  const isEdit = !!initialData;
  const title = isEdit ? "编辑" : "新增";

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.setFieldsValue({
          ...initialData,
          areaName: initialData.areaName ? initialData.areaName.split(",") : [],
          moduleDescribe: initialData.describe,
        });
      } else {
        form.resetFields();
        form.setFieldValue(
          "projectId",
          activeProjectId ? Number(activeProjectId) : undefined
        );
      }
    }
  }, [open, initialData, form, activeProjectId]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, id: initialData?.moduleId };

      let res;
      if (isEdit) {
        res = await API.editProject(payload);
      } else {
        res = await API.createProject(payload);
      }

      if (res.success) {
        message.success("Success");
        onSuccess();
        onClose();
      }
    } catch (error) {
      // Form validation failed
    }
  };

  return (
    <Drawer
      title={title}
      width={500}
      open={open}
      onClose={onClose}
      footer={
        <div style={{ textAlign: "right" }}>
          <Button onClick={onClose} style={{ marginRight: 8 }}>
            取消
          </Button>
          <Button type="primary" onClick={handleSubmit}>
            确定
          </Button>
        </div>
      }>
      <Form form={form} layout="vertical">
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
  );
};

export default EditProjectDrawer;
