-- 单人玩法每名玩家只保留一个可继续的活动对局。
-- 旧索引继续保留，兼容仍按“日期 + 难度”写入的上一版 Worker。

WITH ranked_daily AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, date_key
      ORDER BY
        (SELECT COUNT(*) FROM game_guesses WHERE game_id = games.id) DESC,
        started_at DESC,
        id DESC
    ) AS position
  FROM games
  WHERE mode = 'daily' AND status = 'active'
)
INSERT OR IGNORE INTO game_results (
  game_id, user_id, mode, difficulty, date_key, result, guess_count,
  elapsed_ms, completed_at, replay_expires_at
)
SELECT
  game.id, game.user_id, game.mode, game.difficulty, game.date_key, 'expired',
  (SELECT COUNT(*) FROM game_guesses WHERE game_id = game.id),
  MAX(0, game.updated_at - game.started_at),
  COALESCE(game.completed_at, game.updated_at),
  COALESCE(game.completed_at, game.updated_at) + 2592000000
FROM games game
JOIN ranked_daily ranked ON ranked.id = game.id
WHERE ranked.position > 1;

WITH ranked_daily AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, date_key
      ORDER BY
        (SELECT COUNT(*) FROM game_guesses WHERE game_id = games.id) DESC,
        started_at DESC,
        id DESC
    ) AS position
  FROM games
  WHERE mode = 'daily' AND status = 'active'
)
UPDATE games
SET status = 'expired',
    completed_at = COALESCE(completed_at, updated_at)
WHERE id IN (SELECT id FROM ranked_daily WHERE position > 1);

WITH ranked_random AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY
        (SELECT COUNT(*) FROM game_guesses WHERE game_id = games.id) DESC,
        started_at DESC,
        id DESC
    ) AS position
  FROM games
  WHERE mode = 'random' AND status = 'active'
)
INSERT OR IGNORE INTO game_results (
  game_id, user_id, mode, difficulty, date_key, result, guess_count,
  elapsed_ms, completed_at, replay_expires_at
)
SELECT
  game.id, game.user_id, game.mode, game.difficulty, game.date_key, 'expired',
  (SELECT COUNT(*) FROM game_guesses WHERE game_id = game.id),
  MAX(0, game.updated_at - game.started_at),
  COALESCE(game.completed_at, game.updated_at),
  COALESCE(game.completed_at, game.updated_at) + 2592000000
FROM games game
JOIN ranked_random ranked ON ranked.id = game.id
WHERE ranked.position > 1;

WITH ranked_random AS (
  SELECT id,
    ROW_NUMBER() OVER (
      PARTITION BY user_id
      ORDER BY
        (SELECT COUNT(*) FROM game_guesses WHERE game_id = games.id) DESC,
        started_at DESC,
        id DESC
    ) AS position
  FROM games
  WHERE mode = 'random' AND status = 'active'
)
UPDATE games
SET status = 'expired',
    completed_at = COALESCE(completed_at, updated_at)
WHERE id IN (SELECT id FROM ranked_random WHERE position > 1);

CREATE UNIQUE INDEX games_daily_active_idx
  ON games(user_id, date_key)
  WHERE mode = 'daily' AND status = 'active';

CREATE UNIQUE INDEX games_random_active_idx
  ON games(user_id)
  WHERE mode = 'random' AND status = 'active';
