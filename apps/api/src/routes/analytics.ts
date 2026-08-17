import { getBeijingDateKey } from "@fireflydle/game-engine";
import { Hono } from "hono";
import { ok } from "../lib/http";
import { requireAuth } from "../services/auth";
import type { AppContext } from "../types";

interface AggregateRow {
  daily_played: number;
  daily_won: number;
  random_played: number;
  random_won: number;
  average_guesses: number | null;
}

interface RankedRow {
  ranked_played: number;
  ranked_won: number;
}

interface RecentRow {
  game_id: string;
  mode: string;
  result: string;
  guess_count: number;
  elapsed_ms: number;
  completed_at: number;
}

interface MultiplayerRecentRow {
  match_id: string;
  winner_user_id: string | null;
  opponent_display_name: string;
  score_for: number;
  score_against: number;
  guess_count: number;
  ranked: number;
  started_at: number;
  completed_at: number;
}

function shiftDateKey(dateKey: string, days: number): string {
  const timestamp = Date.parse(`${dateKey}T00:00:00.000Z`);
  return new Date(timestamp + days * 24 * 60 * 60 * 1_000).toISOString().slice(0, 10);
}

function streaks(dateKeys: readonly string[], today: string): { current: number; best: number } {
  const unique = new Set(dateKeys);
  let cursor = unique.has(today) ? today : shiftDateKey(today, -1);
  let current = 0;
  while (unique.has(cursor)) {
    current += 1;
    cursor = shiftDateKey(cursor, -1);
  }

  const ordered = [...unique].sort();
  let best = 0;
  let running = 0;
  let previous: string | null = null;
  for (const dateKey of ordered) {
    running = previous !== null && shiftDateKey(previous, 1) === dateKey ? running + 1 : 1;
    best = Math.max(best, running);
    previous = dateKey;
  }
  return { current, best };
}

export const analyticsRoutes = new Hono<AppContext>();

analyticsRoutes.get("/stats/me", async (context) => {
  const auth = requireAuth(context);
  const [aggregate, ranked, recentRows, multiplayerRows, dailyRows] = await Promise.all([
    context.env.DB.prepare(
      `SELECT
         SUM(CASE WHEN mode = 'daily' THEN 1 ELSE 0 END) AS daily_played,
         SUM(CASE WHEN mode = 'daily' AND result = 'won' THEN 1 ELSE 0 END) AS daily_won,
         SUM(CASE WHEN mode = 'random' THEN 1 ELSE 0 END) AS random_played,
         SUM(CASE WHEN mode = 'random' AND result = 'won' THEN 1 ELSE 0 END) AS random_won,
         AVG(CASE WHEN result IN ('won', 'lost') THEN guess_count END) AS average_guesses
       FROM game_results WHERE user_id = ? AND mode_id = 'playable'
         AND activity_id IN ('daily', 'practice')`,
    )
      .bind(auth.user.id)
      .first<AggregateRow>(),
    context.env.DB.prepare(
      `SELECT
         COUNT(*) AS ranked_played,
         SUM(CASE WHEN m.winner_user_id = ? THEN 1 ELSE 0 END) AS ranked_won
       FROM matches m
       JOIN match_players mp ON mp.match_id = m.id
       WHERE mp.user_id = ? AND m.ranked = 1
         AND COALESCE(m.resolution, m.finish_reason) <> 'cancelled'`,
    )
      .bind(auth.user.id, auth.user.id)
      .first<RankedRow>(),
    context.env.DB.prepare(
      `SELECT game_id, mode, result, guess_count, elapsed_ms, completed_at
       FROM game_results WHERE user_id = ? AND mode_id = 'playable'
         AND activity_id IN ('daily', 'practice')
       ORDER BY completed_at DESC LIMIT 20`,
    )
      .bind(auth.user.id)
      .all<RecentRow>(),
    context.env.DB.prepare(
      `SELECT m.id AS match_id, m.winner_user_id,
              opponent.display_name AS opponent_display_name,
              own.score AS score_for, opponent.score AS score_against,
              COUNT(mg.ordinal) AS guess_count, m.ranked, m.started_at, m.completed_at
       FROM matches m
       JOIN match_players own ON own.match_id = m.id AND own.user_id = ?
       JOIN match_players opponent ON opponent.match_id = m.id AND opponent.user_id <> own.user_id
       LEFT JOIN match_guesses mg ON mg.match_id = m.id AND mg.user_id = own.user_id
       WHERE COALESCE(m.resolution, m.finish_reason) <> 'cancelled'
       GROUP BY m.id, m.winner_user_id, opponent.display_name, own.score, opponent.score,
                m.ranked, m.started_at, m.completed_at
       ORDER BY m.completed_at DESC LIMIT 20`,
    )
      .bind(auth.user.id)
      .all<MultiplayerRecentRow>(),
    context.env.DB.prepare(
      `SELECT DISTINCT date_key
       FROM game_results
       WHERE user_id = ? AND mode_id = 'playable'
         AND mode = 'daily' AND result = 'won' AND date_key IS NOT NULL
       ORDER BY date_key`,
    )
      .bind(auth.user.id)
      .all<{ date_key: string }>(),
  ]);
  const dailyStreak = streaks(
    dailyRows.results.map((row) => row.date_key),
    getBeijingDateKey(),
  );
  return ok(context, {
    dailyPlayed: aggregate?.daily_played ?? 0,
    dailyWon: aggregate?.daily_won ?? 0,
    currentStreak: dailyStreak.current,
    bestStreak: dailyStreak.best,
    randomPlayed: aggregate?.random_played ?? 0,
    randomWon: aggregate?.random_won ?? 0,
    rankedPlayed: ranked?.ranked_played ?? 0,
    rankedWon: ranked?.ranked_won ?? 0,
    averageGuesses: aggregate?.average_guesses ?? 0,
    recent: [
      ...recentRows.results.map((row) => ({
        id: row.game_id,
        mode: row.mode,
        result: row.result === "expired" ? "lost" : row.result,
        guesses: row.guess_count,
        elapsedMs: row.elapsed_ms,
        playedAt: new Date(row.completed_at).toISOString(),
      })),
      ...multiplayerRows.results.map((row) => ({
        id: row.match_id,
        mode: "multiplayer",
        result:
          row.winner_user_id === null
            ? "draw"
            : row.winner_user_id === auth.user.id
              ? "won"
              : "lost",
        guesses: row.guess_count,
        elapsedMs: Math.max(0, row.completed_at - row.started_at),
        playedAt: new Date(row.completed_at).toISOString(),
        opponentDisplayName: row.opponent_display_name,
        scoreFor: row.score_for,
        scoreAgainst: row.score_against,
        ranked: row.ranked === 1,
      })),
    ]
      .sort((left, right) => Date.parse(right.playedAt) - Date.parse(left.playedAt))
      .slice(0, 20),
  });
});

analyticsRoutes.get("/leaderboards/elo", async (context) => {
  const rows = await context.env.DB.prepare(
    `SELECT display_name, elo, ranked_matches
     FROM users
      WHERE is_guest = 0 AND leaderboard_eligible = 1 AND merged_into_user_id IS NULL
     ORDER BY elo DESC, ranked_matches DESC, created_at ASC
     LIMIT 100`,
  ).all<{ display_name: string; elo: number; ranked_matches: number }>();
  return ok(
    context,
    rows.results.map((row, index) => ({
      rank: index + 1,
      displayName: row.display_name,
      elo: row.elo,
      rankedMatches: row.ranked_matches,
    })),
  );
});
