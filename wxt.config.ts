import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "Wanderland",
    description: "在浏览器内添加、整理并重新发现网站、文章与关注源。",
    permissions: ["activeTab", "scripting", "storage"],
    action: { default_title: "打开 Wanderland" },
  },
  vite: () => ({ plugins: [tailwindcss()] }),
});
