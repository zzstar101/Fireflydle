-- 单人对局已冻结完整实体快照，不再要求实体必须来自普通角色表。
PRAGMA foreign_keys = OFF;

CREATE TABLE games_next (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  mode TEXT NOT NULL CHECK (mode IN ('daily', 'random')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('casual', 'standard', 'hard')),
  date_key TEXT,
  target_character_id TEXT NOT NULL,
  max_attempts INTEGER NOT NULL CHECK (max_attempts > 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'won', 'lost', 'conceded', 'expired')),
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  updated_at INTEGER NOT NULL,
  mode_id TEXT NOT NULL DEFAULT 'playable',
  activity_id TEXT NOT NULL DEFAULT 'daily',
  pool_rule_version TEXT NOT NULL DEFAULT '1.0.0',
  manifest_version TEXT NOT NULL DEFAULT '1.0.0',
  target_payload_json TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(target_payload_json)),
  candidate_pool_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(candidate_pool_json)),
  field_rules_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(field_rules_json))
) STRICT;

INSERT INTO games_next SELECT * FROM games;
DROP TABLE games;
ALTER TABLE games_next RENAME TO games;

CREATE UNIQUE INDEX games_daily_once_idx
  ON games(user_id, date_key, difficulty)
  WHERE mode = 'daily';
CREATE INDEX games_user_idx ON games(user_id, started_at DESC);
CREATE INDEX games_content_activity_idx ON games(user_id, activity_id, started_at DESC);

CREATE TABLE game_guesses_next (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  character_id TEXT NOT NULL,
  result_json TEXT NOT NULL CHECK (json_valid(result_json)),
  guessed_at INTEGER NOT NULL,
  UNIQUE (game_id, ordinal),
  UNIQUE (game_id, character_id)
) STRICT;

INSERT INTO game_guesses_next SELECT * FROM game_guesses;
DROP TABLE game_guesses;
ALTER TABLE game_guesses_next RENAME TO game_guesses;

-- NPC 对局沿用回放保留表，但不计入普通角色统计。
ALTER TABLE game_results ADD COLUMN mode_id TEXT NOT NULL DEFAULT 'playable';

PRAGMA foreign_keys = ON;
