import { defineConfig } from "vitepress";

export default defineConfig({
  title: "DevPortal 文档中心",
  description: "DevPortal 的部署、使用、集成与运维文档",
  base: process.env.VITEPRESS_BASE || "/",
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: "首页", link: "/" },
      { text: "指南", link: "/guide/deploy" },
      { text: "功能", link: "/usage/features" },
      { text: "集成", link: "/integration/swagger-sync-guide" },
      { text: "资源", link: "/reference/roadmap" },
    ],
    socialLinks: [{ icon: "github", link: "https://github.com/myltx/DevPortal" }],
    sidebar: [
      {
        text: "开始使用",
        items: [
          { text: "文档首页", link: "/" },
          { text: "部署指南", link: "/guide/deploy" },
          { text: "环境变量配置", link: "/guide/env-setup" },
        ],
      },
      {
        text: "功能与使用",
        items: [
          { text: "功能模块详解", link: "/usage/features" },
          { text: "快捷键与命令面板", link: "/usage/shortcuts" },
          { text: "Chrome 插件安装与发布", link: "/extension" },
        ],
      },
      {
        text: "集成与自动化",
        items: [
          { text: "Swagger 聚合与自动同步", link: "/integration/swagger-sync-guide" },
        ],
      },
      {
        text: "参考资料",
        items: [
          { text: "版本迭代规划", link: "/reference/roadmap" },
          { text: "Docker 方案草案", link: "/reference/docker-plan" },
          { text: "Docker 优化实施方案", link: "/reference/docker-optimization-plan" },
          { text: "前端恢复访谈", link: "/reference/interview-devportal-qa" },
          { text: "前端恢复手记", link: "/reference/resume-devportal-frontend" },
        ],
      },
    ],
    outline: {
      label: "本页目录",
    },
    docFooter: {
      prev: "上一页",
      next: "下一页",
    },
    lastUpdated: {
      text: "最近更新于",
    },
  },
});
