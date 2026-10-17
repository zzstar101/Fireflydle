import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Eye, Infinity as InfinityIcon, RotateCcw, Sparkles, Users } from "lucide-react";
import type { GameEntitySummary } from "@fireflydle/contracts";
import { characters } from "@fireflydle/game-data/playable";
import { useTranslation } from "react-i18next";
import { apiRequest } from "../../api/client";
import { CharacterAvatar } from "../../components/CharacterAvatar";
import { assetUrl } from "../../lib/asset-url";
import { usePreferences } from "../../state/preferences";
import { CharacterCombobox } from "./CharacterCombobox";
import { EndlessPage } from "./EndlessPage";
import "./game.css";
import "./portrait-challenge.css";

type Character = Extract<GameEntitySummary, { element: string; path: string }> & {
  officialId?: string;
};
type Skin = {
  id: string;
  characterId: string;
  names: { "zh-CN": string; en: string; ja: string };
  imagePath: string;
};
type PortraitRoster = { characters: Character[]; skins: Skin[] };
const INITIAL_REVEALED = [3, 60];
type GuessFeedback = "correct" | "wrong";

function portraitImagePath(character: Character): string {
  return character.officialId
    ? `/assets/portraits/${character.officialId}.png`
    : character.assets.portraitPath;
}

