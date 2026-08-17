import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock3, RotateCcw, Swords, Trophy } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import type { Character, FriendChallenge, PublicGame } from "@fireflydle/contracts";
import { apiRequest, ensureSession } from "../../api/client";
import { CharacterAvatar } from "../../components/CharacterAvatar";
import { usePreferences } from "../../state/preferences";
import { CharacterCombobox } from "./CharacterCombobox";
import { GuessBoard } from "./GuessBoard";
import "./game.css";

function formatTime(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1_000));
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function comparisonLabel(
  value: FriendChallenge["comparison"],
  locale: "zh-CN" | "en" | "ja",
): string {
  if (value === "challenger-won")
    return locale === "zh-CN" ? "你赢了" : locale === "ja" ? "あなたの勝ち" : "You won";
  if (value === "creator-won")
    return locale === "zh-CN" ? "好友领先" : locale === "ja" ? "フレンドの勝ち" : "Friend won";
  return locale === "zh-CN" ? "平局" : locale === "ja" ? "引き分け" : "Draw";
}

export default function FriendChallengePage() {
  const { challengeId = "" } = useParams();
  const queryClient = useQueryClient();
  const locale = usePreferences((state) => state.language);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const challengeQuery = useQuery({
    queryKey: ["friend-challenge", challengeId],
    queryFn: async () => {
      await ensureSession();
      return apiRequest<FriendChallenge>(`/challenges/${challengeId}`);
    },
    retry: false,
  });
  const rosterQuery = useQuery({
    queryKey: ["characters", "friend-challenge"],
    queryFn: () => apiRequest<Character[]>("/characters"),
    retry: false,
  });
  const challenge = challengeQuery.data;
  const game = challenge?.attempt?.game ?? null;
  const guessedIds = useMemo(
    () => new Set(game?.guesses.map((guess) => guess.character.id) ?? []),
    [game?.guesses],
  );

  const start = async () => {
    if (busy) return;
    setBusy(true);
    setError(false);
    try {
      const next = await apiRequest<FriendChallenge>(`/challenges/${challengeId}/attempts`, {
        method: "POST",
      });
      queryClient.setQueryData(["friend-challenge", challengeId], next);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const submitGuess = async (characterId: string) => {
    if (!game || game.status !== "active" || busy) return;
    setBusy(true);
    setError(false);
    try {
      const updated = await apiRequest<PublicGame>(`/games/${game.id}/guesses`, {
        method: "POST",
        body: JSON.stringify({ characterId }),
      });
      queryClient.setQueryData<FriendChallenge>(["friend-challenge", challengeId], (current) =>
        current?.attempt ? { ...current, attempt: { ...current.attempt, game: updated } } : current,
      );
      if (updated.status !== "active") await challengeQuery.refetch();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  if (challengeQuery.isPending) {
    return <main className="challenge-page challenge-page-centered">LOADING</main>;
  }
  if (!challenge || challengeQuery.isError) {
    return (
      <main className="challenge-page challenge-page-centered">
        <Swords size={28} />
        <h1>
          {locale === "zh-CN"
            ? "挑战不存在"
            : locale === "ja"
              ? "挑戦がありません"
              : "Challenge unavailable"}
        </h1>
        <Link className="ticket-button" to="/">
          <ArrowLeft size={17} /> {locale === "zh-CN" ? "返回首页" : "Back home"}
        </Link>
      </main>
    );
  }

  const finished = game?.status === "won" || game?.status === "lost";
  return (
    <main className="challenge-page">
      <header className="challenge-header">
        <Link className="game-hub-link" to="/">
          <ArrowLeft size={15} /> {locale === "zh-CN" ? "返回首页" : "Back home"}
        </Link>
        <p className="eyebrow">FRIEND CHALLENGE · PLAYABLE</p>
        <h1>
          {locale === "zh-CN"
            ? "好友同题挑战"
            : locale === "ja"
              ? "フレンド挑戦"
              : "Friend challenge"}
        </h1>
        <p>
          {locale === "zh-CN"
            ? "同一个答案，同一套规则，第一次完成即为正式成绩。"
            : locale === "ja"
              ? "同じ答えとルールで、最初の完了が正式記録になります。"
              : "Same answer and rules. Your first finish becomes the official result."}
        </p>
      </header>

      <section className="challenge-score-strip" aria-label="Challenge rules">
        <div>
          <span>MANIFEST</span>
          <strong>{challenge.manifestVersion}</strong>
        </div>
        <div>
          <span>{locale === "zh-CN" ? "规则" : "RULES"}</span>
          <strong>{challenge.poolRuleVersion}</strong>
        </div>
        <div>
          <span>{locale === "zh-CN" ? "次数" : "TRIES"}</span>
          <strong>{challenge.maxAttempts}</strong>
        </div>
        <div>
          <span>{locale === "zh-CN" ? "好友" : "FRIEND"}</span>
          <strong>
            {challenge.creatorScore.status === "won"
              ? `${challenge.creatorScore.guessCount}/${challenge.maxAttempts}`
              : "MISS"}
          </strong>
        </div>
      </section>

      <section className="challenge-workspace">
        {!game ? (
          <div className="challenge-start">
            <Swords size={36} />
            <h2>
              {locale === "zh-CN"
                ? "准备接题"
                : locale === "ja"
                  ? "挑戦を開始"
                  : "Take the challenge"}
            </h2>
            <button
              className="ticket-button"
              type="button"
              disabled={busy}
              onClick={() => void start()}
            >
              <Swords size={17} />{" "}
              {locale === "zh-CN"
                ? "开始正式挑战"
                : locale === "ja"
                  ? "正式挑戦を開始"
                  : "Start official attempt"}
            </button>
          </div>
        ) : (
          <>
            <div className="challenge-status-line">
              <span>
                {challenge.attempt?.kind === "official"
                  ? locale === "zh-CN"
                    ? "正式成绩"
                    : "OFFICIAL"
                  : locale === "zh-CN"
                    ? "练习重玩"
                    : "PRACTICE"}
              </span>
              <strong>
                {game.guesses.length}/{game.maxAttempts}
              </strong>
              <span>
                <Clock3 size={14} /> {formatTime(game.elapsedMs)}
              </span>
            </div>
            {game.status === "active" && (
              <CharacterCombobox
                characters={rosterQuery.data ?? []}
                locale={locale}
                excludedIds={guessedIds}
                disabled={busy || rosterQuery.isPending}
                onSubmit={(id) => void submitGuess(id)}
              />
            )}
            {finished && game.answer && (
              <section className={`challenge-result result-${game.status}`} role="status">
                <CharacterAvatar character={game.answer} size="large" priority />
                <div>
                  <p>
                    {game.status === "won"
                      ? locale === "zh-CN"
                        ? "猜中了"
                        : "CORRECT"
                      : locale === "zh-CN"
                        ? "未猜中"
                        : "MISSED"}
                  </p>
                  <h2>{game.answer.names[locale]}</h2>
                  {challenge.comparison && (
                    <strong>
                      <Trophy size={17} /> {comparisonLabel(challenge.comparison, locale)}
                    </strong>
                  )}
                </div>
                <button
                  className="ticket-button-secondary"
                  type="button"
                  disabled={busy}
                  onClick={() => void start()}
                >
                  <RotateCcw size={17} />{" "}
                  {locale === "zh-CN"
                    ? "练习重玩"
                    : locale === "ja"
                      ? "練習でもう一度"
                      : "Replay for practice"}
                </button>
              </section>
            )}
            <GuessBoard guesses={game.guesses} locale={locale} fields={game.fieldDefinitions} />
          </>
        )}
        {error && (
          <p className="inline-error" role="alert">
            {locale === "zh-CN" ? "请求失败，请重试。" : "Request failed. Try again."}
          </p>
        )}
      </section>
    </main>
  );
}
