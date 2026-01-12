"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Select } from "antd";
import { SunOutlined, MoonOutlined, DesktopOutlined } from "@ant-design/icons";

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Placeholder to prevent layout shift during hydration
    return <div style={{ width: 100, height: 32 }} />;
  }

  const options = [
    {
      value: "light",
      label: (
        <>
          <SunOutlined /> 浅色
        </>
      ),
    },
    {
      value: "dark",
      label: (
        <>
          <MoonOutlined /> 深色
        </>
      ),
    },
    {
      value: "system",
      label: (
        <>
          <DesktopOutlined /> 跟随系统
        </>
      ),
    },
  ];

  return (
    <Select
      value={theme}
      onChange={setTheme}
      options={options}
      style={{ width: 110 }}
      variant="filled" // Cleaner look for header
      size="small"
    />
  );
}
