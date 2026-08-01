-- 高风险入口共享的持久化限流状态；独立迁移确保已应用 0002 的环境可前向升级。
CREATE TABLE rate_limits (
  scope TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  window_started_at INTEGER NOT NULL,
  request_count INTEGER NOT NULL CHECK (request_count >= 0),
  blocked_until INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (scope, key_hash)
) STRICT;

CREATE INDEX rate_limits_cleanup_idx ON rate_limits(updated_at);
