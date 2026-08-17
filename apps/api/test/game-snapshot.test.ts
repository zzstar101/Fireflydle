import type { Character, PublicGame } from "@fireflydle/contracts";
import { SELF } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

const characters: Character[] = [
  {
    id: "snapshot-alpha",
    officialId: "snapshot-alpha",
    baseCharacterId: "snapshot-alpha",
    names: { "zh-CN": "快照甲", en: "Snapshot Alpha", ja: "スナップショット甲" },
    aliases: { "zh-CN": [], en: [], ja: [] },
    element: "fire",
    path: "destruction",
    rarity: 5,
    factionId: "snapshot-faction-a",
    factionGroupId: "snapshot-group",
    regionId: "snapshot-region-a",
    releaseVersionId: "1.0",
    releaseOrder: 10,
    assets: {
      avatarPath: "/assets/characters/snapshot-alpha.webp",
      portraitPath: "/assets/characters/snapshot-alpha.webp",
      sourceUrl: "https://example.com/snapshot-alpha",
      sourceUpdatedAt: "2026-08-01T00:00:00.000Z",
      sha256: "a".repeat(64),
      rightsNotice: "测试数据",
    },
    enabled: true,
    targetEligible: true,
    sourceRevision: "snapshot-v1",
  },
  {
    id: "snapshot-beta",
    officialId: "snapshot-beta",
    baseCharacterId: "snapshot-beta",
    names: { "zh-CN": "快照乙", en: "Snapshot Beta", ja: "スナップショット乙" },
    aliases: { "zh-CN": [], en: [], ja: [] },
    element: "ice",
    path: "hunt",
    rarity: 4,
    factionId: "snapshot-faction-b",
    factionGroupId: "snapshot-group",
    regionId: "snapshot-region-b",
    releaseVersionId: "1.1",
    releaseOrder: 11,
    assets: {
      avatarPath: "/assets/characters/snapshot-beta.webp",
      portraitPath: "/assets/characters/snapshot-beta.webp",
      sourceUrl: "https://example.com/snapshot-beta",
      sourceUpdatedAt: "2026-08-01T00:00:00.000Z",
      sha256: "b".repeat(64),
      rightsNotice: "测试数据",
    },
    enabled: true,
    targetEligible: true,
    sourceRevision: "snapshot-v1",
  },
];

characters.push(
  ...Array.from({ length: 5 }, (_, index): Character => {
    const id = `snapshot-extra-${index + 1}`;
    return {
      ...characters[0]!,
      id,
      officialId: id,
      baseCharacterId: id,
      names: {
        "zh-CN": `快照额外${index + 1}`,
        en: `Snapshot Extra ${index + 1}`,
        ja: `追加${index + 1}`,
      },
      regionId: index % 2 === 0 ? "snapshot-region-a" : "snapshot-region-b",
      assets: {
        ...characters[0]!.assets,
        avatarPath: `/assets/characters/${id}.webp`,
        portraitPath: `/assets/characters/${id}.webp`,
        sourceUrl: `https://example.com/${id}`,
        sha256: String(index + 3).repeat(64),
      },
    };
  }),
);

async function dataOf<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as { ok: boolean; data?: T };
  expect(payload.ok).toBe(true);
  if (!payload.data) throw new Error("缺少 API 数据");
  return payload.data;
}

async function seedCharacters(): Promise<void> {
  const now = Date.now();
  await env.DB.prepare("UPDATE characters SET enabled = 0, target_eligible = 0").run();
  await env.DB.batch(
    characters.map((character) =>
      env.DB.prepare(
        `INSERT INTO characters
           (id, official_id, base_character_id, element, path, rarity, faction_id,
            faction_group_id, release_version_id, release_order, enabled, target_eligible,
            source_revision, payload_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json,
           enabled = 1, target_eligible = 1, updated_at = excluded.updated_at`,
      ).bind(
        character.id,
        character.officialId,
        character.baseCharacterId,
        character.element,
        character.path,
        character.rarity,
        character.factionId,
        character.factionGroupId,
        character.releaseVersionId,
        character.releaseOrder,
        character.sourceRevision,
        JSON.stringify(character),
        now,
        now,
      ),
    ),
  );
}

async function createSession(): Promise<string> {
  const response = await SELF.fetch("https://fireflydle.games/api/session", { method: "POST" });
  expect(response.status).toBe(201);
  const cookie = response.headers.get("set-cookie");
  if (!cookie) throw new Error("缺少 session cookie");
  return cookie;
}

