import { ContentManifestSchema, type ContentEntity, type NpcSummary } from "@fireflydle/contracts";
import npcManifestData from "./data/npc-manifest.json";
import { factions, getEntitySearchText, versions } from "./playable";

export const npcManifest = Object.freeze(ContentManifestSchema.parse(npcManifestData));
export type NpcEntity = Extract<ContentEntity, { kind: "npc" }>;
export const npcEntities = Object.freeze(
  npcManifest.entities.filter((entity): entity is NpcEntity => entity.kind === "npc"),
);

export function getNpcSearchText(entity: NpcEntity): string {
  return getEntitySearchText(entity);
}

function canonicalFactionId(factionId: string): string {
  return factionId === "interastral-peace-corporation" ? "ipc" : factionId;
}

export function npcSummary(entity: NpcEntity): NpcSummary {
  const faction = factions.find(
    (entry) => entry.id === canonicalFactionId(entity.payload.factionId),
  );
  const version = versions.find((entry) => entry.id === entity.payload.debutVersionId);
  if (!faction) throw new Error(`NPC ${entity.id} 引用了未知派系 ${entity.payload.factionId}`);
  if (!version) throw new Error(`NPC ${entity.id} 引用了未知版本 ${entity.payload.debutVersionId}`);
  return {
    id: entity.id,
    names: entity.names,
    aliases: entity.aliases,
    regionId: entity.payload.regionId,
    factionId: entity.payload.factionId,
    factionGroupId: faction.groupId,
    debutVersionId: entity.payload.debutVersionId,
    debutVersionOrder: version.order,
    assets: entity.payload.assets,
  };
}
