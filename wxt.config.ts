import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Wanderland",
    description: "在浏览器内添加、整理并重新发现网站、文章与关注源。",
    permissions: ["activeTab", "scripting", "storage"],
    optional_host_permissions: ["https://*/*"],
    icons: {
      16: "icon/16.png",
      32: "icon/32.png",
      48: "icon/48.png",
      128: "icon/128.png",
    },
    action: {
      default_title: "打开 Wanderland",
      default_icon: {
        16: "icon/16.png",
        32: "icon/32.png",
        48: "icon/48.png",
        128: "icon/128.png",
      },
    },
    web_accessible_resources: [
      {
        resources: ["assets/logo.svg"],
        matches: ["http://*/*", "https://*/*"],
      },
    ],
  },
  vite: () => ({ plugins: [tailwindcss()] }),
});
