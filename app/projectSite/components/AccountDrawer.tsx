import React, { useEffect, useState } from "react";
import {
  Drawer,
  Tabs,
  Button,
  Table,
  Space,
  Input,
  Popconfirm,
  message,
} from "antd";
import { CopyOutlined } from "@ant-design/icons";
import * as API from "@/lib/api/project";

interface AccountDrawerProps {
  open: boolean;
  onClose: () => void;
  moduleData: any; // The module we are viewing accounts for
}

const AccountDrawer: React.FC<AccountDrawerProps> = ({
  open,
  onClose,
  moduleData,
}) => {
  const [accountList, setAccountList] = useState<any[]>([]);
  const [editingKey, setEditingKey] = useState<string>("");
  const [activeTab, setActiveTab] = useState("text");

  const fetchAccounts = async (moduleId: number) => {
    const res = await API.accountList({ moduleId });
    if (res.success) {
      setAccountList(res.data);
    }
  };

  // Preference Key (Matches PreferenceModal)
  const STORAGE_KEY = "account_default_view_preference";

  useEffect(() => {
    if (open && moduleData?.moduleId) {
      // Default reset
      setEditingKey("");

      // Load preference or default to "text"
      // Explicitly Load from the "Preference" key, NOT updating it on change
      const savedTab = localStorage.getItem(STORAGE_KEY);
      setActiveTab(savedTab === "table" ? "table" : "text");

      fetchAccounts(moduleData.moduleId);
    }
  }, [open, moduleData]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    // DO NOT save to localStorage here. User wants explicit control.
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
      moduleId: moduleData.moduleId,
    };
    const res = await API.addOrUpdateAccount(payload);
    if (res.success) {
      message.success("保存成功");
      setEditingKey("");
      fetchAccounts(moduleData.moduleId);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    const res = await API.deleteAccount([id]);
    if (res.success) {
      message.success("删除成功");
      fetchAccounts(moduleData.moduleId);
    }
  };

  const handleCopy = (text: string) => {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => message.success("复制成功"))
        .catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  };

  const fallbackCopy = (text: string) => {
    const input = document.createElement("textarea");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand("copy");
      message.success("复制成功");
    } catch (err) {
      message.error("复制失败");
    }
    document.body.removeChild(input);
  };

  const columns = [
    {
      title: "账号",
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
                if (index > -1) {
                  newList[index] = {
                    ...newList[index],
                    account: e.target.value,
                  };
                  setAccountList(newList);
                }
              }}
            />
          );
        }
        return (
          <Space>
            {text}
            <CopyOutlined
              style={{ cursor: "pointer", color: "#1890ff" }}
              onClick={() => handleCopy(text)}
            />
          </Space>
        );
      },
    },
    {
      title: "密码",
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
                if (index > -1) {
                  newList[index] = {
                    ...newList[index],
                    password: e.target.value,
                  };
                  setAccountList(newList);
                }
              }}
            />
          );
        }
        return (
          <Space>
            {text}
            <CopyOutlined
              style={{ cursor: "pointer", color: "#1890ff" }}
              onClick={() => handleCopy(text)}
            />
          </Space>
        );
      },
    },
    {
      title: "操作",
      render: (_: any, record: any) => {
        const editable = editingKey === String(record.id);
        return editable ? (
          <Space>
            <a onClick={() => handleSaveAccount(record)}>保存</a>
            <a
              onClick={() => {
                setEditingKey("");
                if (record.isNew) {
                  setAccountList(accountList.filter((item) => item.id !== -1));
                }
              }}>
              取消
            </a>
          </Space>
        ) : (
          <Space>
            <a onClick={() => setEditingKey(String(record.id))}>编辑</a>
            <Popconfirm
              title="确认删除?"
              onConfirm={() => handleDeleteAccount(record.id)}>
              <a style={{ color: "red" }}>删除</a>
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  return (
    <Drawer
      title={`账号信息: ${moduleData?.moduleName || ""}`}
      width={800}
      open={open}
      onClose={onClose}
      footer={null}>
      <Tabs activeKey={activeTab} onChange={handleTabChange}>
        <Tabs.TabPane tab="文本" key="text">
          <div style={{ minHeight: "200px", whiteSpace: "pre-wrap" }}>
            {moduleData?.describe || (
              <div
                style={{
                  color: "#999",
                  textAlign: "center",
                  padding: "20px",
                }}>
                暂无账号信息
              </div>
            )}
          </div>
        </Tabs.TabPane>
        <Tabs.TabPane tab="列表" key="table">
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
        </Tabs.TabPane>
      </Tabs>
    </Drawer>
  );
};

export default AccountDrawer;
