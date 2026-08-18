-- 好友挑战接入全部单人内容模式，同时保留既有生命周期与首次成绩约束。
PRAGMA foreign_keys = OFF;

CREATE TABLE friend_challenges_next (
  id TEXT PRIMARY KEY,
  source_game_id TEXT NOT NULL UNIQUE REFERENCES games(id),
  creator_user_id TEXT NOT NULL REFERENCES users(id),
  mode_id TEXT NOT NULL CHECK (mode_id IN ('playable', 'npc', 'currency-wars', 'aeon')),
  pool_rule_version TEXT NOT NULL,
  manifest_version TEXT NOT NULL,
  target_character_id TEXT NOT NULL,
  target_payload_json TEXT NOT NULL CHECK (json_valid(target_payload_json)),
  candidate_pool_json TEXT NOT NULL CHECK (json_valid(candidate_pool_json)),
  field_rules_json TEXT NOT NULL CHECK (json_valid(field_rules_json)),
  max_attempts INTEGER NOT NULL CHECK (max_attempts > 0),
  creator_status TEXT NOT NULL CHECK (creator_status IN ('won', 'lost')),
  creator_guess_count INTEGER NOT NULL CHECK (creator_guess_count > 0),
  creator_elapsed_ms INTEGER NOT NULL CHECK (creator_elapsed_ms >= 0),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
) STRICT;

INSERT INTO friend_challenges_next SELECT * FROM friend_challenges;

CREATE TABLE friend_challenge_attempts_next (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES friend_challenges_next(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL CHECK (kind IN ('official', 'practice')),
  created_at INTEGER NOT NULL
) STRICT;

INSERT INTO friend_challenge_attempts_next SELECT * FROM friend_challenge_attempts;

DROP TABLE friend_challenge_attempts;
DROP TABLE friend_challenges;
ALTER TABLE friend_challenges_next RENAME TO friend_challenges;
ALTER TABLE friend_challenge_attempts_next RENAME TO friend_challenge_attempts;

CREATE INDEX friend_challenges_creator_idx
  ON friend_challenges(creator_user_id, created_at DESC);
CREATE INDEX friend_challenges_expiry_idx ON friend_challenges(expires_at);
CREATE UNIQUE INDEX friend_challenge_official_once_idx
  ON friend_challenge_attempts(challenge_id, user_id)
  WHERE kind = 'official';
CREATE INDEX friend_challenge_attempts_user_idx
  ON friend_challenge_attempts(challenge_id, user_id, created_at DESC);

CREATE TABLE friend_challenge_tombstones_next (
  id TEXT PRIMARY KEY,
  mode_id TEXT NOT NULL CHECK (mode_id IN ('playable', 'npc', 'currency-wars', 'aeon')),
  expired_at INTEGER NOT NULL
) STRICT;

INSERT INTO friend_challenge_tombstones_next SELECT * FROM friend_challenge_tombstones;
DROP TABLE friend_challenge_tombstones;
ALTER TABLE friend_challenge_tombstones_next RENAME TO friend_challenge_tombstones;

PRAGMA foreign_keys = ON;
