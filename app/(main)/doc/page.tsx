"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

// Dynamically import SwaggerUI to avoid SSR issues with some libraries
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

import { Alert, Typography } from "antd";

// ...

export default function ApiDocPage() {
  return (
    <div className="container mx-auto p-4">
      <div style={{ marginBottom: 24 }}>
        <Alert
          message="开发小贴士"
          description={
            <div style={{ marginTop: 8 }}>
              <Typography.Text>
                您可以使用 <Typography.Text keyboard>Cmd + K</Typography.Text>{" "}
                (Mac) 或 <Typography.Text keyboard>Ctrl + K</Typography.Text>{" "}
                (Win) 随时唤起全局命令面板，快速搜索接口或跳转页面。
              </Typography.Text>
            </div>
          }
          type="info"
          showIcon
          closable
        />
      </div>
      <SwaggerUI url="/api/doc" />
    </div>
  );
}
