import { useState } from "react";
import type { CharacterSummary } from "@fireflydle/contracts";
import { usePreferences } from "../state/preferences";

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
  const pixels = size === "small" ? 38 : size === "large" ? 88 : 52;

  return (
    <span
      className={`character-avatar avatar-${size} element-${character.element}`}
      aria-label={name}
    >
      {!failed ? (
        <img
          src={character.assets.avatarPath}
          alt=""
          width={pixels}
          height={pixels}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initials}</span>
      )}
    </span>
  );
}
