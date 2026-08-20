-- 统计页按用户筛选多人记录；主键以 match_id 开头，无法覆盖该访问路径。
CREATE INDEX IF NOT EXISTS match_players_user_idx
  ON match_players(user_id, match_id);
