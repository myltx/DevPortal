// Configuration
const API_URL = "http://localhost:3000/api/match-credentials";

const listEl = document.getElementById("list");
const textContainerEl = document.getElementById("text-container");
const loadingEl = document.getElementById("loading");
const errorEl = document.getElementById("error");
const viewListEl = document.getElementById("view-list");
const viewTextEl = document.getElementById("view-text");
const tabBtns = document.querySelectorAll(".tab-btn");

let currentData = [];

// Main function to load credentials for a specific tab
async function loadCredentials(tabId) {
  try {
    loadingEl.style.display = "block";
    errorEl.style.display = "none";
    listEl.innerHTML = "";
    textContainerEl.innerHTML = "";

    const tab = await chrome.tabs.get(tabId);
    if (!tab?.url) {
      if (tab.status === "loading") return;
      loadingEl.style.display = "none";
      listEl.innerHTML =
        "<div style='text-align:center;color:#999;margin-top:20px;'>未找到网页 URL。</div>";
      return;
    }

    const url = new URL(tab.url);
    const hostname = url.hostname;

    // Fetch credentials
    const response = await fetch(`${API_URL}?hostname=${hostname}`);
    if (!response.ok) {
      throw new Error("API 请求失败");
    }

    const data = await response.json();
    currentData = data; // Store for tab switching

    loadingEl.style.display = "none";

    if (data.length === 0) {
      const emptyMsg = `<div style='text-align:center;color:#999;margin-top:20px;'>未找到匹配凭据：<br><b>${hostname}</b></div>`;
      listEl.innerHTML = emptyMsg;
      textContainerEl.innerHTML = emptyMsg;
      return;
    }

    if (data.length > 0) {
      const firstItem = data[0];
      const title = firstItem.projectName || firstItem.moduleName || "凭据列表";
      document.getElementById("header-title").textContent = title;
    } else {
      document.getElementById("header-title").textContent = "凭据列表";
    }

    checkUpdate(); // Check for updates silently

    renderList(data, hostname);
    renderText(data);
  } catch (err) {
    loadingEl.style.display = "none";
    errorEl.textContent = err.message;
    errorEl.style.display = "block";
  }
}

// Version Check Logic
async function checkUpdate() {
  try {
    const manifest = chrome.runtime.getManifest();
    const currentVersion = manifest.version;

    // Fetch latest version from backend
    // Construct absolute URL based on API_URL setting
    const baseUrl = new URL(API_URL).origin;
    const versionApiUrl = `${baseUrl}/api/extension-version`;

    const res = await fetch(versionApiUrl);
    if (!res.ok) return;

    const remoteData = await res.json();
    const latestVersion = remoteData.version;
    const downloadUrl = remoteData.downloadUrl;

    if (compareVersions(latestVersion, currentVersion) > 0) {
      showUpdateBanner(latestVersion, downloadUrl);
    }
  } catch (e) {
    console.warn("Update check failed", e);
  }
}

function compareVersions(v1, v2) {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);
  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const n1 = parts1[i] || 0;
    const n2 = parts2[i] || 0;
    if (n1 > n2) return 1;
    if (n1 < n2) return -1;
  }
  return 0;
}

function showUpdateBanner(version, url) {
  const banner = document.getElementById("update-banner");
  const versionSpan = document.getElementById("new-version");

  if (!banner || !versionSpan) return;

  versionSpan.textContent = `v${version}`;
  banner.style.display = "flex";

  banner.onclick = () => {
    if (url) {
      chrome.tabs.create({ url: url });
    } else {
      alert(`请联系管理员获取最新版本 v${version} 的安装包。`);
    }
  };
}

function renderList(data, hostname) {
  listEl.innerHTML = "";
  data.forEach((item) => {
    const card = document.createElement("div");
    card.className = "credential-item";
    card.innerHTML = `
      <!-- Project Name redundant with header -->
      <!-- URL hidden in compact mode -->
      
      <div class="row">
        <span class="label">账号</span>
        <span class="value" title="点击复制" data-copy="${item.username}">${item.username}</span>
      </div>
      
      <div class="row">
        <span class="label">密码</span>
        <span class="value" title="点击复制" data-copy="${item.password}">${item.password}</span>
      </div>
    `;
    listEl.appendChild(card);
  });

  // Bind Events Delegate directly to value spans
  listEl.querySelectorAll(".value").forEach((el) => {
    el.addEventListener("click", (e) => {
      const text = e.target.getAttribute("data-copy");
      copyToClipboard(text);
    });
  });
}

