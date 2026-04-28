import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"Docker 部署方案","description":"","frontmatter":{},"headers":[],"relativePath":"reference/docker-plan.md","filePath":"reference/docker-plan.md","lastUpdated":1777308504000}');
const _sfc_main = { name: "reference/docker-plan.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="docker-部署方案" tabindex="-1">Docker 部署方案 <a class="header-anchor" href="#docker-部署方案" aria-label="Permalink to &quot;Docker 部署方案&quot;">​</a></h1><div class="note custom-block github-alert"><p class="custom-block-title">NOTE</p><p><strong>状态说明（2026-04）</strong>：本文档为早期 Docker 草案，部分路径和运行方式已经过时，例如文中的 <code>web/Dockerfile</code>、<code>.next</code>、<code>web/docker-compose.yml</code>。 当前请以 <a href="./../guide/deploy.html">docs/guide/deploy.md</a> 和 <code>deploy/docker/</code> 下的实际文件为准。</p></div><p>由于服务器 OS 过旧无法满足 Node 20 的 Glibc 依赖，采用 Docker 容器化部署。</p><h2 id="_1-web-dockerfile" tabindex="-1">1. web/Dockerfile <a class="header-anchor" href="#_1-web-dockerfile" aria-label="Permalink to &quot;1. web/Dockerfile&quot;">​</a></h2><p>采用“本地构建 + Docker 打包”策略：</p><ul><li>在宿主机先执行 <code>pnpm build</code> 生成 <code>.next</code>（避免在 Mac Apple Silicon 上用 buildx/QEMU 进行 <code>next build</code>）</li><li>Docker 镜像内只做两件事： <ul><li>安装 Linux x64 生产依赖（确保原生二进制依赖平台正确）</li><li>复制 <code>.next</code>/<code>public</code> 并 <code>next start</code> 运行</li></ul></li></ul><h2 id="_2-web-docker-compose-yml" tabindex="-1">2. web/docker-compose.yml <a class="header-anchor" href="#_2-web-docker-compose-yml" aria-label="Permalink to &quot;2. web/docker-compose.yml&quot;">​</a></h2><p>简单的服务编排，映射端口 3001。</p><h2 id="_3-guide-deploy-md" tabindex="-1">3. guide/deploy.md <a class="header-anchor" href="#_3-guide-deploy-md" aria-label="Permalink to &quot;3. guide/deploy.md&quot;">​</a></h2><p>更新为 Docker 操作指南：</p><ul><li>安装 Docker</li><li><code>docker compose up -d --build</code></li><li>注意：若在服务器上直接构建，需要上传包含 <code>.next</code> 的目录（或改用“本地构建并上传”方案）</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("reference/docker-plan.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const dockerPlan = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  dockerPlan as default
};
