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
  areaList: any[]; // Changed from string[] to any[] (Object list)
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
  const title = isEdit ? "编辑模块" : "新增模块";

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Try to resolve areaId if missing (for legacy data compatibility on frontend)
        let resolvedAreaId = initialData.areaId;
        if (!resolvedAreaId && initialData.areaName) {
          const found = areaList.find(
            (a: any) => a.name === initialData.areaName
          );
          if (found) resolvedAreaId = found.id;
        }

        form.setFieldsValue({
          ...initialData,
          areaId: resolvedAreaId, // Bind to ID
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
  }, [open, initialData, form, activeProjectId, areaList]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Resolve areaName from selected areaId for Dual Write requirement
      const selectedArea = areaList.find((a: any) => a.id === values.areaId);
      const resolvedAreaName = selectedArea ? selectedArea.name : "";

      const payload = {
        ...values,
        areaName: resolvedAreaName, // Explicitly send Name
        id: initialData?.moduleId,
      };

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
          name="areaId" // Changed to areaId
          label="所属区划"
          rules={[{ required: true, message: "请选择区划" }]}>
          <Select
            showSearch
            allowClear
            placeholder="请选择区划"
            optionFilterProp="children">
            {areaList.map((a: any) => (
              <Option key={a.id} value={a.id}>
                {a.name}
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