function renderText(data) {
  textContainerEl.innerHTML = "";
  const seen = new Set();

  data.forEach((item) => {
    if (!item.description) return;
    if (seen.has(item.description)) return;
    seen.add(item.description);

    const card = document.createElement("div");
    card.className = "text-card";

    // Header inside card is redundant with main header, removing it as requested
    // const header = document.createElement("div"); ...

    // Parse description
    const lines = item.description.split(/\r?\n/);
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Separator normalization
      const normalized = trimmed.replace(/[—–]/g, "-");

      // Smart Parsing Logic (Ported from SmartTextDisplay)
      const masterRegex =
        /((?:https?:\/\/[^\s]+)|(?:[\t]|\s{2,}|\s*[-–—]\s*|\s*\/\s*|[:：]))/;
      const segments = normalized.split(masterRegex);

      const lineDiv = document.createElement("div");
      lineDiv.style.marginBottom = "4px";

      segments.forEach((seg) => {
        if (!seg) return;
        const trimSeg = seg.trim();

        if (masterRegex.test(seg)) {
          // Separator or URL
          if (/^https?:\/\//i.test(trimSeg)) {
            // URL
            const link = document.createElement("a");
            link.href = trimSeg;
            link.target = "_blank";
            link.className = "smart-text-link";
            link.textContent = trimSeg;
            lineDiv.appendChild(link);
          } else {
            // Separator
            const span = document.createElement("span");
            span.style.color = "#ccc";
            span.style.margin = "0 2px";
            span.textContent = seg; // keep original spacing for separators
            lineDiv.appendChild(span);
          }
        } else if (trimSeg) {
          // Text content
          if (isLabelLike(trimSeg)) {
            const span = document.createElement("span");
            span.className = "smart-text-label";
            span.textContent = trimSeg;
            lineDiv.appendChild(span);
          } else {
            // Copyable Value
            const span = document.createElement("span");
            span.className = "smart-text-copyable";
            span.title = "点击复制";
            span.textContent = trimSeg;
            span.onclick = () => copyToClipboard(trimSeg);
            lineDiv.appendChild(span);
          }
        }
      });

      card.appendChild(lineDiv);
    });

    textContainerEl.appendChild(card);
  });

  if (textContainerEl.children.length === 0) {
    textContainerEl.innerHTML =
      "<div style='text-align:center;color:#999;font-size:12px;'>暂无描述文本。</div>";
  }
}

// Heuristics
function isLabelLike(segment) {
  const trimmed = segment.trim();
  if (/[\u4e00-\u9fa5]/.test(trimmed)) return true; // Chinese

  const keywords = [
    "account",
    "username",
    "password",
    "pass",
    "user",
    "账号",
    "帐号",
    "密码",
    "地址",
    "url",
    "link",
    "admin",
    "坐席",
    "备注",
    "desc",
    "服务商",
    "环境",
    "生产环境",
    "测试环境",
    "开发环境",
    "名称",
  ];
  const clean = trimmed.replace(/[:：]$/, "").toLowerCase();
  if (keywords.includes(clean)) return true;
  if (/^[^:：]+[:：]$/.test(trimmed)) return true; // Ends with colon
  return false;
}

// Tab Switching
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Update Tabs
    tabBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Update View
    const tab = btn.getAttribute("data-tab");
    if (tab === "list") {
      viewListEl.classList.add("active");
      viewTextEl.classList.remove("active");
    } else {
      viewListEl.classList.remove("active");
      viewTextEl.classList.add("active");
    }
  });
});

// Initial Load
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (tab) loadCredentials(tab.id);
});

// Listeners
chrome.tabs.onActivated.addListener((activeInfo) => {
  loadCredentials(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.active) {
    loadCredentials(tabId);
  }
});

function copyToClipboard(text) {
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => showToast());
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
      showToast();
    } catch (err) {}
    document.body.removeChild(textArea);
  }
}

function showToast() {
  const toast = document.getElementById("toast");
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 1500);
}
