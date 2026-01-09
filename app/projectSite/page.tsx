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
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  InfoCircleOutlined,
  CopyOutlined,
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
          .map((item: any, index: number) => ({
            ...item,
            sort: item.areaName === "其他" ? res.data.length : index,
          }))
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

  return (
    <div style={{ padding: 24, height: "100%" }}>
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

      {/* 2. Color Legend */}
      <div style={{ display: "flex", marginBottom: 16 }}>
        {envOption.map((env) => (
          <div
            key={env.value}
            style={{ display: "flex", alignItems: "center", marginRight: 16 }}>
            <div
              style={{
                width: 16,
                height: 16,
                background: env.color,
                marginRight: 8,
                borderRadius: 2,
              }}></div>
            <span>{env.label}</span>
          </div>
        ))}
      </div>

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
            style={{ width: 200, height: "100%", overflowY: "auto" }}
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
                  return (
                    <Col span={6} key={card.moduleId}>
                      <Card
                        hoverable
                        style={{ borderTop: `4px solid ${envColor}` }}
                        actions={[
                          <InfoCircleOutlined
                            key="info"
                            onClick={() => handleShowAccountDrawer(card)}
                          />,
                          <EditOutlined
                            key="edit"
                            onClick={() => handleShowProjectDrawer(card)}
                          />,
                          <Popconfirm
                            key="delete"
                            title="Delete?"
                            onConfirm={() =>
                              handleDeleteProject(card.moduleId)
                            }>
                            <DeleteOutlined style={{ color: "red" }} />
                          </Popconfirm>,
                        ]}>
                        <Card.Meta
                          avatar={
                            <Avatar style={{ backgroundColor: envColor }}>
                              {card.typeName?.charAt(0).toUpperCase()}
                            </Avatar>
                          }
                          title={
                            <Tooltip title={card.moduleName}>
                              {card.moduleName}
                            </Tooltip>
                          }
                          description={
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}>
                              <a
                                href={card.moduleUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  maxWidth: "80%",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}>
                                跳转
                              </a>
                              <CopyOutlined
                                onClick={() =>
                                  navigator.clipboard.writeText(card.moduleUrl)
                                }
                              />
                            </div>
                          }
                        />
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
