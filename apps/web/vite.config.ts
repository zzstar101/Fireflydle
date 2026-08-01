import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        ws: true,
      },
    },
  },
  build: {
    // 生产站点不发布源码映射，避免把完整题库结构直接暴露为可读源码。
    sourcemap: false,
    target: "es2022",
  },
});
