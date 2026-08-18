-- 特殊模式练习允许与普通角色练习并行，但同一用户同一模式仍只保留一场活动局。
DROP INDEX IF EXISTS games_random_active_idx;

CREATE UNIQUE INDEX games_random_active_idx
  ON games(user_id, mode_id)
  WHERE mode = 'random' AND status = 'active' AND activity_id != 'friend-challenge';
