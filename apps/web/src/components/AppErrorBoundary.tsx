import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface State {
  failed: boolean;
}

export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  public override state: State = { failed: false };

  public static getDerivedStateFromError(): State {
    return { failed: true };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("页面渲染失败", { error, componentStack: info.componentStack });
  }

  public override render() {
    if (!this.state.failed) return this.props.children;
    const locale = document.documentElement.lang;
    const copy =
      locale === "zh-CN"
        ? {
            title: "页面暂时无法显示。",
            detail: "请刷新页面重新连接；已经提交的服务器记录不会丢失。",
            action: "重新加载",
          }
        : locale === "ja"
          ? {
              title: "ページを表示できません。",
              detail: "再読み込みして接続し直してください。送信済みの記録は失われません。",
              action: "再読み込み",
            }
          : {
              title: "This page cannot be displayed right now.",
              detail: "Reload to reconnect. Records already submitted to the server are safe.",
              action: "Reload",
            };
    return (
      <main className="center-page">
        <AlertTriangle size={40} color="var(--danger)" />
        <p className="eyebrow">PAGE ERROR</p>
        <h1>{copy.title}</h1>
        <p className="muted">{copy.detail}</p>
        <button className="ticket-button" type="button" onClick={() => window.location.reload()}>
          {copy.action}
        </button>
      </main>
    );
  }
}
