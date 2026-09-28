import type { Element, Path } from "../packages/contracts/src/index.ts";

export const WIKI_CHARACTER_URL = `https://wiki.biligame.com/sr/api.php?${new URLSearchParams({
  action: "ask",
  query: "[[分类:角色]]|?元素属性|?命途|?稀有度|?实装版本|?阵营|limit=500",
  format: "json",
})}`;

interface WikiCharacter {
  fulltext: string;
  fullurl: string;
  printouts: Record<string, unknown[]>;
}
export interface WikiPayload {
  query: { results: Record<string, WikiCharacter> };
}

export function validateWikiPayload(value: unknown): WikiPayload {
  const payload = value as WikiPayload;
  const rows = payload?.query?.results;
  if (!rows || typeof rows !== "object" || Array.isArray(rows) || Object.keys(rows).length < 80)
    throw new Error("BWiki 角色列表异常或不完整，停止同步。");
  if ((value as Record<string, unknown>)["query-continue-offset"] !== undefined)
    throw new Error("BWiki 角色查询被截断，停止同步。");
  for (const row of Object.values(rows)) {
    if (typeof row.fulltext !== "string" || typeof row.fullurl !== "string" || !row.printouts)
      throw new Error("BWiki 角色字段结构异常。");
  }
  return payload;
}

const elements: Record<string, Element> = {
  物理: "physical",
  火: "fire",
  冰: "ice",
  雷: "lightning",
  风: "wind",
  量子: "quantum",
  虚数: "imaginary",
};
const paths: Record<string, Path> = {
  毁灭: "destruction",
  巡猎: "hunt",
  智识: "erudition",
  同谐: "harmony",
  虚无: "nihility",
  存护: "preservation",
  丰饶: "abundance",
  记忆: "remembrance",
  欢愉: "elation",
};

export function wikiCharacterFacts(payload: WikiPayload, name: string, version: string) {
  const rows = Object.values(payload.query.results).filter((row) => row.fulltext === name);
  if (rows.length !== 1) throw new Error(`BWiki 无唯一精确匹配：${name}`);
  const row = rows[0]!;
  const single = (key: string): string => {
    const values = row.printouts[key];
    if (!Array.isArray(values) || values.length !== 1 || typeof values[0] !== "string")
      throw new Error(`BWiki ${name} 的 ${key} 缺失或不唯一。`);
    return values[0];
  };
  if (single("实装版本") !== version) throw new Error(`BWiki ${name} 与官方实装版本不一致。`);
  const element = elements[single("元素属性")];
  const path = paths[single("命途")];
  const rarityText = single("稀有度");
  if (!element || !path || !["4星", "5星"].includes(rarityText))
    throw new Error(`BWiki ${name} 存在未知属性，需人工审核。`);
  return { element, path, rarity: (rarityText === "5星" ? 5 : 4) as 4 | 5, sourceUrl: row.fullurl };
}
