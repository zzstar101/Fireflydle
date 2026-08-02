-- 管理概览的低频业务汇总、脱敏错误与预警状态。
PRAGMA foreign_keys = ON;

CREATE TABLE operations_daily_metrics (
  date_key TEXT PRIMARY KEY,
  visit_sessions INTEGER NOT NULL DEFAULT 0 CHECK (visit_sessions >= 0),
  registered_dau INTEGER NOT NULL DEFAULT 0 CHECK (registered_dau >= 0),
  guest_dau INTEGER NOT NULL DEFAULT 0 CHECK (guest_dau >= 0),
  register_success INTEGER NOT NULL DEFAULT 0 CHECK (register_success >= 0),
  register_failure INTEGER NOT NULL DEFAULT 0 CHECK (register_failure >= 0),
  email_send_success INTEGER NOT NULL DEFAULT 0 CHECK (email_send_success >= 0),
  email_send_failure INTEGER NOT NULL DEFAULT 0 CHECK (email_send_failure >= 0),
  verification_success INTEGER NOT NULL DEFAULT 0 CHECK (verification_success >= 0),
  verification_failure INTEGER NOT NULL DEFAULT 0 CHECK (verification_failure >= 0),
  login_success INTEGER NOT NULL DEFAULT 0 CHECK (login_success >= 0),
  login_failure INTEGER NOT NULL DEFAULT 0 CHECK (login_failure >= 0),
  multiplayer_started INTEGER NOT NULL DEFAULT 0 CHECK (multiplayer_started >= 0),
  updated_at INTEGER NOT NULL
) STRICT;

CREATE TABLE operations_visit_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_guest INTEGER NOT NULL CHECK (is_guest IN (0, 1)),
  date_key TEXT NOT NULL,
  started_at INTEGER NOT NULL
) STRICT;

CREATE INDEX operations_visit_sessions_date_idx
  ON operations_visit_sessions(date_key, started_at);

CREATE TABLE operations_daily_players (
  date_key TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_guest INTEGER NOT NULL CHECK (is_guest IN (0, 1)),
  first_started_at INTEGER NOT NULL,
  PRIMARY KEY (date_key, user_id)
) STRICT;

CREATE INDEX operations_daily_players_started_idx
  ON operations_daily_players(first_started_at);

CREATE TABLE operations_multiplayer_starts (
  room_id TEXT PRIMARY KEY,
  date_key TEXT NOT NULL,
  started_at INTEGER NOT NULL
) STRICT;

CREATE INDEX operations_multiplayer_starts_time_idx
  ON operations_multiplayer_starts(started_at);

CREATE TABLE operations_error_events (
  id TEXT PRIMARY KEY,
  occurred_at INTEGER NOT NULL,
  method TEXT NOT NULL,
  route TEXT NOT NULL,
  status_code INTEGER NOT NULL CHECK (status_code BETWEEN 400 AND 599),
  error_code TEXT NOT NULL,
  request_id TEXT NOT NULL
) STRICT;

CREATE INDEX operations_error_events_time_idx
  ON operations_error_events(occurred_at DESC);

CREATE TABLE operations_alerts (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  status TEXT NOT NULL CHECK (status IN ('active', 'recovered')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL,
  recovered_at INTEGER,
  last_notified_at INTEGER,
  occurrences INTEGER NOT NULL DEFAULT 1 CHECK (occurrences > 0)
) STRICT;

CREATE UNIQUE INDEX operations_alerts_active_kind_idx
  ON operations_alerts(kind) WHERE status = 'active';
CREATE INDEX operations_alerts_recent_idx
  ON operations_alerts(last_seen_at DESC);

CREATE TABLE operations_external_cache (
  cache_key TEXT PRIMARY KEY,
  payload_json TEXT NOT NULL CHECK (json_valid(payload_json)),
  expires_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;
