import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./i18n";
import { App } from "./app/App";
import { AppErrorBoundary } from "./components/AppErrorBoundary";
import { applyQualityFlags } from "./components/quality-flags";
import "./styles/tokens.css";
import "./styles/global.css";
import { initializePwaInstall, registerPwaServiceWorker } from "./pwa";

// 降级开关必须在首帧前落到 <html> 上，避免先渲染再降级造成闪烁
applyQualityFlags();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const root = document.getElementById("root");
if (!root) throw new Error("找不到应用挂载节点");

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </QueryClientProvider>
  </React.StrictMode>,
);

registerPwaServiceWorker();
initializePwaInstall();
