import type { FeedbackState, FieldDefinition, GuessResult, Locale } from "@fireflydle/contracts";
import { contentManifest } from "@fireflydle/game-data/playable";
import QRCode from "qrcode";

export const SHARE_IMAGE_WIDTH = 1080;
export const SHARE_IMAGE_HEIGHT = 1350;

export interface ShareResultImageInput {
  locale: Locale;
  activityId: "daily" | "practice";
  dateKey: string;
  guesses: readonly GuessResult[];
  fieldDefinitions?: readonly FieldDefinition[];
  maxAttempts: number;
  won: boolean;
  elapsedMs: number;
  siteUrl: string;
}

interface ShareLabels {
  brand: string;
  subtitle: string;
  daily: string;
  practice: string;
  won: string;
  lost: string;
  guesses: string;
  time: string;
  limit: string;
  character: string;
  legend: string;
  footer: string;
}

const LABELS: Record<Locale, ShareLabels> = {
  "zh-CN": {
    brand: "萤一把",
    subtitle: "星穹铁道角色猜谜",
    daily: "每日一题",
    practice: "随机挑战",
    won: "猜中",
    lost: "未猜中",
    guesses: "尝试",
    time: "用时",
    limit: "上限",
    character: "猜测",
    legend: "一致  ·  接近  ·  不一致  ·  不可用",
    footer: "每位玩家  ·  每日不同谜题",
  },
  en: {
    brand: "Fireflydle",
    subtitle: "A HONKAI: STAR RAIL CHARACTER GAME",
    daily: "DAILY PUZZLE",
    practice: "RANDOM RUN",
    won: "SOLVED",
    lost: "NOT SOLVED",
    guesses: "GUESSES",
    time: "TIME",
    limit: "LIMIT",
    character: "GUESS",
    legend: "EXACT  ·  CLOSE  ·  MISS  ·  UNAVAILABLE",
    footer: "ONE DAY  ·  A PUZZLE OF YOUR OWN",
  },
  ja: {
    brand: "Fireflydle",
    subtitle: "崩壊：スターレイル キャラクタークイズ",
    daily: "デイリー",
    practice: "ランダム",
    won: "正解",
    lost: "失敗",
    guesses: "試行",
    time: "タイム",
    limit: "上限",
    character: "推測",
    legend: "一致  ·  近い  ·  不一致  ·  利用不可",
    footer: "プレイヤーごとに異なるデイリー問題",
  },
};

export interface ShareCardGuess {
  name: string;
  cells: readonly FeedbackState[];
}

export interface ShareCardModel {
  brand: string;
  subtitle: string;
  activity: string;
  date: string;
  status: string;
  attempts: string;
  time: string;
  limit: string;
  metricLabels: readonly [string, string, string];
  characterLabel: string;
  fields: readonly string[];
  legend: string;
  footer: string;
  guesses: readonly ShareCardGuess[];
  site: string;
  qrUrl: string;
}

function formatElapsed(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return `${Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}

function shareCardSiteLabel(siteUrl: string): string {
  const url = new URL(siteUrl);
  return `${url.host}${url.pathname.startsWith("/challenge/") ? "/challenge" : url.pathname.replace(/\/$/u, "")}`;
}

export function buildShareCardModel(input: ShareResultImageInput): ShareCardModel {
  const labels = LABELS[input.locale];
  const definitions =
    input.fieldDefinitions ??
    contentManifest.modes.find((mode) => mode.id === "playable")?.fields ??
    [];
  return {
    brand: labels.brand,
    subtitle: labels.subtitle,
    activity: input.activityId === "daily" ? labels.daily : labels.practice,
    date: input.dateKey.replaceAll("-", "."),
    status: input.won ? labels.won : labels.lost,
    attempts: `${input.guesses.length} / ${input.maxAttempts}`,
    time: formatElapsed(input.elapsedMs),
    limit: String(input.maxAttempts),
    metricLabels: [labels.guesses, labels.time, labels.limit],
    characterLabel: labels.character,
    fields: definitions.map((field) => field.label[input.locale]),
    legend: labels.legend,
    footer: labels.footer,
    guesses: input.guesses.map((guess, index) => ({
      name: `#${String(index + 1).padStart(2, "0")}`,
      cells: definitions.map(
        (field) => guess.cells.find((cell) => cell.field === field.id)?.state ?? "unavailable",
      ),
    })),
    site: shareCardSiteLabel(input.siteUrl),
    qrUrl: input.siteUrl,
  };
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.arcTo(x + width, y, x + width, y + height, safeRadius);
  context.arcTo(x + width, y + height, x, y + height, safeRadius);
  context.arcTo(x, y + height, x, y, safeRadius);
  context.arcTo(x, y, x + width, y, safeRadius);
  context.closePath();
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("SHARE_IMAGE_ASSET_FAILED"));
    image.src = source;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("SHARE_IMAGE_ENCODING_FAILED"));
    }, "image/png");
  });
}

