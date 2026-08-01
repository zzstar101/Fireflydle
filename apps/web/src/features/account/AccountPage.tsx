import { useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  AtSign,
  BarChart3,
  KeyRound,
  LogIn,
  LogOut,
  MailWarning,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
} from "lucide-react";
import {
  PASSWORD_MIN_LENGTH,
  type AccountDeletionStatus,
  type LoginRequest,
  type RegisterRequest,
  type SessionPayload,
} from "@fireflydle/contracts";
import { Link } from "react-router-dom";
import { ApiClientError, apiRequest } from "../../api/client";
import { usePreferences } from "../../state/preferences";
import { emailVerificationState } from "./email-verification-state";
import { registrationErrorDetails } from "./registration-error";
import { useRefreshSession, useSession } from "./useSession";
import "./account.css";

export default function AccountPage() {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const tr = (zh: string, ja: string, en: string) =>
    locale === "zh-CN" ? zh : locale === "ja" ? ja : en;
  const session = useSession();
  const refreshSession = useRefreshSession();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [login, setLogin] = useState<LoginRequest>({ loginName: "", password: "" });
  const [register, setRegister] = useState<RegisterRequest>({
    loginName: "",
    displayName: "",
    password: "",
    email: undefined,
  });
  const [newDisplayName, setNewDisplayName] = useState("");
  const moveAuthTabFocus = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    let next: "login" | "register" | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown" || event.key === "End") {
      next = "register";
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp" || event.key === "Home") {
      next = "login";
    }
    if (!next) return;
    event.preventDefault();
    setTab(next);
    event.currentTarget.parentElement
      ?.querySelector<HTMLButtonElement>(`#account-tab-${next}`)
      ?.focus();
  };
  const user = session.data?.user;
  const emailState = user ? emailVerificationState(user) : "missing";
  const deletion = useQuery({
    queryKey: ["account", "deletion"],
    queryFn: () => apiRequest<AccountDeletionStatus>("/account/deletion"),
    enabled: Boolean(user && !user.isGuest),
    retry: false,
  });

  const submitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await apiRequest<SessionPayload>("/auth/login", {
        method: "POST",
        body: JSON.stringify(login),
      });
      await refreshSession();
    } catch {
      setMessage(t("error.AUTH_INVALID_CREDENTIALS"));
    } finally {
      setBusy(false);
    }
  };

  const submitRegister = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await apiRequest<SessionPayload>("/auth/register", {
        method: "POST",
        body: JSON.stringify(register),
      });
      await refreshSession();
    } catch (error) {
      const details = registrationErrorDetails(error);
      const localized = t(`error.${details.code}`, { defaultValue: t("error.generic") });
      setMessage(
        details.requestId && details.code === "INTERNAL_ERROR"
          ? `${localized} ${tr("请求编号", "リクエスト ID", "Request ID")}: ${details.requestId}`
          : localized,
      );
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    setBusy(true);
    try {
      await apiRequest("/auth/logout", { method: "POST" });
    } catch {
      /* 本地访客无需远端退出。 */
    }
    await refreshSession();
    setBusy(false);
  };

  const updateDisplayName = async (event: FormEvent) => {
    event.preventDefault();
    if (!newDisplayName.trim()) return;
    setBusy(true);
    setMessage(null);
    try {
      await apiRequest("/account/profile", {
        method: "PATCH",
        body: JSON.stringify({ displayName: newDisplayName }),
      });
      setNewDisplayName("");
      setMessage(tr("展示名已更新。", "表示名を更新しました。", "Display name updated."));
      await refreshSession();
    } catch {
      setMessage(
        tr(
          "展示名不可用，或距离上次修改未满 30 天。",
          "その表示名は使用できないか、30日間の変更制限中です。",
          "That name is unavailable or the 30-day cooldown is still active.",
        ),
      );
    } finally {
      setBusy(false);
    }
  };

  const requestEmailVerification = async () => {
    if (!user || user.isGuest || emailState !== "pending") return;
    setBusy(true);
    setMessage(null);
    try {
      await apiRequest("/auth/email-verification/request", { method: "POST" });
      setMessage(
        tr(
          "如果邮箱仍然可用，验证邮件将会发送，请稍后检查收件箱。",
          "メールアドレスが引き続き利用可能な場合、確認メールが送信されます。しばらくしてから受信トレイを確認してください。",
          "If the email is still available, a verification message will be sent. Check your inbox shortly.",
        ),
      );
    } catch (error) {
      const code = error instanceof ApiClientError ? error.code : "INTERNAL_ERROR";
      setMessage(
        code === "RATE_LIMITED" || code === "AUTH_RATE_LIMITED"
          ? t("error.RATE_LIMITED")
          : code === "AUTH_EMAIL_UNAVAILABLE"
            ? t("error.AUTH_EMAIL_UNAVAILABLE")
            : t("error.generic"),
      );
    } finally {
      setBusy(false);
    }
  };

  const requestDeletion = async () => {
    const confirmed = window.confirm(
      tr(
        "确认申请删除账号？你有 7 天可以撤销。",
        "アカウント削除を申請しますか？7日以内なら取り消せます。",
        "Request account deletion? You will have 7 days to cancel.",
      ),
    );
    if (!confirmed) return;
    setBusy(true);
    try {
      await apiRequest("/account/deletion", { method: "POST" });
      await deletion.refetch();
      setMessage(
        tr(
          "删除申请已记录，可在下方于 7 天内撤销。",
          "削除申請を受け付けました。7日以内なら下で取り消せます。",
          "Deletion scheduled. You can cancel below within 7 days.",
        ),
      );
    } catch {
      setMessage(t("error.generic"));
    } finally {
      setBusy(false);
    }
  };

  const cancelDeletion = async () => {
    setBusy(true);
    try {
      await apiRequest("/account/deletion", { method: "DELETE" });
      await deletion.refetch();
      setMessage(
        tr("账号删除申请已撤销。", "削除申請を取り消しました。", "Account deletion cancelled."),
      );
    } catch {
      setMessage(t("error.generic"));
    } finally {
      setBusy(false);
    }
  };

  if (user && !user.isGuest) {
    return (
      <main className="page-shell account-page">
        <section className="profile-banner">
          <div className="profile-avatar">
            <UserRound size={36} />
          </div>
          <div>
            <p className="eyebrow">{tr("账号信息", "アカウント情報", "ACCOUNT")}</p>
            <h1>{user.displayName}</h1>
            <span className={`profile-email-state profile-email-state-${emailState}`}>
              {emailState === "verified" ? (
                <>
                  <ShieldCheck size={15} /> {tr("邮箱已验证", "メール確認済み", "EMAIL VERIFIED")}
                </>
              ) : emailState === "pending" ? (
                <>
                  <MailWarning size={15} /> {tr("邮箱待验证", "メール未確認", "EMAIL UNVERIFIED")}
                </>
              ) : (
                <>
                  <AtSign size={15} /> {tr("未绑定邮箱", "メール未登録", "NO EMAIL")}
                </>
              )}
            </span>
          </div>
          <div className="profile-actions">
            <Link className="ticket-button-secondary" to="/stats">
              <BarChart3 size={17} /> {t("nav.stats")}
            </Link>
            <button
              className="ticket-button-secondary"
              type="button"
              disabled={busy}
              onClick={() => void logout()}
            >
              <LogOut size={17} /> {t("account.logout")}
            </button>
          </div>
        </section>
        <section className="account-metrics">
          <div>
            <span>{tr("ELO 评分", "ELO レート", "ELO RATING")}</span>
            <strong>{user.elo}</strong>
            <small>
              {user.leaderboardEligible
                ? tr("公开", "公開", "PUBLIC")
                : tr(
                    `再完成 ${Math.max(0, 10 - user.rankedMatches)} 场即可公开`,
                    `公開まであと${Math.max(0, 10 - user.rankedMatches)}戦`,
                    `${Math.max(0, 10 - user.rankedMatches)} MATCHES TO PUBLIC`,
                  )}
            </small>
          </div>
          <div>
            <span>{tr("排位场次", "ランク対戦数", "RANKED MATCHES")}</span>
            <strong>{user.rankedMatches}</strong>
            <small>{tr("全部", "通算", "ALL TIME")}</small>
          </div>
          <div>
            <span>{tr("昵称", "表示名", "DISPLAY NAME")}</span>
            <strong className="small-value">{user.displayName}</strong>
            <small>{tr("每 30 天可修改", "30日に1回変更可能", "CHANGE EVERY 30 DAYS")}</small>
          </div>
        </section>
        {emailState === "pending" && (
          <section className="email-verification-notice" aria-labelledby="email-verification-title">
            <div>
              <MailWarning size={20} aria-hidden="true" />
              <span>
                <strong id="email-verification-title">
                  {tr(
                    "验证邮箱后才能找回密码",
                    "メール確認が必要です",
                    "Verify your recovery email",
                  )}
                </strong>
                <small>
                  {tr(
                    "验证链接会发送到注册时填写的邮箱。",
                    "登録時のメールアドレスに確認リンクを送信します。",
                    "We will send a verification link to the email used during registration.",
                  )}
                </small>
              </span>
            </div>
            <button
              className="ticket-button-secondary"
              type="button"
              disabled={busy}
              onClick={() => void requestEmailVerification()}
            >
              {busy ? (
                <span className="button-spinner" aria-hidden="true" />
              ) : (
                <RefreshCw size={16} />
              )}
              {tr("重新发送", "再送する", "Resend email")}
            </button>
          </section>
        )}
        <form className="profile-settings" onSubmit={(event) => void updateDisplayName(event)}>
          <label htmlFor="profile-display-name">
            <span>{tr("修改昵称", "表示名を変更", "Change display name")}</span>
            <small>
              {tr(
                "昵称会公开显示且不能重复，每 30 天可修改一次",
                "公開・一意で、変更は30日に1回です",
                "Public and unique; one change every 30 days",
              )}
            </small>
          </label>
          <input
            id="profile-display-name"
            name="displayName"
            minLength={2}
            maxLength={24}
            placeholder={user.displayName}
            value={newDisplayName}
            onChange={(event) => setNewDisplayName(event.target.value)}
          />
          <button className="ticket-button-secondary" disabled={busy || !newDisplayName.trim()}>
            {tr("保存", "保存", "Save")}
          </button>
        </form>
        {message && (
          <div className="profile-message" role="status">
            {message}
          </div>
        )}
        <section className="danger-zone">
          <div>
            <Trash2 size={20} />
            <span>
              <strong>{tr("删除账号", "アカウントを削除", "Delete account")}</strong>
              <small>
                {deletion.data?.cancellable && deletion.data.scheduledFor
                  ? locale === "zh-CN"
                    ? `将在 ${new Date(deletion.data.scheduledFor).toLocaleString("zh-CN")} 后执行；现在仍可撤销。`
                    : locale === "ja"
                      ? `${new Date(deletion.data.scheduledFor).toLocaleString("ja")} 以降に実行予定です。現在は取り消せます。`
                      : `Scheduled after ${new Date(deletion.data.scheduledFor).toLocaleString(locale)}; cancellation is still available.`
                  : locale === "zh-CN"
                    ? "申请后有 7 天撤销期；随后删除个人信息与私人回放，历史赛果匿名化。"
                    : locale === "ja"
                      ? "申請後7日間は取り消せます。その後、個人情報と非公開リプレイを削除し、履歴を匿名化します。"
                      : "A 7-day grace period applies, then private data is purged and history anonymized."}
              </small>
            </span>
          </div>
          <button
            className={deletion.data?.cancellable ? "ticket-button-secondary" : "danger-button"}
            type="button"
            disabled={busy}
            onClick={() => void (deletion.data?.cancellable ? cancelDeletion() : requestDeletion())}
          >
            {deletion.data?.cancellable
              ? locale === "zh-CN"
                ? "撤销删除"
                : locale === "ja"
                  ? "削除を取り消す"
                  : "Cancel deletion"
              : locale === "zh-CN"
                ? "申请删除"
                : locale === "ja"
                  ? "削除を申請"
                  : "Request deletion"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell account-page auth-layout">
      <section className="auth-intro">
        <p className="eyebrow">{tr("账号与战绩", "アカウントと戦績", "ACCOUNT & PROGRESS")}</p>
        <h1>
          {locale === "zh-CN"
            ? "登录后可以保留并同步战绩。"
            : locale === "ja"
              ? "まず遊んで、あとで名前を残そう。"
              : "Play first. Claim your name later."}
        </h1>
        <p>{t("account.guestHint")}</p>
        <ul>
          <li>
            <ShieldCheck size={18} />
            <span>
              {locale === "zh-CN"
                ? "未登录时，战绩与当前浏览器关联；注册后会自动合并。"
                : locale === "ja"
                  ? "ゲストの非公開 Elo は登録時に重複なく安全に統合されます。"
                  : "Guest Elo merges safely on registration without stacking."}
            </span>
          </li>
          <li>
            <KeyRound size={18} />
            <span>
              {locale === "zh-CN"
                ? "账号只用于登录，不会公开；昵称会显示给其他玩家。"
                : locale === "ja"
                  ? "ログイン名は非公開かつ変更不可、表示名は公開・一意です。"
                  : "Login names stay private and immutable; display names are public and unique."}
            </span>
          </li>
          <li>
            <AtSign size={18} />
            <span>
              {locale === "zh-CN"
                ? "邮箱可选；完成验证后可用于找回密码。"
                : locale === "ja"
                  ? "メールは任意です。確認後、アカウント復旧に使用できます。"
                  : "Email is optional and can be used for recovery after verification."}
            </span>
          </li>
        </ul>
        <Link className="guest-stats-link" to="/stats">
          <BarChart3 size={17} />
          {locale === "zh-CN"
            ? "查看本机访客战绩"
            : locale === "ja"
              ? "ゲスト戦績を見る"
              : "View guest stats"}
        </Link>
      </section>
      <section className="auth-panel">
        <div
          className="auth-tabs"
          role="tablist"
          aria-label={tr(
            "登录或创建账号",
            "ログインまたはアカウント作成",
            "Sign in or create account",
          )}
        >
          <button
            id="account-tab-login"
            role="tab"
            aria-selected={tab === "login"}
            aria-controls="account-panel-login"
            tabIndex={tab === "login" ? 0 : -1}
            className={tab === "login" ? "active" : undefined}
            onClick={() => setTab("login")}
            onKeyDown={moveAuthTabFocus}
          >
            <LogIn size={16} />
            {t("account.signIn")}
          </button>
          <button
            id="account-tab-register"
            role="tab"
            aria-selected={tab === "register"}
            aria-controls="account-panel-register"
            tabIndex={tab === "register" ? 0 : -1}
            className={tab === "register" ? "active" : undefined}
            onClick={() => setTab("register")}
            onKeyDown={moveAuthTabFocus}
          >
            <UserPlus size={16} />
            {t("account.create")}
          </button>
        </div>
        {tab === "login" ? (
          <form
            id="account-panel-login"
            className="auth-form"
            role="tabpanel"
            aria-labelledby="account-tab-login"
            onSubmit={(event) => void submitLogin(event)}
          >
            <label>
              <span>{t("account.loginName")}</span>
              <input
                name="loginName"
                required
                spellCheck={false}
                autoCapitalize="none"
                autoComplete="username"
                value={login.loginName}
                onChange={(event) => setLogin({ ...login, loginName: event.target.value })}
              />
            </label>
            <label>
              <span>{t("account.password")}</span>
              <input
                name="password"
                required
                type="password"
                autoComplete="current-password"
                value={login.password}
                onChange={(event) => setLogin({ ...login, password: event.target.value })}
              />
            </label>
            <button className="ticket-button" disabled={busy}>
              {busy ? <span className="button-spinner" /> : <LogIn size={17} />}{" "}
              {t("account.signIn")}
            </button>
            <Link className="text-button" to="/recover">
              {locale === "zh-CN"
                ? "忘记密码？"
                : locale === "ja"
                  ? "パスワードを忘れた場合"
                  : "Forgot password?"}
            </Link>
          </form>
        ) : (
          <form
            id="account-panel-register"
            className="auth-form"
            role="tabpanel"
            aria-labelledby="account-tab-register"
            onSubmit={(event) => void submitRegister(event)}
          >
            <label>
              <span>
                {t("account.loginName")}
                <small>
                  {tr(
                    "不会公开，注册后不可修改",
                    "非公開・登録後は変更不可",
                    "PRIVATE · CANNOT BE CHANGED",
                  )}
                </small>
              </span>
              <input
                name="loginName"
                required
                spellCheck={false}
                autoCapitalize="none"
                minLength={3}
                maxLength={32}
                pattern="[A-Za-z0-9_]+"
                autoComplete="username"
                value={register.loginName}
                onChange={(event) => setRegister({ ...register, loginName: event.target.value })}
              />
            </label>
            <label>
              <span>
                {t("account.displayName")}
                <small>
                  {tr("公开显示，不能与他人重复", "公開表示・重複不可", "PUBLIC · MUST BE UNIQUE")}
                </small>
              </span>
              <input
                name="displayName"
                required
                minLength={2}
                maxLength={24}
                value={register.displayName}
                onChange={(event) => setRegister({ ...register, displayName: event.target.value })}
              />
            </label>
            <label>
              <span>
                {t("account.email")}
                <small>
                  {tr(
                    "填写后需验证，验证后才能用于找回密码",
                    "入力後に確認すると、パスワード再設定に使用できます",
                    "Verify it before using it for password recovery",
                  )}
                </small>
              </span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                value={register.email ?? ""}
                onChange={(event) =>
                  setRegister({ ...register, email: event.target.value || undefined })
                }
              />
            </label>
            <label>
              <span>
                {t("account.password")}
                <small>
                  {tr(
                    `至少 ${PASSWORD_MIN_LENGTH} 位`,
                    `${PASSWORD_MIN_LENGTH}文字以上`,
                    `${PASSWORD_MIN_LENGTH}+ CHARACTERS`,
                  )}
                </small>
              </span>
              <input
                name="password"
                required
                minLength={PASSWORD_MIN_LENGTH}
                type="password"
                autoComplete="new-password"
                value={register.password}
                onChange={(event) => setRegister({ ...register, password: event.target.value })}
              />
            </label>
            <button className="ticket-button" disabled={busy}>
              {busy ? <span className="button-spinner" /> : <UserPlus size={17} />}{" "}
              {t("account.register")}
            </button>
          </form>
        )}
        {message && (
          <div className="auth-error" role="alert">
            {message}
          </div>
        )}
      </section>
    </main>
  );
}
