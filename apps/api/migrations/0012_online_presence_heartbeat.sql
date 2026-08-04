ALTER TABLE operations_visit_sessions ADD COLUMN last_seen_at INTEGER;

UPDATE operations_visit_sessions
SET last_seen_at = started_at
WHERE last_seen_at IS NULL;

CREATE INDEX operations_visit_sessions_last_seen_idx
  ON operations_visit_sessions(last_seen_at);
