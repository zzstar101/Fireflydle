CREATE TABLE IF NOT EXISTS feedback_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  category TEXT NOT NULL CHECK (category IN ('bug', 'suggestion', 'data')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reproduction TEXT,
  source_url TEXT,
  contact_email TEXT,
  attachments_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(attachments_json)),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'accepted', 'resolved', 'closed')),
  resolved_release_tag TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS feedback_items_user_idx
  ON feedback_items(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_items_status_idx
  ON feedback_items(status, updated_at DESC);
