import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarClock, Copy, Eye, Link2Off, LockKeyhole, Share2 } from "lucide-react";
import type { ReplayResponse, ReplayShareResponse } from "@fireflydle/contracts";
import { useParams } from "react-router-dom";
import { apiRequest } from "../../api/client";
import { LoadingScreen } from "../../components/LoadingScreen";
import { PageHeader } from "../../components/PageHeader";
import { usePreferences } from "../../state/preferences";
import { GuessBoard } from "./GuessBoard";
import "./game.css";

export default function ReplayPage() {
  const { replayId } = useParams();
  const locale = usePreferences((state) => state.language);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const replay = useQuery({
    queryKey: ["replay", replayId],
    queryFn: () => apiRequest<ReplayResponse>(`/replays/${replayId}`),
    enabled: Boolean(replayId),
    retry: false,
  });
  if (replay.isLoading) return <LoadingScreen />;
  if (!replay.data)
    return (
      <main className="center-page">
        <LockKeyhole size={36} />
        <h1>
          {locale === "zh-CN"
            ? "这份回放不可访问"
            : locale === "ja"
              ? "このリプレイは閲覧できません"
              : "Replay unavailable"}
        </h1>
        <p className="muted">
          {locale === "zh-CN"
            ? "该回放可能未公开或已经过期。"
            : locale === "ja"
              ? "非公開、または期限切れの可能性があります。"
              : "It may be private or expired."}
        </p>
      </main>
    );
  const { game } = replay.data;
  const createShare = async () => {
    if (!replayId) return;
    setBusy(true);
    setMessage(null);
    try {
      let url = shareUrl;
      if (!url) {
        const shared = await apiRequest<ReplayShareResponse>(`/replays/${replayId}/share`, {
          method: "POST",
        });
        url = shared.url;
        setShareUrl(url);
      }
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1800);
    } catch {
      setMessage(
        locale === "zh-CN"
          ? "无法生成或复制分享链接。"
          : locale === "ja"
            ? "共有リンクを作成またはコピーできません。"
            : "Could not create or copy the share link.",
      );
    } finally {
      setBusy(false);
    }
  };

  const revokeShare = async () => {
    if (!replayId) return;
    setBusy(true);
    setMessage(null);
    try {
      await apiRequest(`/replays/${replayId}/share`, { method: "DELETE" });
      setShareUrl(null);
      setShareCopied(false);
      setMessage(
        locale === "zh-CN"
          ? "所有现有分享链接已撤销。"
          : locale === "ja"
            ? "既存の共有リンクをすべて無効化しました。"
            : "All existing share links were revoked.",
      );
    } catch {
      setMessage(
        locale === "zh-CN"
          ? "暂时无法撤销分享链接。"
          : locale === "ja"
            ? "共有リンクを無効化できません。"
            : "Could not revoke the share link.",
      );
    } finally {
      setBusy(false);
    }
  };

  const copySummary = async () => {
    const summary = `${game.mode.toUpperCase()} · ${game.status.toUpperCase()} · ${game.guesses.length}/${game.maxAttempts} · ${Math.floor(game.elapsedMs / 1000)}s`;
    try {
      await navigator.clipboard.writeText(summary);
      setSummaryCopied(true);
      window.setTimeout(() => setSummaryCopied(false), 1800);
    } catch {
      setMessage(
        locale === "zh-CN"
          ? "无法复制摘要。"
          : locale === "ja"
            ? "概要をコピーできません。"
            : "Could not copy the summary.",
      );
    }
  };
  return (
    <main className="page-shell replay-page">
      <PageHeader
        eyebrow={`REPLAY · ${game.id.slice(0, 8).toUpperCase()}`}
        title={locale === "zh-CN" ? "对局回放" : locale === "ja" ? "対局リプレイ" : "Game replay"}
        intro={`${game.mode.toUpperCase()} · ${game.difficulty.toUpperCase()} · ${game.status.toUpperCase()}`}
        aside={
          <div className="rank-live">
            {replay.data.visibility === "private" ? <LockKeyhole size={16} /> : <Eye size={16} />}
            <span>{replay.data.visibility.toUpperCase()}</span>
            <strong>
              {game.guesses.length}/{game.maxAttempts}
            </strong>
          </div>
        }
      />
      <div className="metric-strip">
        <div>
          <span>
            <CalendarClock size={16} />
            {locale === "zh-CN" ? "开始" : locale === "ja" ? "開始" : "STARTED"}
          </span>
          <strong className="mono">{new Date(game.startedAt).toLocaleDateString(locale)}</strong>
        </div>
        <div>
          <span>{locale === "zh-CN" ? "用时" : locale === "ja" ? "経過" : "ELAPSED"}</span>
          <strong className="mono">{Math.floor(game.elapsedMs / 1000)}s</strong>
        </div>
        <div>
          <span>{locale === "zh-CN" ? "答案" : locale === "ja" ? "正解" : "ANSWER"}</span>
          <strong>{game.answer?.names[locale] ?? "—"}</strong>
        </div>
      </div>
      <GuessBoard guesses={game.guesses} locale={locale} />
      <section className="replay-actions">
        <p>
          {locale === "zh-CN"
            ? "详细回放默认私密，保留 30 天。分享链接可随时撤销。"
            : locale === "ja"
              ? "詳細リプレイは既定で非公開、保存期間は30日です。共有リンクはいつでも無効化できます。"
              : "Detailed replays are private by default and retained for 30 days. Shared links can be revoked."}
        </p>
        {replay.data.visibility === "private" ? (
          <>
            <button
              className="ticket-button-secondary"
              type="button"
              disabled={busy}
              onClick={() => void createShare()}
            >
              <Share2 size={17} />
              {shareCopied
                ? locale === "zh-CN"
                  ? "链接已复制"
                  : locale === "ja"
                    ? "リンクをコピーしました"
                    : "Link copied"
                : shareUrl
                  ? locale === "zh-CN"
                    ? "复制分享链接"
                    : locale === "ja"
                      ? "共有リンクをコピー"
                      : "Copy share link"
                  : locale === "zh-CN"
                    ? "生成分享链接"
                    : locale === "ja"
                      ? "共有リンクを作成"
                      : "Create share link"}
            </button>
            {shareUrl ? (
              <button
                className="ticket-button-secondary"
                type="button"
                disabled={busy}
                onClick={() => void revokeShare()}
              >
                <Link2Off size={17} />
                {locale === "zh-CN" ? "撤销分享" : locale === "ja" ? "共有を解除" : "Revoke"}
              </button>
            ) : null}
          </>
        ) : null}
        <button
          className="ticket-button-secondary"
          type="button"
          onClick={() => void copySummary()}
        >
          <Copy size={17} />
          {summaryCopied
            ? locale === "zh-CN"
              ? "摘要已复制"
              : locale === "ja"
                ? "概要をコピーしました"
                : "Summary copied"
            : locale === "zh-CN"
              ? "复制摘要"
              : locale === "ja"
                ? "概要をコピー"
                : "Copy summary"}
        </button>
      </section>
      {message ? (
        <p className="replay-message" role="status">
          {message}
        </p>
      ) : null}
    </main>
  );
}
