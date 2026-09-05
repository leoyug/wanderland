---
name: Wanderly V0.1
description: 基于 Figma「V0.1」页面的暖灰收藏工作台。
colors:
  canvas: "#f4f1ed"
  surface: "#ffffff"
  surface-subtle: "#f8f6f3"
  surface-muted: "#ece6de"
  border-subtle: "#e9e3dc"
  border-strong: "#d8d0c7"
  ink: "#181512"
  text: "#2c2925"
  text-muted: "#5f5a54"
  text-faint: "#69645e"
  brand: "#e97603"
  brand-hover: "#d96d00"
  accent: "#e97603"
  accent-soft: "#f1ebe5"
  info: "#356a96"
  info-soft: "#e4eef6"
  success: "#3b6d53"
  success-soft: "#e4f0e9"
  warning: "#8a5a00"
  warning-soft: "#f5ead1"
  danger: "#b6463a"
  danger-soft: "#f7e5e2"
typography:
  brand:
    fontFamily: "Geist Mono Variable, PingFang SC, monospace"
    fontSize: "26px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  interface:
    fontFamily: "Geist Mono Variable, PingFang SC, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.5
  card:
    fontFamily: "Geist Mono Variable, PingFang SC, SFMono-Regular, Consolas, monospace"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "24px"
rounded:
  control: "10px"
  card: "12px"
  media: "8px"
  pill: "48px"
---

# Design System: Wanderly V0.1

## 视觉基准

当前界面的权威视觉来源是 Figma 文件「收藏库」中的 `V0.1 / 主页`（节点 `186:5021`）。产品与技术边界仍以 `PRODUCT.md`、`TECH-STACK.md` 为准；视觉文字、字体、色号、间距和站点资源以该设计稿为准。

界面采用暖灰画布、纯白侧栏与纯白卡片。Wanderly 的唯一品牌主色为 `#e97603`，统一用于品牌、链接、焦点、标签、侧栏选中态和主要操作。卡片内容使用高密度等宽字体，封面承担主要视觉信息。

## 颜色系统

- **品牌层**：`brand / accent #e97603`、`brand-hover #d96d00`、`accent-soft #f1ebe5`。主色负责品牌和交互，悬停色仅用于状态反馈，浅色用于标签及选中表面。
- **表面层**：`canvas #f4f1ed` 是页面基底；`surface #ffffff` 是卡片和侧栏；`surface-subtle #f8f6f3` 是备注区；`surface-muted #ece6de` 是分段控件和快捷键。
- **文字层**：`ink #181512` 用于标题；`text #2c2925` 用于正文；`text-muted #5f5a54` 用于辅助说明；`text-faint #69645e` 只用于低优先级标签。以上中性色都带暖调，与画布保持统一。
- **语义层**：成功 `#3b6d53`、提示 `#356a96`、等待 `#8a5a00`、危险 `#b6463a`；每种颜色都配套浅色背景 token，禁止临时用透明度生成含义不清的状态色。
- 主按钮使用 `#e97603` 背景和深色文字，避免白色文字在品牌橙上的对比不足。

## 布局

- 桌面侧栏固定宽度 `220px`，白底，右侧使用 `border-subtle #e9e3dc` 细分隔线。
- 主内容左右内边距 `24px`；顶部搜索区高 `135px`。
- 搜索框宽 `560px`、高 `51px`、胶囊圆角，白底；说明文字位于正下方。
- 工具栏高 `52px`。分段控件和视图切换使用 `surface-muted #ece6de` 底色，当前项为白色。
- 内容网格使用 `auto-fill` 自动决定列数，理想最小列宽为 `320px`，列宽随后等分剩余空间；不足一列时收缩为容器宽度。水平与垂直卡片间距均为 `12px`。
- 卡片圆角 `12px`，边框 `0.5px #e4ded7`，内边距为上 `8px`、左右及下 `4px`。
- 封面比例 `269 / 160`，圆角 `8px`，细边框 `#eee9e3`。

## 字体

- 英文和数字统一使用项目内置的 `Geist Mono Variable`；中文字符由 `PingFang SC` 回退承接。
- 品牌文字使用 Geist Mono 26px/650；中文导航分组 12px，菜单 13px。
- 搜索与界面说明为 14–15px；域名 10px，卡片内容 14px/24px。
- 字号 token：Caption 11px、Label 12px、Control 13px、Body 14px、Title 16px、Heading 24px。正文默认使用 `text`，只有标题和关键数字使用 `ink`。

## 图标与图片

- 通用界面图标统一使用 `@remixicon/react`，默认选用 `Line` 版本；选中/收藏状态可使用 `Fill` 版本。
- 应用品牌图标使用用户提供的 `public/assets/logo.svg`，不再用图标库近似替代。
- 不使用 Unicode、emoji 或临时手绘 SVG 代替界面图标。
- 卡片站点图标与内容封面属于收藏内容，不属于通用图标系统；应使用设计稿导出的实际资源并保存在 `public/assets/`。

## 组件规则

- 页面优先组合 `src/components/ui/` 与 `src/components/inspiration/` 中的已有组件。
- 可通过 `props`、`variant`、`size`、`className` 扩展时不得复制组件。
- 新增视觉状态先写入语义 token 或现有组件 variant，再进入页面。
- 图标按钮必须有可访问名称，卡片支持键盘聚焦和 Enter 打开。
- 标签固定使用 `#e97603` 常规字重文字与 `#f1ebe5` 背景，并显示 `#` 前缀；侧栏选中态复用同一组配色。
- 卡片本身不设置最小或最大宽度，由内容网格完整填充。灵感墙采用保持 DOM 顺序的 Grid 瀑布流：根据卡片真实高度计算行跨度，不使用会改变阅读与键盘顺序的 CSS multi-column 或 dense 排列。卡片右上角使用 Remix Icon `arrow-right-up-line` 打开原网页，不在封面悬停时显示收藏或外链按钮。
- 卡片使用 8px 外边缘留白；标题与描述内容区使用 16px 水平内边距，备注区使用 14px/16px 的紧凑分组留白。标题、描述、备注与标签通过 6px、10px 和 12px 的层级间距区分关系。
- 开发环境设计系统页面位于 `dashboard.html#design-system`，必须同步展示颜色、字体、按钮、表单、卡片和布局。
