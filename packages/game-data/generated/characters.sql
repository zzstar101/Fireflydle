-- 由 scripts/sync-characters.ts 确定性生成；不要手工修改。
-- Cloudflare D1 的 --file import 不允许显式 BEGIN/COMMIT；每个 UPSERT 保持为独立小语句。
-- 先发布版本与阵营，再发布引用它们的角色；各表清单外历史行只软禁用、不删除。

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('1.0', 0, '2023-04-26T10:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('1.1', 1, '2023-06-07T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('1.2', 2, '2023-07-19T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('1.3', 3, '2023-08-30T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('1.4', 4, '2023-10-11T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('1.5', 5, '2023-11-15T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('1.6', 6, '2023-12-27T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('2.0', 7, '2024-02-06T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('2.1', 8, '2024-03-27T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('2.2', 9, '2024-05-08T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('2.3', 10, '2024-06-19T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('2.4', 11, '2024-07-31T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('2.5', 12, '2024-09-10T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('2.6', 13, '2024-10-23T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('2.7', 14, '2024-12-04T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.0', 15, '2025-01-15T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.1', 16, '2025-02-26T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.2', 17, '2025-04-09T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.3', 18, '2025-05-21T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.4', 19, '2025-07-02T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.5', 20, '2025-08-13T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.6', 21, '2025-09-24T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.7', 22, '2025-11-05T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('3.8', 23, '2025-12-17T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('4.0', 24, '2026-02-13T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('4.1', 25, '2026-03-25T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('4.2', 26, '2026-04-22T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('4.3', 27, '2026-06-01T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('4.4', 28, '2026-07-15T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO versions (id, sort_order, released_at, enabled, created_at, updated_at)
VALUES ('4.5', 29, '2026-08-26T07:00:00.000Z', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  sort_order = excluded.sort_order,
  released_at = excluded.released_at,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

UPDATE versions
SET enabled = 0, updated_at = 1787759020
WHERE id NOT IN ('1.0', '1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '2.0', '2.1', '2.2', '2.3', '2.4', '2.5', '2.6', '2.7', '3.0', '3.1', '3.2', '3.3', '3.4', '3.5', '3.6', '3.7', '3.8', '4.0', '4.1', '4.2', '4.3', '4.4', '4.5')
  AND enabled <> 0;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('amphoreus', 'amphoreus', '{"zh-CN":"翁法罗斯","en":"Amphoreus","ja":"オンパロス"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('another-world', 'another-world', '{"zh-CN":"异界","en":"Another World","ja":"別の世界"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('astral-express', 'astral-express', '{"zh-CN":"星穹列车","en":"The Astral Express","ja":"星穹列車"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('belobog', 'belobog', '{"zh-CN":"贝洛伯格","en":"Belobog","ja":"ベロブルグ"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('cosmic', 'cosmic', '{"zh-CN":"银河","en":"Cosmic","ja":"銀河"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('fate-stay-night', 'another-world', '{"zh-CN":"异界(Fate系列)","en":"Another World (Fate Series)","ja":"異界（Fateシリーズ）"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('galaxy-rangers', 'cosmic', '{"zh-CN":"巡海游侠","en":"Galaxy Rangers","ja":"巡海レンジャー"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('garden-of-recollection', 'cosmic', '{"zh-CN":"流光忆庭","en":"Garden of Recollection","ja":"流光の庭"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('herta-space-station', 'herta-space-station', '{"zh-CN":"空间站「黑塔」","en":"Herta Space Station","ja":"宇宙ステーション「ヘルタ」"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('intelligentsia-guild', 'cosmic', '{"zh-CN":"博识学会","en":"Intelligentsia Guild","ja":"博識学会"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('ipc', 'ipc', '{"zh-CN":"星际和平公司","en":"Interastral Peace Corporation","ja":"スターピースカンパニー"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('knights-of-beauty', 'cosmic', '{"zh-CN":"纯美骑士团","en":"Knights of Beauty","ja":"純美の騎士団"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('masked-fools', 'cosmic', '{"zh-CN":"假面愚者","en":"Masked Fools","ja":"仮面の愚者"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('penacony', 'penacony', '{"zh-CN":"匹诺康尼","en":"Penacony","ja":"ピノコニー"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('planarcadia', 'planarcadia', '{"zh-CN":"二相乐园","en":"Planarcadia","ja":"二相楽園"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('self-annihilators', 'cosmic', '{"zh-CN":"自灭者","en":"Self-Annihilators","ja":"自滅者"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('stellaron-hunters', 'stellaron-hunters', '{"zh-CN":"星核猎手","en":"Stellaron Hunters","ja":"星核ハンター"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('the-cremators', 'cosmic', '{"zh-CN":"焚化工","en":"The Cremators","ja":"焼却人"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('xianzhou-alliance', 'xianzhou-alliance', '{"zh-CN":"仙舟联盟","en":"Xianzhou Alliance","ja":"仙舟同盟"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('xianzhou-luofu', 'xianzhou-alliance', '{"zh-CN":"仙舟「罗浮」","en":"Xianzhou Luofu","ja":"仙舟「羅浮」"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('xianzhou-yaoqing', 'xianzhou-alliance', '{"zh-CN":"仙舟「曜青」","en":"Xianzhou Yaoqing","ja":"仙舟「曜青」"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('xianzhou-yuque', 'xianzhou-alliance', '{"zh-CN":"仙舟「玉阙」","en":"Xianzhou Yuque","ja":"仙舟「玉殿」"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

INSERT INTO factions (id, group_id, names_json, enabled, created_at, updated_at)
VALUES ('xianzhou-zhuming', 'xianzhou-alliance', '{"zh-CN":"仙舟「朱明」","en":"Xianzhou Zhuming","ja":"仙舟「朱明」"}', 1, 1787759020, 1787759020)
ON CONFLICT(id) DO UPDATE SET
  group_id = excluded.group_id,
  names_json = excluded.names_json,
  enabled = excluded.enabled,
  updated_at = excluded.updated_at;

UPDATE factions
SET enabled = 0, updated_at = 1787759020
WHERE id NOT IN ('amphoreus', 'another-world', 'astral-express', 'belobog', 'cosmic', 'fate-stay-night', 'galaxy-rangers', 'garden-of-recollection', 'herta-space-station', 'intelligentsia-guild', 'ipc', 'knights-of-beauty', 'masked-fools', 'penacony', 'planarcadia', 'self-annihilators', 'stellaron-hunters', 'the-cremators', 'xianzhou-alliance', 'xianzhou-luofu', 'xianzhou-yaoqing', 'xianzhou-yuque', 'xianzhou-zhuming')
  AND enabled <> 0;

INSERT INTO characters (id, official_id, base_character_id, element, path, rarity, faction_id, faction_group_id, release_version_id, release_order, enabled, target_eligible, source_revision, payload_json, created_at, updated_at)
VALUES ('arlan', '1008', 'arlan', 'lightning', 'destruction', 4, 'herta-space-station', 'herta-space-station', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"arlan","officialId":"1008","baseCharacterId":"arlan","names":{"zh-CN":"阿兰","en":"Arlan","ja":"アーラン"},"aliases":{"zh-CN":["a lan","alan"],"en":["arlan"],"ja":["aaran","aran"]},"element":"lightning","path":"destruction","rarity":4,"factionId":"herta-space-station","factionGroupId":"herta-space-station","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/arlan-avatar-e6a98c2dc505.png","portraitPath":"/assets/characters/arlan-avatar-e6a98c2dc505.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/7213a47385a0b5c05e68b564733f2b19_6873881480647261389.png","sourceUpdatedAt":"2022-04-11T18:47:49.000Z","sha256":"e6a98c2dc505ee051f130a3e6f74bf58dffa9245b06d6d037dc74ac6a60e5d09","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/arlan-avatar-e6a98c2dc505-40.avif","webpPath":"/assets/characters/arlan-avatar-e6a98c2dc505-40.webp","avifBytes":1037,"webpBytes":1124,"avifSha256":"de4e29ee5f25c18ae1115d0aef450d2c050d423b318c66a499fca4336b91b112","webpSha256":"314c5d794ee4e14ab332b862e096fd67015e2a5e0fefed5fc32073bf5c45ce48"},{"width":80,"avifPath":"/assets/characters/arlan-avatar-e6a98c2dc505-80.avif","webpPath":"/assets/characters/arlan-avatar-e6a98c2dc505-80.webp","avifBytes":2123,"webpBytes":2500,"avifSha256":"7b18fb726fa33aec03db5033cece98f8ad38f94de3880895201dd9b4d0fc3bb0","webpSha256":"ceed503fdda28fdabeeb0566aca45086d87d0974d48f68c9815cd595acb85c76"},{"width":160,"avifPath":"/assets/characters/arlan-avatar-e6a98c2dc505-160.avif","webpPath":"/assets/characters/arlan-avatar-e6a98c2dc505-160.webp","avifBytes":4946,"webpBytes":7092,"avifSha256":"af5779371efc228e8c056661695b8160c64a967d32eaee6ae0b0230b0e1405a3","webpSha256":"bc81d222e14b8899d747f03043def482ba410a0dbd73468955c2a7edc0cb794e"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('asta', '1009', 'asta', 'fire', 'harmony', 4, 'herta-space-station', 'herta-space-station', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"asta","officialId":"1009","baseCharacterId":"asta","names":{"zh-CN":"艾丝妲","en":"Asta","ja":"アスター"},"aliases":{"zh-CN":["ai si da","aisida"],"en":["asta"],"ja":["asutaa","asuta"]},"element":"fire","path":"harmony","rarity":4,"factionId":"herta-space-station","factionGroupId":"herta-space-station","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/asta-avatar-1f9e66fd19bc.png","portraitPath":"/assets/characters/asta-avatar-1f9e66fd19bc.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/99bb21e5ceb72b3f76c0a3b5148dfe08_8925972045760071235.png","sourceUpdatedAt":"2022-04-11T18:48:17.000Z","sha256":"1f9e66fd19bc20189006cb76bb53b8101bef93ba8ba1ddb0511dbdd141437dc5","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/asta-avatar-1f9e66fd19bc-40.avif","webpPath":"/assets/characters/asta-avatar-1f9e66fd19bc-40.webp","avifBytes":954,"webpBytes":958,"avifSha256":"67b804d8f3b7d6080448b5383d94df2c2b191f867d2629eeabc5bbfbcae8db91","webpSha256":"ba8c36fa0508e0548f014f7f10a68b9a4ae739f632076151e1b911a90b6511b8"},{"width":80,"avifPath":"/assets/characters/asta-avatar-1f9e66fd19bc-80.avif","webpPath":"/assets/characters/asta-avatar-1f9e66fd19bc-80.webp","avifBytes":2189,"webpBytes":2430,"avifSha256":"8f8cdf3f4dff16bdf324f5f2b2121015d5823755f1fc0bf47e9a26abe8ed23e7","webpSha256":"63f193c68498c3c5392c9e15a8f5906dbf6b4e09b5c0ab1cc93ffb45f7c78994"},{"width":160,"avifPath":"/assets/characters/asta-avatar-1f9e66fd19bc-160.avif","webpPath":"/assets/characters/asta-avatar-1f9e66fd19bc-160.webp","avifBytes":4798,"webpBytes":6712,"avifSha256":"f0ba0ed1dc7c106d46481b26807b6f17219bdccf3fd30f5970956573c936e482","webpSha256":"85b5822c48d725127569d55daf116de727682fe6407e4f5b4f48533125f726c2"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('bailu', '1211', 'bailu', 'lightning', 'abundance', 5, 'xianzhou-luofu', 'xianzhou-alliance', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"bailu","officialId":"1211","baseCharacterId":"bailu","names":{"zh-CN":"白露","en":"Bailu","ja":"白露"},"aliases":{"zh-CN":["bai lu","bailu"],"en":["bailu"],"ja":["byakuro"]},"element":"lightning","path":"abundance","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/bailu-avatar-4f8e23f000e1.png","portraitPath":"/assets/characters/bailu-avatar-4f8e23f000e1.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/09/21/1ce1708b783a06ad419257b4be29ea99_202970771385396270.png","sourceUpdatedAt":"2022-09-21T18:29:14.000Z","sha256":"4f8e23f000e131d91b7873261505795c881a9f0ee57f30d2c7d57a6c534f4c99","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/bailu-avatar-4f8e23f000e1-40.avif","webpPath":"/assets/characters/bailu-avatar-4f8e23f000e1-40.webp","avifBytes":1067,"webpBytes":1180,"avifSha256":"04af6f1311ebdc4d5d3a979625174b482f8cf5b6abc063f3f9fb7f1413d74841","webpSha256":"77f1088eb37f88d02374d4b224068a03ef9f5284c694ec20d4b62ab2904a75bf"},{"width":80,"avifPath":"/assets/characters/bailu-avatar-4f8e23f000e1-80.avif","webpPath":"/assets/characters/bailu-avatar-4f8e23f000e1-80.webp","avifBytes":2373,"webpBytes":2706,"avifSha256":"321c62727e164392d569e757ff8c4bc87dc9bf87dbb78ac3238a1fc1106805ef","webpSha256":"7c2d7b28ca64bce40253cf16f352124cc46d3a4ca67587c116646ff2ca04d7f1"},{"width":160,"avifPath":"/assets/characters/bailu-avatar-4f8e23f000e1-160.avif","webpPath":"/assets/characters/bailu-avatar-4f8e23f000e1-160.webp","avifBytes":5815,"webpBytes":7726,"avifSha256":"02a5c704ca96834d9654c9cf281df8a5f5841079335a400ae43c6de1ce93ca87","webpSha256":"1690e6df6c1e53252551cd238ffb396486c65e7dd6aadcdc9c689232468127c9"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('bronya', '1101', 'bronya', 'wind', 'harmony', 5, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"bronya","officialId":"1101","baseCharacterId":"bronya","names":{"zh-CN":"布洛妮娅","en":"Bronya","ja":"ブローニャ"},"aliases":{"zh-CN":["bu luo ni ya","buluoniya"],"en":["bronya"],"ja":["buroonya","buronya"]},"element":"wind","path":"harmony","rarity":5,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/bronya-avatar-849f365d21d2.png","portraitPath":"/assets/characters/bronya-avatar-849f365d21d2.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/c6ab1f4cd2ece504b02e16d5f7a5af44_8279603082960819796.png","sourceUpdatedAt":"2022-04-11T18:22:41.000Z","sha256":"849f365d21d22b14dbc7184f61846c1cdb6539f6ee5ab37a5b3e4f5d07d80024","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/bronya-avatar-849f365d21d2-40.avif","webpPath":"/assets/characters/bronya-avatar-849f365d21d2-40.webp","avifBytes":1014,"webpBytes":974,"avifSha256":"8ea41d4121a5c5ad66a04a425f0f047477e951ee3f14c14ae80c1df289364677","webpSha256":"aec25550172f59cacdef9d8267250bcc94ffdfdc9ca8f9ea0d1d2827a909878c"},{"width":80,"avifPath":"/assets/characters/bronya-avatar-849f365d21d2-80.avif","webpPath":"/assets/characters/bronya-avatar-849f365d21d2-80.webp","avifBytes":2343,"webpBytes":2746,"avifSha256":"0a6e1db12634ed1971bd91210f8a7cb2f956a19085b35c596d205c90d95bdfca","webpSha256":"d3968b97df60fcc7ddd11973d618a12751901d4520e9136c6042ee860633a3d0"},{"width":160,"avifPath":"/assets/characters/bronya-avatar-849f365d21d2-160.avif","webpPath":"/assets/characters/bronya-avatar-849f365d21d2-160.webp","avifBytes":5590,"webpBytes":7894,"avifSha256":"1bacc054aafae56a6444e2fd0e8a80c8159b4588402d153091f275aa5d9b7c54","webpSha256":"09dc628580fb7a447851520905cc94e3d8b97703683f5417db41690175388229"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('clara', '1107', 'clara', 'physical', 'destruction', 5, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"clara","officialId":"1107","baseCharacterId":"clara","names":{"zh-CN":"克拉拉","en":"Clara","ja":"クラーラ"},"aliases":{"zh-CN":["ke la la","kelala"],"en":["clara"],"ja":["kuraara","kurara"]},"element":"physical","path":"destruction","rarity":5,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/clara-avatar-c6dcdc1da181.png","portraitPath":"/assets/characters/clara-avatar-c6dcdc1da181.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/e4a5b2e737c5c59f7f0ddde372fa8ea2_146075503384718263.png","sourceUpdatedAt":"2022-04-11T18:47:22.000Z","sha256":"c6dcdc1da181c8508fa06460c282bffbd9962ba68535ac6b1cc6b7426b775541","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/clara-avatar-c6dcdc1da181-40.avif","webpPath":"/assets/characters/clara-avatar-c6dcdc1da181-40.webp","avifBytes":1027,"webpBytes":958,"avifSha256":"5691e76a06e0594dc627f4d271432a65ce8cd250092cf08a22bf773b60c9e0ff","webpSha256":"df9dba2045856422e5288a30592391997eaba905e0a9468ec2637b239e26f676"},{"width":80,"avifPath":"/assets/characters/clara-avatar-c6dcdc1da181-80.avif","webpPath":"/assets/characters/clara-avatar-c6dcdc1da181-80.webp","avifBytes":2222,"webpBytes":2580,"avifSha256":"a1d7033a79df132f85e59d6cf364bc3e9946e64bbc9df75e86dbd06f80dc65d9","webpSha256":"ef15d17cad857d118afddeb8411d5ad2f2557ae5f1d99a4317adc15097068a40"},{"width":160,"avifPath":"/assets/characters/clara-avatar-c6dcdc1da181-160.avif","webpPath":"/assets/characters/clara-avatar-c6dcdc1da181-160.webp","avifBytes":5393,"webpBytes":7236,"avifSha256":"ac3a9ea0d3cfdf0312b05de4063d65060c9f9be31c5845ae64710b8e514fb3f0","webpSha256":"b4a733273eb5eb499ddf465d20914280546cf5a9014f6cb33b27a821877d7b35"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('dan-heng', '1002', 'dan-heng', 'wind', 'hunt', 4, 'astral-express', 'astral-express', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"dan-heng","officialId":"1002","baseCharacterId":"dan-heng","names":{"zh-CN":"丹恒","en":"Dan Heng","ja":"丹恒"},"aliases":{"zh-CN":["dan heng","danheng"],"en":["dan heng","danheng"],"ja":["tankou"]},"element":"wind","path":"hunt","rarity":4,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/dan-heng-avatar-d99bc0050c2c.png","portraitPath":"/assets/characters/dan-heng-avatar-d99bc0050c2c.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/10/0ee824040a139252d0e2037e52ab7755_7639207854703609873.png","sourceUpdatedAt":"2022-04-10T16:57:47.000Z","sha256":"d99bc0050c2c9edb6c45bcef7ff94e807c9f93ab191a86785bb18e4a368a9739","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/dan-heng-avatar-d99bc0050c2c-40.avif","webpPath":"/assets/characters/dan-heng-avatar-d99bc0050c2c-40.webp","avifBytes":932,"webpBytes":886,"avifSha256":"dc4e84aa2b4cec54789fda553b2b92e3a917f8bd396c47686f5db4b3ddfc0398","webpSha256":"dd21ff1c534f444a4bb0d528676cb3fd4478a20e343cb53779c7060e36ce5f41"},{"width":80,"avifPath":"/assets/characters/dan-heng-avatar-d99bc0050c2c-80.avif","webpPath":"/assets/characters/dan-heng-avatar-d99bc0050c2c-80.webp","avifBytes":2011,"webpBytes":2300,"avifSha256":"902e71d78b4fc284d762509f16ba78b7c2e159b7290382b0f7df37b2ed05d87c","webpSha256":"887e74240074a1fb5c305f3bd8d9c387962005be76c62fb6ac349865cf7b0050"},{"width":160,"avifPath":"/assets/characters/dan-heng-avatar-d99bc0050c2c-160.avif","webpPath":"/assets/characters/dan-heng-avatar-d99bc0050c2c-160.webp","avifBytes":4646,"webpBytes":6194,"avifSha256":"852e41aaa7df6b02164780a912fe4a2698e211ad5e62536c5108e2cc61389f44","webpSha256":"1a63cc8fac7e38db5a50569eba0ad70f53eb0f61e024c2135d636aede25ef8e6"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('gepard', '1104', 'gepard', 'ice', 'preservation', 5, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"gepard","officialId":"1104","baseCharacterId":"gepard","names":{"zh-CN":"杰帕德","en":"Gepard","ja":"ジェパード"},"aliases":{"zh-CN":["jie pa de","jiepade"],"en":["gepard"],"ja":["jepaado","jepado"]},"element":"ice","path":"preservation","rarity":5,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/gepard-avatar-0d99b1ad9c7d.png","portraitPath":"/assets/characters/gepard-avatar-0d99b1ad9c7d.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/a511485984be482bea05136de81b3b7b_8774670648688901664.png","sourceUpdatedAt":"2022-04-11T18:12:27.000Z","sha256":"0d99b1ad9c7d5c5386778fde68a4eb627852999c773e5169add647588de10c62","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/gepard-avatar-0d99b1ad9c7d-40.avif","webpPath":"/assets/characters/gepard-avatar-0d99b1ad9c7d-40.webp","avifBytes":1064,"webpBytes":972,"avifSha256":"7f595bb2c98d5f900918828382253bb6ddaeb1cb93e946656d108ac245554e64","webpSha256":"af0e8abb91b43fd132879dc806675f5a7f0f179c22404404233f267d866bc76f"},{"width":80,"avifPath":"/assets/characters/gepard-avatar-0d99b1ad9c7d-80.avif","webpPath":"/assets/characters/gepard-avatar-0d99b1ad9c7d-80.webp","avifBytes":2311,"webpBytes":2688,"avifSha256":"5feda05066256213be4ff38ae20e0221fb04b69a9b814efe58ef6158c18b503c","webpSha256":"4bc209908fc3fab3a7e1178c59f404eb0ca9fde7a16ff66fbc92b9e30e6e0621"},{"width":160,"avifPath":"/assets/characters/gepard-avatar-0d99b1ad9c7d-160.avif","webpPath":"/assets/characters/gepard-avatar-0d99b1ad9c7d-160.webp","avifBytes":5560,"webpBytes":7600,"avifSha256":"3ebf08ad2bff3f35b4e971c4116ca4d2c9c31311a1e4989d475c90781cf26302","webpSha256":"5d1294112c72885454297dd01f84d2698ef777e1a76164c8e423152131af91b2"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('herta', '1013', 'herta', 'ice', 'erudition', 4, 'herta-space-station', 'herta-space-station', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"herta","officialId":"1013","baseCharacterId":"herta","names":{"zh-CN":"黑塔","en":"Herta","ja":"ヘルタ"},"aliases":{"zh-CN":["hei ta","heita"],"en":["herta"],"ja":["heruta"]},"element":"ice","path":"erudition","rarity":4,"factionId":"herta-space-station","factionGroupId":"herta-space-station","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/herta-avatar-fe1944cd8443.png","portraitPath":"/assets/characters/herta-avatar-fe1944cd8443.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/8f38072eccd10ce1b4df485c9d9f34d3_7138207484725960049.png","sourceUpdatedAt":"2022-04-11T18:48:48.000Z","sha256":"fe1944cd844368d7899b753d4fb1c0b777b1aa76eb7fa00fb92af3a9b3c5ce55","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/herta-avatar-fe1944cd8443-40.avif","webpPath":"/assets/characters/herta-avatar-fe1944cd8443-40.webp","avifBytes":1029,"webpBytes":1116,"avifSha256":"255f3e2cb8fc34300c57e14585f7a284bd0cd0512c127e71e176e72920c3a0c7","webpSha256":"3a14d71a6e99fe4ee154b6307e61fd0019f3d358cc2d205374e1560598b902c9"},{"width":80,"avifPath":"/assets/characters/herta-avatar-fe1944cd8443-80.avif","webpPath":"/assets/characters/herta-avatar-fe1944cd8443-80.webp","avifBytes":2184,"webpBytes":2554,"avifSha256":"d79621740d69d9dc1d7c09ff0a4f8d91ab347d169855847d32b0d08c476c3d44","webpSha256":"4444e903ac4ce563f60f0d7cc3dab79294f11f02f480fe45f0e6f739a2ccb0d8"},{"width":160,"avifPath":"/assets/characters/herta-avatar-fe1944cd8443-160.avif","webpPath":"/assets/characters/herta-avatar-fe1944cd8443-160.webp","avifBytes":5292,"webpBytes":7376,"avifSha256":"63c5e0b734c16715db2b3c5feca0483c6bacf0605dfafa1c2a20091b05b2733f","webpSha256":"842c0b8ded85b7edd230b396898e170b07944d896a7a44eca2f9a6a2d0c9c26b"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('himeko', '1003', 'himeko', 'fire', 'erudition', 5, 'astral-express', 'astral-express', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"himeko","officialId":"1003","baseCharacterId":"himeko","names":{"zh-CN":"姬子","en":"Himeko","ja":"姫子"},"aliases":{"zh-CN":["ji zi","jizi"],"en":["himeko"],"ja":["himeko"]},"element":"fire","path":"erudition","rarity":5,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/himeko-avatar-e301ca0969fd.png","portraitPath":"/assets/characters/himeko-avatar-e301ca0969fd.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/906705d02e536b45b29285f6d80c6f34_6762729813999787667.png","sourceUpdatedAt":"2022-04-11T17:14:15.000Z","sha256":"e301ca0969fde976e1640abeaa4e95dd74017fbf3957ecb74610c98fd9860cbe","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/himeko-avatar-e301ca0969fd-40.avif","webpPath":"/assets/characters/himeko-avatar-e301ca0969fd-40.webp","avifBytes":1048,"webpBytes":986,"avifSha256":"edd7f3ac03755a074d4a67a5fedf42ef38edfcf95e2d8f14fd72b4245e12e40d","webpSha256":"2b8561e6e73821e39c4c86eaab5ca72e8d654fab05a51f6e9eff5ca7c0b68113"},{"width":80,"avifPath":"/assets/characters/himeko-avatar-e301ca0969fd-80.avif","webpPath":"/assets/characters/himeko-avatar-e301ca0969fd-80.webp","avifBytes":2405,"webpBytes":2756,"avifSha256":"e0b93bfdfaf422985ead1c66471cb7cc1c34571c5caf1bbc6cc77ab76ad95085","webpSha256":"b5880a00d6e7082a4e50568e28ea16861410570a6ecbf9309a56d499869d6c6a"},{"width":160,"avifPath":"/assets/characters/himeko-avatar-e301ca0969fd-160.avif","webpPath":"/assets/characters/himeko-avatar-e301ca0969fd-160.webp","avifBytes":5952,"webpBytes":7956,"avifSha256":"20f6ee54a13f7e00df2b4301efcdc090c5de8036cac70f43965c596e7ee86492","webpSha256":"e1a312edc330fdda209443b0abaf1dd485651f80fc1aa0f134cbd3bb7e8702b8"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('hook', '1109', 'hook', 'fire', 'destruction', 4, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"hook","officialId":"1109","baseCharacterId":"hook","names":{"zh-CN":"虎克","en":"Hook","ja":"フック"},"aliases":{"zh-CN":["hu ke","huke"],"en":["hook"],"ja":["fukku"]},"element":"fire","path":"destruction","rarity":4,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/hook-avatar-62ceae5b0d48.png","portraitPath":"/assets/characters/hook-avatar-62ceae5b0d48.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/09/15/b6aeab86bea6ec7770817da70da341bc_7127072739336792149.png","sourceUpdatedAt":"2022-09-15T11:11:05.000Z","sha256":"62ceae5b0d486c291bbbe9c34c3c6adf0214504727b2ca8ca8c5e2bfb0bd0157","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/hook-avatar-62ceae5b0d48-40.avif","webpPath":"/assets/characters/hook-avatar-62ceae5b0d48-40.webp","avifBytes":1059,"webpBytes":1000,"avifSha256":"1296a9799c98602a1a4e5a2301d39080cfca236675e93961cd2b7fc18d966cf3","webpSha256":"aba796850ee6ba7464eb1ce49c3688723c95a170aad67cc4b821b45843270331"},{"width":80,"avifPath":"/assets/characters/hook-avatar-62ceae5b0d48-80.avif","webpPath":"/assets/characters/hook-avatar-62ceae5b0d48-80.webp","avifBytes":2627,"webpBytes":2948,"avifSha256":"59c7a69ec6778f4d8b20028795484abb8f5f27b4d7886994e07329e0fb741d32","webpSha256":"e9e529bf3150a6657f517b5f541888915a1f7d0ea884aacc36e35900b9b68272"},{"width":160,"avifPath":"/assets/characters/hook-avatar-62ceae5b0d48-160.avif","webpPath":"/assets/characters/hook-avatar-62ceae5b0d48-160.webp","avifBytes":6395,"webpBytes":8404,"avifSha256":"b67bf82f757fb74bd5437289892cbe087ba3d671b2f99cd0a7294f1222ae2ab3","webpSha256":"8767ee1e78abe39bbf177c2201a2a8a083c773f4736facc9228a9be3e2600d80"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('jing-yuan', '1204', 'jing-yuan', 'lightning', 'erudition', 5, 'xianzhou-luofu', 'xianzhou-alliance', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"jing-yuan","officialId":"1204","baseCharacterId":"jing-yuan","names":{"zh-CN":"景元","en":"Jing Yuan","ja":"景元"},"aliases":{"zh-CN":["jing yuan","jingyuan"],"en":["jing yuan","jingyuan"],"ja":["keigen"]},"element":"lightning","path":"erudition","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/jing-yuan-avatar-c32a3e9ca445.png","portraitPath":"/assets/characters/jing-yuan-avatar-c32a3e9ca445.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/09/20/ccb4b3e5d44ab5c35510bd5fce11fbf2_8339230249921865099.png","sourceUpdatedAt":"2022-09-20T14:10:19.000Z","sha256":"c32a3e9ca445d33b15959b21521e8411528455bc80225f8c185234ae9e0045e4","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/jing-yuan-avatar-c32a3e9ca445-40.avif","webpPath":"/assets/characters/jing-yuan-avatar-c32a3e9ca445-40.webp","avifBytes":1070,"webpBytes":1214,"avifSha256":"46a6684790e79cb7686152b300ef7d2fe4d8961167bdfa9dc5c37f77830d132a","webpSha256":"1082199621c2ede20b3c6c908ad6391b2d7fa19ee4681bd535a8fa510f93cf21"},{"width":80,"avifPath":"/assets/characters/jing-yuan-avatar-c32a3e9ca445-80.avif","webpPath":"/assets/characters/jing-yuan-avatar-c32a3e9ca445-80.webp","avifBytes":2456,"webpBytes":2832,"avifSha256":"6cfc84d778ee94960e4e5cb2c7ba1aa5e2e47590cf488860891daffb11040e1e","webpSha256":"26fd1d90d8158d3c083c096c8b324a3f110a8069173718c4216e8bf38ca5701b"},{"width":160,"avifPath":"/assets/characters/jing-yuan-avatar-c32a3e9ca445-160.avif","webpPath":"/assets/characters/jing-yuan-avatar-c32a3e9ca445-160.webp","avifBytes":6211,"webpBytes":8584,"avifSha256":"f0d31f4f8ee88a22a4582ceba90312ddaef747a5f63f3fea814451b616c4d53a","webpSha256":"e3d45688295d70064961d93714221238576c01607f887d8a3320220a686f4d70"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('march-7th', '1001', 'march-7th', 'ice', 'preservation', 4, 'astral-express', 'astral-express', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"march-7th","officialId":"1001","baseCharacterId":"march-7th","names":{"zh-CN":"三月七","en":"March 7th","ja":"三月なのか"},"aliases":{"zh-CN":["三月","san yue qi","sanyueqi","san yue","sanyue"],"en":["March","M7","march 7th","march7th"],"ja":["なのか","mitsukinanoka","nanoka","mitsuki nanoka"]},"element":"ice","path":"preservation","rarity":4,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/march-7th-avatar-9d4e246bc19e.png","portraitPath":"/assets/characters/march-7th-avatar-9d4e246bc19e.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/01/20/ebf0f79b50bb0b1668fe9f801fcde898_6619280582358456926.png","sourceUpdatedAt":"2022-04-11T14:34:48.000Z","sha256":"9d4e246bc19e99dd5eb0dd534562c1f26e6588b97740db25a42280140e071e95","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/march-7th-avatar-9d4e246bc19e-40.avif","webpPath":"/assets/characters/march-7th-avatar-9d4e246bc19e-40.webp","avifBytes":1090,"webpBytes":1222,"avifSha256":"cf5f7a762eb9a4f4781cc04358c87862ba812ea542d10709a87aff7cd78af32a","webpSha256":"22ef4b816e768631f64f46d524ff69111dacf9682a6f37c86c99d0be4cbac58b"},{"width":80,"avifPath":"/assets/characters/march-7th-avatar-9d4e246bc19e-80.avif","webpPath":"/assets/characters/march-7th-avatar-9d4e246bc19e-80.webp","avifBytes":2490,"webpBytes":2866,"avifSha256":"10e32abed722b57ad5bbd76e9294960973dc148f9490da91ae77edddba4e6f2a","webpSha256":"42dcf05fbfff9a3c075a2910dce46edc3045fd6df4b5a54ba610354316c2c99e"},{"width":160,"avifPath":"/assets/characters/march-7th-avatar-9d4e246bc19e-160.avif","webpPath":"/assets/characters/march-7th-avatar-9d4e246bc19e-160.webp","avifBytes":6006,"webpBytes":8062,"avifSha256":"61139b8d29cadc01f0194451aad2c6fb5c1fb6b6c1d5ff226c8408180cb0027b","webpSha256":"3866c82141287e1b976f0e31552aa9436cafa896a399746e2f84961a01129d7c"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('natasha', '1105', 'natasha', 'physical', 'abundance', 4, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"natasha","officialId":"1105","baseCharacterId":"natasha","names":{"zh-CN":"娜塔莎","en":"Natasha","ja":"ナターシャ"},"aliases":{"zh-CN":["na ta sha","natasha"],"en":["natasha"],"ja":["nataasha","natasha"]},"element":"physical","path":"abundance","rarity":4,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/natasha-avatar-332835502261.png","portraitPath":"/assets/characters/natasha-avatar-332835502261.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/e9691b64bd3a0449d12265a659d5b301_2800750704985905201.png","sourceUpdatedAt":"2022-04-11T18:37:16.000Z","sha256":"332835502261c8218fc199b4520dc6079afde32fedf7ec81086ebd783f46d9b7","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/natasha-avatar-332835502261-40.avif","webpPath":"/assets/characters/natasha-avatar-332835502261-40.webp","avifBytes":991,"webpBytes":920,"avifSha256":"05b920b9c30f19eeb26b3839bd58b5073ea028f85fe26e29654485e87b176b05","webpSha256":"8f61cce6cb07cf4ba363c084fc8084984a6da5ab239ddeab4fd748fa709fe4a1"},{"width":80,"avifPath":"/assets/characters/natasha-avatar-332835502261-80.avif","webpPath":"/assets/characters/natasha-avatar-332835502261-80.webp","avifBytes":2172,"webpBytes":2562,"avifSha256":"242e3238c05ef5b50fe982fbb305257c137b7ae019206ad4d87ed5ecedd89fc5","webpSha256":"73a7ab472a99773394a5cd9d81f4d9c48e6109ea95a6499c732714a99ab9fc09"},{"width":160,"avifPath":"/assets/characters/natasha-avatar-332835502261-160.avif","webpPath":"/assets/characters/natasha-avatar-332835502261-160.webp","avifBytes":5360,"webpBytes":7270,"avifSha256":"30cfc0722caa087ad2e551f74224041f36fe14562ec42c90df718669eb74b7a5","webpSha256":"1f71dee033fea837d12a0fac4afee590d27b1ac3cf8a3557b51a16e322f127df"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('pela', '1106', 'pela', 'ice', 'nihility', 4, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"pela","officialId":"1106","baseCharacterId":"pela","names":{"zh-CN":"佩拉","en":"Pela","ja":"ペラ"},"aliases":{"zh-CN":["pei la","peila"],"en":["pela"],"ja":["pera"]},"element":"ice","path":"nihility","rarity":4,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/pela-avatar-4edf90ea2af8.png","portraitPath":"/assets/characters/pela-avatar-4edf90ea2af8.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/01/20/8eb8fe9b661c44c15018e750e94678ba_7455952861324727421.png","sourceUpdatedAt":"2022-04-11T18:35:44.000Z","sha256":"4edf90ea2af8ad26e56c4d0287a8b8a40f781a2b508ca9e86adec52ec4a6a12b","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/pela-avatar-4edf90ea2af8-40.avif","webpPath":"/assets/characters/pela-avatar-4edf90ea2af8-40.webp","avifBytes":1082,"webpBytes":1166,"avifSha256":"33fe9a42eff1e571f1ba2cb5fa017740b9d8aa53db259ff41fb9d87c48291e30","webpSha256":"78c22e9db2e74cb072a84259b3b6fff4d55577844a8eda0ad3401e2921d14789"},{"width":80,"avifPath":"/assets/characters/pela-avatar-4edf90ea2af8-80.avif","webpPath":"/assets/characters/pela-avatar-4edf90ea2af8-80.webp","avifBytes":2308,"webpBytes":2660,"avifSha256":"8d380cd3c070e5bf19a86dcb6c0db61cf13b638919558a605c028c96fb58c24d","webpSha256":"b03a6f5f6f6a093a85634b5957c4470e374b12b7905ba2c3b877f8e641fbe3b1"},{"width":160,"avifPath":"/assets/characters/pela-avatar-4edf90ea2af8-160.avif","webpPath":"/assets/characters/pela-avatar-4edf90ea2af8-160.webp","avifBytes":5618,"webpBytes":7594,"avifSha256":"468e4b74cfa65864ad422e695323eb37d1e2686a59d3ff7fdb6a41cc02236069","webpSha256":"90214974817d860f9620f4425562a46896b4d6b77ec3a39e93190084da4b672c"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('qingque', '1201', 'qingque', 'quantum', 'erudition', 4, 'xianzhou-luofu', 'xianzhou-alliance', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"qingque","officialId":"1201","baseCharacterId":"qingque","names":{"zh-CN":"青雀","en":"Qingque","ja":"青雀"},"aliases":{"zh-CN":["qing que","qingque"],"en":["qingque"],"ja":["seijaku"]},"element":"quantum","path":"erudition","rarity":4,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/qingque-avatar-fe0137247376.png","portraitPath":"/assets/characters/qingque-avatar-fe0137247376.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/09/22/2ce85064a040397a94b9633ba9ffc08b_4345980989372534083.png","sourceUpdatedAt":"2022-09-22T16:36:48.000Z","sha256":"fe013724737673f32f89e552345841b9a9bdf0828a2ebdbd65b0fc52390e518b","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/qingque-avatar-fe0137247376-40.avif","webpPath":"/assets/characters/qingque-avatar-fe0137247376-40.webp","avifBytes":1030,"webpBytes":1120,"avifSha256":"2c0bd022220ce4be93a51b42cd2db775fee325d4abcb60b84ee80dc52b32db64","webpSha256":"4d34223d51be60a3b98ee1440fa202eb2a7532d2b2fc58bde59e1979b45ea5b5"},{"width":80,"avifPath":"/assets/characters/qingque-avatar-fe0137247376-80.avif","webpPath":"/assets/characters/qingque-avatar-fe0137247376-80.webp","avifBytes":2105,"webpBytes":2474,"avifSha256":"6e795eb7a53668147312bcc4b2fbfc47bc00bbede5f0d1bcc5cf66d91417b457","webpSha256":"7e03c4d749c733af524a7656f7a7037249a91bc7570fd94dc1a23ef8916d222f"},{"width":160,"avifPath":"/assets/characters/qingque-avatar-fe0137247376-160.avif","webpPath":"/assets/characters/qingque-avatar-fe0137247376-160.webp","avifBytes":4655,"webpBytes":6756,"avifSha256":"580fa482fa960cb039c90622900e25ef04c4f37c71eaac087c0d2e428a44a955","webpSha256":"896418a3b8ff73768e336961726857d68fe85e3d56bf3534b9daf48c8a5f4567"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('sampo', '1108', 'sampo', 'wind', 'nihility', 4, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"sampo","officialId":"1108","baseCharacterId":"sampo","names":{"zh-CN":"桑博","en":"Sampo","ja":"サンポ"},"aliases":{"zh-CN":["sang bo","sangbo"],"en":["sampo"],"ja":["sanpo"]},"element":"wind","path":"nihility","rarity":4,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/sampo-avatar-c86d956e648f.png","portraitPath":"/assets/characters/sampo-avatar-c86d956e648f.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/8bec1b8404758c78c799ae109e97ba68_9077892686689126095.png","sourceUpdatedAt":"2022-04-11T17:45:30.000Z","sha256":"c86d956e648f2f65c837cb21474f2e5514c2d9434ec88aaf22d38a7bca837564","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/sampo-avatar-c86d956e648f-40.avif","webpPath":"/assets/characters/sampo-avatar-c86d956e648f-40.webp","avifBytes":1006,"webpBytes":942,"avifSha256":"229e7cde2d2188a5965fada20905720cc983d2e85baa3b5a73bb03bba1cd3df6","webpSha256":"648e00948f83e0d8cce37df7f18a41ba75053bd62d7caf3b96e32774c54273c4"},{"width":80,"avifPath":"/assets/characters/sampo-avatar-c86d956e648f-80.avif","webpPath":"/assets/characters/sampo-avatar-c86d956e648f-80.webp","avifBytes":2244,"webpBytes":2628,"avifSha256":"8e60dee006018d29e3c04e4bfbb048bb43f44b49c65ad27a9657a3e335470529","webpSha256":"f994710efd2e4e5a96b29f3657445d08d02477d8670a432e1ca3c52f5e09c4ea"},{"width":160,"avifPath":"/assets/characters/sampo-avatar-c86d956e648f-160.avif","webpPath":"/assets/characters/sampo-avatar-c86d956e648f-160.webp","avifBytes":5374,"webpBytes":7244,"avifSha256":"f9a1dff6df51f63e37f2a39124e556b2a97ea163ad02d7f942e086d6f6161cbb","webpSha256":"71e2892a3b671216b1d6887b963f4b347e7388c9bc5b688a28a71ec336732ce7"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('seele', '1102', 'seele', 'quantum', 'hunt', 5, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"seele","officialId":"1102","baseCharacterId":"seele","names":{"zh-CN":"希儿","en":"Seele","ja":"ゼーレ"},"aliases":{"zh-CN":["xi er","xier"],"en":["seele"],"ja":["zeere","zere"]},"element":"quantum","path":"hunt","rarity":5,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/seele-avatar-878809ffa01c.png","portraitPath":"/assets/characters/seele-avatar-878809ffa01c.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/41b2379465748b66c324949833871a37_3791760123368611675.png","sourceUpdatedAt":"2022-04-11T18:46:21.000Z","sha256":"878809ffa01c1b77b2796fd03e7083694a645d993dca1ce48464cddfae098e3b","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/seele-avatar-878809ffa01c-40.avif","webpPath":"/assets/characters/seele-avatar-878809ffa01c-40.webp","avifBytes":1023,"webpBytes":966,"avifSha256":"23c10afc135eab207d49230a69ed68d0ca3a6b59d4a5f0e25a77ef67ea93f890","webpSha256":"66c87516525faaceb27a348ba09258d452fe794329d54803185787453e3a0d67"},{"width":80,"avifPath":"/assets/characters/seele-avatar-878809ffa01c-80.avif","webpPath":"/assets/characters/seele-avatar-878809ffa01c-80.webp","avifBytes":2261,"webpBytes":2642,"avifSha256":"60845a275cf0b84e0a1cce50556b70e46e6118eee8b095666dc6fc12d410cea0","webpSha256":"84346a6ad9f599ef8a48874b0d177bab9d5cbd8fe4718078c63866d8e2d6c228"},{"width":160,"avifPath":"/assets/characters/seele-avatar-878809ffa01c-160.avif","webpPath":"/assets/characters/seele-avatar-878809ffa01c-160.webp","avifBytes":5494,"webpBytes":7320,"avifSha256":"fdb8f2758def6bbabc14dbdba3ea3a09f0373c1cd0f776445841429069fcd082","webpSha256":"29e186449f394e94dcbd6dd40add5d5cf8aeb142164fe84b5a4d4254dc809f3c"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('serval', '1103', 'serval', 'lightning', 'erudition', 4, 'belobog', 'belobog', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"serval","officialId":"1103","baseCharacterId":"serval","names":{"zh-CN":"希露瓦","en":"Serval","ja":"セーバル"},"aliases":{"zh-CN":["xi lu wa","xiluwa"],"en":["serval"],"ja":["seebaru","sebaru"]},"element":"lightning","path":"erudition","rarity":4,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/serval-avatar-d6a71fcbf9ed.png","portraitPath":"/assets/characters/serval-avatar-d6a71fcbf9ed.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/2c3c7f171f5ef5d8d210286b317baffc_6729124396776018550.png","sourceUpdatedAt":"2022-04-11T18:36:10.000Z","sha256":"d6a71fcbf9ed05df94f4a3b6fa373d31d097bc26102ac262b05c4b980837324e","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/serval-avatar-d6a71fcbf9ed-40.avif","webpPath":"/assets/characters/serval-avatar-d6a71fcbf9ed-40.webp","avifBytes":1007,"webpBytes":984,"avifSha256":"c59ecb3fb70ff290fd0377708d242dbd77e955d5ee4dad9a0e90a707fb42c9bb","webpSha256":"22d411a9cfdf8dc09e617f48a863d0dc950c89b0a29682f13d9323a734664380"},{"width":80,"avifPath":"/assets/characters/serval-avatar-d6a71fcbf9ed-80.avif","webpPath":"/assets/characters/serval-avatar-d6a71fcbf9ed-80.webp","avifBytes":2313,"webpBytes":2660,"avifSha256":"4bc5bd3d66f79d0a1d23c1255b8826c378a4bced8cd4025e1bfcfa422338b706","webpSha256":"9e7113ba5b7c9d3bea18830f7326bd685bf95df7fef989f3a4185097cdd70093"},{"width":160,"avifPath":"/assets/characters/serval-avatar-d6a71fcbf9ed-160.avif","webpPath":"/assets/characters/serval-avatar-d6a71fcbf9ed-160.webp","avifBytes":5441,"webpBytes":7546,"avifSha256":"1e6049fea86eb7876c950278d793461800e0e46eb1268ffc85290d6c4e5e8284","webpSha256":"cf65fd9bd8129c9b7137bdb0bcc08ad2420f635cb622c1efd3ef34768e70f29c"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('sushang', '1206', 'sushang', 'physical', 'hunt', 4, 'xianzhou-luofu', 'xianzhou-alliance', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"sushang","officialId":"1206","baseCharacterId":"sushang","names":{"zh-CN":"素裳","en":"Sushang","ja":"素裳"},"aliases":{"zh-CN":["su shang","sushang"],"en":["sushang"],"ja":["sushou"]},"element":"physical","path":"hunt","rarity":4,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/sushang-avatar-171bf00dcaef.png","portraitPath":"/assets/characters/sushang-avatar-171bf00dcaef.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/09/21/56757405fd0bb121c4aa4dddb000d9c0_2139642753198143676.png","sourceUpdatedAt":"2022-09-22T16:35:54.000Z","sha256":"171bf00dcaefbd280e957a5e2d8d4920721ef63a21a024b4d30652baf8bc7eb1","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/sushang-avatar-171bf00dcaef-40.avif","webpPath":"/assets/characters/sushang-avatar-171bf00dcaef-40.webp","avifBytes":1090,"webpBytes":1186,"avifSha256":"8c1e0b69755330d254638b5401ccc7e49c17c2902c913acd83047588a81af052","webpSha256":"95b2fc4244d229aff1db66cbbc53f66a8db1285d71af4e60a819ba40c801dda9"},{"width":80,"avifPath":"/assets/characters/sushang-avatar-171bf00dcaef-80.avif","webpPath":"/assets/characters/sushang-avatar-171bf00dcaef-80.webp","avifBytes":2435,"webpBytes":2804,"avifSha256":"4db947d618501e6e0beaf17ce7860c97ae224910e48f84e1522e5d1bac580c33","webpSha256":"931067c85aa8c473d7b4f19fa4598d8f8e11f3cfb872d94640040fbd6f44a5a2"},{"width":160,"avifPath":"/assets/characters/sushang-avatar-171bf00dcaef-160.avif","webpPath":"/assets/characters/sushang-avatar-171bf00dcaef-160.webp","avifBytes":5840,"webpBytes":8252,"avifSha256":"2ba06e721391fec061d3b1cc27da5ff03d19dff077f49ee1919e10cd11a81b57","webpSha256":"e79143466b5637baece4a2d3457cca670cede07c0f103b43a5729018f7a8627d"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('tingyun', '1202', 'tingyun', 'lightning', 'harmony', 4, 'xianzhou-luofu', 'xianzhou-alliance', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"tingyun","officialId":"1202","baseCharacterId":"tingyun","names":{"zh-CN":"停云","en":"Tingyun","ja":"停雲"},"aliases":{"zh-CN":["ting yun","tingyun"],"en":["tingyun"],"ja":["teiun"]},"element":"lightning","path":"harmony","rarity":4,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/tingyun-avatar-11cf39c039a2.png","portraitPath":"/assets/characters/tingyun-avatar-11cf39c039a2.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/09/21/5a5179d65cfb06d1d015c87799e2e740_8514351923560523609.png","sourceUpdatedAt":"2022-09-21T18:31:41.000Z","sha256":"11cf39c039a21250c4d009f0d8adb1e7674cd2dc3acb466a462a0b0570b4bbe2","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/tingyun-avatar-11cf39c039a2-40.avif","webpPath":"/assets/characters/tingyun-avatar-11cf39c039a2-40.webp","avifBytes":1107,"webpBytes":1200,"avifSha256":"2f9fdbf0acda382f672d1f737915428ea438fb4d3215eeeec4a9d300a5977bc8","webpSha256":"ef88ccc72b58c2c97d325af752cb9401de48152c188ee6f06887a225e1162f63"},{"width":80,"avifPath":"/assets/characters/tingyun-avatar-11cf39c039a2-80.avif","webpPath":"/assets/characters/tingyun-avatar-11cf39c039a2-80.webp","avifBytes":2311,"webpBytes":2722,"avifSha256":"6e265adce442e8021890989039ab4cdb6f614524a7e3b08be04084515a5263d7","webpSha256":"98acd9a47be0abc70a138c5abbc57fae7b94770a8fa5c3a17e1d9488a453ca70"},{"width":160,"avifPath":"/assets/characters/tingyun-avatar-11cf39c039a2-160.avif","webpPath":"/assets/characters/tingyun-avatar-11cf39c039a2-160.webp","avifBytes":5518,"webpBytes":7486,"avifSha256":"5d1ab584559460c495286eff4ba20c214a917c144c0093dc6c5ebe7b2fc5a231","webpSha256":"3f850d3da212d250c2a4f13113b177ad8b6999652ecc81869089f1926c232ea1"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('trailblazer-destruction', '8001', 'trailblazer', 'physical', 'destruction', 5, 'astral-express', 'astral-express', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"trailblazer-destruction","officialId":"8001","baseCharacterId":"trailblazer","names":{"zh-CN":"开拓者·毁灭","en":"Trailblazer · Destruction","ja":"開拓者・壊滅"},"aliases":{"zh-CN":["开拓者","物理主角","kai tuo zhe hui mie","kaituozhehuimie","kai tuo zhe","kaituozhe","wu li zhu jue","wulizhujue"],"en":["Trailblazer","Physical Trailblazer","trailblazer destruction","trailblazerdestruction","physicaltrailblazer"],"ja":["開拓者","物理開拓者","trailblazer destruction","trailblazerdestruction","kaitakusha kaimetsu","kaitakushakaimetsu"]},"element":"physical","path":"destruction","rarity":5,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/trailblazer-destruction-avatar-e8ee5e05c9c1.png","portraitPath":"/assets/characters/trailblazer-destruction-avatar-e8ee5e05c9c1.png","sourceUrl":"https://raw.githubusercontent.com/Mar-7th/StarRailRes/f1b643637554019f6d611ac9240410bbe9698da8/icon/character/8001.png","sourceUpdatedAt":"2026-08-26T15:43:40.000Z","sha256":"e8ee5e05c9c12239e7260f3b2949c2d1e76d1985c1515bf16b889fc550d5f0de","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/trailblazer-destruction-avatar-e8ee5e05c9c1-40.avif","webpPath":"/assets/characters/trailblazer-destruction-avatar-e8ee5e05c9c1-40.webp","avifBytes":1221,"webpBytes":1464,"avifSha256":"6e634ad4d83e0f332a04fc9056d2272504a91a5b8484d1b4d4acd494e162c4db","webpSha256":"ab91abda7b3a72b1785908d9dffc70dd371a24c51d0c1b2e443eb514f2533328"},{"width":80,"avifPath":"/assets/characters/trailblazer-destruction-avatar-e8ee5e05c9c1-80.avif","webpPath":"/assets/characters/trailblazer-destruction-avatar-e8ee5e05c9c1-80.webp","avifBytes":2785,"webpBytes":3894,"avifSha256":"e799f9a69c618427f008249a01226a767c7069c1bfb151e136a6075c6e4cba0d","webpSha256":"8c06e409dbff3d7fbc4e375fb574747d59cc44c4df6a9212f8a94992730d182d"},{"width":160,"avifPath":"/assets/characters/trailblazer-destruction-avatar-e8ee5e05c9c1-160.avif","webpPath":"/assets/characters/trailblazer-destruction-avatar-e8ee5e05c9c1-160.webp","avifBytes":6501,"webpBytes":10336,"avifSha256":"e2dc88c312ba5fc572cba241b4ffff22a261745fdaa7bba6ec6db3101fcc6da4","webpSha256":"8c33e7ea0bbc620584518b969fc125cd4678054c92207712c14c21e69c335ae5"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('trailblazer-preservation', '8003', 'trailblazer', 'fire', 'preservation', 5, 'astral-express', 'astral-express', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"trailblazer-preservation","officialId":"8003","baseCharacterId":"trailblazer","names":{"zh-CN":"开拓者·存护","en":"Trailblazer · Preservation","ja":"開拓者・存護"},"aliases":{"zh-CN":["开拓者","火主","存护主角","kai tuo zhe cun hu","kaituozhecunhu","kai tuo zhe","kaituozhe","huo zhu","huozhu","cun hu zhu jue","cunhuzhujue"],"en":["Trailblazer","Fire Trailblazer","trailblazer preservation","trailblazerpreservation","firetrailblazer"],"ja":["開拓者","炎開拓者","trailblazer preservation","trailblazerpreservation","kaitakusha songo","kaitakushasongo"]},"element":"fire","path":"preservation","rarity":5,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/trailblazer-preservation-avatar-d52e840e15c3.png","portraitPath":"/assets/characters/trailblazer-preservation-avatar-d52e840e15c3.png","sourceUrl":"https://raw.githubusercontent.com/Mar-7th/StarRailRes/f1b643637554019f6d611ac9240410bbe9698da8/icon/character/8003.png","sourceUpdatedAt":"2026-08-26T15:43:40.000Z","sha256":"d52e840e15c3605f71c6c5acb22beace03edef00d1a3cf71229a0e23a4491422","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/trailblazer-preservation-avatar-d52e840e15c3-40.avif","webpPath":"/assets/characters/trailblazer-preservation-avatar-d52e840e15c3-40.webp","avifBytes":1157,"webpBytes":1406,"avifSha256":"cf81178f546de9cc7f36c300155d18f61ab04bdae43679e0f084477294a7a3fe","webpSha256":"2dec673d6d7607c844fbdf003aada1a9cf0caf5084da0048e5ed06d654145220"},{"width":80,"avifPath":"/assets/characters/trailblazer-preservation-avatar-d52e840e15c3-80.avif","webpPath":"/assets/characters/trailblazer-preservation-avatar-d52e840e15c3-80.webp","avifBytes":2480,"webpBytes":3372,"avifSha256":"cf3a2e117d84c0e3d6fe12846c54ccc93c6ca54c4c9588e21d24498dec955194","webpSha256":"b310ec8d84a78c6210824a28275c07d2eea75abdca1009bc83fdee917fe2d6ad"},{"width":160,"avifPath":"/assets/characters/trailblazer-preservation-avatar-d52e840e15c3-160.avif","webpPath":"/assets/characters/trailblazer-preservation-avatar-d52e840e15c3-160.webp","avifBytes":5499,"webpBytes":7896,"avifSha256":"efcc3ad6da385fb7a6652a1fb0e81079dfa3dd14301194b24b03ca51d7224bbe","webpSha256":"36b1c6edca7ddf9b9d73483c9e81c00c04fb00f3673e2a531f9f2f6ae719e8b9"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('welt', '1004', 'welt', 'imaginary', 'nihility', 5, 'astral-express', 'astral-express', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"welt","officialId":"1004","baseCharacterId":"welt","names":{"zh-CN":"瓦尔特","en":"Welt","ja":"ヴェルト"},"aliases":{"zh-CN":["wa er te","waerte"],"en":["welt"],"ja":["vyeruto"]},"element":"imaginary","path":"nihility","rarity":5,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/welt-avatar-b5fce1546a68.png","portraitPath":"/assets/characters/welt-avatar-b5fce1546a68.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/bd5a57d0d35792277c457a067fc72492_8449768500674894029.png","sourceUpdatedAt":"2022-04-11T17:32:39.000Z","sha256":"b5fce1546a68488f7d563594a6cc6f6edb8b4926eac38bc2d0afd1b868270a86","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/welt-avatar-b5fce1546a68-40.avif","webpPath":"/assets/characters/welt-avatar-b5fce1546a68-40.webp","avifBytes":984,"webpBytes":940,"avifSha256":"b1146f98650927345bd3ce92b5a103a9d70185c3a323d144d737f42ac555b5c5","webpSha256":"28a8605c11b36882375f326b2d3792490c12102ff776602c056fe2e4bfde0538"},{"width":80,"avifPath":"/assets/characters/welt-avatar-b5fce1546a68-80.avif","webpPath":"/assets/characters/welt-avatar-b5fce1546a68-80.webp","avifBytes":2116,"webpBytes":2460,"avifSha256":"c4bf3e487c76e22fa108ea1985287c7a53eb964f724a591bdfe444db11af89ca","webpSha256":"cd30ad26ffdcc3519c7a1966b956b54aa858fece9199244993c545d54e941830"},{"width":160,"avifPath":"/assets/characters/welt-avatar-b5fce1546a68-160.avif","webpPath":"/assets/characters/welt-avatar-b5fce1546a68-160.webp","avifBytes":4807,"webpBytes":6682,"avifSha256":"35c30315768547f606c8b96f430b094888e53517a337da3767ff7adc71c1b8d4","webpSha256":"0b4588d3ce7263fe9a9425dc491b4e8b6cafea663d09c644e1dfbf7f3737487f"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('yanqing', '1209', 'yanqing', 'ice', 'hunt', 5, 'xianzhou-luofu', 'xianzhou-alliance', '1.0', 0, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"yanqing","officialId":"1209","baseCharacterId":"yanqing","names":{"zh-CN":"彦卿","en":"Yanqing","ja":"彦卿"},"aliases":{"zh-CN":["yan qing","yanqing"],"en":["yanqing"],"ja":["genkyou"]},"element":"ice","path":"hunt","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.0","releaseOrder":0,"assets":{"avatarPath":"/assets/characters/yanqing-avatar-48a950b171f5.png","portraitPath":"/assets/characters/yanqing-avatar-48a950b171f5.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/09/21/34a4acaaf047598b582f86cfcf0a6893_8415297720164363304.png","sourceUpdatedAt":"2022-09-21T17:37:47.000Z","sha256":"48a950b171f54a9bd5917dfe6b377d4dfa9e065d7966dc9af6dbaa48cc970be3","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/yanqing-avatar-48a950b171f5-40.avif","webpPath":"/assets/characters/yanqing-avatar-48a950b171f5-40.webp","avifBytes":1114,"webpBytes":1208,"avifSha256":"efad2db20d2a0c52fc265eea3ff918f0765f42b0e231ed3fe24c3f0ec54957fd","webpSha256":"78462eebcc1227932de1451cc364ced9d767849162ff832bd6cc698aacd41b98"},{"width":80,"avifPath":"/assets/characters/yanqing-avatar-48a950b171f5-80.avif","webpPath":"/assets/characters/yanqing-avatar-48a950b171f5-80.webp","avifBytes":2438,"webpBytes":2768,"avifSha256":"949244d0ddfd8a6f780069dd80830784855ad2b1a913539de992de81d27e6861","webpSha256":"4b4420d7b97eb634bc60554d47c38b45379a18207cbc17e3e1990dfb8642b9e7"},{"width":160,"avifPath":"/assets/characters/yanqing-avatar-48a950b171f5-160.avif","webpPath":"/assets/characters/yanqing-avatar-48a950b171f5-160.webp","avifBytes":5626,"webpBytes":7806,"avifSha256":"cede6ff4cdc909e16b3f36310a77fc573a4ec4b8202df636860fa95efe5d9a2f","webpSha256":"b1762e78a1acb86d957761f88cd99eec14786b63fb902d083fd5e33ca5d959e4"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('luocha', '1203', 'luocha', 'imaginary', 'abundance', 5, 'xianzhou-luofu', 'xianzhou-alliance', '1.1', 1, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"luocha","officialId":"1203","baseCharacterId":"luocha","names":{"zh-CN":"罗刹","en":"Luocha","ja":"羅刹"},"aliases":{"zh-CN":["luo cha","luocha"],"en":["luocha"],"ja":["rasetsu"]},"element":"imaginary","path":"abundance","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.1","releaseOrder":1,"assets":{"avatarPath":"/assets/characters/luocha-avatar-30c268081c6e.png","portraitPath":"/assets/characters/luocha-avatar-30c268081c6e.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/07/18/0df33e59f26280cb1f79227f9660a174_249196615581888334.png","sourceUpdatedAt":"2023-06-07T16:29:17.000Z","sha256":"30c268081c6e22e8781c630019051433b29cfc041f2a068f55e2bc242ef7ae33","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/luocha-avatar-30c268081c6e-40.avif","webpPath":"/assets/characters/luocha-avatar-30c268081c6e-40.webp","avifBytes":978,"webpBytes":1002,"avifSha256":"f28e1518c712fba94a2fbaa6d2b77f390499a9d7041a5b05dce5a3302ad05abc","webpSha256":"35e3cc68bc4769d4ba24fa6d1f9b182a2b0cbb4ab7170f6785e76e93e9265258"},{"width":80,"avifPath":"/assets/characters/luocha-avatar-30c268081c6e-80.avif","webpPath":"/assets/characters/luocha-avatar-30c268081c6e-80.webp","avifBytes":2260,"webpBytes":2666,"avifSha256":"0a32eac24a466f9bb9e42c4867315505cb1b1cbfaac6bdd08a01289b1990d172","webpSha256":"6728fe48e79d8e6b9d7cde823acbae6c6518623d22e1c77393f9848e94911d57"},{"width":160,"avifPath":"/assets/characters/luocha-avatar-30c268081c6e-160.avif","webpPath":"/assets/characters/luocha-avatar-30c268081c6e-160.webp","avifBytes":5363,"webpBytes":7654,"avifSha256":"3a4372739fad77f3f12e80c5d33bdd40aec256ef5df5c436fa3b1c5505c46eac","webpSha256":"4b44c5d5f495a65e0cba2202633e167bd22bf35657f6ca64c5948834c5112b1d"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('silver-wolf', '1006', 'silver-wolf', 'quantum', 'nihility', 5, 'stellaron-hunters', 'stellaron-hunters', '1.1', 1, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"silver-wolf","officialId":"1006","baseCharacterId":"silver-wolf","names":{"zh-CN":"银狼","en":"Silver Wolf","ja":"銀狼"},"aliases":{"zh-CN":["yin lang","yinlang"],"en":["SW","silver wolf","silverwolf"],"ja":["ginrou"]},"element":"quantum","path":"nihility","rarity":5,"factionId":"stellaron-hunters","factionGroupId":"stellaron-hunters","releaseVersionId":"1.1","releaseOrder":1,"assets":{"avatarPath":"/assets/characters/silver-wolf-avatar-a0f6dba430cf.png","portraitPath":"/assets/characters/silver-wolf-avatar-a0f6dba430cf.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/cf17c2dad074b88a6dbfa33446138c73_2646503772588786193.png","sourceUpdatedAt":"2022-04-11T18:52:39.000Z","sha256":"a0f6dba430cf3ad238ded70ca661f91fda77fdfd1d9ea97563bf79ab24522283","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/silver-wolf-avatar-a0f6dba430cf-40.avif","webpPath":"/assets/characters/silver-wolf-avatar-a0f6dba430cf-40.webp","avifBytes":1115,"webpBytes":1198,"avifSha256":"6d2e54973e446da949c67e1e7c35e2dfab80746b36b06ae8f99fbb11193de475","webpSha256":"a69f2996530bba336a47eb9d6788a4717a00ffc256c47e02f23fa5f07ee409ab"},{"width":80,"avifPath":"/assets/characters/silver-wolf-avatar-a0f6dba430cf-80.avif","webpPath":"/assets/characters/silver-wolf-avatar-a0f6dba430cf-80.webp","avifBytes":2468,"webpBytes":2812,"avifSha256":"8738537fdbed8c9eed54707aba073ea6677db203d9b3e5a3e203c5b63b527226","webpSha256":"51b20b504b6a2ae55b9b3ff7b1d53acff75b425424e1fbd861e34143137ebe82"},{"width":160,"avifPath":"/assets/characters/silver-wolf-avatar-a0f6dba430cf-160.avif","webpPath":"/assets/characters/silver-wolf-avatar-a0f6dba430cf-160.webp","avifBytes":6238,"webpBytes":8422,"avifSha256":"53a97346795c826a857d41ab96503941aa52786b9d3f0b6fd13bc80c0cfc45c0","webpSha256":"8905f46720ffc91e49fd184f2fc45abaf4b75c4c6def47badd40dff831480cec"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('yukong', '1207', 'yukong', 'imaginary', 'harmony', 4, 'xianzhou-luofu', 'xianzhou-alliance', '1.1', 1, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"yukong","officialId":"1207","baseCharacterId":"yukong","names":{"zh-CN":"驭空","en":"Yukong","ja":"御空"},"aliases":{"zh-CN":["yu kong","yukong"],"en":["yukong"],"ja":["gyokuu","gyoku"]},"element":"imaginary","path":"harmony","rarity":4,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.1","releaseOrder":1,"assets":{"avatarPath":"/assets/characters/yukong-avatar-777d4b9d9679.png","portraitPath":"/assets/characters/yukong-avatar-777d4b9d9679.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/07/18/1108fb690e4e3f3739f126aa511c0c0c_6949917502973102490.png","sourceUpdatedAt":"2023-06-07T16:29:57.000Z","sha256":"777d4b9d9679dd72fdfc43a7fef25c2d7fcda311739a6e6e5c96c00ebeeefd79","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/yukong-avatar-777d4b9d9679-40.avif","webpPath":"/assets/characters/yukong-avatar-777d4b9d9679-40.webp","avifBytes":1021,"webpBytes":976,"avifSha256":"d7d138854101e1107299863a9c8180c32dcf0491a2e1558ee6815870c1567c38","webpSha256":"2894b4b1c2f60a85e1012fa2624f5d54eedbee055c88695c09259026ca1490f5"},{"width":80,"avifPath":"/assets/characters/yukong-avatar-777d4b9d9679-80.avif","webpPath":"/assets/characters/yukong-avatar-777d4b9d9679-80.webp","avifBytes":2269,"webpBytes":2624,"avifSha256":"cea0c80586fead16b2efef8f8deb8875afe6d59835b2108ebe495b53d5b0c883","webpSha256":"5f2a35b87ae71dab148925f0b54a1e7e7b54e122c3405a635ade4207e598da89"},{"width":160,"avifPath":"/assets/characters/yukong-avatar-777d4b9d9679-160.avif","webpPath":"/assets/characters/yukong-avatar-777d4b9d9679-160.webp","avifBytes":5341,"webpBytes":7340,"avifSha256":"f382b078c79525f220fd86e7a523754bb0e2ae7471bdbc0a99aae752a5ed8ccd","webpSha256":"deff028abb5b3eb60f13cc92281791b5e49a8482653885fe7d0920b3aa21a98f"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('blade', '1205', 'blade', 'wind', 'destruction', 5, 'stellaron-hunters', 'stellaron-hunters', '1.2', 2, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"blade","officialId":"1205","baseCharacterId":"blade","names":{"zh-CN":"刃","en":"Blade","ja":"刃"},"aliases":{"zh-CN":["ren"],"en":["blade"],"ja":["jin"]},"element":"wind","path":"destruction","rarity":5,"factionId":"stellaron-hunters","factionGroupId":"stellaron-hunters","releaseVersionId":"1.2","releaseOrder":2,"assets":{"avatarPath":"/assets/characters/blade-avatar-2e40055896d6.png","portraitPath":"/assets/characters/blade-avatar-2e40055896d6.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/07/18/03683ce37738b0d682a557671e301eae_6658615399410788925.png","sourceUpdatedAt":"2023-07-12T16:53:42.000Z","sha256":"2e40055896d6e6d9738808077d18dbfee57782890306d76b774e46b4c336a2bc","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/blade-avatar-2e40055896d6-40.avif","webpPath":"/assets/characters/blade-avatar-2e40055896d6-40.webp","avifBytes":986,"webpBytes":1040,"avifSha256":"84fd04cc08c3be5f4d596a9bb395d86f9f7d1ed6704eebd09b97f1cb8677d3fd","webpSha256":"4f09cd2e117acf73de585e49385744da80aa4146816847e42624297d280e841e"},{"width":80,"avifPath":"/assets/characters/blade-avatar-2e40055896d6-80.avif","webpPath":"/assets/characters/blade-avatar-2e40055896d6-80.webp","avifBytes":1881,"webpBytes":2118,"avifSha256":"6597dfecf98f6549527a60ba7cf8c1c13e071be9b7327b271f7f154342e4be92","webpSha256":"553fc624cced7dfb1a21722d904800d636b381ec3cd5363a7ad91f87172666dd"},{"width":160,"avifPath":"/assets/characters/blade-avatar-2e40055896d6-160.avif","webpPath":"/assets/characters/blade-avatar-2e40055896d6-160.webp","avifBytes":4205,"webpBytes":5916,"avifSha256":"1bda3052e1657e25603108a9d180a0c558605e70f920698188eca42ef25ea478","webpSha256":"6436a564c4559fbfd1bce41df82054f1ab07642bf3a0dbf268789e8d12da6cce"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('kafka', '1005', 'kafka', 'lightning', 'nihility', 5, 'stellaron-hunters', 'stellaron-hunters', '1.2', 2, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"kafka","officialId":"1005","baseCharacterId":"kafka","names":{"zh-CN":"卡芙卡","en":"Kafka","ja":"カフカ"},"aliases":{"zh-CN":["ka fu ka","kafuka"],"en":["kafka"],"ja":["kafuka"]},"element":"lightning","path":"nihility","rarity":5,"factionId":"stellaron-hunters","factionGroupId":"stellaron-hunters","releaseVersionId":"1.2","releaseOrder":2,"assets":{"avatarPath":"/assets/characters/kafka-avatar-0d83f3fa9f98.png","portraitPath":"/assets/characters/kafka-avatar-0d83f3fa9f98.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2022/04/11/a27a7f23e023aeea841d151ca864f6d7_8275876235530321253.png","sourceUpdatedAt":"2022-04-11T18:52:19.000Z","sha256":"0d83f3fa9f98fecd8604eaf70d5dedcad85ee09e45f5e300c75f94b3bf3ffe44","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/kafka-avatar-0d83f3fa9f98-40.avif","webpPath":"/assets/characters/kafka-avatar-0d83f3fa9f98-40.webp","avifBytes":1036,"webpBytes":1106,"avifSha256":"0525181b9a5240bc55c04b27862e5c706bb16cbb373e99b0074e6e02423ef583","webpSha256":"08dfefeaf5e49982568cb12e299d67faf630990ecd17a89771d5e41d72475040"},{"width":80,"avifPath":"/assets/characters/kafka-avatar-0d83f3fa9f98-80.avif","webpPath":"/assets/characters/kafka-avatar-0d83f3fa9f98-80.webp","avifBytes":2102,"webpBytes":2366,"avifSha256":"56968e81889da0539e8c7900f2cdbcd5dbf40ac19564f8d8bc325c132c41f1ad","webpSha256":"676d9f465ca49d1ee43bc793b97185cbcb14fce2beb0cec7ccab127919f2ca27"},{"width":160,"avifPath":"/assets/characters/kafka-avatar-0d83f3fa9f98-160.avif","webpPath":"/assets/characters/kafka-avatar-0d83f3fa9f98-160.webp","avifBytes":4941,"webpBytes":6966,"avifSha256":"6494a2500b4bb1959352c644f76e9efc9161af012908386a758eea52524a6b0c","webpSha256":"f81de0ea976434026218bcb727ffc9186e3269dadf016c562fa0f9a311d6bac2"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('luka', '1111', 'luka', 'physical', 'nihility', 4, 'belobog', 'belobog', '1.2', 2, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"luka","officialId":"1111","baseCharacterId":"luka","names":{"zh-CN":"卢卡","en":"Luka","ja":"ルカ"},"aliases":{"zh-CN":["lu ka","luka"],"en":["luka"],"ja":["ruka"]},"element":"physical","path":"nihility","rarity":4,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.2","releaseOrder":2,"assets":{"avatarPath":"/assets/characters/luka-avatar-386a0a2094bd.png","portraitPath":"/assets/characters/luka-avatar-386a0a2094bd.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/07/18/b14015c52224fdb12e9479c15415df45_9163441622556196278.png","sourceUpdatedAt":"2023-07-12T19:12:59.000Z","sha256":"386a0a2094bd62a7f77f8a2e98abfde22d10b861080883e5ed20d8cd2f1d6df6","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/luka-avatar-386a0a2094bd-40.avif","webpPath":"/assets/characters/luka-avatar-386a0a2094bd-40.webp","avifBytes":1071,"webpBytes":1120,"avifSha256":"72edf635fcbafead54308dd329d2b15750a26af56ebbdd5dab1487522987edc7","webpSha256":"ec4e7ef4fb0fc48c096a2e105eae4c774f4d62e03b056e74017efd58b184c19b"},{"width":80,"avifPath":"/assets/characters/luka-avatar-386a0a2094bd-80.avif","webpPath":"/assets/characters/luka-avatar-386a0a2094bd-80.webp","avifBytes":2274,"webpBytes":2532,"avifSha256":"9631b06ce8e8c486dabd7149c687183979926d2c6ebbe4c5ca44b5293667dbe6","webpSha256":"2b4af2585d467e9361bbebc00a9746dfb74fdc13187f44e89450c31b1fde62c3"},{"width":160,"avifPath":"/assets/characters/luka-avatar-386a0a2094bd-160.avif","webpPath":"/assets/characters/luka-avatar-386a0a2094bd-160.webp","avifBytes":5174,"webpBytes":6960,"avifSha256":"e4278302c2b02c7b89cf70646446fb5161aaf9e2695a955ec887c6f86e315a2c","webpSha256":"eebee722715f6f17070ba4055e2f991b3f987a9bd44e58f7fc6421665810cf26"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('dan-heng-il', '1213', 'dan-heng', 'imaginary', 'destruction', 5, 'xianzhou-luofu', 'xianzhou-alliance', '1.3', 3, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"dan-heng-il","officialId":"1213","baseCharacterId":"dan-heng","names":{"zh-CN":"丹恒•饮月","en":"Dan Heng • Imbibitor Lunae","ja":"丹恒・飲月"},"aliases":{"zh-CN":["饮月","龙丹","dan heng yin yue","danhengyinyue","yin yue","yinyue","long dan","longdan"],"en":["DHIL","Imbibitor Lunae","dan heng imbibitor lunae","danhengimbibitorlunae","imbibitorlunae"],"ja":["飲月","tankou ingetsu","tankouingetsu"]},"element":"imaginary","path":"destruction","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.3","releaseOrder":3,"assets":{"avatarPath":"/assets/characters/dan-heng-il-avatar-2cf07d2fcb26.png","portraitPath":"/assets/characters/dan-heng-il-avatar-2cf07d2fcb26.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/08/28/0ca26d025d72bd31944a00600f700a99_5701144537156840973.png","sourceUpdatedAt":"2023-08-17T16:36:41.000Z","sha256":"2cf07d2fcb264b0265a407846d2472b50f1d8bee9b0f314a3f2bf74573f3e92f","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/dan-heng-il-avatar-2cf07d2fcb26-40.avif","webpPath":"/assets/characters/dan-heng-il-avatar-2cf07d2fcb26-40.webp","avifBytes":1010,"webpBytes":1062,"avifSha256":"a5f751b8e3dbf9f3584e5b543a97d2d9cdfd6351c02057c343eaed4ba9e3247d","webpSha256":"339bd1a0a722abba747eb22dfd853b3e7fd1857b53117d5199fe4e06dea87d47"},{"width":80,"avifPath":"/assets/characters/dan-heng-il-avatar-2cf07d2fcb26-80.avif","webpPath":"/assets/characters/dan-heng-il-avatar-2cf07d2fcb26-80.webp","avifBytes":1960,"webpBytes":2260,"avifSha256":"798a8454693d0809f98d89107d56e06b5a525b61e7810737f5c0eddd40301aaa","webpSha256":"365ca7ab11926a563aefe11ad42a802ccd8aba732041c7e05b372ba4cf6c9863"},{"width":160,"avifPath":"/assets/characters/dan-heng-il-avatar-2cf07d2fcb26-160.avif","webpPath":"/assets/characters/dan-heng-il-avatar-2cf07d2fcb26-160.webp","avifBytes":4602,"webpBytes":6354,"avifSha256":"abc7ee7e6b49e3a2ea8ed8f8a9a0a98472853f3cdc00019dd60c285d895ae8a1","webpSha256":"3d449123b35cfba3c0b789a361cdb24948245cb9a29bd8b50e7cb4654de9deef"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('fu-xuan', '1208', 'fu-xuan', 'quantum', 'preservation', 5, 'xianzhou-luofu', 'xianzhou-alliance', '1.3', 3, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"fu-xuan","officialId":"1208","baseCharacterId":"fu-xuan","names":{"zh-CN":"符玄","en":"Fu Xuan","ja":"符玄"},"aliases":{"zh-CN":["fu xuan","fuxuan"],"en":["fu xuan","fuxuan"],"ja":["fugen"]},"element":"quantum","path":"preservation","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.3","releaseOrder":3,"assets":{"avatarPath":"/assets/characters/fu-xuan-avatar-0eaf018b940e.png","portraitPath":"/assets/characters/fu-xuan-avatar-0eaf018b940e.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/08/28/bc0e8b39012e1e51b7f1e1bd2c78ddde_7333911698729337874.png","sourceUpdatedAt":"2023-08-17T16:32:34.000Z","sha256":"0eaf018b940e079cbe8377e6e3b384ab9e44b5b26a54c0acb49bd42f9fb4c288","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/fu-xuan-avatar-0eaf018b940e-40.avif","webpPath":"/assets/characters/fu-xuan-avatar-0eaf018b940e-40.webp","avifBytes":1100,"webpBytes":1192,"avifSha256":"f60536ef9d12e69b5d9c2326b03c93a321e52332e422253dbb17b5899694830f","webpSha256":"beaab6568a24dcd6875c7cc5298449d74d3d6f020955adf59cfd87d3a7c62e3b"},{"width":80,"avifPath":"/assets/characters/fu-xuan-avatar-0eaf018b940e-80.avif","webpPath":"/assets/characters/fu-xuan-avatar-0eaf018b940e-80.webp","avifBytes":2292,"webpBytes":2656,"avifSha256":"0fd856de1dfaa3f7fa47a1ac96f7109f24eb8749ae0198e1436e30736f599c98","webpSha256":"388ad0734f17125b4806a171ea5b01fe577612ff7e3da12da9fa0138d3b671cd"},{"width":160,"avifPath":"/assets/characters/fu-xuan-avatar-0eaf018b940e-160.avif","webpPath":"/assets/characters/fu-xuan-avatar-0eaf018b940e-160.webp","avifBytes":5381,"webpBytes":7304,"avifSha256":"35a40df829bb6ca17156e6301e3d41f063236cec583adf9f8748a0c9beb6c9fa","webpSha256":"1f7cdb8a3715b3a278e7c6b92e301774353d956eb635ba84bb5d106f251902ea"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('lynx', '1110', 'lynx', 'quantum', 'abundance', 4, 'belobog', 'belobog', '1.3', 3, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"lynx","officialId":"1110","baseCharacterId":"lynx","names":{"zh-CN":"玲可","en":"Lynx","ja":"リンクス"},"aliases":{"zh-CN":["ling ke","lingke"],"en":["lynx"],"ja":["rinkusu"]},"element":"quantum","path":"abundance","rarity":4,"factionId":"belobog","factionGroupId":"belobog","releaseVersionId":"1.3","releaseOrder":3,"assets":{"avatarPath":"/assets/characters/lynx-avatar-69660d7cc9dc.png","portraitPath":"/assets/characters/lynx-avatar-69660d7cc9dc.png","sourceUrl":"https://webstatic.hoyoverse.com/upload/op-public/2023/08/25/5d370b56f9b501cd9ceece492bda2757_7669076470419531973.png","sourceUpdatedAt":"2023-08-17T16:29:32.000Z","sha256":"69660d7cc9dc2f6f3fca5d3a00886192146e948be8dce0a1dbcbbd732dbc81b7","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/lynx-avatar-69660d7cc9dc-40.avif","webpPath":"/assets/characters/lynx-avatar-69660d7cc9dc-40.webp","avifBytes":1076,"webpBytes":1170,"avifSha256":"04d062150c686ea65951854b045baaa39f55d7609b379612d4a5c606b60a487f","webpSha256":"0b886d148add95dbb3c678ed576a28e46a8e461f394a50d76f731b7ca292410c"},{"width":80,"avifPath":"/assets/characters/lynx-avatar-69660d7cc9dc-80.avif","webpPath":"/assets/characters/lynx-avatar-69660d7cc9dc-80.webp","avifBytes":2329,"webpBytes":2624,"avifSha256":"f40549404f1236810b76d3cf387d4ecffc5e19cafa40073ee3688e0ada9f6ab9","webpSha256":"6382102583fc449adb9a46018bb0363af3615566b7e3b1814263f200af543836"},{"width":160,"avifPath":"/assets/characters/lynx-avatar-69660d7cc9dc-160.avif","webpPath":"/assets/characters/lynx-avatar-69660d7cc9dc-160.webp","avifBytes":5234,"webpBytes":7252,"avifSha256":"a36c65826f6aac29f930db12ae994e804ce6e14654cd13c20add9c37e2169cba","webpSha256":"f781ba791676e0e3130db4615440d9d1b45045d9c1f3560551fb3fb342876300"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('guinaifen', '1210', 'guinaifen', 'fire', 'nihility', 4, 'xianzhou-luofu', 'xianzhou-alliance', '1.4', 4, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"guinaifen","officialId":"1210","baseCharacterId":"guinaifen","names":{"zh-CN":"桂乃芬","en":"Guinaifen","ja":"桂乃芬"},"aliases":{"zh-CN":["gui nai fen","guinaifen"],"en":["guinaifen"],"ja":["keinaifun"]},"element":"fire","path":"nihility","rarity":4,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.4","releaseOrder":4,"assets":{"avatarPath":"/assets/characters/guinaifen-avatar-a3889d33288f.png","portraitPath":"/assets/characters/guinaifen-avatar-a3889d33288f.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/113258/e90d16f57aca708b2806dc17fe5fd85a_8376468351414248938.png","sourceUpdatedAt":"2023-10-09T16:28:20.000Z","sha256":"a3889d33288fcf2df918f1317f869337ea66b43a7721db1590d56ad25f040f4f","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/guinaifen-avatar-a3889d33288f-40.avif","webpPath":"/assets/characters/guinaifen-avatar-a3889d33288f-40.webp","avifBytes":1159,"webpBytes":1252,"avifSha256":"f97f2e82eccce3d8299a5600d6cf3b2862582076f1963ad8180af246760464b0","webpSha256":"0c8ed3b20a2a74ffcc442b70872ddfdeb26bd16c21c7fa58dbe9523fe7a34360"},{"width":80,"avifPath":"/assets/characters/guinaifen-avatar-a3889d33288f-80.avif","webpPath":"/assets/characters/guinaifen-avatar-a3889d33288f-80.webp","avifBytes":2532,"webpBytes":2796,"avifSha256":"01c6d32a81ed35866f71128bad232b870a6fe2d2bbf6f76f84c80851b14d9b0c","webpSha256":"f702c867ac8a59a004287cb8ab952a2ac13fe9855eebbee09e87d6615eaa6139"},{"width":160,"avifPath":"/assets/characters/guinaifen-avatar-a3889d33288f-160.avif","webpPath":"/assets/characters/guinaifen-avatar-a3889d33288f-160.webp","avifBytes":6081,"webpBytes":8134,"avifSha256":"eea56663fe0ee13ce07037e7042b2177ed4cfebd6d73cf8b79495fa876a06bcb","webpSha256":"8e4c36ebe24c97487d442141c6b0787e79b7de16ef78afbdde9aedc19fdaf7ce"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('jingliu', '1212', 'jingliu', 'ice', 'destruction', 5, 'xianzhou-luofu', 'xianzhou-alliance', '1.4', 4, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"jingliu","officialId":"1212","baseCharacterId":"jingliu","names":{"zh-CN":"镜流","en":"Jingliu","ja":"鏡流"},"aliases":{"zh-CN":["jing liu","jingliu"],"en":["jingliu"],"ja":["keiryuu","keiryu"]},"element":"ice","path":"destruction","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.4","releaseOrder":4,"assets":{"avatarPath":"/assets/characters/jingliu-avatar-1798d3ee3663.png","portraitPath":"/assets/characters/jingliu-avatar-1798d3ee3663.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/113257/6b1caa6dcac86b51754256a626d7089a_6047546758250201368.png","sourceUpdatedAt":"2023-10-09T16:27:45.000Z","sha256":"1798d3ee36632fb5778c850fe7dc1f39f32b610136b2c6985f1c7b66886c06a4","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/jingliu-avatar-1798d3ee3663-40.avif","webpPath":"/assets/characters/jingliu-avatar-1798d3ee3663-40.webp","avifBytes":1107,"webpBytes":1172,"avifSha256":"fbf825f921ca6be98261498e3f0892b0058bd4ee97bf5ef0788befc6e3d1ed76","webpSha256":"869c75d70e3ee3dfab9228acf755eb197d4e22a912ce8b265c0afe82d5a3d37a"},{"width":80,"avifPath":"/assets/characters/jingliu-avatar-1798d3ee3663-80.avif","webpPath":"/assets/characters/jingliu-avatar-1798d3ee3663-80.webp","avifBytes":2335,"webpBytes":2670,"avifSha256":"e0053235e2262271aaffa95c31747af0a31bf16072945b831618989d9450c9ad","webpSha256":"3b4ad9bba69a252dd6fd36ce032dbb43877b9a2d46838e7294bba069d0bb6dde"},{"width":160,"avifPath":"/assets/characters/jingliu-avatar-1798d3ee3663-160.avif","webpPath":"/assets/characters/jingliu-avatar-1798d3ee3663-160.webp","avifBytes":5620,"webpBytes":7774,"avifSha256":"0229bd15f2761f8ab49c237c7664dcdf1a1b690b7b62243d28f8d395baebfeba","webpSha256":"91f82e8ebbee56e99e475918448be755da5e99ca73a43e5d95aaedbd4ebee884"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('topaz-and-numby', '1112', 'topaz-and-numby', 'fire', 'hunt', 5, 'ipc', 'ipc', '1.4', 4, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"topaz-and-numby","officialId":"1112","baseCharacterId":"topaz-and-numby","names":{"zh-CN":"托帕&账账","en":"Topaz & Numby","ja":"トパーズ&カブ"},"aliases":{"zh-CN":["托帕","账账","tuo pa zhang zhang","tuopazhangzhang","tuo pa","tuopa","zhang zhang","zhangzhang"],"en":["Topaz","Numby","topaz numby","topaznumby"],"ja":["トパーズ","カブ","topaazu kabu","topaazukabu","topazu kabu","topazukabu","topaazu","topazu","kabu"]},"element":"fire","path":"hunt","rarity":5,"factionId":"ipc","factionGroupId":"ipc","releaseVersionId":"1.4","releaseOrder":4,"assets":{"avatarPath":"/assets/characters/topaz-and-numby-avatar-a67a6106a0ff.png","portraitPath":"/assets/characters/topaz-and-numby-avatar-a67a6106a0ff.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/113259/aec4e9e1f59e78ff72d8d1b8b9dd0712_4605153740160210783.png","sourceUpdatedAt":"2023-10-09T16:28:49.000Z","sha256":"a67a6106a0ff7b3ba68d9c1e65cac7780cf6584ea5fe4cee154c51ab9dc577ec","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/topaz-and-numby-avatar-a67a6106a0ff-40.avif","webpPath":"/assets/characters/topaz-and-numby-avatar-a67a6106a0ff-40.webp","avifBytes":1077,"webpBytes":1138,"avifSha256":"aae533fdf9d08da1f4f88b634df0f0e5959f0b91ac7d37eeac0069e2e924f867","webpSha256":"7f78f1f3afa929011b53e32b64a962dafababfc29d232e0313f7a2daa6df6348"},{"width":80,"avifPath":"/assets/characters/topaz-and-numby-avatar-a67a6106a0ff-80.avif","webpPath":"/assets/characters/topaz-and-numby-avatar-a67a6106a0ff-80.webp","avifBytes":2249,"webpBytes":2578,"avifSha256":"15f4098060d9bc600023257c74f8ed94a39418e5c0a652307e2dd5c8010d8958","webpSha256":"0eb58bfe425980fa8d028d520ca36117f5c9057bdd9a0918cf28f1f08d0648ce"},{"width":160,"avifPath":"/assets/characters/topaz-and-numby-avatar-a67a6106a0ff-160.avif","webpPath":"/assets/characters/topaz-and-numby-avatar-a67a6106a0ff-160.webp","avifBytes":5352,"webpBytes":7306,"avifSha256":"f56b8063f14a43ac0bafb9491c862dba4c28d37294a3afeed89a589484f5f62c","webpSha256":"b14d86afddf2285b0c3c4b6e48f6216c0b8d9ffcc67804d5e0dad52eabaad11e"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('argenti', '1302', 'argenti', 'physical', 'erudition', 5, 'knights-of-beauty', 'cosmic', '1.5', 5, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"argenti","officialId":"1302","baseCharacterId":"argenti","names":{"zh-CN":"银枝","en":"Argenti","ja":"アルジェンティ"},"aliases":{"zh-CN":["yin zhi","yinzhi"],"en":["argenti"],"ja":["arujentei"]},"element":"physical","path":"erudition","rarity":5,"factionId":"knights-of-beauty","factionGroupId":"cosmic","releaseVersionId":"1.5","releaseOrder":5,"assets":{"avatarPath":"/assets/characters/argenti-avatar-6e67ada6f633.png","portraitPath":"/assets/characters/argenti-avatar-6e67ada6f633.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/113551/2bd119b8c3be5a8981f21e308d0ff9df_6080004376791968215.png","sourceUpdatedAt":"2023-11-06T15:42:15.000Z","sha256":"6e67ada6f6338de28e21d2dd185834a60f6e791ca950119332d093c47b6c3aa4","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/argenti-avatar-6e67ada6f633-40.avif","webpPath":"/assets/characters/argenti-avatar-6e67ada6f633-40.webp","avifBytes":1083,"webpBytes":1146,"avifSha256":"800c250bde0cbec05a25611396270887f1f0b51e5b51829ee21d47cc1c560376","webpSha256":"b5b14a8cd02f3bcdb54924111fc74db5e83d8efe14dae4affa7a1dad1ead702e"},{"width":80,"avifPath":"/assets/characters/argenti-avatar-6e67ada6f633-80.avif","webpPath":"/assets/characters/argenti-avatar-6e67ada6f633-80.webp","avifBytes":2194,"webpBytes":2548,"avifSha256":"ff6b93a7c5d0312c57be453c36df393f112b435e502b99fa00252d8b39de121f","webpSha256":"c4f05854a44f6987ae4c7d8e4d1bf8f4f5cbb9d35d11aae163d0f4fbc3a134f7"},{"width":160,"avifPath":"/assets/characters/argenti-avatar-6e67ada6f633-160.avif","webpPath":"/assets/characters/argenti-avatar-6e67ada6f633-160.webp","avifBytes":4886,"webpBytes":6692,"avifSha256":"f4a5e416ce95c8aad59e33e2729d39fcb323719e73020abdbbee61a158c898cb","webpSha256":"e9913a30c2f9603f3ee6c885ac35e4f0b5d6a886c30eb9869680eeef6149d32a"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('hanya', '1215', 'hanya', 'physical', 'harmony', 4, 'xianzhou-luofu', 'xianzhou-alliance', '1.5', 5, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"hanya","officialId":"1215","baseCharacterId":"hanya","names":{"zh-CN":"寒鸦","en":"Hanya","ja":"寒鴉"},"aliases":{"zh-CN":["han ya","hanya"],"en":["hanya"],"ja":["kan a","kana"]},"element":"physical","path":"harmony","rarity":4,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.5","releaseOrder":5,"assets":{"avatarPath":"/assets/characters/hanya-avatar-80b6f1b592cd.png","portraitPath":"/assets/characters/hanya-avatar-80b6f1b592cd.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/113552/2b71f46b9d67d3ffc1d889fd4e967e9a_3247476334578569723.png","sourceUpdatedAt":"2023-11-06T15:42:44.000Z","sha256":"80b6f1b592cd6a814a65409cfdb7f1ba6a90114b28708bd528eac0e190086f8b","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/hanya-avatar-80b6f1b592cd-40.avif","webpPath":"/assets/characters/hanya-avatar-80b6f1b592cd-40.webp","avifBytes":1044,"webpBytes":1130,"avifSha256":"f8f5820932335a88286099ebe505844eb5ad2dc818159c33a4093c07de090c44","webpSha256":"5e6cb739361b21fa0596d62503a0152036e48450e21790263aee66abb726f512"},{"width":80,"avifPath":"/assets/characters/hanya-avatar-80b6f1b592cd-80.avif","webpPath":"/assets/characters/hanya-avatar-80b6f1b592cd-80.webp","avifBytes":2087,"webpBytes":2458,"avifSha256":"68b217315255db076386edc4fbd322da3baaa367c1373d15c7c2898fc3fd5a4a","webpSha256":"f4824ec39ba62c9aef07631f8441767a3f44e2e11d041103a2f6ddce10d3a280"},{"width":160,"avifPath":"/assets/characters/hanya-avatar-80b6f1b592cd-160.avif","webpPath":"/assets/characters/hanya-avatar-80b6f1b592cd-160.webp","avifBytes":4756,"webpBytes":6868,"avifSha256":"42d6f2cc60a26e6bcfb0c341d6ee8add09877684401e671f13d5a81358798544","webpSha256":"d8df719c121bc562789bec32e1aa427c8b24259728ce77dabae6be1d46f208fc"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('huohuo', '1217', 'huohuo', 'wind', 'abundance', 5, 'xianzhou-luofu', 'xianzhou-alliance', '1.5', 5, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"huohuo","officialId":"1217","baseCharacterId":"huohuo","names":{"zh-CN":"藿藿","en":"Huohuo","ja":"フォフォ"},"aliases":{"zh-CN":["huo huo","huohuo"],"en":["huohuo"],"ja":["fuofuo"]},"element":"wind","path":"abundance","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.5","releaseOrder":5,"assets":{"avatarPath":"/assets/characters/huohuo-avatar-3a8f2742bd7a.png","portraitPath":"/assets/characters/huohuo-avatar-3a8f2742bd7a.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/113549/6241e29b78992e78f7be09ecc9a095d8_9119778655003994988.png","sourceUpdatedAt":"2023-11-06T15:41:41.000Z","sha256":"3a8f2742bd7a4b8eac3aeedb4370dba26a26ad054738903d835e59163aaf4730","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/huohuo-avatar-3a8f2742bd7a-40.avif","webpPath":"/assets/characters/huohuo-avatar-3a8f2742bd7a-40.webp","avifBytes":1041,"webpBytes":1146,"avifSha256":"f2f869ea230ec7f93cd95a33ae30820bafd8a6ed53018bbc05e4edb7520bc9aa","webpSha256":"dda4e6b9d96daab355b9905482fe2db91ccf89808880d9b63acdc2134ecc3121"},{"width":80,"avifPath":"/assets/characters/huohuo-avatar-3a8f2742bd7a-80.avif","webpPath":"/assets/characters/huohuo-avatar-3a8f2742bd7a-80.webp","avifBytes":2291,"webpBytes":2668,"avifSha256":"dc3d6976e31a7c81382f182a6100ac07a43bea892ffa140c06587ab441925ef4","webpSha256":"08dce3cde0f6998d8f40cafb55fc2d1532187bee6e5f1ed2195d9e4f68632cf7"},{"width":160,"avifPath":"/assets/characters/huohuo-avatar-3a8f2742bd7a-160.avif","webpPath":"/assets/characters/huohuo-avatar-3a8f2742bd7a-160.webp","avifBytes":5278,"webpBytes":7412,"avifSha256":"454146b0471b96cdc5b23a66036d7029a0e5f0d26ba9fd1889bf106f53ee1746","webpSha256":"638384b81890378990c551b9d133cea34f03bfd970c14736f7c6c7f5acc589aa"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('dr-ratio', '1305', 'dr-ratio', 'imaginary', 'hunt', 5, 'intelligentsia-guild', 'cosmic', '1.6', 6, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"dr-ratio","officialId":"1305","baseCharacterId":"dr-ratio","names":{"zh-CN":"真理医生","en":"Dr. Ratio","ja":"Dr.レイシオ"},"aliases":{"zh-CN":["真理","zhen li yi sheng","zhenliyisheng","zhen li","zhenli"],"en":["Ratio","Dr Ratio","drratio"],"ja":["レイシオ","reishio"]},"element":"imaginary","path":"hunt","rarity":5,"factionId":"intelligentsia-guild","factionGroupId":"cosmic","releaseVersionId":"1.6","releaseOrder":6,"assets":{"avatarPath":"/assets/characters/dr-ratio-avatar-8e8cc1c26b98.png","portraitPath":"/assets/characters/dr-ratio-avatar-8e8cc1c26b98.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/114134/a6c86498e909f09945664a1e5b4d20be_7065933365556000987.png","sourceUpdatedAt":"2023-12-20T17:27:56.000Z","sha256":"8e8cc1c26b981aab57286cda860c14900704dea265b5062a6a3fecac8b34f602","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/dr-ratio-avatar-8e8cc1c26b98-40.avif","webpPath":"/assets/characters/dr-ratio-avatar-8e8cc1c26b98-40.webp","avifBytes":1044,"webpBytes":1138,"avifSha256":"f4aba1fecda8ea9b359a3788f1d86745104a4ed1273746c821b29a7a8fa60f3e","webpSha256":"246e4cb3b69cb5171b3006de495b2b6120183c2a6de2cd0e4a5adb3404b22608"},{"width":80,"avifPath":"/assets/characters/dr-ratio-avatar-8e8cc1c26b98-80.avif","webpPath":"/assets/characters/dr-ratio-avatar-8e8cc1c26b98-80.webp","avifBytes":2142,"webpBytes":2484,"avifSha256":"4e20ba324491c0c31c986ef8bfe295fe221916528198609a84fcdab930cdbb46","webpSha256":"36f0b53d3d2308b90396d4047e6f61123770a4b1c19e965e382f471255c50427"},{"width":160,"avifPath":"/assets/characters/dr-ratio-avatar-8e8cc1c26b98-160.avif","webpPath":"/assets/characters/dr-ratio-avatar-8e8cc1c26b98-160.webp","avifBytes":4923,"webpBytes":6734,"avifSha256":"7fb4335ffc814754551109119e5a71e9db67cf65ece6602ec26acc918bff8de1","webpSha256":"136985ad19bf0eb555704e5d70b5067534d6d397afe0a99d73f7f08ab8061ae7"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('ruan-mei', '1303', 'ruan-mei', 'ice', 'harmony', 5, 'herta-space-station', 'herta-space-station', '1.6', 6, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"ruan-mei","officialId":"1303","baseCharacterId":"ruan-mei","names":{"zh-CN":"阮•梅","en":"Ruan Mei","ja":"ルアン・メェイ"},"aliases":{"zh-CN":["ruan mei","ruanmei"],"en":["ruan mei","ruanmei"],"ja":["ruan meei","ruanmeei","ruan mei","ruanmei"]},"element":"ice","path":"harmony","rarity":5,"factionId":"herta-space-station","factionGroupId":"herta-space-station","releaseVersionId":"1.6","releaseOrder":6,"assets":{"avatarPath":"/assets/characters/ruan-mei-avatar-a1e997242931.png","portraitPath":"/assets/characters/ruan-mei-avatar-a1e997242931.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/114133/13f82e11d0a64fc4a7765a11e52ce63d_553982494913934113.png","sourceUpdatedAt":"2023-12-20T17:26:56.000Z","sha256":"a1e997242931e61940134e51ba9fef72908bf34a8865108b1ec299dd5598c898","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/ruan-mei-avatar-a1e997242931-40.avif","webpPath":"/assets/characters/ruan-mei-avatar-a1e997242931-40.webp","avifBytes":976,"webpBytes":1034,"avifSha256":"0e4a386ded799d7d1f2286b1e7ccd17d61834fd470096d78cd9351ca88ebb9b0","webpSha256":"d13e37fe066e0fb92666a8a6e84fb94b4001569ac439266842db332d0ca7d92c"},{"width":80,"avifPath":"/assets/characters/ruan-mei-avatar-a1e997242931-80.avif","webpPath":"/assets/characters/ruan-mei-avatar-a1e997242931-80.webp","avifBytes":2049,"webpBytes":2324,"avifSha256":"e2fff74bacbb945e0508d8695225f24f45bc64a3b50ec265f3002789bf4be08a","webpSha256":"e593aa7f51cf5d7e7437db46596a42f273a1c496dd83f5c13960e2c814896b24"},{"width":160,"avifPath":"/assets/characters/ruan-mei-avatar-a1e997242931-160.avif","webpPath":"/assets/characters/ruan-mei-avatar-a1e997242931-160.webp","avifBytes":4769,"webpBytes":6752,"avifSha256":"49facc964f93d38c9dc33ef32f0367ddd5551fb9a0c4a1b97a26741cd5ff8a1b","webpSha256":"4ac22cb83cc73af796eeae9a92dc5fe0a8a0c3016189859f4cb600aa24da644c"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('xueyi', '1214', 'xueyi', 'quantum', 'destruction', 4, 'xianzhou-luofu', 'xianzhou-alliance', '1.6', 6, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"xueyi","officialId":"1214","baseCharacterId":"xueyi","names":{"zh-CN":"雪衣","en":"Xueyi","ja":"雪衣"},"aliases":{"zh-CN":["xue yi","xueyi"],"en":["xueyi"],"ja":["setsui"]},"element":"quantum","path":"destruction","rarity":4,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"1.6","releaseOrder":6,"assets":{"avatarPath":"/assets/characters/xueyi-avatar-3b5c911839ee.png","portraitPath":"/assets/characters/xueyi-avatar-3b5c911839ee.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/114135/015f96e57ba7744d32137dc761104eb4_8612953409015173590.png","sourceUpdatedAt":"2023-12-20T17:29:24.000Z","sha256":"3b5c911839ee075cd9c76e8dbadc3c303d14defa21040dbd0d16ec363b235c97","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/xueyi-avatar-3b5c911839ee-40.avif","webpPath":"/assets/characters/xueyi-avatar-3b5c911839ee-40.webp","avifBytes":937,"webpBytes":1006,"avifSha256":"afa6eb1b285ac900bd9f6122250e4d10c306a59e6041901fc43ae70179b5357c","webpSha256":"459f874128b7232cc5c6fd259aa990a713852772e8411d6318ca6020316bf08c"},{"width":80,"avifPath":"/assets/characters/xueyi-avatar-3b5c911839ee-80.avif","webpPath":"/assets/characters/xueyi-avatar-3b5c911839ee-80.webp","avifBytes":1937,"webpBytes":2240,"avifSha256":"b15d1ee620a1255c8288fcfb3a166b3ef45d30c2fdee2891aa59381574f00e4f","webpSha256":"395bd1f354ddc3f9c03f3aa58a88069c103e6ec26ed938c12f39bfb7c0ccf929"},{"width":160,"avifPath":"/assets/characters/xueyi-avatar-3b5c911839ee-160.avif","webpPath":"/assets/characters/xueyi-avatar-3b5c911839ee-160.webp","avifBytes":4536,"webpBytes":6264,"avifSha256":"293d3a9cb34aaad00b88f7490b2832f7aa0d4d58ce11209ad308aeb729352fee","webpSha256":"6bf4e7ec9285cb6d5707fa98e0b7e0fea8bf66184a04aeaa097697cedc4a121c"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('black-swan', '1307', 'black-swan', 'wind', 'nihility', 5, 'garden-of-recollection', 'cosmic', '2.0', 7, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"black-swan","officialId":"1307","baseCharacterId":"black-swan","names":{"zh-CN":"黑天鹅","en":"Black Swan","ja":"ブラックスワン"},"aliases":{"zh-CN":["hei tian e","heitiane"],"en":["black swan","blackswan"],"ja":["burakkusuwan"]},"element":"wind","path":"nihility","rarity":5,"factionId":"garden-of-recollection","factionGroupId":"cosmic","releaseVersionId":"2.0","releaseOrder":7,"assets":{"avatarPath":"/assets/characters/black-swan-avatar-59452a1c84d4.png","portraitPath":"/assets/characters/black-swan-avatar-59452a1c84d4.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/122114/e09b820993f140deb0f552391784cb7e_2387142678634153379.png","sourceUpdatedAt":"2024-01-29T11:13:27.000Z","sha256":"59452a1c84d4b26a54d72dd77483ed5c5f5c147689ee36f14e4227731739ec5a","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/black-swan-avatar-59452a1c84d4-40.avif","webpPath":"/assets/characters/black-swan-avatar-59452a1c84d4-40.webp","avifBytes":1105,"webpBytes":1206,"avifSha256":"8ef25e4b3ba4dbe94511494e260478c1ec8858dc12d4111aa28aa20b52f64223","webpSha256":"80b8ebaf85e72ccb664fc01f93d0967458f6675081edd1688db328821aa40cce"},{"width":80,"avifPath":"/assets/characters/black-swan-avatar-59452a1c84d4-80.avif","webpPath":"/assets/characters/black-swan-avatar-59452a1c84d4-80.webp","avifBytes":2407,"webpBytes":2730,"avifSha256":"13cb342e379ecb39bc085b225ff9a9534eb2716a907faa45ca2371fb8fc9903f","webpSha256":"0462999a3ee41bcc47a88e361ea78e9f9484f99ab78ff147ad730fa4faa378c5"},{"width":160,"avifPath":"/assets/characters/black-swan-avatar-59452a1c84d4-160.avif","webpPath":"/assets/characters/black-swan-avatar-59452a1c84d4-160.webp","avifBytes":5854,"webpBytes":7862,"avifSha256":"3ef7aea2b2e9c60cc626e468589b6cb84df3f27c0c82fe5945f8e59d06dc0e98","webpSha256":"79f8a0f473407d7e141dc0eb900d5663cc35036e2b483f167d950e5ee6ab844d"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('misha', '1312', 'misha', 'ice', 'destruction', 4, 'penacony', 'penacony', '2.0', 7, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"misha","officialId":"1312","baseCharacterId":"misha","names":{"zh-CN":"米沙","en":"Misha","ja":"ミーシャ"},"aliases":{"zh-CN":["mi sha","misha"],"en":["misha"],"ja":["miisha","misha"]},"element":"ice","path":"destruction","rarity":4,"factionId":"penacony","factionGroupId":"penacony","releaseVersionId":"2.0","releaseOrder":7,"assets":{"avatarPath":"/assets/characters/misha-avatar-82816a770116.png","portraitPath":"/assets/characters/misha-avatar-82816a770116.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/122125/1f6734903188a4e52392a944b7038424_4429179718536429240.png","sourceUpdatedAt":"2024-01-29T12:39:24.000Z","sha256":"82816a770116606f5bbf47de2c5bafac9bb36892b172ec7e817fc5e7cffbb2ab","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/misha-avatar-82816a770116-40.avif","webpPath":"/assets/characters/misha-avatar-82816a770116-40.webp","avifBytes":1050,"webpBytes":1164,"avifSha256":"101586b00e7ef1de44d8f543cc83b76f74b4c7f5538e499392ebb215b3a5b9c0","webpSha256":"ddc6b84a672a81e5e34a72858bbeae0b0139861813ee329da530d72b49f44ea6"},{"width":80,"avifPath":"/assets/characters/misha-avatar-82816a770116-80.avif","webpPath":"/assets/characters/misha-avatar-82816a770116-80.webp","avifBytes":2195,"webpBytes":2544,"avifSha256":"b736d25a760eaf67dcc508fa9de93dc6de5d13865e634682a1adab1523dbc19c","webpSha256":"a577856212ce5eabbf8cdef84ace1442a14eeb053e9c87754364ce799d8a8f8a"},{"width":160,"avifPath":"/assets/characters/misha-avatar-82816a770116-160.avif","webpPath":"/assets/characters/misha-avatar-82816a770116-160.webp","avifBytes":4843,"webpBytes":6796,"avifSha256":"7a0ecc8d7a81a94bb2d6dd77930da16e442d5feb46f1970aaf88c39d0fcad900","webpSha256":"e606c76e1082cdf83f80265da875514884f84bdd658bcd551e77146c1ac2fa00"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('sparkle', '1306', 'sparkle', 'quantum', 'harmony', 5, 'masked-fools', 'cosmic', '2.0', 7, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"sparkle","officialId":"1306","baseCharacterId":"sparkle","names":{"zh-CN":"花火","en":"Sparkle","ja":"花火"},"aliases":{"zh-CN":["hua huo","huahuo"],"en":["sparkle"],"ja":["hanabi"]},"element":"quantum","path":"harmony","rarity":5,"factionId":"masked-fools","factionGroupId":"cosmic","releaseVersionId":"2.0","releaseOrder":7,"assets":{"avatarPath":"/assets/characters/sparkle-avatar-d4e241c4b49b.png","portraitPath":"/assets/characters/sparkle-avatar-d4e241c4b49b.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/122124/418ee59a48e96cb3a8f5dbfd009200a1_2144754028775142076.png","sourceUpdatedAt":"2024-01-29T12:38:57.000Z","sha256":"d4e241c4b49b068f9719cf94768389f86e3eac8941a197e02108af34e61788ca","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/sparkle-avatar-d4e241c4b49b-40.avif","webpPath":"/assets/characters/sparkle-avatar-d4e241c4b49b-40.webp","avifBytes":1074,"webpBytes":1170,"avifSha256":"2fbe5a9c5eb1482d7c7f0e29cf8d4a16b3edfaeb33bc05286c33bb10e6a5c674","webpSha256":"2393812fc8313cf46367db082e60abc93a926bfeb21613cf0a46953d7e0bda89"},{"width":80,"avifPath":"/assets/characters/sparkle-avatar-d4e241c4b49b-80.avif","webpPath":"/assets/characters/sparkle-avatar-d4e241c4b49b-80.webp","avifBytes":2372,"webpBytes":2712,"avifSha256":"6cfaee967537c7ae4e24ee372de8ac5727e8704653a1b9c013eb562173fa7bf9","webpSha256":"145ed8163b0e3d38c1297245ef004b682f6d687521297de0ea8d41854819be78"},{"width":160,"avifPath":"/assets/characters/sparkle-avatar-d4e241c4b49b-160.avif","webpPath":"/assets/characters/sparkle-avatar-d4e241c4b49b-160.webp","avifBytes":5427,"webpBytes":7470,"avifSha256":"e775b1616e64d1e6ca2029a180ae957b03b7a74c6ba38dfd9f79a024b739cbba","webpSha256":"a4b707d6c9a726f1c87926768df5f159db1165d8e533c5829db1e70cd2e50d5a"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('acheron', '1308', 'acheron', 'lightning', 'nihility', 5, 'self-annihilators', 'cosmic', '2.1', 8, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"acheron","officialId":"1308","baseCharacterId":"acheron","names":{"zh-CN":"黄泉","en":"Acheron","ja":"黄泉"},"aliases":{"zh-CN":["huang quan","huangquan"],"en":["acheron"],"ja":["yomi"]},"element":"lightning","path":"nihility","rarity":5,"factionId":"self-annihilators","factionGroupId":"cosmic","releaseVersionId":"2.1","releaseOrder":8,"assets":{"avatarPath":"/assets/characters/acheron-avatar-7676548cd1fd.png","portraitPath":"/assets/characters/acheron-avatar-7676548cd1fd.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/122837/7bbabff9dde54156d00585fc1d45605b_4199325960554656142.png","sourceUpdatedAt":"2024-03-12T15:44:11.000Z","sha256":"7676548cd1fdb7cf3b53888c138bbbbdcbd703baeb8f884ba24bfcbe1dcb0919","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/acheron-avatar-7676548cd1fd-40.avif","webpPath":"/assets/characters/acheron-avatar-7676548cd1fd-40.webp","avifBytes":1090,"webpBytes":1162,"avifSha256":"a07b208228839cee40dbe2bb1dc794472ec9ba399391e024aa2b57d033939503","webpSha256":"ece91290ffcac23b492bc79b9493464c6e93af12e3b8d9592f197518f26240ca"},{"width":80,"avifPath":"/assets/characters/acheron-avatar-7676548cd1fd-80.avif","webpPath":"/assets/characters/acheron-avatar-7676548cd1fd-80.webp","avifBytes":2213,"webpBytes":2582,"avifSha256":"2f7cd178b13d34419b983d3a93156f3511e7288af6bc2e4f57b7c1f2ebab1666","webpSha256":"c3ecd1aa0ded60b1090ab6d62f769795594d1a20b1fc7880e7f34e4b50804e71"},{"width":160,"avifPath":"/assets/characters/acheron-avatar-7676548cd1fd-160.avif","webpPath":"/assets/characters/acheron-avatar-7676548cd1fd-160.webp","avifBytes":5283,"webpBytes":7188,"avifSha256":"b0eaef24804aff8b2a5d804cca9375b120d4da0d10d9bff74a6b2c70a65c72e0","webpSha256":"730e8f7bf6da4c07ea8503e4c85d7b1e423e37a15263d6d648da360a83feda0f"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('aventurine', '1304', 'aventurine', 'imaginary', 'preservation', 5, 'ipc', 'ipc', '2.1', 8, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"aventurine","officialId":"1304","baseCharacterId":"aventurine","names":{"zh-CN":"砂金","en":"Aventurine","ja":"アベンチュリン"},"aliases":{"zh-CN":["sha jin","shajin"],"en":["aventurine"],"ja":["abenchurin"]},"element":"imaginary","path":"preservation","rarity":5,"factionId":"ipc","factionGroupId":"ipc","releaseVersionId":"2.1","releaseOrder":8,"assets":{"avatarPath":"/assets/characters/aventurine-avatar-0ff97f429972.png","portraitPath":"/assets/characters/aventurine-avatar-0ff97f429972.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/122838/03821220467396a333cd5362ebe0e1d1_6315724069120210502.png","sourceUpdatedAt":"2024-03-12T16:02:51.000Z","sha256":"0ff97f4299729f5311a6acf81d3250d58e6d1fbb07e9397bc91994528772af26","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/aventurine-avatar-0ff97f429972-40.avif","webpPath":"/assets/characters/aventurine-avatar-0ff97f429972-40.webp","avifBytes":1023,"webpBytes":1130,"avifSha256":"0dab9ab334286e67cc6d452d8d6514d4b3a0975c5617cba50f05237c8606cb3b","webpSha256":"ebe073297c0f0e80f8fa6bd817edc6bf27cc935c29333e6606cd870c3fcc789b"},{"width":80,"avifPath":"/assets/characters/aventurine-avatar-0ff97f429972-80.avif","webpPath":"/assets/characters/aventurine-avatar-0ff97f429972-80.webp","avifBytes":2153,"webpBytes":2520,"avifSha256":"e5576ce34c3e67774e3054d0a8a17e8e1c25a8717f2b7e41602e281bf42b9792","webpSha256":"ee59c0d1deae7c186fdfbe5f81982b6e6d83671f9cbd9f233168a412fde1265f"},{"width":160,"avifPath":"/assets/characters/aventurine-avatar-0ff97f429972-160.avif","webpPath":"/assets/characters/aventurine-avatar-0ff97f429972-160.webp","avifBytes":4921,"webpBytes":7090,"avifSha256":"fd226401a30ea82ec775115ffb78f6d793511b40f04034e5862e879078428811","webpSha256":"2132c52b1a9086eebe80d2e45e323fa335bbfc4f1ee4058d8d54cabf25184add"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('gallagher', '1301', 'gallagher', 'fire', 'abundance', 4, 'penacony', 'penacony', '2.1', 8, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"gallagher","officialId":"1301","baseCharacterId":"gallagher","names":{"zh-CN":"加拉赫","en":"Gallagher","ja":"ギャラガー"},"aliases":{"zh-CN":["jia la he","jialahe"],"en":["gallagher"],"ja":["gyaragaa","gyaraga"]},"element":"fire","path":"abundance","rarity":4,"factionId":"penacony","factionGroupId":"penacony","releaseVersionId":"2.1","releaseOrder":8,"assets":{"avatarPath":"/assets/characters/gallagher-avatar-56e22ff2e836.png","portraitPath":"/assets/characters/gallagher-avatar-56e22ff2e836.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/122839/72f42969256b2877af1b5bb5bd5b9f3d_1868580186070340307.png","sourceUpdatedAt":"2024-03-12T16:04:03.000Z","sha256":"56e22ff2e83657e96f1bd3826c178f16cc8d3b2e2286720825caeaafbb2afafd","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/gallagher-avatar-56e22ff2e836-40.avif","webpPath":"/assets/characters/gallagher-avatar-56e22ff2e836-40.webp","avifBytes":999,"webpBytes":1072,"avifSha256":"dc0fe0f7a5d9bbf184a35e92fac7b3220f069fc7e3fe695a81057ceeb9c80260","webpSha256":"b2af8dcf228c155b37018cb66b6a05e59164e78903b8f59c3e9dfb37f665cc87"},{"width":80,"avifPath":"/assets/characters/gallagher-avatar-56e22ff2e836-80.avif","webpPath":"/assets/characters/gallagher-avatar-56e22ff2e836-80.webp","avifBytes":2021,"webpBytes":2326,"avifSha256":"0581d27ae1a3cacdc26543e2cd02f8dfdc26842352309829cc546dd93194b875","webpSha256":"6e77ea74dfa6374e7e01a5851980a3263b397885721cfa9615101c2630efc6bf"},{"width":160,"avifPath":"/assets/characters/gallagher-avatar-56e22ff2e836-160.avif","webpPath":"/assets/characters/gallagher-avatar-56e22ff2e836-160.webp","avifBytes":4747,"webpBytes":6516,"avifSha256":"f279badcccf5164da1e590a8407a3b87d0f56fd2e97f0581905e6fa8074da9ad","webpSha256":"da0a56a31ef857dca063de1669cb637ffa9346c7baac1300f6c99b9b6209298b"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('boothill', '1315', 'boothill', 'physical', 'hunt', 5, 'galaxy-rangers', 'cosmic', '2.2', 9, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"boothill","officialId":"1315","baseCharacterId":"boothill","names":{"zh-CN":"波提欧","en":"Boothill","ja":"ブートヒル"},"aliases":{"zh-CN":["bo ti ou","botiou"],"en":["boothill"],"ja":["buutohiru","butohiru"]},"element":"physical","path":"hunt","rarity":5,"factionId":"galaxy-rangers","factionGroupId":"cosmic","releaseVersionId":"2.2","releaseOrder":9,"assets":{"avatarPath":"/assets/characters/boothill-avatar-039177ccda71.png","portraitPath":"/assets/characters/boothill-avatar-039177ccda71.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/123310/52a05c95d460a51ffd0b26d5cccc95cb_5771592969358909617.png","sourceUpdatedAt":"2024-04-18T16:11:48.000Z","sha256":"039177ccda71245838a53c821dc72131173cb44e3f0cb4f736b84e2a533f85d7","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/boothill-avatar-039177ccda71-40.avif","webpPath":"/assets/characters/boothill-avatar-039177ccda71-40.webp","avifBytes":1088,"webpBytes":1176,"avifSha256":"3a5f7d231cfef07c7121f1fa4b61f1e1ca03dcf5b106f3c0e0bea0a74eb8babc","webpSha256":"e6215ec3c0255687e8be974a1e8333625d9f1ab055cbd032616f343b145b53fc"},{"width":80,"avifPath":"/assets/characters/boothill-avatar-039177ccda71-80.avif","webpPath":"/assets/characters/boothill-avatar-039177ccda71-80.webp","avifBytes":2395,"webpBytes":2828,"avifSha256":"19a8dd4b35ae7323949bf3ffb5deb2efe6ff12b5cbe6b8c2f2e1004f54d1f2f9","webpSha256":"f6d8ea1e8c09833e5b36bfd32d1d0d9cf460ca0a6ab273f0b0f39766823d0d92"},{"width":160,"avifPath":"/assets/characters/boothill-avatar-039177ccda71-160.avif","webpPath":"/assets/characters/boothill-avatar-039177ccda71-160.webp","avifBytes":5661,"webpBytes":7980,"avifSha256":"f0e3c8f17bd465e07fcd6be3974a444505f9bf6f213f115e9c8466d1d913508a","webpSha256":"ab1153b910d56197163dc7cf85988b76a0a56625a277714e3bf9c0b908c8ebd7"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('robin', '1309', 'robin', 'physical', 'harmony', 5, 'penacony', 'penacony', '2.2', 9, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"robin","officialId":"1309","baseCharacterId":"robin","names":{"zh-CN":"知更鸟","en":"Robin","ja":"ロビン"},"aliases":{"zh-CN":["zhi geng niao","zhigengniao"],"en":["robin"],"ja":["robin"]},"element":"physical","path":"harmony","rarity":5,"factionId":"penacony","factionGroupId":"penacony","releaseVersionId":"2.2","releaseOrder":9,"assets":{"avatarPath":"/assets/characters/robin-avatar-831c516c3714.png","portraitPath":"/assets/characters/robin-avatar-831c516c3714.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/123309/ff40360a998bb038bb8336d56bf11318_5103405246540367373.png","sourceUpdatedAt":"2024-04-18T16:11:00.000Z","sha256":"831c516c3714b59179d3d5297420243f48295c9d309a46e5cea6a94ac6ace14c","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/robin-avatar-831c516c3714-40.avif","webpPath":"/assets/characters/robin-avatar-831c516c3714-40.webp","avifBytes":1071,"webpBytes":1182,"avifSha256":"7b62ec3e6ef2529bb1a3bd8e67d23797ffc8b4341912f358d9c26e1d5686745d","webpSha256":"8d72cac06a6c086eca6b4e148b27518936cb35f22c57851d81a5d500bf4f064a"},{"width":80,"avifPath":"/assets/characters/robin-avatar-831c516c3714-80.avif","webpPath":"/assets/characters/robin-avatar-831c516c3714-80.webp","avifBytes":2420,"webpBytes":2746,"avifSha256":"f6e1787f82e9b05b680f5683a19306a5a54644fd4afb0682f9b38468fffd5735","webpSha256":"fc110f57d3c65782bdf23030b74bd94c59a1e6eab52d851c528171093f8781e5"},{"width":160,"avifPath":"/assets/characters/robin-avatar-831c516c3714-160.avif","webpPath":"/assets/characters/robin-avatar-831c516c3714-160.webp","avifBytes":5973,"webpBytes":8092,"avifSha256":"6ea79d49917e4dc7019b0c6643d71e0218d39ee45ec5ce6c346e4bb184909c87","webpSha256":"c74e2bb5eb486011eedc9d29cf30c79ae567b640ff7ddfcaaeb308e8877282db"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('trailblazer-harmony', '8005', 'trailblazer', 'imaginary', 'harmony', 5, 'astral-express', 'astral-express', '2.2', 9, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"trailblazer-harmony","officialId":"8005","baseCharacterId":"trailblazer","names":{"zh-CN":"开拓者·同谐","en":"Trailblazer · Harmony","ja":"開拓者・調和"},"aliases":{"zh-CN":["开拓者","同谐主角","kai tuo zhe tong xie","kaituozhetongxie","kai tuo zhe","kaituozhe","tong xie zhu jue","tongxiezhujue"],"en":["Trailblazer","Harmony Trailblazer","trailblazer harmony","trailblazerharmony","harmonytrailblazer"],"ja":["開拓者","調和開拓者","trailblazer harmony","trailblazerharmony","kaitakusha chowa","kaitakushachowa"]},"element":"imaginary","path":"harmony","rarity":5,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"2.2","releaseOrder":9,"assets":{"avatarPath":"/assets/characters/trailblazer-harmony-avatar-8ab0f9082b98.png","portraitPath":"/assets/characters/trailblazer-harmony-avatar-8ab0f9082b98.png","sourceUrl":"https://raw.githubusercontent.com/Mar-7th/StarRailRes/f1b643637554019f6d611ac9240410bbe9698da8/icon/character/8005.png","sourceUpdatedAt":"2026-08-26T15:43:40.000Z","sha256":"8ab0f9082b9840d46d21d0cee9cb090cb24fe61c5b964d6954a384ca110e8a2d","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/trailblazer-harmony-avatar-8ab0f9082b98-40.avif","webpPath":"/assets/characters/trailblazer-harmony-avatar-8ab0f9082b98-40.webp","avifBytes":1169,"webpBytes":1482,"avifSha256":"67fbf0b12f7057643fe96c34a54777ecd1d6bf5ef482ff583e670b82643b3b90","webpSha256":"6875b17dab1d5e11e8eb888892e24428ca36a3da2d9b9fc28df525499f55eaa2"},{"width":80,"avifPath":"/assets/characters/trailblazer-harmony-avatar-8ab0f9082b98-80.avif","webpPath":"/assets/characters/trailblazer-harmony-avatar-8ab0f9082b98-80.webp","avifBytes":2613,"webpBytes":4036,"avifSha256":"c7919125ed21a08d55bf490b5afe7cb3bf39f582a9db5d9c9cf7988b200dd9ac","webpSha256":"9449d109d8217002390bc319f16a69e8c88c146e9377483b71b4f12c14b5ee74"},{"width":160,"avifPath":"/assets/characters/trailblazer-harmony-avatar-8ab0f9082b98-160.avif","webpPath":"/assets/characters/trailblazer-harmony-avatar-8ab0f9082b98-160.webp","avifBytes":6798,"webpBytes":11396,"avifSha256":"dc0390521858be224daadd681b445cfa28cf90af07c374b8c21a133f4a51f8cf","webpSha256":"5d6b92c87dda20f81174aa3a8302b1f8d383a6fc519626deb11e37d1139ababd"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('firefly', '1310', 'firefly', 'fire', 'destruction', 5, 'stellaron-hunters', 'stellaron-hunters', '2.3', 10, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"firefly","officialId":"1310","baseCharacterId":"firefly","names":{"zh-CN":"流萤","en":"Firefly","ja":"ホタル"},"aliases":{"zh-CN":["萤宝","萨姆","liu ying","liuying","ying bao","yingbao","sa mu","samu"],"en":["SAM","firefly"],"ja":["サム","hotaru","samu"]},"element":"fire","path":"destruction","rarity":5,"factionId":"stellaron-hunters","factionGroupId":"stellaron-hunters","releaseVersionId":"2.3","releaseOrder":10,"assets":{"avatarPath":"/assets/characters/firefly-avatar-95f3c017e490.png","portraitPath":"/assets/characters/firefly-avatar-95f3c017e490.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/123957/863ae8d7ebc3a8ccba6d1500f105793f_2481513828224126028.png","sourceUpdatedAt":"2024-06-03T15:56:33.000Z","sha256":"95f3c017e4905557ebdf38a7bcfc7346956f561fefc678c367bb6cbc9f6a61c2","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/firefly-avatar-95f3c017e490-40.avif","webpPath":"/assets/characters/firefly-avatar-95f3c017e490-40.webp","avifBytes":1043,"webpBytes":1146,"avifSha256":"8aa00089ba242e392e80d2c91d564915624b1f48c8cf96ce988861a70cea62a8","webpSha256":"351f2a5946ceb072aa5213f130d41a839ad056a4846304b06de25345d2738803"},{"width":80,"avifPath":"/assets/characters/firefly-avatar-95f3c017e490-80.avif","webpPath":"/assets/characters/firefly-avatar-95f3c017e490-80.webp","avifBytes":2241,"webpBytes":2562,"avifSha256":"69e6fdc60ae80d0275632c6e292213afe21e1ed4749157238325c51453a7cd7f","webpSha256":"4bf72375f112910ade53dd772cd6545935903bb3464659c8e2ae4393dd53df9c"},{"width":160,"avifPath":"/assets/characters/firefly-avatar-95f3c017e490-160.avif","webpPath":"/assets/characters/firefly-avatar-95f3c017e490-160.webp","avifBytes":5447,"webpBytes":7506,"avifSha256":"b08199c58c50bf92eecc92fa4db82484f51cf1e26b089d5fa514ea4bd9fa1ddc","webpSha256":"05407b7c9a7cf88f9edf9647a0df9e70e39a0ee210ffd7c5026ae6ee795e7694"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('jade', '1314', 'jade', 'quantum', 'erudition', 5, 'ipc', 'ipc', '2.3', 10, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"jade","officialId":"1314","baseCharacterId":"jade","names":{"zh-CN":"翡翠","en":"Jade","ja":"ジェイド"},"aliases":{"zh-CN":["fei cui","feicui"],"en":["jade"],"ja":["jeido"]},"element":"quantum","path":"erudition","rarity":5,"factionId":"ipc","factionGroupId":"ipc","releaseVersionId":"2.3","releaseOrder":10,"assets":{"avatarPath":"/assets/characters/jade-avatar-deea45c1dd61.png","portraitPath":"/assets/characters/jade-avatar-deea45c1dd61.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/123958/da750d7c75fc93eee15d7a2a9ced7b60_459052514305755111.png","sourceUpdatedAt":"2024-06-03T16:15:25.000Z","sha256":"deea45c1dd618cc93c17037de0d60c4bd622529fc64a84fb59d0aaf216e57ae4","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/jade-avatar-deea45c1dd61-40.avif","webpPath":"/assets/characters/jade-avatar-deea45c1dd61-40.webp","avifBytes":1059,"webpBytes":1184,"avifSha256":"3fc7f80c68d9dfdee1ae14189b892ce9b0106c15e81deae94ef3a14ce79f4794","webpSha256":"d504f26fed614eda4ea1479f04c399d757a24202aa949b8f98d1fa5c73265e67"},{"width":80,"avifPath":"/assets/characters/jade-avatar-deea45c1dd61-80.avif","webpPath":"/assets/characters/jade-avatar-deea45c1dd61-80.webp","avifBytes":2360,"webpBytes":2708,"avifSha256":"8515e20c3b2f02fa3a99dc8a1b83fca96ee22ccf0be7e0afd85e960b5fa778d0","webpSha256":"2c8b69df9b871e1c98aa47dee56a84225e829134096a377bb09d0173be094308"},{"width":160,"avifPath":"/assets/characters/jade-avatar-deea45c1dd61-160.avif","webpPath":"/assets/characters/jade-avatar-deea45c1dd61-160.webp","avifBytes":5600,"webpBytes":7762,"avifSha256":"e9b896a6adb7c6527db56fed1038ab3587f0af5d10a52cb40b9a29ba706a7cc3","webpSha256":"3e24e12c4e87512d8278747d90ea419d8536551d9c32bcbaaae8537be0382dba"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('jiaoqiu', '1218', 'jiaoqiu', 'fire', 'nihility', 5, 'xianzhou-yaoqing', 'xianzhou-alliance', '2.4', 11, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"jiaoqiu","officialId":"1218","baseCharacterId":"jiaoqiu","names":{"zh-CN":"椒丘","en":"Jiaoqiu","ja":"椒丘"},"aliases":{"zh-CN":["jiao qiu","jiaoqiu"],"en":["jiaoqiu"],"ja":["shoukyuu","shoukyu"]},"element":"fire","path":"nihility","rarity":5,"factionId":"xianzhou-yaoqing","factionGroupId":"xianzhou-alliance","releaseVersionId":"2.4","releaseOrder":11,"assets":{"avatarPath":"/assets/characters/jiaoqiu-avatar-4c8d9c1ba0e0.png","portraitPath":"/assets/characters/jiaoqiu-avatar-4c8d9c1ba0e0.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/124840/68ece84e57c8a8b35ea5e3c1f3faab2c_6392230512755725938.png","sourceUpdatedAt":"2024-07-16T10:42:10.000Z","sha256":"4c8d9c1ba0e05ee31b86de89676a19f175365577516eec0ae930d84b0779e12c","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/jiaoqiu-avatar-4c8d9c1ba0e0-40.avif","webpPath":"/assets/characters/jiaoqiu-avatar-4c8d9c1ba0e0-40.webp","avifBytes":1083,"webpBytes":1124,"avifSha256":"523f2c2d7d79c1390e0072ca3ca23a044750db77a7c89bb0a2f7b5da6e1586db","webpSha256":"a5ef72895e292da13201b01afa9f0599cdc44c84e975c6c722217ef31ef19988"},{"width":80,"avifPath":"/assets/characters/jiaoqiu-avatar-4c8d9c1ba0e0-80.avif","webpPath":"/assets/characters/jiaoqiu-avatar-4c8d9c1ba0e0-80.webp","avifBytes":2305,"webpBytes":2698,"avifSha256":"39d8e8ee5e1f3d32fa535a238fd5e2da29fbf745744a3ac79636c24b7e6ef266","webpSha256":"8fa0480e5380e49b87599cf74f791a2890e9dd7603435721518971c5143b0dd1"},{"width":160,"avifPath":"/assets/characters/jiaoqiu-avatar-4c8d9c1ba0e0-160.avif","webpPath":"/assets/characters/jiaoqiu-avatar-4c8d9c1ba0e0-160.webp","avifBytes":5618,"webpBytes":7762,"avifSha256":"9abb84dde2188e8a1e96f6d343ee5b45c1585c1ba5dd654b1bcfd61467ec0dc6","webpSha256":"30c4685c87ea26eebb51db0ba506cddbb8ecf3f5f6610d80023f6d7789a8ad62"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('march-7th-hunt', '1224', 'march-7th', 'imaginary', 'hunt', 4, 'astral-express', 'astral-express', '2.4', 11, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"march-7th-hunt","officialId":"1224","baseCharacterId":"march-7th","names":{"zh-CN":"三月七·巡猎","en":"March 7th · The Hunt","ja":"三月なのか・巡狩"},"aliases":{"zh-CN":["三月七","巡猎三月七","剑三月","san yue qi xun lie","sanyueqixunlie","san yue qi","sanyueqi","xun lie san yue qi","xunliesanyueqi","jian san yue","jiansanyue"],"en":["March 7th","Hunt March","M7 Hunt","march 7th the hunt","march7ththehunt","march7th","huntmarch","m7hunt"],"ja":["三月なのか","巡狩の三月なのか","巡狩なのか","nanoka","no nanoka","nonanoka","mitsuki nanoka junshu","mitsukinanokajunshu"]},"element":"imaginary","path":"hunt","rarity":4,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"2.4","releaseOrder":11,"assets":{"avatarPath":"/assets/characters/march-7th-hunt-avatar-70b58fc7fe3f.png","portraitPath":"/assets/characters/march-7th-hunt-avatar-70b58fc7fe3f.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/124841/10bd1dcd95f5749cdc16b088bb98ff5f_2845915467121228499.png","sourceUpdatedAt":"2024-07-16T10:42:37.000Z","sha256":"70b58fc7fe3f735937f921b23f8506ec4fbdc3431b3900a72c0b1d9627ba9058","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/march-7th-hunt-avatar-70b58fc7fe3f-40.avif","webpPath":"/assets/characters/march-7th-hunt-avatar-70b58fc7fe3f-40.webp","avifBytes":1110,"webpBytes":1214,"avifSha256":"59094c65a16081cddca4d65f1de71c75e31de7f4114f9c97f90e28287a84b7cf","webpSha256":"8a617dc37ec8103c76c927e70a0fe522cf9a0d1417b0823c91341c74f55e3507"},{"width":80,"avifPath":"/assets/characters/march-7th-hunt-avatar-70b58fc7fe3f-80.avif","webpPath":"/assets/characters/march-7th-hunt-avatar-70b58fc7fe3f-80.webp","avifBytes":2515,"webpBytes":2846,"avifSha256":"742dbe2633242aa33717b250052acc67d2c005cb7f8ac93ffb43a02d7f9511e0","webpSha256":"6da87417459fa468323bb7301e056253f2a4a085d47172d422c358ac75eb877e"},{"width":160,"avifPath":"/assets/characters/march-7th-hunt-avatar-70b58fc7fe3f-160.avif","webpPath":"/assets/characters/march-7th-hunt-avatar-70b58fc7fe3f-160.webp","avifBytes":6290,"webpBytes":8382,"avifSha256":"5ec4e681490a295e58ea84d0b111ae5669645e76e228fe0f12d2f2960a2fbd97","webpSha256":"8ee8055d0683d134a24d7174a909ac047aa555f47d923e6110803234ab55ed2f"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('yunli', '1221', 'yunli', 'physical', 'destruction', 5, 'xianzhou-zhuming', 'xianzhou-alliance', '2.4', 11, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"yunli","officialId":"1221","baseCharacterId":"yunli","names":{"zh-CN":"云璃","en":"Yunli","ja":"雲璃"},"aliases":{"zh-CN":["yun li","yunli"],"en":["yunli"],"ja":["unri"]},"element":"physical","path":"destruction","rarity":5,"factionId":"xianzhou-zhuming","factionGroupId":"xianzhou-alliance","releaseVersionId":"2.4","releaseOrder":11,"assets":{"avatarPath":"/assets/characters/yunli-avatar-8a2e54b49880.png","portraitPath":"/assets/characters/yunli-avatar-8a2e54b49880.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/124839/d759b33d72c0bec02a1293d3155d820f_8871451623128806042.png","sourceUpdatedAt":"2024-07-16T10:41:37.000Z","sha256":"8a2e54b49880d5678bd699e4602a4a4e462babbbb957c74bf77e585febc3cf95","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/yunli-avatar-8a2e54b49880-40.avif","webpPath":"/assets/characters/yunli-avatar-8a2e54b49880-40.webp","avifBytes":1109,"webpBytes":1180,"avifSha256":"15ca9e006eb2e5ca4e07ee1970c120605226bc2535ef9f714b9f400a1e686ba4","webpSha256":"0106a30c8c07be9e43ba4aa95d7355ccdbc4bee2012eb958790dbd0128aef573"},{"width":80,"avifPath":"/assets/characters/yunli-avatar-8a2e54b49880-80.avif","webpPath":"/assets/characters/yunli-avatar-8a2e54b49880-80.webp","avifBytes":2398,"webpBytes":2730,"avifSha256":"667bff8d6d6b75edd0033c75fa7116ed298b653f68995df544dc5f5fb7e896ad","webpSha256":"cd776b50d78cb7b90d7e0e8ce06421f117e737ce47979f3f2bd1ee663c6fc2d8"},{"width":160,"avifPath":"/assets/characters/yunli-avatar-8a2e54b49880-160.avif","webpPath":"/assets/characters/yunli-avatar-8a2e54b49880-160.webp","avifBytes":5962,"webpBytes":7956,"avifSha256":"bf1e1cadeed569430dabedd028977288fcc3212029e5a0358c04d11aafdb417a","webpSha256":"4cafe2ff9f3bb7b84807a8709e72eba2b5fdd80447833440a41f852462d14f59"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('feixiao', '1220', 'feixiao', 'wind', 'hunt', 5, 'xianzhou-yaoqing', 'xianzhou-alliance', '2.5', 12, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"feixiao","officialId":"1220","baseCharacterId":"feixiao","names":{"zh-CN":"飞霄","en":"Feixiao","ja":"飛霄"},"aliases":{"zh-CN":["fei xiao","feixiao"],"en":["feixiao"],"ja":["hishou"]},"element":"wind","path":"hunt","rarity":5,"factionId":"xianzhou-yaoqing","factionGroupId":"xianzhou-alliance","releaseVersionId":"2.5","releaseOrder":12,"assets":{"avatarPath":"/assets/characters/feixiao-avatar-3979450d3733.png","portraitPath":"/assets/characters/feixiao-avatar-3979450d3733.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/125609/951a91c3fe715d0240d2206613f7c919_5034276035636498391.png","sourceUpdatedAt":"2024-08-30T11:23:44.000Z","sha256":"3979450d37330b5b2b46dc8c60c1f62f8504acf150fff416ceed949e139044db","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/feixiao-avatar-3979450d3733-40.avif","webpPath":"/assets/characters/feixiao-avatar-3979450d3733-40.webp","avifBytes":1061,"webpBytes":1146,"avifSha256":"28eef98bfb7bc0f86c721cfcee3e8f553d62714233aba556d2c7baddb17e71ae","webpSha256":"4ef1cb7767a8571006f8f5e3b7137e9fef913ffd606cd180f4a089b54d8f9a0c"},{"width":80,"avifPath":"/assets/characters/feixiao-avatar-3979450d3733-80.avif","webpPath":"/assets/characters/feixiao-avatar-3979450d3733-80.webp","avifBytes":2391,"webpBytes":2844,"avifSha256":"54a55dbdd1146efadb3868d983b21353422f418a7a2ca5547fdfa7380cc74814","webpSha256":"6a2eccae8f0e35813fa91e1e7cba6a06a33e984a01221dbd983e7dceb09cadc4"},{"width":160,"avifPath":"/assets/characters/feixiao-avatar-3979450d3733-160.avif","webpPath":"/assets/characters/feixiao-avatar-3979450d3733-160.webp","avifBytes":6183,"webpBytes":8478,"avifSha256":"8bbcf89a0e6b62f5d348b226602447ea38ae29897ee5086b4714995a6bf04f43","webpSha256":"dd6db43cdc32045d2a136f9f070f8524a355887f7c8780a750e1bc586fb483e9"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('lingsha', '1222', 'lingsha', 'fire', 'abundance', 5, 'xianzhou-luofu', 'xianzhou-alliance', '2.5', 12, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"lingsha","officialId":"1222","baseCharacterId":"lingsha","names":{"zh-CN":"灵砂","en":"Lingsha","ja":"霊砂"},"aliases":{"zh-CN":["ling sha","lingsha"],"en":["lingsha"],"ja":["reisa"]},"element":"fire","path":"abundance","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"2.5","releaseOrder":12,"assets":{"avatarPath":"/assets/characters/lingsha-avatar-e67420fda0c0.png","portraitPath":"/assets/characters/lingsha-avatar-e67420fda0c0.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/125610/932874b29ac1dfb4bdfe63d7ff4dea8f_3082176141300282450.png","sourceUpdatedAt":"2024-08-30T11:24:22.000Z","sha256":"e67420fda0c0b97e5255780303d57de810d06ce3617a42748adf53e878b1b1bd","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/lingsha-avatar-e67420fda0c0-40.avif","webpPath":"/assets/characters/lingsha-avatar-e67420fda0c0-40.webp","avifBytes":1070,"webpBytes":1122,"avifSha256":"8380538bdecbf2f45f5ec40c9ae1ba98761f46c0484939c373ec433be563bfaa","webpSha256":"66d0e351f8d5279077a5d964e80ef0424f86f027cd2fad0acf2b7d030be64b33"},{"width":80,"avifPath":"/assets/characters/lingsha-avatar-e67420fda0c0-80.avif","webpPath":"/assets/characters/lingsha-avatar-e67420fda0c0-80.webp","avifBytes":2200,"webpBytes":2536,"avifSha256":"6c6d6309ee62ad4355eb1a9d2127b401adfd1ed2397ea07ef30f4b8098eb3c65","webpSha256":"685965630297554801db42f15999b214f915d19a886cbbe83f7781807df2244d"},{"width":160,"avifPath":"/assets/characters/lingsha-avatar-e67420fda0c0-160.avif","webpPath":"/assets/characters/lingsha-avatar-e67420fda0c0-160.webp","avifBytes":5385,"webpBytes":7558,"avifSha256":"03ab2a97bb6b763980923ca292ecd4084190acb774b65d869f6aa46082780165","webpSha256":"34a2bfa500f6511a952086c9d80216e14eb7a71057a1f0580f102b51abf2dd60"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('moze', '1223', 'moze', 'lightning', 'hunt', 4, 'xianzhou-yaoqing', 'xianzhou-alliance', '2.5', 12, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"moze","officialId":"1223","baseCharacterId":"moze","names":{"zh-CN":"貊泽","en":"Moze","ja":"モゼ"},"aliases":{"zh-CN":["mo ze","moze"],"en":["moze"],"ja":["moze"]},"element":"lightning","path":"hunt","rarity":4,"factionId":"xianzhou-yaoqing","factionGroupId":"xianzhou-alliance","releaseVersionId":"2.5","releaseOrder":12,"assets":{"avatarPath":"/assets/characters/moze-avatar-00139b2fba69.png","portraitPath":"/assets/characters/moze-avatar-00139b2fba69.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/125611/29163c8057be125dbb30bf1cc95df68e_11877494415624128.png","sourceUpdatedAt":"2024-08-30T11:24:50.000Z","sha256":"00139b2fba69aa1051f46b1095db5b40f53da071c180ca2d9004138f53ecb803","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/moze-avatar-00139b2fba69-40.avif","webpPath":"/assets/characters/moze-avatar-00139b2fba69-40.webp","avifBytes":1022,"webpBytes":1120,"avifSha256":"c7f86007312d6d4f226405e8a6f7e49237dd27f6c32abd1fd0d5b77e3e415b4f","webpSha256":"c6d2a5b630fa34f3fb46ca9ef47134f186fce8b0849a18719ce35b41a22e61f8"},{"width":80,"avifPath":"/assets/characters/moze-avatar-00139b2fba69-80.avif","webpPath":"/assets/characters/moze-avatar-00139b2fba69-80.webp","avifBytes":2272,"webpBytes":2570,"avifSha256":"a81ae24ea63e2f88c7ca3a4f0a14336e9bf1ab741fbc24dd5d169db4eb299bab","webpSha256":"cdf1b8c1aa0988d19d12924941bec62d163ee4f1c5fd871a5ddda73ba9ccfd40"},{"width":160,"avifPath":"/assets/characters/moze-avatar-00139b2fba69-160.avif","webpPath":"/assets/characters/moze-avatar-00139b2fba69-160.webp","avifBytes":5468,"webpBytes":7630,"avifSha256":"80d74044455a0ef3bfef6158f8764c540fc0b2f4835eb93e1358b90fd5378aed","webpSha256":"a0c6c853d92afb7b50d612b4085211a0e59cb176985d530ac3f9973bbb731692"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('rappa', '1317', 'rappa', 'imaginary', 'erudition', 5, 'galaxy-rangers', 'cosmic', '2.6', 13, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"rappa","officialId":"1317","baseCharacterId":"rappa","names":{"zh-CN":"乱破","en":"Rappa","ja":"乱破"},"aliases":{"zh-CN":["luan po","luanpo"],"en":["rappa"],"ja":["ranha"]},"element":"imaginary","path":"erudition","rarity":5,"factionId":"galaxy-rangers","factionGroupId":"cosmic","releaseVersionId":"2.6","releaseOrder":13,"assets":{"avatarPath":"/assets/characters/rappa-avatar-86a21eaf73a3.png","portraitPath":"/assets/characters/rappa-avatar-86a21eaf73a3.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/126410/a7c1fe9cf5cde28ea3ab57886e7b3a79_575417614613269360.png","sourceUpdatedAt":"2024-10-15T11:44:11.000Z","sha256":"86a21eaf73a34a1485aa1c69c0a0962e8e62f5f0fc9f3d5da43bd1fa5a482a0d","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/rappa-avatar-86a21eaf73a3-40.avif","webpPath":"/assets/characters/rappa-avatar-86a21eaf73a3-40.webp","avifBytes":1173,"webpBytes":1240,"avifSha256":"fc5067cbd405e34fc07b1ee4405a663cbfe5476ed29a89e41af6407bada138f9","webpSha256":"965e9bc137a441bbe59ec1317a6c7b4910d08ea4d98cf9c42553020cbceeb4cb"},{"width":80,"avifPath":"/assets/characters/rappa-avatar-86a21eaf73a3-80.avif","webpPath":"/assets/characters/rappa-avatar-86a21eaf73a3-80.webp","avifBytes":2750,"webpBytes":3006,"avifSha256":"995741f1bd76dca9308d5806ff6cee1451e813a761cccc135080c8adeb3999db","webpSha256":"68de7e49196e30a0155f51a978d8c2f9b90caea09bcba9207d4c3e37110dbbb1"},{"width":160,"avifPath":"/assets/characters/rappa-avatar-86a21eaf73a3-160.avif","webpPath":"/assets/characters/rappa-avatar-86a21eaf73a3-160.webp","avifBytes":7008,"webpBytes":9002,"avifSha256":"ed712ce8381b58ded78a51d599e32d8b1d96e1417df84948a1b778c472290cab","webpSha256":"acecf1782e99a195e2fb911935936dd8724bdf6acb0b442b3d42d553aae71b79"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('fugue', '1225', 'fugue', 'fire', 'nihility', 5, 'xianzhou-luofu', 'xianzhou-alliance', '2.7', 14, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"fugue","officialId":"1225","baseCharacterId":"fugue","names":{"zh-CN":"忘归人","en":"Fugue","ja":"帰忘の流離人"},"aliases":{"zh-CN":["wang gui ren","wangguiren"],"en":["fugue"],"ja":["kibounosasuraibito"]},"element":"fire","path":"nihility","rarity":5,"factionId":"xianzhou-luofu","factionGroupId":"xianzhou-alliance","releaseVersionId":"2.7","releaseOrder":14,"assets":{"avatarPath":"/assets/characters/fugue-avatar-4fc575471981.png","portraitPath":"/assets/characters/fugue-avatar-4fc575471981.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/127090/7f01d89e3a8713ddeb2e1348e3975af8_3993190531595481161.png","sourceUpdatedAt":"2024-11-22T14:17:18.000Z","sha256":"4fc575471981431de1738f0c309780f09b73ead0f09e9e546d120ed9e9c4c2a5","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/fugue-avatar-4fc575471981-40.avif","webpPath":"/assets/characters/fugue-avatar-4fc575471981-40.webp","avifBytes":1068,"webpBytes":1164,"avifSha256":"329a05bbb4c914564419e0b55ceabdecf83f1f9c1a5cdf948571ce816745a4d4","webpSha256":"3c9cfbc9ea142673b446632be02cb0944988d0fac45a7754f9b9f41792843a44"},{"width":80,"avifPath":"/assets/characters/fugue-avatar-4fc575471981-80.avif","webpPath":"/assets/characters/fugue-avatar-4fc575471981-80.webp","avifBytes":2321,"webpBytes":2670,"avifSha256":"db03b215753288b9190a1ed86fb915eb97837ffdf09b9f0f0b6e681b7b6c2f71","webpSha256":"6f1f833afe50f7d3c19e96680d6da12d5460936d2db881ddf0c241b2af23cd1f"},{"width":160,"avifPath":"/assets/characters/fugue-avatar-4fc575471981-160.avif","webpPath":"/assets/characters/fugue-avatar-4fc575471981-160.webp","avifBytes":5812,"webpBytes":8046,"avifSha256":"b7caab4f6d4b637693b1aeb11731cd872b9f858ee231a38e6c836abf0d4673f4","webpSha256":"15dabaf47ef241063a5bf387e9506c271f127b0d4a58f41e5e0e26225372f15d"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('sunday', '1313', 'sunday', 'imaginary', 'harmony', 5, 'cosmic', 'cosmic', '2.7', 14, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"sunday","officialId":"1313","baseCharacterId":"sunday","names":{"zh-CN":"星期日","en":"Sunday","ja":"サンデー"},"aliases":{"zh-CN":["xing qi ri","xingqiri"],"en":["sunday"],"ja":["sandee","sande"]},"element":"imaginary","path":"harmony","rarity":5,"factionId":"cosmic","factionGroupId":"cosmic","releaseVersionId":"2.7","releaseOrder":14,"assets":{"avatarPath":"/assets/characters/sunday-avatar-6419f26d34d2.png","portraitPath":"/assets/characters/sunday-avatar-6419f26d34d2.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/127020/f3bb89ca79422032f554aaf7086178d7_5070348504428165390.png","sourceUpdatedAt":"2024-11-19T16:13:17.000Z","sha256":"6419f26d34d20fd166167d8e708086d8133de1c674e0347b741eed961f8c78ac","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/sunday-avatar-6419f26d34d2-40.avif","webpPath":"/assets/characters/sunday-avatar-6419f26d34d2-40.webp","avifBytes":1137,"webpBytes":1228,"avifSha256":"b64c111fa27e95a1ac8858569372c656cc0b14ca2f315be1b300e4b40f5daf87","webpSha256":"8ff9825aef08811d21e37a8f9872217c8a1f2b09847849dece90c17b96839133"},{"width":80,"avifPath":"/assets/characters/sunday-avatar-6419f26d34d2-80.avif","webpPath":"/assets/characters/sunday-avatar-6419f26d34d2-80.webp","avifBytes":2534,"webpBytes":2964,"avifSha256":"5d84cec51e2261fb3cf68481a5c4e70cdeb60a2cc37910e3893417b4796224de","webpSha256":"473c5e9c69e44b318012abe546142a07bd7c5361c583e4c9520f1542d71cad20"},{"width":160,"avifPath":"/assets/characters/sunday-avatar-6419f26d34d2-160.avif","webpPath":"/assets/characters/sunday-avatar-6419f26d34d2-160.webp","avifBytes":6441,"webpBytes":8604,"avifSha256":"2912e0e58efbb355609dc4f594989f650d04e1b42ab9423a2fb7391ac475abeb","webpSha256":"454c2d36f276230184eb0791684d7cd6db01d3a87c828d5b1b8ce27405742243"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('aglaea', '1402', 'aglaea', 'lightning', 'remembrance', 5, 'amphoreus', 'amphoreus', '3.0', 15, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"aglaea","officialId":"1402","baseCharacterId":"aglaea","names":{"zh-CN":"阿格莱雅","en":"Aglaea","ja":"アグライア"},"aliases":{"zh-CN":["a ge lai ya","agelaiya"],"en":["aglaea"],"ja":["aguraia"]},"element":"lightning","path":"remembrance","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.0","releaseOrder":15,"assets":{"avatarPath":"/assets/characters/aglaea-avatar-1bbe277dab6e.png","portraitPath":"/assets/characters/aglaea-avatar-1bbe277dab6e.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/127763/9c07eb1ba64c09da024c8c255083b3a0_3379089841159520258.png","sourceUpdatedAt":"2024-12-30T18:05:16.000Z","sha256":"1bbe277dab6e6442afef81cd8cafe560d70754594e851532845904e9d0627fbe","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/aglaea-avatar-1bbe277dab6e-40.avif","webpPath":"/assets/characters/aglaea-avatar-1bbe277dab6e-40.webp","avifBytes":1093,"webpBytes":1194,"avifSha256":"7d13317034f76744a8bbb8d9ca74a476ab4b28b9cbaf4835cc1d7f0067c32c09","webpSha256":"4076ec543f27155966802eddb3f89dfdf02c171eae7ba37daa30054e1cb7fe86"},{"width":80,"avifPath":"/assets/characters/aglaea-avatar-1bbe277dab6e-80.avif","webpPath":"/assets/characters/aglaea-avatar-1bbe277dab6e-80.webp","avifBytes":2548,"webpBytes":2882,"avifSha256":"f0e652cf234a34b1dbd98f2596facfb13d98ebb5d3d89b4611e58299d893e3d8","webpSha256":"61f13e241348397272a66d5565d6e63eba1d0efce82ed38939621d6626a43bc4"},{"width":160,"avifPath":"/assets/characters/aglaea-avatar-1bbe277dab6e-160.avif","webpPath":"/assets/characters/aglaea-avatar-1bbe277dab6e-160.webp","avifBytes":6558,"webpBytes":8736,"avifSha256":"b75e12d1bce879da1deceb6a1c406b114776a6560e8d1dde06982904c7e64a93","webpSha256":"2bbd20e117a72904032be0038d2fee6b050dcb5374c3a2caf422805e7ad06f08"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('the-herta', '1401', 'herta', 'ice', 'erudition', 5, 'herta-space-station', 'herta-space-station', '3.0', 15, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"the-herta","officialId":"1401","baseCharacterId":"herta","names":{"zh-CN":"大黑塔","en":"The Herta","ja":"マダム・ヘルタ"},"aliases":{"zh-CN":["黑塔","da hei ta","daheita","hei ta","heita"],"en":["Herta","Madam Herta","the herta","theherta","madamherta"],"ja":["ヘルタ","madamu heruta","madamuheruta","heruta"]},"element":"ice","path":"erudition","rarity":5,"factionId":"herta-space-station","factionGroupId":"herta-space-station","releaseVersionId":"3.0","releaseOrder":15,"assets":{"avatarPath":"/assets/characters/the-herta-avatar-306da87b6817.png","portraitPath":"/assets/characters/the-herta-avatar-306da87b6817.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/127762/1280169cd0d65d40da34be92c242455f_7196380219881853106.png","sourceUpdatedAt":"2024-12-30T17:37:29.000Z","sha256":"306da87b6817d93328a9b60fdca506e1f00e5f293f35a12f0c5c3f93cc0962cd","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/the-herta-avatar-306da87b6817-40.avif","webpPath":"/assets/characters/the-herta-avatar-306da87b6817-40.webp","avifBytes":1050,"webpBytes":1154,"avifSha256":"c16b9f58bbe99851b2e5bbb4e0261d9e28c78fd56cbfb546f1d3ced87db59060","webpSha256":"b8760cce12cf3204417bc7855dbf2177d3efbec7ab4b8eae53f916d8fc9fa5fc"},{"width":80,"avifPath":"/assets/characters/the-herta-avatar-306da87b6817-80.avif","webpPath":"/assets/characters/the-herta-avatar-306da87b6817-80.webp","avifBytes":2273,"webpBytes":2578,"avifSha256":"72a3008c91e97d4cf3348508b0f7c532d86c2a25b1d8f722b45f4b2719649421","webpSha256":"b8e0a744048de5237cf32662739bafcbb687d105abae03e5e61354ca3a26af53"},{"width":160,"avifPath":"/assets/characters/the-herta-avatar-306da87b6817-160.avif","webpPath":"/assets/characters/the-herta-avatar-306da87b6817-160.webp","avifBytes":5502,"webpBytes":7760,"avifSha256":"6d250b03e64ec4850741d4bbdee90e5f827ee06aa9dc9cbfb3d83e6694389c1e","webpSha256":"782a2b7f643d37b614bf56baba89f81f67aed316eb440ac75ce389dcc8f6715a"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('trailblazer-remembrance', '8007', 'trailblazer', 'ice', 'remembrance', 5, 'astral-express', 'astral-express', '3.0', 15, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"trailblazer-remembrance","officialId":"8007","baseCharacterId":"trailblazer","names":{"zh-CN":"开拓者·记忆","en":"Trailblazer · Remembrance","ja":"開拓者・記憶"},"aliases":{"zh-CN":["开拓者","记忆主角","kai tuo zhe ji yi","kaituozhejiyi","kai tuo zhe","kaituozhe","ji yi zhu jue","jiyizhujue"],"en":["Trailblazer","Remembrance Trailblazer","trailblazer remembrance","trailblazerremembrance","remembrancetrailblazer"],"ja":["開拓者","記憶開拓者","trailblazer remembrance","trailblazerremembrance","kaitakusha kioku","kaitakushakioku"]},"element":"ice","path":"remembrance","rarity":5,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"3.0","releaseOrder":15,"assets":{"avatarPath":"/assets/characters/trailblazer-remembrance-avatar-38ba6a863c7d.png","portraitPath":"/assets/characters/trailblazer-remembrance-avatar-38ba6a863c7d.png","sourceUrl":"https://raw.githubusercontent.com/Mar-7th/StarRailRes/f1b643637554019f6d611ac9240410bbe9698da8/icon/character/8007.png","sourceUpdatedAt":"2026-08-26T15:43:40.000Z","sha256":"38ba6a863c7dcce077ec6b02f84d994ae88c9aba526881460028a8ec99eb1831","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/trailblazer-remembrance-avatar-38ba6a863c7d-40.avif","webpPath":"/assets/characters/trailblazer-remembrance-avatar-38ba6a863c7d-40.webp","avifBytes":1320,"webpBytes":1636,"avifSha256":"bcd388b23426279837a01e48fdaf0fcd4d2c104c77406ebc08850666a8287a83","webpSha256":"7fd84a065c6c97e5089e2061a1c42ea9c63da947048a4e0138aa940edb496ed9"},{"width":80,"avifPath":"/assets/characters/trailblazer-remembrance-avatar-38ba6a863c7d-80.avif","webpPath":"/assets/characters/trailblazer-remembrance-avatar-38ba6a863c7d-80.webp","avifBytes":2959,"webpBytes":4602,"avifSha256":"502e33bb4c12e237bf14e27110710e5816aad610d76471712da21302a04ea814","webpSha256":"79c6e6f492c14492c5a65dac001254a0486bfb97f01b5d9aefcb9e9133628e63"},{"width":160,"avifPath":"/assets/characters/trailblazer-remembrance-avatar-38ba6a863c7d-160.avif","webpPath":"/assets/characters/trailblazer-remembrance-avatar-38ba6a863c7d-160.webp","avifBytes":7016,"webpBytes":12794,"avifSha256":"e9e253e1ebc7c04f57e14debd6acceefe680c2570ba286bf3d2db7ac1061cc3d","webpSha256":"44105367eaa4652140e6cebf89332e490cd16af4ad99d7fbd6153c777e82b316"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('mydei', '1404', 'mydei', 'imaginary', 'destruction', 5, 'amphoreus', 'amphoreus', '3.1', 16, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"mydei","officialId":"1404","baseCharacterId":"mydei","names":{"zh-CN":"万敌","en":"Mydei","ja":"モーディス"},"aliases":{"zh-CN":["wan di","wandi"],"en":["mydei"],"ja":["moodeisu","modeisu"]},"element":"imaginary","path":"destruction","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.1","releaseOrder":16,"assets":{"avatarPath":"/assets/characters/mydei-avatar-567729274be4.png","portraitPath":"/assets/characters/mydei-avatar-567729274be4.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/154335/65e716ba532efb6f0ad20631965cf604_3824046770472296744.png","sourceUpdatedAt":"2025-02-12T15:39:05.000Z","sha256":"567729274be429b4874cab8eeb1fe09b917810a908ecb162d5be636f80e37592","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/mydei-avatar-567729274be4-40.avif","webpPath":"/assets/characters/mydei-avatar-567729274be4-40.webp","avifBytes":1124,"webpBytes":1176,"avifSha256":"cdb309eaace2e665da80851fac21a76bc5b63cace602807732b666a5d562b216","webpSha256":"84b7a15a27bc0383156a974a0ea12f8fb85fb6f3bc4a6a507e37dc3c86fed8aa"},{"width":80,"avifPath":"/assets/characters/mydei-avatar-567729274be4-80.avif","webpPath":"/assets/characters/mydei-avatar-567729274be4-80.webp","avifBytes":2402,"webpBytes":2734,"avifSha256":"746b42f40c37b03a6ab06a0aafa5d7e4d7ac3e78ece48432d675dc0b7260a370","webpSha256":"9152b802a47f6c2062384fbb75a003f70aae6974fb3ce7d4e5ba636afd014a4d"},{"width":160,"avifPath":"/assets/characters/mydei-avatar-567729274be4-160.avif","webpPath":"/assets/characters/mydei-avatar-567729274be4-160.webp","avifBytes":5982,"webpBytes":8068,"avifSha256":"2c012efbf10ba03187e52c1ef984be3b804181186fdef6d82dda626126ae15f4","webpSha256":"9dd7247144f237816d02e15879695d7f223d2ebc24a52af2332dafe4a7016e1e"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('tribbie', '1403', 'tribbie', 'quantum', 'harmony', 5, 'amphoreus', 'amphoreus', '3.1', 16, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"tribbie","officialId":"1403","baseCharacterId":"tribbie","names":{"zh-CN":"缇宝","en":"Tribbie","ja":"トリビー"},"aliases":{"zh-CN":["ti bao","tibao"],"en":["tribbie"],"ja":["toribii","toribi"]},"element":"quantum","path":"harmony","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.1","releaseOrder":16,"assets":{"avatarPath":"/assets/characters/tribbie-avatar-296b1a123c22.png","portraitPath":"/assets/characters/tribbie-avatar-296b1a123c22.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/154334/de3fc6c9646b5567a92280e27b672b39_2277495775685534409.png","sourceUpdatedAt":"2025-02-12T15:30:29.000Z","sha256":"296b1a123c221162acb1ee40cc7279a24907ba7141737b26e2ba01e79e15e273","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/tribbie-avatar-296b1a123c22-40.avif","webpPath":"/assets/characters/tribbie-avatar-296b1a123c22-40.webp","avifBytes":1146,"webpBytes":1194,"avifSha256":"2bacafe75403299746cfd097c8c4fb32143b915d9df75893b3f6b487876b49c6","webpSha256":"4d833958ee141804ade415becc423bb41614719ddf1b13473daf764002efd5b2"},{"width":80,"avifPath":"/assets/characters/tribbie-avatar-296b1a123c22-80.avif","webpPath":"/assets/characters/tribbie-avatar-296b1a123c22-80.webp","avifBytes":2531,"webpBytes":2834,"avifSha256":"99561910c67f6098005bfca0a347cdea0f45377667bf419320081744ba872827","webpSha256":"f48f125572306f8d42d1375f09702bdea470bb5d6f23a9e685d60459f085737f"},{"width":160,"avifPath":"/assets/characters/tribbie-avatar-296b1a123c22-160.avif","webpPath":"/assets/characters/tribbie-avatar-296b1a123c22-160.webp","avifBytes":6484,"webpBytes":8352,"avifSha256":"ec2e454fb49d403fd0dbcf673ec4750af9d6ade7d4abf521067a5497399feba4","webpSha256":"c961a853ffbe08f308315a95159632964ba1959022efab6c1753b7369b9030d7"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('anaxa', '1405', 'anaxa', 'wind', 'erudition', 5, 'amphoreus', 'amphoreus', '3.2', 17, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"anaxa","officialId":"1405","baseCharacterId":"anaxa","names":{"zh-CN":"那刻夏","en":"Anaxa","ja":"アナイクス"},"aliases":{"zh-CN":["na ke xia","nakexia"],"en":["anaxa"],"ja":["anaikusu"]},"element":"wind","path":"erudition","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.2","releaseOrder":17,"assets":{"avatarPath":"/assets/characters/anaxa-avatar-6d50f51d5cf0.png","portraitPath":"/assets/characters/anaxa-avatar-6d50f51d5cf0.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/155154/48d81bdfd6d7feca4edcc9f27d776b06_1716219330657468352.png","sourceUpdatedAt":"2025-03-24T16:46:43.000Z","sha256":"6d50f51d5cf0d5be0dafc43cd64abde4c0eee690b2aadc26a51fe9c03a33df3a","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/anaxa-avatar-6d50f51d5cf0-40.avif","webpPath":"/assets/characters/anaxa-avatar-6d50f51d5cf0-40.webp","avifBytes":1050,"webpBytes":1148,"avifSha256":"4f12eff53fba7a43af7eebb295e2aa52e89782cb41e58bf133025fbd22a49258","webpSha256":"224a6126aafaa15d66a6b547a281978ec3a3437bb515ca76e5162d9391a55d88"},{"width":80,"avifPath":"/assets/characters/anaxa-avatar-6d50f51d5cf0-80.avif","webpPath":"/assets/characters/anaxa-avatar-6d50f51d5cf0-80.webp","avifBytes":2283,"webpBytes":2646,"avifSha256":"0c588cdcdb5b1eec4b88c4e300df43ee8aedebe4f5b31bf03420644a42565f64","webpSha256":"6ce5db3d6c2328c89809c5fb1043426c21ff43c0455aec8dc43eb70d3dbe4522"},{"width":160,"avifPath":"/assets/characters/anaxa-avatar-6d50f51d5cf0-160.avif","webpPath":"/assets/characters/anaxa-avatar-6d50f51d5cf0-160.webp","avifBytes":5746,"webpBytes":7962,"avifSha256":"5b5c7c316e4071cf6257f244dbc1cfe7cc615dfeffbc1cc8d577549364c3d723","webpSha256":"1472e4691927d8f65317b1408a0c578eff1313d37fe0be11e2fcd24eb66c0e5c"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('castorice', '1407', 'castorice', 'quantum', 'remembrance', 5, 'amphoreus', 'amphoreus', '3.2', 17, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"castorice","officialId":"1407","baseCharacterId":"castorice","names":{"zh-CN":"遐蝶","en":"Castorice","ja":"キャストリス"},"aliases":{"zh-CN":["xia die","xiadie"],"en":["castorice"],"ja":["kyasutorisu"]},"element":"quantum","path":"remembrance","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.2","releaseOrder":17,"assets":{"avatarPath":"/assets/characters/castorice-avatar-a05fc9e97efb.png","portraitPath":"/assets/characters/castorice-avatar-a05fc9e97efb.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/155153/74dcae39b1317c6a7add3a4b96af5076_3249311660615806732.png","sourceUpdatedAt":"2025-03-24T16:45:11.000Z","sha256":"a05fc9e97efb03510c0e7fbe27afe6cbcfb485f4c3b3e02044b82fb9a2f4af4a","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/castorice-avatar-a05fc9e97efb-40.avif","webpPath":"/assets/characters/castorice-avatar-a05fc9e97efb-40.webp","avifBytes":1074,"webpBytes":1152,"avifSha256":"025f6abda6ea865f21a1241a8e238feb8805ed5fffb7c0e19b8728aa4d32d91d","webpSha256":"27c8b3432c16e46099693947791a927f8db641bd1269f967fcdfdc2cf17e7a26"},{"width":80,"avifPath":"/assets/characters/castorice-avatar-a05fc9e97efb-80.avif","webpPath":"/assets/characters/castorice-avatar-a05fc9e97efb-80.webp","avifBytes":2375,"webpBytes":2698,"avifSha256":"5cb40356fcde37717dc0aa25a22df479ce1ee3f5023e74409ee3f7db8fbc376e","webpSha256":"2eee328a3855b6c701578992b66c53c03d377bdf8e2f24162edbf85840eeb909"},{"width":160,"avifPath":"/assets/characters/castorice-avatar-a05fc9e97efb-160.avif","webpPath":"/assets/characters/castorice-avatar-a05fc9e97efb-160.webp","avifBytes":5912,"webpBytes":8050,"avifSha256":"48cb659f11fd4a9caf8ac834c506831d38e9b0004e5a476a3f42b15eb5e5adc5","webpSha256":"2e2fe7e58ba70cb08565bdbbd505c6cc63af727110dfec0dca710a1894485887"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('cipher', '1406', 'cipher', 'quantum', 'nihility', 5, 'amphoreus', 'amphoreus', '3.3', 18, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"cipher","officialId":"1406","baseCharacterId":"cipher","names":{"zh-CN":"赛飞儿","en":"Cipher","ja":"サフェル"},"aliases":{"zh-CN":["sai fei er","saifeier"],"en":["cipher"],"ja":["safyeru"]},"element":"quantum","path":"nihility","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.3","releaseOrder":18,"assets":{"avatarPath":"/assets/characters/cipher-avatar-7a3884a7ac08.png","portraitPath":"/assets/characters/cipher-avatar-7a3884a7ac08.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/155820/88e3029fd6043521440d24d2a9e048db_4294339742656763641.png","sourceUpdatedAt":"2025-05-07T14:06:25.000Z","sha256":"7a3884a7ac0874c30e648aaaa13612ebbeeb2b3656ebe56f9e087a50a83a1f41","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/cipher-avatar-7a3884a7ac08-40.avif","webpPath":"/assets/characters/cipher-avatar-7a3884a7ac08-40.webp","avifBytes":1136,"webpBytes":1224,"avifSha256":"720986d14985f9513e341d9bb9bdc9a467c96d27b3b7d2bfe0214638f8e3abc3","webpSha256":"a78b4a1e2cb64ab107e7814cec564fbc45880faaa5dd22e155edab6a784d7ece"},{"width":80,"avifPath":"/assets/characters/cipher-avatar-7a3884a7ac08-80.avif","webpPath":"/assets/characters/cipher-avatar-7a3884a7ac08-80.webp","avifBytes":2590,"webpBytes":2914,"avifSha256":"9a3132ce6ce0d89f9aef4e676cc909831e46464845e2d0d4f6dbfd0638ea5db4","webpSha256":"735ee347fd2e26e59bce9ca638ebe4cbf310b6296991d8859e4322da399201c7"},{"width":160,"avifPath":"/assets/characters/cipher-avatar-7a3884a7ac08-160.avif","webpPath":"/assets/characters/cipher-avatar-7a3884a7ac08-160.webp","avifBytes":6641,"webpBytes":8846,"avifSha256":"013d171a95ada80b46f75e8f2e256e3980f6f1c4cf24bff513bc569fb9bc842e","webpSha256":"a2ad8d53110ee3df3c1d5fe10761c19222d7ff3692b4e292268750c2d5c0eca9"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('hyacine', '1409', 'hyacine', 'wind', 'remembrance', 5, 'amphoreus', 'amphoreus', '3.3', 18, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"hyacine","officialId":"1409","baseCharacterId":"hyacine","names":{"zh-CN":"风堇","en":"Hyacine","ja":"ヒアンシー"},"aliases":{"zh-CN":["feng jin","fengjin"],"en":["hyacine"],"ja":["hianshii","hianshi"]},"element":"wind","path":"remembrance","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.3","releaseOrder":18,"assets":{"avatarPath":"/assets/characters/hyacine-avatar-23ff80766bcb.png","portraitPath":"/assets/characters/hyacine-avatar-23ff80766bcb.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/155819/365635a3493e9523cf3c3769e0169721_4924415025585271982.png","sourceUpdatedAt":"2025-05-07T14:05:43.000Z","sha256":"23ff80766bcbf90e77424486e13ea8a010083a05f31a496dbae1ead75d12c19b","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/hyacine-avatar-23ff80766bcb-40.avif","webpPath":"/assets/characters/hyacine-avatar-23ff80766bcb-40.webp","avifBytes":1127,"webpBytes":1244,"avifSha256":"f4ceb2a48ed2ced673fbadf112be50bb03100f6ebe078b450bb1ba91442c68f9","webpSha256":"f88e189ac69fad9cfe065271cf674583cbcf20400f5d536b153ac081c8b27478"},{"width":80,"avifPath":"/assets/characters/hyacine-avatar-23ff80766bcb-80.avif","webpPath":"/assets/characters/hyacine-avatar-23ff80766bcb-80.webp","avifBytes":2628,"webpBytes":2968,"avifSha256":"ca0d39b1c7741ae767c19c910a3be8459bf0b3cecac4365a8d6627788a3e3e53","webpSha256":"79fbade961f38b792c59d6459d44beb2bf648796fbc19975a9343acec7ea4f14"},{"width":160,"avifPath":"/assets/characters/hyacine-avatar-23ff80766bcb-160.avif","webpPath":"/assets/characters/hyacine-avatar-23ff80766bcb-160.webp","avifBytes":6759,"webpBytes":8816,"avifSha256":"e38ae6e6ac00847b89748d0b55eec7209c24bbe851253be58b7957bfa34dbc9f","webpSha256":"9cc490ed8fbaba8ab95c9a9beeeb9f943065c21df516038679a67509c08fbb33"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('archer', '1015', 'archer', 'quantum', 'hunt', 5, 'fate-stay-night', 'another-world', '3.4', 19, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"archer","officialId":"1015","baseCharacterId":"archer","names":{"zh-CN":"Archer","en":"Archer","ja":"アーチャー"},"aliases":{"zh-CN":["archer"],"en":["archer"],"ja":["aachaa","acha"]},"element":"quantum","path":"hunt","rarity":5,"factionId":"fate-stay-night","factionGroupId":"another-world","releaseVersionId":"3.4","releaseOrder":19,"assets":{"avatarPath":"/assets/characters/archer-avatar-0ed79ec7f8fa.png","portraitPath":"/assets/characters/archer-avatar-0ed79ec7f8fa.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/156035/01020be8a2962c7709466c6232f2591f_2398576073763782685.png","sourceUpdatedAt":"2025-05-22T16:43:12.000Z","sha256":"0ed79ec7f8fa570f98717abf6bb65d5ba22f1f54ca2f4bb50954a12d2b547195","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/archer-avatar-0ed79ec7f8fa-40.avif","webpPath":"/assets/characters/archer-avatar-0ed79ec7f8fa-40.webp","avifBytes":1050,"webpBytes":1084,"avifSha256":"e1066c717eca45e69421807123ac6eba549eb796941ea7de5b20874a241616fb","webpSha256":"06fc9437d6b854d101cc8d6253308f64b504756edd287ecdc8bf19e9dd66f3ac"},{"width":80,"avifPath":"/assets/characters/archer-avatar-0ed79ec7f8fa-80.avif","webpPath":"/assets/characters/archer-avatar-0ed79ec7f8fa-80.webp","avifBytes":2080,"webpBytes":2374,"avifSha256":"3d468c46f84239936e9d77cfbd5dc26d82022c69d31994c1317998db7f96b0ea","webpSha256":"fb86a874c09ed7569f31ebb0f825a7b8928b898038b2fff44f16499cc59d03f1"},{"width":160,"avifPath":"/assets/characters/archer-avatar-0ed79ec7f8fa-160.avif","webpPath":"/assets/characters/archer-avatar-0ed79ec7f8fa-160.webp","avifBytes":4802,"webpBytes":6674,"avifSha256":"765933a343b59071710686df7f98ccb7ca145f89d036a938c1781a3f5f9b43c4","webpSha256":"c72403eede612cfe212530aa810aa6a55ba758367b3f18c81aa749b661e2f05c"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('phainon', '1408', 'phainon', 'physical', 'destruction', 5, 'amphoreus', 'amphoreus', '3.4', 19, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"phainon","officialId":"1408","baseCharacterId":"phainon","names":{"zh-CN":"白厄","en":"Phainon","ja":"ファイノン"},"aliases":{"zh-CN":["bai e","baie"],"en":["phainon"],"ja":["fuainon"]},"element":"physical","path":"destruction","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.4","releaseOrder":19,"assets":{"avatarPath":"/assets/characters/phainon-avatar-0b70600027a3.png","portraitPath":"/assets/characters/phainon-avatar-0b70600027a3.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/157029/19f6ae9cdb8cc618ec9bfefce3e462a3_4906914154538392654.png","sourceUpdatedAt":"2025-06-16T11:01:20.000Z","sha256":"0b70600027a3696f6c99949d0e6b39d3e00762c6c4da447d029f2161957e1fb3","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/phainon-avatar-0b70600027a3-40.avif","webpPath":"/assets/characters/phainon-avatar-0b70600027a3-40.webp","avifBytes":1041,"webpBytes":1088,"avifSha256":"62264ffb067464fb30bfff35e7c17f58cf690adaba9af088cf6771f8a6e5b4a9","webpSha256":"5a60fef33c5ddcbd3199508b15f94a6fa82fe17c4ecd6810296bfe8bbc5a1789"},{"width":80,"avifPath":"/assets/characters/phainon-avatar-0b70600027a3-80.avif","webpPath":"/assets/characters/phainon-avatar-0b70600027a3-80.webp","avifBytes":2149,"webpBytes":2436,"avifSha256":"566f083c877977eb87b5c577419c950c5dd4066dc354fad9f604acb67b91f8ee","webpSha256":"81adbda5a8fa2c5d2e1e79c4b7944ca36efc18ec3c8c7721010ecd5764f09495"},{"width":160,"avifPath":"/assets/characters/phainon-avatar-0b70600027a3-160.avif","webpPath":"/assets/characters/phainon-avatar-0b70600027a3-160.webp","avifBytes":5082,"webpBytes":7074,"avifSha256":"14c65f9771df05267cc12e2f9af1b99a0168eea7c683121de226e8d0e9032a1b","webpSha256":"972abe8d2c265145de4749bb7a6b91482d7f5582e6c07156ff6fe4ba469aba63"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('saber', '1014', 'saber', 'wind', 'destruction', 5, 'fate-stay-night', 'another-world', '3.4', 19, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"saber","officialId":"1014","baseCharacterId":"saber","names":{"zh-CN":"Saber","en":"Saber","ja":"セイバー"},"aliases":{"zh-CN":["saber"],"en":["saber"],"ja":["seibaa","seiba"]},"element":"wind","path":"destruction","rarity":5,"factionId":"fate-stay-night","factionGroupId":"another-world","releaseVersionId":"3.4","releaseOrder":19,"assets":{"avatarPath":"/assets/characters/saber-avatar-7dde152ddf96.png","portraitPath":"/assets/characters/saber-avatar-7dde152ddf96.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/156034/d5079fea19bd9bf28fbefaf2f18860bd_1399164401629468736.png","sourceUpdatedAt":"2025-05-22T16:37:42.000Z","sha256":"7dde152ddf963a9ba180e4ebdd5c28cd95e3aea11f2562ce1f65af6a2d59e6c1","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/saber-avatar-7dde152ddf96-40.avif","webpPath":"/assets/characters/saber-avatar-7dde152ddf96-40.webp","avifBytes":1086,"webpBytes":1138,"avifSha256":"0a2db7972fb2e6c0ae5a4f014e6054e1dfcb7cd4b9fd0f90128d4f1c998b0d68","webpSha256":"cfd7f543cb4fa5073f98ab383133e1c0b2f1ee571a7372e0aa8d872f71c04b20"},{"width":80,"avifPath":"/assets/characters/saber-avatar-7dde152ddf96-80.avif","webpPath":"/assets/characters/saber-avatar-7dde152ddf96-80.webp","avifBytes":2262,"webpBytes":2518,"avifSha256":"08b95054a7ba07f9b9077067dc0c019be1b0a815fcd36301b442ba53a2b5947c","webpSha256":"5711776f0ed66d6248ff6f56e4c355be50abcda4bc8786b473cec0b9c0e6d2d5"},{"width":160,"avifPath":"/assets/characters/saber-avatar-7dde152ddf96-160.avif","webpPath":"/assets/characters/saber-avatar-7dde152ddf96-160.webp","avifBytes":5384,"webpBytes":7280,"avifSha256":"6de1c1dd00f852e3a9014414588cacb434c8b38505ebcf9e1bb41e13ccdc57f2","webpSha256":"a607027ce2f5af66c7d4e0d5a3677b76a31c4ed468592e5aebc0ff00df3087bf"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('cerydra', '1412', 'cerydra', 'wind', 'harmony', 5, 'amphoreus', 'amphoreus', '3.5', 20, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"cerydra","officialId":"1412","baseCharacterId":"cerydra","names":{"zh-CN":"刻律德菈","en":"Cerydra","ja":"ケリュドラ"},"aliases":{"zh-CN":["ke lu de la","keludela"],"en":["cerydra"],"ja":["keryudora"]},"element":"wind","path":"harmony","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.5","releaseOrder":20,"assets":{"avatarPath":"/assets/characters/cerydra-avatar-7936a8ec3c37.png","portraitPath":"/assets/characters/cerydra-avatar-7936a8ec3c37.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/158016/d44fdd4747f6bd1ec01243ad0be0ebb0_6403409388996483867.png","sourceUpdatedAt":"2025-07-28T15:48:27.000Z","sha256":"7936a8ec3c37611bbaa7aec82bacfd67d43c317b59fb9f1cbca691955145b8ef","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/cerydra-avatar-7936a8ec3c37-40.avif","webpPath":"/assets/characters/cerydra-avatar-7936a8ec3c37-40.webp","avifBytes":1173,"webpBytes":1188,"avifSha256":"721db3fca8c936a60afe6f9ec696a8d89c914cd8530f7c5be53418238f82b2f7","webpSha256":"f25716cf21f9264342ec5c6dd489d2250d9dcbebae9a773374988f9988b27187"},{"width":80,"avifPath":"/assets/characters/cerydra-avatar-7936a8ec3c37-80.avif","webpPath":"/assets/characters/cerydra-avatar-7936a8ec3c37-80.webp","avifBytes":2478,"webpBytes":2776,"avifSha256":"a35d07b41f2b30f9a2422b51cde352c09fb06887aa332135110e3ccbbc9fef68","webpSha256":"f60853175cf30fcff1eec5530ce70e1d54a1e4d47d519664e2d0cf31050b8181"},{"width":160,"avifPath":"/assets/characters/cerydra-avatar-7936a8ec3c37-160.avif","webpPath":"/assets/characters/cerydra-avatar-7936a8ec3c37-160.webp","avifBytes":6367,"webpBytes":8410,"avifSha256":"58417cbfeb36181c2ab04e2e101f22c23d03c812eccc0cee782ea519169ef131","webpSha256":"b1e394f05265601476260e430db09199ddb5d78cc3fa16f46572f74da8ecd926"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('hysilens', '1410', 'hysilens', 'physical', 'nihility', 5, 'amphoreus', 'amphoreus', '3.5', 20, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"hysilens","officialId":"1410","baseCharacterId":"hysilens","names":{"zh-CN":"海瑟音","en":"Hysilens","ja":"セイレンス"},"aliases":{"zh-CN":["hai se yin","haiseyin"],"en":["hysilens"],"ja":["seirensu"]},"element":"physical","path":"nihility","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.5","releaseOrder":20,"assets":{"avatarPath":"/assets/characters/hysilens-avatar-24551611879f.png","portraitPath":"/assets/characters/hysilens-avatar-24551611879f.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/158011/85a30e672476c4112ad06839f673bd6d_615516595358800112.png","sourceUpdatedAt":"2025-07-28T14:29:26.000Z","sha256":"24551611879f84c4cda96638f6ad6475afd49d06efbaaa80598e2baff0f06795","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/hysilens-avatar-24551611879f-40.avif","webpPath":"/assets/characters/hysilens-avatar-24551611879f-40.webp","avifBytes":1108,"webpBytes":1156,"avifSha256":"ee2f895b1e69fe9fd5edfb3b4d550b2669610577f96ca03649fbfc38ab6d2e1c","webpSha256":"ee2e021b372048b69d0ca91a1be754c6819053e81141ca410b89475fc33e6c99"},{"width":80,"avifPath":"/assets/characters/hysilens-avatar-24551611879f-80.avif","webpPath":"/assets/characters/hysilens-avatar-24551611879f-80.webp","avifBytes":2352,"webpBytes":2582,"avifSha256":"15265c8b26abd74caff51f474ddb52ddd2119f1f3332c005e70498e5c97aa5f7","webpSha256":"c99de6a0d24c995434ebaf7f85127f63bb65aa8e3ea02f3a0d8b2323f915a284"},{"width":160,"avifPath":"/assets/characters/hysilens-avatar-24551611879f-160.avif","webpPath":"/assets/characters/hysilens-avatar-24551611879f-160.webp","avifBytes":5637,"webpBytes":7644,"avifSha256":"55872a8114f57e90e8c67f78bade1ff16a7419bb7dcb1af5e9352ee38ca05406","webpSha256":"705a661319511bb76d6f2314ded3f862a273a2719ede592308f5cacd607b8a37"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('dan-heng-permansor-terrae', '1414', 'dan-heng', 'physical', 'preservation', 5, 'amphoreus', 'amphoreus', '3.6', 21, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"dan-heng-permansor-terrae","officialId":"1414","baseCharacterId":"dan-heng","names":{"zh-CN":"丹恒•腾荒","en":"Dan Heng • Permansor Terrae","ja":"丹恒・騰荒"},"aliases":{"zh-CN":["dan heng teng huang","danhengtenghuang"],"en":["dan heng permansor terrae","danhengpermansorterrae"],"ja":["tankou toukou","tankoutoukou"]},"element":"physical","path":"preservation","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.6","releaseOrder":21,"assets":{"avatarPath":"/assets/characters/dan-heng-permansor-terrae-avatar-33cdba88f3c1.png","portraitPath":"/assets/characters/dan-heng-permansor-terrae-avatar-33cdba88f3c1.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/159044/67a1543c3383367986b19471148bdefe_8194524210788351868.png","sourceUpdatedAt":"2025-08-28T14:41:33.000Z","sha256":"33cdba88f3c108ecdce56ee56c0a86ab7a7bab0549643dc3e22005e2a693a16b","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/dan-heng-permansor-terrae-avatar-33cdba88f3c1-40.avif","webpPath":"/assets/characters/dan-heng-permansor-terrae-avatar-33cdba88f3c1-40.webp","avifBytes":1009,"webpBytes":1032,"avifSha256":"2ca3d626ef0572ad42c8d81acbf7828a30c420a81879e5a482d09daa7e5fcc2c","webpSha256":"d9776c39c1a60afd170434c895dd5c1ad5e0402037dd762f54ae2fe4f05df9b5"},{"width":80,"avifPath":"/assets/characters/dan-heng-permansor-terrae-avatar-33cdba88f3c1-80.avif","webpPath":"/assets/characters/dan-heng-permansor-terrae-avatar-33cdba88f3c1-80.webp","avifBytes":2089,"webpBytes":2402,"avifSha256":"c0f261100553ac50b9047e1a02fe4620147b591a4306b63a85d2f46af3e1eecf","webpSha256":"948072bcddebb1722db487e8165b49b4ec6e7a19ebf54f2dcb25d99a4e846c03"},{"width":160,"avifPath":"/assets/characters/dan-heng-permansor-terrae-avatar-33cdba88f3c1-160.avif","webpPath":"/assets/characters/dan-heng-permansor-terrae-avatar-33cdba88f3c1-160.webp","avifBytes":4930,"webpBytes":6718,"avifSha256":"cc3923904e7300d83112181337adb1512713e076d521e049e86e326062d45c94","webpSha256":"70fa6646d3178ba0a48297e41dbeb98dcf912a10955be1d1f4a568228c205b50"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('evernight', '1413', 'evernight', 'ice', 'remembrance', 5, 'amphoreus', 'amphoreus', '3.6', 21, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"evernight","officialId":"1413","baseCharacterId":"evernight","names":{"zh-CN":"长夜月","en":"Evernight","ja":"長夜月"},"aliases":{"zh-CN":["chang ye yue","changyeyue"],"en":["evernight"],"ja":["nagayozuki"]},"element":"ice","path":"remembrance","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.6","releaseOrder":21,"assets":{"avatarPath":"/assets/characters/evernight-avatar-f387ff953a14.png","portraitPath":"/assets/characters/evernight-avatar-f387ff953a14.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/159043/9afd392f1b8068e06832559fe4163529_3491875745193218742.png","sourceUpdatedAt":"2025-08-28T14:40:44.000Z","sha256":"f387ff953a142e54364e1d478f4471716ca77970cc273a4c017b71f0d981388e","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/evernight-avatar-f387ff953a14-40.avif","webpPath":"/assets/characters/evernight-avatar-f387ff953a14-40.webp","avifBytes":1034,"webpBytes":1082,"avifSha256":"a045696d7300d3a33a9b518f836f96dc7cdb91772611e213c756a29267a84812","webpSha256":"2e13fc8da831c5fa41b3e23a6e201b978452bec4bfeb2f6f99dbc11256e3451e"},{"width":80,"avifPath":"/assets/characters/evernight-avatar-f387ff953a14-80.avif","webpPath":"/assets/characters/evernight-avatar-f387ff953a14-80.webp","avifBytes":2323,"webpBytes":2602,"avifSha256":"6ba402d309ec71e2d81301b5e8065ca4596e73456143ee0aabb2711c234fa075","webpSha256":"b1c14921bc2aa89bfcbfbaa50d5b4bbca0f513ad3dd5a850111d6a2da23070bd"},{"width":160,"avifPath":"/assets/characters/evernight-avatar-f387ff953a14-160.avif","webpPath":"/assets/characters/evernight-avatar-f387ff953a14-160.webp","avifBytes":5776,"webpBytes":7726,"avifSha256":"e26c00fba2d5aed7bed7cde644cf9b407ccdf91c9f6bf9e8a8db66174dcedc5e","webpSha256":"931e9ffc2f393a495604586acfd7139358745a3a04cb0fc2526f673866dfaaab"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('cyrene', '1415', 'cyrene', 'ice', 'remembrance', 5, 'amphoreus', 'amphoreus', '3.7', 22, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"cyrene","officialId":"1415","baseCharacterId":"cyrene","names":{"zh-CN":"昔涟","en":"Cyrene","ja":"キュレネ"},"aliases":{"zh-CN":["xi lian","xilian"],"en":["cyrene"],"ja":["kyurene"]},"element":"ice","path":"remembrance","rarity":5,"factionId":"amphoreus","factionGroupId":"amphoreus","releaseVersionId":"3.7","releaseOrder":22,"assets":{"avatarPath":"/assets/characters/cyrene-avatar-ba047a95195b.png","portraitPath":"/assets/characters/cyrene-avatar-ba047a95195b.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/160346/54fb37ea230e2f6b9b7cc8a12e79329b_1607694867232341960.png","sourceUpdatedAt":"2025-10-17T15:10:58.000Z","sha256":"ba047a95195beb45a53f20a940dcc5131717e2368fc804ee54657d79378011e2","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/cyrene-avatar-ba047a95195b-40.avif","webpPath":"/assets/characters/cyrene-avatar-ba047a95195b-40.webp","avifBytes":1016,"webpBytes":1054,"avifSha256":"0e9b7d6e3e5e78f3d848586a901169f3e3aa3747dd1f8d35d5ba9fd247666452","webpSha256":"234a8cdd596e8666f53e9f8e12f7f31f072969cad122387d63eb24278976602e"},{"width":80,"avifPath":"/assets/characters/cyrene-avatar-ba047a95195b-80.avif","webpPath":"/assets/characters/cyrene-avatar-ba047a95195b-80.webp","avifBytes":2347,"webpBytes":2560,"avifSha256":"bf7f9f8c2d47cc896e4c3292f85542875f6d9679b20ecb6ee68c9776d92101f1","webpSha256":"db4eec1b68c8f69a14dbe064ff3f7f7191778633967496851bf992dc5ecd9378"},{"width":160,"avifPath":"/assets/characters/cyrene-avatar-ba047a95195b-160.avif","webpPath":"/assets/characters/cyrene-avatar-ba047a95195b-160.webp","avifBytes":6218,"webpBytes":7958,"avifSha256":"1ced692242604ac47105350746143a0071924194506627cd477c87352ef2e7a7","webpSha256":"50972f773fb4b771b691881c995041f9c223ec50f9ec34e808624f6522306b88"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('the-dahlia', '1321', 'the-dahlia', 'fire', 'nihility', 5, 'the-cremators', 'cosmic', '3.8', 23, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"the-dahlia","officialId":"1321","baseCharacterId":"the-dahlia","names":{"zh-CN":"大丽花","en":"The Dahlia","ja":"ダリア"},"aliases":{"zh-CN":["da li hua","dalihua"],"en":["the dahlia","thedahlia"],"ja":["daria"]},"element":"fire","path":"nihility","rarity":5,"factionId":"the-cremators","factionGroupId":"cosmic","releaseVersionId":"3.8","releaseOrder":23,"assets":{"avatarPath":"/assets/characters/the-dahlia-avatar-516cf749fd35.png","portraitPath":"/assets/characters/the-dahlia-avatar-516cf749fd35.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/161288/5c29fb2f28836327dac5c1e86ad3d120_2015456143368643014.png","sourceUpdatedAt":"2025-12-03T15:54:16.000Z","sha256":"516cf749fd358772ca7f9f74a69db6d14735a785352713eb514a48bb8bfab369","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/the-dahlia-avatar-516cf749fd35-40.avif","webpPath":"/assets/characters/the-dahlia-avatar-516cf749fd35-40.webp","avifBytes":1064,"webpBytes":1176,"avifSha256":"3e4a7767de36e752be7696a9af1fdf7e8272abc4685b3bbb9c42ddf0c06b51ac","webpSha256":"15fb6745e935af76c5610e2b9fe41a88cb4a76c7ffb5ddca4569255739102055"},{"width":80,"avifPath":"/assets/characters/the-dahlia-avatar-516cf749fd35-80.avif","webpPath":"/assets/characters/the-dahlia-avatar-516cf749fd35-80.webp","avifBytes":2230,"webpBytes":2578,"avifSha256":"4f9666c6e8c59699b4acc1cc856d79110b2667b902d28aa127e6082a7736bad5","webpSha256":"c28e1f1ec275fae759e962c8024a307b4e41bd8d043cdb448b08b64c0a06fd72"},{"width":160,"avifPath":"/assets/characters/the-dahlia-avatar-516cf749fd35-160.avif","webpPath":"/assets/characters/the-dahlia-avatar-516cf749fd35-160.webp","avifBytes":5440,"webpBytes":7544,"avifSha256":"919b0b6c6931a070797044b671b1adb14500c2d7c5b86fdf3d0230b4426e5500","webpSha256":"dbcf9f1b5d9bb3d1e9173c47c7d20fbd3c005861abfdc2509bfbdccd55b8ddfb"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('sparxie', '1501', 'sparxie', 'fire', 'elation', 5, 'masked-fools', 'cosmic', '4.0', 24, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"sparxie","officialId":"1501","baseCharacterId":"sparxie","names":{"zh-CN":"火花","en":"Sparxie","ja":"火花"},"aliases":{"zh-CN":["huo hua","huohua"],"en":["sparxie"],"ja":["sparxie"]},"element":"fire","path":"elation","rarity":5,"factionId":"masked-fools","factionGroupId":"cosmic","releaseVersionId":"4.0","releaseOrder":24,"assets":{"avatarPath":"/assets/characters/sparxie-avatar-59851d4b7fcc.png","portraitPath":"/assets/characters/sparxie-avatar-59851d4b7fcc.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/162607/46ddcca9e2579e4878ef46e4231ae781_3507480203580811267.png","sourceUpdatedAt":"2026-02-06T15:22:52.000Z","sha256":"59851d4b7fccfb6939bcf4efaad8c15a4077eac3382dd22b10b5b5198ee75f99","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/sparxie-avatar-59851d4b7fcc-40.avif","webpPath":"/assets/characters/sparxie-avatar-59851d4b7fcc-40.webp","avifBytes":1106,"webpBytes":1170,"avifSha256":"bb86668890e936337983641d6ec050eabb30fa909e6b6a94ac8c437df7b57d28","webpSha256":"d42e5d1ba25dfb2116bae8490c7552b7fcaf17189ae905c64af0c407794030d2"},{"width":80,"avifPath":"/assets/characters/sparxie-avatar-59851d4b7fcc-80.avif","webpPath":"/assets/characters/sparxie-avatar-59851d4b7fcc-80.webp","avifBytes":2325,"webpBytes":2666,"avifSha256":"1ce1dd2743eccb707df350ba205c6375342e645d4d669dcb198c743779f5e17f","webpSha256":"dbe74502232d652ff6f65dccbba24f38d6ddc55c8476a19691200f800743d51d"},{"width":160,"avifPath":"/assets/characters/sparxie-avatar-59851d4b7fcc-160.avif","webpPath":"/assets/characters/sparxie-avatar-59851d4b7fcc-160.webp","avifBytes":5848,"webpBytes":7984,"avifSha256":"1f059e3bbe9c014d4495deca9f8033fa63182c6d2142885349b9391e24cc25f8","webpSha256":"c4c0cc23aaed8575109ee3403a7368f0afa604bf388357171141cf1a040fc1ce"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('yao-guang', '1502', 'yao-guang', 'physical', 'elation', 5, 'xianzhou-yuque', 'xianzhou-alliance', '4.0', 24, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"yao-guang","officialId":"1502","baseCharacterId":"yao-guang","names":{"zh-CN":"爻光","en":"Yao Guang","ja":"爻光"},"aliases":{"zh-CN":["yao guang","yaoguang"],"en":["yao guang","yaoguang"],"ja":["yao guang","yaoguang"]},"element":"physical","path":"elation","rarity":5,"factionId":"xianzhou-yuque","factionGroupId":"xianzhou-alliance","releaseVersionId":"4.0","releaseOrder":24,"assets":{"avatarPath":"/assets/characters/yao-guang-avatar-3c09d56ce7ae.png","portraitPath":"/assets/characters/yao-guang-avatar-3c09d56ce7ae.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/162605/d09846c74f92d39cfdc502b8e237a46f_6203802696928497301.png","sourceUpdatedAt":"2026-02-06T15:17:35.000Z","sha256":"3c09d56ce7ae452e74ce7d4e092375e3b4809b094c401cff7fcc39c260e9e158","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/yao-guang-avatar-3c09d56ce7ae-40.avif","webpPath":"/assets/characters/yao-guang-avatar-3c09d56ce7ae-40.webp","avifBytes":1095,"webpBytes":1200,"avifSha256":"bedbee358ec026c0b8b3fef07335590f71c4ca7bc4a9fcc46eb3530a7a23fe3e","webpSha256":"05f613bff8584d73e34be01a6edc0d35f270c16ef9f8812f4ebf5011f9af2782"},{"width":80,"avifPath":"/assets/characters/yao-guang-avatar-3c09d56ce7ae-80.avif","webpPath":"/assets/characters/yao-guang-avatar-3c09d56ce7ae-80.webp","avifBytes":2463,"webpBytes":2756,"avifSha256":"f3b373a7e0791ed005483c735c3ff81e834ed80ed267be76a8dada2a81ecfb30","webpSha256":"b0ea35d325d8dd45d06f67655e659c5da4a4f2f9bf3f3878b1c708ff9afe77ea"},{"width":160,"avifPath":"/assets/characters/yao-guang-avatar-3c09d56ce7ae-160.avif","webpPath":"/assets/characters/yao-guang-avatar-3c09d56ce7ae-160.webp","avifBytes":6154,"webpBytes":8344,"avifSha256":"f5ae82823e1039df3e6fac007c4818f804d4f57b10112c615e6cc2a751d6ed21","webpSha256":"7cfc18fb5e59d61d1a1e9be9ad2383d5b636c8fa909b6860600bf95b516bbe2d"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('ashveil', '1504', 'ashveil', 'lightning', 'hunt', 5, 'galaxy-rangers', 'cosmic', '4.1', 25, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"ashveil","officialId":"1504","baseCharacterId":"ashveil","names":{"zh-CN":"不死途","en":"Ashveil","ja":"不死途"},"aliases":{"zh-CN":["bu si tu","busitu"],"en":["ashveil"],"ja":["ashveil"]},"element":"lightning","path":"hunt","rarity":5,"factionId":"galaxy-rangers","factionGroupId":"cosmic","releaseVersionId":"4.1","releaseOrder":25,"assets":{"avatarPath":"/assets/characters/ashveil-avatar-796c6588d0c1.png","portraitPath":"/assets/characters/ashveil-avatar-796c6588d0c1.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/163118/3dc92660fc87730376952fbb62e48c43_9152923416788276017.png","sourceUpdatedAt":"2026-03-12T14:24:09.000Z","sha256":"796c6588d0c12c063443c80b15f7d16b59282540c4c7e6c9c4b17d4cbfe8fcdc","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/ashveil-avatar-796c6588d0c1-40.avif","webpPath":"/assets/characters/ashveil-avatar-796c6588d0c1-40.webp","avifBytes":1132,"webpBytes":1256,"avifSha256":"61f8770a0c3e7707fbd2d470295fb43112ce0a6f95175d839d52e02c23926f9f","webpSha256":"20f4459b1ccd7810f5fe48d56b4eddf9b5b68ec659d2b8d14c36997ee80309bc"},{"width":80,"avifPath":"/assets/characters/ashveil-avatar-796c6588d0c1-80.avif","webpPath":"/assets/characters/ashveil-avatar-796c6588d0c1-80.webp","avifBytes":2570,"webpBytes":2906,"avifSha256":"02a48d4b378ebffc08ad4d8199da1cf581f4970a8b4a422eec764028a3cc652f","webpSha256":"3570e4f502bf052f7b78a1ea6a1683f4fe4ec58b68081ef2863b900b994c24c7"},{"width":160,"avifPath":"/assets/characters/ashveil-avatar-796c6588d0c1-160.avif","webpPath":"/assets/characters/ashveil-avatar-796c6588d0c1-160.webp","avifBytes":6252,"webpBytes":8474,"avifSha256":"401967a13493e6ca9df18d1953bc79ec7f64d895ad59f68232f37568fb6dc619","webpSha256":"a40fa531835ff2e93fcf41c094ac0117c51789b29cf480dead7957d93cd7a5ec"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('evanescia', '1505', 'evanescia', 'physical', 'elation', 5, 'planarcadia', 'planarcadia', '4.2', 26, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"evanescia","officialId":"1505","baseCharacterId":"evanescia","names":{"zh-CN":"绯英","en":"Evanescia","ja":"緋英"},"aliases":{"zh-CN":["fei ying","feiying"],"en":["evanescia"],"ja":["evanescia"]},"element":"physical","path":"elation","rarity":5,"factionId":"planarcadia","factionGroupId":"planarcadia","releaseVersionId":"4.2","releaseOrder":26,"assets":{"avatarPath":"/assets/characters/evanescia-avatar-e4446664c7bb.png","portraitPath":"/assets/characters/evanescia-avatar-e4446664c7bb.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/163485/5504bc6527fc4074d6743dab62f2be25_6605944294444025287.png","sourceUpdatedAt":"2026-04-08T18:16:22.000Z","sha256":"e4446664c7bba60c44a65c34f2a2ecf389d4d9ff4e1282fdb8d28d6e6b5e93d8","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/evanescia-avatar-e4446664c7bb-40.avif","webpPath":"/assets/characters/evanescia-avatar-e4446664c7bb-40.webp","avifBytes":1101,"webpBytes":1194,"avifSha256":"c8be5c9123a99a59a95b63141b74e10586d4eb3764abe75ee2a2e973167c5234","webpSha256":"29d3f51cfb0af5bd9cbdb7f88b8d40896f84aa299d3799d7133985d90174aa73"},{"width":80,"avifPath":"/assets/characters/evanescia-avatar-e4446664c7bb-80.avif","webpPath":"/assets/characters/evanescia-avatar-e4446664c7bb-80.webp","avifBytes":2397,"webpBytes":2738,"avifSha256":"78db187f8cbe5617de580abbcbe60971d177e9e92c964777c726515478ce6e35","webpSha256":"4da136ada9cf9eb8b81cdb58e46eeb68ece00c3ceaee375732061aa35d36977b"},{"width":160,"avifPath":"/assets/characters/evanescia-avatar-e4446664c7bb-160.avif","webpPath":"/assets/characters/evanescia-avatar-e4446664c7bb-160.webp","avifBytes":5854,"webpBytes":7972,"avifSha256":"1b6e5b17c21e4d9a478160e5f1153c632f51db62ac0e480d00ed11b848c5f6a0","webpSha256":"97379fedd63d787eb648a5fd4dd561867f1d3359856e3b24477e0ebc9268afd8"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('silver-wolf-lv-999', '1506', 'silver-wolf', 'imaginary', 'elation', 5, 'stellaron-hunters', 'stellaron-hunters', '4.2', 26, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"silver-wolf-lv-999","officialId":"1506","baseCharacterId":"silver-wolf","names":{"zh-CN":"银狼LV.999","en":"Silver Wolf LV.999","ja":"銀狼LV.999"},"aliases":{"zh-CN":["yin lang","yinlang"],"en":["silver wolf lv 999","silverwolflv999"],"ja":["silver wolf lv 999","silverwolflv999"]},"element":"imaginary","path":"elation","rarity":5,"factionId":"stellaron-hunters","factionGroupId":"stellaron-hunters","releaseVersionId":"4.2","releaseOrder":26,"assets":{"avatarPath":"/assets/characters/silver-wolf-lv-999-avatar-d86eec550297.png","portraitPath":"/assets/characters/silver-wolf-lv-999-avatar-d86eec550297.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/163484/f9ec0f43294492ae8a4834bdb5274a58_7208557037416297672.png","sourceUpdatedAt":"2026-04-08T18:16:02.000Z","sha256":"d86eec550297ddf5fc1dc5cae9d7d43e6963179c833fee31bbe909af1ae9001f","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/silver-wolf-lv-999-avatar-d86eec550297-40.avif","webpPath":"/assets/characters/silver-wolf-lv-999-avatar-d86eec550297-40.webp","avifBytes":1132,"webpBytes":1250,"avifSha256":"cbf47467c9464dc19756babf013f52d17ea1c9ee98aa43179afbe37f71866579","webpSha256":"8104908b46b422cb5ab6cb765487952ccfdcf0ffe6c1bc04980849efe68755ae"},{"width":80,"avifPath":"/assets/characters/silver-wolf-lv-999-avatar-d86eec550297-80.avif","webpPath":"/assets/characters/silver-wolf-lv-999-avatar-d86eec550297-80.webp","avifBytes":2561,"webpBytes":2938,"avifSha256":"8dfe9fa889e701e8e48387ff03a1ff8005019bb4093e57736801be492c38ca5c","webpSha256":"29bfeb1967c72f29a4bebe7561752bcf1a2a3dd7025c39c32fa5586933f02f5e"},{"width":160,"avifPath":"/assets/characters/silver-wolf-lv-999-avatar-d86eec550297-160.avif","webpPath":"/assets/characters/silver-wolf-lv-999-avatar-d86eec550297-160.webp","avifBytes":6570,"webpBytes":8852,"avifSha256":"ac0e6bb6c2f51b27ca96ce589db59c8b8221b79473ec5a1cde9a6c39df078bb0","webpSha256":"0f10ebd0396e122999aa2f320a05adfaecf3ce5e7bc6cf50e0c3b40d547136b8"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('trailblazer-elation', '8009', 'trailblazer', 'lightning', 'elation', 5, 'astral-express', 'astral-express', '4.2', 26, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"trailblazer-elation","officialId":"8009","baseCharacterId":"trailblazer","names":{"zh-CN":"开拓者·欢愉","en":"Trailblazer · Elation","ja":"開拓者・愉悦"},"aliases":{"zh-CN":["开拓者","欢愉主角","kai tuo zhe huan yu","kaituozhehuanyu","kai tuo zhe","kaituozhe","huan yu zhu jue","huanyuzhujue"],"en":["Trailblazer","Elation Trailblazer","trailblazer elation","trailblazerelation","elationtrailblazer"],"ja":["開拓者","愉悦開拓者","trailblazer elation","trailblazerelation","kaitakusha yuetsu","kaitakushayuetsu"]},"element":"lightning","path":"elation","rarity":5,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"4.2","releaseOrder":26,"assets":{"avatarPath":"/assets/characters/trailblazer-elation-avatar-5e5432f4e42a.png","portraitPath":"/assets/characters/trailblazer-elation-avatar-5e5432f4e42a.png","sourceUrl":"https://raw.githubusercontent.com/Mar-7th/StarRailRes/f1b643637554019f6d611ac9240410bbe9698da8/icon/character/8009.png","sourceUpdatedAt":"2026-08-26T15:43:40.000Z","sha256":"5e5432f4e42a39993153381252360518e0ec62ef6f93b4f493122b27b3d0e6d2","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/trailblazer-elation-avatar-5e5432f4e42a-40.avif","webpPath":"/assets/characters/trailblazer-elation-avatar-5e5432f4e42a-40.webp","avifBytes":1337,"webpBytes":1658,"avifSha256":"7b7be054b947768d475a668893b24505a543f3652975745b59ba55305234b768","webpSha256":"2bb2e30f105aed6846549aa3c8ea382da9f533277c11275448c2d19f860b489e"},{"width":80,"avifPath":"/assets/characters/trailblazer-elation-avatar-5e5432f4e42a-80.avif","webpPath":"/assets/characters/trailblazer-elation-avatar-5e5432f4e42a-80.webp","avifBytes":2845,"webpBytes":4580,"avifSha256":"5c96716bf6faa941b9eeb858d0f4476c4e3b7a98e81172e96f2a98bf0575a71f","webpSha256":"7eda1fba9a6810a4b15c9b724dc0303da8e9a8469536ff59ee0603016125db6c"},{"width":160,"avifPath":"/assets/characters/trailblazer-elation-avatar-5e5432f4e42a-160.avif","webpPath":"/assets/characters/trailblazer-elation-avatar-5e5432f4e42a-160.webp","avifBytes":6810,"webpBytes":12394,"avifSha256":"fcf47e1131037e8171b6acc8cdcf01bbc1473d5c28afb8751cc6086fb13e7744","webpSha256":"e35c20312b47c09fa7a8fffcdd7e4a7a7654c7b1e016f0125ac681a42be37d34"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('mortenax-blade', '1507', 'blade', 'fire', 'nihility', 5, 'stellaron-hunters', 'stellaron-hunters', '4.3', 27, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"mortenax-blade","officialId":"1507","baseCharacterId":"blade","names":{"zh-CN":"千冶•刃","en":"Mortenax Blade","ja":"千冶・刃"},"aliases":{"zh-CN":["qian ye ren","qianyeren"],"en":["mortenax blade","mortenaxblade"],"ja":["mortenax blade","mortenaxblade"]},"element":"fire","path":"nihility","rarity":5,"factionId":"stellaron-hunters","factionGroupId":"stellaron-hunters","releaseVersionId":"4.3","releaseOrder":27,"assets":{"avatarPath":"/assets/characters/mortenax-blade-avatar-2e609e325d48.png","portraitPath":"/assets/characters/mortenax-blade-avatar-2e609e325d48.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/163908/3f039b805844fef13149dc64fbb8da24_8872487716010108739.png","sourceUpdatedAt":"2026-05-11T16:43:30.000Z","sha256":"2e609e325d48365db245a3e83e38cd7e34de6ac994bd545d6b547ab1657f2795","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/mortenax-blade-avatar-2e609e325d48-40.avif","webpPath":"/assets/characters/mortenax-blade-avatar-2e609e325d48-40.webp","avifBytes":1004,"webpBytes":1032,"avifSha256":"6f16e22a9439debe41056be93c85076cd9f6707895a6b649deb4175468e97ca6","webpSha256":"10e524a3d56220486c0c4596771de8a57288f69b915849183a987094ef1366bf"},{"width":80,"avifPath":"/assets/characters/mortenax-blade-avatar-2e609e325d48-80.avif","webpPath":"/assets/characters/mortenax-blade-avatar-2e609e325d48-80.webp","avifBytes":2044,"webpBytes":2338,"avifSha256":"8ffac76a5e7ec4674f7bd17a622bd9d11d078643328435fec4ca67cee147bfdb","webpSha256":"66fca3fe32f8cfa8e63b6d4a8b2a8bd7e7648a925a7f131cdbe0e91e0e1fea0d"},{"width":160,"avifPath":"/assets/characters/mortenax-blade-avatar-2e609e325d48-160.avif","webpPath":"/assets/characters/mortenax-blade-avatar-2e609e325d48-160.webp","avifBytes":5060,"webpBytes":6826,"avifSha256":"8e2e307e5375ebb4f59fff5cfb18b4873fe70f00f78b948a9070c1bcb7f0466c","webpSha256":"a11fbf9e38b19e81db67d638dbaa2d402ab349e576c26ea23225104b4d560902"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('gilgamesh', '1509', 'gilgamesh', 'lightning', 'destruction', 5, 'fate-stay-night', 'another-world', '4.4', 28, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"gilgamesh","officialId":"1509","baseCharacterId":"gilgamesh","names":{"zh-CN":"吉尔伽美什","en":"Gilgamesh","ja":"ギルガメッシュ"},"aliases":{"zh-CN":["ji er jia mei shen","jierjiameishen"],"en":["gilgamesh"],"ja":["girugamesshu"]},"element":"lightning","path":"destruction","rarity":5,"factionId":"fate-stay-night","factionGroupId":"another-world","releaseVersionId":"4.4","releaseOrder":28,"assets":{"avatarPath":"/assets/characters/gilgamesh-avatar-0f2e8e491b3a.png","portraitPath":"/assets/characters/gilgamesh-avatar-0f2e8e491b3a.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/164608/eab97a7d20f2e622c78a8cbe2cd02792_3717636757217679747.png","sourceUpdatedAt":"2026-06-03T17:03:48.000Z","sha256":"0f2e8e491b3a8151429a8c066fdeb4c21e4bd2206d9ac26d70a46c739845b109","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/gilgamesh-avatar-0f2e8e491b3a-40.avif","webpPath":"/assets/characters/gilgamesh-avatar-0f2e8e491b3a-40.webp","avifBytes":1077,"webpBytes":1112,"avifSha256":"c54ba68fa1db76b1a9a418933a2b58c6de05b163cdb9f9bd87e54fec3e1eebb5","webpSha256":"0be27cadbbe7d7e69ace4712868c96d37fe028278abccd5ee7285dc944f6849f"},{"width":80,"avifPath":"/assets/characters/gilgamesh-avatar-0f2e8e491b3a-80.avif","webpPath":"/assets/characters/gilgamesh-avatar-0f2e8e491b3a-80.webp","avifBytes":2180,"webpBytes":2436,"avifSha256":"47cb30db89394d8774a37ec2af777a05a4335cc239fe47030c404a23457ac7f4","webpSha256":"b1801c12b1cca6474c637daba83d5b8855c5e4ea32401aff3174725c1ae6227d"},{"width":160,"avifPath":"/assets/characters/gilgamesh-avatar-0f2e8e491b3a-160.avif","webpPath":"/assets/characters/gilgamesh-avatar-0f2e8e491b3a-160.webp","avifBytes":4878,"webpBytes":6728,"avifSha256":"1f33ccf845e62e9ab2ef2e54b0adbb88176b86cfca245e3c380d5d02922ad971","webpSha256":"d15f0385cc8de69a8d58fa9068980892d2b151be313f7ae164b14119319b92b9"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('himeko-nova', '1510', 'himeko', 'fire', 'erudition', 5, 'astral-express', 'astral-express', '4.4', 28, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"himeko-nova","officialId":"1510","baseCharacterId":"himeko","names":{"zh-CN":"姬子•启行","en":"Himeko • Nova","ja":"姫子・旅立ち"},"aliases":{"zh-CN":["ji zi qi xing","jiziqixing"],"en":["himeko nova","himekonova"],"ja":["chi"]},"element":"fire","path":"erudition","rarity":5,"factionId":"astral-express","factionGroupId":"astral-express","releaseVersionId":"4.4","releaseOrder":28,"assets":{"avatarPath":"/assets/characters/himeko-nova-avatar-21948f59b870.png","portraitPath":"/assets/characters/himeko-nova-avatar-21948f59b870.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/164773/c5b7769a158a07bd6a2b80ac2e4cfd67_5579859607159442001.png","sourceUpdatedAt":"2026-06-16T15:00:59.000Z","sha256":"21948f59b8701f0130e396698867a90bebbb77668f2a65221925b03545c1e85d","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/himeko-nova-avatar-21948f59b870-40.avif","webpPath":"/assets/characters/himeko-nova-avatar-21948f59b870-40.webp","avifBytes":1148,"webpBytes":1218,"avifSha256":"3027695a8dedb0732e68658549a9045969ea41139c310113fab81a831c8d69c5","webpSha256":"a6782531cf15ed1e3d3db61a40c398931ca474d3b4182b2b5873aaaba9882018"},{"width":80,"avifPath":"/assets/characters/himeko-nova-avatar-21948f59b870-80.avif","webpPath":"/assets/characters/himeko-nova-avatar-21948f59b870-80.webp","avifBytes":2493,"webpBytes":2814,"avifSha256":"345f0a1f26d07c72a8427db0590afd4595e7bc788717b3932e2c643dfb735561","webpSha256":"359e798f85925765b24b01c47f643ab39af1cf7db0eba02d34365e05f1385b70"},{"width":160,"avifPath":"/assets/characters/himeko-nova-avatar-21948f59b870-160.avif","webpPath":"/assets/characters/himeko-nova-avatar-21948f59b870-160.webp","avifBytes":5863,"webpBytes":7854,"avifSha256":"bda0d3cff9c03b2bfeb0668fb8489244d29357ef54c4ea88cdecb083ea97eb25","webpSha256":"78b39e24efc03d697ee5d3caaf3e87424be5cba8c740c77bf3ff5a05d5ec2c56"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('rin-tohsaka', '1508', 'rin-tohsaka', 'quantum', 'erudition', 5, 'fate-stay-night', 'another-world', '4.4', 28, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"rin-tohsaka","officialId":"1508","baseCharacterId":"rin-tohsaka","names":{"zh-CN":"远坂凛","en":"Rin Tohsaka","ja":"遠坂凛"},"aliases":{"zh-CN":["yuan ban lin","yuanbanlin"],"en":["rin tohsaka","rintohsaka"],"ja":["rin tohsaka","rintohsaka"]},"element":"quantum","path":"erudition","rarity":5,"factionId":"fate-stay-night","factionGroupId":"another-world","releaseVersionId":"4.4","releaseOrder":28,"assets":{"avatarPath":"/assets/characters/rin-tohsaka-avatar-f7505f0f22a6.png","portraitPath":"/assets/characters/rin-tohsaka-avatar-f7505f0f22a6.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/164607/0e8ff84f06000f23307c1aed931ea68e_4824633473356387700.png","sourceUpdatedAt":"2026-06-03T17:03:14.000Z","sha256":"f7505f0f22a6296e400d5ad5dd2a6deeeecce09df4324c64c14fdf39266cf0ad","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/rin-tohsaka-avatar-f7505f0f22a6-40.avif","webpPath":"/assets/characters/rin-tohsaka-avatar-f7505f0f22a6-40.webp","avifBytes":1048,"webpBytes":1118,"avifSha256":"4ab8c883ac70103a5836db6876029217c859c6940a704c6829ca6ccd6ac75deb","webpSha256":"001e338f605c32cbcb73686afc705e514c9371a0a7130877689897736c6b11f9"},{"width":80,"avifPath":"/assets/characters/rin-tohsaka-avatar-f7505f0f22a6-80.avif","webpPath":"/assets/characters/rin-tohsaka-avatar-f7505f0f22a6-80.webp","avifBytes":2295,"webpBytes":2604,"avifSha256":"c26f084b46486cb09e07b1c7287399229b4bbf5e847bb25cce3084c8e2d69b24","webpSha256":"5a9ae958f278e8542420464489749832d08461bf41b55ace30c83a5c92193211"},{"width":160,"avifPath":"/assets/characters/rin-tohsaka-avatar-f7505f0f22a6-160.avif","webpPath":"/assets/characters/rin-tohsaka-avatar-f7505f0f22a6-160.webp","avifBytes":5716,"webpBytes":7524,"avifSha256":"130e4f250c47f2fc4cbf3b9016dec4a8dc7631994f38e5e7c0708dd5165a57f6","webpSha256":"bd9b2b99c8dfc4c5e7eff99ced648b870482cd12bc82a45607adf252c5320a99"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('aventurine-waveflair', '1513', 'aventurine-waveflair', 'quantum', 'elation', 5, 'ipc', 'ipc', '4.5', 29, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"aventurine-waveflair","officialId":"1513","baseCharacterId":"aventurine-waveflair","names":{"zh-CN":"砂金•戏浪","en":"Aventurine • Waveflair","ja":"アベンチュリン・波と戯れる夏"},"aliases":{"zh-CN":["sha jin xi lang","shajinxilang"],"en":["aventurine waveflair","aventurinewaveflair"],"ja":["abenchurin to reru","abenchurintoreru"]},"element":"quantum","path":"elation","rarity":5,"factionId":"ipc","factionGroupId":"ipc","releaseVersionId":"4.5","releaseOrder":29,"assets":{"avatarPath":"/assets/characters/aventurine-waveflair-avatar-065d75ab338c.png","portraitPath":"/assets/characters/aventurine-waveflair-avatar-065d75ab338c.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/165438/4230467ccb497b066f1641ff693b9e25_4037609123022717053.png","sourceUpdatedAt":"2026-07-30T15:45:03.000Z","sha256":"065d75ab338c226770c370644064a287cbfe7f12e5a087163b84d97fca89942f","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/aventurine-waveflair-avatar-065d75ab338c-40.avif","webpPath":"/assets/characters/aventurine-waveflair-avatar-065d75ab338c-40.webp","avifBytes":1107,"webpBytes":1136,"avifSha256":"e44ad9372b8ff932875b124ea56ce3d50b24115b95d745cad02cec7eaf3b3740","webpSha256":"9d1dc4e779c31679d471c56c99a84a8db2ca850b644c542126afc124ae4f3307"},{"width":80,"avifPath":"/assets/characters/aventurine-waveflair-avatar-065d75ab338c-80.avif","webpPath":"/assets/characters/aventurine-waveflair-avatar-065d75ab338c-80.webp","avifBytes":2290,"webpBytes":2600,"avifSha256":"a3b164d3e42f6ec4022a5a610516ae1918ab2d7bcfd8f0d141c56ef9a0f5e4d7","webpSha256":"e7778c0f767d53615d0eda9cc4dc92956f534d6bc0f1f32f63735fb4c842410f"},{"width":160,"avifPath":"/assets/characters/aventurine-waveflair-avatar-065d75ab338c-160.avif","webpPath":"/assets/characters/aventurine-waveflair-avatar-065d75ab338c-160.webp","avifBytes":5528,"webpBytes":7426,"avifSha256":"5d0b5ace7562de23b877157d4099db7b888933714cb5d67a6523dd8e7f8b2153","webpSha256":"0f33ccf3d0b674ce66efca20d2af6e5c7475f5e940a2b7b1b234cbe7cfe4027c"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
VALUES ('robin-summeretto', '1512', 'robin-summeretto', 'wind', 'remembrance', 5, 'penacony', 'penacony', '4.5', 29, 1, 1, 'hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530', '{"id":"robin-summeretto","officialId":"1512","baseCharacterId":"robin-summeretto","names":{"zh-CN":"知更鸟•晴歌","en":"Robin • Summeretto","ja":"ロビン・夏空の歌"},"aliases":{"zh-CN":["zhi geng niao qing ge","zhigengniaoqingge"],"en":["robin summeretto","robinsummeretto"],"ja":["robin no","robinno"]},"element":"wind","path":"remembrance","rarity":5,"factionId":"penacony","factionGroupId":"penacony","releaseVersionId":"4.5","releaseOrder":29,"assets":{"avatarPath":"/assets/characters/robin-summeretto-avatar-13163e99fe13.png","portraitPath":"/assets/characters/robin-summeretto-avatar-13163e99fe13.png","sourceUrl":"https://fastcdn.hoyoverse.com/content-v2/hkrpg/165435/918e9fb33aa9ea405f5bac6733462567_5622650737230269602.png","sourceUpdatedAt":"2026-07-30T15:39:37.000Z","sha256":"13163e99fe13ce627aceb6927c06146c5ffef36671b0a42e6a1167a45130c7b2","rightsNotice":"Game names and artwork © their respective rights holders. Obtained from an official HoYoverse surface for this unofficial, non-commercial fan project.","responsive":[{"width":40,"avifPath":"/assets/characters/robin-summeretto-avatar-13163e99fe13-40.avif","webpPath":"/assets/characters/robin-summeretto-avatar-13163e99fe13-40.webp","avifBytes":1106,"webpBytes":1190,"avifSha256":"a408667be25995d95b3fc982331bc6dc85f20b1235ec6be453648b0654d7764b","webpSha256":"6cf8d0b3c6b5f1609c0c3a3b51d7a4d04c8476381abeb3c04947d42f2d14207f"},{"width":80,"avifPath":"/assets/characters/robin-summeretto-avatar-13163e99fe13-80.avif","webpPath":"/assets/characters/robin-summeretto-avatar-13163e99fe13-80.webp","avifBytes":2537,"webpBytes":2828,"avifSha256":"cabc09303a7e509e0660e478b52b204b5e2d46e069df7480aadbc7e80864b5d5","webpSha256":"b7742d3cfadefea2bc6083bf42e4d7d06651e1983e4daad4f3ecd090abac52f4"},{"width":160,"avifPath":"/assets/characters/robin-summeretto-avatar-13163e99fe13-160.avif","webpPath":"/assets/characters/robin-summeretto-avatar-13163e99fe13-160.webp","avifBytes":6344,"webpBytes":8432,"avifSha256":"afd024d52a2dd067b7d60dfb113384a7731a5378aaabc67ccc4c8d96b91c967e","webpSha256":"8bbdb7ee344a1d57a632f89f3c053a4065f2d7147dd1523371b379a7485b71ab"}]},"enabled":true,"targetEligible":true,"sourceRevision":"hoyo-content-v2-cd6dbfdbdbf0+starrailres-f1b643637554+overrides-c09562637530"}', 1787759020, 1787759020)
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
SET enabled = 0, target_eligible = 0, updated_at = 1787759020
WHERE id NOT IN ('arlan', 'asta', 'bailu', 'bronya', 'clara', 'dan-heng', 'gepard', 'herta', 'himeko', 'hook', 'jing-yuan', 'march-7th', 'natasha', 'pela', 'qingque', 'sampo', 'seele', 'serval', 'sushang', 'tingyun', 'trailblazer-destruction', 'trailblazer-preservation', 'welt', 'yanqing', 'luocha', 'silver-wolf', 'yukong', 'blade', 'kafka', 'luka', 'dan-heng-il', 'fu-xuan', 'lynx', 'guinaifen', 'jingliu', 'topaz-and-numby', 'argenti', 'hanya', 'huohuo', 'dr-ratio', 'ruan-mei', 'xueyi', 'black-swan', 'misha', 'sparkle', 'acheron', 'aventurine', 'gallagher', 'boothill', 'robin', 'trailblazer-harmony', 'firefly', 'jade', 'jiaoqiu', 'march-7th-hunt', 'yunli', 'feixiao', 'lingsha', 'moze', 'rappa', 'fugue', 'sunday', 'aglaea', 'the-herta', 'trailblazer-remembrance', 'mydei', 'tribbie', 'anaxa', 'castorice', 'cipher', 'hyacine', 'archer', 'phainon', 'saber', 'cerydra', 'hysilens', 'dan-heng-permansor-terrae', 'evernight', 'cyrene', 'the-dahlia', 'sparxie', 'yao-guang', 'ashveil', 'evanescia', 'silver-wolf-lv-999', 'trailblazer-elation', 'mortenax-blade', 'gilgamesh', 'himeko-nova', 'rin-tohsaka', 'aventurine-waveflair', 'robin-summeretto')
  AND (enabled <> 0 OR target_eligible <> 0);
