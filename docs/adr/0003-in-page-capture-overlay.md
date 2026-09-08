# 3. 使用按需注入的网页内收藏浮层

Date: 2026-09-09

## Status

Accepted

## Context

浏览器原生 Popup 的绘制范围受其窗口边界限制。标签候选列表无法稳定固定在输入框下方并越过 Popup 边界；通过翻转列表或动态调整 Popup 高度只能缓解问题，也会造成位置跳动和滚动冲突。

快速收藏仍需遵守 V1 的最小权限原则：页面读取只能发生在用户主动点击插件之后，不申请 `<all_urls>`，业务数据继续只保存在扩展域的 IndexedDB 中。

## Decision

移除工具栏图标的原生 Popup。Service Worker 监听 `browser.action.onClicked`，在用户主动点击后使用 `activeTab + scripting` 执行打包后的 `capture-overlay.js`。

收藏表单作为 React 组件挂载到网页内的 Shadow DOM。Shadow Host 覆盖网页视口但默认不接收指针事件；收藏面板和标签浮层恢复指针交互。标签列表通过 React Portal 挂载到同一个 Shadow Root，因此可以越过收藏面板边界，同时保持样式隔离。

网页浮层不直接访问 IndexedDB。标签查询、当前页采集、保存、重试和打开收藏库都通过 Runtime Message 交给 Service Worker，由扩展域 Repository 访问数据。再次点击工具栏图标、点击关闭按钮或按 Escape 会卸载 React Root 并移除 Shadow Host。

无法注入的受保护页面降级为打开 Dashboard。Manifest 继续只声明 `activeTab`、`scripting` 和 `storage`。

## Consequences

- 标签列表可以固定显示在输入框下方，并在网页视口内越过收藏面板。
- 面板样式不会被宿主网页 CSS 污染，也不会把扩展数据写入网站来源的 IndexedDB。
- 快速收藏入口仅在用户点击时注入，不增加常驻 Content Script 或全站 Host Permission。
- Chrome 内部页面、扩展商店和其他禁止脚本注入的页面不能显示浮层，需要打开 Dashboard 作为降级路径。
- 浮层必须显式处理卸载、键盘关闭、滚动隔离以及窄视口布局。
