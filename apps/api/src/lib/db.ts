import { CharacterSchema, type Character } from "@fireflydle/contracts";

export interface CharacterRow {
  id: string;
  payload_json: string;
}

export async function getCharacter(db: D1Database, id: string): Promise<Character | null> {
  const row = await db
    .prepare("SELECT id, payload_json FROM characters WHERE id = ? AND enabled = 1")
    .bind(id)
    .first<CharacterRow>();
  if (!row) return null;
  return CharacterSchema.parse(JSON.parse(row.payload_json));
}

/** 进行中的对局使用创建时题池快照，实体即使后来停用也必须能够回放判定。 */
export async function getCharacterSnapshot(db: D1Database, id: string): Promise<Character | null> {
  const row = await db
    .prepare("SELECT id, payload_json FROM characters WHERE id = ?")
    .bind(id)
    .first<CharacterRow>();
  if (!row) return null;
  return CharacterSchema.parse(JSON.parse(row.payload_json));
}

export async function getTargetPool(db: D1Database): Promise<Character[]> {
  const result = await db
    .prepare(
      "SELECT id, payload_json FROM characters WHERE enabled = 1 AND target_eligible = 1 ORDER BY release_order, id",
    )
    .all<CharacterRow>();
  return result.results.map((row) => CharacterSchema.parse(JSON.parse(row.payload_json)));
}

export async function getEnabledCharacters(db: D1Database): Promise<Character[]> {
  const result = await db
    .prepare("SELECT id, payload_json FROM characters WHERE enabled = 1 ORDER BY release_order, id")
    .all<CharacterRow>();
  return result.results.map((row) => CharacterSchema.parse(JSON.parse(row.payload_json)));
}

export function sqlBoolean(value: boolean): number {
  return value ? 1 : 0;
}
