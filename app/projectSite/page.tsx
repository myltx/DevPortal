"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Form,
  Row,
  Col,
  Tabs,
  Menu,
  Avatar,
  Tooltip,
  Popconfirm,
  message,
  Spin,
  Empty,
  Tag,
  Button,
  Dropdown,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CopyOutlined,
  MoreOutlined,
  GlobalOutlined,
} from "@ant-design/icons";

import * as API from "@/lib/api/project";
import ProjectSiteHeader from "./components/ProjectSiteHeader";
import EditProjectDrawer from "./components/EditProjectDrawer";
import AccountDrawer from "./components/AccountDrawer";

const ProjectSiteContent: React.FC = () => {
  const [formInline] = Form.useForm();

  // State
  const [activeClassId, setActiveClassId] = useState<string>("");
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Data State
  const [projectIdOptions, setProjectIdOptions] = useState<any[]>([]);
  const [cardList, setCardList] = useState<any[]>([]);
  const [selectedAreaIndex, setSelectedAreaIndex] = useState("0");
  const [areaList, setAreaList] = useState<string[]>([]);
  const [classInfoList, setClassInfoList] = useState<any[]>([]);

  // Constant Options
  const [envOption] = useState([
    { label: "测试环境", value: "test", color: "#409EFF" },
    { label: "生产环境", value: "prod", color: "#67C23A" },
    { label: "开发环境", value: "dev", color: "#E6A23C" },
    { label: "灰度环境", value: "gray", color: "#909399" },
    { label: "演示环境", value: "demo", color: "#F56C6C" },
  ]);

  // Drawer States
  const [projectDrawerVisible, setProjectDrawerVisible] = useState(false);
  const [currentModule, setCurrentModule] = useState<any>(null); // For Edit Project

  const [accountDrawerVisible, setAccountDrawerVisible] = useState(false);
  const [currentAccountModule, setCurrentAccountModule] = useState<any>(null); // For Account Drawer

  // --- Fetch Logic ---

  const fetchProjectNames = async (classId?: string) => {
    const idToUse = classId || activeClassId;
    if (!idToUse) return;

    const res = await API.getProjectNameList(Number(idToUse));
    if (res.success && res.data && res.data.length > 0) {
      setProjectIdOptions(res.data);
      // Always reset active project when class changes
      setActiveProjectId(String(res.data[0].id));
    } else {
      setProjectIdOptions([]);
      setActiveProjectId("");
      setCardList([]);
    }
  };

  const fetchAreaList = async () => {
    const res = await API.getAreaList();
    if (res.success) {
      setAreaList(res.data);
    }
  };

  const fetchClassInfoList = async () => {
    const res = await API.getClassInfo();
    if (res.success) {
      setClassInfoList(res.data);
      if (!activeClassId && res.data.length > 0) {
        setActiveClassId(String(res.data[0].id));
      }
    }
  };

  const fetchProjectList = async () => {
    if (!activeProjectId) {
      setCardList([]);
      return;
    }

    setLoading(true);
    try {
      const values = await formInline.validateFields();
      const payload = {
        ...values,
        projectId: Number(activeProjectId),
        classId: activeClassId ? Number(activeClassId) : undefined,
      };
      const res = await API.projectList(payload);
      if (res.success) {
        const list = res.data
          .map((item: any, index: number) => {
            // Sort inner list by environment (case-insensitive)
            const sortedList = [...(item.list || [])].sort((a: any, b: any) => {
              const envOrder: Record<string, number> = {
                prod: 1,
                gray: 2,
                test: 3,
                dev: 4,
                demo: 5,
              };
              const typeA = String(a.typeName || "").toLowerCase();
              const typeB = String(b.typeName || "").toLowerCase();
              const orderA = envOrder[typeA] || 99;
              const orderB = envOrder[typeB] || 99;
              return orderA - orderB;
            });

            return {
              ...item,
              list: sortedList,
              sort: item.areaName === "其他" ? res.data.length : index,
            };
          })
          .sort((a: any, b: any) => a.sort - b.sort);
        setCardList(list);
      } else {
        setCardList([]);
      }
    } catch (e) {
      console.error(e);
      setCardList([]);
    } finally {
      setLoading(false);
    }
  };

  // --- Effects ---

  useEffect(() => {
    fetchAreaList();
    fetchClassInfoList();
  }, []);

  useEffect(() => {
    if (activeClassId) {
      fetchProjectNames(activeClassId);
    }
  }, [activeClassId]);

  useEffect(() => {
    fetchProjectList();
  }, [activeProjectId]);

  // --- Handlers ---

  const handleSearch = () => {
    fetchProjectList();
  };

  const handleReset = () => {
    formInline.resetFields();
    fetchProjectList();
  };

  const handleShowProjectDrawer = (data?: any) => {
    setCurrentModule(data || null);
    setProjectDrawerVisible(true);
  };

  const handleShowAccountDrawer = (moduleData: any) => {
    setCurrentAccountModule(moduleData);
    setAccountDrawerVisible(true);
  };

  const handleDeleteProject = async (id: number) => {
    const res = await API.removeProject(id);
    if (res.success) {
      message.success("Deleted");
      fetchProjectList();
    }
  };

  const handleCopyUrl = (text: string) => {
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

  return (
    <div
      style={{
        padding: 24,
        minHeight: "100vh",
        background: "var(--background)",
        color: "var(--foreground)",
      }}>
      {/* 1. Header & Filter */}
      <ProjectSiteHeader
        activeClassId={activeClassId}
        classInfoList={classInfoList}
        onClassChange={setActiveClassId}
        form={formInline}
        envOption={envOption}
        onSearch={handleSearch}
        onReset={handleReset}
        onAdd={() => handleShowProjectDrawer(null)}
      />

      {/* 3. Project Tabs */}
      <Tabs
        activeKey={activeProjectId}
        onChange={setActiveProjectId}
        items={projectIdOptions.map((p) => ({
          label: p.projectName,
          key: String(p.id),
        }))}
      />

      {/* 4. Main Content (Menu + Grid) */}
      <div style={{ display: "flex", height: "calc(100vh - 250px)" }}>
        {cardList.length > 0 && (
          <Menu
            mode="inline"
            selectedKeys={[selectedAreaIndex]}
            onClick={(e) => setSelectedAreaIndex(e.key)}
            style={{
              width: 200,
              height: "100%",
              overflowY: "auto",
              background: "transparent",
              borderRight: "none", // Optional: remove border for cleaner look
            }}
            items={cardList.map((area, index) => ({
              label: area.areaName || "其他",
              key: String(index),
            }))}
          />
        )}

        <div style={{ flex: 1, padding: "0 16px", overflowY: "auto" }}>
          <Spin spinning={loading} tip="加载中...">
            {!loading && cardList.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无项目数据"
                style={{ marginTop: 100 }}
              />
            ) : (
              <Row gutter={[16, 16]}>
                {cardList[Number(selectedAreaIndex)]?.list?.map((card: any) => {
                  const envColor =
                    envOption.find((e) => e.value === card.typeName)?.color ||
                    "#909399";

                  const menuItems = [
                    {
                      key: "edit",
                      label: "编辑项目",
                      icon: <EditOutlined />,
                      onClick: () => handleShowProjectDrawer(card),
                    },
                    {
                      key: "info",
                      label: "账号信息",
                      icon: <InfoCircleOutlined />,
                      onClick: () => handleShowAccountDrawer(card),
                    },
                    {
                      key: "delete",
                      label: (
                        <Popconfirm
                          title="确认删除该项目?"
                          onConfirm={() => handleDeleteProject(card.moduleId)}
                          okText="删除"
                          cancelText="取消"
                          placement="left">
                          <span style={{ color: "#ff4d4f" }}>删除项目</span>
                        </Popconfirm>
                      ),
                      icon: <DeleteOutlined style={{ color: "#ff4d4f" }} />,
                    },
                  ];

                  return (
                    <Col
                      span={6}
                      key={card.moduleId}
                      xs={24}
                      sm={12}
                      md={8}
                      lg={6}
                      xl={6}>
                      <Card
                        hoverable
                        size="small"
                        className="project-card" // For potential global css tweaks
                        style={{
                          height: "100%",
                          borderRadius: 12,
                          border: "1px solid var(--border-color, #f0f0f0)", // subtle border
                          transition: "all 0.2s",
                        }}
                        // Remove default body padding for total control or keep small
                        styles={{
                          body: {
                            padding: "16px",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                          },
                        }}>
                        {/* 1. Header: Icon + Title + Menu */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            marginBottom: 12,
                          }}>
                          <div
                            style={{
                              display: "flex",
                              gap: 12,
                              alignItems: "center",
                              flex: 1,
                              overflow: "hidden",
                            }}>
                            <Avatar
                              shape="square"
                              size={40}
                              style={{
                                backgroundColor: envColor,
                                verticalAlign: "middle",
                                flexShrink: 0,
                              }}>
                              {card.typeName?.charAt(0).toUpperCase()}
                            </Avatar>
                            <div style={{ flex: 1, overflow: "hidden" }}>
                              <Tooltip title={card.moduleName}>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    fontSize: 16,
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    color: "var(--foreground)",
                                  }}>
                                  {card.moduleName}
                                </div>
                              </Tooltip>
                              <div style={{ marginTop: 2 }}>
                                <Tag
                                  bordered={false}
                                  color={envColor}
                                  style={{ marginRight: 0 }}>
                                  {envOption.find(
                                    (e) => e.value === card.typeName
                                  )?.label || card.typeName}
                                </Tag>
                              </div>
                            </div>
                          </div>

                          <Dropdown
                            menu={{
                              items: menuItems,
                            }}
                            trigger={["click"]}>
                            <div
                              style={{
                                cursor: "pointer",
                                padding: 4,
                                color: "var(--foreground)",
                                opacity: 0.5,
                                fontSize: 18,
                              }}
                              className="more-btn">
                              <MoreOutlined />
                            </div>
                          </Dropdown>
                        </div>

                        {/* 2. URL Action Area */}
                        <div style={{ marginTop: "auto" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              background: "var(--bg-hover)",
                              padding: "8px 12px",
                              borderRadius: 8,
                              gap: 8,
                            }}>
                            <div
                              style={{
                                flex: 1,
                                overflow: "hidden",
                                fontSize: 13,
                                color: "var(--foreground)",
                                opacity: 0.8,
                              }}>
                              <div
                                style={{
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}>
                                {card.moduleUrl}
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: 4 }}>
                              <Tooltip title="复制链接">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<CopyOutlined />}
                                  onClick={() => handleCopyUrl(card.moduleUrl)}
                                  style={{
                                    color: "var(--foreground)",
                                    opacity: 0.6,
                                  }}
                                />
                              </Tooltip>
                              <Tooltip title="跳转">
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<GlobalOutlined />}
                                  href={card.moduleUrl}
                                  target="_blank"
                                  style={{ color: envColor }} // Use enviroment color for the main action
                                />
                              </Tooltip>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            )}
          </Spin>
        </div>
      </div>

      {/* 5. Drawers */}
      <EditProjectDrawer
        open={projectDrawerVisible}
        onClose={() => setProjectDrawerVisible(false)}
        onSuccess={() => fetchProjectList()}
        initialData={currentModule}
        projectIdOptions={projectIdOptions}
        areaList={areaList}
        envOption={envOption}
        activeProjectId={activeProjectId}
      />

      <AccountDrawer
        open={accountDrawerVisible}
        onClose={() => setAccountDrawerVisible(false)}
        moduleData={currentAccountModule}
      />
    </div>
  );
};

export default ProjectSiteContent;
