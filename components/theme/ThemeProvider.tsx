"use client";

import React from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { ConfigProvider, theme as antdTheme } from "antd";

/**
 * AntdAdapter
 * Syncs next-themes 'resolvedTheme' with Ant Design's ConfigProvider.
 * Using a nested component to correctly access useTheme() context.
 */
const AntdAdapter = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm:
          resolvedTheme === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
        token:
          resolvedTheme === "dark"
            ? {
                colorPrimary: "#10b981",
                colorBgLayout: "#0b0f14",
                colorBgContainer: "#111827",
                colorBgElevated: "#151c2b",
                colorText: "#ededed",
                colorTextHeading: "#f3f4f6",
                colorTextSecondary: "rgba(237, 237, 237, 0.72)",
                colorTextTertiary: "rgba(237, 237, 237, 0.55)",
                colorBorderSecondary: "rgba(255, 255, 255, 0.14)",
                colorBorder: "rgba(255, 255, 255, 0.22)",
              }
            : {
                colorPrimary: "#10b981",
                colorBgLayout: "#fafafa",
                colorBgContainer: "#ffffff",
                colorBgElevated: "#ffffff",
                colorText: "#171717",
                colorTextHeading: "#111827",
                colorTextSecondary: "#6b7280",
                colorTextTertiary: "#9ca3af",
                colorBorderSecondary: "rgba(0, 0, 0, 0.08)",
                colorBorder: "rgba(0, 0, 0, 0.12)",
              },
      }}>
      {children}
    </ConfigProvider>
  );
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class" // Use class mode for Tailwind (.dark class)
      defaultTheme="light"
      enableSystem>
      <AntdAdapter>{children}</AntdAdapter>
    </NextThemesProvider>
  );
}
