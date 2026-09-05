import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "个人灵感库",
    description: "在浏览器内收藏、整理并重新发现网页灵感。",
    permissions: ["activeTab", "scripting", "storage"],
    action: { default_title: "打开个人灵感库" },
  },
  vite: () => ({ plugins: [tailwindcss()] }),
});
