-- 弗一把：D1 长期数据。对局中的热状态由 SQLite Durable Object 持有。
PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id TEXT PRIMARY KEY,
  login_name TEXT,
  login_name_normalized TEXT UNIQUE,
  display_name TEXT NOT NULL,
  display_name_normalized TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  password_salt TEXT,
  password_iterations INTEGER,
  email TEXT,
  email_normalized TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'player'
    CHECK (role IN ('player', 'moderator', 'data-editor', 'admin', 'owner')),
  is_guest INTEGER NOT NULL DEFAULT 1 CHECK (is_guest IN (0, 1)),
  email_verified INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
  elo INTEGER NOT NULL DEFAULT 1000,
  ranked_matches INTEGER NOT NULL DEFAULT 0,
  leaderboard_eligible INTEGER NOT NULL DEFAULT 0 CHECK (leaderboard_eligible IN (0, 1)),
  merged_into_user_id TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  CHECK (
    (is_guest = 1 AND login_name IS NULL AND password_hash IS NULL)
    OR
    (is_guest = 0 AND login_name IS NOT NULL AND password_hash IS NOT NULL)
  )
) STRICT;

CREATE INDEX users_leaderboard_idx
  ON users(leaderboard_eligible, elo DESC, ranked_matches DESC, created_at ASC);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER,
  user_agent TEXT
) STRICT;

CREATE INDEX sessions_user_idx ON sessions(user_id, expires_at DESC);
CREATE INDEX sessions_expiry_idx ON sessions(expires_at) WHERE revoked_at IS NULL;

CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  official_id TEXT NOT NULL,
  base_character_id TEXT NOT NULL,
  element TEXT NOT NULL,
  path TEXT NOT NULL,
  rarity INTEGER NOT NULL CHECK (rarity IN (4, 5)),
  faction_id TEXT NOT NULL,
  faction_group_id TEXT NOT NULL,
  release_version_id TEXT NOT NULL,
  release_order INTEGER NOT NULL,
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
  target_eligible INTEGER NOT NULL CHECK (target_eligible IN (0, 1)),
  source_revision TEXT NOT NULL,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;

CREATE INDEX characters_pool_idx ON characters(enabled, target_eligible, release_order);

CREATE TABLE daily_targets (
  date_key TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('casual', 'standard', 'hard')),
  character_id TEXT NOT NULL REFERENCES characters(id),
  created_at INTEGER NOT NULL,
  PRIMARY KEY (date_key, difficulty)
) STRICT;

CREATE TABLE games (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  mode TEXT NOT NULL CHECK (mode IN ('daily', 'random')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('casual', 'standard', 'hard')),
  date_key TEXT,
  target_character_id TEXT NOT NULL REFERENCES characters(id),
  max_attempts INTEGER NOT NULL CHECK (max_attempts > 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'won', 'lost', 'conceded', 'expired')),
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  updated_at INTEGER NOT NULL
) STRICT;

CREATE UNIQUE INDEX games_daily_once_idx
  ON games(user_id, date_key, difficulty)
  WHERE mode = 'daily';
CREATE INDEX games_user_idx ON games(user_id, started_at DESC);

CREATE TABLE game_guesses (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  character_id TEXT NOT NULL REFERENCES characters(id),
  result_json TEXT NOT NULL CHECK (json_valid(result_json)),
  guessed_at INTEGER NOT NULL,
  UNIQUE (game_id, ordinal),
  UNIQUE (game_id, character_id)
) STRICT;

CREATE TABLE room_directory (
  room_id TEXT PRIMARY KEY,
  room_code TEXT NOT NULL UNIQUE,
  durable_object_name TEXT NOT NULL UNIQUE,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  state TEXT NOT NULL CHECK (state IN ('waiting', 'active', 'finished')),
  ranked INTEGER NOT NULL CHECK (ranked IN (0, 1)),
  match_format INTEGER NOT NULL CHECK (match_format IN (1, 3, 5, 7)),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
) STRICT;

CREATE INDEX room_directory_expiry_idx ON room_directory(expires_at);

CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  room_code TEXT,
  match_format INTEGER NOT NULL CHECK (match_format IN (1, 3, 5, 7)),
  ranked INTEGER NOT NULL CHECK (ranked IN (0, 1)),
  winner_user_id TEXT REFERENCES users(id),
  finish_reason TEXT NOT NULL
    CHECK (finish_reason IN ('score', 'three-draws', 'disconnect', 'left', 'cancelled')),
  created_at INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  completed_at INTEGER NOT NULL,
  archived_at INTEGER NOT NULL
) STRICT;

CREATE INDEX matches_completed_idx ON matches(completed_at DESC);

CREATE TABLE match_players (
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  seat INTEGER NOT NULL CHECK (seat IN (0, 1)),
  display_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  rating_before INTEGER NOT NULL,
  rating_after INTEGER NOT NULL,
  PRIMARY KEY (match_id, user_id),
  UNIQUE (match_id, seat)
) STRICT;

CREATE TABLE match_rounds (
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  target_character_id TEXT NOT NULL,
  winner_user_id TEXT REFERENCES users(id),
  started_at INTEGER NOT NULL,
  completed_at INTEGER NOT NULL,
  PRIMARY KEY (match_id, round_number)
) STRICT;

CREATE TABLE match_guesses (
  match_id TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  ordinal INTEGER NOT NULL,
  character_id TEXT NOT NULL,
  result_json TEXT NOT NULL CHECK (json_valid(result_json)),
  guessed_at INTEGER NOT NULL,
  PRIMARY KEY (match_id, round_number, user_id, ordinal),
  FOREIGN KEY (match_id, round_number)
    REFERENCES match_rounds(match_id, round_number) ON DELETE CASCADE
) STRICT;

CREATE TABLE rating_events (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  rating_before INTEGER NOT NULL,
  rating_after INTEGER NOT NULL,
  delta INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE (match_id, user_id)
) STRICT;

-- 评分事件本身是幂等边界；只有首次插入事件时才推进用户评分与场次。
CREATE TRIGGER rating_events_apply
AFTER INSERT ON rating_events
BEGIN
  UPDATE users
  SET elo = NEW.rating_after,
      ranked_matches = ranked_matches + 1,
      leaderboard_eligible = CASE WHEN is_guest = 0 THEN 1 ELSE 0 END,
      updated_at = NEW.created_at
  WHERE id = NEW.user_id;
END;

CREATE TABLE announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  published INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  starts_at INTEGER,
  ends_at INTEGER,
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;

CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT NOT NULL REFERENCES users(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  request_id TEXT NOT NULL,
  metadata_json TEXT NOT NULL CHECK (json_valid(metadata_json)),
  created_at INTEGER NOT NULL
) STRICT;

CREATE INDEX audit_logs_created_idx ON audit_logs(created_at DESC);
