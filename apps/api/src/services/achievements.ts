import type { AchievementProgress } from "@fireflydle/contracts";

export const ACHIEVEMENT_IDS = [
  "one-shot",
  "daily-seven",
  "win-streak-10",
  "last-guess",
  "first-npc",
  "games-100",
] as const;

type AchievementId = (typeof ACHIEVEMENT_IDS)[number];

const ELIGIBLE_SOLO =
  "mode_id IN ('playable', 'npc') AND activity_id = 'daily' AND result IN ('won', 'lost')";
const ELIGIBLE_RANKED =
  "m.mode_id = 'playable' AND m.activity_id = 'ranked-match' AND m.ranked = 1 AND COALESCE(m.resolution, m.finish_reason) <> 'cancelled'";

function hasSevenDayRun(dateKeys: readonly string[]): boolean {
  const ordered = [...new Set(dateKeys)].sort();
  let run = 0;
  let previous: string | null = null;
  for (const key of ordered) {
    const next = previous
      ? new Date(Date.parse(`${previous}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)
      : null;
    run = next === key ? run + 1 : 1;
    if (run >= 7) return true;
    previous = key;
  }
  return false;
}

async function unlock(db: D1Database, userId: string, id: AchievementId, now: number) {
  await db
    .prepare(
      "INSERT OR IGNORE INTO achievement_unlocks (user_id, achievement_id, unlocked_at) VALUES (?, ?, ?)",
    )
    .bind(userId, id, now)
    .run();
}

export async function evaluateGameResult(
  db: D1Database,
  gameId: string,
  now = Date.now(),
): Promise<void> {
  const row = await db
    .prepare(
      "SELECT r.user_id, r.mode_id, r.activity_id, r.result, r.guess_count, g.max_attempts FROM game_results r JOIN games g ON g.id = r.game_id WHERE r.game_id = ?",
    )
    .bind(gameId)
    .first<{
      user_id: string;
      mode_id: string;
      activity_id: string;
      result: string;
      guess_count: number;
      max_attempts: number;
    }>();
  if (
    !row ||
    !((row.mode_id === "playable" || row.mode_id === "npc") && row.activity_id === "daily")
  )
    return;
  if (!["won", "lost"].includes(row.result)) return;
  if (row.result === "won" && row.guess_count === 1) await unlock(db, row.user_id, "one-shot", now);
  if (row.result === "won" && row.guess_count === row.max_attempts)
    await unlock(db, row.user_id, "last-guess", now);
  if (row.mode_id === "npc") await unlock(db, row.user_id, "first-npc", now);
  if (row.result === "won") {
    const streak = await db
      .prepare(
        `SELECT date_key FROM game_results WHERE user_id = ? AND mode_id = 'playable' AND activity_id = 'daily' AND result = 'won' AND date_key IS NOT NULL ORDER BY date_key`,
      )
      .bind(row.user_id)
      .all<{ date_key: string }>();
    if (hasSevenDayRun(streak.results.map((item) => item.date_key)))
      await unlock(db, row.user_id, "daily-seven", now);
  }
  const total = await db
    .prepare(
      `SELECT (SELECT COUNT(*) FROM game_results WHERE user_id = ? AND ${ELIGIBLE_SOLO}) + (SELECT COUNT(*) FROM matches m JOIN match_players mp ON mp.match_id = m.id WHERE mp.user_id = ? AND ${ELIGIBLE_RANKED}) AS count`,
    )
    .bind(row.user_id, row.user_id)
    .first<{ count: number }>();
  if ((total?.count ?? 0) >= 100) await unlock(db, row.user_id, "games-100", now);
}

export async function evaluateMatch(
  db: D1Database,
  matchId: string,
  now = Date.now(),
): Promise<void> {
  const match = await db
    .prepare(
      "SELECT ranked, mode_id, activity_id, match_format, winner_user_id FROM matches WHERE id = ?",
    )
    .bind(matchId)
    .first<{
      ranked: number;
      mode_id: string;
      activity_id: string;
      match_format: number;
      winner_user_id: string | null;
    }>();
  if (
    !match ||
    match.ranked !== 1 ||
    match.mode_id !== "playable" ||
    match.activity_id !== "ranked-match" ||
    match.match_format !== 3
  )
    return;
  const players = await db
    .prepare("SELECT user_id, score FROM match_players WHERE match_id = ?")
    .bind(matchId)
    .all<{ user_id: string; score: number }>();
  for (const player of players.results) {
    if (match.winner_user_id === player.user_id) {
      const wins = await db
        .prepare(
          `SELECT COUNT(*) AS count FROM matches m JOIN match_players mp ON mp.match_id = m.id WHERE mp.user_id = ? AND m.ranked = 1 AND m.mode_id = 'playable' AND m.activity_id = 'ranked-match' AND m.match_format = 3 AND COALESCE(m.resolution, m.finish_reason) <> 'cancelled' AND m.winner_user_id = ?`,
        )
        .bind(player.user_id, player.user_id)
        .first<{ count: number }>();
      if ((wins?.count ?? 0) >= 10) await unlock(db, player.user_id, "win-streak-10", now);
    }
    const total = await db
      .prepare(
        `SELECT (SELECT COUNT(*) FROM game_results WHERE user_id = ? AND ${ELIGIBLE_SOLO}) + (SELECT COUNT(*) FROM matches m JOIN match_players mp ON mp.match_id = m.id WHERE mp.user_id = ? AND ${ELIGIBLE_RANKED}) AS count`,
      )
      .bind(player.user_id, player.user_id)
      .first<{ count: number }>();
    if ((total?.count ?? 0) >= 100) await unlock(db, player.user_id, "games-100", now);
  }
}

export async function getAchievementProgress(
  db: D1Database,
  userId: string,
): Promise<AchievementProgress[]> {
  const [unlocks, daily, wins, npc, total] = await Promise.all([
    db
      .prepare("SELECT achievement_id, unlocked_at FROM achievement_unlocks WHERE user_id = ?")
      .bind(userId)
      .all<{ achievement_id: AchievementId; unlocked_at: number }>(),
    db
      .prepare(
        "SELECT COUNT(DISTINCT date_key) AS count FROM game_results WHERE user_id = ? AND mode_id = 'playable' AND activity_id = 'daily' AND result = 'won'",
      )
      .bind(userId)
      .first<{ count: number }>(),
    db
      .prepare(
        "SELECT COUNT(*) AS count FROM matches m JOIN match_players mp ON mp.match_id = m.id WHERE mp.user_id = ? AND m.ranked = 1 AND m.mode_id = 'playable' AND m.activity_id = 'ranked-match' AND m.match_format = 3 AND COALESCE(m.resolution, m.finish_reason) <> 'cancelled' AND m.winner_user_id = ?",
      )
      .bind(userId, userId)
      .first<{ count: number }>(),
    db
      .prepare(
        "SELECT COUNT(*) AS count FROM game_results WHERE user_id = ? AND mode_id = 'npc' AND activity_id = 'daily' AND result IN ('won','lost')",
      )
      .bind(userId)
      .first<{ count: number }>(),
    db
      .prepare(
        `SELECT (SELECT COUNT(*) FROM game_results WHERE user_id = ? AND ${ELIGIBLE_SOLO}) + (SELECT COUNT(*) FROM matches m JOIN match_players mp ON mp.match_id = m.id WHERE mp.user_id = ? AND ${ELIGIBLE_RANKED}) AS count`,
      )
      .bind(userId, userId)
      .first<{ count: number }>(),
  ]);
  const unlocked = new Map(
    unlocks.results.map((row) => [row.achievement_id, new Date(row.unlocked_at).toISOString()]),
  );
  const progress: Record<AchievementId, number> = {
    "one-shot": 0,
    "daily-seven": Math.min(daily?.count ?? 0, 7),
    "win-streak-10": Math.min(wins?.count ?? 0, 10),
    "last-guess": 0,
    "first-npc": Math.min(npc?.count ?? 0, 1),
    "games-100": Math.min(total?.count ?? 0, 100),
  };
  return ACHIEVEMENT_IDS.map((id) => ({
    id,
    unlockedAt: unlocked.get(id) ?? null,
    progress: progress[id],
    target: id === "daily-seven" ? 7 : id === "win-streak-10" ? 10 : id === "games-100" ? 100 : 1,
  }));
}
