import { useState } from "react";
import type { CharacterSummary } from "@fireflydle/contracts";
import { usePreferences } from "../state/preferences";

const PIXELS_BY_SIZE = { small: 38, medium: 52, large: 88 } as const;

export function getCharacterImageSources(character: CharacterSummary, pixels: number) {
  const responsive = character.assets.responsive?.toSorted(
    (left, right) => left.width - right.width,
  );
  const selected = responsive?.find((variant) => variant.width >= pixels) ?? responsive?.at(-1);
  return {
    width: selected?.width ?? pixels,
    avifPath: selected?.avifPath,
    webpPath: selected?.webpPath,
    fallbackPath: character.assets.avatarPath,
    avifSrcSet: responsive?.map((variant) => `${variant.avifPath} ${variant.width}w`).join(", "),
    webpSrcSet: responsive?.map((variant) => `${variant.webpPath} ${variant.width}w`).join(", "),
  };
}

export function CharacterAvatar({
  character,
  size = "medium",
  priority = false,
}: {
  character: CharacterSummary;
  size?: "small" | "medium" | "large";
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const locale = usePreferences((state) => state.language);
  const name = character.names[locale];
  const initials = name.slice(0, 2).toUpperCase();
  const pixels = PIXELS_BY_SIZE[size];
  const imageSources = getCharacterImageSources(character, pixels);

  return (
    <span
      className={`character-avatar avatar-${size} element-${character.element}`}
      aria-label={name}
    >
      {!failed ? (
        <picture>
          {imageSources.avifSrcSet && (
            <source type="image/avif" srcSet={imageSources.avifSrcSet} sizes={`${pixels}px`} />
          )}
          {imageSources.webpSrcSet && (
            <source type="image/webp" srcSet={imageSources.webpSrcSet} sizes={`${pixels}px`} />
          )}
          <img
            src={imageSources.fallbackPath}
            alt=""
            width={pixels}
            height={pixels}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            onError={() => setFailed(true)}
          />
        </picture>
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}
