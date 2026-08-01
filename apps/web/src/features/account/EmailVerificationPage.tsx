import { useState } from "react";
import { CheckCircle2, MailCheck, MailWarning } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { apiRequest } from "../../api/client";
import { usePreferences } from "../../state/preferences";
import { useRefreshSession } from "./useSession";
import "./account.css";

type VerificationStatus = "ready" | "done" | "error";

export default function EmailVerificationPage() {
  const locale = usePreferences((state) => state.language);
  const tr = (zh: string, ja: string, en: string) =>
    locale === "zh-CN" ? zh : locale === "ja" ? ja : en;
  const [params] = useSearchParams();
  const token = params.get("token")?.trim() ?? "";
  const navigate = useNavigate();
  const refreshSession = useRefreshSession();
  const [status, setStatus] = useState<VerificationStatus>("ready");
  const [busy, setBusy] = useState(false);

  const confirmVerification = async () => {
    if (!token || busy) return;
    setBusy(true);
    setStatus("ready");
    try {
      await apiRequest("/auth/email-verification/confirm", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setStatus("done");
      navigate("/verify-email", { replace: true });
      await refreshSession();
    } catch {
      setStatus("error");
    } finally {
      setBusy(false);
    }
  };

  const invalidToken = token.length === 0;
  const complete = status === "done";
  const failed = status === "error" || invalidToken;

  return (
    <main className="page-shell recovery-page email-verification-page">
      <section className="recovery-panel">
        <div className="recovery-icon" aria-hidden="true">
          {complete ? (
            <CheckCircle2 size={30} />
          ) : failed ? (
            <MailWarning size={30} />
          ) : (
            <MailCheck size={30} />
          )}
        </div>
        <p className="eyebrow">{tr("验证邮箱", "メール確認", "EMAIL VERIFICATION")}</p>
        <h1>
          {complete
            ? tr("邮箱验证成功", "メールを確認しました", "Email verified")
            : failed
              ? tr("无法验证邮箱", "メールを確認できません", "Unable to verify email")
              : tr("确认验证邮箱", "メール確認を続ける", "Confirm your email")}
        </h1>
        <p>
          {complete
            ? tr(
                "这个邮箱现在可以用于找回密码。",
                "このメールアドレスでパスワードを再設定できます。",
                "You can now use this email to recover your password.",
              )
            : failed
              ? tr(
                  "验证链接无效或已经过期。请返回账号页重新发送验证邮件。",
                  "確認リンクが無効か期限切れです。アカウント画面から確認メールを再送してください。",
                  "This verification link is invalid or expired. Return to your account to send a new email.",
                )
              : tr(
                  "请点击下方按钮完成验证。打开此页面不会自动提交验证请求。",
                  "下のボタンを押して確認を完了してください。このページを開くだけでは確認されません。",
                  "Select the button below to finish verification. Opening this page does not submit the request automatically.",
                )}
        </p>
        {complete || invalidToken ? (
          <Link className="ticket-button" to="/account">
            {tr("返回账号页", "アカウントへ戻る", "Back to account")}
          </Link>
        ) : (
          <div className="verification-actions">
            <button
              className="ticket-button"
              type="button"
              disabled={busy}
              onClick={() => void confirmVerification()}
            >
              {busy ? (
                <span className="button-spinner" aria-hidden="true" />
              ) : (
                <MailCheck size={17} />
              )}
              {busy
                ? tr("正在验证…", "確認中…", "Verifying…")
                : failed
                  ? tr("重新验证", "もう一度確認", "Try again")
                  : tr("验证邮箱", "メールを確認", "Verify email")}
            </button>
            {failed && (
              <Link className="text-button" to="/account">
                {tr("返回账号页并重发", "アカウントで再送する", "Return to account and resend")}
              </Link>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
