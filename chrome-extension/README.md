# DevPortal Chrome 扩展 (Credential Matcher) v1.1

专为 DevPortal 开发的辅助工具，用于在浏览器侧边栏自动匹配并展示当前网站的相关凭据（账号/密码）。

## ✨ 功能特性

- **自动匹配**：自动读取当前激活标签页的域名，从后端 API 获取对应的凭据信息。
- **双视图模式**：
  - **列表模式 (List)**：以卡片形式展示账号密码，支持**点击直接复制**。
  - **文本模式 (Text)**：解析富文本描述，智能提取账号、密码、链接等敏感信息，支持高亮显示和点击复制。
- **现代化 UI**：
  - 固定头部，清晰展示所属项目/模块名称。
  - 侧边栏 (Side Panel) 交互，不占用页面空间。
  - 自动沉浸式体验：切换标签页时自动收起，保持专注。
- **全中文界面**：操作指引和提示信息均已本地化。

## 📦 安装指南

由于本扩展是内部工具，暂未发布到 Chrome 商店，需通过“加载已解压的扩展程序”方式安装。

1.  **下载代码**：确保你已经拉取了 `DevPortal` 的完整代码。
2.  **打开扩展管理页**：在 Chrome 地址栏输入 `chrome://extensions/` 并回车。
3.  **开启开发者模式**：打开右上角的 “开发者模式” (Developer mode) 开关。
4.  **加载扩展**：
    - 点击左上角的 “加载已解压的扩展程序” (Load unpacked)。
    - 选择本项目中的 `chrome-extension` 目录。
5.  **固定图标**：安装完成后，建议将插件图标固定在浏览器工具栏，方便快速通过点击图标打开侧边栏 (Side Panel)。

## 📤 打包与发布

本项目已集成**全自动打包与版本管理**流程，只需一个命令即可完成版本更新与发布。

### 1. 执行打包命令

```bash
npm run extension:pack
```

### 2. 交互式流程

脚本会引导你进行以下两步操作：

1.  **确认版本**：脚本读取当前 `manifest.json` 版本，你可以输入新版本号（如 `1.2`）或直接回车保持不变。
2.  **自动归档**：脚本会自动更新 `manifest.json`，清理无用文件，并生成以下两个文件到 `public/extension/` 目录：
    - `chrome-extension-v{version}.zip` (版本存档)
    - `chrome-extension-latest.zip` (**最新版永久链接**)

### 3. 在线更新机制 (Zero Config)

插件内置了版本自检功能，当你将生成的文件部署到服务器后：

- **服务端**：`public/extension/chrome-extension-latest.zip` 始终指向最新版。
- **自动检测**：API 接口 (`/api/extension-version`) 会自动读取服务器上的 `manifest.json` 版本。
- **无需配置**：如果你未在系统配置中指定下载链接，API 会自动返回当前服务器的 `latest.zip` 地址。
- **用户感知**：当用户打开插件时，若发现服务器版本高于本地版本，会自动弹出更新提示，点击即可通过 `latest.zip` 链接下载。

## ⚙️ 配置说明

默认情况下，扩展配置连接本地后端 API：

- **API 地址**: `http://localhost:3000/api/match-credentials`

为避免接口在内网被随意调用，建议后端开启 **API Key** 校验，并在扩展里配置 Key。

如需连接远程服务器，请修改 `chrome-extension/popup.js` 文件顶部的配置：

```javascript
// popup.js
const API_URL = "http://YOUR_REMOTE_SERVER_IP:3000/api/match-credentials";
const API_KEY = "YOUR_SHARED_KEY";
```

## 🖥 使用方法

1.  **启动后端服务**：确保 DevPortal 的 Next.js 后端服务已启动 (`npm run dev`)。
2.  **浏览目标网站**：在浏览器中打开你需要查找凭据的网站（例如内网测试环境）。
3.  **打开侧边栏**：点击浏览器工具栏上的扩展图标。
4.  **查看凭据**：
    - 侧边栏会自动滑出，并显示当前域名下的所有凭据。
    - **点击** 账号或密码的文本区域即可复制到剪贴板。
    - 切换到 **“文本”** 标签页可查看更详细的备注信息。
