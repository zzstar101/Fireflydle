-- 注册用户默认进入 Elo 榜；每日榜按当天猜中时间排序并允许访客参与。
DROP TRIGGER IF EXISTS rating_events_apply;

CREATE TRIGGER rating_events_apply
AFTER INSERT ON rating_events
BEGIN
  UPDATE users
  SET elo = NEW.rating_after,
      ranked_matches = ranked_matches + 1,
      leaderboard_eligible = CASE
        WHEN is_guest = 1 THEN 0
        ELSE leaderboard_eligible
      END,
      updated_at = NEW.created_at
  WHERE id = NEW.user_id;
END;

-- 旧规则下尚未完成 10 场的注册用户自动公开；已达门槛但被管理员隐藏的用户保持隐藏。
UPDATE users
SET leaderboard_eligible = 1
WHERE is_guest = 0
  AND merged_into_user_id IS NULL
  AND ranked_matches < 10;

-- 部署时仍在进行的每日一题也统一为 6 次。
UPDATE games
SET max_attempts = 6
WHERE mode = 'daily' AND status = 'active';

CREATE INDEX IF NOT EXISTS game_results_daily_completion_idx
  ON game_results(date_key, result, completed_at, game_id)
  WHERE mode = 'daily' AND leaderboard_hidden_at IS NULL;
