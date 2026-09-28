import { expect, test } from "bun:test";
import { CharacterSchema } from "../packages/contracts/src/index.ts";
import characters from "../packages/game-data/src/generated/characters.json";
import { prepareDataAnnouncement } from "./prepare-data-announcement.ts";

const roster = CharacterSchema.array().parse(characters);
test("相同角色池和来源时间变化不会重复部署", () => {
  const refreshed = structuredClone(roster);
  refreshed.reverse();
  for (const character of refreshed) {
    character.sourceRevision = "new-source";
    character.assets.sourceUpdatedAt = "2026-09-29T00:00:00.000Z";
    delete character.assets.responsive;
  }
  expect(prepareDataAnnouncement(roster, refreshed).changed).toBe(false);
});
test("新增角色生成面向玩家的幂等公告", () => {
  const previous = roster.filter((character) => character.id !== "pearl");
  const result = prepareDataAnnouncement(previous, roster);
  expect(result.changed).toBe(true);
  expect(result.announcement.body).toContain("真珠");
  expect(result.announcement.tagName).toBe(
    prepareDataAnnouncement(previous, [...roster].reverse()).announcement.tagName,
  );
});
test("属性修正触发更新，角色移除阻止自动发布", () => {
  const changed = structuredClone(roster);
  changed[0]!.element = changed[0]!.element === "ice" ? "fire" : "ice";
  expect(prepareDataAnnouncement(roster, changed).changed).toBe(true);
  expect(() => prepareDataAnnouncement(roster, roster.slice(1))).toThrow("移除线上角色");
});
