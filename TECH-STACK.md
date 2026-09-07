# 个人灵感库：技术栈方案

Date: 2026-09-05

## 1. 结论

V1 采用一套纯浏览器、本地优先、无后端的扩展技术栈：

```text
Manifest V3
WXT
React + TypeScript
Tailwind CSS v4 + Intent UI + React Aria Components
liquid-gooey
Dexie + IndexedDB
Mozilla Readability + DOMPurify
MiniSearch + Intl.Segmenter
Zod + 可替换 AI Provider
Vitest + Playwright
pnpm + Biome
```

这套方案能满足当前的收藏、卡片管理、自动标签、正文快照和本地搜索，同时保留未来将管理界面迁移成托管网页的可能性。

## 2. 技术选型

| 层级 | 选择 | 用途 |
| --- | --- | --- |
| 扩展规范 | Manifest V3 | Chrome/Edge 扩展运行模型 |
| 扩展框架 | WXT | 管理 Manifest、入口、开发热更新和打包 |
| 编程语言 | TypeScript strict | 为领域模型、扩展消息和数据迁移提供类型保护 |
| UI | React | 构建卡片库、筛选器、详情面板和设置页 |
| 样式 | Tailwind CSS v4 | 承载 `DESIGN.md` 中的语义 token，并与 Intent UI 当前版本保持一致 |
| UI 组件 | Intent UI（源码归属项目） | 通过 shadcn registry 按需复制 Sidebar、SearchField、Tag Group、Modal、Menu 等组件 |
| 交互原语 | React Aria Components | 为 Intent UI 和项目自定义交互提供可访问性、键盘导航、国际化与焦点管理 |
| 添加入口动效 | liquid-gooey | 为三个真实 DOM 按钮提供克制的液态展开形变，并继承 reduced-motion |
| 主数据库 | IndexedDB + Dexie | 保存卡片、内容类型、星标、标签、正文和图片 Blob |
| 小型配置 | `chrome.storage.local` | 保存主题、界面偏好和 AI 配置 |
| 正文提取 | `@mozilla/readability` | 从当前 DOM 中提取可阅读正文 |
| HTML 清理 | DOMPurify | 防止快照 HTML 在扩展页面中执行恶意内容 |
| 本地搜索 | MiniSearch | 实现字段权重、前缀、模糊和全文搜索 |
| 中文分词 | `Intl.Segmenter` | 改善中英文混合内容的搜索效果 |
| AI 数据校验 | Zod | 校验描述和标签等结构化输出 |
| 单元测试 | Vitest | 测试纯函数、数据库迁移和搜索逻辑 |
| 端到端测试 | Playwright | 加载真实 MV3 扩展并验证完整流程 |
| 工具链 | pnpm + Biome | 依赖管理、格式化和静态检查 |

WXT 官方支持 React、Vue、Svelte 和 Solid，能为不同浏览器生成扩展，并提供文件式入口。对当前项目而言，它比直接维护 Manifest 和多个 Vite 入口更简单。Intent UI 面向 React、使用 Tailwind CSS v4，并通过 shadcn registry 将组件源码复制进项目；因此它可以运行在 WXT 的 React 入口中，不依赖 Next.js 或服务端能力。

