-- 将立绘挑战加入无尽模式约束，并保留现有局与猜测记录。
ALTER TABLE endless_guesses RENAME TO endless_guesses_before_portrait;
ALTER TABLE endless_runs RENAME TO endless_runs_before_portrait;

CREATE TABLE endless_runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  mode_id TEXT NOT NULL DEFAULT 'playable'
    CHECK (mode_id IN ('playable', 'npc', 'currency-wars', 'aeon', 'portrait')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'finished')),
  lives INTEGER NOT NULL DEFAULT 5 CHECK (lives BETWEEN 0 AND 5),
  clears INTEGER NOT NULL DEFAULT 0 CHECK (clears >= 0),
  total_guesses INTEGER NOT NULL DEFAULT 0 CHECK (total_guesses >= 0),
  skip_used INTEGER NOT NULL DEFAULT 0 CHECK (skip_used IN (0, 1)),
  round_number INTEGER NOT NULL DEFAULT 1 CHECK (round_number > 0),
  current_target_id TEXT NOT NULL,
  previous_target_id TEXT,
  consumed_target_ids_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(consumed_target_ids_json)),
  target_pool_json TEXT NOT NULL CHECK (json_valid(target_pool_json)),
  candidate_pool_json TEXT NOT NULL CHECK (json_valid(candidate_pool_json)),
  field_rules_json TEXT NOT NULL CHECK (json_valid(field_rules_json)),
  pool_rule_version TEXT NOT NULL,
  manifest_version TEXT NOT NULL,
  last_round_json TEXT CHECK (last_round_json IS NULL OR json_valid(last_round_json)),
  started_at INTEGER NOT NULL,
  round_started_at INTEGER NOT NULL,
  completed_at INTEGER,
  updated_at INTEGER NOT NULL
) STRICT;

INSERT INTO endless_runs SELECT * FROM endless_runs_before_portrait;

CREATE TABLE endless_guesses (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES endless_runs(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL CHECK (round_number > 0),
  ordinal INTEGER NOT NULL CHECK (ordinal BETWEEN 1 AND 6),
  character_id TEXT NOT NULL,
  result_json TEXT NOT NULL CHECK (json_valid(result_json)),
  guessed_at INTEGER NOT NULL,
  UNIQUE (run_id, round_number, ordinal),
  UNIQUE (run_id, round_number, character_id)
) STRICT;

INSERT INTO endless_guesses SELECT * FROM endless_guesses_before_portrait;
DROP TABLE endless_guesses_before_portrait;
DROP TABLE endless_runs_before_portrait;

CREATE UNIQUE INDEX endless_runs_active_user_mode_idx
  ON endless_runs(user_id, mode_id) WHERE status = 'active';
CREATE INDEX endless_runs_leaderboard_idx
  ON endless_runs(mode_id, clears DESC, total_guesses ASC, completed_at ASC)
  WHERE status = 'finished';
CREATE INDEX endless_guesses_run_round_idx
  ON endless_guesses(run_id, round_number, ordinal);
