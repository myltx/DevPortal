import React, { useEffect, useState } from "react";
import { Modal, Radio, Space, Typography } from "antd";

interface PreferenceModalProps {
  open: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "account_default_view_preference";

const PreferenceModal: React.FC<PreferenceModalProps> = ({ open, onClose }) => {
  const [viewType, setViewType] = useState("text");

  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setViewType(saved);
      } else {
        setViewType("text");
      }
    }
  }, [open]);

  const handleOk = () => {
    localStorage.setItem(STORAGE_KEY, viewType);
    onClose();
  };

  return (
    <Modal
      title="个人偏好设置"
      open={open}
      onOk={handleOk}
      onCancel={onClose}
      width={400}
      okText="保存"
      cancelText="取消">
      <div style={{ padding: "20px 0" }}>
        <Space direction="vertical" size="large">
          <div>
            <Typography.Text strong>账号信息默认视图:</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Radio.Group
                value={viewType}
                onChange={(e) => setViewType(e.target.value)}>
                <Radio value="text">文本模式 (默认)</Radio>
                <Radio value="table">列表模式</Radio>
              </Radio.Group>
            </div>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              设置打开账号信息抽屉时默认展示的视图模式。
            </Typography.Text>
          </div>
        </Space>
      </div>
    </Modal>
  );
};

export default PreferenceModal;