参考：[WXT](https://wxt.dev/)、[WXT 前端框架支持](https://wxt.dev/guide/essentials/frontend-frameworks.html)、[Chrome Manifest V3](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)、[Intent UI 介绍](https://intentui.com/docs/getting-started/introduction)、[Intent UI 安装](https://intentui.com/docs/getting-started/installation)

## 3. 扩展结构

```text
entrypoints/
├── background.ts          # 事件协调、持久化任务、AI 请求
├── content.ts             # 读取当前页面 DOM 和元数据
├── popup/                 # 收藏状态和可选描述
├── dashboard/             # 完整卡片管理页
└── options/               # AI Key、模型和界面设置

src/
├── db/                    # Dexie Schema、Repository 和数据迁移
├── domain/                # SavedItem、SavedItemKind、Tag、SavedView
├── capture/               # URL、元数据、正文和封面提取
├── search/                # MiniSearch 索引和中文分词
├── ai/                    # Provider 适配器、Prompt 和 Zod Schema
├── components/ui/         # 复制并定制后的 Intent UI 组件源码
├── components/inspiration/# InspirationCard、详情灯箱和图片浏览器
└── features/              # 添加、浏览、星标、标签与搜索等功能
```

### 扩展页面的职责

- **Dashboard**：通过底部悬浮入口添加网站、文章或关注源；左侧切换内容类型、星标与快捷视图；顶部搜索、多标签筛选和排序；主体呈现卡片墙、详情灯箱和图片浏览。
- **Popup**：后续可复用 Dashboard 的添加流程，为浏览器工具栏提供当前页快捷添加；不作为 V1 首要入口。
- **Options**：配置 AI Provider、Endpoint、Model 和 API Key。
- **Content Script**：只在用户明确收藏时读取当前页面。
- **Service Worker**：协调消息、任务状态和失败重试，不保存只存在于内存的重要状态。

Manifest V3 的 Service Worker 会在闲置时停止，因此抓取和 AI 处理任务必须先持久化，再异步执行。

参考：[Chrome Service Worker 迁移说明](https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers)

## 4. 本地数据

### 4.1 数据边界

Dexie/IndexedDB 作为唯一业务数据源，保存：

- 收藏项、固定内容类型、星标、标签、快捷视图和描述来源。
- 已清理的正文文本与 HTML。
- 封面和缩略图 Blob。
- AI 任务状态和错误信息。
- 搜索索引的重建元数据。

`chrome.storage.local` 仅保存小型配置，不保存正文快照和大图。

Dexie 的 `useLiveQuery()` 可以观察 IndexedDB 查询：新项目保存或 AI 处理完成后，React 界面可自动刷新。

参考：[Dexie React 指南](https://dexie.org/docs/Tutorial/React)、[Chrome 扩展存储](https://developer.chrome.com/docs/extensions/develop/concepts/storage-and-cookies)

### 4.2 存储容量

V1 先使用默认存储配额，通过 `navigator.storage.estimate()` 监测使用量，并尝试通过 `navigator.storage.persist()` 提高数据持久性。

仅当真实快照数据证明存储限制是问题时，再申请 `unlimitedStorage` 权限。

### 4.3 搜索索引

MiniSearch 索引可以从 Dexie 重建，不是业务数据源。建议权重：

1. 名称。
2. 标签、内容类型和域名。
3. 描述。
4. 正文快照。

中文文本使用 `Intl.Segmenter("zh-CN", { granularity: "word" })` 自定义 MiniSearch tokenizer；英文保留小写化、前缀搜索和低度模糊匹配。

数据规模较大后，可将索引构建放入 Web Worker，不阻塞卡片页面。

参考：[MiniSearch](https://lucaong.github.io/minisearch/)

## 5. 网页采集

### 5.1 推荐流程

1. 用户在悬浮入口选择网站、文章或关注源，提交 URL，并可选填写描述；未来插件按钮可直接带入当前页 URL。
2. 立即写入内容类型、URL、标题、域名、添加时间，以及存在时的用户描述。
3. 内容脚本读取当前页面已渲染的 DOM。
4. 提取 Open Graph、JSON-LD、favicon 和其他元数据。
5. 将克隆的 Document 交给 Mozilla Readability。
6. 使用 DOMPurify 清理提取出的 HTML。
7. 将 `cleanText` 和 `cleanHtml` 保存至 IndexedDB。
8. 按“用户描述 → 网页描述 → AI 总结”的优先级确定最终描述，同时异步生成标签；固定内容类型和用户描述不被 AI 覆盖。

收藏项保存 `description` 与 `descriptionSource`。`descriptionSource` 取 `user | page | ai`，用于后台合并时保护用户输入，不作为卡片或列表中的额外展示信息。标签采集、生成、编辑和筛选流程保持不变。

采集优先读取用户正在查看的页面，不再以后台请求作为第一选择。这对登录后页面和客户端渲染页面更可靠，也可以减少广泛的网站访问权限。

Mozilla Readability 会修改传入的 DOM，因此必须传入页面克隆。Readability 不负责防止脚本注入，其生成的 HTML 必须由 DOMPurify 清理。

参考：[Mozilla Readability](https://github.com/mozilla/readability)、[DOMPurify](https://github.com/cure53/DOMPurify)

### 5.2 权限策略

V1 建议权限：

```json
{
  "permissions": ["activeTab", "scripting", "storage"]
}
```

`activeTab` 在用户主动点击扩展时才临时授予当前页面访问权，可避免 V1 直接申请 `<all_urls>`。

参考：[Chrome activeTab](https://developer.chrome.com/docs/extensions/develop/concepts/activeTab)

### 5.3 批量导入的限制

从书签 HTML 或批量 URL 导入时，扩展没有这些页面的 `activeTab` 权限。V1 先保存 URL、标题和文件夹上下文，将条目标记为“待补全”。

后续可选择：

- 用户访问相应页面时再补抓。
- 用户主动授予指定站点的可选 Host Permission。
- 未来引入后端抓取服务。

V1 不为了自动补全而要求读取所有网站。

## 6. 封面生成

封面按以下顺序选择：

1. 尺寸和比例合适的 Open Graph 图。
2. 当前可见区域截图。
3. 站点 Logo。
4. favicon 或默认占位图。

封面保存为 Blob，卡片展示时创建 Object URL。用户手动选择封面后，后续自动处理不得覆盖。

### 6.1 卡片墙布局

V1 使用 CSS Grid 加 `ResizeObserver` 计算 `grid-row-end` span，生成保持 DOM 阅读顺序的瀑布流。不要使用 CSS multi-column，因为它会让视觉顺序与键盘/屏幕阅读器顺序不一致。

封面宽高比应在采集时写入元数据，使首屏可在图片解码前预留空间并减少布局跳动。图片使用 `loading="lazy"` 和 `decoding="async"`；首屏可见的少量封面可以提升加载优先级。

V1 暂不为卡片墙增加第三方虚拟化库。只有在真实数据量和性能分析证明 DOM 数量成为瓶颈后，再评估 Intent UI Virtualizer 或专用的虚拟瀑布流实现，避免过早增加测量、焦点和滚动恢复复杂度。

### 6.2 详情灯箱与图片浏览

详情使用 Intent UI 的受控 `Modal`/`Dialog`，而不是 `Sheet`。Modal 内部维护 `detail | image` 两种视图状态：视觉上形成“详情灯箱 → 沉浸式图片浏览”两层，技术上复用一个焦点陷阱。

- `detail`：显示网页链接、封面、描述、内容类型、标签、快照状态和更多菜单。
- `image`：隐藏编辑区域，提供适合窗口、原始尺寸、缩放和拖动平移。
- 第一层 `Escape` 从图片模式返回详情；再次按下才关闭 Modal。
- 关闭后将焦点还给原卡片，并恢复内容墙滚动位置。
- 图片变换只使用 CSS `transform`，不通过修改宽高实现缩放。V1 可先实现按钮、滚轮和指针拖动，不强制增加图片查看器依赖。

Intent UI 的 Modal 支持受控状态、尺寸、遮罩样式和 sticky body，并以 React Aria ModalOverlay/Dialog 为底层，适合此场景。

参考：[Intent UI Modal](https://intentui.com/docs/components/overlays/modal)、[Intent UI Dialog](https://intentui.com/docs/components/overlays/dialog)

## 7. AI 接入

### 7.1 Provider 抽象

业务代码不直接依赖某一家 AI SDK，而是定义可替换接口：

```ts
interface AiProvider {
  analyze(input: PageSnapshot): Promise<PageAnalysis>
}
```

V1 先实现一个 OpenAI-compatible HTTP Provider，允许用户设置：

- Endpoint
- Model
- API Key

AI 输出必须是结构化 JSON，并通过 Zod Schema 校验。不合法输出进入可重试状态，不覆盖已有人工数据。

### 7.2 API Key 边界

纯浏览器扩展无法真正隐藏客户端 API Key。V1 作为个人工具时可接受用户自行提供 Key，但必须：

- 明确说明 Key 保存在本地浏览器。
- 默认不同步、不导出 Key。
- 提供“仅当前会话保留”选项。
- 只将必要的页面摘要发送给配置的 Provider。
- 在设置页显示风险提示。

若未来对外发布，应增加服务端代理、身份认证、限额和速率限制，不应将开发者密钥放入扩展。

参考：[OpenAI API Key 安全建议](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safet)

## 8. 本地搜索

V1 不引入 Elasticsearch、向量数据库或 SQLite WASM。MiniSearch 足以支持预期的个人收藏规模，并且可以按字段调整匹配权重。

搜索结果先由侧栏确定全部、内容类型、星标、处理状态或快捷视图范围，再由顶部多选标签缩小。顶部不重复提供内容类型、处理状态或星标状态筛选。切换侧栏范围时清空临时标签并恢复“最新”排序；快捷视图只持久化侧栏范围与标签 ID，不保存搜索词、排序或排列样式。精确过滤由 Dexie 查询或内存集合完成，全文相关性交给 MiniSearch。

## 9. 状态管理

- 业务持久化状态：Dexie。
- Dexie 查询派生状态：`useLiveQuery()`。
- 页面内短期状态：React `useState` / `useReducer`。
- 搜索、内容类型、快捷视图、筛选和当前详情项：URL search params，便于返回时恢复上下文。
- 灯箱内部状态：组件内 reducer 管理 `closed | detail | image`，图片缩放和平移不写入持久化状态。

V1 不引入 Redux。如果后续出现大量跨页面临时状态，再评估 Zustand。

## 10. 测试策略

### Vitest

优先覆盖：

- URL 规范化与去重。
- 固定内容类型、星标和快捷视图组合过滤。
- 标签归一化和近义词合并。
- Dexie Schema 升级。
- Readability 提取与快照完整性判定。
- MiniSearch 中英文分词和字段权重。
- AI 结构化输出校验和错误恢复。

### Playwright

优先覆盖：

1. 在普通文章页收藏并生成卡片。
2. 收藏 SPA 和已登录页面时，至少保存 URL 和当前可见内容。
3. AI 不可用时，收藏和本地管理仍可使用。
4. 重复收藏不生成重复卡片。
5. 导入书签 HTML 和多个 URL。
6. 搜索、内容类型、星标与快捷视图筛选和居中详情灯箱保留当前上下文与滚动位置。
7. 选中多个标签后切换侧栏范围，标签被清空且排序恢复为“最新”；调用快捷视图只恢复范围与标签。
8. 点击卡片非交互区域打开详情；标签、星标、外链和更多菜单不会误触父级行为。
9. 未星标按钮只在卡片悬停或键盘聚焦时出现；`bookmark-line`、`bookmark-3-fill` 与侧栏计数能随点击正确往返。
10. 图片模式按一次 `Escape` 返回详情、再次按下关闭灯箱，关闭后焦点回到原卡片。
11. 用户在添加时填写的描述不会被网页采集或 AI 结果覆盖；未填写时依次采用网页描述和 AI 总结。
12. 卡片与列表只显示一段最终描述，不渲染备注字段或重复说明。
13. `prefers-reduced-motion` 下灯箱和卡片不执行位移、缩放或背景模糊动画。

Playwright 测试 MV3 扩展时需使用持久化 Chromium Context 加载未打包扩展。

参考：[Playwright Chrome 扩展测试](https://playwright.dev/docs/chrome-extensions)

## 11. 不采用的技术

### Next.js

当前没有 SSR、公开页面或服务端路由需求。扩展内引入 Next.js 会增加构建和路由复杂度。

### Supabase、Firebase 或 PostgreSQL

V1 没有账户、同步和协作需求。提前引入托管数据库会改变隐私边界并增加运维。

### Electron 或 Tauri

它们会把项目变成独立桌面应用，与“所有操作均在浏览器内完成”的目标冲突。

### Redux

业务数据已由 Dexie 提供持久化和响应式查询，不需要再复制到一个全局内存 Store。

### Radix UI

Intent UI 已以 React Aria Components 作为交互原语。V1 不再同时引入 Radix UI，避免两套 Dialog、Popover、菜单和焦点管理模型并存，减少 bundle、样式覆盖和可访问性测试成本。

### 独立 Lightbox 组件库

详情灯箱和图片模式都可以在同一个 Intent UI Modal 中完成。V1 不额外引入 Lightbox 依赖；只有在后续需要复杂手势、旋转或多图预加载且自有实现难以维护时再评估。

### 向量数据库

V1 已明确不做语义搜索。本地全文检索足以验证“一分钟找回灵感”。

### 全站 Host Permission

V1 不申请 `<all_urls>`。只在用户主动收藏时通过 `activeTab` 读取当前页面。

## 12. 实施顺序

### Milestone 1：收藏闭环

- WXT + React + TypeScript 骨架。
- Manifest V3 权限。
- Popup 收藏和可选描述。
- Content Script 提取。
- Dexie 数据库。
- Dashboard 基础卡片。

### Milestone 2：整理和查找

- 网站、文章、关注源三种固定内容类型。
- 可编辑标签与可组合快捷视图。
- 标签管理。
- MiniSearch 全文搜索。
- 筛选、瀑布流卡片墙和居中详情灯箱。
- 沉浸式图片浏览与键盘导航。
- URL 去重与站点聚合。

### Milestone 3：AI 整理和导入

- Provider 设置与 API Key 风险提示。
- Zod 结构化输出。
- AI 描述和标签。
- 失败任务重试。
- 书签 HTML 和批量 URL 导入。

## 13. 与产品文档的一致性

本方案遵循以下边界：

- 单人、单机、本地优先。
- 交付形式是浏览器扩展，管理界面是扩展内完整网页。
- 一击收藏优先于完成 AI 整理。
- 内容类型固定且互斥，标签表达具体语义，快捷视图负责组合筛选。
- V1 只保存收藏当下的一次正文快照。
- V1 不做版本监控、日报周刊、账户、云同步和语义搜索。
