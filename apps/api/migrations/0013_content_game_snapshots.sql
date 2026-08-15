-- 单人对局迁移到统一内容模式/活动契约，并保存创建时的判题快照。
ALTER TABLE games ADD COLUMN mode_id TEXT NOT NULL DEFAULT 'playable';
ALTER TABLE games ADD COLUMN activity_id TEXT NOT NULL DEFAULT 'daily';
ALTER TABLE games ADD COLUMN pool_rule_version TEXT NOT NULL DEFAULT '1.0.0';
ALTER TABLE games ADD COLUMN manifest_version TEXT NOT NULL DEFAULT '1.0.0';
ALTER TABLE games ADD COLUMN target_payload_json TEXT NOT NULL DEFAULT '{}';
ALTER TABLE games ADD COLUMN candidate_pool_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE games ADD COLUMN field_rules_json TEXT NOT NULL DEFAULT '[]';

UPDATE games
SET activity_id = CASE WHEN mode = 'random' THEN 'practice' ELSE 'daily' END,
    target_payload_json = COALESCE(
      (SELECT payload_json FROM characters WHERE characters.id = games.target_character_id),
      '{}'
    ),
    candidate_pool_json = COALESCE(
      (SELECT json_group_array(id) FROM characters WHERE enabled = 1),
      '[]'
    ),
    field_rules_json = '["element","path","rarity","faction","version"]';

CREATE INDEX games_content_activity_idx ON games(user_id, activity_id, started_at DESC);
