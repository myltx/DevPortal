import { ssrRenderAttrs, ssrRenderStyle } from "vue/server-renderer";
import { useSSRContext } from "vue";
import { _ as _export_sfc } from "./plugin-vue_export-helper.1tPrXgE0.js";
const __pageData = JSON.parse('{"title":"⌨️ 快捷键与命令面板指南","description":"","frontmatter":{},"headers":[],"relativePath":"usage/shortcuts.md","filePath":"usage/shortcuts.md","lastUpdated":null}');
const _sfc_main = { name: "usage/shortcuts.md" };
function _sfc_ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(_attrs)}><h1 id="⌨️-快捷键与命令面板指南" tabindex="-1">⌨️ 快捷键与命令面板指南 <a class="header-anchor" href="#⌨️-快捷键与命令面板指南" aria-label="Permalink to &quot;⌨️ 快捷键与命令面板指南&quot;">​</a></h1><p>为了提升操作效率，本系统内置了仿 IDE 式的快捷键支持。</p><h2 id="全局命令面板" tabindex="-1">全局命令面板 <a class="header-anchor" href="#全局命令面板" aria-label="Permalink to &quot;全局命令面板&quot;">​</a></h2><p>按 <code>Cmd + K</code> (Mac) 或 <code>Ctrl + K</code> (Win) 呼出。</p><ul><li><strong>快速搜索</strong>: 支持模糊匹配项目名、分类名或文档名。</li><li><strong>键盘导航</strong>: 使用 <code>↑</code> / <code>↓</code> 移动，<code>Enter</code> 确认跳转。</li></ul><h2 id="vim-风格直达组合键" tabindex="-1">Vim 风格直达组合键 <a class="header-anchor" href="#vim-风格直达组合键" aria-label="Permalink to &quot;Vim 风格直达组合键&quot;">​</a></h2><p>无需呼出面板，连续输入以下字母即可快速切换。</p><table tabindex="0"><thead><tr><th style="${ssrRenderStyle({ "text-align": "left" })}">组合键</th><th style="${ssrRenderStyle({ "text-align": "left" })}">功能</th></tr></thead><tbody><tr><td style="${ssrRenderStyle({ "text-align": "left" })}"><code>g</code> <code>h</code></td><td style="${ssrRenderStyle({ "text-align": "left" })}"><strong>G</strong>o <strong>H</strong>ome (工作台)</td></tr><tr><td style="${ssrRenderStyle({ "text-align": "left" })}"><code>g</code> <code>d</code></td><td style="${ssrRenderStyle({ "text-align": "left" })}"><strong>G</strong>o <strong>D</strong>ashboard (系统监控)</td></tr><tr><td style="${ssrRenderStyle({ "text-align": "left" })}"><code>g</code> <code>p</code></td><td style="${ssrRenderStyle({ "text-align": "left" })}"><strong>G</strong>o <strong>P</strong>rojects (项目空间)</td></tr><tr><td style="${ssrRenderStyle({ "text-align": "left" })}"><code>g</code> <code>c</code></td><td style="${ssrRenderStyle({ "text-align": "left" })}"><strong>G</strong>o <strong>C</strong>onfig (系统配置)</td></tr></tbody></table><h2 id="其他支持" tabindex="-1">其他支持 <a class="header-anchor" href="#其他支持" aria-label="Permalink to &quot;其他支持&quot;">​</a></h2><ul><li><code>Esc</code>: 在任何状态下关闭弹窗或搜索框。</li></ul></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("usage/shortcuts.md");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const shortcuts = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
export {
  __pageData,
  shortcuts as default
};
