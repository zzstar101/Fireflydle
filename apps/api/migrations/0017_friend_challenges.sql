-- 好友挑战冻结源局快照，并把每个账号的首次正式成绩与后续练习分开。
CREATE TABLE friend_challenges (
  id TEXT PRIMARY KEY,
  source_game_id TEXT NOT NULL UNIQUE REFERENCES games(id),
  creator_user_id TEXT NOT NULL REFERENCES users(id),
  mode_id TEXT NOT NULL CHECK (mode_id = 'playable'),
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
  created_at INTEGER NOT NULL
) STRICT;

CREATE INDEX friend_challenges_creator_idx
  ON friend_challenges(creator_user_id, created_at DESC);

CREATE TABLE friend_challenge_attempts (
  id TEXT PRIMARY KEY,
  challenge_id TEXT NOT NULL REFERENCES friend_challenges(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL CHECK (kind IN ('official', 'practice')),
  created_at INTEGER NOT NULL
) STRICT;

CREATE UNIQUE INDEX friend_challenge_official_once_idx
  ON friend_challenge_attempts(challenge_id, user_id)
  WHERE kind = 'official';
CREATE INDEX friend_challenge_attempts_user_idx
  ON friend_challenge_attempts(challenge_id, user_id, created_at DESC);

-- 好友挑战有独立生命周期，不占用普通随机练习的活动局名额。
CREATE UNIQUE INDEX games_random_active_idx
  ON games(user_id)
  WHERE mode = 'random' AND status = 'active' AND activity_id != 'friend-challenge';
