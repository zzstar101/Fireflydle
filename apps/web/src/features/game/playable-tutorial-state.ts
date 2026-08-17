export const PLAYABLE_TUTORIAL_STORAGE_KEY = "fireflydle-playable-tutorial:v1";

export function supportsPlayableTutorial(contentModeId: string): boolean {
  return contentModeId === "playable";
}

export function hasCompletedGuestPlayableTutorial(storage: Storage): boolean {
  try {
    return storage.getItem(PLAYABLE_TUTORIAL_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markGuestPlayableTutorialCompleted(storage: Storage): void {
  try {
    storage.setItem(PLAYABLE_TUTORIAL_STORAGE_KEY, "1");
  } catch {
    // 禁用本地存储时，仅在当前页面生命周期内记住完成状态。
  }
}
