-- 好友挑战保留 90 天；过期后只保留定位原内容模式所需的最小墓碑。
ALTER TABLE friend_challenges ADD COLUMN expires_at INTEGER;

UPDATE friend_challenges
SET expires_at = created_at + 90 * 24 * 60 * 60 * 1000
WHERE expires_at IS NULL;

CREATE INDEX friend_challenges_expiry_idx ON friend_challenges(expires_at);

CREATE TABLE friend_challenge_tombstones (
  id TEXT PRIMARY KEY,
  mode_id TEXT NOT NULL CHECK (mode_id = 'playable'),
  expired_at INTEGER NOT NULL
) STRICT;
