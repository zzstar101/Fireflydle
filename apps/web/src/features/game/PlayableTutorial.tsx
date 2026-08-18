import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowUp, Check, CircleDot, GraduationCap, X } from "lucide-react";
import type { Locale } from "@fireflydle/contracts";

const copy = {
  "zh-CN": {
    eyebrow: "10 秒上手",
    title: "看一眼反馈，就能开始猜",
    spoiler: "教学示例，不是今日答案",
    intro: "每次猜测都会逐项比较。下面这行固定示例同时展示全部反馈。",
    character: "示例角色",
    element: "属性",
    path: "命途",
    faction: "阵营",
    version: "版本 2.1",
    exact: "绿色：完全一致",
    close: "黄色：部分接近",
    miss: "灰色：不一致",
    direction: "目标版本更高",
    skip: "跳过教学",
    complete: "明白了，开始游戏",
    saving: "正在保存",
    error: "暂时无法保存，请重试。",
  },
  en: {
    eyebrow: "10-SECOND START",
    title: "Read the feedback, then start guessing",
    spoiler: "Tutorial example, not today's answer",
    intro: "Every guess is compared field by field. This fixed row shows every result at once.",
    character: "Example character",
    element: "Element",
    path: "Path",
    faction: "Faction",
    version: "Version 2.1",
    exact: "Green: exact match",
    close: "Yellow: close match",
    miss: "Gray: no match",
    direction: "Target version is higher",
    skip: "Skip tutorial",
    complete: "Got it, start playing",
    saving: "Saving",
    error: "Could not save yet. Please retry.",
  },
  ja: {
    eyebrow: "10秒ガイド",
    title: "ヒントを見て、すぐに推測",
    spoiler: "今日の答えではない固定例です",
    intro: "推測は項目ごとに比較されます。この固定例ですべての結果を確認できます。",
    character: "サンプルキャラ",
    element: "属性",
    path: "運命",
    faction: "陣営",
    version: "Ver. 2.1",
    exact: "緑：完全一致",
    close: "黄：一部一致",
    miss: "灰：不一致",
    direction: "正解のバージョンは上",
    skip: "ガイドをスキップ",
    complete: "わかった、ゲーム開始",
    saving: "保存中",
    error: "保存できませんでした。もう一度お試しください。",
  },
} as const;

export function PlayableTutorial({
  locale,
  busy,
  error,
  onComplete,
  onSkip,
}: {
  locale: Locale;
  busy: boolean;
  error: boolean;
  onComplete: () => void;
  onSkip: () => void;
}) {
  const labels = copy[locale];
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialogRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) {
        onSkip();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      const first = focusable?.[0];
      const last = focusable?.[focusable.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [busy, onSkip]);

  const tutorial = (
    <div className="tutorial-backdrop">
      <div
        ref={dialogRef}
        className="playable-tutorial"
        role="dialog"
        aria-modal="true"
        aria-labelledby="playable-tutorial-title"
        tabIndex={-1}
      >
        <header>
          <div className="tutorial-heading-mark" aria-hidden="true">
            <GraduationCap size={22} />
          </div>
          <div>
            <span className="eyebrow">{labels.eyebrow}</span>
            <h2 id="playable-tutorial-title">{labels.title}</h2>
          </div>
        </header>

        <div className="tutorial-body">
          <p className="tutorial-spoiler-note">{labels.spoiler}</p>
          <p>{labels.intro}</p>
          <div className="tutorial-example" aria-label={labels.spoiler}>
            <strong>{labels.character}</strong>
            <span className="tutorial-state-exact">
              <Check size={15} aria-hidden="true" /> {labels.element}
              <small>{labels.exact}</small>
            </span>
            <span className="tutorial-state-close">
              <CircleDot size={15} aria-hidden="true" /> {labels.path}
              <small>{labels.close}</small>
            </span>
            <span className="tutorial-state-miss">
              <X size={15} aria-hidden="true" /> {labels.faction}
              <small>{labels.miss}</small>
            </span>
            <span className="tutorial-state-direction">
              <ArrowUp size={15} aria-hidden="true" /> {labels.version}
              <small>{labels.direction}</small>
            </span>
          </div>
          {error ? (
            <p className="tutorial-save-error" role="alert">
              {labels.error}
            </p>
          ) : null}
        </div>

        <footer>
          <button type="button" disabled={busy} onClick={onSkip}>
            {labels.skip}
          </button>
          <button className="ticket-button" type="button" disabled={busy} onClick={onComplete}>
            {busy ? <span className="button-spinner" aria-hidden="true" /> : <Check size={17} />}
            {busy ? labels.saving : labels.complete}
          </button>
        </footer>
      </div>
    </div>
  );

  return typeof document === "undefined" ? tutorial : createPortal(tutorial, document.body);
}
