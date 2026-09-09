# AGENTS.md

## 项目介绍

个人灵感库是一个面向设计与开发工作的 Chrome/Edge 浏览器扩展。用户可以用 URL 低摩擦添加网站、文章或关注源，由系统在后台生成描述与标签，并通过内容类型、星标、快捷视图和封面优先的工作台快速重新找到内容。

V1 坚持本地优先：不要求账户或后端，业务数据保存到 IndexedDB，少量设置保存到 `chrome.storage.local`。AI 是可选助手；AI 不可用时，收藏、浏览、编辑与搜索必须继续工作。

开发前先阅读：

- `PRODUCT.md`：产品范围、用户故事与验收标准。
- `DESIGN.md`：视觉语言、组件行为与可访问性要求。
- `TECH-STACK.md`：技术选型、数据边界与扩展运行模型。
- `CONTEXT.md`：领域术语与禁用表达。
- `ROADMAP.md`：当前进度、版本顺序、阶段出口与发布门禁。
- `docs/adr/`：已接受的架构决策。

## 前端目录结构

```text
entrypoints/
├── background.ts              # MV3 后台入口与扩展事件协调
├── dashboard/                 # 完整灵感库工作台入口
├── capture-overlay.tsx        # 用户点击工具栏后按需注入的快速收藏浮层
├── capture-page.ts            # 当前页面内容采集脚本
└── options/                   # AI 与界面设置（后续实现）

src/
├── capture/                   # URL、DOM、元数据、正文与封面采集
├── components/
│   ├── ui/                    # 无业务语义的设计系统基础组件
│   ├── layout/                # AppShell 等跨页面布局
│   └── inspiration/           # 灵感卡片、封面等领域组件
├── data/                      # 演示数据；后续由 repository 替换
├── design-system/             # 全局 token、基础样式与共享状态样式
├── domain/                    # 领域模型与类型，不依赖 React
├── features/
│   ├── library/               # 浏览、搜索、筛选与详情
│   └── design-system/         # 仅开发环境可见的组件预览
└── lib/                       # 与业务无关的通用工具
```

后续增加持久化、搜索和 AI 时，分别放入 `src/db/`、`src/search/` 与 `src/ai/`。功能代码通过 repository/provider 接口访问基础设施，不在页面组件中直接操作 IndexedDB、浏览器 API 或第三方接口。

## 设计系统架构

设计系统采用三层结构：

1. **Token 层**：`src/design-system/tokens.css` 定义颜色、圆角、阴影、排版和间距。所有页面使用语义 token，不直接散落近似色值。
2. **UI 原语层**：`src/components/ui/` 优先从 Intent UI registry 按需复制并按项目 token 定制；Intent UI 以 React Aria Components 为交互基础。基础组件负责键盘交互、焦点、状态与通用 variant，不包含业务文案。
3. **领域组件层**：`src/components/inspiration/` 等目录组合 UI 原语与领域模型，形成可在多个 feature 中复用的卡片、封面和状态展示。

通用界面图标统一来自 `@remixicon/react`，禁止混用其他图标库；优先使用 `Line` 图标，明确的选中或收藏状态可使用 `Fill` 图标。站点 favicon 与内容封面不属于通用图标，应使用设计稿或收藏数据提供的真实资源，并放入 `public/assets/` 或后续的持久化资源层。

工作台侧栏是例外：导航图标使用 `public/assets/sidebar/` 中从 Figma `V0.1.1` 导出的原始 SVG，并统一通过 `SidebarIcon` 渲染。不得用相似 Remix 图标替换这些已确认的品牌界面资产。

英文与数字统一使用项目内置的 `Geist Mono Variable`；中文由 `PingFang SC` 回退，品牌字标使用紧缩粗体字体栈。标签必须通过共享 `Badge` 组件渲染，保留 `#` 前缀，并使用设计系统的 `tag-text` / `tag-surface` token。侧栏选中态复用同一组标签色，禁止页面内自行写近似橙色。

页面与 feature 负责数据编排和用户流程，不复制基础控件样式。新增颜色、圆角、阴影或交互状态前，必须先检查 `DESIGN.md` 和现有 token 是否已有对应语义。

项目以 Display-P3 为权威色彩空间。新增或修改颜色时，必须在 token 层同时提供 `color(display-p3 ...)` 权威值与 sRGB 十六进制兼容回退；组件只能引用语义 token，不得直接使用 sRGB 色值覆盖 P3 颜色。Figma 导出的 P3 资源必须保留其 `color(display-p3 ...)` 声明。

