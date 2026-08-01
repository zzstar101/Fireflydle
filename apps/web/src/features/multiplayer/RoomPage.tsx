import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Clock3,
  Copy,
  LogOut,
  Radio,
  ShieldAlert,
  Trophy,
  UserRound,
  Wifi,
  WifiOff,
} from "lucide-react";
import { ServerRoomMessageSchema, type Character, type RoomSnapshot } from "@fireflydle/contracts";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { characters } from "@fireflydle/game-data";
import { apiRequest, getWebSocketUrl } from "../../api/client";
import { CharacterCombobox } from "../game/CharacterCombobox";
import { GuessBoard } from "../game/GuessBoard";
import { usePreferences } from "../../state/preferences";
import { useSession } from "../account/useSession";
import "./multiplayer.css";

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
  const [now, setNow] = useState(Date.now());
  const [codeCopied, setCodeCopied] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const leavingRef = useRef(false);
  const acknowledgedRef = useRef(false);
  const matchTicket = getMatchTicket(location.state);
  const rosterQuery = useQuery({
    queryKey: ["characters", "multiplayer"],
    queryFn: () => apiRequest<Character[]>("/characters"),
    retry: false,
  });
  const roster = rosterQuery.data ?? characters;

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
          if (message.type === "error") setError(message.code);
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
      : 0;
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

  const submit = (characterId: string) =>
    socketRef.current?.send(
      JSON.stringify({ type: "guess", characterId, actionId: crypto.randomUUID() }),
    );
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
    navigate("/duel", { replace: true });
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
              <strong>{formatSeconds(timeLeft)}</strong>
              <small>{roomStateLabel}</small>
            </div>
          </section>

          {snapshot.state === "waiting" && (
            <section className="invite-strip">
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
            <CharacterCombobox
              characters={roster}
              locale={locale}
              excludedIds={ownGuessedIds}
              disabled={!canGuess || snapshot.ownGuesses.length >= 6}
              onSubmit={submit}
            />
          )}
          {error && (
            <div className="inline-error" role="alert">
              {t(`error.${error}`, { defaultValue: t("error.generic") })}
            </div>
          )}

          <div className="multiplayer-boards">
            <section>
              <header>
                <span>{tr("你的猜测", "あなたの回答", "YOUR GUESSES")}</span>
                <strong>{snapshot.ownGuesses.length} / 6</strong>
              </header>
              <GuessBoard guesses={snapshot.ownGuesses} locale={locale} />
            </section>
            <section className="opponent-board">
              <header>
                <span>{tr("对手反馈", "相手のフィードバック", "RIVAL SIGNALS")}</span>
                <strong>{snapshot.opponentFeedback.length} / 6</strong>
              </header>
              <div className="masked-feedback-grid">
                {snapshot.opponentFeedback.map((row, rowIndex) => (
                  <div key={rowIndex}>
                    <span>#{rowIndex + 1}</span>
                    {row.map((cell) => (
                      <i
                        key={cell.field}
                        className={`state-${cell.state}`}
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
                      ? "本场平局"
                      : locale === "ja"
                        ? "引き分け"
                        : "Draw"}
                </h2>
              </div>
              <button
                className="ticket-button"
                onClick={() => void acknowledgeMatchTicket().finally(() => navigate("/duel"))}
              >
                {tr("返回对战大厅", "対戦ロビーへ戻る", "Back to lobby")}
              </button>
            </section>
          )}
        </>
      )}
    </main>
  );
}
