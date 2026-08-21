import { lazy, useCallback, useEffect, useMemo, useState } from "react";
import {
  Clock3,
  Heart,
  Infinity as InfinityIcon,
  LoaderCircle,
  RotateCcw,
  SkipForward,
  Target,
  Trophy,
} from "lucide-react";
import type {
  ContentModeId,
  EndlessLeaderboardEntry,
  GameEntitySummary,
  Locale,
  PublicEndlessRun,
} from "@fireflydle/contracts";
import { apiRequest, ensureSession } from "../../api/client";
import { usePreferences } from "../../state/preferences";
import { CharacterCombobox } from "./CharacterCombobox";
import { GuessBoard } from "./GuessBoard";
import "./game.css";
import "./endless.css";
import "./portrait-challenge.css";

const copy = {
  "zh-CN": {
    eyebrow: "普通角色 · 无尽",
    title: "五条命，看看你能走多远",
    intro: "每题固定 6 猜。失败或跳过扣除一条生命，生命归零后成绩进入排行。",
    loading: "正在恢复无尽挑战",
    retry: "重试",
    lives: "生命",
    clears: "通关",
    guesses: "总猜测",
    elapsed: "用时",
    round: "题次",
    skip: "跳过本题",
    skipUsed: "跳过已使用",
    restart: "再来一局",
    won: "回答正确",
    lost: "本题失败",
    skipped: "已跳过本题",
    answer: "答案",
    finished: "挑战结束",
    finish: "结束本局",
    finishConfirm: "确定结束这局无尽挑战吗？本局成绩会立即结算。",
    finishCancel: "继续挑战",
    finishConfirmAction: "确认结束",
    board: "无尽排行",
    player: "玩家",
    empty: "还没有完成的无尽挑战。",
  },
  en: {
    eyebrow: "CHARACTERS · ENDLESS",
    title: "Five lives. How far can you go?",
    intro: "Each round allows 6 guesses. A loss or skip costs one life; your final run is ranked.",
    loading: "Restoring endless run",
    retry: "Retry",
    lives: "Lives",
    clears: "Clears",
    guesses: "Guesses",
    elapsed: "Time",
    round: "Round",
    skip: "Skip round",
    skipUsed: "Skip used",
    restart: "New run",
    won: "Round cleared",
    lost: "Round failed",
    skipped: "Round skipped",
    answer: "Answer",
    finished: "Run finished",
    finish: "End run",
    finishConfirm: "End this endless run? Its current score will be recorded.",
    finishCancel: "Keep playing",
    finishConfirmAction: "End run",
    board: "Endless leaderboard",
    player: "Player",
    empty: "No completed endless runs yet.",
  },
  ja: {
    eyebrow: "キャラクター · エンドレス",
    title: "5つのライフで、どこまで進める？",
    intro: "各問題は6回まで。失敗またはスキップでライフを1つ失い、終了後に順位が決まります。",
    loading: "エンドレスを復元中",
    retry: "再試行",
    lives: "ライフ",
    clears: "クリア",
    guesses: "推測数",
    elapsed: "時間",
    round: "問題",
    skip: "スキップ",
    skipUsed: "使用済み",
    restart: "もう一度",
    won: "正解",
    lost: "失敗",
    skipped: "スキップしました",
    answer: "答え",
    finished: "チャレンジ終了",
    finish: "この挑戦を終了",
    finishConfirm: "このエンドレスを終了しますか？現在のスコアが記録されます。",
    finishCancel: "続ける",
    finishConfirmAction: "終了する",
    board: "エンドレスランキング",
    player: "プレイヤー",
    empty: "完了したチャレンジはまだありません。",
  },
} satisfies Record<Locale, Record<string, string>>;

function formatTime(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1_000));
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

const AeonGuessBoard = lazy(() =>
  import("./AeonGuessBoard").then((module) => ({ default: module.AeonGuessBoard })),
);

const rosterEndpoints: Partial<Record<ContentModeId, string>> = {
  playable: "/characters",
  npc: "/npcs",
  "currency-wars": "/currency-wars/units",
};

function PortraitEndlessBoard({ run }: { run: PublicEndlessRun }) {
  const wrongGuesses = run.guesses.filter((guess) => !guess.isCorrect).length;
  const revealed = new Set<number>([3, 60]);
  if (run.status === "finished") {
    for (let index = 0; index < 64; index += 1) revealed.add(index);
  } else {
    for (let index = 0; index < wrongGuesses * 6; index += 1) {
      revealed.add((index * 17 + wrongGuesses * 11) % 64);
    }
  }
  return (
    <div className="portrait-board-wrap endless-portrait-board-wrap" aria-label="立绘遮罩">
      <div
        className="portrait-board"
        style={{
          backgroundImage: run.portraitImagePath ? `url(${run.portraitImagePath})` : undefined,
        }}
      >
        {Array.from({ length: 64 }, (_, index) => (
          <i key={index} className={revealed.has(index) ? "is-revealed" : ""} />
        ))}
      </div>
    </div>
  );
}

