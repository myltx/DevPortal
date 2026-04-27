export type DocCardEntry = {
  title: string;
  description: string;
  filePath: string;
};

export const DOC_CARD_ENTRIES: DocCardEntry[] = [
  {
    title: "🚀 快速入门 (部署)",
    description: "了解 Docker、Vercel、直接 Node.js 部署的差异与数据库初始化流程。",
    filePath: "guide/deploy.md",
  },
  {
    title: "⚙️ 环境配置说明",
    description: "详尽的 .env 变量含义及上线 CheckList。",
    filePath: "guide/env-setup.md",
  },
  {
    title: "🔄 Swagger 同步指南",
    description: "针对微服务架构的自动同步策略与排错技巧。",
    filePath: "integration/swagger-sync-guide.md",
  },
  {
    title: "✨ 功能模块详解",
    description: "深入了解项目管理、对象定义及团队导航等核心能力。",
    filePath: "usage/features.md",
  },
  {
    title: "🧩 插件安装手册",
    description: "Chrome 扩展的详细安装步骤与 Zero-Config 更新机制说明。",
    filePath: "extension.md",
  },
  {
    title: "⌨️ 快捷键说明",
    description: "掌握 Cmd+K 等全局快捷键，提升系统操作效率。",
    filePath: "usage/shortcuts.md",
  },
  {
    title: "📅 版本迭代规划",
    description: "查看 DevPortal 的未来功能路线图与开发计划。",
    filePath: "reference/roadmap.md",
  },
];

export const DOC_ROUTE_ALIASES: Record<string, string> = {
  "deploy.md": "guide/deploy.md",
  "DEPLOY.md": "guide/deploy.md",
  "env-setup.md": "guide/env-setup.md",
  "swagger-sync-guide.md": "integration/swagger-sync-guide.md",
  "features.md": "usage/features.md",
  "shortcuts.md": "usage/shortcuts.md",
  "roadmap.md": "reference/roadmap.md",
  "docker-plan.md": "reference/docker-plan.md",
  "docker-optimization-plan.md": "reference/docker-optimization-plan.md",
  "interview-devportal-qa.md": "reference/interview-devportal-qa.md",
  "resume-devportal-frontend.md": "reference/resume-devportal-frontend.md",
};

export function resolveDocRoute(filePath: string) {
  return DOC_ROUTE_ALIASES[filePath] ?? filePath;
}

export function createDocPreviewHref(filePath: string) {
  return `/docs/preview?file=${encodeURIComponent(filePath)}`;
}
