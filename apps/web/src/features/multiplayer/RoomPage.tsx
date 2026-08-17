import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Check,
  Clock3,
  CircleDot,
  Copy,
  LogOut,
  Radio,
  ShieldAlert,
  SkipForward,
  Trophy,
  UserRound,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";
import { GUESS_FIELDS, ServerRoomMessageSchema, type RoomSnapshot } from "@fireflydle/contracts";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { contentManifest } from "@fireflydle/game-data";
import { apiRequest, getWebSocketUrl } from "../../api/client";
import { CharacterCombobox } from "../game/CharacterCombobox";
import { GuessBoard } from "../game/GuessBoard";
import { CharacterAvatar } from "../../components/CharacterAvatar";
import { usePreferences } from "../../state/preferences";
import { useSession } from "../account/useSession";
import { bundledRosterFor, contentRosterQueryOptions } from "../game/content-roster";
import { getDefaultMode, getDefaultModeNavigation } from "../modes/mode-registry";
import "../game/game.css";
import "./multiplayer.css";

const duelLobbyPath = getDefaultModeNavigation("duel")?.path ?? getDefaultMode().path;

function formatSeconds(milliseconds: number) {
  return Math.max(0, Math.ceil(milliseconds / 1000))
    .toString()
    .padStart(2, "0");
}

