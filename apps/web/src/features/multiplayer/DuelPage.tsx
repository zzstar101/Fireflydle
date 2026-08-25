import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Clock3,
  DoorOpen,
  Hash,
  Radio,
  ShieldCheck,
  Swords,
  UsersRound,
  WifiOff,
} from "lucide-react";
import {
  MatchmakingResultSchema,
  type ActivityId,
  type ContentModeId,
  type MatchFormat,
  type MatchmakingResult,
  type RoomApiResponse,
  type RoomMaxAttempts,
  type RoomModifier,
  type RoomPreviewResponse,
  type RoomRoundTimeSeconds,
} from "@fireflydle/contracts";
import { Link, useNavigate } from "react-router-dom";
import { apiRequest, ensureSession, getWebSocketUrl } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { usePreferences } from "../../state/preferences";
import { useSession } from "../account/useSession";
import "./multiplayer.css";

export default function DuelPage({ activityIds }: { activityIds: readonly ActivityId[] }) {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const session = useSession();
  const navigate = useNavigate();
  const [format, setFormat] = useState<MatchFormat>(3);
  const [modeId, setModeId] = useState<ContentModeId>("playable");
  const [roundTimeSeconds, setRoundTimeSeconds] = useState<RoomRoundTimeSeconds>(90);
  const [maxAttempts, setMaxAttempts] = useState<RoomMaxAttempts>(6);
  const [modifier, setModifier] = useState<RoomModifier>(null);
  const [roomCode, setRoomCode] = useState("");
  const [roomPreview, setRoomPreview] = useState<RoomPreviewResponse | null>(null);
  const [busy, setBusy] = useState<"match" | "create" | "join" | null>(null);
  const [matchTicket, setMatchTicket] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accountRequired, setAccountRequired] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const rankedMatchEnabled = activityIds.includes("ranked-match");
  const privateRoomEnabled = activityIds.includes("private-room");

  const openMatchedRoom = (result: Extract<MatchmakingResult, { status: "matched" }>) => {
    navigate(`/room/${result.roomId}`, {
      state: { roomCode: result.roomCode, matchTicket: result.ticketId },
    });
  };

  const action = async (kind: "match" | "create" | "join") => {
    if ((kind === "match" && !rankedMatchEnabled) || (kind !== "match" && !privateRoomEnabled)) {
      return;
    }
    if (kind === "match" && session.data?.user.isGuest) {
      setAccountRequired(true);
      setError(null);
      return;
    }
    setBusy(kind);
    setAccountRequired(false);
    setError(null);
    try {
      await ensureSession();
      if (kind === "match") {
        const result = await apiRequest<MatchmakingResult>("/matchmaking", { method: "POST" });
        if (result.status === "matched") {
          openMatchedRoom(result);
        } else {
          setMatchTicket(result.ticketId);
        }
        return;
      }
      const response =
        kind === "create"
          ? await apiRequest<RoomApiResponse>("/rooms", {
              method: "POST",
              body: JSON.stringify({
                modeId,
                activityId: "private-room",
                format,
                roundTimeSeconds,
                maxAttempts,
                modifier,
              }),
            })
          : roomPreview
            ? await apiRequest<RoomApiResponse>("/rooms/join", {
                method: "POST",
                body: JSON.stringify({ code: roomCode }),
              })
            : await apiRequest<RoomPreviewResponse>(
                `/rooms/preview?code=${encodeURIComponent(roomCode)}`,
              );
      if (kind === "join" && !roomPreview) {
        setRoomPreview(response as RoomPreviewResponse);
        return;
      }
      navigate(`/room/${response.roomId}`, { state: { roomCode: response.code } });
    } catch {
      setError(
        locale === "zh-CN"
          ? "对战功能暂时不可用，请稍后重试。"
          : locale === "ja"
            ? "対戦機能を一時的に利用できません。しばらくしてからお試しください。"
            : "Duels are temporarily unavailable. Please try again later.",
      );
    } finally {
      setBusy(null);
    }
  };

  const cancelMatchmaking = async () => {
    if (!matchTicket) return;
    try {
      await apiRequest(`/matchmaking/${matchTicket}`, { method: "DELETE" });
    } catch {
      // 票据也会自动过期，取消失败不阻塞返回大厅。
    }
    setMatchTicket(null);
  };

  useEffect(() => {
    if (!matchTicket) return;
    let disposed = false;
    let retryTimer: number | undefined;
    let socket: WebSocket | undefined;

    const connect = () => {
      if (disposed) return;
      socket = new WebSocket(
        getWebSocketUrl(`/matchmaking/socket?ticketId=${encodeURIComponent(matchTicket)}`),
      );
      socket.onmessage = (event) => {
        try {
          const payload: unknown = JSON.parse(String(event.data));
          if (!payload || typeof payload !== "object" || !("type" in payload)) {
            throw new Error("Invalid matchmaking message");
          }
          const message = payload as { type: unknown; result?: unknown };
          if (message.type !== "matchmaking") throw new Error("Invalid matchmaking message");
          if (message.result === null) {
            setMatchTicket(null);
            setError(
              locale === "zh-CN"
                ? "匹配已超时，请重新匹配。"
                : locale === "ja"
                  ? "マッチングチケットの有効期限が切れました。もう一度お試しください。"
                  : "The matchmaking ticket expired. Please try again.",
            );
            return;
          }
          const result = MatchmakingResultSchema.safeParse(message.result);
          if (!result.success) throw new Error("Invalid matchmaking result");
          if (result.data.status === "matched") openMatchedRoom(result.data);
        } catch {
          setError(t("error.generic"));
        }
      };
      socket.onclose = () => {
        if (!disposed) retryTimer = window.setTimeout(connect, 1_500);
      };
      socket.onerror = () => socket?.close();
    };

    // 延后一拍可让 React 开发期 StrictMode 的探测挂载先完成清理，避免制造幽灵连接。
    retryTimer = window.setTimeout(connect, 0);
    return () => {
      disposed = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      socket?.close(1000, "lobby-left");
    };
  }, [locale, matchTicket, navigate, t]);

  useEffect(() => {
    if (!matchTicket) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cancelButtonRef.current?.focus();
    const timeout = window.setTimeout(
      () => {
        setMatchTicket(null);
        setError(
          locale === "zh-CN"
            ? "匹配已超时，请重新匹配。"
            : locale === "ja"
              ? "10分を超えたため、もう一度マッチングしてください。"
              : "Matchmaking exceeded 10 minutes. Please try again.",
        );
      },
      10 * 60 * 1_000 + 2_000,
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void cancelMatchmaking();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [locale, matchTicket]);

  const formats = [1, 3, 5, 7] as const satisfies readonly MatchFormat[];
  const moveFormatFocus = (event: ReactKeyboardEvent<HTMLButtonElement>, current: MatchFormat) => {
    const index = formats.indexOf(current);
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % formats.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + formats.length) % formats.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = formats.length - 1;
    }
    if (nextIndex === null) return;
    event.preventDefault();
    const next = formats[nextIndex];
    if (!next) return;
    setFormat(next);
    event.currentTarget.parentElement
      ?.querySelector<HTMLButtonElement>(`button[data-format="${next}"]`)
      ?.focus();
  };

  return (
    <main className="page-shell duel-page">
      <PageHeader
        eyebrow={t("duel.eyebrow")}
        title={t("duel.title")}
        intro={t("duel.intro")}
        aside={
          <div className="duel-live">
            <Radio size={17} />
            <span>{locale === "zh-CN" ? "在线" : locale === "ja" ? "オンライン" : "LIVE"}</span>
            <strong>BO3</strong>
          </div>
        }
      />

      <section
        className={`duel-stage${rankedMatchEnabled ? " has-ranked" : ""}`}
        inert={matchTicket ? true : undefined}
      >
        <div className="duel-signal" aria-hidden="true">
          <span>{locale === "zh-CN" ? "你" : locale === "ja" ? "あなた" : "YOU"}</span>
          <i />
          <b>VS</b>
          <i />
          <span>{locale === "zh-CN" ? "对手" : locale === "ja" ? "相手" : "RIVAL"}</span>
        </div>
        {rankedMatchEnabled ? (
          <article className="match-card primary-match-card">
            <div className="match-card-number">01 / RANKED</div>
            <Swords size={34} aria-hidden="true" />
            <h2>{t("duel.matchmaking")}</h2>
            <p>{t("duel.ranked")}</p>
            <div className="elo-band">
              <span>ELO</span>
              <strong>{session.data?.user.elo ?? 1000}</strong>
              <small>
                {locale === "zh-CN"
                  ? "±100 → 90 秒后不限"
                  : locale === "ja"
                    ? "±100 → 90秒後は無制限"
                    : "±100 → open after 90s"}
              </small>
            </div>
            <button
              className="ticket-button"
              type="button"
              disabled={busy !== null || Boolean(matchTicket) || session.isPending}
              onClick={() => void action("match")}
            >
              {busy === "match" ? <span className="button-spinner" /> : <Radio size={17} />}{" "}
              {t("duel.matchmaking")} <ArrowRight size={16} />
            </button>
          </article>
        ) : null}

        {privateRoomEnabled ? (
          <article className="match-card">
            <div className="match-card-number">{rankedMatchEnabled ? "02" : "01"} / PRIVATE</div>
            <DoorOpen size={32} aria-hidden="true" />
            <h2>{t("duel.create")}</h2>
            <p>{t("duel.unranked")}</p>
            <div className="format-picker" role="radiogroup" aria-label={t("duel.format")}>
              {formats.map((value) => (
                <button
                  key={value}
                  data-format={value}
                  type="button"
                  role="radio"
                  aria-checked={format === value}
                  tabIndex={format === value ? 0 : -1}
                  disabled={Boolean(matchTicket)}
                  className={format === value ? "active" : undefined}
                  onClick={() => setFormat(value)}
                  onKeyDown={(event) => moveFormatFocus(event, value)}
                >
                  BO{value}
                </button>
              ))}
            </div>
            <div className="room-config-fields">
              <label>
                <span>
                  {locale === "zh-CN" ? "内容模式" : locale === "ja" ? "モード" : "Content mode"}
                </span>
                <select
                  value={modeId}
                  disabled={Boolean(matchTicket)}
                  onChange={(event) => {
                    const next = event.target.value as ContentModeId;
                    setModeId(next);
                    setMaxAttempts(next === "aeon" ? 8 : 6);
                    if (next === "aeon" && modifier === "fog") setModifier(null);
                  }}
                >
                  <option value="playable">{locale === "zh-CN" ? "普通角色" : "Playable"}</option>
                  <option value="currency-wars">
                    {locale === "zh-CN" ? "货币战争" : "Currency Wars"}
                  </option>
                  <option value="aeon">{locale === "zh-CN" ? "星神" : "Aeons"}</option>
                </select>
              </label>
              <label>
                <span>
                  {locale === "zh-CN" ? "每题计时" : locale === "ja" ? "制限時間" : "Round time"}
                </span>
                <select
                  value={roundTimeSeconds ?? "unlimited"}
                  disabled={Boolean(matchTicket)}
                  onChange={(event) =>
                    setRoundTimeSeconds(
                      event.target.value === "unlimited"
                        ? null
                        : (Number(event.target.value) as RoomRoundTimeSeconds),
                    )
                  }
                >
                  <option value="unlimited" disabled={modifier === "speed"}>
                    {locale === "zh-CN" ? "不限时" : locale === "ja" ? "無制限" : "Unlimited"}
                  </option>
                  {[30, 60, 90].map((seconds) => (
                    <option key={seconds} value={seconds}>
                      {seconds} {locale === "zh-CN" ? "秒" : locale === "ja" ? "秒" : "seconds"}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>
                  {locale === "zh-CN" ? "特殊规则" : locale === "ja" ? "特殊ルール" : "Modifier"}
                </span>
                <select
                  value={modifier ?? "none"}
                  disabled={Boolean(matchTicket)}
                  onChange={(event) => {
                    const value = event.target.value;
                    setModifier(value === "speed" || value === "fog" ? value : null);
                    if (value === "speed" && roundTimeSeconds === null) setRoundTimeSeconds(90);
                  }}
                >
                  <option value="none">
                    {locale === "zh-CN" ? "无" : locale === "ja" ? "なし" : "None"}
                  </option>
                  <option value="fog" disabled={modeId === "aeon"}>
                    {locale === "zh-CN" ? "迷雾" : locale === "ja" ? "霧" : "Fog"}
                  </option>
                  <option value="speed">
                    {locale === "zh-CN" ? "极速：每错一次 -5 秒" : "Speed: -5s per miss"}
                  </option>
                </select>
              </label>
              <label>
                <span>
                  {locale === "zh-CN" ? "每题猜测" : locale === "ja" ? "推測回数" : "Guesses"}
                </span>
                <select
                  value={maxAttempts}
                  disabled={Boolean(matchTicket)}
                  onChange={(event) =>
                    setMaxAttempts(Number(event.target.value) as RoomMaxAttempts)
                  }
                >
                  {[modeId === "aeon" ? 8 : 6].map((attempts) => (
                    <option key={attempts} value={attempts}>
                      {attempts} {locale === "zh-CN" ? "猜" : locale === "ja" ? "回" : "guesses"}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button
              className="ticket-button-secondary"
              type="button"
              disabled={busy !== null || Boolean(matchTicket)}
              onClick={() => void action("create")}
            >
              {busy === "create" ? <span className="button-spinner" /> : <UsersRound size={17} />}{" "}
              {t("duel.create")}
            </button>
          </article>
        ) : null}

        {privateRoomEnabled ? (
          <article className="match-card">
            <div className="match-card-number">{rankedMatchEnabled ? "03" : "02"} / INVITE</div>
            <Hash size={32} aria-hidden="true" />
            <h2>{t("duel.join")}</h2>
            <p>
              {locale === "zh-CN"
                ? "输入好友分享的 5 位房间码。"
                : locale === "ja"
                  ? "友達から共有された5桁のコードを入力。"
                  : "Enter the 5-character code shared by a friend."}
            </p>
            <label className="room-code-input">
              <span className="sr-only">{t("duel.roomCode")}</span>
              <input
                value={roomCode}
                maxLength={5}
                placeholder="A7K9P"
                disabled={Boolean(matchTicket)}
                onChange={(event) => {
                  setRoomCode(event.target.value.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, ""));
                  setRoomPreview(null);
                }}
              />
            </label>
            {roomPreview ? (
              <div className="room-preview" role="status">
                <strong>
                  {locale === "zh-CN"
                    ? "加入前确认"
                    : locale === "ja"
                      ? "参加前の確認"
                      : "Confirm settings"}
                </strong>
                <span>BO{roomPreview.configuration.format}</span>
                <span>
                  {roomPreview.configuration.roundTimeSeconds === null
                    ? locale === "zh-CN"
                      ? "不限时"
                      : locale === "ja"
                        ? "無制限"
                        : "Unlimited"
                    : `${roomPreview.configuration.roundTimeSeconds}s`}
                </span>
                <span>
                  {roomPreview.configuration.maxAttempts}{" "}
                  {locale === "zh-CN" ? "猜" : locale === "ja" ? "回" : "guesses"}
                </span>
                <span>
                  {roomPreview.configuration.modifier === "fog"
                    ? locale === "zh-CN"
                      ? "迷雾"
                      : locale === "ja"
                        ? "霧"
                        : "Fog"
                    : locale === "zh-CN"
                      ? "无特殊规则"
                      : locale === "ja"
                        ? "特殊ルールなし"
                        : "No modifier"}
                </span>
              </div>
            ) : null}
            <button
              className="ticket-button-secondary"
              type="button"
              disabled={busy !== null || Boolean(matchTicket) || roomCode.length !== 5}
              onClick={() => void action("join")}
            >
              {busy === "join" ? <span className="button-spinner" /> : <DoorOpen size={17} />}{" "}
              {roomPreview
                ? t("duel.join")
                : locale === "zh-CN"
                  ? "查看房间配置"
                  : locale === "ja"
                    ? "設定を確認"
                    : "Review room"}
            </button>
          </article>
        ) : null}
      </section>

      {matchTicket && (
        <div className="matchmaking-backdrop">
          <section
            ref={dialogRef}
            className="matchmaking-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="matchmaking-title"
          >
            <span className="room-radar" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <p className="eyebrow">
              {locale === "zh-CN" ? "正在匹配" : locale === "ja" ? "マッチング中" : "MATCHMAKING"}
            </p>
            <h2 id="matchmaking-title">
              {locale === "zh-CN"
                ? "正在寻找接近你 Elo 的对手"
                : locale === "ja"
                  ? "近い Elo の相手を検索中"
                  : "Finding a nearby Elo opponent"}
            </h2>
            <p>
              {locale === "zh-CN"
                ? "搜索范围会随等待时间逐步扩大。关闭页面不会立即取消票据。"
                : locale === "ja"
                  ? "待ち時間に応じて検索範囲を広げます。ページを閉じてもチケットはしばらく保持されます。"
                  : "The rating range expands as you wait. The ticket remains briefly if the page closes."}
            </p>
            <button
              ref={cancelButtonRef}
              className="ticket-button-secondary"
              type="button"
              onClick={() => void cancelMatchmaking()}
            >
              {t("common.cancel")}
            </button>
          </section>
        </div>
      )}

      {error && (
        <div className="duel-error" role="alert">
          <WifiOff size={18} />
          <span>{error}</span>
        </div>
      )}

      {accountRequired && (
        <section className="duel-account-notice" role="status">
          <ShieldCheck size={19} aria-hidden="true" />
          <span>
            <strong>
              {locale === "zh-CN"
                ? "登录后才能进入天梯匹配"
                : locale === "ja"
                  ? "ランクマッチにはログインが必要です"
                  : "Sign in to enter ranked matchmaking"}
            </strong>
            {locale === "zh-CN"
              ? "私人房间仍可直接创建或加入。"
              : locale === "ja"
                ? "プライベートルームはそのまま利用できます。"
                : "Private rooms remain available without signing in."}
          </span>
          <Link className="ticket-button-secondary" to="/account">
            {t("account.signIn")}
          </Link>
        </section>
      )}

      <section className="duel-rules">
        <div>
          <Clock3 size={20} />
          <span>{t("duel.ruleTime")}</span>
          <small>ROUND CLOCK</small>
        </div>
        <div>
          <ShieldCheck size={20} />
          <span>{t("duel.ruleGuess")}</span>
          <small>UNIQUE GUESSES</small>
        </div>
        <div>
          <WifiOff size={20} />
          <span>{t("duel.ruleReconnect")}</span>
          <small>ONE PAUSE / PLAYER</small>
        </div>
      </section>
    </main>
  );
}
