import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PlayableTutorial } from "./PlayableTutorial";
import {
  PLAYABLE_TUTORIAL_STORAGE_KEY,
  hasCompletedGuestPlayableTutorial,
  markGuestPlayableTutorialCompleted,
  supportsPlayableTutorial,
} from "./playable-tutorial-state";

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  clear() {
    this.values.clear();
  }
  getItem(key: string) {
    return this.values.get(key) ?? null;
  }
  key(index: number) {
    return [...this.values.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.values.delete(key);
  }
  setItem(key: string, value: string) {
    this.values.set(key, value);
  }
}

describe("首次普通角色教学", () => {
  it("游客完成状态只写入版本化本地键", () => {
    const storage = new MemoryStorage();
    expect(hasCompletedGuestPlayableTutorial(storage)).toBe(false);
    markGuestPlayableTutorialCompleted(storage);
    expect(storage.getItem(PLAYABLE_TUTORIAL_STORAGE_KEY)).toBe("1");
    expect(hasCompletedGuestPlayableTutorial(storage)).toBe(true);
  });

  it("固定示例一次呈现三种颜色与版本方向，并允许立即跳过", () => {
    const markup = renderToStaticMarkup(
      <PlayableTutorial
        locale="zh-CN"
        busy={false}
        error={false}
        onComplete={() => undefined}
        onSkip={() => undefined}
      />,
    );

    expect(markup).toContain("教学示例，不是今日答案");
    expect(markup).toContain("tutorial-state-exact");
    expect(markup).toContain("tutorial-state-close");
    expect(markup).toContain("tutorial-state-miss");
    expect(markup).toContain("tutorial-state-direction");
    expect(markup).toContain("跳过教学");
  });

  it.each(["npc", "currency-wars", "aeon"])("%s 不复制普通角色教学", (modeId) => {
    expect(supportsPlayableTutorial(modeId)).toBe(false);
  });
});
