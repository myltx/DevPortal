import React, { useEffect, useState } from "react";
import { Drawer, Form, Input, Select, Button, message, Modal, Space, Typography } from "antd";
import * as API from "@/lib/api/project";
import { normalizeModuleDescribeConservative } from "@/lib/moduleDescribeNormalizer";

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
  const [normalizeModalOpen, setNormalizeModalOpen] = useState(false);
  const [normalizePreview, setNormalizePreview] = useState<{
    mode: "submit" | "format";
    original: string;
    normalized: string;
    values?: any;
  } | null>(null);
  const [normalizeEdited, setNormalizeEdited] = useState("");

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

  useEffect(() => {
    if (normalizeModalOpen && normalizePreview) {
      setNormalizeEdited(normalizePreview.normalized || "");
    }
  }, [normalizeModalOpen, normalizePreview]);

  const submitPayload = async (values: any) => {
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
      message.success("保存成功");
      onSuccess();
      onClose();
    }
  };

  const maybePromptNormalize = (values: any, mode: "submit" | "format") => {
    const original = String(values?.moduleDescribe ?? "");
    const { normalized, changed } = normalizeModuleDescribeConservative(original);
    if (!changed) {
      if (mode === "format") {
        message.info("当前内容已无需格式化");
        return;
      }
      void submitPayload(values);
      return;
    }

    setNormalizePreview({ mode, original, normalized, values });
    setNormalizeModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      maybePromptNormalize(values, "submit");
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
        <Form.Item
          name="moduleDescribe"
          label="账号信息(描述)"
          extra={
            <Space direction="vertical" size={4}>
              <span>建议格式：标题/说明 - 账号 - 密码。系统会在提交时提示你是否需要格式化。</span>
              <Button
                size="small"
                onClick={() => {
                  const current = form.getFieldValue("moduleDescribe");
                  maybePromptNormalize({ moduleDescribe: current }, "format");
                }}>
                一键智能格式化（预览后应用）
              </Button>
            </Space>
          }>
          <Input.TextArea
            rows={4}
            placeholder="例如：测试环境 - admin - 123456"
          />
        </Form.Item>
      </Form>

      <Modal
        title={normalizePreview?.mode === "submit" ? "提交前请确认账号信息格式" : "智能格式化预览"}
        open={normalizeModalOpen}
        onCancel={() => {
          setNormalizeModalOpen(false);
          setNormalizePreview(null);
        }}
        width={900}
        footer={
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              onClick={() => {
                setNormalizeModalOpen(false);
                setNormalizePreview(null);
              }}>
              返回编辑
            </Button>
            {normalizePreview?.mode === "submit" && (
              <Button
                danger
                onClick={() => {
                  const values = normalizePreview?.values;
                  setNormalizeModalOpen(false);
                  setNormalizePreview(null);
                  message.warning("已按原文提交（如需更规范，建议先执行一键智能格式化）");
                  if (values) void submitPayload(values);
                }}>
                继续原文提交
              </Button>
            )}
            <Button
              type="primary"
              onClick={() => {
                const normalized = normalizeEdited ?? "";
                const values = normalizePreview?.values ?? {};
                form.setFieldValue("moduleDescribe", normalized);
                setNormalizeModalOpen(false);
                setNormalizePreview(null);

                if (normalizePreview?.mode === "submit") {
                  void submitPayload({ ...values, moduleDescribe: normalized });
                } else {
                  message.success("已应用格式化内容");
                }
              }}>
              {normalizePreview?.mode === "submit" ? "应用格式化并提交" : "应用格式化"}
            </Button>
          </Space>
        }>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
          系统根据常见分隔符/标签尝试把账号信息整理为更统一的格式，便于后续复制与插件识别。若不满意可返回继续编辑。
        </Typography.Paragraph>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Typography.Text strong>原文</Typography.Text>
            <Input.TextArea value={normalizePreview?.original ?? ""} readOnly rows={14} style={{ marginTop: 6 }} />
          </div>
          <div style={{ flex: 1 }}>
            <Typography.Text strong>格式化后（可编辑）</Typography.Text>
            <Input.TextArea
              value={normalizeEdited}
              onChange={(e) => setNormalizeEdited(e.target.value)}
              rows={14}
              style={{ marginTop: 6 }}
            />
          </div>
        </div>
      </Modal>
    </Drawer>
  );
};

export default EditProjectDrawer;
