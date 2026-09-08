import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": decodeURIComponent(new URL(".", import.meta.url).pathname),
    },
  },
});
