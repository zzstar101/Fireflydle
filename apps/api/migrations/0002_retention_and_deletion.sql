-- 回放保留、分享令牌与账号删除宽限期。
PRAGMA foreign_keys = ON;

ALTER TABLE users ADD COLUMN display_name_changed_at INTEGER;
ALTER TABLE users ADD COLUMN banned_until INTEGER;
ALTER TABLE users ADD COLUMN ban_reason TEXT;

CREATE TABLE factions (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL,
  names_json TEXT NOT NULL CHECK (json_valid(names_json)),
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;

CREATE TABLE versions (
  id TEXT PRIMARY KEY,
  sort_order INTEGER NOT NULL CHECK (sort_order >= 0),
  released_at TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1 CHECK (enabled IN (0, 1)),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;

-- 每个北京日期全局只有一个答案；难度不参与目标选择。
CREATE TABLE daily_target_schedule (
  date_key TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id),
  cycle INTEGER NOT NULL CHECK (cycle >= 0),
  source TEXT NOT NULL CHECK (source IN ('auto', 'override')),
  created_by_user_id TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (cycle, character_id)
) STRICT;

CREATE INDEX daily_target_schedule_cycle_idx
  ON daily_target_schedule(cycle, date_key, character_id);

-- 从旧版“日期 + 难度”表中每天只选取一项，之后由新表独立裁决。
INSERT OR IGNORE INTO daily_target_schedule (
  date_key, character_id, cycle, source, created_by_user_id, created_at, updated_at
)
SELECT
  dt.date_key,
  dt.character_id,
  0,
  'auto',
  NULL,
  dt.created_at,
  dt.created_at
FROM daily_targets dt
WHERE dt.difficulty = (
  SELECT inner_dt.difficulty
  FROM daily_targets inner_dt
  WHERE inner_dt.date_key = dt.date_key
  ORDER BY CASE inner_dt.difficulty
    WHEN 'standard' THEN 0
    WHEN 'casual' THEN 1
    ELSE 2
  END
  LIMIT 1
);

-- 永久结果摘要与详细猜测分离，避免 30 天清理破坏统计。
CREATE TABLE game_results (
  game_id TEXT PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  mode TEXT NOT NULL CHECK (mode IN ('daily', 'random')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('casual', 'standard', 'hard')),
  date_key TEXT,
  result TEXT NOT NULL CHECK (result IN ('won', 'lost', 'conceded', 'expired')),
  guess_count INTEGER NOT NULL CHECK (guess_count >= 0),
  elapsed_ms INTEGER NOT NULL CHECK (elapsed_ms >= 0),
  completed_at INTEGER NOT NULL,
  replay_expires_at INTEGER NOT NULL,
  replay_deleted_at INTEGER,
  leaderboard_hidden_at INTEGER,
  leaderboard_hidden_by_user_id TEXT REFERENCES users(id),
  leaderboard_hidden_reason TEXT
) STRICT;

CREATE INDEX game_results_user_idx
  ON game_results(user_id, completed_at DESC);
CREATE INDEX game_results_daily_board_idx
  ON game_results(date_key, difficulty, result, guess_count, elapsed_ms, completed_at);
CREATE INDEX game_results_replay_expiry_idx
  ON game_results(replay_expires_at)
  WHERE replay_deleted_at IS NULL;

-- 兼容已有完成数据；新对局由 Worker 在裁决事务中同步写入。
INSERT OR IGNORE INTO game_results (
  game_id, user_id, mode, difficulty, date_key, result, guess_count,
  elapsed_ms, completed_at, replay_expires_at
)
SELECT
  g.id,
  g.user_id,
  g.mode,
  g.difficulty,
  g.date_key,
  g.status,
  (SELECT COUNT(*) FROM game_guesses gg WHERE gg.game_id = g.id),
  MAX(0, g.completed_at - g.started_at),
  g.completed_at,
  g.completed_at + 30 * 24 * 60 * 60 * 1000
FROM games g
WHERE g.status <> 'active' AND g.completed_at IS NOT NULL;

CREATE TABLE replay_shares (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
) STRICT;

CREATE INDEX replay_shares_game_idx ON replay_shares(game_id, created_at DESC);
CREATE INDEX replay_shares_expiry_idx
  ON replay_shares(expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
) STRICT;

CREATE INDEX password_reset_tokens_user_idx
  ON password_reset_tokens(user_id, created_at DESC);
CREATE INDEX password_reset_tokens_expiry_idx
  ON password_reset_tokens(expires_at)
  WHERE used_at IS NULL;

CREATE TABLE account_deletion_requests (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  requested_at INTEGER NOT NULL,
  execute_after INTEGER NOT NULL,
  cancelled_at INTEGER,
  completed_at INTEGER
) STRICT;

CREATE INDEX account_deletion_due_idx
  ON account_deletion_requests(execute_after)
  WHERE cancelled_at IS NULL AND completed_at IS NULL;

CREATE INDEX announcements_public_idx
  ON announcements(published, starts_at, ends_at, created_at DESC);

-- 注册账号需完成 10 场排位后才进入公开排行榜。
DROP TRIGGER rating_events_apply;
CREATE TRIGGER rating_events_apply
AFTER INSERT ON rating_events
BEGIN
  UPDATE users
  SET elo = NEW.rating_after,
      ranked_matches = ranked_matches + 1,
      leaderboard_eligible = CASE
        WHEN is_guest = 0 AND ranked_matches + 1 >= 10 THEN 1
        ELSE 0
      END,
      updated_at = NEW.created_at
  WHERE id = NEW.user_id;
END;

UPDATE users
SET leaderboard_eligible = CASE
  WHEN is_guest = 0 AND ranked_matches >= 10 THEN 1
  ELSE 0
END;
