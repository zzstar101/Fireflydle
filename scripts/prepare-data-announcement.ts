import { createHash } from "node:crypto";
import { appendFile } from "node:fs/promises";
import { CharacterSchema, type Character } from "../packages/contracts/src/index.ts";

// 排除抓取时间和来源修订，避免上游无关编辑触发重复部署。
export function rosterSignature(characters: Character[]): string {
  return JSON.stringify(
    characters
      .map((character) => ({
        id: character.id,
        names: character.names,
        aliases: character.aliases,
        element: character.element,
        path: character.path,
        rarity: character.rarity,
        factionId: character.factionId,
        factionGroupId: character.factionGroupId,
        releaseVersionId: character.releaseVersionId,
        enabled: character.enabled,
        targetEligible: character.targetEligible,
        assetSha256: character.assets.sha256,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  );
}

export function prepareDataAnnouncement(previous: Character[], current: Character[]) {
  const previousIds = new Set(previous.map((character) => character.id));
  const currentIds = new Set(current.map((character) => character.id));
  if (previous.some((character) => !currentIds.has(character.id)))
    throw new Error("同步会移除线上角色，停止自动发布并等待人工审核。");
  const signature = rosterSignature(current);
  const changed = signature !== rosterSignature(previous);
  const added = current.filter((character) => !previousIds.has(character.id));
  const digest = createHash("sha256").update(signature).digest("hex").slice(0, 16);
  return {
    changed,
    announcement: {
      tagName: `roster-${digest}`,
      name: "萤一把 · 角色池自动更新",
      body: [
        "## 角色资料已同步",
        added.length
          ? `新增角色：${added.map((character) => character.names["zh-CN"]).join("、")}。`
          : "本次校正了已收录角色的资料、搜索别名或图片。",
        `当前收录 **${current.length}** 个可玩形态，可在普通角色题库、图鉴和立绘挑战中遇见。`,
        "资料来自星铁官网；Wiki 用于补充官网已发布角色的属性。现有对局继续使用开局时的资料。",
      ].join("\n\n"),
    },
  };
}

if (import.meta.main) {
  const response = await fetch("https://api.fireflydle.games/api/characters", {
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error(`无法读取线上角色池：${response.status}`);
  const payload = (await response.json()) as { ok: boolean; data: unknown };
  if (!payload.ok) throw new Error("线上角色池返回失败。");
  const previous = CharacterSchema.array().min(80).parse(payload.data);
  const current = CharacterSchema.array()
    .min(80)
    .parse(await Bun.file("packages/game-data/src/generated/characters.json").json());
  const result = prepareDataAnnouncement(previous, current);
  await Bun.write("release-announcement.json", `${JSON.stringify(result.announcement, null, 2)}\n`);
  if (process.env.GITHUB_OUTPUT)
    await appendFile(process.env.GITHUB_OUTPUT, `changed=${result.changed}\n`, "utf8");
  console.log(result.changed ? "发现角色池变化，公告已生成。" : "线上角色池已是最新，无需发布。");
}
