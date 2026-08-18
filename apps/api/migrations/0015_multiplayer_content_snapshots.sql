-- 多人归档保存房间创建时的内容版本、候选池和字段规则快照。
ALTER TABLE matches ADD COLUMN mode_id TEXT NOT NULL DEFAULT 'playable';
ALTER TABLE matches ADD COLUMN pool_rule_version TEXT NOT NULL DEFAULT '1.0.0';
ALTER TABLE matches ADD COLUMN manifest_version TEXT NOT NULL DEFAULT '1.0.0';
ALTER TABLE matches ADD COLUMN candidate_pool_json TEXT NOT NULL DEFAULT '{}'
  CHECK (json_valid(candidate_pool_json));
ALTER TABLE matches ADD COLUMN field_rules_json TEXT NOT NULL DEFAULT '{}'
  CHECK (json_valid(field_rules_json));

-- T03 之前的归档只能在迁移时补取目标；一旦写入便不再回退到后续发布内容。
UPDATE match_rounds
SET target_json = (
  SELECT characters.payload_json
  FROM characters
  WHERE characters.id = match_rounds.target_character_id
)
WHERE target_json IS NULL;
