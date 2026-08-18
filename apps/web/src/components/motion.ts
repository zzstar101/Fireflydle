export type MotionMode = "full" | "reduced";

export function motionModeFromPreference(prefersReducedMotion: boolean): MotionMode {
  return prefersReducedMotion ? "reduced" : "full";
}

export function motionPausedForPage(isVisible: boolean, hasFocus: boolean): boolean {
  return !isVisible || !hasFocus;
}