describe("单人模式快照迁移", () => {
  it("创建和恢复返回统一模式活动元数据且进行中不泄露答案", async () => {
    await seedCharacters();
    const cookie = await createSession();
    const request = () =>
      SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ mode: "random", difficulty: "hard" }),
      });

    const created = await dataOf<PublicGame>(await request());
    const resumed = await dataOf<PublicGame>(await request());
    expect(created).toMatchObject({
      mode: "random",
      modeId: "playable",
      activityId: "practice",
      poolRuleVersion: expect.stringMatching(/^\d+\.\d+(?:\.\d+)?$/),
      manifestVersion: expect.stringMatching(/^\d+\.\d+(?:\.\d+)?$/),
      fieldDefinitions: [
        expect.objectContaining({
          id: "element",
          label: { "zh-CN": "属性", en: "Element", ja: "属性" },
        }),
        expect.objectContaining({ id: "path" }),
        expect.objectContaining({ id: "rarity" }),
        expect.objectContaining({ id: "faction" }),
        expect.objectContaining({ id: "region" }),
        expect.objectContaining({ id: "version" }),
      ],
    });
    expect(created.difficulty).toBe("standard");
    expect(created.maxAttempts).toBe(6);
    expect(resumed).toMatchObject({
      id: created.id,
      modeId: created.modeId,
      activityId: created.activityId,
      poolRuleVersion: created.poolRuleVersion,
      manifestVersion: created.manifestVersion,
      answer: null,
    });
    expect(JSON.stringify(created)).not.toContain("snapshot-alpha");
    expect(JSON.stringify(created)).not.toContain("snapshot-beta");

    const dailyCookie = await createSession();
    const daily = await dataOf<PublicGame>(
      await SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie: dailyCookie, "content-type": "application/json" },
        body: JSON.stringify({ mode: "daily", difficulty: "casual" }),
      }),
    );
    expect(daily).toMatchObject({
      mode: "daily",
      modeId: "playable",
      activityId: "daily",
      difficulty: "standard",
      answer: null,
    });
  });

  it("恢复和回放使用创建时保存的字段标签与顺序", async () => {
    await seedCharacters();
    const cookie = await createSession();
    const created = await dataOf<PublicGame>(
      await SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ mode: "random", difficulty: "standard" }),
      }),
    );
    const stored = await env.DB.prepare("SELECT field_rules_json FROM games WHERE id = ?")
      .bind(created.id)
      .first<{ field_rules_json: string }>();
    if (!stored) throw new Error("缺少对局字段快照");
    const snapshot = JSON.parse(stored.field_rules_json) as {
      rules: unknown[];
      definitions: Array<{ id: string; label: Record<string, string> }>;
    };
    snapshot.definitions = snapshot.definitions.map((field) =>
      field.id === "element"
        ? { ...field, label: { "zh-CN": "快照属性", en: "Snapshot element", ja: "スナップ属性" } }
        : field,
    );
    await env.DB.prepare("UPDATE games SET field_rules_json = ? WHERE id = ?")
      .bind(JSON.stringify(snapshot), created.id)
      .run();

    const restored = await dataOf<PublicGame>(
      await SELF.fetch(`https://fireflydle.games/api/games/${created.id}`, {
        headers: { cookie },
      }),
    );
    expect(restored.fieldDefinitions?.map((field) => field.id)).toEqual(
      created.fieldDefinitions?.map((field) => field.id),
    );
    expect(restored.fieldDefinitions?.[0]?.label).toEqual({
      "zh-CN": "快照属性",
      en: "Snapshot element",
      ja: "スナップ属性",
    });
  });

  it("判题使用创建时答案快照而不是更新后的题库 payload", async () => {
    await seedCharacters();
    const cookie = await createSession();
    const created = await dataOf<PublicGame>(
      await SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ mode: "random", difficulty: "standard" }),
      }),
    );
    const row = await env.DB.prepare("SELECT target_character_id FROM games WHERE id = ?")
      .bind(created.id)
      .first<{ target_character_id: string }>();
    if (!row) throw new Error("缺少对局行");

    const changedRow = await env.DB.prepare("SELECT payload_json FROM characters WHERE id = ?")
      .bind(row.target_character_id)
      .first<{ payload_json: string }>();
    if (!changedRow) throw new Error("测试答案不在题库中");
    const changed = JSON.parse(changedRow.payload_json) as Character;
    await env.DB.prepare("UPDATE characters SET payload_json = ? WHERE id = ?")
      .bind(
        JSON.stringify({ ...changed, element: changed.element === "fire" ? "ice" : "fire" }),
        changed.id,
      )
      .run();

    const result = await dataOf<PublicGame>(
      await SELF.fetch(`https://fireflydle.games/api/games/${created.id}/guesses`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ characterId: changed.id }),
      }),
    );
    expect(result.status).toBe("won");
    expect(result.answer?.id).toBe(changed.id);
  });

  it("猜错候选的 payload 更新后仍按开局快照反馈", async () => {
    await seedCharacters();
    const cookie = await createSession();
    const created = await dataOf<PublicGame>(
      await SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ mode: "random", difficulty: "standard" }),
      }),
    );
    const targetRow = await env.DB.prepare(
      "SELECT target_character_id, target_payload_json FROM games WHERE id = ?",
    )
      .bind(created.id)
      .first<{ target_character_id: string; target_payload_json: string }>();
    if (!targetRow) throw new Error("缺少对局行");
    const candidate = characters.find((item) => item.id !== targetRow.target_character_id);
    if (!candidate) throw new Error("缺少猜错候选");
    await env.DB.prepare("UPDATE characters SET payload_json = ? WHERE id = ?")
      .bind(JSON.stringify({ ...candidate, element: "quantum" }), candidate.id)
      .run();

    const result = await dataOf<PublicGame>(
      await SELF.fetch(`https://fireflydle.games/api/games/${created.id}/guesses`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ characterId: candidate.id }),
      }),
    );
    const elementCell = result.guesses[0]?.cells.find((cell) => cell.field === "element");
    const target = JSON.parse(targetRow.target_payload_json) as Character;
    expect(elementCell?.state).toBe(target.element === candidate.element ? "exact" : "miss");
    expect(result.guesses[0]?.character.element).toBe(candidate.element);
  });

  it("提交判定读取对局创建时保存的字段规则快照", async () => {
    await seedCharacters();
    const cookie = await createSession();
    const created = await dataOf<PublicGame>(
      await SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ mode: "random", difficulty: "standard" }),
      }),
    );
    await env.DB.prepare("UPDATE games SET field_rules_json = ? WHERE id = ?")
      .bind(
        JSON.stringify([
          { field: "path", comparison: "exact" },
          { field: "path", comparison: "exact" },
          { field: "path", comparison: "exact" },
          { field: "path", comparison: "exact" },
          { field: "path", comparison: "exact" },
        ]),
        created.id,
      )
      .run();
    const targetRow = await env.DB.prepare("SELECT target_character_id FROM games WHERE id = ?")
      .bind(created.id)
      .first<{ target_character_id: string }>();
    if (!targetRow) throw new Error("缺少对局行");
    const guess = characters.find((item) => item.id !== targetRow.target_character_id);
    if (!guess) throw new Error("缺少猜错候选");
    const result = await dataOf<PublicGame>(
      await SELF.fetch(`https://fireflydle.games/api/games/${created.id}/guesses`, {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ characterId: guess.id }),
      }),
    );
    expect(result.guesses[0]?.cells.every((cell) => cell.field === "path")).toBe(true);
  });

  it("练习无论请求旧难度值都在第六次错误猜测后结算", async () => {
    await seedCharacters();
    const cookie = await createSession();
    const created = await dataOf<PublicGame>(
      await SELF.fetch("https://fireflydle.games/api/games", {
        method: "POST",
        headers: { cookie, "content-type": "application/json" },
        body: JSON.stringify({ mode: "random", difficulty: "casual" }),
      }),
    );
    const row = await env.DB.prepare("SELECT target_character_id FROM games WHERE id = ?")
      .bind(created.id)
      .first<{ target_character_id: string }>();
    if (!row) throw new Error("缺少对局行");
    const wrongIds = characters
      .filter((character) => character.id !== row.target_character_id)
      .map((character) => character.id);
    expect(wrongIds).toHaveLength(6);

    let current = created;
    for (const [index, characterId] of wrongIds.entries()) {
      current = await dataOf<PublicGame>(
        await SELF.fetch(`https://fireflydle.games/api/games/${created.id}/guesses`, {
          method: "POST",
          headers: { cookie, "content-type": "application/json" },
          body: JSON.stringify({ characterId }),
        }),
      );
      expect(current.guesses[index]?.cells.map((cell) => cell.field)).toEqual([
        "element",
        "path",
        "rarity",
        "faction",
        "region",
        "version",
      ]);
      expect(current.status).toBe(index === 5 ? "lost" : "active");
    }
    expect(current).toMatchObject({ difficulty: "standard", maxAttempts: 6 });
    expect(current.answer?.id).toBe(row.target_character_id);

    const replay = await dataOf<{ kind: "solo"; game: PublicGame }>(
      await SELF.fetch(`https://fireflydle.games/api/replays/${created.id}`, {
        headers: { cookie },
      }),
    );
    expect(replay.kind).toBe("solo");
    expect(replay.game.fieldDefinitions?.map((field) => field.id)).toEqual([
      "element",
      "path",
      "rarity",
      "faction",
      "region",
      "version",
    ]);
    expect(replay.game.guesses).toHaveLength(6);
    expect(replay.game.guesses.every((guess) => guess.cells.length === 6)).toBe(true);
  });
});
