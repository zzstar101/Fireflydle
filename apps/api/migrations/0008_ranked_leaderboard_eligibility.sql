-- Elo 排行榜只在注册账号完成至少 10 场排位后公开。
DROP TRIGGER IF EXISTS rating_events_apply;

CREATE TRIGGER rating_events_apply
AFTER INSERT ON rating_events
BEGIN
  UPDATE users
  SET elo = NEW.rating_after,
      ranked_matches = ranked_matches + 1,
      leaderboard_eligible = CASE
        WHEN is_guest = 1 OR ranked_matches + 1 < 10 THEN 0
        WHEN ranked_matches + 1 = 10 THEN 1
        ELSE leaderboard_eligible
      END,
      updated_at = NEW.created_at
  WHERE id = NEW.user_id;
END;

UPDATE users
SET leaderboard_eligible = 0
WHERE is_guest = 1 OR ranked_matches < 10;
