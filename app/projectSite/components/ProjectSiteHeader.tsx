import React from "react";
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
} from "@ant-design/icons";
import { useRouter } from "next/navigation";

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
              (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }>
            <AppstoreOutlined style={{ fontSize: "16px", color: "#666" }} />
          </div>
        </Tooltip>

        <span style={{ color: "rgba(0,0,0,0.25)", fontSize: 14 }}>/</span>

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
              color: "#000",
              padding: "2px 6px",
              borderRadius: "4px",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }>
            {classInfoList.find((c) => String(c.id) === String(activeClassId))
              ?.name || "当前行业"}
            <CaretDownOutlined
              style={{ fontSize: "10px", color: "rgba(0,0,0,0.45)" }}
            />
          </span>
        </Dropdown>
      </div>

      <Divider type="vertical" style={{ height: 24, margin: 0 }} />

      {/* Filter Form Part */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <Form form={form} layout="inline" style={{ alignItems: "center" }}>
          <Form.Item
            name="typeName"
            style={{ marginBottom: 0, marginRight: 16 }}>
            <Select
              style={{ width: 100 }}
              allowClear
              placeholder="环境"
              size="small">
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
              placeholder="模块名称"
              size="small"
              prefix={<SearchOutlined style={{ color: "rgba(0,0,0,0.25)" }} />}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              onClick={onSearch}
              size="small"
              icon={<SearchOutlined />}>
              查询
            </Button>
            <Button onClick={onReset} style={{ marginLeft: 8 }} size="small">
              重置
            </Button>
            <Button
              type="primary"
              style={{ marginLeft: 8, background: "#67C23A" }}
              icon={<PlusOutlined />}
              onClick={onAdd}
              size="small">
              新增
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default ProjectSiteHeader;
