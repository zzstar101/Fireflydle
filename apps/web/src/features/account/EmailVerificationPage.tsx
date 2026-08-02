import { useState } from "react";
import { CheckCircle2, MailCheck, MailWarning } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ApiClientError, apiRequest } from "../../api/client";
import { usePreferences } from "../../state/preferences";
import { useRefreshSession } from "./useSession";
import "./account.css";

type VerificationStatus = "ready" | "done" | "error";

interface VerificationFailure {
  code: string;
  requestId?: string;
}

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
  const [failure, setFailure] = useState<VerificationFailure | null>(null);

  const confirmVerification = async () => {
    if (!token || busy) return;
    setBusy(true);
    setStatus("ready");
    setFailure(null);
    try {
      await apiRequest("/auth/email-verification/confirm", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
    } catch (error) {
      setFailure(
        error instanceof ApiClientError
          ? { code: error.code, ...(error.requestId ? { requestId: error.requestId } : {}) }
          : { code: "INTERNAL_ERROR" },
      );
      setStatus("error");
      setBusy(false);
      return;
    }

    setStatus("done");
    navigate("/verify-email", { replace: true });
    setBusy(false);
    void refreshSession();
  };

  const invalidToken = token.length === 0;
  const complete = status === "done";
  const failed = status === "error" || invalidToken;
  const failureMessage =
    failure?.code === "RATE_LIMITED" || failure?.code === "AUTH_RATE_LIMITED"
      ? tr(
          "操作太频繁，请稍后再试。",
          "操作が多すぎます。しばらく待ってからもう一度お試しください。",
          "Too many attempts. Wait a moment and try again.",
        )
      : failure?.code === "AUTH_INVALID_CREDENTIALS" || invalidToken
        ? tr(
            "这个链接已失效，可能已过期或被更新的验证邮件替代。请返回账号页重新发送。",
            "このリンクは期限切れか、新しい確認メールに置き換えられています。アカウント画面から再送してください。",
            "This link has expired or was replaced by a newer verification email. Return to your account to resend it.",
          )
        : tr(
            "暂时无法完成验证，请稍后重试。若问题持续，请携带下方信息联系我们。",
            "現在確認を完了できません。しばらくしてから再試行し、問題が続く場合は下の情報を添えてご連絡ください。",
            "Verification could not be completed right now. Try again later, or contact us with the details below.",
          );

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
              ? failureMessage
              : tr(
                  "请点击下方按钮完成验证。打开此页面不会自动提交验证请求。",
                  "下のボタンを押して確認を完了してください。このページを開くだけでは確認されません。",
                  "Select the button below to finish verification. Opening this page does not submit the request automatically.",
                )}
        </p>
        {failure && (
          <p className="verification-error-reference">
            {tr("错误码", "エラーコード", "Error code")}: {failure.code}
            {failure.requestId && (
              <>
                {" · "}
                {tr("请求编号", "リクエスト ID", "Request ID")}: {failure.requestId}
              </>
            )}
          </p>
        )}
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
