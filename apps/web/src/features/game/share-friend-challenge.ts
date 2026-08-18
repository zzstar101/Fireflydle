import type { Locale } from "@fireflydle/contracts";

export interface FriendChallengeShareSummary {
  locale: Locale;
  won: boolean;
  guessCount: number;
  maxAttempts: number;
  elapsedMs: number;
  challengeUrl: string;
}

export interface FriendChallengeSharePayload {
  title: string;
  text: string;
  url: string;
}

interface NativeSharePort {
  share?: (data: ShareData) => Promise<void>;
  canShare?: (data: ShareData) => boolean;
}

export type NativeShareResult = "shared" | "fallback" | "cancelled";

function formatElapsed(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1_000));
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

export function buildFriendChallengeSharePayload(
  input: FriendChallengeShareSummary,
): FriendChallengeSharePayload {
  const score = `${input.guessCount}/${input.maxAttempts} · ${formatElapsed(input.elapsedMs)}`;
  if (input.locale === "zh-CN") {
    return {
      title: "萤一把 · 好友同题挑战",
      text: `我在萤一把${input.won ? "猜中了" : "完成了"}这道题：${score}。来挑战同一个答案！`,
      url: input.challengeUrl,
    };
  }
  if (input.locale === "ja") {
    return {
      title: "Fireflydle · フレンド挑戦",
      text: `Fireflydleで${input.won ? "正解" : "挑戦完了"}：${score}。同じ問題に挑戦しよう！`,
      url: input.challengeUrl,
    };
  }
  return {
    title: "Fireflydle · Friend challenge",
    text: `I ${input.won ? "solved" : "finished"} this Fireflydle in ${score}. Try the same puzzle!`,
    url: input.challengeUrl,
  };
}

export async function tryNativeFriendChallengeShare(
  payload: FriendChallengeSharePayload,
  image: Blob,
  fileName: string,
  port: NativeSharePort = navigator,
): Promise<NativeShareResult> {
  if (!port.share) return "fallback";

  const file = new File([image], fileName, { type: "image/png" });
  const basicData: ShareData = payload;
  const fileData: ShareData = { ...payload, files: [file] };
  const data = port.canShare?.(fileData) ? fileData : basicData;

  try {
    await port.share(data);
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    return "fallback";
  }
}

export async function copyShareText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("CLIPBOARD_UNAVAILABLE");
}
