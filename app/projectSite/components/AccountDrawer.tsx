import React, { useEffect, useState, useCallback } from "react";
import {
  Drawer,
  Tabs,
  Button,
  Table,
  Space,
  Input,
  Modal,
  Form,
  Radio,
  Checkbox,
  Tag,
  Popconfirm,
  message,
  Card,
  Tooltip,
  Alert,
} from "antd";
import { CopyOutlined } from "@ant-design/icons";
import * as API from "@/lib/api/project";
import { Account, ProjectModule } from "@/lib/types";
import { extractAccountsFromText } from "@/lib/moduleDescribeNormalizer";

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
  const ACCOUNT_INFO_EXAMPLES = [
    "服务商-测试服务中心",
    "服务商-生产环境",
    "乡镇民政-马桥街道",
    "EC后台-超级管理员-生产",
  ];
  const ACCOUNT_INFO_HINT =
    "推荐格式：用 “-” 分层，例如：服务商-系统/模块-角色/环境/地区。";

  const [accountList, setAccountList] = useState<Account[]>([]);
  const [editingKey, setEditingKey] = useState<string>("");
  const [activeTab, setActiveTab] = useState("table");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm] = Form.useForm();

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importSource, setImportSource] = useState<"current" | "paste">(
    "current",
  );
  const [importFilter, setImportFilter] = useState<
    "new" | "all" | "existing" | "duplicate" | "invalid"
  >("new");
  const [importAutoFillRemark, setImportAutoFillRemark] = useState(true);
  const [importLocalExistingKeys, setImportLocalExistingKeys] = useState<
    Set<string>
  >(new Set());
  const [splitModalOpen, setSplitModalOpen] = useState(false);
  const [splitTargetIndex, setSplitTargetIndex] = useState<number | null>(null);
  const [splitText, setSplitText] = useState("");
  const [splitInheritRemark, setSplitInheritRemark] = useState(true);
  const [splitInheritAccountInfo, setSplitInheritAccountInfo] = useState(false);
  const [importPasteText, setImportPasteText] = useState("");
  const [importBatchRemark, setImportBatchRemark] = useState("");
  const [importItems, setImportItems] = useState<
    Array<{
      account: string;
      password: string;
      accountInfo?: string;
      remark?: string;
    }>
  >([]);

  const fetchAccounts = useCallback(async (moduleId: number) => {
    const res = await API.accountList({ moduleId });
    if (res.success) {
      setAccountList(res.data);
    }
  }, []);

  // Preference Key (Matches PreferenceModal)
  const STORAGE_KEY = "account_default_view_preference";

  const moduleId = (moduleData?.id || moduleData?.moduleId) as
    | number
    | undefined;
  const moduleDescribeText = moduleData?.describe || "";

  const buildImportItemsFromText = (text: string) =>
    extractAccountsFromText(text).map((x) => ({
      account: x.account,
      password: x.password,
      accountInfo: x.accountInfo,
      remark: "",
    }));

  const existingKeySet = new Set(
    (accountList || []).map(
      (a) => `${String(a.account || "")}\u0000${String(a.password || "")}`,
    ),
  );

  const extractedFromCurrentText = extractAccountsFromText(moduleDescribeText);
  const importableFromCurrentTextCount = extractedFromCurrentText.filter(
    (x) => !existingKeySet.has(`${x.account}\u0000${x.password}`),
  ).length;
  const existingFromCurrentTextCount =
    extractedFromCurrentText.length - importableFromCurrentTextCount;

  const allExistingKeySet = new Set<string>([
    ...existingKeySet,
    ...Array.from(importLocalExistingKeys),
  ]);

  useEffect(() => {
    if (open && moduleId) {
      // Default reset
      setEditingKey("");

      // Load preference or default to "text"
      const savedTab = localStorage.getItem(STORAGE_KEY);
      setActiveTab(savedTab === "text" ? "text" : "table");

      fetchAccounts(moduleId);
    }
  }, [open, moduleId, fetchAccounts]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    localStorage.setItem(STORAGE_KEY, key);
  };

  const openAddModal = () => {
    if (!moduleId) return;
    addForm.resetFields();
    setAddModalOpen(true);
    setTimeout(() => addForm.getFieldInstance?.("account")?.focus?.(), 0);
  };

  const saveNewAccount = async (continueAdd: boolean) => {
    if (!moduleId) return;
    const values = await addForm.validateFields();
    const payload = {
      id: null,
      moduleId,
      account: values.account,
      password: values.password,
      accountInfo: values.accountInfo,
      remark: values.remark,
    };
    const res = await API.addOrUpdateAccount(payload);
    if (res.success) {
      message.success("保存成功");
      fetchAccounts(moduleId);
      if (continueAdd) {
        addForm.resetFields();
        setTimeout(() => addForm.getFieldInstance?.("account")?.focus?.(), 0);
      } else {
        setAddModalOpen(false);
      }
    }
  };

  const openImportModal = (source: "current" | "paste") => {
    if (!moduleId) return;
    setImportSource(source);
    setImportFilter("new");
    setImportAutoFillRemark(true);
    setImportLocalExistingKeys(new Set());
    if (!importBatchRemark) {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      setImportBatchRemark(`导入自文本 ${y}-${m}-${day}`);
    }

    if (source === "current") {
      setImportItems(buildImportItemsFromText(moduleDescribeText));
    } else {
      setImportItems([]);
    }
    setImportModalOpen(true);
  };

  const parseTextToImportItems = (text: string) => {
    const extracted = extractAccountsFromText(text);
    setImportItems(
      extracted.map((x) => ({
        account: x.account,
        password: x.password,
        accountInfo: x.accountInfo,
        remark: "",
      })),
    );
    const importableCount = extracted.filter(
      (x) => !allExistingKeySet.has(`${x.account}\u0000${x.password}`),
    ).length;
    message.success(
      `已解析 ${extracted.length} 条（可导入 ${importableCount} 条）`,
    );
  };

  const parsePasteText = () => {
    parseTextToImportItems(importPasteText);
  };

  const doBatchImport = async () => {
    if (!moduleId) return;
    const uniqKey = new Set<string>();
    const items = (importItems || [])
      .map((i) => ({
        account: String(i.account || "").trim(),
        password: String(i.password || "").trim(),
        accountInfo: i.accountInfo ? String(i.accountInfo).trim() : undefined,
        remark: (() => {
          const row = (i.remark || "").trim();
          if (row) return row;
          if (!importAutoFillRemark) return undefined;
          return importBatchRemark;
        })(),
      }))
      .filter((i) => i.account && i.password)
      .filter((i) => !allExistingKeySet.has(`${i.account}\u0000${i.password}`))
      .filter((i) => {
        const key = `${i.account}\u0000${i.password}`;
        if (uniqKey.has(key)) return false;
        uniqKey.add(key);
        return true;
      });

    if (items.length === 0) {
      message.info("没有可导入的数据");
      return;
    }

    const res = await API.batchImportAccount({
      moduleId,
      items,
    });
    if (res.success) {
      setImportLocalExistingKeys((prev) => {
        const next = new Set(prev);
        for (const i of items) {
          next.add(`${i.account}\u0000${i.password}`);
        }
        return next;
      });
      message.success(
        `导入完成：新增 ${res.data?.created ?? 0}，跳过已存在 ${res.data?.skippedExisting ?? 0}`,
      );
      setImportModalOpen(false);
      fetchAccounts(moduleId);
    }
  };

  const doImportOne = async (index: number) => {
    if (!moduleId) return;
    const item = importItems[index];
    if (!item) return;

    const account = String(item.account || "").trim();
    const password = String(item.password || "").trim();
    const accountInfo = item.accountInfo ? String(item.accountInfo).trim() : undefined;
    const remark = (() => {
      const row = String(item.remark || "").trim();
      if (row) return row;
      if (!importAutoFillRemark) return undefined;
      return importBatchRemark;
    })();

    if (!account || !password) {
      message.error("该条数据无效：账号/密码不能为空");
      return;
    }

    if (allExistingKeySet.has(`${account}\u0000${password}`)) {
      message.info("该账号已存在，无需导入");
      return;
    }

    const res = await API.batchImportAccount({
      moduleId,
      items: [{ account, password, accountInfo, remark }],
    });
    if (res.success) {
      setImportLocalExistingKeys((prev) => {
        const next = new Set(prev);
        next.add(`${account}\u0000${password}`);
        return next;
      });
      message.success(
        `已导入：新增 ${res.data?.created ?? 0}，跳过已存在 ${res.data?.skippedExisting ?? 0}`,
      );
      fetchAccounts(moduleId);
    }
  };

  const openSplitModal = (index: number) => {
    const origin = importItems[index];
    setSplitTargetIndex(index);
    const prefill = origin
      ? [origin.accountInfo, origin.account, origin.password]
          .map((v) => String(v || "").trim())
          .filter(Boolean)
          .join(" ")
      : "";
    setSplitText(prefill);
    setSplitInheritRemark(true);
    setSplitInheritAccountInfo(false);
    setSplitModalOpen(true);
  };

  const parseSplitText = (text: string) => {
    return extractAccountsFromText(text).map((x) => ({
      account: x.account,
      password: x.password,
      accountInfo: x.accountInfo,
      remark: "",
    }));
  };

  const confirmSplit = () => {
    const idx = splitTargetIndex;
    if (idx == null) return;
    const origin = importItems[idx];
    if (!origin) return;

    const extracted = parseSplitText(splitText);
    if (!extracted.length) {
      message.error("未识别到可拆分的账号/密码，请检查输入格式");
      return;
    }

    const originAccountInfo = String(origin.accountInfo || "").trim();
    const originRemark = String(origin.remark || "").trim();

    const nextItems = extracted.map((x) => {
      const nextAccountInfo = splitInheritAccountInfo
        ? originAccountInfo || x.accountInfo
        : x.accountInfo;
      const nextRemark = splitInheritRemark ? originRemark : "";
      return {
        account: x.account,
        password: x.password,
        accountInfo: nextAccountInfo,
        remark: nextRemark,
      };
    });

    setImportItems((prev) => {
      const next = [...(prev || [])];
      next.splice(idx, 1, ...nextItems);
      return next;
    });

    message.success(`已拆分为 ${nextItems.length} 条`);
    setSplitModalOpen(false);
  };

  const handleSaveAccount = async (record: Account) => {
    if (!moduleId) return;
    const payload = {
      id: record.id,
      account: record.account,
      password: record.password,
      accountInfo: record.accountInfo,
      remark: record.remark,
      moduleId,
    };
    const res = await API.addOrUpdateAccount(payload);
    if (res.success) {
      message.success("保存成功");
      setEditingKey("");
      fetchAccounts(moduleId);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!moduleId) return;
    const res = await API.deleteAccount([id]);
    if (res.success) {
      message.success("删除成功");
      fetchAccounts(moduleId);
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

  const renderEllipsisWithTooltip = (val?: string) => {
    const text = String(val || "").trim();
    if (!text) return <span>-</span>;
    return (
      <Tooltip title={text}>
        <span
          style={{
            display: "inline-block",
            maxWidth: 220,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            verticalAlign: "bottom",
          }}>
          {text}
        </span>
      </Tooltip>
    );
  };

  const renderCopyCell = (val?: string) => {
    const text = String(val || "").trim();
    if (!text) return <span>-</span>;
    return (
      <Tooltip title="点击复制">
        <span
          onClick={() => handleCopy(text)}
          style={{
            whiteSpace: "nowrap",
            cursor: "pointer",
            color: "#1890ff",
            textDecoration: "underline",
            textUnderlineOffset: 4,
          }}>
          {text}
        </span>
      </Tooltip>
    );
  };

  const columns = [
    {
      title: "账号描述",
      dataIndex: "accountInfo",
      ellipsis: true,
      width: 200,
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
                    accountInfo: e.target.value,
                  };
                  setAccountList(newList);
                }
              }}
              placeholder={`例如：${ACCOUNT_INFO_EXAMPLES[0]}`}
            />
          );
        }
        return renderEllipsisWithTooltip(text);
      },
    },
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
            {renderCopyCell(text)}
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
            {renderCopyCell(text)}
          </Space>
        );
      },
    },
    {
      title: "备注",
      dataIndex: "remark",
      ellipsis: true,
      width: 160,
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
                    remark: e.target.value,
                  };
                  setAccountList(newList);
                }
              }}
              placeholder="例如：导入自文本-2026-01-20"
            />
          );
        }
        return renderEllipsisWithTooltip(text);
      },
    },
    {
      title: "操作",
      width: 120,
      fixed: "right" as const,
      render: (_: any, record: Account) => {
        const editable = editingKey === String(record.id);
        return editable ? (
          <Space>
            <a onClick={() => handleSaveAccount(record)}>保存</a>
            <a
              onClick={() => {
                setEditingKey("");
                if (moduleId) fetchAccounts(moduleId);
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

  const updateImportItem = (
    index: number,
    patch: Partial<{
      account: string;
      password: string;
      accountInfo?: string;
      remark?: string;
    }>,
  ) => {
    setImportItems((prev) => {
      const next = [...(prev || [])];
      if (!next[index]) return prev;
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const removeImportItem = (index: number) => {
    setImportItems((prev) => (prev || []).filter((_, i) => i !== index));
  };

  const importItemKeyCounts = (() => {
    const counts = new Map<string, number>();
    for (const item of importItems) {
      const a = String(item.account || "").trim();
      const p = String(item.password || "").trim();
      if (!a || !p) continue;
      const key = `${a}\u0000${p}`;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
    return counts;
  })();

  const getImportItemStatus = (item: {
    account: string;
    password: string;
  }): { type: "invalid" | "existing" | "duplicate" | "new"; label: string } => {
    const a = String(item.account || "").trim();
    const p = String(item.password || "").trim();
    if (!a || !p) return { type: "invalid", label: "无效" };
    const key = `${a}\u0000${p}`;
    if (allExistingKeySet.has(key)) return { type: "existing", label: "已存在" };
    if ((importItemKeyCounts.get(key) || 0) > 1)
      return { type: "duplicate", label: "重复" };
    return { type: "new", label: "将导入" };
  };

  const importWillImportCount = (() => {
    const uniq = new Set<string>();
    let count = 0;
    for (const item of importItems) {
      const status = getImportItemStatus(item);
      if (status.type !== "new") continue;
      const key = `${String(item.account).trim()}\u0000${String(
        item.password,
      ).trim()}`;
      if (uniq.has(key)) continue;
      uniq.add(key);
      count += 1;
    }
    return count;
  })();

  const importExistingCount = importItems.filter(
    (x) => getImportItemStatus(x).type === "existing",
  ).length;
  const importInvalidCount = importItems.filter(
    (x) => getImportItemStatus(x).type === "invalid",
  ).length;
  const importDuplicateCount = importItems.filter(
    (x) => getImportItemStatus(x).type === "duplicate",
  ).length;

  const importTableAllDataSource = importItems.map((item, idx) => ({
    ...item,
    _idx: idx,
  }));

  const importTableDataSource = importTableAllDataSource.filter((record: any) => {
    if (importFilter === "all") return true;
    return getImportItemStatus(record).type === importFilter;
  });

  const importVisibleCount = importTableDataSource.length;

  const importColumns = [
    {
      title: "状态",
      width: 90,
      render: (_: any, record: any) => {
        const status = getImportItemStatus(record);
        const color =
          status.type === "new"
            ? "blue"
            : status.type === "existing"
              ? "green"
              : status.type === "duplicate"
                ? "orange"
                : "red";
        return <Tag color={color}>{status.label}</Tag>;
      },
    },
    {
      title: "账号描述",
      dataIndex: "accountInfo",
      render: (val: string, record: any) => (
        <Input
          value={val}
          onChange={(e) =>
            updateImportItem(record._idx, { accountInfo: e.target.value })
          }
          placeholder={`例如：${ACCOUNT_INFO_EXAMPLES[0]}`}
        />
      ),
    },
    {
      title: "账号",
      dataIndex: "account",
      render: (val: string, record: any) => (
        <Input
          value={val}
          onChange={(e) => updateImportItem(record._idx, { account: e.target.value })}
        />
      ),
    },
    {
      title: "密码",
      dataIndex: "password",
      render: (val: string, record: any) => (
        <Input
          value={val}
          onChange={(e) => updateImportItem(record._idx, { password: e.target.value })}
        />
      ),
    },
    {
      title: "备注",
      dataIndex: "remark",
      render: (val: string, record: any) => (
        <Input
          value={val}
          onChange={(e) => updateImportItem(record._idx, { remark: e.target.value })}
          placeholder={importBatchRemark || "批次备注"}
        />
      ),
    },
    {
      title: "操作",
      width: 140,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            disabled={getImportItemStatus(record).type !== "new"}
            onClick={() => doImportOne(record._idx)}>
            导入
          </Button>
          <Button type="link" onClick={() => openSplitModal(record._idx)}>
            拆分
          </Button>
          <Button
            type="link"
            danger
            onClick={() => removeImportItem(record._idx)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Drawer
      title={`账号信息: ${moduleData?.moduleName || ""}`}
      size="large"
      width="92vw"
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
                  {moduleDescribeText && extractedFromCurrentText.length ? (
                    <Alert
                      type="info"
                      showIcon
                      style={{ marginBottom: 16 }}
                      message={`检测到文本中可识别 ${extractedFromCurrentText.length} 条账号（可导入 ${importableFromCurrentTextCount} 条）`}
                      action={
                        <Space>
                          <Button size="small" onClick={() => openImportModal("paste")}>
                            粘贴覆盖
                          </Button>
                          <Button
                            size="small"
                            type="primary"
                            disabled={importableFromCurrentTextCount === 0}
                            onClick={() => openImportModal("current")}>
                            去导入
                          </Button>
                        </Space>
                      }
                    />
                  ) : null}

                  <Space style={{ marginBottom: 16 }} wrap>
                    <Button type="primary" onClick={openAddModal}>
                      新增账号
                    </Button>
                    <Button onClick={() => openImportModal("current")}>
                      批量导入
                    </Button>
                  </Space>
                  <Table
                    dataSource={accountList}
                    columns={columns}
                    rowKey="id"
                    scroll={{ x: "max-content" }}
                    tableLayout="fixed"
                    pagination={false}
                  />
                </Card>
              </div>
            ),
          },
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
                {moduleDescribeText ? (
                  <>
                    <Card
                      className="project-card"
                      styles={{ body: { padding: "12px" } }}
                      style={{ marginBottom: 16 }}>
                      <Space
                        wrap
                        style={{
                          width: "100%",
                          justifyContent: "space-between",
                        }}>
                        <Space wrap>
                          <Tag color="blue">识别 {extractedFromCurrentText.length} 条</Tag>
                          <Tag color="green">已存在 {existingFromCurrentTextCount} 条</Tag>
                          <Tag color="orange">可导入 {importableFromCurrentTextCount} 条</Tag>
                          <span style={{ color: "#999" }}>
                            仅用于提示/导入，不会修改原文
                          </span>
                        </Space>
                        <Space wrap>
                          <Button onClick={() => openImportModal("paste")}>
                            粘贴覆盖导入
                          </Button>
                          <Button
                            type="primary"
                            disabled={importableFromCurrentTextCount === 0}
                            onClick={() => openImportModal("current")}>
                            从当前文本导入
                          </Button>
                        </Space>
                      </Space>
                      <div style={{ marginTop: 12, color: "#999" }}>
                        {extractedFromCurrentText.length ? (
                          <>
                            已从文本中识别出可能的账号/密码条目；如需预览/编辑请点击
                            “从当前文本导入”，在导入弹窗中处理。
                          </>
                        ) : (
                          <>未识别到可用的账号/密码结构（仍可保留原文手动维护账号列表）。</>
                        )}
                      </div>
                    </Card>

                    <div style={{ minHeight: "200px", whiteSpace: "pre-wrap" }}>
                      <SmartTextDisplay text={moduleDescribeText} />
                    </div>
                  </>
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
        ]}
      />

      <Modal
        title="新增账号"
        open={addModalOpen}
        onCancel={() => setAddModalOpen(false)}
        destroyOnClose
        footer={
          <Space>
            <Button onClick={() => setAddModalOpen(false)}>取消</Button>
            <Button type="primary" onClick={() => saveNewAccount(false)}>
              保存
            </Button>
            <Button type="primary" onClick={() => saveNewAccount(true)}>
              保存并继续新增
            </Button>
          </Space>
        }>
        <Form form={addForm} layout="vertical">
          <Form.Item
            label={
              <Space size={6}>
                <span>账号描述</span>
                <Tooltip
                  title={
                    <div>
                      <div>{ACCOUNT_INFO_HINT}</div>
                      <div style={{ marginTop: 6 }}>
                        示例：{ACCOUNT_INFO_EXAMPLES.join("、")}
                      </div>
                    </div>
                  }>
                  <span style={{ color: "#999", cursor: "help" }}>?</span>
                </Tooltip>
              </Space>
            }
            name="accountInfo"
            extra={<span style={{ color: "#999" }}>{ACCOUNT_INFO_HINT}</span>}>
            <Input placeholder={`例如：${ACCOUNT_INFO_EXAMPLES.join(" / ")}`} />
          </Form.Item>
          <Form.Item
            label="账号"
            name="account"
            rules={[{ required: true, message: "请输入账号" }]}>
            <Input placeholder="例如：ecAdmin" />
          </Form.Item>
          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: "请输入密码" }]}>
            <Input placeholder="例如：qwerty@123456" />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input placeholder="例如：导入自日报系统 / 导入自文本-2026-01-20" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="批量导入账号"
        open={importModalOpen}
        onCancel={() => setImportModalOpen(false)}
        width={980}
        destroyOnClose
        footer={
          <Space>
            <Button onClick={() => setImportModalOpen(false)}>取消</Button>
            <Button
              type="primary"
              disabled={importWillImportCount === 0}
              onClick={doBatchImport}>
              确认导入（将新增 {importWillImportCount} 条）
            </Button>
          </Space>
        }>
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          <Space wrap>
            <span style={{ color: "#666" }}>输入方式：</span>
            <Radio.Group
              value={importSource}
              onChange={(e) => {
                const next = e.target.value as "current" | "paste";
                setImportSource(next);
                if (next === "current") {
                  setImportItems(buildImportItemsFromText(moduleDescribeText));
                } else {
                  setImportItems([]);
                }
              }}
              options={[
                { label: "从当前文本自动带入", value: "current" },
                { label: "手动粘贴覆盖", value: "paste" },
              ]}
              optionType="button"
              buttonStyle="solid"
            />
              <Button
                onClick={() => setImportItems(buildImportItemsFromText(moduleDescribeText))}
                disabled={!moduleDescribeText}>
                重新带入当前文本
              </Button>
          </Space>

          <Alert
            type="info"
            showIcon
            message="导入策略说明"
            description={
              <div style={{ color: "#666" }}>
                仅会新增账号记录，不会覆盖已存在账号的任何字段；已存在的条目会自动标记为“已存在”并跳过导入。
              </div>
            }
          />

          <Alert
            type="info"
            showIcon
            message="账号描述（accountInfo）推荐写法"
            description={
              <div style={{ color: "#666" }}>
                {ACCOUNT_INFO_HINT}
                <div style={{ marginTop: 6 }}>
                  示例：{ACCOUNT_INFO_EXAMPLES.join("、")}
                </div>
              </div>
            }
          />

          {importSource === "paste" ? (
            <Card size="small" styles={{ body: { padding: 12 } }}>
              <Space direction="vertical" style={{ width: "100%" }} size={8}>
                <Input.TextArea
                  value={importPasteText}
                  onChange={(e) => setImportPasteText(e.target.value)}
                  rows={6}
                  placeholder="把账号文本粘贴到这里，然后点击“解析粘贴内容”"
                />
                <Space wrap>
                  <Button type="primary" onClick={parsePasteText}>
                    解析粘贴内容
                  </Button>
                  <Button
                    onClick={() => {
                      setImportPasteText(moduleDescribeText);
                      parseTextToImportItems(moduleDescribeText);
                    }}
                    disabled={!moduleDescribeText}>
                    用当前文本覆盖并解析
                  </Button>
                </Space>
              </Space>
            </Card>
          ) : null}

          <Space wrap>
            <span style={{ color: "#666" }}>批次备注（默认写入 remark，可逐行覆盖）：</span>
            <Input
              value={importBatchRemark}
              onChange={(e) => setImportBatchRemark(e.target.value)}
              style={{ width: 320 }}
              placeholder="例如：导入自文本 2026-01-20"
            />
            <Checkbox
              checked={importAutoFillRemark}
              onChange={(e) => setImportAutoFillRemark(e.target.checked)}>
              备注为空时自动填入批次备注
            </Checkbox>
            <span style={{ color: "#666" }}>筛选：</span>
            <Radio.Group
              value={importFilter}
              onChange={(e) => setImportFilter(e.target.value)}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: "将导入", value: "new" },
                { label: "全部", value: "all" },
                { label: "已存在", value: "existing" },
                { label: "重复", value: "duplicate" },
                { label: "无效", value: "invalid" },
              ]}
            />
            <Tag color="blue">总计 {importItems.length}</Tag>
            <Tag color="green">已存在 {importExistingCount}</Tag>
            <Tag color="orange">重复 {importDuplicateCount}</Tag>
            <Tag color="red">无效 {importInvalidCount}</Tag>
            <Tag color="default">当前显示 {importVisibleCount}</Tag>
          </Space>

          <Table
            size="small"
            rowKey={(r: any) => `${r._idx}`}
            dataSource={importTableDataSource}
            columns={importColumns as any}
            pagination={{ pageSize: 8, showSizeChanger: false }}
          />
        </Space>
      </Modal>

      <Modal
        title="拆分为多条账号"
        open={splitModalOpen}
        onCancel={() => setSplitModalOpen(false)}
        onOk={confirmSplit}
        okText="确认拆分"
        cancelText="取消"
        width={760}
        destroyOnClose>
        <Space direction="vertical" style={{ width: "100%" }} size={12}>
          {splitTargetIndex != null && importItems[splitTargetIndex] ? (
            <Alert
              type="info"
              showIcon
              message="当前要拆分的条目"
              description={
                <div style={{ wordBreak: "break-all" }}>
                  <div>
                    <span style={{ color: "#666" }}>账号描述：</span>
                    {String(importItems[splitTargetIndex].accountInfo || "").trim() ||
                      "-"}
                  </div>
                  <div>
                    <span style={{ color: "#666" }}>账号：</span>
                    {String(importItems[splitTargetIndex].account || "").trim() ||
                      "-"}
                  </div>
                  <div>
                    <span style={{ color: "#666" }}>密码：</span>
                    {String(importItems[splitTargetIndex].password || "").trim() ||
                      "-"}
                  </div>
                  <div>
                    <span style={{ color: "#666" }}>备注：</span>
                    {String(importItems[splitTargetIndex].remark || "").trim() ||
                      "-"}
                  </div>
                  <div style={{ marginTop: 8, color: "#999" }}>
                    已自动把上面这条的完整内容带入到下方输入框，你可以直接在下方编辑并换行拆分。
                  </div>
                </div>
              }
            />
          ) : null}

          <Input.TextArea
            value={splitText}
            onChange={(e) => setSplitText(e.target.value)}
            rows={8}
            placeholder={[
              "把多条账号/密码粘贴到这里，支持：",
              "1) 账号 密码（空格或 Tab 分隔）",
              "2) 账号/密码",
              "3) 两行一组：账号\\n密码",
              "",
              "示例：",
              "ecAdmin qwerty@123456",
              "guest/123456",
            ].join("\n")}
          />

          <Alert
            type="warning"
            showIcon
            message="推荐格式（更容易拆分正确）"
            description={
              <div>
                <div style={{ marginBottom: 8, color: "#666" }}>
                  建议使用 “账号描述: 账号-密码” 的方式（用冒号把描述与账号密码分隔开），账号描述建议按 “-” 分层，例如：
                </div>
                <pre
                  style={{
                    margin: 0,
                    padding: 12,
                    background: "#fafafa",
                    border: "1px solid rgba(0,0,0,0.06)",
                    borderRadius: 6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}>
{`服务商-测试服务中心: 13391902603-Ecare@133919
服务商-生产环境: 13391902608-&Flfit)2@ry1`}
                </pre>
                <div style={{ marginTop: 8 }}>
                  <Button
                    size="small"
                    onClick={() =>
                      setSplitText(`服务商-测试服务中心: 13391902603-Ecare@133919
服务商-生产环境: 13391902608-&Flfit)2@ry1`)
                    }>
                    一键填入示例
                  </Button>
                </div>
              </div>
            }
          />

          <Space wrap>
            <Checkbox
              checked={splitInheritRemark}
              onChange={(e) => setSplitInheritRemark(e.target.checked)}>
              拆分后继承原行备注（remark）
            </Checkbox>
            <Checkbox
              checked={splitInheritAccountInfo}
              onChange={(e) => setSplitInheritAccountInfo(e.target.checked)}>
              拆分后继承原行账号描述（accountInfo）
            </Checkbox>
          </Space>

          <div style={{ color: "#999" }}>
            拆分后的条目仍会按“将导入/已存在/重复/无效”规则标记，你可以在弹窗里继续编辑后再导入。
          </div>
        </Space>
      </Modal>
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
