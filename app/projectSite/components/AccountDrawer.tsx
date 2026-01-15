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
  Empty,
  Alert,
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
    const mId = moduleData?.id || moduleData?.moduleId;
    if (open && mId) {
      // Default reset
      setEditingKey("");

      // Load preference or default to "text"
      const savedTab = localStorage.getItem(STORAGE_KEY);
      setActiveTab(savedTab === "table" ? "table" : "text");

      fetchAccounts(mId);
    }
  }, [open, moduleData, fetchAccounts]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const handleAddAccount = () => {
    const mId = moduleData?.id || moduleData?.moduleId;
    if (!mId) return;
    setAccountList([
      {
        id: -1,
        account: "",
        password: "",
        moduleId: mId,
        isNew: true,
      },
      ...accountList,
    ]);
    setEditingKey("-1");
  };

  const handleSaveAccount = async (record: Account) => {
    const mId = moduleData?.id || moduleData?.moduleId;
    if (!mId) return;
    const payload = {
      id: record.id === -1 ? null : record.id,
      account: record.account,
      password: record.password,
      moduleId: mId,
    };
    const res = await API.addOrUpdateAccount(payload);
    if (res.success) {
      message.success("保存成功");
      setEditingKey("");
      fetchAccounts(mId);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    const mId = moduleData?.id || moduleData?.moduleId;
    if (!mId) return;
    const res = await API.deleteAccount([id]);
    if (res.success) {
      message.success("删除成功");
      fetchAccounts(mId);
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
              onConfirm={() => handleDeleteAccount(record.id)}
              okText="确定"
              cancelText="取消">
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
      footer={null}
      styles={{
        body: { padding: 0, overflow: "hidden" },
      }}>
      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        tabBarStyle={{ padding: "0 24px", margin: 0 }}
        items={[
          {
            key: "text",
            label: "文本",
            children: (
              <div
                style={{
                  height: "calc(100vh - 55px - 46px)", // Screen - DrawerHeader - TabsHeader
                  overflowY: "auto",
                  padding: "24px",
                }}>
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
              </div>
            ),
          },
          {
            key: "table",
            label: "列表",
            children: (
              <div
                style={{
                  height: "calc(100vh - 55px - 46px)",
                  overflowY: "auto",
                  padding: "24px",
                }}>
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
              </div>
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
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(val)
        .then(() => message.success("复制成功"))
        .catch(() => fallbackCopy(val));
    } else {
      fallbackCopy(val);
    }
  };

  const fallbackCopy = (val: string) => {
    const input = document.createElement("textarea");
    input.value = val;
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

  const renderCopyable = (val: string, key: string | number) => (
    <Tooltip title="点击复制" key={key}>
      <span
        onClick={() => handleCopy(val)}
        style={{
          fontWeight: 500,
          margin: "0 4px",
          color: "#1890ff",
          cursor: "pointer",
          textDecoration: "underline",
          textUnderlineOffset: 4,
          wordBreak: "break-all",
        }}>
        {val}
      </span>
    </Tooltip>
  );

  const renderLabel = (val: string, key: string | number) => (
    <span key={key} style={{ color: "var(--foreground)", opacity: 0.8 }}>
      {val}
    </span>
  );

  const renderLink = (url: string, key: string | number) => (
    <a
      key={key}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        margin: "0 4px",
        color: "#1890ff",
        textDecoration: "underline",
      }}>
      {url}
    </a>
  );

  // Heuristic to check if a segment is likely a label (not a credential)
  const isLabelLike = (segment: string) => {
    const trimmed = segment.trim();

    // 1. Contains Chinese -> Treat as Label (description/name), not copyable credential
    if (/[\u4e00-\u9fa5]/.test(trimmed)) return true;

    // 2. Is a known keyword (case insensitive)
    const keywords = [
      "account",
      "username",
      "password",
      "pass",
      "user",
      "账号",
      "帐号",
      "密码",
      "地址",
      "url",
      "link",
      "admin",
      "坐席",
      "备注",
      "desc",
      "服务商",
      "环境",
      "生产环境",
      "测试环境",
      "开发环境",
      "名称",
    ];
    // Exact match or ends with colon
    const clean = trimmed.replace(/[:：]$/, "").toLowerCase();

    if (keywords.includes(clean)) return true;

    // Check if it looks very much like a label e.g. "Label:"
    if (/^[^:：]+[:：]$/.test(trimmed)) return true;

    return false;
  };

  // Heuristic to check if a segment is a URL
  const isUrl = (segment: string) => {
    return /^https?:\/\//i.test(segment.trim());
  };

  return (
    <div>
      <Alert
        message="智能解析已启用"
        description="蓝色文字可点击复制，黑色文字为描述标签"
        type="info"
        showIcon
        style={{ marginBottom: 16, fontSize: 13 }}
        closable
      />
      {lines.map((line, lineIdx) => {
        let trimmedLine = line.trim();
        if (!trimmedLine) return <div key={lineIdx} style={{ height: 8 }} />;

        // Normalize separators
        trimmedLine = trimmedLine.replace(/[—–]/g, "-");

        // Strategy: Tokenize the line using a master regex
        // Captures: URLs, Tabs/DoubleSpaces, Hyphens (spaced or not), Slashes (spaced or not), Colons
        // We use capturing groups so split includes the separators.
        // Regex definitions:
        // 1. URL: https?://[^\s]+
        // 2. Tab/DoubleSpace: \t|\s{2,}
        // 3. Hyphen: \s*[-–—]\s* (Handles " - ", "-", " — ")
        // 4. Slash: \s*\/\s* (Handles " / ", "/")
        // 5. Colon: [:：]
        const masterRegex =
          /((?:https?:\/\/[^\s]+)|(?:[\t]|\s{2,}|\s*[-–—]\s*|\s*\/\s*|[:：]))/;

        const segments = trimmedLine.split(masterRegex);

        const tokens: { text: string; type: "text" | "separator" | "url" }[] =
          [];

        segments.forEach((seg: string) => {
          if (!seg) return; // Skip empty splits

          // Check if it's a separator or URL or text
          if (masterRegex.test(seg)) {
            // It matched the regex group
            if (isUrl(seg)) {
              tokens.push({ text: seg, type: "url" });
            } else {
              tokens.push({ text: seg, type: "separator" });
            }
          } else {
            // It's text content
            const trimSeg = seg.trim();
            if (trimSeg) {
              tokens.push({ text: trimSeg, type: "text" });
            }
          }
        });

        return (
          <div
            key={lineIdx}
            style={{
              marginBottom: 4,
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
            }}>
            {tokens.map((token, tIdx) => {
              if (token.type === "separator") {
                // For tight separators like "-" or "/", we might want less margin?
                // But sticking to a uniform look is safe.
                return (
                  <span
                    key={tIdx}
                    style={{
                      whiteSpace: "pre",
                      color: "#ccc",
                      margin: "0 2px",
                    }}>
                    {token.text}
                  </span>
                );
              }

              if (token.type === "url") {
                return [
                  renderLink(token.text, tIdx),
                  <CopyOutlined
                    key={`copy-${tIdx}`}
                    style={{
                      marginLeft: 4,
                      cursor: "pointer",
                      color: "#1890ff",
                    }}
                    onClick={() => handleCopy(token.text)}
                  />,
                ];
              }

              // Text
              const textPart = token.text;

              // Decide if Label or Value
              if (isLabelLike(textPart)) {
                return renderLabel(textPart, tIdx);
              } else {
                return renderCopyable(textPart, tIdx);
              }
            })}
          </div>
        );
      })}
    </div>
  );
};

export default AccountDrawer;