function getMatchTicket(state: unknown): string | null {
  if (!state || typeof state !== "object" || !("matchTicket" in state)) return null;
  const ticket = (state as { matchTicket?: unknown }).matchTicket;
  return typeof ticket === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ticket)
    ? ticket
    : null;
}

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const tr = (zh: string, ja: string, en: string) =>
    locale === "zh-CN" ? zh : locale === "ja" ? ja : en;
  const session = useSession();
  const [snapshot, setSnapshot] = useState<RoomSnapshot | null>(null);
  const [connection, setConnection] = useState<"connecting" | "open" | "closed">("connecting");
  const [error, setError] = useState<string | null>(null);
  const [guessPending, setGuessPending] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [codeCopied, setCodeCopied] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const leavingRef = useRef(false);
  const acknowledgedRef = useRef(false);
  const matchTicket = getMatchTicket(location.state);
  const rosterQuery = useQuery(
    contentRosterQueryOptions("playable", contentManifest.manifestVersion),
  );
  const roster = rosterQuery.data ?? bundledRosterFor("playable");

  const acknowledgeMatchTicket = useCallback(async () => {
    if (!matchTicket || acknowledgedRef.current) return true;
    try {
      await apiRequest(`/matchmaking/${matchTicket}/ack`, { method: "POST" });
      acknowledgedRef.current = true;
      return true;
    } catch {
      return false;
    }
  }, [matchTicket]);

  useEffect(() => {
    if (!roomId) return;
    leavingRef.current = false;
    let disposed = false;
    let retryTimer: number | undefined;
    let attempt = 0;

    const connect = () => {
      if (disposed || leavingRef.current) return;
      setConnection("connecting");
      const socket = new WebSocket(getWebSocketUrl(`/rooms/${roomId}/socket`));
      socketRef.current = socket;
      socket.onopen = () => {
        attempt = 0;
        setConnection("open");
      };
      socket.onclose = () => {
        if (disposed || leavingRef.current) return;
        setGuessPending(false);
        setConnection("closed");
        const delay = Math.min(5_000, 600 * 2 ** attempt);
        attempt += 1;
        retryTimer = window.setTimeout(connect, delay);
      };
      socket.onerror = () => socket.close();
      socket.onmessage = (event) => {
        try {
          const parsed = ServerRoomMessageSchema.safeParse(JSON.parse(String(event.data)));
          if (!parsed.success) throw new Error("Invalid room message");
          const message = parsed.data;
          if (message.type === "snapshot") setSnapshot(message.snapshot);
          if (message.type === "error") {
            setGuessPending(false);
            setError(message.code);
          }
        } catch {
          setError("INTERNAL_ERROR");
        }
      };
    };

    // 延后一拍可让 React 开发期 StrictMode 的探测挂载先完成清理，避免制造幽灵连接。
    retryTimer = window.setTimeout(connect, 0);
    return () => {
      disposed = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      socketRef.current?.close(1000, "page-left");
    };
  }, [roomId]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (snapshot?.state !== "playing" || snapshot.ownGuesses.length) setGuessPending(false);
  }, [snapshot?.ownGuesses.length, snapshot?.state]);

  useEffect(() => {
    if (snapshot?.state !== "finished" || !matchTicket || acknowledgedRef.current) return;
    let disposed = false;
    let retryTimer: number | undefined;
    let attempts = 0;
    const acknowledge = async () => {
      attempts += 1;
      const acknowledged = await acknowledgeMatchTicket();
      if (!acknowledged && !disposed && attempts < 4) {
        retryTimer = window.setTimeout(() => void acknowledge(), 500 * attempts);
      }
    };
    void acknowledge();
    return () => {
      disposed = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
    };
  }, [acknowledgeMatchTicket, matchTicket, snapshot?.state]);

  const ownGuessedIds = useMemo(
    () => new Set(snapshot?.ownGuesses.map((guess) => guess.character.id) ?? []),
    [snapshot],
  );
  const timeLeft = snapshot?.roundEndsAt
    ? snapshot.roundEndsAt - now
    : snapshot?.reconnectDeadline
      ? snapshot.reconnectDeadline - now
      : snapshot?.nextRoundAt
        ? snapshot.nextRoundAt - now
        : 0;
  const clockLabel =
    snapshot?.configuration.roundTimeSeconds === null && snapshot.state === "playing"
      ? "∞"
      : formatSeconds(timeLeft);
  const canGuess = connection === "open" && snapshot?.state === "playing";
  const roomStateLabel = snapshot
    ? snapshot.state === "waiting"
      ? tr("等待对手", "対戦相手を待機", "WAITING")
      : snapshot.state === "playing"
        ? tr("对局进行中", "対戦中", "PLAYING")
        : snapshot.state === "paused"
          ? tr("等待重连", "再接続待ち", "RECONNECT")
          : snapshot.state === "round-ended"
            ? tr("本回合结束", "ラウンド終了", "ROUND ENDED")
            : tr("对战结束", "対戦終了", "FINISHED")
    : "";
  const liveStatus = snapshot
    ? tr(
        `${roomStateLabel}。比分 ${snapshot.players.map((player) => player.score).join(" 比 ")}。你已猜 ${snapshot.ownGuesses.length} 次，对手已猜 ${snapshot.opponentFeedback.length} 次。`,
        `${roomStateLabel}。スコア ${snapshot.players.map((player) => player.score).join(" 対 ")}。あなたは${snapshot.ownGuesses.length}回、相手は${snapshot.opponentFeedback.length}回検索しました。`,
        `${roomStateLabel}. Score ${snapshot.players.map((player) => player.score).join(" to ")}. You have made ${snapshot.ownGuesses.length} guesses; your opponent has made ${snapshot.opponentFeedback.length}.`,
      )
    : "";

  const submit = (characterId: string) => {
    if (connection !== "open") return;
    setGuessPending(true);
    socketRef.current?.send(
      JSON.stringify({ type: "guess", characterId, actionId: crypto.randomUUID() }),
    );
  };
  const offerDraw = () => socketRef.current?.send(JSON.stringify({ type: "offer-draw" }));
  const respondDraw = (accepted: boolean) =>
    socketRef.current?.send(JSON.stringify({ type: "respond-draw", accepted }));
  const requestSkip = () => socketRef.current?.send(JSON.stringify({ type: "request-skip" }));
  const respondSkip = (accepted: boolean) =>
    socketRef.current?.send(JSON.stringify({ type: "respond-skip", accepted }));
  const leave = async () => {
    if (
      snapshot &&
      ["playing", "paused", "round-ended"].includes(snapshot.state) &&
      !window.confirm(
        locale === "zh-CN"
          ? "现在离开会判负，确定退出吗？"
          : locale === "ja"
            ? "今退出すると敗北になります。退出しますか？"
            : "Leaving now forfeits the match. Continue?",
      )
    ) {
      return;
    }
    if (snapshot?.state === "finished") await acknowledgeMatchTicket();
    leavingRef.current = true;
    socketRef.current?.send(JSON.stringify({ type: "leave" }));
    if (roomId) {
      try {
        await apiRequest(`/rooms/${roomId}/leave`, { method: "POST" });
      } catch {
        // WebSocket leave 与 HTTP leave 任一成功即可完成可靠退出。
      }
    }
    navigate(duelLobbyPath, { replace: true });
  };

  const copyRoomCode = async () => {
    if (!snapshot) return;
    try {
      await navigator.clipboard.writeText(snapshot.code);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 1_800);
    } catch {
      setError("INTERNAL_ERROR");
    }
  };

  return (
    <main className="page-shell room-page">
      {snapshot ? (
        <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
          {liveStatus}
        </p>
      ) : null}
      <header className="room-header">
        <div>
          <p className="eyebrow">LIVE ROOM · {snapshot?.code ?? "-----"}</p>
          <h1>
            {snapshot ? `BO${snapshot.format} · ROUND ${snapshot.round}` : t("common.loading")}
          </h1>
        </div>
        <div className={`connection-badge ${connection}`}>
          <Radio size={15} />{" "}
          {connection === "open"
            ? t("common.online")
            : connection === "connecting"
              ? t("common.loading")
              : t("common.offline")}
        </div>
        <button className="ticket-button-secondary" type="button" onClick={() => void leave()}>
          <LogOut size={16} />{" "}
          {locale === "zh-CN" ? "离开房间" : locale === "ja" ? "退出" : "Leave"}
        </button>
      </header>

      {!snapshot ? (
        <section className="room-waiting">
          <span className="room-radar">
            <i />
            <i />
            <i />
          </span>
          <h2>
            {connection === "closed"
              ? tr("无法连接对战房间", "対戦ルームに接続できません", "Unable to connect")
              : tr(
                  "正在连接对战房间",
                  "同期検索リンクを確立しています",
                  "Establishing synchronized search",
                )}
          </h2>
          <p>
            {connection === "closed"
              ? tr(
                  "房间可能已失效，请返回后重试。",
                  "ルームの有効期限が切れた可能性があります。戻ってもう一度お試しください。",
                  "The room may have expired. Go back and try again.",
                )
              : tr(
                  "房间会在第二名玩家加入后自动开始。",
                  "2人目のプレイヤーが参加すると自動的に開始します。",
                  "The round starts when the second player joins.",
                )}
          </p>
        </section>
      ) : (
        <>
          <section className="versus-scoreboard">
            {snapshot.players.map((player, index) => (
              <div key={player.playerId} className={`versus-player player-${index}`}>
                <span className="player-avatar">
                  <UserRound size={24} />
                </span>
                <span>
                  <small>
                    {index === 0
                      ? tr("玩家 A", "プレイヤー A", "PLAYER A")
                      : tr("玩家 B", "プレイヤー B", "PLAYER B")}
                  </small>
                  <strong>{player.displayName}</strong>
                  <i>
                    {player.connected ? <Wifi size={13} /> : <WifiOff size={13} />}{" "}
                    {player.connected
                      ? tr("已连接", "接続済み", "LINKED")
                      : tr("已离线", "オフライン", "OFFLINE")}
                  </i>
                </span>
                <b>{player.score}</b>
              </div>
            ))}
            <div className={`round-clock state-${snapshot.state}`}>
              <Clock3 size={18} />
              <strong>{clockLabel}</strong>
              <small>{roomStateLabel}</small>
            </div>
          </section>

          <section
            className="locked-room-config"
            aria-label={tr("已锁定的房间配置", "固定されたルーム設定", "Locked room settings")}
          >
            <span>{tr("普通角色", "通常キャラクター", "Characters")}</span>
            <strong>BO{snapshot.configuration.format}</strong>
            <span>
              {snapshot.configuration.roundTimeSeconds === null
                ? tr("不限时", "無制限", "Unlimited")
                : `${snapshot.configuration.roundTimeSeconds}s`}
            </span>
            <span>
              {snapshot.configuration.maxAttempts} {tr("猜", "回", "guesses")}
            </span>
            {snapshot.configuration.modifiers?.includes("speed") ? (
              <span>
                {tr("极速：错误 -5 秒", "スピード：ミスごとに -5 秒", "Speed: -5s per miss")}
              </span>
            ) : null}
            <small>
              {snapshot.state === "waiting"
                ? tr("等待对手加入", "対戦相手を待機", "Waiting for opponent")
                : tr("开局后已锁定", "開始後は固定", "Locked after start")}
            </small>
          </section>

          {snapshot.state === "waiting" && (
            <section className="invite-strip">
              <span className="room-state-signal state-waiting" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span>
                <Copy size={17} />
                {tr("邀请好友使用房间码", "ルームコードを共有", "Share room code")}
              </span>
              <strong>{snapshot.code}</strong>
              <button type="button" aria-live="polite" onClick={() => void copyRoomCode()}>
                {codeCopied
                  ? t("common.copied")
                  : locale === "zh-CN"
                    ? "复制"
                    : locale === "ja"
                      ? "コピー"
                      : "Copy"}
              </button>
            </section>
          )}
          {snapshot.state === "paused" && (
            <div className="pause-alert" role="alert">
              <ShieldAlert size={18} />
              <span>
                {locale === "zh-CN"
                  ? "连接中断，对局已暂停。30 秒内重连可恢复本回合。"
                  : locale === "ja"
                    ? "接続が切れたため対戦を一時停止しました。30秒以内に再接続すると再開できます。"
                    : "Connection lost. The match is paused for up to 30 seconds."}
              </span>
            </div>
          )}

          {snapshot.state === "playing" && (
            <section
              className={`skip-controls state-${snapshot.roundSkip.status}`}
              aria-label={tr("协商跳过本题", "問題のスキップ交渉", "Skip question")}
              role="status"
            >
              <SkipForward size={18} />
              {snapshot.roundSkip.status === "pending" &&
              snapshot.roundSkip.requestedByPlayerId === session.data?.user.id ? (
                <p>
                  {tr(
                    `已请求跳过，等待对手确认（${formatSeconds(snapshot.roundSkip.expiresAt - now)}）`,
                    `スキップを申請しました。相手の確認待ち（${formatSeconds(snapshot.roundSkip.expiresAt - now)}）`,
                    `Skip requested. Waiting for your opponent (${formatSeconds(snapshot.roundSkip.expiresAt - now)})`,
                  )}
                </p>
              ) : snapshot.roundSkip.status === "pending" ? (
                <>
                  <p>
                    {tr(
                      "对手请求跳过本题",
                      "相手が問題のスキップを申請しました",
                      "Your opponent wants to skip this question",
                    )}
                  </p>
                  <div>
                    <button
                      className="ticket-button"
                      type="button"
                      onClick={() => respondSkip(true)}
                    >
                      <Check size={16} /> {tr("同意跳过", "スキップ", "Skip")}
                    </button>
                    <button
                      className="ticket-button-secondary"
                      type="button"
                      onClick={() => respondSkip(false)}
                    >
                      <X size={16} /> {tr("拒绝", "拒否", "Decline")}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    {snapshot.roundSkip.status === "cancelled"
                      ? snapshot.roundSkip.reason === "timeout"
                        ? tr(
                            "跳过请求已超时，本题继续",
                            "申請がタイムアウトしました。この問題を続けます",
                            "Skip request timed out. This question continues",
                          )
                        : tr(
                            "跳过请求已拒绝，本题继续",
                            "申請は拒否されました。この問題を続けます",
                            "Skip request declined. This question continues",
                          )
                      : snapshot.roundSkip.status === "executed"
                        ? tr(
                            `第 ${snapshot.roundSkip.round} 题已共同跳过，双方均不得分`,
                            `第${snapshot.roundSkip.round}問は合意によりスキップされ、得点はありません`,
                            `Question ${snapshot.roundSkip.round} was skipped by agreement. No points awarded`,
                          )
                        : tr(
                            "需要对手同意才能跳过本题",
                            "相手の同意がある場合のみスキップできます",
                            "Your opponent must agree to skip",
                          )}
                  </p>
                  <button
                    className="ticket-button-secondary"
                    type="button"
                    disabled={connection !== "open"}
                    onClick={requestSkip}
                  >
                    {tr("请求跳过", "スキップを申請", "Request skip")}
                  </button>
                </>
              )}
            </section>
          )}

          {!["waiting", "finished"].includes(snapshot.state) && (
            <section
              className="draw-controls"
              aria-label={tr("平局协商", "引き分け交渉", "Draw offer")}
            >
              {snapshot.drawOfferByPlayerId === session.data?.user.id ? (
                <p>
                  {tr(
                    "已提出平局，等待对手回应",
                    "引き分けを提案しました。相手の返答を待っています",
                    "Draw offered. Waiting for your opponent",
                  )}
                </p>
              ) : snapshot.drawOfferByPlayerId ? (
                <>
                  <p>
                    {tr(
                      "对手提议本场平局",
                      "相手が引き分けを提案しました",
                      "Your opponent offered a draw",
                    )}
                  </p>
                  <div>
                    <button
                      className="ticket-button"
                      type="button"
                      onClick={() => respondDraw(true)}
                    >
                      <Check size={16} /> {tr("接受", "承諾", "Accept")}
                    </button>
                    <button
                      className="ticket-button-secondary"
                      type="button"
                      onClick={() => respondDraw(false)}
                    >
                      <X size={16} /> {tr("拒绝", "拒否", "Decline")}
                    </button>
                  </div>
                </>
              ) : (
                <button className="ticket-button-secondary" type="button" onClick={offerDraw}>
                  {tr("提议平局", "引き分けを提案", "Offer draw")}
                </button>
              )}
            </section>
          )}

          {(snapshot.state === "round-ended" || snapshot.state === "finished") &&
            snapshot.roundAnswer && (
              <section className="round-reveal" aria-labelledby="round-reveal-title">
                <CharacterAvatar character={snapshot.roundAnswer} size="large" />
                <div>
                  <p>
                    {snapshot.roundWinnerId
                      ? snapshot.roundWinnerId === session.data?.user.id
                        ? tr("你赢得本回合", "このラウンドに勝利", "ROUND WON")
                        : tr("对手赢得本回合", "相手がラウンド勝利", "RIVAL WON")
                      : tr("本回合平局", "このラウンドは引き分け", "ROUND DRAW")}
                  </p>
                  <h2 id="round-reveal-title">{snapshot.roundAnswer.names[locale]}</h2>
                  <span>
                    {snapshot.state === "round-ended"
                      ? tr(
                          `正确角色 · ${snapshot.nextRoundAt ? `${formatSeconds(snapshot.nextRoundAt - now)} 秒后进入下一回合` : "即将进入下一回合"}`,
                          `正解キャラクター · ${snapshot.nextRoundAt ? `${formatSeconds(snapshot.nextRoundAt - now)}秒後に次のラウンド` : "次のラウンドへ"}`,
                          `Correct character · ${snapshot.nextRoundAt ? `next round in ${formatSeconds(snapshot.nextRoundAt - now)}s` : "next round starting"}`,
                        )
                      : tr("本局正确角色", "このラウンドの正解", "Correct character")}
                  </span>
                </div>
              </section>
            )}

          {snapshot.state === "playing" && (
            <CharacterCombobox
              characters={roster}
              locale={locale}
              searchIndex={contentManifest.searchIndex}
              excludedIds={ownGuessedIds}
              disabled={
                !canGuess ||
                guessPending ||
                snapshot.ownGuesses.length >= snapshot.configuration.maxAttempts
              }
              onSubmit={submit}
            />
          )}
          {snapshot.state === "playing" && guessPending ? (
            <p className="guess-submit-status" role="status" aria-live="polite">
              {tr(
                "已提交，等待对手…",
                "送信済み。相手を待っています…",
                "Submitted. Waiting for the opponent…",
              )}
            </p>
          ) : null}
          {error && (
            <div className="inline-error" role="alert">
              {t(`error.${error}`, { defaultValue: t("error.generic") })}
            </div>
          )}

          <div className="multiplayer-boards">
            <section>
              <header>
                <span>{tr("你的猜测", "あなたの回答", "YOUR GUESSES")}</span>
                <strong>
                  {snapshot.ownGuesses.length} / {snapshot.configuration.maxAttempts}
                </strong>
              </header>
              <GuessBoard guesses={snapshot.ownGuesses} locale={locale} />
            </section>
            <section className="opponent-board">
              <header>
                <span>{tr("对手反馈", "相手のフィードバック", "RIVAL SIGNALS")}</span>
                <strong>
                  {snapshot.opponentFeedback.length} / {snapshot.configuration.maxAttempts}
                </strong>
              </header>
              <div className="opponent-feedback-head" aria-hidden="true">
                <span />
                {GUESS_FIELDS.map((field) => (
                  <b key={field}>{t(`game.${field}`)}</b>
                ))}
              </div>
              <div className="masked-feedback-grid">
                {snapshot.opponentFeedback.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className={rowIndex === snapshot.opponentFeedback.length - 1 ? "is-latest" : ""}
                  >
                    <span>#{rowIndex + 1}</span>
                    {row.map((cell, cellIndex) => (
                      <i
                        key={cell.field}
                        className={`state-${cell.state}`}
                        style={{ "--cell-delay": `${cellIndex * 75}ms` } as CSSProperties}
                        role="img"
                        aria-label={tr(
                          `第 ${rowIndex + 1} 次，${t(`game.${cell.field}`)}：${t(`game.${cell.state}`)}`,
                          `${rowIndex + 1}回目、${t(`game.${cell.field}`)}：${t(`game.${cell.state}`)}`,
                          `Guess ${rowIndex + 1}, ${t(`game.${cell.field}`)}: ${t(`game.${cell.state}`)}`,
                        )}
                        title={t(`game.${cell.state}`)}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div
                className="feedback-legend"
                aria-label={tr("反馈颜色说明", "色の説明", "Feedback legend")}
              >
                <span>
                  <i className="state-exact">
                    <Check size={12} />
                  </i>
                  {t("game.exact")}
                </span>
                <span>
                  <i className="state-close">
                    <CircleDot size={11} />
                  </i>
                  {t("game.close")}
                </span>
                <span>
                  <i className="state-miss">
                    <X size={12} />
                  </i>
                  {t("game.miss")}
                </span>
              </div>
              {snapshot.opponentFeedback.length === 0 && (
                <p>
                  {locale === "zh-CN"
                    ? "等待对手第一次猜测…"
                    : locale === "ja"
                      ? "相手の最初の検索を待っています…"
                      : "Waiting for the rival's first signal…"}
                </p>
              )}
            </section>
          </div>

          {snapshot.state === "finished" && (
            <section className="match-finished" aria-labelledby="match-finished-title">
              <Trophy size={30} />
              <div>
                <p>{tr("对战完成", "対戦完了", "MATCH COMPLETE")}</p>
                <h2 id="match-finished-title">
                  {snapshot.winnerId
                    ? snapshot.winnerId === session.data?.user.id
                      ? locale === "zh-CN"
                        ? "你赢得了本场对战"
                        : locale === "ja"
                          ? "対戦に勝利しました"
                          : "You won the match"
                      : locale === "zh-CN"
                        ? "你在本场对战中落败"
                        : locale === "ja"
                          ? "今回は敗北しました"
                          : "You lost the match"
                    : locale === "zh-CN"
                      ? snapshot.finishReason === "agreed-draw"
                        ? "双方同意，本场平局"
                        : "本场无胜者"
                      : locale === "ja"
                        ? snapshot.finishReason === "agreed-draw"
                          ? "合意により引き分け"
                          : "勝者なし"
                        : snapshot.finishReason === "agreed-draw"
                          ? "Draw by agreement"
                          : "No winner"}
                </h2>
              </div>
              {snapshot.ranked && snapshot.ratingChanges.length === 2 ? (
                <div
                  className="rating-settlement"
                  aria-label={tr(
                    "双方永久评分变化",
                    "両者の常設レート変動",
                    "Permanent rating changes",
                  )}
                >
                  {snapshot.players.map((player) => {
                    const change = snapshot.ratingChanges.find(
                      (entry) => entry.playerId === player.playerId,
                    );
                    if (!change) return null;
                    const tone =
                      change.delta > 0 ? "positive" : change.delta < 0 ? "negative" : "neutral";
                    return (
                      <div className={`rating-change ${tone}`} key={player.playerId}>
                        <span>{player.displayName}</span>
                        <b>
                          {change.before} → {change.after}
                        </b>
                        <strong>
                          {change.delta > 0 ? "+" : ""}
                          {change.delta}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <div className="match-finished-actions">
                <button
                  className="ticket-button-secondary"
                  type="button"
                  onClick={() => navigate(`/replay/${snapshot.roomId}`)}
                >
                  {tr("查看完整复盘", "完全なリプレイを見る", "View full replay")}
                </button>
                <button
                  className="ticket-button"
                  type="button"
                  onClick={() =>
                    void acknowledgeMatchTicket().finally(() => navigate(duelLobbyPath))
                  }
                >
                  {tr("返回对战大厅", "対戦ロビーへ戻る", "Back to lobby")}
                </button>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}
