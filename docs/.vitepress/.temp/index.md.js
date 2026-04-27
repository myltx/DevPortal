import { ssrRenderAttrs } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"","description":"","frontmatter":{"layout":"home","sidebar":false,"aside":false,"outline":false,"lastUpdated":false,"editLink":false,"hero":{"name":"DevPortal","text":"研发文档中心","tagline":"围绕 DevPortal 的部署、使用与集成流程，提供统一、清晰且可持续维护的交付文档入口。","actions":[{"theme":"brand","text":"快速开始","link":"/guide/deploy"},{"theme":"alt","text":"功能说明","link":"/usage/features"},{"theme":"alt","text":"集成指南","link":"/integration/swagger-sync-guide"}]},"features":[{"title":"项目空间","details":"汇总各行业线、环境与模块入口，帮助团队快速定位服务、账号与常用资源。"},{"title":"Swagger 聚合","details":"面向微服务场景聚合接口文档，并打通 Jenkins、Apifox 与钉钉通知链路。"},{"title":"部署与运维","details":"覆盖 Docker、环境变量、数据库迁移、离线部署和常见排障流程。"},{"title":"配套扩展","details":"提供 Chrome 插件安装、打包和自动更新说明，补齐浏览器侧的账号辅助体验。"}]},"headers":[],"relativePath":"index.md","filePath":"index.md"}');
const _sfc_main = { name: "index.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("index.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  index as default
};