export function EndlessPage({
  contentModeId,
  bundledRoster,
}: {
  contentModeId: ContentModeId;
  bundledRoster: readonly GameEntitySummary[];
}) {
  const locale = usePreferences((state) => state.language);
  const labels = copy[locale];
  const [run, setRun] = useState<PublicEndlessRun | null>(null);
  const [roster, setRoster] = useState<readonly GameEntitySummary[]>(bundledRoster);
  const [leaderboard, setLeaderboard] = useState<EndlessLeaderboardEntry[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [confirmFinish, setConfirmFinish] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    const entries = await apiRequest<EndlessLeaderboardEntry[]>(
      `/leaderboards/endless?modeId=${contentModeId}`,
    );
    setLeaderboard(entries);
  }, [contentModeId]);

  const start = useCallback(async () => {
    setBusy(true);
    setError(false);
    try {
      await ensureSession();
      const [nextRun, nextRoster, entries] = await Promise.all([
        apiRequest<PublicEndlessRun>(`/endless?modeId=${contentModeId}`, { method: "POST" }),
        contentModeId === "portrait"
          ? apiRequest<{ characters: GameEntitySummary[] }>("/portrait-roster").then(
              (value) => value.characters,
            )
          : rosterEndpoints[contentModeId]
            ? apiRequest<GameEntitySummary[]>(rosterEndpoints[contentModeId]!).catch(
                () => bundledRoster,
              )
            : Promise.resolve(bundledRoster),
        apiRequest<EndlessLeaderboardEntry[]>(
          `/leaderboards/endless?modeId=${contentModeId}`,
        ).catch(() => []),
      ]);
      setRun(nextRun);
      setRoster(nextRoster);
      setLeaderboard(entries);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }, [bundledRoster, contentModeId]);

  useEffect(() => {
    void start();
  }, [start]);

  useEffect(() => {
    if (run?.status !== "active") return;
    const interval = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(interval);
  }, [run?.status]);

  const submitGuess = async (characterId: string) => {
    if (!run || run.status !== "active" || busy) return;
    setBusy(true);
    setError(false);
    try {
      const updated = await apiRequest<PublicEndlessRun>(`/endless/${run.id}/guesses`, {
        method: "POST",
        body: JSON.stringify({ characterId }),
      });
      setRun(updated);
      setConfirmFinish(false);
      if (updated.status === "finished") void loadLeaderboard();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const skip = async () => {
    if (!run || !run.skipAvailable || busy) return;
    setBusy(true);
    setError(false);
    try {
      const updated = await apiRequest<PublicEndlessRun>(`/endless/${run.id}/skip`, {
        method: "POST",
      });
      setRun(updated);
      setConfirmFinish(false);
      if (updated.status === "finished") void loadLeaderboard();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const finish = async () => {
    if (!run || run.status !== "active" || busy) return;
    setBusy(true);
    setError(false);
    try {
      const updated = await apiRequest<PublicEndlessRun>(`/endless/${run.id}/finish`, {
        method: "POST",
      });
      setRun(updated);
      setConfirmFinish(false);
      void loadLeaderboard();
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  const guessedIds = useMemo(
    () => new Set(run?.guesses.map((guess) => guess.character.id) ?? []),
    [run?.guesses],
  );
  const elapsedMs = run
    ? run.status === "active"
      ? now - new Date(run.startedAt).getTime()
      : run.elapsedMs
    : 0;

  if (!run) {
    return (
      <main className="endless-page endless-loading-state">
        {busy ? <LoaderCircle className="endless-spinner" size={28} /> : <InfinityIcon size={32} />}
        <h1>{labels.loading}</h1>
        {error ? (
          <button type="button" onClick={() => void start()}>
            <RotateCcw size={17} /> {labels.retry}
          </button>
        ) : null}
      </main>
    );
  }

  const roundLabel = run.lastRound
    ? labels[run.lastRound.result as "won" | "lost" | "skipped"]
    : null;

  return (
    <main className="endless-page">
      <header className="endless-hero">
        <div>
          <p>
            {contentModeId === "playable"
              ? labels.eyebrow
              : contentModeId === "portrait"
                ? locale === "zh-CN"
                  ? "立绘挑战 · 无尽"
                  : locale === "ja"
                    ? "立ち絵 · エンドレス"
                    : "PORTRAITS · ENDLESS"
                : `${contentModeId.toUpperCase()} · ${labels.board}`}
          </p>
          <h1>
            {contentModeId === "portrait"
              ? locale === "zh-CN"
                ? "立绘无尽，看看你能猜中多少"
                : locale === "ja"
                  ? "立ち絵を何問当てられる？"
                  : "How many portraits can you name?"
              : labels.title}
          </h1>
          <span>
            {contentModeId === "portrait"
              ? locale === "zh-CN"
                ? "每题展示一张角色立绘或皮肤。每次猜错会揭示更多区域，失败或跳过扣除一条生命。"
                : locale === "ja"
                  ? "キャラクターの立ち絵やスキンを当てよう。間違えると画像が少しずつ見えます。"
                  : "Guess a character portrait or skin. Misses reveal more of the image and cost a life."
              : labels.intro}
          </span>
        </div>
        <InfinityIcon size={54} strokeWidth={1.4} aria-hidden="true" />
      </header>

      <section className="endless-metrics" aria-label={labels.eyebrow}>
        <div>
          <span>
            <Heart size={16} /> {labels.lives}
          </span>
          <strong aria-label={`${labels.lives}: ${run.lives}`}>
            {Array.from({ length: 5 }, (_, index) => (
              <Heart key={index} size={22} className={index < run.lives ? "is-live" : "is-lost"} />
            ))}
          </strong>
        </div>
        <div>
          <span>
            <Target size={16} /> {labels.clears}
          </span>
          <strong>{run.clears}</strong>
        </div>
        <div>
          <span>{labels.guesses}</span>
          <strong>{run.totalGuesses}</strong>
        </div>
        <div>
          <span>
            {locale === "zh-CN"
              ? "历史最佳 / 百分位"
              : locale === "ja"
                ? "自己ベスト / パーセンタイル"
                : "Best / Percentile"}
          </span>
          <strong>
            {run.bestClears}
            {run.percentile === null ? "" : ` · ${run.percentile}%`}
          </strong>
        </div>
        <div>
          <span>
            <Clock3 size={16} /> {labels.elapsed}
          </span>
          <strong>{formatTime(elapsedMs)}</strong>
        </div>
      </section>

      <div className="endless-layout">
        <section className="endless-play-area">
          <div className="endless-round-header">
            <div>
              <span>{labels.round}</span>
              <strong>{run.roundNumber.toString().padStart(2, "0")}</strong>
              <small>
                {run.guesses.length} / {run.maxAttempts}
              </small>
            </div>
            {run.status === "active" ? (
              confirmFinish ? (
                <div className="endless-finish-confirm" role="alert">
                  <span>{labels.finishConfirm}</span>
                  <button type="button" disabled={busy} onClick={() => setConfirmFinish(false)}>
                    {labels.finishCancel}
                  </button>
                  <button
                    type="button"
                    className="is-danger"
                    disabled={busy}
                    onClick={() => void finish()}
                  >
                    {labels.finishConfirmAction}
                  </button>
                </div>
              ) : (
                <div className="endless-round-actions">
                  <button
                    type="button"
                    disabled={!run.skipAvailable || busy}
                    onClick={() => void skip()}
                  >
                    <SkipForward size={17} /> {run.skipAvailable ? labels.skip : labels.skipUsed}
                  </button>
                  <button type="button" disabled={busy} onClick={() => setConfirmFinish(true)}>
                    {labels.finish}
                  </button>
                </div>
              )
            ) : (
              <button type="button" disabled={busy} onClick={() => void start()}>
                <RotateCcw size={17} /> {labels.restart}
              </button>
            )}
          </div>

          {run.lastRound ? (
            <div className={`endless-round-result result-${run.lastRound.result}`} role="status">
              <strong>{run.status === "finished" ? labels.finished : roundLabel}</strong>
              <span>
                {labels.answer}: {run.lastRound.answer.names[locale]}
              </span>
            </div>
          ) : null}

          {run.status === "active" ? (
            <CharacterCombobox
              characters={roster}
              locale={locale}
              showImages={contentModeId !== "aeon"}
              excludedIds={guessedIds}
              disabled={busy || confirmFinish}
              onSubmit={(id) => void submitGuess(id)}
            />
          ) : null}
          {error ? (
            <p className="endless-error" role="alert">
              {labels.retry}
            </p>
          ) : null}
          {contentModeId === "portrait" ? (
            <>
              <PortraitEndlessBoard run={run} />
              <GuessBoard guesses={run.guesses} locale={locale} fields={run.fieldDefinitions} />
            </>
          ) : contentModeId === "aeon" ? (
            <AeonGuessBoard
              gameId={`${run.id}:${run.roundNumber}`}
              wrongGuesses={run.guesses.filter((guess) => !guess.isCorrect).length}
              answer={(run.status === "finished" ? run.answer : null) as never}
              imagePath={run.aeonImagePath}
              imageFocus={run.aeonImageFocus}
              locale={locale}
              finished={run.status === "finished"}
            />
          ) : (
            <GuessBoard guesses={run.guesses} locale={locale} fields={run.fieldDefinitions} />
          )}
        </section>

        <aside className="endless-board">
          <h2>
            <Trophy size={19} /> {labels.board}
          </h2>
          {leaderboard.length === 0 ? (
            <p>{labels.empty}</p>
          ) : (
            <ol>
              {leaderboard.slice(0, 10).map((entry) => (
                <li key={`${entry.rank}-${entry.displayName}-${entry.completedAt}`}>
                  <b>{entry.rank.toString().padStart(2, "0")}</b>
                  <span>{entry.displayName}</span>
                  <strong>{entry.clears}</strong>
                  <small>
                    {entry.totalGuesses} · {formatTime(entry.elapsedMs)}
                  </small>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>
    </main>
  );
}
