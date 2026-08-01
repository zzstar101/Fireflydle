CREATE TABLE email_verification_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_normalized TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
) STRICT;

CREATE INDEX email_verification_tokens_user_idx
  ON email_verification_tokens(user_id, created_at DESC);

CREATE INDEX email_verification_tokens_expiry_idx
  ON email_verification_tokens(expires_at)
  WHERE used_at IS NULL;
