"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Typography, Card, Button, Spin, Empty, Breadcrumb, Space } from "antd";
import { ArrowLeftOutlined, FileTextOutlined } from "@ant-design/icons";

const { Title, Paragraph } = Typography;

function PreviewContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileName = searchParams.get("file");
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (fileName) {
      fetch(`/api/docs/content?file=${fileName}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setContent(data.content);
          }
        })
        .catch(() => setError("网络请求失败"))
        .finally(() => setLoading(false));
    }
  }, [fileName]);

  const renderContent = (text: string) => {
    // 简单的 Markdown 模拟渲染（仅处理标题和换行）
    return text.split("\n").map((line, index) => {
      if (line.startsWith("# ")) {
        return (
          <Title key={index} level={1}>
            {line.replace("# ", "")}
          </Title>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <Title key={index} level={2} style={{ marginTop: 24 }}>
            {line.replace("## ", "")}
          </Title>
        );
      }
      if (line.startsWith("### ")) {
        return (
          <Title key={index} level={3} style={{ marginTop: 16 }}>
            {line.replace("### ", "")}
          </Title>
        );
      }
      if (line.trim() === "---") {
        return (
          <hr
            key={index}
            style={{
              margin: "24px 0",
              border: "0",
              borderTop: "1px solid #eee",
            }}
          />
        );
      }
      if (line.trim().startsWith("- ")) {
        return (
          <li key={index} style={{ marginLeft: 20 }}>
            {line.replace("- ", "")}
          </li>
        );
      }
      return <Paragraph key={index}>{line}</Paragraph>;
    });
  };

  return (
    <div style={{ padding: "24px 40px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <Breadcrumb>
          <Breadcrumb.Item>
            <a onClick={() => router.push("/docs")}>技术文档</a>
          </Breadcrumb.Item>
          <Breadcrumb.Item>{fileName}</Breadcrumb.Item>
        </Breadcrumb>
      </div>

      <Card
        title={
          <Space>
            <FileTextOutlined />
            <span>{fileName}</span>
          </Space>
        }
        extra={
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push("/docs")}>
            返回列表
          </Button>
        }>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <Spin size="large" />
          </div>
        ) : error ? (
          <Empty description={error} />
        ) : (
          <div className="doc-content" style={{ padding: "0 20px" }}>
            {renderContent(content)}
          </div>
        )}
      </Card>
    </div>
  );
}

export default function DocPreviewPage() {
  return (
    <Suspense
      fallback={
        <div style={{ textAlign: "center", padding: "50px" }}>
          <Spin size="large" tip="Loading..." />
        </div>
      }>
      <PreviewContent />
    </Suspense>
  );
}
