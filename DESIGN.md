---
name: Wanderland V0.2
description: Wanderland V0.2 紧凑暖灰收藏工作台设计系统。
colorSpace: display-p3
colors:
  canvas: "color(display-p3 0.95479 0.94549 0.93104)"
  surface: "color(display-p3 1 1 1)"
  surface-secondary: "color(display-p3 0.96401 0.96091 0.95728)"
  surface-subtle: "color(display-p3 0.96401 0.96091 0.95728)"
  surface-muted: "color(display-p3 0.90636 0.89086 0.86205)"
  border-default: "color(display-p3 0.94769 0.94143 0.93052)"
  border-subtle: "color(display-p3 0.92989 0.91439 0.89269)"
  border-strong: "color(display-p3 0.86647 0.84785 0.81899)"
  ink: "color(display-p3 0.18039 0.18039 0.18039)"
  text: "color(display-p3 0.32157 0.32157 0.32157)"
  text-muted: "color(display-p3 0.43922 0.43922 0.43922)"
  text-faint: "color(display-p3 0.55686 0.55686 0.57475)"
  copyright: "color(display-p3 0.68235 0.68235 0.69665)"
  card-border: "color(display-p3 0.89412 0.89412 0.89412)"
  media-border: "color(display-p3 0.9451 0.9451 0.9451)"
  shortcut-surface: "color(display-p3 0.94902 0.94902 0.96689)"
  scrollbar-thumb: "color(display-p3 0.71291 0.69112 0.66215)"
  scrollbar-thumb-hover: "color(display-p3 0.56457 0.54590 0.52057)"
  scrollbar-thumb-active: "color(display-p3 0.43922 0.43922 0.43922)"
  brand: "color(display-p3 1 0.4627 0.0549)"
  brand-hover: "color(display-p3 0.91 0.42106 0.04996)"
  accent: "color(display-p3 1 0.4627 0.0549)"
  accent-primary-bg: "color(display-p3 1 0.4627 0.0549 / 10%)"
  accent-primary-border: "color(display-p3 1 0.4627 0.0549 / 20%)"
  accent-soft: "color(display-p3 1 0.94627 0.90549)"
  info: "color(display-p3 0.25975 0.41075 0.57373)"
  info-soft: "color(display-p3 0.90124 0.93207 0.96133)"
  success: "color(display-p3 0.27868 0.42265 0.33286)"
  success-soft: "color(display-p3 0.90271 0.93966 0.91542)"
  warning: "color(display-p3 0.51395 0.36121 0.11058)"
  warning-soft: "color(display-p3 0.95331 0.91912 0.82988)"
  danger: "color(display-p3 1 0.32157 0.32157)"
  danger-soft: "color(display-p3 0.9566 0.9005 0.88862)"
  danger-bg: "color(display-p3 1 0.32157 0.32157 / 8%)"
srgbFallbacks:
  canvas: "#f4f1ed"
  surface: "#ffffff"
  surface-secondary: "#f6f5f4"
  surface-subtle: "#f6f5f4"
  surface-muted: "#e8e3db"
  border-default: "#f2f0ed"
  border-subtle: "#eee9e3"
  border-strong: "#ded8d0"
  ink: "#2e2e2e"
  text: "#525252"
  text-muted: "#707070"
  text-faint: "#8e8e93"
  copyright: "#aeaeb2"
  card-border: "#e4e4e4"
  media-border: "#f1f1f1"
  shortcut-surface: "#f2f2f7"
  scrollbar-thumb: "#b7b0a8"
  scrollbar-thumb-hover: "#918b84"
  scrollbar-thumb-active: "#707070"
  brand: "#ff760e"
  brand-hover: "#e96a08"
  accent-primary-bg: "rgb(255 118 14 / 10%)"
  accent-primary-border: "rgb(255 118 14 / 20%)"
  accent-soft: "#fff0e5"
  info: "#356a96"
  info-soft: "#e4eef6"
  success: "#3b6d53"
  success-soft: "#e4f0e9"
  warning: "#8a5a00"
  warning-soft: "#f5ead1"
  danger: "#ff5252"
  danger-soft: "#f7e5e2"
  danger-bg: "rgb(255 82 82 / 8%)"
