"use client";

import React from "react";
import { Row, Col, Button, Card } from "antd";
import { useRouter } from "next/navigation";
import {
  FileTextOutlined,
  AppstoreOutlined,
  ProjectOutlined,
  ReadOutlined,
} from "@ant-design/icons";

export default function MiddlePage() {
  const router = useRouter();

  return (
    <div style={{ padding: "40px", height: "100vh", background: "#f0f2f5" }}>
      <Card title="工作台" bordered={false} style={{ width: "100%" }}>
        <Row gutter={[32, 32]} justify="center">
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<ProjectOutlined />}
              onClick={() => router.push("/project")}
              style={{ width: "160px", height: "60px", fontSize: "16px" }}>
              名词页面
            </Button>
          </Col>
          <Col>
            <Button
              type="primary"
              size="large"
              style={{
                backgroundColor: "#52c41a",
                borderColor: "#52c41a",
                width: "160px",
                height: "60px",
                fontSize: "16px",
              }}
              icon={<AppstoreOutlined />}
              onClick={() => router.push("/webNav")}>
              导航页面
            </Button>
          </Col>
          <Col>
            <Button
              type="primary"
              size="large"
              icon={<ReadOutlined />}
              onClick={() => router.push("/objectPage")}
              style={{ width: "160px", height: "60px", fontSize: "16px" }}>
              对象属性
            </Button>
          </Col>
          <Col>
            <Button
              type="default"
              size="large"
              style={{
                backgroundColor: "#13c2c2",
                borderColor: "#13c2c2",
                color: "#fff",
                width: "160px",
                height: "60px",
                fontSize: "16px",
              }}
              icon={<FileTextOutlined />}
              onClick={() => router.push("/docs")}>
              技术文档
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
