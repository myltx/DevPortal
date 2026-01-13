"use client";

import React, { useEffect, useState, useRef } from "react";
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // State
  const [activeClassId, setActiveClassId] = useState<string>("");
  const [activeProjectId, setActiveProjectId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Data State
  const [projectIdOptions, setProjectIdOptions] = useState<any[]>([]);
  const [cardList, setCardList] = useState<any[]>([]);
  const [selectedAreaIndex, setSelectedAreaIndex] = useState("0");
  const [areaList, setAreaList] = useState<any[]>([]); // Changed to any[] for Area objects
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

            let sortIndex = index;
            const nameLower = (item.areaName || "").toLowerCase();
            if (nameLower.includes("doc")) {
              sortIndex = res.data.length + 2; // Bottom-most
            } else if (item.areaName === "其他") {
              sortIndex = res.data.length + 1; // Second to bottom
            }

            return {
              ...item,
              list: sortedList,
              sort: sortIndex,
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

  // Reset scroll and selection when project changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    setSelectedAreaIndex("0");
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
      message.success("删除成功");
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

  // Scroll to specific area
  const scrollToArea = (index: number) => {
    setSelectedAreaIndex(String(index));
    const element = document.getElementById(`area-${index}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div
      style={{
        padding: 24,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden", // Prevent full page scroll
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
      <div style={{ width: "calc(100vw - 48px)", overflow: "hidden" }}>
        <Tabs
          activeKey={activeProjectId}
          onChange={setActiveProjectId}
          tabBarStyle={{ marginBottom: 16 }}
          items={projectIdOptions.map((p) => ({
            label: p.projectName,
            key: String(p.id),
          }))}
        />
      </div>

      {/* 4. Main Content (Menu + Grid) */}
      <div
        style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}>
        {cardList.length > 0 && (
          <div
            style={{
              width: 220,
              height: "100%",
              overflowY: "auto",
              borderRadius: 12,
              border: "1px solid var(--border-color, rgba(0,0,0,0.06))",
              background: "var(--card-bg, rgba(255,255,255,0.5))", // Semi-transparent or just card bg
              marginRight: 24, // Explicit spacing
              flexShrink: 0,
            }}>
            <Menu
              mode="inline"
              selectedKeys={[selectedAreaIndex]}
              onClick={(e) => scrollToArea(Number(e.key))}
              style={{
                height: "100%",
                borderRight: "none",
                background: "transparent",
              }}
              items={cardList.map((area, index) => ({
                label: (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}>
                    <span>{area.areaName || "其他"}</span>
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--foreground)",
                        opacity: 0.4,
                      }}>
                      {area.list?.length || 0}
                    </span>
                  </div>
                ),
                key: String(index),
              }))}
            />
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            // Remove marginLeft since we used marginRight on the menu container
            // marginLeft: cardList.length > 0 ? 16 : 0,
          }}>
          <Spin spinning={loading} wrapperClassName="full-height-spin">
            <div
              ref={scrollContainerRef}
              style={{
                height: "100%",
                overflowY: "auto",
                paddingRight: 4,
                paddingBottom: 16,
                paddingLeft: 4,
                scrollBehavior: "smooth",
              }}>
              {cardList.length === 0 ? (
                <Empty description="暂无项目" style={{ marginTop: 64 }} />
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                  {cardList.map((areaGroup, groupIndex) => {
                    const projects = areaGroup.list || [];
                    if (projects.length === 0) return null; // Skip empty groups to save space

                    return (
                      <div key={groupIndex} id={`area-${groupIndex}`}>
                        {/* Group Title */}
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 600,
                            marginBottom: 16,
                            paddingLeft: 12,
                            borderLeft: "4px solid #1890ff",
                            lineHeight: 1,
                            display: "flex",
                            alignItems: "center",
                            color: "var(--foreground)",
                          }}>
                          {areaGroup.areaName || "其他"}
                          <span
                            style={{
                              fontSize: 13,
                              color: "var(--foreground)",
                              opacity: 0.5,
                              marginLeft: 8,
                              fontWeight: 400,
                            }}>
                            ({projects.length})
                          </span>
                        </div>

                        <Row gutter={[16, 16]}>
                          {projects.map((card: any) => {
                            const env = envOption.find(
                              (e) => e.value === card.typeName
                            );
                            const envColor = env ? env.color : "#1890ff";

                            const menuItems = [
                              {
                                key: "edit",
                                label: "编辑模块",
                                icon: <EditOutlined />,
                                onClick: () => handleShowProjectDrawer(card),
                              },
                              {
                                key: "delete",
                                label: (
                                  <Popconfirm
                                    title="确认删除该项目?"
                                    onConfirm={() =>
                                      handleDeleteProject(card.moduleId)
                                    }
                                    okText="删除"
                                    cancelText="取消"
                                    placement="left">
                                    <span style={{ color: "#ff4d4f" }}>
                                      删除项目
                                    </span>
                                  </Popconfirm>
                                ),
                                icon: (
                                  <DeleteOutlined
                                    style={{ color: "#ff4d4f" }}
                                  />
                                ),
                              },
                            ];

                            return (
                              <Col
                                xs={24}
                                sm={12}
                                md={12}
                                lg={12}
                                xl={8}
                                xxl={6}
                                key={card.id || card.moduleId}>
                                <Card
                                  hoverable
                                  className="project-card"
                                  bodyStyle={{ padding: "16px" }}
                                  style={{
                                    borderRadius: 12,
                                    border: "1px solid var(--border-color)",
                                    transition: "all 0.2s",
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                  }}>
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                      marginBottom: 12,
                                    }}>
                                    <div
                                      style={{
                                        display: "flex",
                                        gap: 8,
                                        flex: 1,
                                        minWidth: 0,
                                      }}>
                                      <div
                                        style={{
                                          flex: 1,
                                          overflow: "hidden",
                                          minWidth: 0,
                                        }}>
                                        <div
                                          style={{
                                            fontSize: 16,
                                            fontWeight: 600,
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            marginBottom: 2,
                                          }}
                                          title={card.moduleName}>
                                          {card.moduleName}
                                        </div>
                                        <Tag
                                          color={envColor}
                                          style={{
                                            marginRight: 0,
                                            border: "none",
                                            padding: "0 6px",
                                            fontSize: 10,
                                            lineHeight: "18px",
                                            height: 18,
                                          }}>
                                          {env?.label || card.typeName}
                                        </Tag>
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
                                  <div
                                    style={{
                                      marginTop: "auto",
                                      paddingTop: 12,
                                      display: "flex",
                                      justifyContent: "flex-end",
                                      alignItems: "center",
                                    }}>
                                    <div style={{ display: "flex", gap: 8 }}>
                                      <Tooltip title="账号信息">
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<InfoCircleOutlined />}
                                          onClick={() =>
                                            handleShowAccountDrawer(card)
                                          }
                                          style={{
                                            color: "var(--foreground)",
                                            opacity: 0.6,
                                          }}
                                        />
                                      </Tooltip>
                                      <Tooltip
                                        title={card.moduleUrl || "复制链接"}>
                                        <Button
                                          type="text"
                                          size="small"
                                          icon={<CopyOutlined />}
                                          onClick={() =>
                                            handleCopyUrl(card.moduleUrl)
                                          }
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
                                </Card>
                              </Col>
                            );
                          })}
                        </Row>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
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
