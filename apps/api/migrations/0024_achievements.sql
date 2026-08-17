-- v1.0 成就解锁事实；唯一键保证重放与并发结算不重复解锁。
CREATE TABLE achievement_unlocks (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL,
  unlocked_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, achievement_id)
) STRICT;

CREATE INDEX achievement_unlocks_user_idx ON achievement_unlocks(user_id, unlocked_at DESC);
