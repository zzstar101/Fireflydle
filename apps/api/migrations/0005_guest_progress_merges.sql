-- 访客进度合并账本是并发幂等边界；同一访客只能被一个登录请求认领一次。
CREATE TABLE guest_progress_merges (
  guest_user_id TEXT PRIMARY KEY REFERENCES users(id),
  target_user_id TEXT NOT NULL REFERENCES users(id),
  claim_token TEXT NOT NULL UNIQUE,
  merged_at INTEGER NOT NULL
) STRICT;

CREATE INDEX guest_progress_merges_target_idx
  ON guest_progress_merges(target_user_id, merged_at DESC);
