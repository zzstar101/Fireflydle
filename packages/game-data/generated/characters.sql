-- 由 scripts/sync-characters.ts 确定性生成；不要手工修改。
-- Cloudflare D1 的 --file import 不允许显式 BEGIN/COMMIT；每个 UPSERT 保持为独立小语句。
-- 先发布版本与阵营，再发布引用它们的角色；各表清单外历史行只软禁用、不删除。

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('1.0', 0, '2023-04-26T10:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('1.1', 1, '2023-06-07T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('1.2', 2, '2023-07-19T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('1.3', 3, '2023-08-30T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('1.4', 4, '2023-10-11T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('1.5', 5, '2023-11-15T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('1.6', 6, '2023-12-27T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('2.0', 7, '2024-02-06T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('2.1', 8, '2024-03-27T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('2.2', 9, '2024-05-08T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('2.3', 10, '2024-06-19T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('2.4', 11, '2024-07-31T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('2.5', 12, '2024-09-10T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('2.6', 13, '2024-10-23T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('2.7', 14, '2024-12-04T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.0', 15, '2025-01-15T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.1', 16, '2025-02-26T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.2', 17, '2025-04-09T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.3', 18, '2025-05-21T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.4', 19, '2025-07-02T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.5', 20, '2025-08-13T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.6', 21, '2025-09-24T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.7', 22, '2025-11-05T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.8', 23, '2025-12-17T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('4.0', 24, '2026-02-13T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('4.1', 25, '2026-03-25T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('4.2', 26, '2026-04-22T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('4.3', 27, '2026-06-01T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('4.4', 28, '2026-07-15T07:00:00.000Z', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

UPDATE versions
SET enabled = 0, updated_at = 1784394524
WHERE id NOT IN ('1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '2.0', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '3.0', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '4.0', '4.1', '4.2', '4.3', '4.4')
  AND enabled <> 0;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('amphoreus', 'amphoreus', '{"zh-CN":"翁法罗斯","en":"Amphoreus","ja":"オンパロス"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('another-world', 'another-world', '{"zh-CN":"异界","en":"Another World","ja":"別の世界"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('astral-express', 'astral-express', '{"zh-CN":"星穹列车","en":"The Astral Express","ja":"星穹列車"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('belobog', 'belobog', '{"zh-CN":"贝洛伯格","en":"Belobog","ja":"ベロブルグ"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('cosmic', 'cosmic', '{"zh-CN":"银河","en":"Cosmic","ja":"銀河"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('fate-stay-night', 'another-world', '{"zh-CN":"异界(Fate系列)","en":"Another World (Fate Series)","ja":"異界（Fateシリーズ）"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('galaxy-rangers', 'cosmic', '{"zh-CN":"巡海游侠","en":"Galaxy Rangers","ja":"巡海レンジャー"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('garden-of-recollection', 'cosmic', '{"zh-CN":"流光忆庭","en":"Garden of Recollection","ja":"流光の庭"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('herta-space-station', 'herta-space-station', '{"zh-CN":"空间站「黑塔」","en":"Herta Space Station","ja":"宇宙ステーション「ヘルタ」"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('intelligentsia-guild', 'cosmic', '{"zh-CN":"博识学会","en":"Intelligentsia Guild","ja":"博識学会"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('ipc', 'ipc', '{"zh-CN":"星际和平公司","en":"Interastral Peace Corporation","ja":"スターピースカンパニー"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('knights-of-beauty', 'cosmic', '{"zh-CN":"纯美骑士团","en":"Knights of Beauty","ja":"純美の騎士団"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('masked-fools', 'cosmic', '{"zh-CN":"假面愚者","en":"Masked Fools","ja":"仮面の愚者"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('penacony', 'penacony', '{"zh-CN":"匹诺康尼","en":"Penacony","ja":"ピノコニー"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('planarcadia', 'planarcadia', '{"zh-CN":"二相乐园","en":"Planarcadia","ja":"二相楽園"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('self-annihilators', 'cosmic', '{"zh-CN":"自灭者","en":"Self-Annihilators","ja":"自滅者"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('stellaron-hunters', 'stellaron-hunters', '{"zh-CN":"星核猎手","en":"Stellaron Hunters","ja":"星核ハンター"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('the-cremators', 'cosmic', '{"zh-CN":"焚化工","en":"The Cremators","ja":"焼却人"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('xianzhou-alliance', 'xianzhou-alliance', '{"zh-CN":"仙舟联盟","en":"Xianzhou Alliance","ja":"仙舟同盟"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('xianzhou-luofu', 'xianzhou-alliance', '{"zh-CN":"仙舟「罗浮」","en":"Xianzhou Luofu","ja":"仙舟「羅浮」"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('xianzhou-yaoqing', 'xianzhou-alliance', '{"zh-CN":"仙舟「曜青」","en":"Xianzhou Yaoqing","ja":"仙舟「曜青」"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('xianzhou-yuque', 'xianzhou-alliance', '{"zh-CN":"仙舟「玉阙」","en":"Xianzhou Yuque","ja":"仙舟「玉殿」"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('xianzhou-zhuming', 'xianzhou-alliance', '{"zh-CN":"仙舟「朱明」","en":"Xianzhou Zhuming","ja":"仙舟「朱明」"}', 1, 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

UPDATE factions
SET enabled = 0, updated_at = 1784394524
WHERE id NOT IN ('amphoreus', 'another-world', 'astral-express', 'belobog', 'cosmic', 'fate-stay-night', 'galaxy-rangers', 'garden-of-recollection', 'herta-space-station', 'intelligentsia-guild', 'ipc', 'knights-of-beauty', 'masked-fools', 'penacony', 'planarcadia', 'self-annihilators', 'stellaron-hunters', 'the-cremators', 'xianzhou-alliance', 'xianzhou-luofu', 'xianzhou-yaoqing', 'xianzhou-yuque', 'xianzhou-zhuming')
  AND enabled <> 0;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('arlan', '1008', 'arlan', 'lightning', 'destruction', 4, 'herta-space-station', 'herta-space-station', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"arlan","officialId":"1008","baseCharacterId":"arlan","names":{"zh-CN":"阿兰","en":"Arlan","ja":"アーラン"},"aliases":{"zh-CN":["a lan","alan"],"en":["arlan"],"ja":["aaran","aran"]},"element":"lightning","path":"destruction","rarity":4,"factionId":"herta-space-station","factionGroupId":"herta-space-station","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/arlan-avatar-e6a98c2dc505.png","portraitPath":"/assets/characters/arlan-avatar-e6a98c2dc505.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/7213a47385a0b5c05e68b564733f2b19_6873881480647261389.png","sourceUpdatedAt":"2022-04-11T18:47:49.000Z","sha256":"e6a98c2dc505ee051f130a3e6f74bf58dffa9245b06d6d037dc74ac6a60e5d09","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('asta', '1009', 'asta', 'fire', 'harmony', 4, 'herta-space-station', 'herta-space-station', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"asta","officialId":"1009","baseCharacterId":"asta","names":{"zh-CN":"艾丝妲","en":"Asta","ja":"アスター"},"aliases":{"zh-CN":["ai si da","aisida"],"en":["asta"],"ja":["asutaa","asuta"]},"element":"fire","path":"harmony","rarity":4,"factionId":"herta-space-station","factionGroupId":"herta-space-station","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/asta-avatar-1f9e66fd19bc.png","portraitPath":"/assets/characters/asta-avatar-1f9e66fd19bc.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/99bb21e5ceb72b3f76c0a3b5148dfe08_8925972045760071235.png","sourceUpdatedAt":"2022-04-11T18:48:17.000Z","sha256":"1f9e66fd19bc20189006cb76bb53b8101bef93ba8ba1ddb0511dbdd141437dc5","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('bailu', '1211', 'bailu', 'lightning', 'abundance', 5, 'xianzhou-luofu', 'xianzhou-alliance', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"bailu","officialId":"1211","baseCharacterId":"bailu","names":{"zh-CN":"白露","en":"Bailu","ja":"白露"},"aliases":{"zh-CN":["bai lu","bailu"],"en":["bailu"],"ja":["byakuro"]},"element":"lightning","path":"abundance","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/bailu-avatar-4f8e23f000e1.png","portraitPath":"/assets/characters/bailu-avatar-4f8e23f000e1.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/09/21/1ce1708b783a06ad419257b4be29ea99_202970771385396270.png","sourceUpdatedAt":"2022-09-21T18:29:14.000Z","sha256":"4f8e23f000e131d91b7873261505795c881a9f0ee57f30d2c7d57a6c534f4c99","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('bronya', '1101', 'bronya', 'wind', 'harmony', 5, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"bronya","officialId":"1101","baseCharacterId":"bronya","names":{"zh-CN":"布洛妮娅","en":"Bronya","ja":"ブローニャ"},"aliases":{"zh-CN":["bu luo ni ya","buluoniya"],"en":["bronya"],"ja":["buroonya","buronya"]},"element":"wind","path":"harmony","rarity":5,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/bronya-avatar-849f365d21d2.png","portraitPath":"/assets/characters/bronya-avatar-849f365d21d2.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/c6ab1f4cd2ece504b02e16d5f7a5af44_8279603082960819796.png","sourceUpdatedAt":"2022-04-11T18:22:41.000Z","sha256":"849f365d21d22b14dbc7184f61846c1cdb6539f6ee5ab37a5b3e4f5d07d80024","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('clara', '1107', 'clara', 'physical', 'destruction', 5, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"clara","officialId":"1107","baseCharacterId":"clara","names":{"zh-CN":"克拉拉","en":"Clara","ja":"クラーラ"},"aliases":{"zh-CN":["ke la la","kelala"],"en":["clara"],"ja":["kuraara","kurara"]},"element":"physical","path":"destruction","rarity":5,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/clara-avatar-c6dcdc1da181.png","portraitPath":"/assets/characters/clara-avatar-c6dcdc1da181.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/e4a5b2e737c5c59f7f0ddde372fa8ea2_146075503384718263.png","sourceUpdatedAt":"2022-04-11T18:47:22.000Z","sha256":"c6dcdc1da181c8508fa06460c282bffbd9962ba68535ac6b1cc6b7426b775541","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('dan-heng', '1002', 'dan-heng', 'wind', 'hunt', 4, 'astral-express', 'astral-express', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"dan-heng","officialId":"1002","baseCharacterId":"dan-heng","names":{"zh-CN":"丹恒","en":"Dan Heng","ja":"丹恒"},"aliases":{"zh-CN":["dan heng","danheng"],"en":["dan heng","danheng"],"ja":["tankou"]},"element":"wind","path":"hunt","rarity":4,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/dan-heng-avatar-d99bc0050c2c.png","portraitPath":"/assets/characters/dan-heng-avatar-d99bc0050c2c.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/10/0ee824040a139252d0e2037e52ab7755_7639207854703609873.png","sourceUpdatedAt":"2022-04-10T16:57:47.000Z","sha256":"d99bc0050c2c9edb6c45bcef7ff94e807c9f93ab191a86785bb18e4a368a9739","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('gepard', '1104', 'gepard', 'ice', 'preservation', 5, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"gepard","officialId":"1104","baseCharacterId":"gepard","names":{"zh-CN":"杰帕德","en":"Gepard","ja":"ジェパード"},"aliases":{"zh-CN":["jie pa de","jiepade"],"en":["gepard"],"ja":["jepaado","jepado"]},"element":"ice","path":"preservation","rarity":5,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/gepard-avatar-0d99b1ad9c7d.png","portraitPath":"/assets/characters/gepard-avatar-0d99b1ad9c7d.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/a511485984be482bea05136de81b3b7b_8774670648688901664.png","sourceUpdatedAt":"2022-04-11T18:12:27.000Z","sha256":"0d99b1ad9c7d5c5386778fde68a4eb627852999c773e5169add647588de10c62","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('herta', '1013', 'herta', 'ice', 'erudition', 4, 'herta-space-station', 'herta-space-station', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"herta","officialId":"1013","baseCharacterId":"herta","names":{"zh-CN":"黑塔","en":"Herta","ja":"ヘルタ"},"aliases":{"zh-CN":["hei ta","heita"],"en":["herta"],"ja":["heruta"]},"element":"ice","path":"erudition","rarity":4,"factionId":"herta-space-station","factionGroupId":"herta-space-station","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/herta-avatar-fe1944cd8443.png","portraitPath":"/assets/characters/herta-avatar-fe1944cd8443.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/8f38072eccd10ce1b4df485c9d9f34d3_7138207484725960049.png","sourceUpdatedAt":"2022-04-11T18:48:48.000Z","sha256":"fe1944cd844368d7899b753d4fb1c0b777b1aa76eb7fa00fb92af3a9b3c5ce55","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('himeko', '1003', 'himeko', 'fire', 'erudition', 5, 'astral-express', 'astral-express', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"himeko","officialId":"1003","baseCharacterId":"himeko","names":{"zh-CN":"姬子","en":"Himeko","ja":"姫子"},"aliases":{"zh-CN":["ji zi","jizi"],"en":["himeko"],"ja":["himeko"]},"element":"fire","path":"erudition","rarity":5,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/himeko-avatar-e301ca0969fd.png","portraitPath":"/assets/characters/himeko-avatar-e301ca0969fd.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/906705d02e536b45b29285f6d80c6f34_6762729813999787667.png","sourceUpdatedAt":"2022-04-11T17:14:15.000Z","sha256":"e301ca0969fde976e1640abeaa4e95dd74017fbf3957ecb74610c98fd9860cbe","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('hook', '1109', 'hook', 'fire', 'destruction', 4, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"hook","officialId":"1109","baseCharacterId":"hook","names":{"zh-CN":"虎克","en":"Hook","ja":"フック"},"aliases":{"zh-CN":["hu ke","huke"],"en":["hook"],"ja":["fukku"]},"element":"fire","path":"destruction","rarity":4,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/hook-avatar-62ceae5b0d48.png","portraitPath":"/assets/characters/hook-avatar-62ceae5b0d48.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/09/15/b6aeab86bea6ec7770817da70da341bc_7127072739336792149.png","sourceUpdatedAt":"2022-09-15T11:11:05.000Z","sha256":"62ceae5b0d486c291bbbe9c34c3c6adf0214504727b2ca8ca8c5e2bfb0bd0157","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('jing-yuan', '1204', 'jing-yuan', 'lightning', 'erudition', 5, 'xianzhou-luofu', 'xianzhou-alliance', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"jing-yuan","officialId":"1204","baseCharacterId":"jing-yuan","names":{"zh-CN":"景元","en":"Jing Yuan","ja":"景元"},"aliases":{"zh-CN":["jing yuan","jingyuan"],"en":["jing yuan","jingyuan"],"ja":["keigen"]},"element":"lightning","path":"erudition","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/jing-yuan-avatar-c32a3e9ca445.png","portraitPath":"/assets/characters/jing-yuan-avatar-c32a3e9ca445.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/09/20/ccb4b3e5d44ab5c35510bd5fce11fbf2_8339230249921865099.png","sourceUpdatedAt":"2022-09-20T14:10:19.000Z","sha256":"c32a3e9ca445d33b15959b21521e8411528455bc80225f8c185234ae9e0045e4","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('march-7th', '1001', 'march-7th', 'ice', 'preservation', 4, 'astral-express', 'astral-express', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"march-7th","officialId":"1001","baseCharacterId":"march-7th","names":{"zh-CN":"三月七","en":"March 7th","ja":"三月なのか"},"aliases":{"zh-CN":["三月","san yue qi","sanyueqi","san yue","sanyue"],"en":["March","M7","march 7th","march7th"],"ja":["なのか","mitsukinanoka","nanoka","mitsuki nanoka"]},"element":"ice","path":"preservation","rarity":4,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/march-7th-avatar-9d4e246bc19e.png","portraitPath":"/assets/characters/march-7th-avatar-9d4e246bc19e.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/01/20/ebf0f79b50bb0b1668fe9f801fcde898_6619280582358456926.png","sourceUpdatedAt":"2022-04-11T14:34:48.000Z","sha256":"9d4e246bc19e99dd5eb0dd534562c1f26e6588b97740db25a42280140e071e95","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('natasha', '1105', 'natasha', 'physical', 'abundance', 4, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"natasha","officialId":"1105","baseCharacterId":"natasha","names":{"zh-CN":"娜塔莎","en":"Natasha","ja":"ナターシャ"},"aliases":{"zh-CN":["na ta sha","natasha"],"en":["natasha"],"ja":["nataasha","natasha"]},"element":"physical","path":"abundance","rarity":4,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/natasha-avatar-332835502261.png","portraitPath":"/assets/characters/natasha-avatar-332835502261.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/e9691b64bd3a0449d12265a659d5b301_2800750704985905201.png","sourceUpdatedAt":"2022-04-11T18:37:16.000Z","sha256":"332835502261c8218fc199b4520dc6079afde32fedf7ec81086ebd783f46d9b7","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('pela', '1106', 'pela', 'ice', 'nihility', 4, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"pela","officialId":"1106","baseCharacterId":"pela","names":{"zh-CN":"佩拉","en":"Pela","ja":"ペラ"},"aliases":{"zh-CN":["pei la","peila"],"en":["pela"],"ja":["pera"]},"element":"ice","path":"nihility","rarity":4,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/pela-avatar-4edf90ea2af8.png","portraitPath":"/assets/characters/pela-avatar-4edf90ea2af8.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/01/20/8eb8fe9b661c44c15018e750e94678ba_7455952861324727421.png","sourceUpdatedAt":"2022-04-11T18:35:44.000Z","sha256":"4edf90ea2af8ad26e56c4d0287a8b8a40f781a2b508ca9e86adec52ec4a6a12b","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('qingque', '1201', 'qingque', 'quantum', 'erudition', 4, 'xianzhou-luofu', 'xianzhou-alliance', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"qingque","officialId":"1201","baseCharacterId":"qingque","names":{"zh-CN":"青雀","en":"Qingque","ja":"青雀"},"aliases":{"zh-CN":["qing que","qingque"],"en":["qingque"],"ja":["seijaku"]},"element":"quantum","path":"erudition","rarity":4,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/qingque-avatar-fe0137247376.png","portraitPath":"/assets/characters/qingque-avatar-fe0137247376.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/09/22/2ce85064a040397a94b9633ba9ffc08b_4345980989372534083.png","sourceUpdatedAt":"2022-09-22T16:36:48.000Z","sha256":"fe013724737673f32f89e552345841b9a9bdf0828a2ebdbd65b0fc52390e518b","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('sampo', '1108', 'sampo', 'wind', 'nihility', 4, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"sampo","officialId":"1108","baseCharacterId":"sampo","names":{"zh-CN":"桑博","en":"Sampo","ja":"サンポ"},"aliases":{"zh-CN":["sang bo","sangbo"],"en":["sampo"],"ja":["sanpo"]},"element":"wind","path":"nihility","rarity":4,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/sampo-avatar-c86d956e648f.png","portraitPath":"/assets/characters/sampo-avatar-c86d956e648f.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/8bec1b8404758c78c799ae109e97ba68_9077892686689126095.png","sourceUpdatedAt":"2022-04-11T17:45:30.000Z","sha256":"c86d956e648f2f65c837cb21474f2e5514c2d9434ec88aaf22d38a7bca837564","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('seele', '1102', 'seele', 'quantum', 'hunt', 5, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"seele","officialId":"1102","baseCharacterId":"seele","names":{"zh-CN":"希儿","en":"Seele","ja":"ゼーレ"},"aliases":{"zh-CN":["xi er","xier"],"en":["seele"],"ja":["zeere","zere"]},"element":"quantum","path":"hunt","rarity":5,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/seele-avatar-878809ffa01c.png","portraitPath":"/assets/characters/seele-avatar-878809ffa01c.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/41b2379465748b66c324949833871a37_3791760123368611675.png","sourceUpdatedAt":"2022-04-11T18:46:21.000Z","sha256":"878809ffa01c1b77b2796fd03e7083694a645d993dca1ce48464cddfae098e3b","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('serval', '1103', 'serval', 'lightning', 'erudition', 4, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"serval","officialId":"1103","baseCharacterId":"serval","names":{"zh-CN":"希露瓦","en":"Serval","ja":"セーバル"},"aliases":{"zh-CN":["xi lu wa","xiluwa"],"en":["serval"],"ja":["seebaru","sebaru"]},"element":"lightning","path":"erudition","rarity":4,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/serval-avatar-d6a71fcbf9ed.png","portraitPath":"/assets/characters/serval-avatar-d6a71fcbf9ed.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/2c3c7f171f5ef5d8d210286b317baffc_6729124396776018550.png","sourceUpdatedAt":"2022-04-11T18:36:10.000Z","sha256":"d6a71fcbf9ed05df94f4a3b6fa373d31d097bc26102ac262b05c4b980837324e","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('sushang', '1206', 'sushang', 'physical', 'hunt', 4, 'xianzhou-luofu', 'xianzhou-alliance', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"sushang","officialId":"1206","baseCharacterId":"sushang","names":{"zh-CN":"素裳","en":"Sushang","ja":"素裳"},"aliases":{"zh-CN":["su shang","sushang"],"en":["sushang"],"ja":["sushou"]},"element":"physical","path":"hunt","rarity":4,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/sushang-avatar-171bf00dcaef.png","portraitPath":"/assets/characters/sushang-avatar-171bf00dcaef.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/09/21/56757405fd0bb121c4aa4dddb000d9c0_2139642753198143676.png","sourceUpdatedAt":"2022-09-22T16:35:54.000Z","sha256":"171bf00dcaefbd280e957a5e2d8d4920721ef63a21a024b4d30652baf8bc7eb1","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('tingyun', '1202', 'tingyun', 'lightning', 'harmony', 4, 'xianzhou-luofu', 'xianzhou-alliance', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"tingyun","officialId":"1202","baseCharacterId":"tingyun","names":{"zh-CN":"停云","en":"Tingyun","ja":"停雲"},"aliases":{"zh-CN":["ting yun","tingyun"],"en":["tingyun"],"ja":["teiun"]},"element":"lightning","path":"harmony","rarity":4,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/tingyun-avatar-11cf39c039a2.png","portraitPath":"/assets/characters/tingyun-avatar-11cf39c039a2.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/09/21/5a5179d65cfb06d1d015c87799e2e740_8514351923560523609.png","sourceUpdatedAt":"2022-09-21T18:31:41.000Z","sha256":"11cf39c039a21250c4d009f0d8adb1e7674cd2dc3acb466a462a0b0570b4bbe2","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('trailblazer-destruction', '8001', 'trailblazer', 'physical', 'destruction', 5, 'astral-express', 'astral-express', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"trailblazer-destruction","officialId":"8001","baseCharacterId":"trailblazer","names":{"zh-CN":"开拓者·毁灭","en":"Trailblazer · Destruction","ja":"開拓者・壊滅"},"aliases":{"zh-CN":["开拓者","物理主角","kai tuo zhe hui mie","kaituozhehuimie","kai tuo zhe","kaituozhe","wu li zhu jue","wulizhujue"],"en":["Trailblazer","Physical Trailblazer","trailblazer destruction","trailblazerdestruction","physicaltrailblazer"],"ja":["開拓者","物理開拓者","trailblazer destruction","trailblazerdestruction","kaitakusha kaimetsu","kaitakushakaimetsu"]},"element":"physical","path":"destruction","rarity":5,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/trailblazer-destruction-avatar-e8ee5e05c9c1.png","portraitPath":"/assets/characters/trailblazer-destruction-avatar-e8ee5e05c9c1.png","sourceUrl":"https://raw.githubusercontent.com/Mar-7th/StarRailRes/b95e75c7e1273d819d20c530c0b7e13a3ef19fb4/icon/character/8001.png","sourceUpdatedAt":"2026-07-18T17:08:44.000Z","sha256":"e8ee5e05c9c12239e7260f3b2949c2d1e76d1985c1515bf16b889fc550d5f0de","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('trailblazer-preservation', '8003', 'trailblazer', 'fire', 'preservation', 5, 'astral-express', 'astral-express', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"trailblazer-preservation","officialId":"8003","baseCharacterId":"trailblazer","names":{"zh-CN":"开拓者·存护","en":"Trailblazer · Preservation","ja":"開拓者・存護"},"aliases":{"zh-CN":["开拓者","火主","存护主角","kai tuo zhe cun hu","kaituozhecunhu","kai tuo zhe","kaituozhe","huo zhu","huozhu","cun hu zhu jue","cunhuzhujue"],"en":["Trailblazer","Fire Trailblazer","trailblazer preservation","trailblazerpreservation","firetrailblazer"],"ja":["開拓者","炎開拓者","trailblazer preservation","trailblazerpreservation","kaitakusha songo","kaitakushasongo"]},"element":"fire","path":"preservation","rarity":5,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/trailblazer-preservation-avatar-d52e840e15c3.png","portraitPath":"/assets/characters/trailblazer-preservation-avatar-d52e840e15c3.png","sourceUrl":"https://raw.githubusercontent.com/Mar-7th/StarRailRes/b95e75c7e1273d819d20c530c0b7e13a3ef19fb4/icon/character/8003.png","sourceUpdatedAt":"2026-07-18T17:08:44.000Z","sha256":"d52e840e15c3605f71c6c5acb22beace03edef00d1a3cf71229a0e23a4491422","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('welt', '1004', 'welt', 'imaginary', 'nihility', 5, 'astral-express', 'astral-express', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"welt","officialId":"1004","baseCharacterId":"welt","names":{"zh-CN":"瓦尔特","en":"Welt","ja":"ヴェルト"},"aliases":{"zh-CN":["wa er te","waerte"],"en":["welt"],"ja":["vyeruto"]},"element":"imaginary","path":"nihility","rarity":5,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/welt-avatar-b5fce1546a68.png","portraitPath":"/assets/characters/welt-avatar-b5fce1546a68.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/bd5a57d0d35792277c457a067fc72492_8449768500674894029.png","sourceUpdatedAt":"2022-04-11T17:32:39.000Z","sha256":"b5fce1546a68488f7d563594a6cc6f6edb8b4926eac38bc2d0afd1b868270a86","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('yanqing', '1209', 'yanqing', 'ice', 'hunt', 5, 'xianzhou-luofu', 'xianzhou-alliance', '1.0', 0, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"yanqing","officialId":"1209","baseCharacterId":"yanqing","names":{"zh-CN":"彦卿","en":"Yanqing","ja":"彦卿"},"aliases":{"zh-CN":["yan qing","yanqing"],"en":["yanqing"],"ja":["genkyou"]},"element":"ice","path":"hunt","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/yanqing-avatar-48a950b171f5.png","portraitPath":"/assets/characters/yanqing-avatar-48a950b171f5.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/09/21/34a4acaaf047598b582f86cfcf0a6893_8415297720164363304.png","sourceUpdatedAt":"2022-09-21T17:37:47.000Z","sha256":"48a950b171f54a9bd5917dfe6b377d4dfa9e065d7966dc9af6dbaa48cc970be3","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('luocha', '1203', 'luocha', 'imaginary', 'abundance', 5, 'xianzhou-luofu', 'xianzhou-alliance', '1.1', 1, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"luocha","officialId":"1203","baseCharacterId":"luocha","names":{"zh-CN":"罗刹","en":"Luocha","ja":"羅刹"},"aliases":{"zh-CN":["luo cha","luocha"],"en":["luocha"],"ja":["rasetsu"]},"element":"imaginary","path":"abundance","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.1","releaseOrder":1,"assets":{"avatarPath":"/assets/characters/luocha-avatar-30c268081c6e.png","portraitPath":"/assets/characters/luocha-avatar-30c268081c6e.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/07/18/0df33e59f26280cb1f79227f9660a174_249196615581888334.png","sourceUpdatedAt":"2023-06-07T16:29:17.000Z","sha256":"30c268081c6e22e8781c630019051433b29cfc041f2a068f55e2bc242ef7ae33","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('silver-wolf', '1006', 'silver-wolf', 'quantum', 'nihility', 5, 'stellaron-hunters', 'stellaron-hunters', '1.1', 1, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"silver-wolf","officialId":"1006","baseCharacterId":"silver-wolf","names":{"zh-CN":"银狼","en":"Silver Wolf","ja":"銀狼"},"aliases":{"zh-CN":["yin lang","yinlang"],"en":["SW","silver wolf","silverwolf"],"ja":["ginrou"]},"element":"quantum","path":"nihility","rarity":5,"factionId":"stellaron-hunters","factionGroupId":"stellaron-hunters","releaseVersionId":"1.1","releaseOrder":1,"assets":{"avatarPath":"/assets/characters/silver-wolf-avatar-a0f6dba430cf.png","portraitPath":"/assets/characters/silver-wolf-avatar-a0f6dba430cf.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/cf17c2dad074b88a6dbfa33446138c73_2646503772588786193.png","sourceUpdatedAt":"2022-04-11T18:52:39.000Z","sha256":"a0f6dba430cf3ad238ded70ca661f91fda77fdfd1d9ea97563bf79ab24522283","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('yukong', '1207', 'yukong', 'imaginary', 'harmony', 4, 'xianzhou-luofu', 'xianzhou-alliance', '1.1', 1, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"yukong","officialId":"1207","baseCharacterId":"yukong","names":{"zh-CN":"驭空","en":"Yukong","ja":"御空"},"aliases":{"zh-CN":["yu kong","yukong"],"en":["yukong"],"ja":["gyokuu","gyoku"]},"element":"imaginary","path":"harmony","rarity":4,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.1","releaseOrder":1,"assets":{"avatarPath":"/assets/characters/yukong-avatar-777d4b9d9679.png","portraitPath":"/assets/characters/yukong-avatar-777d4b9d9679.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/07/18/1108fb690e4e3f3739f126aa511c0c0c_6949917502973102490.png","sourceUpdatedAt":"2023-06-07T16:29:57.000Z","sha256":"777d4b9d9679dd72fdfc43a7fef25c2d7fcda311739a6e6e5c96c00ebeeefd79","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('blade', '1205', 'blade', 'wind', 'destruction', 5, 'stellaron-hunters', 'stellaron-hunters', '1.2', 2, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"blade","officialId":"1205","baseCharacterId":"blade","names":{"zh-CN":"刃","en":"Blade","ja":"刃"},"aliases":{"zh-CN":["ren"],"en":["blade"],"ja":["jin"]},"element":"wind","path":"destruction","rarity":5,"factionId":"stellaron-hunters","factionGroupId":"stellaron-hunters","releaseVersionId":"1.2","releaseOrder":2,"assets":{"avatarPath":"/assets/characters/blade-avatar-2e40055896d6.png","portraitPath":"/assets/characters/blade-avatar-2e40055896d6.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/07/18/03683ce37738b0d682a557671e301eae_6658615399410788925.png","sourceUpdatedAt":"2023-07-12T16:53:42.000Z","sha256":"2e40055896d6e6d9738808077d18dbfee57782890306d76b774e46b4c336a2bc","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('kafka', '1005', 'kafka', 'lightning', 'nihility', 5, 'stellaron-hunters', 'stellaron-hunters', '1.2', 2, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"kafka","officialId":"1005","baseCharacterId":"kafka","names":{"zh-CN":"卡芙卡","en":"Kafka","ja":"カフカ"},"aliases":{"zh-CN":["ka fu ka","kafuka"],"en":["kafka"],"ja":["kafuka"]},"element":"lightning","path":"nihility","rarity":5,"factionId":"stellaron-hunters","factionGroupId":"stellaron-hunters","releaseVersionId":"1.2","releaseOrder":2,"assets":{"avatarPath":"/assets/characters/kafka-avatar-0d83f3fa9f98.png","portraitPath":"/assets/characters/kafka-avatar-0d83f3fa9f98.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/a27a7f23e023aeea841d151ca864f6d7_8275876235530321253.png","sourceUpdatedAt":"2022-04-11T18:52:19.000Z","sha256":"0d83f3fa9f98fecd8604eaf70d5dedcad85ee09e45f5e300c75f94b3bf3ffe44","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('luka', '1111', 'luka', 'physical', 'nihility', 4, 'belobog', 'belobog', '1.2', 2, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"luka","officialId":"1111","baseCharacterId":"luka","names":{"zh-CN":"卢卡","en":"Luka","ja":"ルカ"},"aliases":{"zh-CN":["lu ka","luka"],"en":["luka"],"ja":["ruka"]},"element":"physical","path":"nihility","rarity":4,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.2","releaseOrder":2,"assets":{"avatarPath":"/assets/characters/luka-avatar-386a0a2094bd.png","portraitPath":"/assets/characters/luka-avatar-386a0a2094bd.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/07/18/b14015c52224fdb12e9479c15415df45_9163441622556196278.png","sourceUpdatedAt":"2023-07-12T19:12:59.000Z","sha256":"386a0a2094bd62a7f77f8a2e98abfde22d10b861080883e5ed20d8cd2f1d6df6","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('dan-heng-il', '1213', 'dan-heng', 'imaginary', 'destruction', 5, 'xianzhou-luofu', 'xianzhou-alliance', '1.3', 3, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"dan-heng-il","officialId":"1213","baseCharacterId":"dan-heng","names":{"zh-CN":"丹恒•饮月","en":"Dan Heng • Imbibitor Lunae","ja":"丹恒・飲月"},"aliases":{"zh-CN":["饮月","龙丹","dan heng yin yue","danhengyinyue","yin yue","yinyue","long dan","longdan"],"en":["DHIL","Imbibitor Lunae","dan heng imbibitor lunae","danhengimbibitorlunae","imbibitorlunae"],"ja":["飲月","tankou ingetsu","tankouingetsu"]},"element":"imaginary","path":"destruction","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.3","releaseOrder":3,"assets":{"avatarPath":"/assets/characters/dan-heng-il-avatar-2cf07d2fcb26.png","portraitPath":"/assets/characters/dan-heng-il-avatar-2cf07d2fcb26.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/08/28/0ca26d025d72bd31944a00600f700a99_5701144537156840973.png","sourceUpdatedAt":"2023-08-17T16:36:41.000Z","sha256":"2cf07d2fcb264b0265a407846d2472b50f1d8bee9b0f314a3f2bf74573f3e92f","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('fu-xuan', '1208', 'fu-xuan', 'quantum', 'preservation', 5, 'xianzhou-luofu', 'xianzhou-alliance', '1.3', 3, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"fu-xuan","officialId":"1208","baseCharacterId":"fu-xuan","names":{"zh-CN":"符玄","en":"Fu Xuan","ja":"符玄"},"aliases":{"zh-CN":["fu xuan","fuxuan"],"en":["fu xuan","fuxuan"],"ja":["fugen"]},"element":"quantum","path":"preservation","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.3","releaseOrder":3,"assets":{"avatarPath":"/assets/characters/fu-xuan-avatar-0eaf018b940e.png","portraitPath":"/assets/characters/fu-xuan-avatar-0eaf018b940e.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/08/28/bc0e8b39012e1e51b7f1e1bd2c78ddde_7333911698729337874.png","sourceUpdatedAt":"2023-08-17T16:32:34.000Z","sha256":"0eaf018b940e079cbe8377e6e3b384ab9e44b5b26a54c0acb49bd42f9fb4c288","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('lynx', '1110', 'lynx', 'quantum', 'abundance', 4, 'belobog', 'belobog', '1.3', 3, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"lynx","officialId":"1110","baseCharacterId":"lynx","names":{"zh-CN":"玲可","en":"Lynx","ja":"リンクス"},"aliases":{"zh-CN":["ling ke","lingke"],"en":["lynx"],"ja":["rinkusu"]},"element":"quantum","path":"abundance","rarity":4,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.3","releaseOrder":3,"assets":{"avatarPath":"/assets/characters/lynx-avatar-69660d7cc9dc.png","portraitPath":"/assets/characters/lynx-avatar-69660d7cc9dc.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/08/25/5d370b56f9b501cd9ceece492bda2757_7669076470419531973.png","sourceUpdatedAt":"2023-08-17T16:29:32.000Z","sha256":"69660d7cc9dc2f6f3fca5d3a00886192146e948be8dce0a1dbcbbd732dbc81b7","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('guinaifen', '1210', 'guinaifen', 'fire', 'nihility', 4, 'xianzhou-luofu', 'xianzhou-alliance', '1.4', 4, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"guinaifen","officialId":"1210","baseCharacterId":"guinaifen","names":{"zh-CN":"桂乃芬","en":"Guinaifen","ja":"桂乃芬"},"aliases":{"zh-CN":["gui nai fen","guinaifen"],"en":["guinaifen"],"ja":["keinaifun"]},"element":"fire","path":"nihility","rarity":4,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.4","releaseOrder":4,"assets":{"avatarPath":"/assets/characters/guinaifen-avatar-a3889d33288f.png","portraitPath":"/assets/characters/guinaifen-avatar-a3889d33288f.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/113258/e90d16f57aca708b2806dc17fe5fd85a_8376468351414248938.png","sourceUpdatedAt":"2023-10-09T16:28:20.000Z","sha256":"a3889d33288fcf2df918f1317f869337ea66b43a7721db1590d56ad25f040f4f","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('jingliu', '1212', 'jingliu', 'ice', 'destruction', 5, 'xianzhou-luofu', 'xianzhou-alliance', '1.4', 4, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"jingliu","officialId":"1212","baseCharacterId":"jingliu","names":{"zh-CN":"镜流","en":"Jingliu","ja":"鏡流"},"aliases":{"zh-CN":["jing liu","jingliu"],"en":["jingliu"],"ja":["keiryuu","keiryu"]},"element":"ice","path":"destruction","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.4","releaseOrder":4,"assets":{"avatarPath":"/assets/characters/jingliu-avatar-1798d3ee3663.png","portraitPath":"/assets/characters/jingliu-avatar-1798d3ee3663.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/113257/6b1caa6dcac86b51754256a626d7089a_6047546758250201368.png","sourceUpdatedAt":"2023-10-09T16:27:45.000Z","sha256":"1798d3ee36632fb5778c850fe7dc1f39f32b610136b2c6985f1c7b66886c06a4","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('topaz-and-numby', '1112', 'topaz-and-numby', 'fire', 'hunt', 5, 'ipc', 'ipc', '1.4', 4, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"topaz-and-numby","officialId":"1112","baseCharacterId":"topaz-and-numby","names":{"zh-CN":"托帕&账账","en":"Topaz & Numby","ja":"トパーズ&カブ"},"aliases":{"zh-CN":["托帕","账账","tuo pa zhang zhang","tuopazhangzhang","tuo pa","tuopa","zhang zhang","zhangzhang"],"en":["Topaz","Numby","topaz numby","topaznumby"],"ja":["トパーズ","カブ","topaazu kabu","topaazukabu","topazu kabu","topazukabu","topaazu","topazu","kabu"]},"element":"fire","path":"hunt","rarity":5,"factionId":"ipc","factionGroupId":"ipc","releaseVersionId":"1.4","releaseOrder":4,"assets":{"avatarPath":"/assets/characters/topaz-and-numby-avatar-a67a6106a0ff.png","portraitPath":"/assets/characters/topaz-and-numby-avatar-a67a6106a0ff.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/113259/aec4e9e1f59e78ff72d8d1b8b9dd0712_4605153740160210783.png","sourceUpdatedAt":"2023-10-09T16:28:49.000Z","sha256":"a67a6106a0ff7b3ba68d9c1e65cac7780cf6584ea5fe4cee154c51ab9dc577ec","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('argenti', '1302', 'argenti', 'physical', 'erudition', 5, 'knights-of-beauty', 'cosmic', '1.5', 5, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"argenti","officialId":"1302","baseCharacterId":"argenti","names":{"zh-CN":"银枝","en":"Argenti","ja":"アルジェンティ"},"aliases":{"zh-CN":["yin zhi","yinzhi"],"en":["argenti"],"ja":["arujentei"]},"element":"physical","path":"erudition","rarity":5,"factionId":"knights-of-beauty","factionGroupId":"cosmic","releaseVersionId":"1.5","releaseOrder":5,"assets":{"avatarPath":"/assets/characters/argenti-avatar-6e67ada6f633.png","portraitPath":"/assets/characters/argenti-avatar-6e67ada6f633.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/113551/2bd119b8c3be5a8981f21e308d0ff9df_6080004376791968215.png","sourceUpdatedAt":"2023-11-06T15:42:15.000Z","sha256":"6e67ada6f6338de28e21d2dd185834a60f6e791ca950119332d093c47b6c3aa4","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('hanya', '1215', 'hanya', 'physical', 'harmony', 4, 'xianzhou-luofu', 'xianzhou-alliance', '1.5', 5, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"hanya","officialId":"1215","baseCharacterId":"hanya","names":{"zh-CN":"寒鸦","en":"Hanya","ja":"寒鴉"},"aliases":{"zh-CN":["han ya","hanya"],"en":["hanya"],"ja":["kan a","kana"]},"element":"physical","path":"harmony","rarity":4,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.5","releaseOrder":5,"assets":{"avatarPath":"/assets/characters/hanya-avatar-80b6f1b592cd.png","portraitPath":"/assets/characters/hanya-avatar-80b6f1b592cd.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/113552/2b71f46b9d67d3ffc1d889fd4e967e9a_3247476334578569723.png","sourceUpdatedAt":"2023-11-06T15:42:44.000Z","sha256":"80b6f1b592cd6a814a65409cfdb7f1ba6a90114b28708bd528eac0e190086f8b","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('huohuo', '1217', 'huohuo', 'wind', 'abundance', 5, 'xianzhou-luofu', 'xianzhou-alliance', '1.5', 5, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"huohuo","officialId":"1217","baseCharacterId":"huohuo","names":{"zh-CN":"藿藿","en":"Huohuo","ja":"フォフォ"},"aliases":{"zh-CN":["huo huo","huohuo"],"en":["huohuo"],"ja":["fuofuo"]},"element":"wind","path":"abundance","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.5","releaseOrder":5,"assets":{"avatarPath":"/assets/characters/huohuo-avatar-3a8f2742bd7a.png","portraitPath":"/assets/characters/huohuo-avatar-3a8f2742bd7a.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/113549/6241e29b78992e78f7be09ecc9a095d8_9119778655003994988.png","sourceUpdatedAt":"2023-11-06T15:41:41.000Z","sha256":"3a8f2742bd7a4b8eac3aeedb4370dba26a26ad054738903d835e59163aaf4730","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('dr-ratio', '1305', 'dr-ratio', 'imaginary', 'hunt', 5, 'intelligentsia-guild', 'cosmic', '1.6', 6, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"dr-ratio","officialId":"1305","baseCharacterId":"dr-ratio","names":{"zh-CN":"真理医生","en":"Dr. Ratio","ja":"Dr.レイシオ"},"aliases":{"zh-CN":["真理","zhen li yi sheng","zhenliyisheng","zhen li","zhenli"],"en":["Ratio","Dr Ratio","drratio"],"ja":["レイシオ","reishio"]},"element":"imaginary","path":"hunt","rarity":5,"factionId":"intelligentsia-guild","factionGroupId":"cosmic","releaseVersionId":"1.6","releaseOrder":6,"assets":{"avatarPath":"/assets/characters/dr-ratio-avatar-8e8cc1c26b98.png","portraitPath":"/assets/characters/dr-ratio-avatar-8e8cc1c26b98.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/114134/a6c86498e909f09945664a1e5b4d20be_7065933365556000987.png","sourceUpdatedAt":"2023-12-20T17:27:56.000Z","sha256":"8e8cc1c26b981aab57286cda860c14900704dea265b5062a6a3fecac8b34f602","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('ruan-mei', '1303', 'ruan-mei', 'ice', 'harmony', 5, 'herta-space-station', 'herta-space-station', '1.6', 6, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"ruan-mei","officialId":"1303","baseCharacterId":"ruan-mei","names":{"zh-CN":"阮•梅","en":"Ruan Mei","ja":"ルアン・メェイ"},"aliases":{"zh-CN":["ruan mei","ruanmei"],"en":["ruan mei","ruanmei"],"ja":["ruan meei","ruanmeei","ruan mei","ruanmei"]},"element":"ice","path":"harmony","rarity":5,"factionId":"herta-space-station","factionGroupId":"herta-space-station","releaseVersionId":"1.6","releaseOrder":6,"assets":{"avatarPath":"/assets/characters/ruan-mei-avatar-a1e997242931.png","portraitPath":"/assets/characters/ruan-mei-avatar-a1e997242931.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/114133/13f82e11d0a64fc4a7765a11e52ce63d_553982494913934113.png","sourceUpdatedAt":"2023-12-20T17:26:56.000Z","sha256":"a1e997242931e61940134e51ba9fef72908bf34a8865108b1ec299dd5598c898","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('xueyi', '1214', 'xueyi', 'quantum', 'destruction', 4, 'xianzhou-luofu', 'xianzhou-alliance', '1.6', 6, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"xueyi","officialId":"1214","baseCharacterId":"xueyi","names":{"zh-CN":"雪衣","en":"Xueyi","ja":"雪衣"},"aliases":{"zh-CN":["xue yi","xueyi"],"en":["xueyi"],"ja":["setsui"]},"element":"quantum","path":"destruction","rarity":4,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.6","releaseOrder":6,"assets":{"avatarPath":"/assets/characters/xueyi-avatar-3b5c911839ee.png","portraitPath":"/assets/characters/xueyi-avatar-3b5c911839ee.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/114135/015f96e57ba7744d32137dc761104eb4_8612953409015173590.png","sourceUpdatedAt":"2023-12-20T17:29:24.000Z","sha256":"3b5c911839ee075cd9c76e8dbadc3c303d14defa21040dbd0d16ec363b235c97","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('black-swan', '1307', 'black-swan', 'wind', 'nihility', 5, 'garden-of-recollection', 'cosmic', '2.0', 7, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"black-swan","officialId":"1307","baseCharacterId":"black-swan","names":{"zh-CN":"黑天鹅","en":"Black Swan","ja":"ブラックスワン"},"aliases":{"zh-CN":["hei tian e","heitiane"],"en":["black swan","blackswan"],"ja":["burakkusuwan"]},"element":"wind","path":"nihility","rarity":5,"factionId":"garden-of-recollection","factionGroupId":"cosmic","releaseVersionId":"2.0","releaseOrder":7,"assets":{"avatarPath":"/assets/characters/black-swan-avatar-59452a1c84d4.png","portraitPath":"/assets/characters/black-swan-avatar-59452a1c84d4.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/122114/e09b820993f140deb0f552391784cb7e_2387142678634153379.png","sourceUpdatedAt":"2024-01-29T11:13:27.000Z","sha256":"59452a1c84d4b26a54d72dd77483ed5c5f5c147689ee36f14e4227731739ec5a","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('misha', '1312', 'misha', 'ice', 'destruction', 4, 'penacony', 'penacony', '2.0', 7, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"misha","officialId":"1312","baseCharacterId":"misha","names":{"zh-CN":"米沙","en":"Misha","ja":"ミーシャ"},"aliases":{"zh-CN":["mi sha","misha"],"en":["misha"],"ja":["miisha","misha"]},"element":"ice","path":"destruction","rarity":4,"factionId":"penacony","factionGroupId":"penacony","releaseVersionId":"2.0","releaseOrder":7,"assets":{"avatarPath":"/assets/characters/misha-avatar-82816a770116.png","portraitPath":"/assets/characters/misha-avatar-82816a770116.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/122125/1f6734903188a4e52392a944b7038424_4429179718536429240.png","sourceUpdatedAt":"2024-01-29T12:39:24.000Z","sha256":"82816a770116606f5bbf47de2c5bafac9bb36892b172ec7e817fc5e7cffbb2ab","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('sparkle', '1306', 'sparkle', 'quantum', 'harmony', 5, 'masked-fools', 'cosmic', '2.0', 7, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"sparkle","officialId":"1306","baseCharacterId":"sparkle","names":{"zh-CN":"花火","en":"Sparkle","ja":"花火"},"aliases":{"zh-CN":["hua huo","huahuo"],"en":["sparkle"],"ja":["hanabi"]},"element":"quantum","path":"harmony","rarity":5,"factionId":"masked-fools","factionGroupId":"cosmic","releaseVersionId":"2.0","releaseOrder":7,"assets":{"avatarPath":"/assets/characters/sparkle-avatar-d4e241c4b49b.png","portraitPath":"/assets/characters/sparkle-avatar-d4e241c4b49b.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/122124/418ee59a48e96cb3a8f5dbfd009200a1_2144754028775142076.png","sourceUpdatedAt":"2024-01-29T12:38:57.000Z","sha256":"d4e241c4b49b068f9719cf94768389f86e3eac8941a197e02108af34e61788ca","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('acheron', '1308', 'acheron', 'lightning', 'nihility', 5, 'self-annihilators', 'cosmic', '2.1', 8, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"acheron","officialId":"1308","baseCharacterId":"acheron","names":{"zh-CN":"黄泉","en":"Acheron","ja":"黄泉"},"aliases":{"zh-CN":["huang quan","huangquan"],"en":["acheron"],"ja":["yomi"]},"element":"lightning","path":"nihility","rarity":5,"factionId":"self-annihilators","factionGroupId":"cosmic","releaseVersionId":"2.1","releaseOrder":8,"assets":{"avatarPath":"/assets/characters/acheron-avatar-7676548cd1fd.png","portraitPath":"/assets/characters/acheron-avatar-7676548cd1fd.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/122837/7bbabff9dde54156d00585fc1d45605b_4199325960554656142.png","sourceUpdatedAt":"2024-03-12T15:44:11.000Z","sha256":"7676548cd1fdb7cf3b53888c138bbbbdcbd703baeb8f884ba24bfcbe1dcb0919","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('aventurine', '1304', 'aventurine', 'imaginary', 'preservation', 5, 'ipc', 'ipc', '2.1', 8, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"aventurine","officialId":"1304","baseCharacterId":"aventurine","names":{"zh-CN":"砂金","en":"Aventurine","ja":"アベンチュリン"},"aliases":{"zh-CN":["sha jin","shajin"],"en":["aventurine"],"ja":["abenchurin"]},"element":"imaginary","path":"preservation","rarity":5,"factionId":"ipc","factionGroupId":"ipc","releaseVersionId":"2.1","releaseOrder":8,"assets":{"avatarPath":"/assets/characters/aventurine-avatar-0ff97f429972.png","portraitPath":"/assets/characters/aventurine-avatar-0ff97f429972.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/122838/03821220467396a333cd5362ebe0e1d1_6315724069120210502.png","sourceUpdatedAt":"2024-03-12T16:02:51.000Z","sha256":"0ff97f4299729f5311a6acf81d3250d58e6d1fbb07e9397bc91994528772af26","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('gallagher', '1301', 'gallagher', 'fire', 'abundance', 4, 'penacony', 'penacony', '2.1', 8, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"gallagher","officialId":"1301","baseCharacterId":"gallagher","names":{"zh-CN":"加拉赫","en":"Gallagher","ja":"ギャラガー"},"aliases":{"zh-CN":["jia la he","jialahe"],"en":["gallagher"],"ja":["gyaragaa","gyaraga"]},"element":"fire","path":"abundance","rarity":4,"factionId":"penacony","factionGroupId":"penacony","releaseVersionId":"2.1","releaseOrder":8,"assets":{"avatarPath":"/assets/characters/gallagher-avatar-56e22ff2e836.png","portraitPath":"/assets/characters/gallagher-avatar-56e22ff2e836.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/122839/72f42969256b2877af1b5bb5bd5b9f3d_1868580186070340307.png","sourceUpdatedAt":"2024-03-12T16:04:03.000Z","sha256":"56e22ff2e83657e96f1bd3826c178f16cc8d3b2e2286720825caeaafbb2afafd","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('boothill', '1315', 'boothill', 'physical', 'hunt', 5, 'galaxy-rangers', 'cosmic', '2.2', 9, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"boothill","officialId":"1315","baseCharacterId":"boothill","names":{"zh-CN":"波提欧","en":"Boothill","ja":"ブートヒル"},"aliases":{"zh-CN":["bo ti ou","botiou"],"en":["boothill"],"ja":["buutohiru","butohiru"]},"element":"physical","path":"hunt","rarity":5,"factionId":"galaxy-rangers","factionGroupId":"cosmic","releaseVersionId":"2.2","releaseOrder":9,"assets":{"avatarPath":"/assets/characters/boothill-avatar-039177ccda71.png","portraitPath":"/assets/characters/boothill-avatar-039177ccda71.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/123310/52a05c95d460a51ffd0b26d5cccc95cb_5771592969358909617.png","sourceUpdatedAt":"2024-04-18T16:11:48.000Z","sha256":"039177ccda71245838a53c821dc72131173cb44e3f0cb4f736b84e2a533f85d7","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('robin', '1309', 'robin', 'physical', 'harmony', 5, 'penacony', 'penacony', '2.2', 9, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"robin","officialId":"1309","baseCharacterId":"robin","names":{"zh-CN":"知更鸟","en":"Robin","ja":"ロビン"},"aliases":{"zh-CN":["zhi geng niao","zhigengniao"],"en":["robin"],"ja":["robin"]},"element":"physical","path":"harmony","rarity":5,"factionId":"penacony","factionGroupId":"penacony","releaseVersionId":"2.2","releaseOrder":9,"assets":{"avatarPath":"/assets/characters/robin-avatar-831c516c3714.png","portraitPath":"/assets/characters/robin-avatar-831c516c3714.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/123309/ff40360a998bb038bb8336d56bf11318_5103405246540367373.png","sourceUpdatedAt":"2024-04-18T16:11:00.000Z","sha256":"831c516c3714b59179d3d5297420243f48295c9d309a46e5cea6a94ac6ace14c","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('trailblazer-harmony', '8005', 'trailblazer', 'imaginary', 'harmony', 5, 'astral-express', 'astral-express', '2.2', 9, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"trailblazer-harmony","officialId":"8005","baseCharacterId":"trailblazer","names":{"zh-CN":"开拓者·同谐","en":"Trailblazer · Harmony","ja":"開拓者・調和"},"aliases":{"zh-CN":["开拓者","同谐主角","kai tuo zhe tong xie","kaituozhetongxie","kai tuo zhe","kaituozhe","tong xie zhu jue","tongxiezhujue"],"en":["Trailblazer","Harmony Trailblazer","trailblazer harmony","trailblazerharmony","harmonytrailblazer"],"ja":["開拓者","調和開拓者","trailblazer harmony","trailblazerharmony","kaitakusha chowa","kaitakushachowa"]},"element":"imaginary","path":"harmony","rarity":5,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"2.2","releaseOrder":9,"assets":{"avatarPath":"/assets/characters/trailblazer-harmony-avatar-8ab0f9082b98.png","portraitPath":"/assets/characters/trailblazer-harmony-avatar-8ab0f9082b98.png","sourceUrl":"https://raw.githubusercontent.com/Mar-7th/StarRailRes/b95e75c7e1273d819d20c530c0b7e13a3ef19fb4/icon/character/8005.png","sourceUpdatedAt":"2026-07-18T17:08:44.000Z","sha256":"8ab0f9082b9840d46d21d0cee9cb090cb24fe61c5b964d6954a384ca110e8a2d","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('firefly', '1310', 'firefly', 'fire', 'destruction', 5, 'stellaron-hunters', 'stellaron-hunters', '2.3', 10, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"firefly","officialId":"1310","baseCharacterId":"firefly","names":{"zh-CN":"流萤","en":"Firefly","ja":"ホタル"},"aliases":{"zh-CN":["萤宝","萨姆","liu ying","liuying","ying bao","yingbao","sa mu","samu"],"en":["SAM","firefly"],"ja":["サム","hotaru","samu"]},"element":"fire","path":"destruction","rarity":5,"factionId":"stellaron-hunters","factionGroupId":"stellaron-hunters","releaseVersionId":"2.3","releaseOrder":10,"assets":{"avatarPath":"/assets/characters/firefly-avatar-95f3c017e490.png","portraitPath":"/assets/characters/firefly-avatar-95f3c017e490.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/123957/863ae8d7ebc3a8ccba6d1500f105793f_2481513828224126028.png","sourceUpdatedAt":"2024-06-03T15:56:33.000Z","sha256":"95f3c017e4905557ebdf38a7bcfc7346956f561fefc678c367bb6cbc9f6a61c2","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('jade', '1314', 'jade', 'quantum', 'erudition', 5, 'ipc', 'ipc', '2.3', 10, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"jade","officialId":"1314","baseCharacterId":"jade","names":{"zh-CN":"翡翠","en":"Jade","ja":"ジェイド"},"aliases":{"zh-CN":["fei cui","feicui"],"en":["jade"],"ja":["jeido"]},"element":"quantum","path":"erudition","rarity":5,"factionId":"ipc","factionGroupId":"ipc","releaseVersionId":"2.3","releaseOrder":10,"assets":{"avatarPath":"/assets/characters/jade-avatar-deea45c1dd61.png","portraitPath":"/assets/characters/jade-avatar-deea45c1dd61.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/123958/da750d7c75fc93eee15d7a2a9ced7b60_459052514305755111.png","sourceUpdatedAt":"2024-06-03T16:15:25.000Z","sha256":"deea45c1dd618cc93c17037de0d60c4bd622529fc64a84fb59d0aaf216e57ae4","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('jiaoqiu', '1218', 'jiaoqiu', 'fire', 'nihility', 5, 'xianzhou-yaoqing', 'xianzhou-alliance', '2.4', 11, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"jiaoqiu","officialId":"1218","baseCharacterId":"jiaoqiu","names":{"zh-CN":"椒丘","en":"Jiaoqiu","ja":"椒丘"},"aliases":{"zh-CN":["jiao qiu","jiaoqiu"],"en":["jiaoqiu"],"ja":["shoukyuu","shoukyu"]},"element":"fire","path":"nihility","rarity":5,"factionId":"xianzhou-yaoqing","factionGroupId":"xianzhou-alliance","releaseVersionId":"2.4","releaseOrder":11,"assets":{"avatarPath":"/assets/characters/jiaoqiu-avatar-4c8d9c1ba0e0.png","portraitPath":"/assets/characters/jiaoqiu-avatar-4c8d9c1ba0e0.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/124840/68ece84e57c8a8b35ea5e3c1f3faab2c_6392230512755725938.png","sourceUpdatedAt":"2024-07-16T10:42:10.000Z","sha256":"4c8d9c1ba0e05ee31b86de89676a19f175365577516eec0ae930d84b0779e12c","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('march-7th-hunt', '1224', 'march-7th', 'imaginary', 'hunt', 4, 'astral-express', 'astral-express', '2.4', 11, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"march-7th-hunt","officialId":"1224","baseCharacterId":"march-7th","names":{"zh-CN":"三月七·巡猎","en":"March 7th · The Hunt","ja":"三月なのか・巡狩"},"aliases":{"zh-CN":["三月七","巡猎三月七","剑三月","san yue qi xun lie","sanyueqixunlie","san yue qi","sanyueqi","xun lie san yue qi","xunliesanyueqi","jian san yue","jiansanyue"],"en":["March 7th","Hunt March","M7 Hunt","march 7th the hunt","march7ththehunt","march7th","huntmarch","m7hunt"],"ja":["三月なのか","巡狩の三月なのか","巡狩なのか","nanoka","no nanoka","nonanoka","mitsuki nanoka junshu","mitsukinanokajunshu"]},"element":"imaginary","path":"hunt","rarity":4,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"2.4","releaseOrder":11,"assets":{"avatarPath":"/assets/characters/march-7th-hunt-avatar-70b58fc7fe3f.png","portraitPath":"/assets/characters/march-7th-hunt-avatar-70b58fc7fe3f.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/124841/10bd1dcd95f5749cdc16b088bb98ff5f_2845915467121228499.png","sourceUpdatedAt":"2024-07-16T10:42:37.000Z","sha256":"70b58fc7fe3f735937f921b23f8506ec4fbdc3431b3900a72c0b1d9627ba9058","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('yunli', '1221', 'yunli', 'physical', 'destruction', 5, 'xianzhou-zhuming', 'xianzhou-alliance', '2.4', 11, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"yunli","officialId":"1221","baseCharacterId":"yunli","names":{"zh-CN":"云璃","en":"Yunli","ja":"雲璃"},"aliases":{"zh-CN":["yun li","yunli"],"en":["yunli"],"ja":["unri"]},"element":"physical","path":"destruction","rarity":5,"factionId":"xianzhou-zhuming","factionGroupId":"xianzhou-alliance","releaseVersionId":"2.4","releaseOrder":11,"assets":{"avatarPath":"/assets/characters/yunli-avatar-8a2e54b49880.png","portraitPath":"/assets/characters/yunli-avatar-8a2e54b49880.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/124839/d759b33d72c0bec02a1293d3155d820f_8871451623128806042.png","sourceUpdatedAt":"2024-07-16T10:41:37.000Z","sha256":"8a2e54b49880d5678bd699e4602a4a4e462babbbb957c74bf77e585febc3cf95","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('feixiao', '1220', 'feixiao', 'wind', 'hunt', 5, 'xianzhou-yaoqing', 'xianzhou-alliance', '2.5', 12, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"feixiao","officialId":"1220","baseCharacterId":"feixiao","names":{"zh-CN":"飞霄","en":"Feixiao","ja":"飛霄"},"aliases":{"zh-CN":["fei xiao","feixiao"],"en":["feixiao"],"ja":["hishou"]},"element":"wind","path":"hunt","rarity":5,"factionId":"xianzhou-yaoqing","factionGroupId":"xianzhou-alliance","releaseVersionId":"2.5","releaseOrder":12,"assets":{"avatarPath":"/assets/characters/feixiao-avatar-3979450d3733.png","portraitPath":"/assets/characters/feixiao-avatar-3979450d3733.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/125609/951a91c3fe715d0240d2206613f7c919_5034276035636498391.png","sourceUpdatedAt":"2024-08-30T11:23:44.000Z","sha256":"3979450d37330b5b2b46dc8c60c1f62f8504acf150fff416ceed949e139044db","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('lingsha', '1222', 'lingsha', 'fire', 'abundance', 5, 'xianzhou-luofu', 'xianzhou-alliance', '2.5', 12, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"lingsha","officialId":"1222","baseCharacterId":"lingsha","names":{"zh-CN":"灵砂","en":"Lingsha","ja":"霊砂"},"aliases":{"zh-CN":["ling sha","lingsha"],"en":["lingsha"],"ja":["reisa"]},"element":"fire","path":"abundance","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"2.5","releaseOrder":12,"assets":{"avatarPath":"/assets/characters/lingsha-avatar-e67420fda0c0.png","portraitPath":"/assets/characters/lingsha-avatar-e67420fda0c0.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/125610/932874b29ac1dfb4bdfe63d7ff4dea8f_3082176141300282450.png","sourceUpdatedAt":"2024-08-30T11:24:22.000Z","sha256":"e67420fda0c0b97e5255780303d57de810d06ce3617a42748adf53e878b1b1bd","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('moze', '1223', 'moze', 'lightning', 'hunt', 4, 'xianzhou-yaoqing', 'xianzhou-alliance', '2.5', 12, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"moze","officialId":"1223","baseCharacterId":"moze","names":{"zh-CN":"貊泽","en":"Moze","ja":"モゼ"},"aliases":{"zh-CN":["mo ze","moze"],"en":["moze"],"ja":["moze"]},"element":"lightning","path":"hunt","rarity":4,"factionId":"xianzhou-yaoqing","factionGroupId":"xianzhou-alliance","releaseVersionId":"2.5","releaseOrder":12,"assets":{"avatarPath":"/assets/characters/moze-avatar-00139b2fba69.png","portraitPath":"/assets/characters/moze-avatar-00139b2fba69.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/125611/29163c8057be125dbb30bf1cc95df68e_11877494415624128.png","sourceUpdatedAt":"2024-08-30T11:24:50.000Z","sha256":"00139b2fba69aa1051f46b1095db5b40f53da071c180ca2d9004138f53ecb803","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('rappa', '1317', 'rappa', 'imaginary', 'erudition', 5, 'galaxy-rangers', 'cosmic', '2.6', 13, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"rappa","officialId":"1317","baseCharacterId":"rappa","names":{"zh-CN":"乱破","en":"Rappa","ja":"乱破"},"aliases":{"zh-CN":["luan po","luanpo"],"en":["rappa"],"ja":["ranha"]},"element":"imaginary","path":"erudition","rarity":5,"factionId":"galaxy-rangers","factionGroupId":"cosmic","releaseVersionId":"2.6","releaseOrder":13,"assets":{"avatarPath":"/assets/characters/rappa-avatar-86a21eaf73a3.png","portraitPath":"/assets/characters/rappa-avatar-86a21eaf73a3.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/126410/a7c1fe9cf5cde28ea3ab57886e7b3a79_575417614613269360.png","sourceUpdatedAt":"2024-10-15T11:44:11.000Z","sha256":"86a21eaf73a34a1485aa1c69c0a0962e8e62f5f0fc9f3d5da43bd1fa5a482a0d","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('fugue', '1225', 'fugue', 'fire', 'nihility', 5, 'xianzhou-luofu', 'xianzhou-alliance', '2.7', 14, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"fugue","officialId":"1225","baseCharacterId":"fugue","names":{"zh-CN":"忘归人","en":"Fugue","ja":"帰忘の流離人"},"aliases":{"zh-CN":["wang gui ren","wangguiren"],"en":["fugue"],"ja":["kibounosasuraibito"]},"element":"fire","path":"nihility","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"2.7","releaseOrder":14,"assets":{"avatarPath":"/assets/characters/fugue-avatar-4fc575471981.png","portraitPath":"/assets/characters/fugue-avatar-4fc575471981.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/127090/7f01d89e3a8713ddeb2e1348e3975af8_3993190531595481161.png","sourceUpdatedAt":"2024-11-22T14:17:18.000Z","sha256":"4fc575471981431de1738f0c309780f09b73ead0f09e9e546d120ed9e9c4c2a5","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('sunday', '1313', 'sunday', 'imaginary', 'harmony', 5, 'cosmic', 'cosmic', '2.7', 14, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"sunday","officialId":"1313","baseCharacterId":"sunday","names":{"zh-CN":"星期日","en":"Sunday","ja":"サンデー"},"aliases":{"zh-CN":["xing qi ri","xingqiri"],"en":["sunday"],"ja":["sandee","sande"]},"element":"imaginary","path":"harmony","rarity":5,"factionId":"cosmic","factionGroupId":"cosmic","releaseVersionId":"2.7","releaseOrder":14,"assets":{"avatarPath":"/assets/characters/sunday-avatar-6419f26d34d2.png","portraitPath":"/assets/characters/sunday-avatar-6419f26d34d2.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/127020/f3bb89ca79422032f554aaf7086178d7_5070348504428165390.png","sourceUpdatedAt":"2024-11-19T16:13:17.000Z","sha256":"6419f26d34d20fd166167d8e708086d8133de1c674e0347b741eed961f8c78ac","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('aglaea', '1402', 'aglaea', 'lightning', 'remembrance', 5, 'amphoreus', 'amphoreus', '3.0', 15, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"aglaea","officialId":"1402","baseCharacterId":"aglaea","names":{"zh-CN":"阿格莱雅","en":"Aglaea","ja":"アグライア"},"aliases":{"zh-CN":["a ge lai ya","agelaiya"],"en":["aglaea"],"ja":["aguraia"]},"element":"lightning","path":"remembrance","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.0","releaseOrder":15,"assets":{"avatarPath":"/assets/characters/aglaea-avatar-1bbe277dab6e.png","portraitPath":"/assets/characters/aglaea-avatar-1bbe277dab6e.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/127763/9c07eb1ba64c09da024c8c255083b3a0_3379089841159520258.png","sourceUpdatedAt":"2024-12-30T18:05:16.000Z","sha256":"1bbe277dab6e6442afef81cd8cafe560d70754594e851532845904e9d0627fbe","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('the-herta', '1401', 'herta', 'ice', 'erudition', 5, 'herta-space-station', 'herta-space-station', '3.0', 15, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"the-herta","officialId":"1401","baseCharacterId":"herta","names":{"zh-CN":"大黑塔","en":"The Herta","ja":"マダム・ヘルタ"},"aliases":{"zh-CN":["黑塔","da hei ta","daheita","hei ta","heita"],"en":["Herta","Madam Herta","the herta","theherta","madamherta"],"ja":["ヘルタ","madamu heruta","madamuheruta","heruta"]},"element":"ice","path":"erudition","rarity":5,"factionId":"herta-space-station","factionGroupId":"herta-space-station","releaseVersionId":"3.0","releaseOrder":15,"assets":{"avatarPath":"/assets/characters/the-herta-avatar-306da87b6817.png","portraitPath":"/assets/characters/the-herta-avatar-306da87b6817.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/127762/1280169cd0d65d40da34be92c242455f_7196380219881853106.png","sourceUpdatedAt":"2024-12-30T17:37:29.000Z","sha256":"306da87b6817d93328a9b60fdca506e1f00e5f293f35a12f0c5c3f93cc0962cd","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('trailblazer-remembrance', '8007', 'trailblazer', 'ice', 'remembrance', 5, 'astral-express', 'astral-express', '3.0', 15, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"trailblazer-remembrance","officialId":"8007","baseCharacterId":"trailblazer","names":{"zh-CN":"开拓者·记忆","en":"Trailblazer · Remembrance","ja":"開拓者・記憶"},"aliases":{"zh-CN":["开拓者","记忆主角","kai tuo zhe ji yi","kaituozhejiyi","kai tuo zhe","kaituozhe","ji yi zhu jue","jiyizhujue"],"en":["Trailblazer","Remembrance Trailblazer","trailblazer remembrance","trailblazerremembrance","remembrancetrailblazer"],"ja":["開拓者","記憶開拓者","trailblazer remembrance","trailblazerremembrance","kaitakusha kioku","kaitakushakioku"]},"element":"ice","path":"remembrance","rarity":5,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"3.0","releaseOrder":15,"assets":{"avatarPath":"/assets/characters/trailblazer-remembrance-avatar-38ba6a863c7d.png","portraitPath":"/assets/characters/trailblazer-remembrance-avatar-38ba6a863c7d.png","sourceUrl":"https://raw.githubusercontent.com/Mar-7th/StarRailRes/b95e75c7e1273d819d20c530c0b7e13a3ef19fb4/icon/character/8007.png","sourceUpdatedAt":"2026-07-18T17:08:44.000Z","sha256":"38ba6a863c7dcce077ec6b02f84d994ae88c9aba526881460028a8ec99eb1831","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('mydei', '1404', 'mydei', 'imaginary', 'destruction', 5, 'amphoreus', 'amphoreus', '3.1', 16, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"mydei","officialId":"1404","baseCharacterId":"mydei","names":{"zh-CN":"万敌","en":"Mydei","ja":"モーディス"},"aliases":{"zh-CN":["wan di","wandi"],"en":["mydei"],"ja":["moodeisu","modeisu"]},"element":"imaginary","path":"destruction","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.1","releaseOrder":16,"assets":{"avatarPath":"/assets/characters/mydei-avatar-567729274be4.png","portraitPath":"/assets/characters/mydei-avatar-567729274be4.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/154335/65e716ba532efb6f0ad20631965cf604_3824046770472296744.png","sourceUpdatedAt":"2025-02-12T15:39:05.000Z","sha256":"567729274be429b4874cab8eeb1fe09b917810a908ecb162d5be636f80e37592","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('tribbie', '1403', 'tribbie', 'quantum', 'harmony', 5, 'amphoreus', 'amphoreus', '3.1', 16, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"tribbie","officialId":"1403","baseCharacterId":"tribbie","names":{"zh-CN":"缇宝","en":"Tribbie","ja":"トリビー"},"aliases":{"zh-CN":["ti bao","tibao"],"en":["tribbie"],"ja":["toribii","toribi"]},"element":"quantum","path":"harmony","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.1","releaseOrder":16,"assets":{"avatarPath":"/assets/characters/tribbie-avatar-296b1a123c22.png","portraitPath":"/assets/characters/tribbie-avatar-296b1a123c22.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/154334/de3fc6c9646b5567a92280e27b672b39_2277495775685534409.png","sourceUpdatedAt":"2025-02-12T15:30:29.000Z","sha256":"296b1a123c221162acb1ee40cc7279a24907ba7141737b26e2ba01e79e15e273","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('anaxa', '1405', 'anaxa', 'wind', 'erudition', 5, 'amphoreus', 'amphoreus', '3.2', 17, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"anaxa","officialId":"1405","baseCharacterId":"anaxa","names":{"zh-CN":"那刻夏","en":"Anaxa","ja":"アナイクス"},"aliases":{"zh-CN":["na ke xia","nakexia"],"en":["anaxa"],"ja":["anaikusu"]},"element":"wind","path":"erudition","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.2","releaseOrder":17,"assets":{"avatarPath":"/assets/characters/anaxa-avatar-6d50f51d5cf0.png","portraitPath":"/assets/characters/anaxa-avatar-6d50f51d5cf0.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/155154/48d81bdfd6d7feca4edcc9f27d776b06_1716219330657468352.png","sourceUpdatedAt":"2025-03-24T16:46:43.000Z","sha256":"6d50f51d5cf0d5be0dafc43cd64abde4c0eee690b2aadc26a51fe9c03a33df3a","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('castorice', '1407', 'castorice', 'quantum', 'remembrance', 5, 'amphoreus', 'amphoreus', '3.2', 17, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"castorice","officialId":"1407","baseCharacterId":"castorice","names":{"zh-CN":"遐蝶","en":"Castorice","ja":"キャストリス"},"aliases":{"zh-CN":["xia die","xiadie"],"en":["castorice"],"ja":["kyasutorisu"]},"element":"quantum","path":"remembrance","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.2","releaseOrder":17,"assets":{"avatarPath":"/assets/characters/castorice-avatar-a05fc9e97efb.png","portraitPath":"/assets/characters/castorice-avatar-a05fc9e97efb.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/155153/74dcae39b1317c6a7add3a4b96af5076_3249311660615806732.png","sourceUpdatedAt":"2025-03-24T16:45:11.000Z","sha256":"a05fc9e97efb03510c0e7fbe27afe6cbcfb485f4c3b3e02044b82fb9a2f4af4a","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('cipher', '1406', 'cipher', 'quantum', 'nihility', 5, 'amphoreus', 'amphoreus', '3.3', 18, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"cipher","officialId":"1406","baseCharacterId":"cipher","names":{"zh-CN":"赛飞儿","en":"Cipher","ja":"サフェル"},"aliases":{"zh-CN":["sai fei er","saifeier"],"en":["cipher"],"ja":["safyeru"]},"element":"quantum","path":"nihility","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.3","releaseOrder":18,"assets":{"avatarPath":"/assets/characters/cipher-avatar-7a3884a7ac08.png","portraitPath":"/assets/characters/cipher-avatar-7a3884a7ac08.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/155820/88e3029fd6043521440d24d2a9e048db_4294339742656763641.png","sourceUpdatedAt":"2025-05-07T14:06:25.000Z","sha256":"7a3884a7ac0874c30e648aaaa13612ebbeeb2b3656ebe56f9e087a50a83a1f41","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('hyacine', '1409', 'hyacine', 'wind', 'remembrance', 5, 'amphoreus', 'amphoreus', '3.3', 18, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"hyacine","officialId":"1409","baseCharacterId":"hyacine","names":{"zh-CN":"风堇","en":"Hyacine","ja":"ヒアンシー"},"aliases":{"zh-CN":["feng jin","fengjin"],"en":["hyacine"],"ja":["hianshii","hianshi"]},"element":"wind","path":"remembrance","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.3","releaseOrder":18,"assets":{"avatarPath":"/assets/characters/hyacine-avatar-23ff80766bcb.png","portraitPath":"/assets/characters/hyacine-avatar-23ff80766bcb.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/155819/365635a3493e9523cf3c3769e0169721_4924415025585271982.png","sourceUpdatedAt":"2025-05-07T14:05:43.000Z","sha256":"23ff80766bcbf90e77424486e13ea8a010083a05f31a496dbae1ead75d12c19b","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('archer', '1015', 'archer', 'quantum', 'hunt', 5, 'fate-stay-night', 'another-world', '3.4', 19, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"archer","officialId":"1015","baseCharacterId":"archer","names":{"zh-CN":"Archer","en":"Archer","ja":"アーチャー"},"aliases":{"zh-CN":["archer"],"en":["archer"],"ja":["aachaa","acha"]},"element":"quantum","path":"hunt","rarity":5,"factionId":"fate-stay-night","factionGroupId":"another-world","releaseVersionId":"3.4","releaseOrder":19,"assets":{"avatarPath":"/assets/characters/archer-avatar-0ed79ec7f8fa.png","portraitPath":"/assets/characters/archer-avatar-0ed79ec7f8fa.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/156035/01020be8a2962c7709466c6232f2591f_2398576073763782685.png","sourceUpdatedAt":"2025-05-22T16:43:12.000Z","sha256":"0ed79ec7f8fa570f98717abf6bb65d5ba22f1f54ca2f4bb50954a12d2b547195","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('phainon', '1408', 'phainon', 'physical', 'destruction', 5, 'amphoreus', 'amphoreus', '3.4', 19, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"phainon","officialId":"1408","baseCharacterId":"phainon","names":{"zh-CN":"白厄","en":"Phainon","ja":"ファイノン"},"aliases":{"zh-CN":["bai e","baie"],"en":["phainon"],"ja":["fuainon"]},"element":"physical","path":"destruction","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.4","releaseOrder":19,"assets":{"avatarPath":"/assets/characters/phainon-avatar-0b70600027a3.png","portraitPath":"/assets/characters/phainon-avatar-0b70600027a3.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/157029/19f6ae9cdb8cc618ec9bfefce3e462a3_4906914154538392654.png","sourceUpdatedAt":"2025-06-16T11:01:20.000Z","sha256":"0b70600027a3696f6c99949d0e6b39d3e00762c6c4da447d029f2161957e1fb3","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('saber', '1014', 'saber', 'wind', 'destruction', 5, 'fate-stay-night', 'another-world', '3.4', 19, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"saber","officialId":"1014","baseCharacterId":"saber","names":{"zh-CN":"Saber","en":"Saber","ja":"セイバー"},"aliases":{"zh-CN":["saber"],"en":["saber"],"ja":["seibaa","seiba"]},"element":"wind","path":"destruction","rarity":5,"factionId":"fate-stay-night","factionGroupId":"another-world","releaseVersionId":"3.4","releaseOrder":19,"assets":{"avatarPath":"/assets/characters/saber-avatar-7dde152ddf96.png","portraitPath":"/assets/characters/saber-avatar-7dde152ddf96.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/156034/d5079fea19bd9bf28fbefaf2f18860bd_1399164401629468736.png","sourceUpdatedAt":"2025-05-22T16:37:42.000Z","sha256":"7dde152ddf963a9ba180e4ebdd5c28cd95e3aea11f2562ce1f65af6a2d59e6c1","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('cerydra', '1412', 'cerydra', 'wind', 'harmony', 5, 'amphoreus', 'amphoreus', '3.5', 20, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"cerydra","officialId":"1412","baseCharacterId":"cerydra","names":{"zh-CN":"刻律德菈","en":"Cerydra","ja":"ケリュドラ"},"aliases":{"zh-CN":["ke lu de la","keludela"],"en":["cerydra"],"ja":["keryudora"]},"element":"wind","path":"harmony","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.5","releaseOrder":20,"assets":{"avatarPath":"/assets/characters/cerydra-avatar-7936a8ec3c37.png","portraitPath":"/assets/characters/cerydra-avatar-7936a8ec3c37.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/158016/d44fdd4747f6bd1ec01243ad0be0ebb0_6403409388996483867.png","sourceUpdatedAt":"2025-07-28T15:48:27.000Z","sha256":"7936a8ec3c37611bbaa7aec82bacfd67d43c317b59fb9f1cbca691955145b8ef","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('hysilens', '1410', 'hysilens', 'physical', 'nihility', 5, 'amphoreus', 'amphoreus', '3.5', 20, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"hysilens","officialId":"1410","baseCharacterId":"hysilens","names":{"zh-CN":"海瑟音","en":"Hysilens","ja":"セイレンス"},"aliases":{"zh-CN":["hai se yin","haiseyin"],"en":["hysilens"],"ja":["seirensu"]},"element":"physical","path":"nihility","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.5","releaseOrder":20,"assets":{"avatarPath":"/assets/characters/hysilens-avatar-24551611879f.png","portraitPath":"/assets/characters/hysilens-avatar-24551611879f.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/158011/85a30e672476c4112ad06839f673bd6d_615516595358800112.png","sourceUpdatedAt":"2025-07-28T14:29:26.000Z","sha256":"24551611879f84c4cda96638f6ad6475afd49d06efbaaa80598e2baff0f06795","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('dan-heng-permansor-terrae', '1414', 'dan-heng', 'physical', 'preservation', 5, 'amphoreus', 'amphoreus', '3.6', 21, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"dan-heng-permansor-terrae","officialId":"1414","baseCharacterId":"dan-heng","names":{"zh-CN":"丹恒•腾荒","en":"Dan Heng • Permansor Terrae","ja":"丹恒・騰荒"},"aliases":{"zh-CN":["dan heng teng huang","danhengtenghuang"],"en":["dan heng permansor terrae","danhengpermansorterrae"],"ja":["tankou toukou","tankoutoukou"]},"element":"physical","path":"preservation","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.6","releaseOrder":21,"assets":{"avatarPath":"/assets/characters/dan-heng-permansor-terrae-avatar-33cdba88f3c1.png","portraitPath":"/assets/characters/dan-heng-permansor-terrae-avatar-33cdba88f3c1.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/159044/67a1543c3383367986b19471148bdefe_8194524210788351868.png","sourceUpdatedAt":"2025-08-28T14:41:33.000Z","sha256":"33cdba88f3c108ecdce56ee56c0a86ab7a7bab0549643dc3e22005e2a693a16b","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('evernight', '1413', 'evernight', 'ice', 'remembrance', 5, 'amphoreus', 'amphoreus', '3.6', 21, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"evernight","officialId":"1413","baseCharacterId":"evernight","names":{"zh-CN":"长夜月","en":"Evernight","ja":"長夜月"},"aliases":{"zh-CN":["chang ye yue","changyeyue"],"en":["evernight"],"ja":["nagayozuki"]},"element":"ice","path":"remembrance","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.6","releaseOrder":21,"assets":{"avatarPath":"/assets/characters/evernight-avatar-f387ff953a14.png","portraitPath":"/assets/characters/evernight-avatar-f387ff953a14.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/159043/9afd392f1b8068e06832559fe4163529_3491875745193218742.png","sourceUpdatedAt":"2025-08-28T14:40:44.000Z","sha256":"f387ff953a142e54364e1d478f4471716ca77970cc273a4c017b71f0d981388e","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('cyrene', '1415', 'cyrene', 'ice', 'remembrance', 5, 'amphoreus', 'amphoreus', '3.7', 22, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"cyrene","officialId":"1415","baseCharacterId":"cyrene","names":{"zh-CN":"昔涟","en":"Cyrene","ja":"キュレネ"},"aliases":{"zh-CN":["xi lian","xilian"],"en":["cyrene"],"ja":["kyurene"]},"element":"ice","path":"remembrance","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.7","releaseOrder":22,"assets":{"avatarPath":"/assets/characters/cyrene-avatar-ba047a95195b.png","portraitPath":"/assets/characters/cyrene-avatar-ba047a95195b.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/160346/54fb37ea230e2f6b9b7cc8a12e79329b_1607694867232341960.png","sourceUpdatedAt":"2025-10-17T15:10:58.000Z","sha256":"ba047a95195beb45a53f20a940dcc5131717e2368fc804ee54657d79378011e2","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('the-dahlia', '1321', 'the-dahlia', 'fire', 'nihility', 5, 'the-cremators', 'cosmic', '3.8', 23, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"the-dahlia","officialId":"1321","baseCharacterId":"the-dahlia","names":{"zh-CN":"大丽花","en":"The Dahlia","ja":"ダリア"},"aliases":{"zh-CN":["da li hua","dalihua"],"en":["the dahlia","thedahlia"],"ja":["daria"]},"element":"fire","path":"nihility","rarity":5,"factionId":"the-cremators","factionGroupId":"cosmic","releaseVersionId":"3.8","releaseOrder":23,"assets":{"avatarPath":"/assets/characters/the-dahlia-avatar-516cf749fd35.png","portraitPath":"/assets/characters/the-dahlia-avatar-516cf749fd35.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/161288/5c29fb2f28836327dac5c1e86ad3d120_2015456143368643014.png","sourceUpdatedAt":"2025-12-03T15:54:16.000Z","sha256":"516cf749fd358772ca7f9f74a69db6d14735a785352713eb514a48bb8bfab369","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('sparxie', '1501', 'sparxie', 'fire', 'elation', 5, 'masked-fools', 'cosmic', '4.0', 24, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"sparxie","officialId":"1501","baseCharacterId":"sparxie","names":{"zh-CN":"火花","en":"Sparxie","ja":"火花"},"aliases":{"zh-CN":["huo hua","huohua"],"en":["sparxie"],"ja":["sparxie"]},"element":"fire","path":"elation","rarity":5,"factionId":"masked-fools","factionGroupId":"cosmic","releaseVersionId":"4.0","releaseOrder":24,"assets":{"avatarPath":"/assets/characters/sparxie-avatar-59851d4b7fcc.png","portraitPath":"/assets/characters/sparxie-avatar-59851d4b7fcc.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/162607/46ddcca9e2579e4878ef46e4231ae781_3507480203580811267.png","sourceUpdatedAt":"2026-02-06T15:22:52.000Z","sha256":"59851d4b7fccfb6939bcf4efaad8c15a4077eac3382dd22b10b5b5198ee75f99","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('yao-guang', '1502', 'yao-guang', 'physical', 'elation', 5, 'xianzhou-yuque', 'xianzhou-alliance', '4.0', 24, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"yao-guang","officialId":"1502","baseCharacterId":"yao-guang","names":{"zh-CN":"爻光","en":"Yao Guang","ja":"爻光"},"aliases":{"zh-CN":["yao guang","yaoguang"],"en":["yao guang","yaoguang"],"ja":["yao guang","yaoguang"]},"element":"physical","path":"elation","rarity":5,"factionId":"xianzhou-yuque","factionGroupId":"xianzhou-alliance","releaseVersionId":"4.0","releaseOrder":24,"assets":{"avatarPath":"/assets/characters/yao-guang-avatar-3c09d56ce7ae.png","portraitPath":"/assets/characters/yao-guang-avatar-3c09d56ce7ae.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/162605/d09846c74f92d39cfdc502b8e237a46f_6203802696928497301.png","sourceUpdatedAt":"2026-02-06T15:17:35.000Z","sha256":"3c09d56ce7ae452e74ce7d4e092375e3b4809b094c401cff7fcc39c260e9e158","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('ashveil', '1504', 'ashveil', 'lightning', 'hunt', 5, 'galaxy-rangers', 'cosmic', '4.1', 25, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"ashveil","officialId":"1504","baseCharacterId":"ashveil","names":{"zh-CN":"不死途","en":"Ashveil","ja":"不死途"},"aliases":{"zh-CN":["bu si tu","busitu"],"en":["ashveil"],"ja":["ashveil"]},"element":"lightning","path":"hunt","rarity":5,"factionId":"galaxy-rangers","factionGroupId":"cosmic","releaseVersionId":"4.1","releaseOrder":25,"assets":{"avatarPath":"/assets/characters/ashveil-avatar-796c6588d0c1.png","portraitPath":"/assets/characters/ashveil-avatar-796c6588d0c1.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/163118/3dc92660fc87730376952fbb62e48c43_9152923416788276017.png","sourceUpdatedAt":"2026-03-12T14:24:09.000Z","sha256":"796c6588d0c12c063443c80b15f7d16b59282540c4c7e6c9c4b17d4cbfe8fcdc","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('evanescia', '1505', 'evanescia', 'physical', 'elation', 5, 'planarcadia', 'planarcadia', '4.2', 26, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"evanescia","officialId":"1505","baseCharacterId":"evanescia","names":{"zh-CN":"绯英","en":"Evanescia","ja":"緋英"},"aliases":{"zh-CN":["fei ying","feiying"],"en":["evanescia"],"ja":["evanescia"]},"element":"physical","path":"elation","rarity":5,"factionId":"planarcadia","factionGroupId":"planarcadia","releaseVersionId":"4.2","releaseOrder":26,"assets":{"avatarPath":"/assets/characters/evanescia-avatar-e4446664c7bb.png","portraitPath":"/assets/characters/evanescia-avatar-e4446664c7bb.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/163485/5504bc6527fc4074d6743dab62f2be25_6605944294444025287.png","sourceUpdatedAt":"2026-04-08T18:16:22.000Z","sha256":"e4446664c7bba60c44a65c34f2a2ecf389d4d9ff4e1282fdb8d28d6e6b5e93d8","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('silver-wolf-lv-999', '1506', 'silver-wolf', 'imaginary', 'elation', 5, 'stellaron-hunters', 'stellaron-hunters', '4.2', 26, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"silver-wolf-lv-999","officialId":"1506","baseCharacterId":"silver-wolf","names":{"zh-CN":"银狼LV.999","en":"Silver Wolf LV.999","ja":"銀狼LV.999"},"aliases":{"zh-CN":["yin lang","yinlang"],"en":["silver wolf lv 999","silverwolflv999"],"ja":["silver wolf lv 999","silverwolflv999"]},"element":"imaginary","path":"elation","rarity":5,"factionId":"stellaron-hunters","factionGroupId":"stellaron-hunters","releaseVersionId":"4.2","releaseOrder":26,"assets":{"avatarPath":"/assets/characters/silver-wolf-lv-999-avatar-d86eec550297.png","portraitPath":"/assets/characters/silver-wolf-lv-999-avatar-d86eec550297.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/163484/f9ec0f43294492ae8a4834bdb5274a58_7208557037416297672.png","sourceUpdatedAt":"2026-04-08T18:16:02.000Z","sha256":"d86eec550297ddf5fc1dc5cae9d7d43e6963179c833fee31bbe909af1ae9001f","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('trailblazer-elation', '8009', 'trailblazer', 'lightning', 'elation', 5, 'astral-express', 'astral-express', '4.2', 26, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"trailblazer-elation","officialId":"8009","baseCharacterId":"trailblazer","names":{"zh-CN":"开拓者·欢愉","en":"Trailblazer · Elation","ja":"開拓者・愉悦"},"aliases":{"zh-CN":["开拓者","欢愉主角","kai tuo zhe huan yu","kaituozhehuanyu","kai tuo zhe","kaituozhe","huan yu zhu jue","huanyuzhujue"],"en":["Trailblazer","Elation Trailblazer","trailblazer elation","trailblazerelation","elationtrailblazer"],"ja":["開拓者","愉悦開拓者","trailblazer elation","trailblazerelation","kaitakusha yuetsu","kaitakushayuetsu"]},"element":"lightning","path":"elation","rarity":5,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"4.2","releaseOrder":26,"assets":{"avatarPath":"/assets/characters/trailblazer-elation-avatar-5e5432f4e42a.png","portraitPath":"/assets/characters/trailblazer-elation-avatar-5e5432f4e42a.png","sourceUrl":"https://raw.githubusercontent.com/Mar-7th/StarRailRes/b95e75c7e1273d819d20c530c0b7e13a3ef19fb4/icon/character/8009.png","sourceUpdatedAt":"2026-07-18T17:08:44.000Z","sha256":"5e5432f4e42a39993153381252360518e0ec62ef6f93b4f493122b27b3d0e6d2","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('mortenax-blade', '1507', 'blade', 'fire', 'nihility', 5, 'stellaron-hunters', 'stellaron-hunters', '4.3', 27, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"mortenax-blade","officialId":"1507","baseCharacterId":"blade","names":{"zh-CN":"千冶•刃","en":"Mortenax Blade","ja":"千冶・刃"},"aliases":{"zh-CN":["qian ye ren","qianyeren"],"en":["mortenax blade","mortenaxblade"],"ja":["mortenax blade","mortenaxblade"]},"element":"fire","path":"nihility","rarity":5,"factionId":"stellaron-hunters","factionGroupId":"stellaron-hunters","releaseVersionId":"4.3","releaseOrder":27,"assets":{"avatarPath":"/assets/characters/mortenax-blade-avatar-2e609e325d48.png","portraitPath":"/assets/characters/mortenax-blade-avatar-2e609e325d48.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/163908/3f039b805844fef13149dc64fbb8da24_8872487716010108739.png","sourceUpdatedAt":"2026-05-11T16:43:30.000Z","sha256":"2e609e325d48365db245a3e83e38cd7e34de6ac994bd545d6b547ab1657f2795","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('gilgamesh', '1509', 'gilgamesh', 'lightning', 'destruction', 5, 'fate-stay-night', 'another-world', '4.4', 28, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"gilgamesh","officialId":"1509","baseCharacterId":"gilgamesh","names":{"zh-CN":"吉尔伽美什","en":"Gilgamesh","ja":"ギルガメッシュ"},"aliases":{"zh-CN":["ji er jia mei shen","jierjiameishen"],"en":["gilgamesh"],"ja":["girugamesshu"]},"element":"lightning","path":"destruction","rarity":5,"factionId":"fate-stay-night","factionGroupId":"another-world","releaseVersionId":"4.4","releaseOrder":28,"assets":{"avatarPath":"/assets/characters/gilgamesh-avatar-0f2e8e491b3a.png","portraitPath":"/assets/characters/gilgamesh-avatar-0f2e8e491b3a.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/164608/eab97a7d20f2e622c78a8cbe2cd02792_3717636757217679747.png","sourceUpdatedAt":"2026-06-03T17:03:48.000Z","sha256":"0f2e8e491b3a8151429a8c066fdeb4c21e4bd2206d9ac26d70a46c739845b109","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('himeko-nova', '1510', 'himeko', 'fire', 'erudition', 5, 'astral-express', 'astral-express', '4.4', 28, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"himeko-nova","officialId":"1510","baseCharacterId":"himeko","names":{"zh-CN":"姬子•启行","en":"Himeko • Nova","ja":"姫子・旅立ち"},"aliases":{"zh-CN":["ji zi qi xing","jiziqixing"],"en":["himeko nova","himekonova"],"ja":["chi"]},"element":"fire","path":"erudition","rarity":5,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"4.4","releaseOrder":28,"assets":{"avatarPath":"/assets/characters/himeko-nova-avatar-21948f59b870.png","portraitPath":"/assets/characters/himeko-nova-avatar-21948f59b870.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/164773/c5b7769a158a07bd6a2b80ac2e4cfd67_5579859607159442001.png","sourceUpdatedAt":"2026-06-16T15:00:59.000Z","sha256":"21948f59b8701f0130e396698867a90bebbb77668f2a65221925b03545c1e85d","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('rin-tohsaka', '1508', 'rin-tohsaka', 'quantum', 'erudition', 5, 'fate-stay-night', 'another-world', '4.4', 28, 1, 1, 'hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb', '{"id":"rin-tohsaka","officialId":"1508","baseCharacterId":"rin-tohsaka","names":{"zh-CN":"远坂凛","en":"Rin Tohsaka","ja":"遠坂凛"},"aliases":{"zh-CN":["yuan ban lin","yuanbanlin"],"en":["rin tohsaka","rintohsaka"],"ja":["rin tohsaka","rintohsaka"]},"element":"quantum","path":"erudition","rarity":5,"factionId":"fate-stay-night","factionGroupId":"another-world","releaseVersionId":"4.4","releaseOrder":28,"assets":{"avatarPath":"/assets/characters/rin-tohsaka-avatar-f7505f0f22a6.png","portraitPath":"/assets/characters/rin-tohsaka-avatar-f7505f0f22a6.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/164607/0e8ff84f06000f23307c1aed931ea68e_4824633473356387700.png","sourceUpdatedAt":"2026-06-03T17:03:14.000Z","sha256":"f7505f0f22a6296e400d5ad5dd2a6deeeecce09df4324c64c14fdf39266cf0ad","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project."},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-1fdf879e4e94+starrailres-b95e75c7e127+overrides-98f4eb36ebfb"}', 1784394524, 1784394524)
ON CONFLICT(id) DO UPDATE SET
  official_id = excluded.official_id,
  base_character_id = excluded.base_character_id,
  element = excluded.element,
  path = excluded.path,
  rarity = excluded.rarity,
  faction_id = excluded.faction_id,
  faction_group_id = excluded.faction_group_id,
  release_version_id = excluded.release_version_id,
  release_order = excluded.release_order,
  enabled = excluded.enabled,
  target_eligible = excluded.target_eligible,
  source_revision = excluded.source_revision,
  payload_json = excluded.payload_json,
  updated_at = excluded.updated_at;

UPDATE characters
SET enabled = 0, target_eligible = 0, updated_at = 1784394524
WHERE id NOT IN ('arlan', 'asta', 'bailu', 'bronya', 'clara', 'dan-heng', 'gepard', 'herta', 'himeko', 'hook', 'jing-yuan', 'march-7th', 'natasha', 'pela', 'qingque', 'sampo', 'seele', 'serval', 'sushang', 'tingyun', 'trailblazer-destruction', 'trailblazer-preservation', 'welt', 'yanqing', 'luocha', 'silver-wolf', 'yukong', 'blade', 'kafka', 'luka', 'dan-heng-il', 'fu-xuan', 'lynx', 'guinaifen', 'jingliu', 'topaz-and-numby', 'argenti', 'hanya', 'huohuo', 'dr-ratio', 'ruan-mei', 'xueyi', 'black-swan', 'misha', 'sparkle', 'acheron', 'aventurine', 'gallagher', 'boothill', 'robin', 'trailblazer-harmony', 'firefly', 'jade', 'jiaoqiu', 'march-7th-hunt', 'yunli', 'feixiao', 'lingsha', 'moze', 'rappa', 'fugue', 'sunday', 'aglaea', 'the-herta', 'trailblazer-remembrance', 'mydei', 'tribbie', 'anaxa', 'castorice', 'cipher', 'hyacine', 'archer', 'phainon', 'saber', 'cerydra', 'hysilens', 'dan-heng-permansor-terrae', 'evernight', 'cyrene', 'the-dahlia', 'sparxie', 'yao-guang', 'ashveil', 'evanescia', 'silver-wolf-lv-999', 'trailblazer-elation', 'mortenax-blade', 'gilgamesh', 'himeko-nova', 'rin-tohsaka')
  AND (enabled <> 0 OR target_eligible <> 0);
