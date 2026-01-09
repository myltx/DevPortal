"use client";

import React from "react";
import { Layout } from "antd";

const { Content } = Layout;

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Layout style={{ minHeight: "100vh", background: "#f0f2f5" }}>
      <Content style={{ padding: 24 }}>{children}</Content>
    </Layout>
  );
}
