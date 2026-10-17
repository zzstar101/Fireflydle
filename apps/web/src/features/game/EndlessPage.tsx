import { lazy, useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Flag, Heart, LoaderCircle, RotateCcw, SkipForward, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type {
  ContentModeId,
  EndlessLeaderboardEntry,
  GameEntitySummary,
  Locale,
  PublicEndlessRun,
} from "@fireflydle/contracts";
import { apiRequest, ensureSession } from "../../api/client";
import { usePreferences } from "../../state/preferences";
import { assetUrl } from "../../lib/asset-url";
import { CharacterCombobox } from "./CharacterCombobox";
import { GuessBoard } from "./GuessBoard";
import "./game.css";
import "./endless.css";
import "./portrait-challenge.css";

const copy = {
  "zh-CN": {
    endless: "无尽",
    title: "五条命，看看你能走多远",
    intro: "每题固定 6 猜。失败或跳过扣除一条生命，生命归零后成绩进入排行。",
    loading: "正在恢复无尽挑战",
    retry: "重试",
    loadFailed: "无尽挑战没能加载出来。",
    actionFailed: "操作没有成功，请稍后再试。",
    best: "历史最佳",
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
    endless: "Endless",
    title: "Five lives. How far can you go?",
    intro: "Each round allows 6 guesses. A loss or skip costs one life; your final run is ranked.",
    loading: "Restoring endless run",
    retry: "Retry",
    loadFailed: "The endless run couldn't be loaded.",
    actionFailed: "That didn't go through. Please try again.",
    best: "Best",
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
    endless: "エンドレス",
    title: "5つのライフで、どこまで進める？",
    intro: "各問題は6回まで。失敗またはスキップでライフを1つ失い、終了後に順位が決まります。",
    loading: "エンドレスを復元中",
    retry: "再試行",
    loadFailed: "エンドレスを読み込めませんでした。",
    actionFailed: "処理に失敗しました。もう一度お試しください。",
    best: "自己ベスト",
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

// 回合结果用字形区分（答对 / 失败 / 跳过），颜色只作补充。
const roundResultGlyphs = { won: "✓", lost: "✕", skipped: "⏭" } as const;

const modeNames: Record<ContentModeId, Record<Locale, string>> = {
  playable: { "zh-CN": "普通角色", en: "Characters", ja: "キャラクター" },
  npc: { "zh-CN": "NPC", en: "NPCs", ja: "NPC" },
  "currency-wars": { "zh-CN": "货币战争", en: "Currency Wars", ja: "コイン戦争" },
  aeon: { "zh-CN": "星神", en: "Aeons", ja: "星神" },
  portrait: { "zh-CN": "立绘", en: "Portraits", ja: "立ち絵" },
};

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
          backgroundImage: run.portraitImagePath
            ? `url(${assetUrl(run.portraitImagePath)})`
            : undefined,
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
  const { t } = useTranslation();
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

  const modeName = modeNames[contentModeId][locale];
  const title =
    contentModeId === "portrait"
      ? locale === "zh-CN"
        ? "立绘无尽，看看你能猜中多少"
        : locale === "ja"
          ? "立ち絵を何問当てられる？"
          : "How many portraits can you name?"
      : labels.title;
  const intro =
    contentModeId === "portrait"
      ? locale === "zh-CN"
        ? "每题展示一张角色立绘或皮肤。每次猜错会揭示更多区域，失败或跳过扣除一条生命。"
        : locale === "ja"
          ? "キャラクターの立ち絵やスキンを当てよう。間違えると画像が少しずつ見えます。"
          : "Guess a character portrait or skin. Misses reveal more of the image and cost a life."
      : labels.intro;
  const crumb = (
    <nav className="sr-crumb" aria-label={t("hub.backToHub")}>
      <Link className="game-hub-link" to="/">
        {t("nav.hub")}
      </Link>
      <span aria-hidden="true">/</span>
      <span>
        {modeName} · {labels.endless}
      </span>
    </nav>
  );

  if (!run) {
    return (
      <main className="sr-game endless-page is-finished">
        <header className="sr-game-head">
          <div className="sr-game-title">
            {crumb}
            <h1>{title}</h1>
            <p className="sr-game-intro">{intro}</p>
          </div>
        </header>
        <section
          className={`sr-board-wrap endless-state${error ? " is-error" : ""}`}
          role={error ? "alert" : "status"}
          aria-live="polite"
          aria-busy={busy}
        >
          {busy ? <LoaderCircle className="endless-spinner" size={22} aria-hidden="true" /> : null}
          <p>{error ? labels.loadFailed : labels.loading}</p>
          {error ? (
            <button
              type="button"
              className="endless-pill"
              disabled={busy}
              onClick={() => void start()}
            >
              <RotateCcw size={15} aria-hidden="true" /> {labels.retry}
            </button>
          ) : null}
        </section>
      </main>
    );
  }

  const finished = run.status === "finished";
  const remaining = Math.max(0, run.maxAttempts - run.guesses.length);
  const fieldCount = run.fieldDefinitions.length || 6;
  const usesGuessGrid = contentModeId !== "aeon" && contentModeId !== "portrait";
  const roundLabel = run.lastRound
    ? labels[run.lastRound.result as "won" | "lost" | "skipped"]
    : null;
  const composer = !finished ? (
    <div className="sr-composer sr-active-row">
      <CharacterCombobox
        variant="row"
        characters={roster}
        locale={locale}
        showImages={contentModeId !== "aeon"}
        {...(contentModeId === "aeon" ? { entityLabel: locale === "en" ? "Aeon" : "星神" } : {})}
        {...(contentModeId === "playable"
          ? { label: t("game.guessPrompt", { number: run.guesses.length + 1 }) }
          : {})}
        excludedIds={guessedIds}
        disabled={busy || confirmFinish}
        onSubmit={(id) => void submitGuess(id)}
      />
    </div>
  ) : null;

  return (
    <main className={`sr-game endless-page${finished ? " is-finished" : ""}`}>
      <header className="sr-game-head">
        <div className="sr-game-title">
          {crumb}
          <h1>{title}</h1>
          <p className="sr-game-intro">{intro}</p>
        </div>
        <div className="sr-game-meta">
          <div
            className="endless-lives"
            role="img"
            aria-label={`${labels.lives}: ${run.lives} / 5`}
          >
            {Array.from({ length: 5 }, (_, index) => (
              <Heart
                key={index}
                size={20}
                strokeWidth={1.8}
                aria-hidden="true"
                className={index < run.lives ? "is-live" : "is-lost"}
              />
            ))}
          </div>
          <span className="endless-round">
            <small>{labels.round}</small>
            <b>{run.roundNumber.toString().padStart(2, "0")}</b>
            <small>
              · {run.guesses.length}/{run.maxAttempts}
            </small>
          </span>
          <strong className="sr-timer mono" aria-label={labels.elapsed}>
            {formatTime(elapsedMs)}
          </strong>
        </div>
      </header>

      <div className="endless-layout">
        <section className="endless-play-area">
          <div className="endless-toolbar">
            <dl className="endless-stats">
              <div>
                <dt>{labels.clears}</dt>
                <dd>{run.clears}</dd>
              </div>
              <div>
                <dt>{labels.guesses}</dt>
                <dd>{run.totalGuesses}</dd>
              </div>
              <div>
                <dt>{labels.best}</dt>
                <dd>
                  {run.bestClears}
                  {run.percentile === null ? "" : ` · ${run.percentile}%`}
                </dd>
              </div>
            </dl>
            {!finished ? (
              confirmFinish ? (
                <div className="endless-confirm" role="alert">
                  <span>{labels.finishConfirm}</span>
                  <div>
                    <button
                      type="button"
                      className="endless-pill"
                      disabled={busy}
                      onClick={() => setConfirmFinish(false)}
                    >
                      {labels.finishCancel}
                    </button>
                    <button
                      type="button"
                      className="endless-pill is-danger"
                      disabled={busy}
                      onClick={() => void finish()}
                    >
                      {labels.finishConfirmAction}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="endless-actions">
                  <button
                    type="button"
                    className="endless-pill"
                    disabled={!run.skipAvailable || busy}
                    onClick={() => void skip()}
                  >
                    <SkipForward size={15} aria-hidden="true" />{" "}
                    {run.skipAvailable ? labels.skip : labels.skipUsed}
                  </button>
                  <button
                    type="button"
                    className="endless-pill"
                    disabled={busy}
                    onClick={() => setConfirmFinish(true)}
                  >
                    <Flag size={15} aria-hidden="true" /> {labels.finish}
                  </button>
                </div>
              )
            ) : (
              <button
                className="ticket-button endless-restart"
                type="button"
                disabled={busy}
                onClick={() => void start()}
              >
                <RotateCcw size={17} aria-hidden="true" /> {labels.restart}
              </button>
            )}
          </div>

          {run.lastRound ? (
            <div className={`endless-round-result result-${run.lastRound.result}`} role="status">
              <b className="endless-result-glyph" aria-hidden="true">
                {roundResultGlyphs[run.lastRound.result as keyof typeof roundResultGlyphs]}
              </b>
              <div className="endless-result-copy">
                <strong>{finished ? labels.finished : roundLabel}</strong>
                <span>
                  {labels.answer}: {run.lastRound.answer.names[locale]}
                </span>
              </div>
            </div>
          ) : finished ? (
            <div className="endless-round-result result-finished" role="status">
              <b className="endless-result-glyph" aria-hidden="true">
                <Flag size={16} />
              </b>
              <div className="endless-result-copy">
                <strong>{labels.finished}</strong>
                <span>
                  {labels.clears} {run.clears} · {labels.guesses} {run.totalGuesses}
                </span>
              </div>
            </div>
          ) : null}

          {finished && contentModeId !== "aeon" && run.guesses.length === 0 ? null : (
            <section
              className={`sr-board-wrap endless-board-wrap${
                contentModeId === "portrait" ? " is-portrait" : ""
              }`}
            >
              {contentModeId === "portrait" ? (
                <>
                  <PortraitEndlessBoard run={run} />
                  {composer}
                  {run.guesses.length > 0 ? (
                    <GuessBoard
                      guesses={run.guesses}
                      locale={locale}
                      fields={run.fieldDefinitions}
                    />
                  ) : null}
                </>
              ) : contentModeId === "aeon" ? (
                <>
                  <AeonGuessBoard
                    gameId={`${run.id}:${run.roundNumber}`}
                    wrongGuesses={run.guesses.filter((guess) => !guess.isCorrect).length}
                    answer={(finished ? run.answer : null) as never}
                    imagePath={run.aeonImagePath}
                    imageFocus={run.aeonImageFocus}
                    locale={locale}
                    finished={finished}
                  />
                  {composer}
                </>
              ) : (
                <>
                  <GuessBoard guesses={run.guesses} locale={locale} fields={run.fieldDefinitions} />
                  {!finished ? <div className="sr-active-ghost" aria-hidden="true" /> : null}
                  {composer}
                  {!finished
                    ? Array.from({ length: Math.max(0, remaining - 1) }, (_, index) => (
                        <div
                          key={index}
                          className="sr-ghost-row"
                          aria-hidden="true"
                          style={{ "--sr-cols": fieldCount } as CSSProperties}
                        >
                          {Array.from({ length: fieldCount + 1 }, (_, cell) => (
                            <span key={cell} />
                          ))}
                        </div>
                      ))
                    : null}
                </>
              )}
            </section>
          )}

          {error ? (
            <p className="endless-error" role="alert">
              {labels.actionFailed}
            </p>
          ) : null}

          {usesGuessGrid && !finished ? (
            <p className="sr-legend" aria-hidden="true">
              <span>
                <i className="exact" />
                {locale === "en" ? "Match" : locale === "ja" ? "一致" : "一致"}
              </span>
              <span>
                <i className="close" />
                {locale === "en" ? "Close" : locale === "ja" ? "近い" : "接近"}
              </span>
              <span>
                <i className="miss" />
                {locale === "en" ? "Miss" : locale === "ja" ? "不一致" : "不符"}
              </span>
            </p>
          ) : null}
        </section>

        <aside className="endless-board" aria-labelledby="endless-board-title">
          <h2 id="endless-board-title">
            <Trophy size={17} aria-hidden="true" /> {labels.board}
          </h2>
          {leaderboard.length === 0 ? (
            <p>{labels.empty}</p>
          ) : (
            <ol>
              {leaderboard.slice(0, 10).map((entry) => (
                <li
                  key={`${entry.rank}-${entry.displayName}-${entry.completedAt}`}
                  className={entry.rank <= 3 ? "is-top" : undefined}
                >
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
