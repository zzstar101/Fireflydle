import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { usePreferences } from "../state/preferences";

export default function NotFoundPage() {
  const locale = usePreferences((state) => state.language);
  return (
    <main className="center-page">
      <div className="error-code">404</div>
      <p className="eyebrow">404 · PAGE NOT FOUND</p>
      <h1>
        {locale === "zh-CN"
          ? "页面找不到了"
          : locale === "ja"
            ? "ページが見つかりません"
            : "Page not found"}
      </h1>
      <p className="muted">
        {locale === "zh-CN"
          ? "目标页面不存在，或链接已经失效。"
          : locale === "ja"
            ? "ページが存在しないか、リンクの有効期限が切れています。"
            : "The page does not exist, or the link is no longer valid."}
      </p>
      <Link className="ticket-button" to="/">
        <ArrowLeft size={17} aria-hidden="true" />
        {locale === "zh-CN" ? "返回大厅" : locale === "ja" ? "ホームへ戻る" : "Back to home"}
      </Link>
    </main>
  );
}
