const DAY_MS = 24 * 60 * 60 * 1_000;
const REPLAY_RETENTION_MS = 30 * DAY_MS;

interface DueDeletionRow {
  user_id: string;
}

async function expireAbandonedGames(db: D1Database, now: number): Promise<void> {
  const cutoff = now - DAY_MS;
  await db.batch([
    db
      .prepare(
        `INSERT OR IGNORE INTO game_results
           (game_id, user_id, mode, difficulty, date_key, result, guess_count,
            elapsed_ms, completed_at, replay_expires_at)
         SELECT
           g.id, g.user_id, g.mode, g.difficulty, g.date_key, 'expired',
           (SELECT COUNT(*) FROM game_guesses gg WHERE gg.game_id = g.id),
           MAX(0, ? - g.started_at), ?, ?
         FROM games g
         WHERE g.status = 'active' AND g.started_at <= ?`,
      )
      .bind(now, now, now + REPLAY_RETENTION_MS, cutoff),
    db
      .prepare(
        `UPDATE games SET status = 'expired', completed_at = ?, updated_at = ?
         WHERE status = 'active' AND started_at <= ?`,
      )
      .bind(now, now, cutoff),
  ]);
}

async function purgeExpiredReplays(db: D1Database, now: number): Promise<void> {
  await db.batch([
    db
      .prepare(
        `DELETE FROM game_guesses
       WHERE game_id IN (
         SELECT game_id FROM game_results
         WHERE replay_expires_at <= ? AND replay_deleted_at IS NULL
       )`,
      )
      .bind(now),
    db
      .prepare(
        `UPDATE game_results SET replay_deleted_at = ?
       WHERE replay_expires_at <= ? AND replay_deleted_at IS NULL`,
      )
      .bind(now, now),
    db
      .prepare(
        `DELETE FROM match_guesses
       WHERE match_id IN (SELECT id FROM matches WHERE completed_at <= ?)`,
      )
      .bind(now - REPLAY_RETENTION_MS),
    db
      .prepare(
        `DELETE FROM match_rounds
       WHERE match_id IN (SELECT id FROM matches WHERE completed_at <= ?)`,
      )
      .bind(now - REPLAY_RETENTION_MS),
    db
      .prepare(
        `UPDATE replay_shares SET revoked_at = COALESCE(revoked_at, ?)
       WHERE expires_at <= ?`,
      )
      .bind(now, now),
  ]);
}

async function anonymizeDeletedAccount(db: D1Database, userId: string, now: number): Promise<void> {
  const anonymousName = `已删除玩家-${userId.slice(0, 8)}`;
  await db.batch([
    db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId),
    db.prepare("DELETE FROM password_reset_tokens WHERE user_id = ?").bind(userId),
    db
      .prepare("DELETE FROM game_guesses WHERE game_id IN (SELECT id FROM games WHERE user_id = ?)")
      .bind(userId),
    db
      .prepare(
        `UPDATE game_results SET replay_deleted_at = COALESCE(replay_deleted_at, ?)
       WHERE user_id = ?`,
      )
      .bind(now, userId),
    db
      .prepare(
        `UPDATE replay_shares SET revoked_at = COALESCE(revoked_at, ?)
       WHERE created_by_user_id = ?`,
      )
      .bind(now, userId),
    db.prepare("DELETE FROM match_guesses WHERE user_id = ?").bind(userId),
    db
      .prepare("UPDATE match_players SET display_name = ? WHERE user_id = ?")
      .bind(anonymousName, userId),
    db
      .prepare(
        `UPDATE users SET
         login_name = NULL,
         login_name_normalized = NULL,
         display_name = ?,
         display_name_normalized = ?,
         password_hash = NULL,
         password_salt = NULL,
         password_iterations = NULL,
         email = NULL,
         email_normalized = NULL,
         role = 'player',
         is_guest = 1,
         email_verified = 0,
         leaderboard_eligible = 0,
         display_name_changed_at = NULL,
         updated_at = ?
       WHERE id = ?`,
      )
      .bind(anonymousName, `deleted-${userId}`, now, userId),
    db
      .prepare(
        `UPDATE account_deletion_requests SET completed_at = ?
       WHERE user_id = ? AND cancelled_at IS NULL AND completed_at IS NULL`,
      )
      .bind(now, userId),
  ]);
}

async function processAccountDeletions(db: D1Database, now: number): Promise<void> {
  const due = await db
    .prepare(
      `SELECT user_id FROM account_deletion_requests
       WHERE execute_after <= ? AND cancelled_at IS NULL AND completed_at IS NULL
       ORDER BY execute_after LIMIT 25`,
    )
    .bind(now)
    .all<DueDeletionRow>();
  for (const row of due.results) {
    await anonymizeDeletedAccount(db, row.user_id, now);
  }
}

export async function runScheduledMaintenance(env: Env, now = Date.now()): Promise<void> {
  await expireAbandonedGames(env.DB, now);
  await purgeExpiredReplays(env.DB, now);
  await processAccountDeletions(env.DB, now);
  await env.DB.batch([
    env.DB.prepare(
      "DELETE FROM sessions WHERE expires_at <= ? OR (revoked_at IS NOT NULL AND revoked_at <= ?)",
    ).bind(now, now - 7 * DAY_MS),
    env.DB.prepare(
      `DELETE FROM password_reset_tokens
       WHERE expires_at <= ? OR (used_at IS NOT NULL AND used_at <= ?)`,
    ).bind(now - 7 * DAY_MS, now - 7 * DAY_MS),
    env.DB.prepare(
      `DELETE FROM replay_shares
       WHERE expires_at <= ? OR (revoked_at IS NOT NULL AND revoked_at <= ?)`,
    ).bind(now - 7 * DAY_MS, now - 7 * DAY_MS),
    env.DB.prepare("DELETE FROM rate_limits WHERE updated_at <= ?").bind(now - 7 * DAY_MS),
    env.DB.prepare("DELETE FROM room_directory WHERE expires_at <= ?").bind(now),
  ]);
}
