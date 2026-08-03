ALTER TABLE announcements ADD COLUMN category TEXT NOT NULL DEFAULT 'notice'
  CHECK (category IN ('update', 'notice', 'maintenance'));
ALTER TABLE announcements ADD COLUMN audience TEXT NOT NULL DEFAULT 'all'
  CHECK (audience IN ('all', 'registered', 'guest'));
ALTER TABLE announcements ADD COLUMN published_at INTEGER;
ALTER TABLE announcements ADD COLUMN archived_at INTEGER;
ALTER TABLE announcements ADD COLUMN source TEXT NOT NULL DEFAULT 'admin'
  CHECK (source IN ('admin', 'release'));
ALTER TABLE announcements ADD COLUMN source_ref TEXT;

CREATE UNIQUE INDEX announcements_source_ref_unique
  ON announcements(source, source_ref)
  WHERE source_ref IS NOT NULL;
CREATE INDEX announcements_public_history_idx
  ON announcements(published_at DESC)
  WHERE published_at IS NOT NULL;

CREATE TABLE announcement_reads (
  announcement_id TEXT NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at INTEGER NOT NULL,
  PRIMARY KEY (announcement_id, user_id)
) STRICT;

CREATE INDEX announcement_reads_user_idx
  ON announcement_reads(user_id, read_at DESC);