typography:
  brand:
    fontFamily: "Dinish Condensed, Arial Narrow, Geist Mono Variable, PingFang SC, sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  interface:
    fontFamily: "Wanderland CJK, Geist Mono Variable, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
  card:
    fontFamily: "Wanderland CJK, Geist Mono Variable, SFMono-Regular, Consolas, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "24px"
rounded:
  tag: "4px"
  small: "6px"
  control: "10px"
  card: "12px"
  media: "8px"
  pill: "48px"
  floating-menu: "22px"
---

# Design System: Wanderland V0.2

## 视觉基准

当前界面的权威视觉来源是 Figma 文件「收藏库」中的 `V0.1.1 / 主页`（节点 `360:391`）。产品与技术边界仍以 `PRODUCT.md`、`TECH-STACK.md` 为准；视觉文字、字体、色号、间距和站点资源以该设计稿为准。

界面采用暖灰画布、纯白侧栏与纯白卡片。Wanderland 的品牌主色以 `color(display-p3 1 0.4627 0.0549)` 为权威值，统一用于品牌、焦点、标签、侧栏选中态和主要操作；`#ff760e` 只是不支持 P3 时的兼容回退。卡片内容保持紧凑，封面承担主要视觉信息。

## 颜色系统

- **色域规则**：Display-P3 是唯一权威色彩空间。`src/design-system/tokens.css` 先声明 sRGB 回退，再在 `@supports (color: color(display-p3 1 1 1))` 中以同名语义 token 覆盖为 P3；支持 P3 的 Chrome/Safari 会实际渲染 P3。
- **数值展示**：设计系统预览中的色块仍使用 P3 token 渲染，但面向设计核对的色值统一显示为六位大写十六进制参考值，例如 `#FF760E`；不直接展示 P3 浮点分量。
- **品牌层**：`brand / accent` 使用 P3 品牌橙，`brand-hover` 为较深状态色；`color/accent/primary-bg`（代码 token 为 `--color-accent-primary-bg`）是品牌主色 10% 透明度，用于品牌控件悬停背景；`accent-soft` 是独立的浅色选中表面，两者不互为别名。
- **表面层**：`canvas` 是页面基底；`surface` 是卡片和侧栏；`surface-secondary` 是标签等次级内容区，sRGB 核对值为 `#F6F5F4`；`surface-subtle` 用于导航选项、普通图标按钮和“取消”等弱操作文字按钮的统一悬停背景；`surface-muted` 是布局切换控件。
- **滚动条**：使用独立的 `scrollbar-thumb` 语义色，默认、悬停和拖动状态逐级加深；轨道保持透明。滚动条宽 `12px`，通过 `2px` 透明内边缘形成清晰但不过重的 `8px` 可见滑块。
- **文字层**：`ink` 用于标题；`text` 用于正文；`text-muted` 用于辅助说明；`text-faint` 用于导航分组、占位文字和时间信息；`copyright` 只用于侧栏版权信息。
- **语义层**：成功、提示、等待、危险都使用 P3 token，并配套浅色背景 token；危险色使用鲜明的现代红，sRGB 核对值为 `#FF5252`。危险图标按钮默认保持透明，悬停时统一使用 `danger-bg`（危险红 8%）背景。禁止在组件中临时生成含义不清的状态色。
- 新增或修改颜色必须先确定 P3 值，再提供 sRGB 兼容回退；组件只引用语义 token，不直接写颜色值或把 P3 重新转换成 sRGB 作为主值。

## 布局

