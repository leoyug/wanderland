import type { SavedItem, SavedView } from "@/src/domain/inspiration";

export const savedViews: SavedView[] = [
  { id: "read-later", name: "稍后阅读", isSystem: true, scope: "article" },
];

type DemoItem = Omit<SavedItem, "savedAt" | "aiStatus" | "cover" | "isFavorite"> & {
  isFavorite?: boolean;
  aiStatus?: SavedItem["aiStatus"];
  coverImage?: string;
  coverLabel?: string;
  coverBackground?: string;
  coverForeground?: string;
  coverMotif?: SavedItem["cover"]["motif"];
};

function createDemoItem(item: DemoItem): SavedItem {
  const { isFavorite = false, aiStatus = "complete", descriptionSource = "page", coverImage, coverLabel, coverBackground, coverForeground, coverMotif, ...content } = item;
  return {
    ...content,
    descriptionSource,
    savedAt: "演示导入",
    aiStatus,
    isFavorite,
    cover: {
      background: coverBackground ?? "#f4f1ed",
      foreground: coverForeground ?? "#2e2e2e",
      label: coverLabel ?? item.title,
      motif: coverMotif ?? "type",
      image: coverImage,
    },
  };
}

export const inspirationItems: SavedItem[] = [
  createDemoItem({
    id: "animations-on-the-web", title: "Animations on the Web", siteHost: "animations.dev",
    description: "一套关于网页动效设计与实现的系统课程，讲清楚缓动、弹簧、手势和界面反馈为何有效。",
    url: "https://animations.dev/learn", kind: "article", tags: ["动效", "交互设计", "前端"], aiStatus: "pending",
    siteIcon: "https://animations.dev/favicon.ico", coverLabel: "Animations\non the Web", coverBackground: "#ffe16b", coverForeground: "#181512", coverMotif: "orb",
  }),
  createDemoItem({
    id: "remixicon-arrow-right-up-line", title: "Arrow Right Up Line — Remix Icon", siteHost: "remixicon.com",
    description: "Remix Icon 是一套为设计师和开发者打造的开源中性风格系统图标，支持个人与商业项目免费使用。",
    url: "https://remixicon.com/icon/arrow-right-up-line", kind: "website", tags: ["图标", "开源", "Remix Icon"], isFavorite: true,
    siteIcon: "https://remixicon.com/favicon.ico",
    coverLabel: "arrow-right-up-line ↗", coverBackground: "#171717", coverForeground: "#ffffff", coverMotif: "grid",
  }),
  createDemoItem({
    id: "yiwei-ho", title: "Yiwei Ho", siteHost: "1wei.dev",
    description: "来自台湾的全栈开发者，专注于流畅的用户体验与可扩展系统，也持续探索前后端技术和产品设计。",
    url: "https://1wei.dev/", kind: "follow", tags: ["个人网站", "开发者", "作品集"], isFavorite: true,
    siteIcon: "https://1wei.dev/favicon.ico", coverImage: "https://1wei.dev/api/og?title=1wei.dev",
  }),
  createDemoItem({
    id: "suko-kuo", title: "SUKO KUO", siteHost: "okuso.uk",
    description: "SUKO KUO 的个人作品集：一名全栈开发者，构建 Next.js 产品、内部工具、电商流程、API 集成与 iOS 原型。",
    url: "https://www.okuso.uk/", kind: "follow", tags: ["个人网站", "全栈开发", "作品集"],
    siteIcon: "https://www.okuso.uk/favicon.ico", coverImage: "https://www.okuso.uk/og-image.png",
  }),
  createDemoItem({
    id: "cali-castle", title: "Cali Castle", siteHost: "cali.so",
    description: "Cali 的个人网站。他是一名设计工程师、Agent 指挥官与创意总监，也是 AI 原生设计工作室 Zolplay 的创始人。",
    url: "https://cali.so/", kind: "follow", tags: ["设计工程", "个人网站", "创意总监"], isFavorite: true,
    siteIcon: "https://cali.so/icon.png", coverImage: "https://cali.so/og?locale=zh&path=%2F&v=2205b93117f6",
  }),
  createDemoItem({
    id: "pseudoyu-blog", title: "Blog — pseudoyu", siteHost: "pseudoyu.com",
    description: "pseudoyu 的文章列表，持续记录技术实践、AI 工作流、旅行、生活与个人思考。",
    url: "https://www.pseudoyu.com/posts", kind: "follow", tags: ["博客", "技术写作", "生活"],
    siteIcon: "https://www.pseudoyu.com/favicon.png", coverLabel: "pseudoyu\nBlog", coverBackground: "#111111", coverForeground: "#ffffff",
  }),
  createDemoItem({
    id: "charlsy-yang-blog", title: "Charlsy Yang — Blog", siteHost: "charlsyang.com",
    description: "Charlsy 关于设计与写作的博客，近期文章涉及搜索体验、Canvas 与广告设计。",
    url: "https://charlsyang.com/blog", kind: "follow", tags: ["博客", "设计", "写作"],
    siteIcon: "https://charlsyang.com/favicons/favicon.ico", coverLabel: "Charlsy\ndesigns & writes.", coverBackground: "#f0efe9",
  }),
  createDemoItem({
    id: "nicole-tang", title: "Nicole Tang", siteHost: "nicoletang.design",
    description: "Nicole Tang 的独立建筑设计作品集，聚焦高密度数据环境与粗野主义排版结构。",
    url: "https://www.nicoletang.design/", kind: "follow", tags: ["作品集", "建筑", "排版"],
    siteIcon: "https://www.nicoletang.design/favicon.ico", coverLabel: "NICOLE\nTANG", coverBackground: "#e7ff43", coverForeground: "#101010", coverMotif: "grid",
  }),
  createDemoItem({
    id: "design-engineer-tools", title: "Design Engineer Tools", siteHost: "designengineer.tools",
    description: "James Warner 策划的设计工程师工具清单，面向以 Web 为主要工作环境的设计与开发实践。",
    url: "https://designengineer.tools/", kind: "website", tags: ["设计工程", "工具集", "资源导航"],
    siteIcon: "https://designengineer.tools/favicon.ico", coverLabel: "Design Engineer\nTools", coverBackground: "#eef0ff", coverForeground: "#242449", coverMotif: "grid",
  }),
  createDemoItem({
    id: "design-spells", title: "Design Spells", siteHost: "designspells.com",
    description: "由 Chester 与 Duncan 策划，收集那些像魔法一样令人愉悦的微交互、彩蛋、动效与设计细节。",
    url: "https://designspells.com/", kind: "website", tags: ["设计灵感", "微交互", "动效"], isFavorite: true,
    siteIcon: "https://www.google.com/s2/favicons?domain=designspells.com&sz=64", coverLabel: "Design details that\nfeel like magic.", coverBackground: "#6d44ff", coverForeground: "#ffffff", coverMotif: "orb",
  }),
  createDemoItem({
    id: "motion-primitives", title: "Motion Primitives", siteHost: "motion-primitives.com",
    description: "基于 Motion 与 Tailwind CSS 的可复用动画组件库，面向工程师、设计师与创始人，支持复制、定制和开源使用。",
    url: "https://motion-primitives.com/", kind: "website", tags: ["动效", "React", "组件库"],
    siteIcon: "https://www.google.com/s2/favicons?domain=motion-primitives.com&sz=64", coverLabel: "Motion\nPrimitives", coverMotif: "orb",
  }),
  createDemoItem({
    id: "best-designs-on-x", title: "Best Designs on X.com", siteHost: "bestdesignsonx.com",
    description: "从 X 上的优秀创作者中精选视觉设计、Logo、UI 与品牌灵感，并按小时持续更新。",
    url: "https://bestdesignsonx.com/", kind: "website", tags: ["设计灵感", "视觉设计", "精选"],
    siteIcon: "https://bestdesignsonx.com/favicon.webp", coverImage: "https://bestdesignsonx.com/og-image.png",
  }),
  createDemoItem({
    id: "shadcn-ui", title: "shadcn/ui — The Foundation for your Design System", siteHost: "ui.shadcn.com",
    description: "提供可组合、可访问且默认设计周到的组件源码，用于构建能够自由定制和扩展的组件库。",
    url: "https://ui.shadcn.com/", kind: "website", tags: ["设计系统", "React", "组件库"], isFavorite: true,
    siteIcon: "https://ui.shadcn.com/favicon-16x16.png", coverImage: "https://ui.shadcn.com/og?title=The%20Foundation%20for%20your%20Design%20System&description=Composable%2C%20accessible%20components%20with%20thoughtful%20defaults.",
  }),
  createDemoItem({
    id: "hexta-ui", title: "HextaUI", siteHost: "hextaui.com",
    description: "构建在 shadcn/ui 之上的扩展组件与区块集合，提供可直接使用的界面基础。",
    url: "https://www.hextaui.com/", kind: "website", tags: ["shadcn/ui", "组件库", "区块"],
    siteIcon: "https://www.hextaui.com/favicon.ico", coverImage: "https://5xfmztgsig.ufs.sh/f/ZzCwT4wrsqrVozjaUvdGPLJUvqyRh8sbeO1wTpAICiMtWFr9",
  }),
  createDemoItem({
    id: "intent-ui", title: "Components — Intent UI", siteHost: "intentui.com",
    description: "80 多个基于 React Aria 的可访问 UI 组件，可自由定制，并通过一致的模式快速构建生产级界面。",
    url: "https://intentui.com/components", kind: "website", tags: ["React Aria", "可访问性", "组件库"],
    siteIcon: "https://intentui.com/icon.ico", coverImage: "https://intentui.com/og?title=Components&description=Explore+80%2B+accessible+UI+components+built+on+React+Aria.",
  }),
  createDemoItem({
    id: "originkit", title: "Originkit — Free Animated Component Library", siteHost: "originkit.dev",
    description: "面向现代网站的免费动画组件库，可复制代码、用于 Framer，或通过 MCP 接入开发流程。",
    url: "https://www.originkit.dev/", kind: "website", tags: ["动画组件", "Framer", "MCP"],
    siteIcon: "https://www.originkit.dev/favicon.ico?v=4", coverImage: "https://www.originkit.dev/og-image.png?v=2",
  }),
  createDemoItem({
    id: "astryx-design-system", title: "Astryx Design System", siteHost: "astryx.atmeta.com",
    description: "一个完全可定制、面向 Agent 使用场景的开源设计系统。",
    url: "https://astryx.atmeta.com/", kind: "website", tags: ["设计系统", "开源", "Agent"],
    siteIcon: "https://astryx.atmeta.com/favicon.svg", coverImage: "https://astryx.atmeta.com/images/Astryx-Banner.png",
  }),
  createDemoItem({
    id: "untitled-ui", title: "Untitled UI — Figma UI Kit and React Component Library", siteHost: "untitledui.com",
    description: "大型 Figma UI Kit 与 React 组件库，提供设计和开发项目所需的界面组件、模板与资源。",
    url: "https://www.untitledui.com/", kind: "website", tags: ["Figma", "React", "UI Kit"],
    siteIcon: "https://cdn.prod.website-files.com/636496d3f0ebfdaba9784655/6708848510bc3d367ad6d289_favicon-32px.png", coverImage: "https://cdn.prod.website-files.com/636496d3f0ebfdaba9784655/69aba352ecd7a4b4314ea4cd_untitled-ui-open-graph.jpg",
  }),
  createDemoItem({
    id: "beautiful-ui", title: "Beautiful UI — Crafted Primitives for AI-native Interfaces", siteHost: "beautifului.dev",
    description: "为 AI 原生界面精心打造的可复制组件，覆盖聊天 Agent、思考状态与人工审批等交互。",
    url: "https://www.beautifului.dev/", kind: "website", tags: ["AI 界面", "组件库", "交互"],
    siteIcon: "https://www.beautifului.dev/icon.png", coverLabel: "Beautiful UI", coverMotif: "orb",
  }),
  createDemoItem({
    id: "21st-dev", title: "21st — React Components, Templates & Themes", siteHost: "21st.dev",
    description: "由设计工程师制作的 React、Tailwind CSS 组件、模板与 shadcn 主题社区，可实时预览并通过命令安装。",
    url: "https://21st.dev/", kind: "website", tags: ["React", "Tailwind CSS", "组件社区"],
    siteIcon: "https://21st.dev/favicon.ico", coverImage: "https://21st.dev/opengraph-image.png",
  }),
  createDemoItem({
    id: "uibook", title: "UIBook — UI Inspiration for Everyone", siteHost: "uibook.art",
    description: "浏览经过人工筛选的网站设计与 UI 组件，为下一次界面项目寻找灵感。",
    url: "https://uibook.art/", kind: "website", tags: ["UI 灵感", "网页设计", "组件"],
    siteIcon: "https://uibook.art/favicon.ico", coverImage: "https://uibook.art/og/uibook-og-v2.jpg",
  }),
  createDemoItem({
    id: "cuelume", title: "Cuelume — Interaction Sounds for the Web", siteHost: "cuelume-site.pages.dev",
    description: "一个小巧、零依赖的网页交互声音库，使用 Web Audio 在浏览器中实时合成精心设计的反馈音效。",
    url: "https://cuelume-site.pages.dev/#start", kind: "website", tags: ["交互声音", "Web Audio", "微交互"],
    siteIcon: "https://cuelume-site.pages.dev/favicon.svg", coverImage: "https://cuelume-site.pages.dev/og-image.png",
  }),
];
