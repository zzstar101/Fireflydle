-- 派对房目录：只用于房间码/链接寻址与过期回收，战绩不入库（不计 Elo、不写 games 表）
CREATE TABLE party_directory (
  party_id TEXT PRIMARY KEY,
  party_code TEXT NOT NULL UNIQUE,
  durable_object_name TEXT NOT NULL UNIQUE,
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  state TEXT NOT NULL CHECK (state IN ('lobby', 'countdown', 'playing', 'round-ended', 'finished')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
) STRICT;

CREATE INDEX party_directory_expiry_idx ON party_directory(expires_at);
