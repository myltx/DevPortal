import React, { useEffect, useState, useCallback } from "react";
import {
  Drawer,
  Tabs,
  Button,
  Table,
  Space,
  Input,
  Popconfirm,
  message,
  Card,
  Tooltip,
} from "antd";
import { CopyOutlined } from "@ant-design/icons";
import * as API from "@/lib/api/project";
import { Account, ProjectModule } from "@/lib/types";

interface AccountDrawerProps {
  open: boolean;
  onClose: () => void;
  moduleData: ProjectModule | null; // The module we are viewing accounts for
}

const AccountDrawer: React.FC<AccountDrawerProps> = ({
  open,
  onClose,
  moduleData,
}) => {
  const [accountList, setAccountList] = useState<Account[]>([]);
  const [editingKey, setEditingKey] = useState<string>("");
  const [activeTab, setActiveTab] = useState("text");

  const fetchAccounts = useCallback(async (moduleId: number) => {
    const res = await API.accountList({ moduleId });
    if (res.success) {
      setAccountList(res.data);
    }
  }, []);

  // Preference Key (Matches PreferenceModal)
  const STORAGE_KEY = "account_default_view_preference";

  useEffect(() => {
    if (open && moduleData?.id) {
      // Default reset
      setEditingKey("");

      // Load preference or default to "text"
      const savedTab = localStorage.getItem(STORAGE_KEY);
      setActiveTab(savedTab === "table" ? "table" : "text");

      fetchAccounts(moduleData.id);
    }
  }, [open, moduleData, fetchAccounts]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const handleAddAccount = () => {
    if (!moduleData?.id) return;
    setAccountList([
      {
        id: -1,
        account: "",
        password: "",
        moduleId: moduleData.id,
        isNew: true,
      },
      ...accountList,
    ]);
    setEditingKey("-1");
  };

  const handleSaveAccount = async (record: Account) => {
    if (!moduleData?.id) return;
    const payload = {
      id: record.id === -1 ? null : record.id,
      account: record.account,
      password: record.password,
      moduleId: moduleData.id,
    };
    const res = await API.addOrUpdateAccount(payload);
    if (res.success) {
      message.success("保存成功");
      setEditingKey("");
      fetchAccounts(moduleData.id);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!moduleData?.id) return;
    const res = await API.deleteAccount([id]);
    if (res.success) {
      message.success("删除成功");
      fetchAccounts(moduleData.id);
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
      render: (text: string, record: Account) => {
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
            <span>{text}</span>
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
      render: (text: string, record: Account) => {
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
            <span>{text}</span>
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
      render: (_: any, record: Account) => {
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
      size="large"
      open={open}
      onClose={onClose}
      footer={null}>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: "text",
            label: "文本",
            children: (
              <div style={{ minHeight: "200px", whiteSpace: "pre-wrap" }}>
                {moduleData?.describe ? (
                  <SmartTextDisplay text={moduleData.describe} />
                ) : (
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
            ),
          },
          {
            key: "table",
            label: "列表",
            children: (
              <Card
                className="project-card"
                styles={{ body: { padding: "16px" } }}>
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
              </Card>
            ),
          },
        ]}
      />
    </Drawer>
  );
};

const SmartTextDisplay: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;

  const lines = text.split(/\r?\n/);

  const handleCopy = (val: string) => {
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(val)
        .then(() => message.success("复制成功"));
    } else {
      const input = document.createElement("textarea");
      input.value = val;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      message.success("复制成功");
    }
  };

  const renderCopyable = (val: string) => (
    <Tooltip title="点击复制">
      <span
        onClick={() => handleCopy(val)}
        style={{
          fontWeight: 500,
          margin: "0 4px",
          color: "#1890ff",
          cursor: "pointer",
          textDecoration: "underline",
          textUnderlineOffset: 4,
        }}>
        {val}
      </span>
    </Tooltip>
  );

  return (
    <div>
      {lines.map((line, idx) => {
        // Pattern 1: "Label: Val1 - Val2" or "Label: Val1 / Val2"
        // e.g. "街道账号：清波街道 - Qwer@123456"
        // e.g. "市级账号：hangzhou/Qwer@123456"
        const matchDouble = line.match(
          /^(\s*.*?[:：])\s*(.*?)(\s+-\s+|\/)(.*)$/
        );

        if (matchDouble) {
          const prefix = matchDouble[1];
          const part1 = matchDouble[2];
          const separator = matchDouble[3];
          const part2 = matchDouble[4];

          // Filter out false positives: if parts look like normal sentences (too long or spaces), skip?
          // For now, assume user intent is specific structure.
          return (
            <div key={idx} style={{ marginBottom: 4 }}>
              <span>{prefix}</span>
              {renderCopyable(part1.trim())}
              <span style={{ margin: "0 4px", color: "#ccc" }}>
                {separator.trim()}
              </span>
              {renderCopyable(part2.trim())}
            </div>
          );
        }

        // Pattern 2: "Val1 - Val2" or "Val1/Val2" (No Label)
        // e.g. "admin - anlan@123AL"
        // e.g. "aladmin/anlan@123AL"
        // e.g. "provinceAdmin/Qwer@123456"
        // Be careful not to match simple dates like 2023/01/01 or text "A - B"
        // We require parts to be somewhat "credential-like" (no spaces usually, or short)
        // Let's relax for now based on user request.
        // Pattern 2: "Val1 - Val2" or "Val1/Val2" (No Label)
        // e.g. "admin - anlan@123AL" WITH leading spaces
        const matchSplit = line.match(/^\s*(\S+)(\s+-\s+|\/)(\S+)\s*$/);
        if (matchSplit) {
          const part1 = matchSplit[1];
          const separator = matchSplit[2];
          const part2 = matchSplit[3];
          return (
            <div key={idx} style={{ marginBottom: 4 }}>
              {renderCopyable(part1.trim())}
              <span style={{ margin: "0 4px", color: "#ccc" }}>
                {separator.trim()}
              </span>
              {renderCopyable(part2.trim())}
            </div>
          );
        }

        // Pattern 3: Standard "Key: Value" (Fallback)
        const matchClassic = line.match(
          /^(\s*(?:账号|密码|Account|Pass(?:word)?|User(?:name)?)\s*[:：])\s*(.*)$/i
        );
        if (matchClassic) {
          const prefix = matchClassic[1];
          const value = matchClassic[2];
          if (value.trim()) {
            return (
              <div key={idx} style={{ marginBottom: 4 }}>
                <span>{prefix}</span>
                {renderCopyable(value.trim())}
              </div>
            );
          }
        }

        // Plain text
        return (
          <div key={idx} style={{ marginBottom: 4 }}>
            {line}
          </div>
        );
      })}
    </div>
  );
};

export default AccountDrawer;
