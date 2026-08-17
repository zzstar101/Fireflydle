-- 普通角色周赛冻结每周五题，并把首次账号成绩与后续练习隔离。
ALTER TABLE game_results ADD COLUMN activity_id TEXT NOT NULL DEFAULT 'daily';
UPDATE game_results
SET activity_id = CASE WHEN mode = 'random' THEN 'practice' ELSE 'daily' END;

CREATE TABLE weekly_schedules (
  week_key TEXT PRIMARY KEY,
  manifest_version TEXT NOT NULL,
  rules_version TEXT NOT NULL,
  targets_json TEXT NOT NULL CHECK (json_valid(targets_json)),
  candidate_pool_json TEXT NOT NULL CHECK (json_valid(candidate_pool_json)),
  field_rules_json TEXT NOT NULL CHECK (json_valid(field_rules_json)),
  created_at INTEGER NOT NULL
) STRICT;

CREATE TABLE weekly_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  week_key TEXT NOT NULL REFERENCES weekly_schedules(week_key),
  official INTEGER NOT NULL CHECK (official IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  correct_count INTEGER NOT NULL DEFAULT 0 CHECK (correct_count BETWEEN 0 AND 5),
  total_guesses INTEGER NOT NULL DEFAULT 0 CHECK (total_guesses >= 0),
  started_at INTEGER NOT NULL,
  completed_at INTEGER,
  updated_at INTEGER NOT NULL
) STRICT;

CREATE UNIQUE INDEX weekly_runs_official_once_idx
  ON weekly_runs(user_id, week_key) WHERE official = 1;
CREATE UNIQUE INDEX weekly_runs_active_practice_idx
  ON weekly_runs(user_id, week_key) WHERE official = 0 AND status = 'active';
CREATE INDEX weekly_runs_user_idx ON weekly_runs(user_id, week_key, started_at DESC);

CREATE TABLE weekly_rounds (
  run_id TEXT NOT NULL REFERENCES weekly_runs(id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL CHECK (ordinal BETWEEN 1 AND 5),
  game_id TEXT NOT NULL UNIQUE REFERENCES games(id) ON DELETE CASCADE,
  PRIMARY KEY (run_id, ordinal)
) STRICT;

CREATE TABLE weekly_scores (
  run_id TEXT PRIMARY KEY REFERENCES weekly_runs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  week_key TEXT NOT NULL,
  correct_count INTEGER NOT NULL CHECK (correct_count BETWEEN 0 AND 5),
  total_guesses INTEGER NOT NULL CHECK (total_guesses >= 0),
  elapsed_ms INTEGER NOT NULL CHECK (elapsed_ms >= 0),
  completed_at INTEGER NOT NULL,
  UNIQUE (user_id, week_key)
) STRICT;

CREATE INDEX weekly_scores_ranking_idx
  ON weekly_scores(week_key, correct_count DESC, total_guesses ASC, elapsed_ms ASC, completed_at ASC);

CREATE TABLE weekly_run_shares (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES weekly_runs(id) ON DELETE CASCADE,
  created_by_user_id TEXT NOT NULL REFERENCES users(id),
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  revoked_at INTEGER
) STRICT;
