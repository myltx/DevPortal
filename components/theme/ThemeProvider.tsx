"use client";

import React, { useEffect, useState } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { ConfigProvider, theme as antdTheme } from "antd";

/**
 * AntdAdapter
 * Syncs next-themes 'resolvedTheme' with Ant Design's ConfigProvider.
 * Using a nested component to correctly access useTheme() context.
 */
const AntdAdapter = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Prevent FOUC or partial rendering
    return <div style={{ visibility: "hidden" }}>{children}</div>;
  }

  return (
    <ConfigProvider
      theme={{
        algorithm:
          resolvedTheme === "dark"
            ? antdTheme.darkAlgorithm
            : antdTheme.defaultAlgorithm,
      }}>
      {children}
    </ConfigProvider>
  );
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class" // Use class mode for Tailwind (.dark class)
      defaultTheme="system"
      enableSystem>
      <AntdAdapter>{children}</AntdAdapter>
    </NextThemesProvider>
  );
}
