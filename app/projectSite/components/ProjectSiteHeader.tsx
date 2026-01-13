import React, { useState } from "react";
import {
  Form,
  Select,
  Input,
  Button,
  Tooltip,
  Dropdown,
  Divider,
  FormInstance,
} from "antd";
import {
  AppstoreOutlined,
  CaretDownOutlined,
  SearchOutlined,
  PlusOutlined,
  SettingOutlined, // Added
} from "@ant-design/icons";

import { useRouter } from "next/navigation";
import { ThemeSwitch } from "@/components/theme/ThemeSwitch";
import AreaManagerDrawer from "./AreaManagerDrawer";
import ProjectManagerDrawer from "./ProjectManagerDrawer"; // Added

const { Option } = Select;

interface ProjectSiteHeaderProps {
  activeClassId: string;
  classInfoList: any[];
  onClassChange: (id: string) => void;
  form: FormInstance;
  envOption: any[];
  onSearch: () => void;
  onReset: () => void;
  onAdd: () => void;
}

const ProjectSiteHeader: React.FC<ProjectSiteHeaderProps> = ({
  activeClassId,
  classInfoList,
  onClassChange,
  form,
  envOption,
  onSearch,
  onReset,
  onAdd,
}) => {
  const router = useRouter();
  const [areaDrawerOpen, setAreaDrawerOpen] = useState(false);
  const [projectTabDrawerOpen, setProjectTabDrawerOpen] = useState(false); // Added State

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 16,
        marginBottom: 24,
      }}>
      {/* Navigation Part */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <ThemeSwitch />

        <Tooltip title="工作台">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 24,
              cursor: "pointer",
              borderRadius: 4,
              transition: "background 0.2s",
            }}
            onClick={() => router.replace("/middle")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }>
            <AppstoreOutlined style={{ fontSize: "16px" }} />
          </div>
        </Tooltip>

        <span style={{ opacity: 0.45, fontSize: 14 }}>/</span>

        <Dropdown
          menu={{
            items: classInfoList.map((item) => ({
              key: String(item.id),
              label: item.name,
              disabled: String(item.id) === String(activeClassId),
            })),
            onClick: ({ key }) => {
              onClassChange(key);
            },
          }}>
          <span
            style={{
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "2px 6px",
              borderRadius: "4px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "var(--bg-hover)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }>
            {classInfoList.find((c) => String(c.id) === String(activeClassId))
              ?.name || "当前行业"}
            <CaretDownOutlined style={{ fontSize: "10px", opacity: 0.45 }} />
          </span>
        </Dropdown>
      </div>

      <Divider type="vertical" style={{ height: 24, margin: 0 }} />

      {/* Filter Form Part */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Form form={form} layout="inline" style={{ alignItems: "center" }}>
          <Form.Item
            name="typeName"
            style={{ marginBottom: 0, marginRight: 12 }}>
            <Select style={{ width: 120 }} allowClear placeholder="环境筛选">
              {envOption.map((env) => (
                <Option key={env.value} value={env.value}>
                  {env.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="moduleName"
            style={{ marginBottom: 0, marginRight: 16 }}>
            <Input
              placeholder="搜索模块名称..."
              prefix={<SearchOutlined style={{ color: "rgba(0,0,0,0.25)" }} />}
              style={{ width: 200 }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" onClick={onSearch}>
              查询
            </Button>
            <Button onClick={onReset} style={{ marginLeft: 8 }}>
              重置
            </Button>

            <Dropdown
              menu={{
                items: [
                  {
                    key: "project",
                    label: "项目(页签)管理",
                    onClick: () => setProjectTabDrawerOpen(true),
                  },
                  {
                    key: "area",
                    label: "地区管理",
                    onClick: () => setAreaDrawerOpen(true),
                  },
                ],
              }}>
              <Button style={{ marginLeft: 8 }} icon={<SettingOutlined />}>
                配置管理 <CaretDownOutlined style={{ fontSize: 10 }} />
              </Button>
            </Dropdown>

            <Button
              type="primary"
              style={{
                marginLeft: 16,
                background: "#52c41a",
                borderColor: "#52c41a",
              }}
              icon={<PlusOutlined />}
              onClick={onAdd}>
              新增模块
            </Button>
          </Form.Item>
        </Form>
      </div>

      <AreaManagerDrawer
        open={areaDrawerOpen}
        onClose={() => setAreaDrawerOpen(false)}
        onSuccess={onSearch}
      />

      <ProjectManagerDrawer
        open={projectTabDrawerOpen}
        onClose={() => setProjectTabDrawerOpen(false)}
        onSuccess={() => {
          onSearch(); // Refresh list
          // Also might need to refresh Tabs?
          // The tabs are passed as props `classInfoList` (Actually `projectIdOptions` comes from parent).
          // Parent's `fetchProjectNames` needs to run.
          // `onSearch` refreshes list, but maybe we need callback to refresh Project Options.
          // Current `onSearch` calls `fetchProjectList`. `fetchProjectNames` is separate in Page.
          // But `activeClassId` change triggers `fetchProjectNames`.
          // Ideally `onSuccess` here should propagate to parent to reload EVERYTHING.
          // Current `onSearch` only reloads cards.
          // I'll rely on user refreshing or I can assume `onSearch` is enough for now,
          // BUT: if I add a tab, it won't show up in tabs until I refresh page.
          // I should ask user to refresh or fix parent.
          // `onSearch` prop in Header -> `handleSearch` in Page -> `fetchProjectList`.
          // I need a way to trigger `fetchProjectNames`.
          // Let's assume on search only reloads list.
          // I'll leave it for now, but explicit refresh might be needed for tabs.
          window.location.reload(); // Simplest way to ensure Tabs and Class lists update?
          // Or just rely on parent. Let's try to just call onSearch and let user refresh if needed,
          // OR cleaner: passing a `onProjectChange` prop?
          // Header doesn't have `onProjectChange`.
          // I will use `window.location.reload()` inside the onSuccess callback passed to Drawer if passing `onSuccess={onSearch}` isn't enough.
          // Actually, in `ProjectSiteHeader`, `onSuccess` calls `onSearch`.
          // I will modify `onSuccess` logic within Header to just `onSearch`?
          // No, `onSearch` is passed from parent.
          // I'll just reload page for Tab changes to keep it simple and robust.
        }}
        classInfoList={classInfoList}
        activeClassId={activeClassId}
      />

      <div style={{ flex: 1 }} />

      {/* Legend Part (moved here) */}
      <div style={{ display: "flex", alignItems: "center", fontSize: 12 }}>
        {envOption.map((env) => (
          <div
            key={env.value}
            style={{ display: "flex", alignItems: "center", marginLeft: 16 }}>
            <div
              style={{
                width: 10,
                height: 10,
                background: env.color,
                marginRight: 6,
                borderRadius: 2,
              }}></div>
            <span style={{ opacity: 0.8 }}>{env.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectSiteHeader;