- 桌面侧栏固定宽度 `220px`，白底，右侧使用 `border-subtle #eee9e3` 细分隔线。
- 主内容左右内边距 `16px`；顶部导航高 `76px`，筛选栏从 `102px` 开始。
- 搜索框宽 `560px`、高 `52px`、胶囊圆角，白底，不再显示副标题。
- 工具栏高 `52px`。分段控件和视图切换使用 `surface-muted #e8e3db` 底色，当前项为白色。
- 工作台工具栏内的筛选、排序和筛选结果操作按钮在悬停时统一使用轻量 `toolbar-control-hover` 动效：控件位置保持不变，保留细描边并以平滑减速曲线过渡到单层、低透明度、紧凑扩散范围的柔和下投影。排列方式的 Segmented Control 不使用该阴影：已选项悬停时视觉保持不变，未选项悬停时只将图标由 `text-muted` 加深为 `ink`。该状态只作用于 `.collection-toolbar`，不得复用或覆盖卡片的 `card-lift` 阴影。筛选容器允许换行且保持 `overflow: visible`，禁止裁切控件阴影。
- 工具栏左侧显示当前范围、结果数和“标签”入口；右侧显示“最新 / 最旧”排序和“卡片 / 紧凑卡片 / 列表”排列按钮。标签与排序触发器统一复用 `toolbar-trigger` 的 `36px` 高度、Control 字号、`500` 字重、表面、描边及展开状态；展开只旋转箭头，不改变按钮位置。内容类型、处理状态与星标状态由侧栏范围表达，不在顶部重复设置筛选入口。
- “标签”入口采用紧凑按钮并显示已选数量；点击后打开可搜索、可多选且带使用数量的浮层，搜索框固定显示“搜索标签”。搜索框与可悬停选项使用一致的 `8px` 内圆角，小于浮层的 `12px` 外圆角，以保持视觉连续。已选项在静止状态下不使用底色，只保留品牌色文字与勾选框；列表项仅在鼠标悬停或键盘可见焦点时使用次级灰色表面，鼠标点击留下的普通焦点不得持续显示底色。有筛选时，入口使用白色表面，已选数量使用品牌主色胶囊 Badge 和白色数字，避免整块按钮被品牌色占满。
- 标签筛选、排序选择和快捷视图操作菜单统一复用 `popover-surface`：白色表面、`12px` 圆角、`border-subtle` 细边框、`shadow-window` 阴影及相同的进入动效。内部可操作菜单项统一使用 `surface-subtle` 悬停背景；不同浮层只保留由内容结构决定的宽度与布局差异。
- React Aria 集合项的视觉状态必须区分 `data-hovered`、`data-focus-visible` 与内部 `data-focused`。悬停背景只响应 `data-hovered`，键盘导航背景只响应 `data-focus-visible`；不得用会在鼠标移出后继续保留的 `data-focused` 模拟 hover。
- Intent UI Toggle Group 的选中与禁用视觉分别绑定 `data-selected` 和 `data-disabled`，不得沿用原生分段按钮时期的 `aria-pressed` 或 `:disabled` 选择器；迁移交互原语时必须同步核对所有状态属性。
- 已选标签显示在工具栏下一行并保留 `#` 前缀，每个标签都可通过 `X` 单独移除。已选标签使用白色表面、三级文字色和全圆角外形，与暖灰页面形成清楚层次；标签超过当前屏幕可用宽度时只展示部分标签，并提供“+N / 收起”按钮切换完整展示。
- 标签行右侧只显示“保存为快捷视图”和“清除全部”，不重复展示结果数量；两者与工具栏触发器统一使用 `500` 字重和较轻的次级文字色，前者使用白色次级按钮，后者使用次级灰色表面按钮。无标签筛选时不显示这一行。
- 切换任一侧栏范围时，临时标签筛选清空，排序恢复为“最新”。打开快捷视图时只恢复其侧栏范围与标签组合，排序仍从“最新”开始；排序方式和排列样式均不写入快捷视图。
- 排列控件提供“详情卡片 / 紧凑卡片 / 详情列表”三种可用模式。卡片与紧凑卡片复用 `InspirationCard` 的正式 `layout` 变体，新列表复用 `InspirationListItem`；切换排列只改变当前浏览状态，不写入快捷视图。三个纯图标选项必须通过共享 `Tooltip` 在鼠标悬停或键盘聚焦时显示完整模式名称，并保留同名可访问标签。
- 卡片模式遵循 Figma「卡片组件 / 卡片」：网站显示封面、标题、描述与标签；文章不显示封面，正文区域根据实际内容自适应高度；关注源使用 `40px` 头像突出作者。紧凑卡片沿用原横向卡片：网站封面宽 `142px`，文章使用纯文本，关注源使用 `60px` 头像；按容器宽度呈现两列或一列瀑布流。列表模式遵循 Figma「列表组件 / 列表 item」，不显示描述；网站仅在有真实 OG 图时显示 `128×72px` 封面，文章使用纯文本，关注源使用 `64px` 圆形头像。
- 用户填写、网页自带与 AI 生成的描述在卡片和紧凑卡片中共用同一视觉位置和排版，不显示来源 Badge；列表不显示描述。描述优先级只影响内容选择，不增加卡片复杂度。三种展示中的标签均使用共享 Badge 的 `neutral` variant：默认态为 `surface-secondary` 背景、`text-tertiary` 文字、`border-default` 细描边和全圆角；悬停时切换为 `accent-primary-bg` 背景、`accent-primary` 文字及主色 20% 透明度描边。详情列表的列表项悬停或内部控件获得焦点时，未被直接操作的标签背景切换为白色；具体标签悬停或获得键盘焦点时仍使用统一的主色交互态。点击筛选和多标签组合逻辑保持不变。
- 内容网格使用 `auto-fill` 自动决定列数，理想最小列宽为 `244px`，1280px 画板下显示四列；不足一列时收缩为容器宽度。水平与垂直卡片间距均为 `12px`。
- 侧栏按“收藏库 / 内容列表 / 快捷视图”分组：收藏库包含“全部 / 未处理 / 星标”；内容列表固定为“网站 / 文章 / 关注源”；快捷视图由内容类型和标签条件组成。侧栏底部只保留“设置”，并复用 `SidebarNavItem` 的文字、间距与 `surface-subtle` 悬停状态。点击设置先在按钮上方打开锚定的 Intent UI Menu，直接提供“导入收藏 / 管理标签 / AI 助手”，具体任务再进入对应 Modal；不得用总设置 Modal 作为一级入口。V1 没有账户系统，菜单不显示头像、会员或退出登录等虚假入口。
- 添加入口固定在主内容区底部中央。主按钮为 48px 品牌橙圆形按钮；悬停、键盘聚焦或点击后，向上展开“网站 / 文章 / 关注源”三个操作，并显示文字标签。
- 卡片圆角 `12px`，边框 `0.5px #e4e4e4`，统一内边距 `8px`，内部区块间距 `8px`。
- 网站卡片与列表的封面统一使用 `--aspect-cover: 16 / 9`（1.78:1）；真实图片和占位封面都必须由容器宽度按此比例计算高度，不得以固定高度拉伸。圆角 `8px`，细边框 `#f1f1f1`。