export default function PortraitChallengePage() {
  const { t } = useTranslation();
  const locale = usePreferences((state) => state.language);
  const roster = useQuery({
    queryKey: ["portrait-roster"],
    queryFn: () => apiRequest<PortraitRoster>("/portrait-roster"),
  });
  const pool = roster.data?.characters ?? [];
  const skins = roster.data?.skins ?? [];
  const [seed, setSeed] = useState(() => Math.random());
  const target = useMemo(() => pool[Math.floor(seed * Math.max(1, pool.length))], [pool, seed]);
  const targetSkin = useMemo(() => {
    if (!target) return undefined;
    const variants = skins.filter((skin) => skin.characterId === target.id);
    if (variants.length === 0) return undefined;
    // 默认立绘与该角色的每套时装等概率，皮肤数量不会改变角色出现概率。
    const variantSeed = (seed * 997) % 1;
    const selectedVariant = Math.floor(variantSeed * (variants.length + 1));
    return selectedVariant === 0 ? undefined : variants[selectedVariant - 1];
  }, [skins, target, seed]);
  const targetImagePath = targetSkin?.imagePath || (target ? portraitImagePath(target) : undefined);
  const targetImage = targetImagePath ? assetUrl(targetImagePath) : undefined;
  const [revealed, setRevealed] = useState(() => new Set(INITIAL_REVEALED));
  const [guesses, setGuesses] = useState<string[]>([]);
  const [won, setWon] = useState(false);
  const [feedback, setFeedback] = useState<GuessFeedback | null>(null);
  const guessedIds = useMemo(() => new Set(guesses), [guesses]);
  const guess = (characterId: string) => {
    const character = pool.find((item) => item.id === characterId);
    if (!character) return;
    if (won || guesses.includes(character.id)) return;
    const nextGuesses = [...guesses, character.id];
    setGuesses(nextGuesses);
    if (character.id === target?.id) {
      setWon(true);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
      setRevealed((current) => {
        const next = new Set(current);
        for (let i = 0; i < 3 && next.size < 64; i += 1)
          next.add((next.size * 17 + nextGuesses.length * 7) % 64);
        return next;
      });
    }
  };
  const reset = () => {
    setSeed(Math.random());
    setRevealed(new Set(INITIAL_REVEALED));
    setGuesses([]);
    setWon(false);
    setFeedback(null);
  };
  const remaining = Math.max(0, 6 - guesses.length);
  const pick = (zh: string, en: string, ja: string) =>
    locale === "zh-CN" ? zh : locale === "ja" ? ja : en;
  const guessedCharacters = guesses
    .map((id) => pool.find((item) => item.id === id))
    .filter((item): item is Character => Boolean(item));
  return (
    <main className={`sr-game portrait-page${won ? " is-finished" : ""}`}>
      <header className="sr-game-head">
        <div className="sr-game-title">
          <nav className="sr-crumb" aria-label={t("hub.backToHub")}>
            <Link className="game-hub-link" to="/">
              {t("nav.hub")}
            </Link>
            <span aria-hidden="true">/</span>
            <span>{pick("立绘挑战", "Portrait challenge", "立ち絵チャレンジ")}</span>
          </nav>
          <h1>{pick("猜角色 · 立绘", "Guess the character", "立ち絵でキャラ当て")}</h1>
          <p className="sr-game-intro">
            {pick(
              "8×8 遮罩开局揭示两格，每次猜错再揭示三格。普通角色与皮肤会视为同一角色。",
              "An 8×8 mask starts with two tiles and reveals three more after every miss.",
              "8×8 のマスクは最初に 2 マスだけ開き、外すたびに 3 マスずつ開きます。",
            )}
          </p>
        </div>
        <div className="sr-game-meta portrait-meta-head">
          <div className="sr-pips" role="img" aria-label={`${t("game.attempts")} ${remaining} / 6`}>
            {Array.from({ length: 6 }, (_, index) => (
              <i key={index} className={index < remaining ? "on" : ""} />
            ))}
          </div>
          <div className="portrait-actions">
            <Link className="portrait-pill" to="/playable/portrait/endless">
              <InfinityIcon size={15} aria-hidden="true" />
              {pick("立绘无尽", "Portrait endless", "立ち絵エンドレス")}
            </Link>
            <Link className="portrait-pill" to="/duel">
              <Users size={15} aria-hidden="true" />
              {pick("好友对战", "Friend match", "フレンド対戦")}
            </Link>
            <button
              className="portrait-pill is-icon"
              type="button"
              onClick={reset}
              title={pick("换一题", "New portrait", "別の問題")}
              aria-label={pick("换一题", "New portrait", "別の問題")}
            >
              <RotateCcw size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>
      <section className="sr-board-wrap portrait-stage">
        <div className="portrait-board-wrap">
          <div
            className={`portrait-board${targetSkin ? " has-skin" : ""}${target ? "" : " is-loading"}`}
            style={{ backgroundImage: targetImage ? `url(${targetImage})` : undefined }}
            role="img"
            aria-label={pick("遮罩立绘", "Masked portrait", "マスクされた立ち絵")}
            aria-busy={!target}
          >
            {Array.from({ length: 64 }, (_, index) => (
              <i
                key={index}
                className={target && (revealed.has(index) || won) ? "is-revealed" : ""}
              />
            ))}
            {!target ? (
              <span className="portrait-loading" role={roster.isError ? "alert" : "status"}>
                {roster.isError ? (
                  <>
                    {pick(
                      "立绘题库加载失败",
                      "Couldn't load portraits",
                      "立ち絵を読み込めませんでした",
                    )}
                    <button
                      type="button"
                      className="portrait-pill"
                      onClick={() => void roster.refetch()}
                    >
                      <RotateCcw size={14} aria-hidden="true" /> {t("common.retry")}
                    </button>
                  </>
                ) : (
                  <>
                    <Eye size={16} aria-hidden="true" />
                    {t("common.loading")}
                  </>
                )}
              </span>
            ) : null}
          </div>
        </div>
        <div className="portrait-side">
          <div className="portrait-meta">
            <span>
              {pick("第", "Guess", "")}
              <b>{Math.min(guesses.length + (won ? 0 : 1), 6)}</b>/6
              {pick(" 猜", "", " 回目")}
            </span>
            <span>
              {won
                ? target
                  ? `${target.names[locale]}${targetSkin ? ` · ${targetSkin.names[locale]}` : ""}`
                  : ""
                : pick("选择一个角色", "Choose a character", "キャラクターを選択")}
            </span>
          </div>
          {feedback === "correct" && target ? (
            <section
              className="game-result result-won result-animated"
              role="status"
              aria-live="polite"
            >
              <div className="result-icon">
                <Sparkles size={22} />
              </div>
              <CharacterAvatar character={target} size="large" priority />
              <div className="result-copy">
                <p>{t("game.wonTitle")}</p>
                <h2>{target.names[locale]}</h2>
                <small>
                  {t("game.answer")} · {guesses.length}/6
                </small>
              </div>
              <div className="result-actions">
                <button className="ticket-button" type="button" onClick={reset}>
                  <RotateCcw size={17} /> {t("game.playAgain")}
                </button>
              </div>
            </section>
          ) : feedback === "wrong" ? (
            <p className="portrait-feedback is-wrong" role="status" aria-live="polite">
              {locale === "zh-CN"
                ? `还不对，还剩 ${remaining} 次机会`
                : locale === "ja"
                  ? `不正解。残り ${remaining} 回`
                  : `Not quite. ${remaining} guesses left`}
            </p>
          ) : null}
          {!won ? (
            <div className="sr-composer sr-active-row portrait-picker">
              <CharacterCombobox
                variant="row"
                characters={pool}
                locale={locale}
                excludedIds={guessedIds}
                disabled={!target || won}
                onSubmit={guess}
                entityLabel={pick("选择角色", "Choose a character", "キャラクターを選択")}
              />
            </div>
          ) : null}
          {guessedCharacters.length > 0 ? (
            <ul className="portrait-guesses" aria-label={pick("已猜", "Guessed", "推測済み")}>
              {guessedCharacters.map((character) => (
                <li
                  key={character.id}
                  className={character.id === target?.id ? "is-correct" : undefined}
                >
                  <CharacterAvatar character={character} size="small" />
                  <span>{character.names[locale]}</span>
                  <b aria-hidden="true">{character.id === target?.id ? "✓" : "✕"}</b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="portrait-hint">
              {pick(
                "提示：可以输入中文、英文、日文或拼音搜索角色。",
                "Tip: search by Chinese, English, Japanese or pinyin.",
                "ヒント：中国語・英語・日本語・ピンインで検索できます。",
              )}
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

export function PortraitEndlessPage() {
  return <EndlessPage contentModeId="portrait" bundledRoster={characters} />;
}