export async function generateShareResultImage(input: ShareResultImageInput): Promise<Blob> {
  await document.fonts.ready;
  const model = buildShareCardModel(input);
  const [logo, qrCode] = await Promise.all([
    loadImage(new URL("/favicon.png", window.location.href).href).catch(() => null),
    QRCode.toDataURL(model.qrUrl, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 160,
      color: { dark: "#07101d", light: "#f6f0df" },
    }).then(loadImage),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_IMAGE_WIDTH;
  canvas.height = SHARE_IMAGE_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("SHARE_IMAGE_CANVAS_UNAVAILABLE");

  const background = context.createLinearGradient(0, 0, SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT);
  background.addColorStop(0, "#07101d");
  background.addColorStop(0.62, "#0b1928");
  background.addColorStop(1, "#10243a");
  context.fillStyle = background;
  context.fillRect(0, 0, SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT);

  // 微弱网格让图片延续站内的情报终端质感。
  context.strokeStyle = "rgba(121, 215, 232, 0.055)";
  context.lineWidth = 1;
  for (let x = 0; x <= SHARE_IMAGE_WIDTH; x += 54) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, SHARE_IMAGE_HEIGHT);
    context.stroke();
  }
  for (let y = 0; y <= SHARE_IMAGE_HEIGHT; y += 54) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(SHARE_IMAGE_WIDTH, y);
    context.stroke();
  }

  const glow = context.createRadialGradient(925, 165, 20, 925, 165, 310);
  glow.addColorStop(0, "rgba(121, 215, 232, 0.18)");
  glow.addColorStop(1, "rgba(121, 215, 232, 0)");
  context.fillStyle = glow;
  context.fillRect(600, 0, 480, 490);

  context.fillStyle = "#d8b66b";
  context.fillRect(0, 0, 18, SHARE_IMAGE_HEIGHT);
  context.fillStyle = "rgba(216, 182, 107, 0.32)";
  context.fillRect(34, 0, 2, SHARE_IMAGE_HEIGHT);

  if (logo) {
    context.save();
    roundedRect(context, 72, 72, 112, 112, 28);
    context.clip();
    context.drawImage(logo, 72, 72, 112, 112);
    context.restore();
    context.strokeStyle = "rgba(240, 214, 139, 0.62)";
    context.lineWidth = 3;
    roundedRect(context, 72, 72, 112, 112, 28);
    context.stroke();
  } else {
    context.fillStyle = "#79d7e8";
    roundedRect(context, 72, 72, 112, 112, 28);
    context.fill();
  }

  context.fillStyle = "#f6f0df";
  context.font = '700 68px "Iowan Old Style", "Noto Serif SC", Georgia, serif';
  context.fillText(model.brand, 216, 137);
  context.fillStyle = "#9aa8b9";
  context.font = '600 20px Inter, "Noto Sans SC", "Segoe UI", sans-serif';
  context.letterSpacing = "2px";
  context.fillText(model.subtitle, 218, 174);
  context.letterSpacing = "0px";

  context.textAlign = "right";
  context.fillStyle = "#79d7e8";
  context.font = '700 23px Inter, "Noto Sans SC", "Segoe UI", sans-serif';
  context.fillText(model.activity, 1008, 105);
  context.fillStyle = "#f0d68b";
  context.font = '700 38px "Roboto Mono", Consolas, monospace';
  context.fillText(model.date, 1008, 153);
  context.textAlign = "left";

  roundedRect(context, 72, 254, 936, 210, 24);
  context.fillStyle = "rgba(13, 26, 42, 0.9)";
  context.fill();
  context.strokeStyle = "rgba(216, 182, 107, 0.32)";
  context.lineWidth = 2;
  context.stroke();

  context.fillStyle = input.won ? "#79d7e8" : "#e36b6b";
  context.font = '700 25px Inter, "Noto Sans SC", "Segoe UI", sans-serif';
  context.fillText(model.status, 112, 310);

  const metrics = [model.attempts, model.time, model.limit];
  for (let index = 0; index < metrics.length; index += 1) {
    const x = 112 + index * 296;
    if (index > 0) {
      context.fillStyle = "rgba(216, 182, 107, 0.22)";
      context.fillRect(x - 30, 326, 2, 92);
    }
    context.fillStyle = "#f6f0df";
    context.font = '700 48px "Roboto Mono", "Noto Sans SC", Consolas, monospace';
    context.fillText(metrics[index] ?? "", x, 382);
    context.fillStyle = "#6f7e91";
    context.font = '700 18px Inter, "Noto Sans SC", "Segoe UI", sans-serif';
    context.fillText(model.metricLabels[index] ?? "", x, 418);
  }

  const identityWidth = 110;
  const cellGap = 10;
  const fieldCount = Math.max(1, model.fields.length);
  const gridWidth = SHARE_IMAGE_WIDTH - 144;
  const cellWidth = (gridWidth - identityWidth - cellGap * (fieldCount - 1)) / fieldCount;
  const gridX = (SHARE_IMAGE_WIDTH - gridWidth) / 2;
  context.textAlign = "center";
  context.fillStyle = "#6f7e91";
  context.font = '700 16px Inter, "Noto Sans SC", "Segoe UI", sans-serif';
  context.fillText(model.characterLabel, gridX + identityWidth / 2, 526);
  for (let index = 0; index < model.fields.length; index += 1) {
    context.fillText(
      model.fields[index] ?? "",
      gridX + identityWidth + index * (cellWidth + cellGap) + cellWidth / 2,
      526,
    );
  }

  const rowGap = 12;
  const rowHeight = Math.min(
    82,
    (560 - Math.max(0, model.guesses.length - 1) * rowGap) / Math.max(1, model.guesses.length),
  );
  const gridHeight =
    model.guesses.length * rowHeight + Math.max(0, model.guesses.length - 1) * rowGap;
  const gridY = 558 + Math.max(0, (560 - gridHeight) / 2);
  const colors: Record<FeedbackState, string> = {
    exact: "#2eaa7b",
    close: "#d59a35",
    miss: "#3b4658",
    unavailable: "#667085",
  };
  const symbols: Record<FeedbackState, string> = {
    exact: "✓",
    close: "•",
    miss: "×",
    unavailable: "–",
  };

  for (let rowIndex = 0; rowIndex < model.guesses.length; rowIndex += 1) {
    const guess = model.guesses[rowIndex];
    if (!guess) continue;
    const y = gridY + rowIndex * (rowHeight + rowGap);

    roundedRect(context, gridX, y, identityWidth - cellGap, rowHeight, 15);
    context.fillStyle = "rgba(19, 36, 58, 0.94)";
    context.fill();
    context.strokeStyle = "rgba(216, 182, 107, 0.16)";
    context.lineWidth = 1;
    context.stroke();

    context.fillStyle = "#f6f0df";
    context.font = '700 22px "Roboto Mono", Consolas, monospace';
    context.fillText(guess.name, gridX + (identityWidth - cellGap) / 2, y + rowHeight / 2 + 8);
    context.textAlign = "center";

    for (let cellIndex = 0; cellIndex < guess.cells.length; cellIndex += 1) {
      const state = guess.cells[cellIndex];
      if (!state) continue;
      const x = gridX + identityWidth + cellIndex * (cellWidth + cellGap);
      context.shadowColor = `${colors[state]}55`;
      context.shadowBlur = 20;
      roundedRect(context, x, y, cellWidth, rowHeight, 15);
      context.fillStyle = colors[state];
      context.fill();
      context.shadowBlur = 0;
      context.fillStyle = "rgba(255, 255, 255, 0.92)";
      context.font = '700 30px Inter, "Segoe UI Symbol", sans-serif';
      context.fillText(symbols[state], x + cellWidth / 2, y + rowHeight / 2 + 11);
    }
  }

  context.fillStyle = "#9aa8b9";
  context.font = '600 17px Inter, "Noto Sans SC", "Segoe UI", sans-serif';
  context.fillText(model.legend, SHARE_IMAGE_WIDTH / 2, 1189);
  context.fillStyle = "rgba(216, 182, 107, 0.35)";
  context.fillRect(72, 1232, 746, 2);

  context.textAlign = "left";
  context.fillStyle = "#f0d68b";
  context.font = '700 24px "Roboto Mono", Consolas, monospace';
  context.fillText(model.site, 72, 1275);
  context.fillStyle = "#6f7e91";
  context.font = '600 17px Inter, "Noto Sans SC", "Segoe UI", sans-serif';
  context.fillText(model.footer, 72, 1310);

  roundedRect(context, 858, 1188, 150, 150, 12);
  context.fillStyle = "#f6f0df";
  context.fill();
  context.drawImage(qrCode, 858, 1188, 150, 150);

  return canvasToBlob(canvas);
}

export function shareImageFileName(input: Pick<ShareResultImageInput, "dateKey" | "activityId">) {
  return `fireflydle-${input.activityId}-${input.dateKey}.png`;
}