## 字体

- 界面文字通过 `font-interface` 按 Unicode 范围混排：英文和数字使用项目内置的 `Geist Mono Variable`；中文汉字及中文标点在 macOS 使用 `PingFang SC`，Windows 依次回退至 `Microsoft YaHei UI / Microsoft YaHei`，Linux 依次回退至 `Noto Sans CJK SC / Noto Sans SC / Source Han Sans SC`。
- 内容卡片与列表中的标题和标签使用 `font-content-title`，沿用界面混排规则；网址等来源元数据使用 `font-metadata`，全部由 `Geist Mono Variable` 呈现。
- 描述使用 `font-description` 系统无衬线字体栈，包含其中的英文与数字，以提升连续阅读体验；macOS 优先系统 UI 字体，Windows/Linux 使用对应平台系统字体回退。
- 中文字体范围明确包含汉字、CJK 符号、全角标点，以及 `……`、`——`、中文引号和间隔号等界面常用中文标点；不得只依赖普通缺字回退，否则 Geist 会优先接管省略号等通用标点。
- `font-heading` 保持 `Songti SC / STSong` 的独立标题角色，不使用混合界面字体覆盖。
- 品牌文字优先使用 Dinish Condensed 28px/800；英文数字使用 Geist Mono，中文导航分组 12px，菜单 14px。
- 搜索与界面说明为 14–15px；域名 10px，卡片内容 14px/24px。
- 字号 token：Caption 11px、Label 12px、Control 13px、Body 14px、Title 16px、Heading 24px。正文默认使用 `text`，只有标题和关键数字使用 `ink`。

## 图标与图片

