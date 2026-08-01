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
            : "The request could not be completed. Please try again; a password reset link may have expired.",
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
                    "如果该邮箱已经验证并绑定账号，我们会发送一封 30 分钟内有效的邮件。为避免泄露账号状态，无论邮箱是否符合条件都会显示此提示。",
                    "確認済みのメールアドレスがアカウントに登録されている場合、30分間有効な復旧リンクを送信します。アカウント情報を保護するため、条件を満たさない場合も同じ案内を表示します。",
                    "If the email is verified and linked to an account, a 30-minute recovery link will be sent. This message is identical whether or not the address is eligible.",
                  )}
            </p>
            <Link className="ticket-button" to="/account">
              {tr("返回登录", "ログインへ戻る", "Back to sign in")}
            </Link>
          </>
        ) : (
          <form className="auth-form recovery-form" onSubmit={(event) => void submit(event)}>
            {!token && (
              <p className="recovery-helper">
                {tr(
                  "请输入注册时填写并已完成验证的邮箱。未验证的邮箱不能用于找回密码。",
                  "登録時に入力し、確認済みのメールアドレスを入力してください。未確認のメールは復旧に使用できません。",
                  "Enter the verified email used during registration. Unverified email cannot be used for password recovery.",
                )}
              </p>
            )}
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
                <span>{tr("已验证邮箱", "確認済みメール", "VERIFIED EMAIL")}</span>
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
