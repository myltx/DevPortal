"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button, Dropdown, Tooltip } from "antd";
import { SunOutlined, MoonOutlined, DesktopOutlined } from "@ant-design/icons";

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        type="text"
        icon={<DesktopOutlined />}
        size="small"
        style={{ width: 28, height: 28 }}
      />
    );
  }

  const getIcon = () => {
    if (theme === "light") return <SunOutlined />;
    if (theme === "dark") return <MoonOutlined />;
    return <DesktopOutlined />;
  };

  const items = [
    {
      key: "light",
      label: "浅色模式",
      icon: <SunOutlined />,
    },
    {
      key: "dark",
      label: "深色模式",
      icon: <MoonOutlined />,
    },
    {
      key: "system",
      label: "跟随系统",
      icon: <DesktopOutlined />,
    },
  ];

  return (
    <Dropdown
      menu={{
        items,
        selectedKeys: [theme || "system"],
        onClick: (e) => setTheme(e.key),
      }}
      trigger={["click"]}>
      <Tooltip title="切换主题">
        <Button
          type="text"
          icon={getIcon()}
          className="theme-switch-btn"
          style={{
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        />
      </Tooltip>
    </Dropdown>
  );
}
