import { useState, type FormEvent } from "react";
import { AtSign, CheckCircle2, KeyRound, Send } from "lucide-react";
import { PASSWORD_MIN_LENGTH } from "@fireflydle/contracts";
import { Link, useSearchParams } from "react-router-dom";
import { apiRequest } from "../../api/client";
import { usePreferences } from "../../state/preferences";
import "./account.css";

export default function RecoveryPage() {
  const locale = usePreferences((state) => state.language);
  const tr = (zh: string, ja: string, en: string) =>
    locale === "zh-CN" ? zh : locale === "ja" ? ja : en;
  const [params] = useSearchParams();
  const token = params.get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (token) {
        await apiRequest("/auth/password-reset/confirm", {
          method: "POST",
          body: JSON.stringify({ token, password }),
        });
      } else {
        await apiRequest("/auth/password-reset/request", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
      }
      setDone(true);
    } catch {
      setError(
        locale === "zh-CN"
          ? "操作失败，请稍后重试。如果你正在重置密码，链接可能已经过期。"
          : locale === "ja"
            ? "リクエストを完了できませんでした。リンクの有効期限を確認してください。"
            : "The request could not be completed. The link may be expired or email is not configured.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-shell recovery-page">
      <section className="recovery-panel">
        <div className="recovery-icon">
          {done ? (
            <CheckCircle2 size={30} />
          ) : token ? (
            <KeyRound size={30} />
          ) : (
            <AtSign size={30} />
          )}
        </div>
        <p className="eyebrow">{tr("找回密码", "パスワードの再設定", "PASSWORD RECOVERY")}</p>
        <h1>
          {done
            ? tr("请求已经记录", "リクエスト完了", "Request complete")
            : token
              ? tr("设置新密码", "新しいパスワードを設定", "Set a new password")
              : tr("找回密码", "アカウントを復旧", "Recover your account")}
        </h1>
        {done ? (
          <>
            <p>
              {token
                ? tr(
                    "密码已更新，现在可以返回登录。",
                    "パスワードを更新しました。ログイン画面に戻れます。",
                    "Your password has been updated.",
                  )
                : tr(
                    "如果该邮箱已绑定账号，我们会发送一封 30 分钟内有效的邮件。为避免泄露账号状态，无论邮箱是否存在都会显示此提示。",
                    "登録済みのメールアドレスには、30分間有効な復旧リンクを送信します。アカウント情報を保護するため、登録の有無にかかわらず同じ案内を表示します。",
                    "If the email is registered, a 30-minute recovery link will be sent. This message is identical whether or not the address exists.",
                  )}
            </p>
            <Link className="ticket-button" to="/account">
              {tr("返回登录", "ログインへ戻る", "Back to sign in")}
            </Link>
          </>
        ) : (
          <form className="auth-form recovery-form" onSubmit={(event) => void submit(event)}>
            {token ? (
              <label>
                <span>
                  {tr("新密码", "新しいパスワード", "NEW PASSWORD")}
                  <small>
                    {tr(
                      `至少 ${PASSWORD_MIN_LENGTH} 位`,
                      `${PASSWORD_MIN_LENGTH}文字以上`,
                      `${PASSWORD_MIN_LENGTH}+ CHARACTERS`,
                    )}
                  </small>
                </span>
                <input
                  name="new-password"
                  required
                  minLength={PASSWORD_MIN_LENGTH}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
            ) : (
              <label>
                <span>{tr("绑定邮箱", "登録メール", "ACCOUNT EMAIL")}</span>
                <input
                  name="email"
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </label>
            )}
            <button className="ticket-button" disabled={busy}>
              {busy ? <span className="button-spinner" /> : <Send size={17} />}
              {token
                ? tr("更新密码", "パスワードを更新", "Update password")
                : tr("发送找回邮件", "復旧メールを送信", "Send recovery email")}
            </button>
            {error && (
              <div className="auth-error" role="alert">
                {error}
              </div>
            )}
          </form>
        )}
      </section>
    </main>
  );
}