- 通用界面图标统一使用 `@remixicon/react`，默认选用 `Line` 版本；选中/收藏状态可使用 `Fill` 版本。
- 工作台侧栏使用 Figma `V0.1.1` 导出的原始 16px SVG，并通过共享 `SidebarIcon` 蒙版继承当前文字颜色，以保证设计稿轮廓与选中态颜色同时准确。
- 应用品牌图标使用用户提供的 `public/assets/logo.svg`，不再用图标库近似替代。
- 不使用 Unicode、emoji 或临时手绘 SVG 代替界面图标。
- 卡片站点图标与内容封面属于收藏内容，不属于通用图标系统。站点图标优先使用页面声明并采集保存的 favicon；缺失或加载失败时尝试站点根目录 `/favicon.ico`，仍失败则显示 Remix Icon 通用网站占位，不允许留下空白。内容封面应使用设计稿导出的实际资源并保存在 `public/assets/`，或使用收藏数据中的真实资源。

## 组件规则

- Intent UI 是共享 UI 组件的权威结构来源，Wanderland 仅在项目内调整视觉 token、尺寸和必要的领域组合，不重新设计同名基础控件。React Aria Components 只作为 `src/components/ui/` 内部的交互原语，页面和 feature 不直接引用。
- 页面优先组合 `src/components/ui/` 与 `src/components/inspiration/` 中的已有组件。
- 可通过 `props`、`variant`、`size`、`className` 扩展时不得复制组件。
- 新增视觉状态先写入语义 token 或现有组件 variant，再进入页面。
- 图标按钮必须有可访问名称，卡片支持键盘聚焦和 Enter 打开。
- 二元启用状态统一复用从 Intent UI registry 复制并定制的共享 `Switch`，不得用 checkbox 或 radio 的外观代替；互斥的多项选择统一复用 Intent UI `RadioGroup` 结构。两者必须覆盖选中、未选、键盘焦点与禁用状态，并只引用语义 token。
- 可滚动的表单与设置 Modal 统一冻结顶部标题栏；存在提交操作时同时冻结底部按钮栏，只有中间正文滚动。标题、说明、关闭按钮、取消与主操作始终可见；固定栏使用 `surface` 实色表面和分隔线，避免滚动内容从其下方透出。没有提交操作的设置列表和标签管理不添加空底栏。
- AI Provider 设置在 API Key 后提供“测试连接”次级操作。测试使用当前表单中的 Provider、Endpoint、Model 与新输入或已保存的 Key 发出最小请求；成功和失败均原位反馈，测试不保存表单、不写入 Key，也不触发收藏项整理任务。
- 液态形变只用于添加入口，使用 `liquid-gooey` 保持真实 DOM 按钮；三个操作在收起时不得进入 Tab 顺序。键盘可用 Enter/Space 展开、Escape 收起，`prefers-reduced-motion` 下取消弹性位移。
- 标签统一通过共享 Badge 渲染并显示 `#` 前缀。强调标签使用 `tag-text` 常规字重文字与 `tag-surface` 背景；卡片和列表中的内容标签使用 `neutral` variant。侧栏选中态继续复用强调标签的 P3 配色。
- 快捷视图只预置不可编辑、不可删除、不可拖动的“稍后阅读”。用户新增的视图只记录侧栏范围与标签组合，不记录排序方式或排列样式；在悬停或键盘聚焦时显示更多按钮。鼠标从条目进入更多按钮时，条目的悬停背景必须持续显示。普通图标按钮（包括新增、更多、关闭、编辑、方向切换和星标）悬停时统一使用 `surface-subtle`，图标加深为 `ink`；当前选中项可保留品牌色图标，但背景仍使用 `surface-subtle`。危险图标按钮使用危险红图标和 `danger-bg` 悬停背景。快捷视图支持行内改名、二次确认删除和原生拖拽排序，但管理菜单不显示拖拽说明项；系统视图始终位于首位。侧栏选中项的图标、文字与数量统一使用品牌主色。
- 添加入口展开为宽 `464px`、可随窄屏收缩的半透明毛玻璃菜单，使用 `card-border` 描边并加强背景模糊。菜单标题只显示“选择添加类型”，使用 `color/text/tertiary` 与 Regular 字重；不显示额外副标题。每个操作按钮必须在同一点击区域内同时包含图标、类型名称与简短说明，并使用与侧栏条目一致的 `surface-subtle` 悬停背景，不把文字做成脱离按钮的悬浮标签。
- 添加表单在链接下提供“描述（可选）”多行输入，并提供可搜索已有标签、输入新标签和移除已选标签的标签控件。辅助文案说明不填写描述时会自动采用网页描述或 AI 总结，不再出现“备注”字段。同一表单中可编辑的单行输入、多行输入与标签输入默认统一使用 `surface` 白色表面；`surface-subtle` 只用于悬停、弱化或明确的不可编辑状态，不以底色区分同层级控件类型。
- 手动添加表单使用共享 `Switch` 提供默认关闭的“补全网站信息”选项。开启后只请求输入 URL 所属单一域名的临时权限。批量链接与书签导入使用同一 `Switch`，开启后由浏览器一次确认本批次的精确域名集合，不逐站弹窗。说明文字必须明确读取标题、描述、favicon 与公开 OG 封面，并在完成后撤销全部权限；授权拒绝或补全失败不得阻止收藏保存。
- 浏览器工具栏的快速收藏使用按需注入到当前网页右上角的 Shadow DOM 面板，不使用原生 Popup。标签候选列表固定出现在输入框下方，通过同一 Shadow Root 内的 Portal 越过面板边界，并以网页视口为最终边界；面板内滚动不得带动宿主网页。
- 网站卡以封面优先；文章卡片和文章列表项始终使用纯文本结构，不显示封面，采集到的 Open Graph 图只在文章详情中展示；关注源卡使用更扁的主页封面并突出头像。原列表卡片定义为“紧凑卡片”，使用两列或一列响应式瀑布流。新列表遵循 Figma `列表组件 / 列表 item`：单列白色表面、左侧元数据距边缘 `16px`、网站封面与关注源头像距右边缘 `48px`、标题单行省略、网站真实 OG 图为 `128×72px`、关注源头像为 `64×64px`，项目之间使用 `1px` 默认语义描边色分割线。星标脱离文字和媒体布局，独立定位在每个列表项右上角；未星标按钮只在项目悬停或键盘聚焦时出现，点击后切换为常驻选中态，再次点击恢复。星标不改变内容类型。
- 卡片本身不设置最小或最大宽度，由内容网格完整填充。灵感墙采用保持 DOM 顺序的 Grid 瀑布流：根据卡片真实高度计算行跨度，不使用会改变阅读与键盘顺序的 CSS multi-column 或 dense 排列。详情卡片和紧凑卡片在悬停或键盘聚焦时统一向上移动 `2px`，并同步过渡描边与阴影；详情列表保持原位。`prefers-reduced-motion` 下取消空间位移。卡片右上角不再单独显示跳转按钮，只保留星标操作。
- 内容卡片除网址外均打开详情；网址区域悬停或键盘聚焦时使用品牌色、显示清晰下划线，并在文字末尾显现主色 Remix Icon `arrow-right-up-line`。标题不作为原网页链接。
- 详情卡片、紧凑卡片与详情列表统一支持右键菜单。菜单固定按“访问网页 / 复制链接；星标 / 标签 / 编辑信息；查看快照 / AI 整理；归档 / 删除”分组，使用分隔线建立层级；删除使用危险色并在执行前二次确认。所有永久删除操作统一复用 React Aria 危险操作确认弹窗，禁止使用浏览器原生 `confirm` 或行内二次点击确认。菜单贴近指针打开，并在首次测量及尺寸变化后执行完整视口碰撞检测；下方空间不足时向上移动，菜单高度超过视口时内部滚动，任何选项都不得落在屏幕外。选择“标签”直接进入详情编辑态、聚焦标签输入框并展开标签候选列表，“编辑信息”则进入普通编辑态。归档管理不占用主侧栏范围，从设置菜单进入；归档内容使用单列分隔列表，逐项显示标题、归档时间、永久删除与取消归档操作。
- 收藏项详情中的编辑在当前详情布局原位展开，不切换到独立编辑页面；“已处理 / 未处理”只参与侧栏筛选，不在卡片或详情中显示状态标识。
- 详情封面沿用共享封面比例：网站始终显示封面区，无图片时显示占位封面；文章仅当原网页提供封面图时显示，否则不渲染封面区；关注源保持原有图片形式，详情封面维持 `269 / 160` 原比例。
- 卡片使用 8px 内边缘留白；标题与描述内容区使用 4px 内边距，标签紧随描述并保持紧凑留白。网址、封面、信息和标签区块统一使用 8px 间距。
- 开发环境设计系统页面位于 `dashboard.html#design-system`，必须同步展示颜色、字体、按钮、表单、卡片和布局。
