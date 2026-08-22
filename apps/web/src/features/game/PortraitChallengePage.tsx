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
  return (
    <main className="portrait-page">
      <section className="portrait-head">
        <div>
          <span className="eyebrow">{locale === "zh-CN" ? "立绘挑战" : "PORTRAIT CHALLENGE"}</span>
          <h1>{locale === "zh-CN" ? "猜角色 · 立绘" : "Guess the character"}</h1>
          <p>
            {locale === "zh-CN"
              ? "8×8 遮罩开局揭示两格，每次猜错再揭示三格。普通角色与皮肤会视为同一角色。"
              : "An 8×8 mask starts with two tiles and reveals three more after every miss."}
          </p>
        </div>
        <div className="portrait-actions">
          <Link to="/playable/portrait/endless">
            <InfinityIcon size={16} />
            {locale === "zh-CN" ? "立绘无尽" : "Portrait endless"}
          </Link>
          <Link to="/duel">
            <Users size={16} />
            {locale === "zh-CN" ? "好友对战" : "Friend match"}
          </Link>
          <button type="button" onClick={reset} title="Reset">
            <RotateCcw size={16} />
          </button>
        </div>
      </section>
      <section className="portrait-board-wrap">
        <div
          className={`portrait-board${targetSkin ? " has-skin" : ""}`}
          style={{ backgroundImage: targetImage ? `url(${targetImage})` : undefined }}
          aria-label="masked portrait"
        >
          {Array.from({ length: 64 }, (_, index) => (
            <i key={index} className={revealed.has(index) || won ? "is-revealed" : ""} />
          ))}
          {!target ? (
            <span className="portrait-loading">
              <Eye size={18} />
              Loading
            </span>
          ) : null}
        </div>
        {feedback === "correct" && target ? (
          <section
            className="game-result result-won result-animated"
            role="status"
            aria-live="polite"
          >
            <div className="result-icon">
              <Sparkles size={25} />
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
              ? `还不对，还剩 ${Math.max(0, 6 - guesses.length)} 次机会`
              : locale === "ja"
                ? `不正解。残り ${Math.max(0, 6 - guesses.length)} 回`
                : `Not quite. ${Math.max(0, 6 - guesses.length)} guesses left`}
          </p>
        ) : null}
        <div className="portrait-meta">
          <span>{guesses.length}/6</span>
          <span>
            {won
              ? target
                ? `${target.names[locale]}${targetSkin ? ` · ${targetSkin.names[locale]}` : ""}`
                : ""
              : locale === "zh-CN"
                ? "选择一个角色"
                : "Choose a character"}
          </span>
        </div>
      </section>
      <section className="portrait-picker">
        <CharacterCombobox
          characters={pool}
          locale={locale}
          excludedIds={guessedIds}
          disabled={!target || won}
          onSubmit={guess}
          entityLabel={
            locale === "zh-CN"
              ? "选择角色"
              : locale === "ja"
                ? "キャラクターを選択"
                : "Choose a character"
          }
        />
      </section>
    </main>
  );
}

export function PortraitEndlessPage() {
  return <EndlessPage contentModeId="portrait" bundledRoster={characters} />;
}