开发环境通过 `dashboard.html#design-system` 查看设计系统预览。入口使用 `import.meta.env.DEV` 隔离，生产构建不会渲染预览页面，也不会在侧栏显示入口。预览必须覆盖颜色、字体、按钮、状态、表单、卡片与布局；颜色色块使用 P3 token 渲染，显示值统一采用六位大写十六进制参考值。新增通用组件或 variant 时同步添加代表性示例。

## 组件复用规范

开发页面时必须优先复用已有组件。

- 先查找 `src/components/ui/`、`src/components/layout/`、对应领域组件目录和相邻 feature。
- 现有组件不能满足需求时，先查询 Intent UI 当前版本的 registry；存在对应组件时复制源码并按 Wanderland 的语义 token 定制，不得跳过 Intent UI 直接从 React Aria 原语重新设计同类组件。
- `features/`、`entrypoints/` 与领域组件不得直接导入 `react-aria-components`；React Aria import 只允许出现在 `src/components/ui/` 的 Intent UI 适配层。若业务需要新交互，先把对应原语收口为共享组件。
- 复制 Intent UI 组件时保留其组件分层、slot、受控状态和可访问性行为；视觉类名改用现有语义 token。Intent UI 示例中的 Heroicons 必须替换为项目统一的 Remix Icon，不得引入第二套图标依赖。
- 如果已有组件可以通过 `props`、`variant`、`size`、`slot` 或 `className` 扩展，应优先扩展现有组件，而不是重新创建相似组件。
- 页面不得复制按钮、输入框、卡片、标签、状态、Modal 等基础样式。
- 多选条件筛选统一复用 `src/components/ui/FacetFilter.tsx`；页面只提供选项、数量与筛选状态，不自行复制筛选浮层、搜索框或勾选行样式。
- 只有现有组件在语义、交互或结构上确实无法满足需求时，才允许新增组件。
- Intent UI 没有对应能力时，新增基础组件才直接基于 React Aria 的相应原语或原生语义元素，并补齐 hover、focus-visible、disabled、loading、error 与 reduced-motion 状态。
- 业务组件接收领域对象或明确的业务 props；不要让页面传入大量零散样式参数来拼装同一种组件。
- `className` 用于布局适配和有限视觉覆盖，不应用来复制另一个 variant。重复出现两次以上的覆盖应提炼为正式 variant 或共享组件。

## 开发页面的推荐顺序

1. 明确页面属于哪个 feature、对应的领域数据与状态边界。
2. 在现有 UI 与领域组件中寻找可复用项。
3. 通过 props/variant 扩展最接近的组件，并在设计系统预览补充状态。
4. 页面只实现布局、数据编排和流程；共享样式回收到 token 或组件层。
5. 确认业务层不存在新增的 `react-aria-components` 直连，运行 `pnpm check`，再在开发环境检查工作台与 `#design-system`。

## 后续开发注意事项

- 保持 Manifest V3 最小权限。当前页面读取只在用户主动收藏后使用 `activeTab` 与 `scripting`；手动 URL 补全只请求单一域名，批量导入补全只请求本批次实际 URL 的去重域名集合，均须由用户显式开启并在完成或失败后撤销。不要常驻扫描页面或申请全站权限。
- Service Worker 会被系统停止；抓取与 AI 任务必须先持久化，不能依赖内存队列保存关键状态。
- Dexie/IndexedDB 是业务数据唯一来源；MiniSearch 索引必须可从数据库重建。
- 相同规范化 URL 不得创建重复灵感项；用户手动修改的数据优先于 AI 结果。
- 快照 HTML 展示前必须通过 DOMPurify 清理；Readability 必须接收克隆后的 Document。
- 搜索、内容类型、快捷视图、筛选、当前详情项和滚动位置需要可恢复，避免关闭详情后丢失上下文。
- 灵感墙保持 DOM 阅读顺序，不使用 CSS multi-column 制造视觉顺序与键盘顺序不一致的瀑布流。
- 详情与图片浏览共享一个受控 Modal 状态机，不创建嵌套焦点陷阱。
- 所有图标按钮提供可访问名称；常用操作字号不低于 14px，正文原则上不低于 15–16px。
- 不引入 Redux、虚拟化、云同步或服务端能力，除非真实需求触发并先记录 ADR。
- 不提交真实 API Key、浏览数据、快照内容或生成目录（`.wxt/`、`.output/`）。
