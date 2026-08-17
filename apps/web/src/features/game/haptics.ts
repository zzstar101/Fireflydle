export type GameHapticEvent = "submit" | "win" | "life-lost";

const HAPTIC_PATTERNS: Record<GameHapticEvent, VibratePattern> = {
  submit: 10,
  win: [14, 24, 18],
  "life-lost": 18,
};

export function triggerGameHaptic(
  event: GameHapticEvent,
  vibrationApi: Pick<Navigator, "vibrate"> | undefined = typeof navigator === "undefined"
    ? undefined
    : navigator,
): boolean {
  if (typeof vibrationApi?.vibrate !== "function") return false;

  try {
    return vibrationApi.vibrate(HAPTIC_PATTERNS[event]);
  } catch {
    return false;
  }
}
