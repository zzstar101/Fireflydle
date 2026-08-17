import { useMemo } from "react";
import type { AeonSummary, Locale } from "@fireflydle/contracts";
import { aeonRevealedCells } from "@fireflydle/game-engine";

export function AeonGuessBoard({
  gameId,
  wrongGuesses,
  answer,
  imagePath,
  imageFocus,
  locale,
  finished,
}: {
  gameId: string;
  wrongGuesses: number;
  answer: AeonSummary | null;
  imagePath?: string | undefined;
  imageFocus?: readonly [number, number] | undefined;
  locale: Locale;
  finished: boolean;
}) {
  const revealed = useMemo(() => aeonRevealedCells(gameId, wrongGuesses), [gameId, wrongGuesses]);
  const path = answer?.assets.imagePath ?? imagePath;
  const focus = answer?.assets.focus ?? imageFocus ?? [0.5, 0.5];
  return (
    <section
      className="aeon-guess-board"
      aria-label={locale === "en" ? "Aeon image" : locale === "ja" ? "星神画像" : "星神图片"}
    >
      <div
        className="aeon-image-grid"
        style={{
          backgroundImage: path ? `url(${path})` : undefined,
          backgroundPosition: `${focus[0] * 100}% ${focus[1] * 100}%`,
        }}
      >
        {Array.from({ length: 16 }, (_, index) => (
          <span
            key={index}
            className={revealed.has(index) || finished ? "revealed" : "masked"}
            aria-hidden="true"
          />
        ))}
      </div>
      {!finished && (
        <p>
          {locale === "en"
            ? "Identify the Aeon from the image."
            : locale === "ja"
              ? "画像から星神を当ててください。"
              : "根据图片猜出星神。"}
        </p>
      )}
      {finished && answer && <h2>{answer.names[locale]}</h2>}
    </section>
  );
}
