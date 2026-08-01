import { DifficultySchema } from "@fireflydle/contracts";
import { getBeijingDateKey } from "@fireflydle/game-engine";
import { Hono } from "hono";
import { ApiProblem, ok } from "../lib/http";
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

interface DailyBoardRow {
  user_id: string;
  display_name: string;
  guess_count: number;
  elapsed_ms: number;
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
  const [aggregate, ranked, recentRows, dailyRows] = await Promise.all([
    context.env.DB.prepare(
      `SELECT
         SUM(CASE WHEN mode = 'daily' THEN 1 ELSE 0 END) AS daily_played,
         SUM(CASE WHEN mode = 'daily' AND result = 'won' THEN 1 ELSE 0 END) AS daily_won,
         SUM(CASE WHEN mode = 'random' THEN 1 ELSE 0 END) AS random_played,
         SUM(CASE WHEN mode = 'random' AND result = 'won' THEN 1 ELSE 0 END) AS random_won,
         AVG(CASE WHEN result IN ('won', 'lost') THEN guess_count END) AS average_guesses
       FROM game_results WHERE user_id = ?`,
    )
      .bind(auth.user.id)
      .first<AggregateRow>(),
    context.env.DB.prepare(
      `SELECT
         COUNT(*) AS ranked_played,
         SUM(CASE WHEN m.winner_user_id = ? THEN 1 ELSE 0 END) AS ranked_won
       FROM matches m
       JOIN match_players mp ON mp.match_id = m.id
       WHERE mp.user_id = ? AND m.ranked = 1 AND m.finish_reason <> 'cancelled'`,
    )
      .bind(auth.user.id, auth.user.id)
      .first<RankedRow>(),
    context.env.DB.prepare(
      `SELECT game_id, mode, result, guess_count, elapsed_ms, completed_at
       FROM game_results WHERE user_id = ?
       ORDER BY completed_at DESC LIMIT 20`,
    )
      .bind(auth.user.id)
      .all<RecentRow>(),
    context.env.DB.prepare(
      `SELECT DISTINCT date_key
       FROM game_results
       WHERE user_id = ? AND mode = 'daily' AND result = 'won' AND date_key IS NOT NULL
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
    recent: recentRows.results.map((row) => ({
      id: row.game_id,
      mode: row.mode,
      result: row.result === "expired" ? "lost" : row.result,
      guesses: row.guess_count,
      elapsedMs: row.elapsed_ms,
      playedAt: new Date(row.completed_at).toISOString(),
    })),
  });
});

analyticsRoutes.get("/leaderboards/daily", async (context) => {
  const difficulty = DifficultySchema.safeParse(context.req.query("difficulty") ?? "standard");
  if (!difficulty.success) throw new ApiProblem("VALIDATION_FAILED", 400);
  const dateKey = context.req.query("date") ?? getBeijingDateKey();
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(dateKey)) {
    throw new ApiProblem("VALIDATION_FAILED", 400, { field: "date" });
  }
  const entries = await context.env.DB.prepare(
    `SELECT gr.user_id, u.display_name, gr.guess_count, gr.elapsed_ms
     FROM game_results gr
     JOIN users u ON u.id = gr.user_id
     WHERE gr.mode = 'daily' AND gr.result = 'won' AND gr.date_key = ?
       AND gr.difficulty = ? AND u.is_guest = 0 AND u.leaderboard_eligible = 1
       AND gr.leaderboard_hidden_at IS NULL
     ORDER BY gr.guess_count ASC, gr.elapsed_ms ASC, gr.completed_at ASC
     LIMIT 100`,
  )
    .bind(dateKey, difficulty.data)
    .all<DailyBoardRow>();
  const streakRows = await context.env.DB.prepare(
    `SELECT DISTINCT gr.user_id, gr.date_key
     FROM game_results gr
     JOIN users u ON u.id = gr.user_id
     WHERE gr.mode = 'daily' AND gr.result = 'won' AND gr.date_key <= ?
       AND u.is_guest = 0 AND u.leaderboard_eligible = 1
       AND gr.date_key >= ?`,
  )
    .bind(dateKey, shiftDateKey(dateKey, -400))
    .all<{ user_id: string; date_key: string }>();
  const datesByUser = new Map<string, string[]>();
  for (const row of streakRows.results) {
    const dates = datesByUser.get(row.user_id) ?? [];
    dates.push(row.date_key);
    datesByUser.set(row.user_id, dates);
  }
  return ok(
    context,
    entries.results.map((entry, index) => ({
      rank: index + 1,
      displayName: entry.display_name,
      guesses: entry.guess_count,
      elapsedMs: entry.elapsed_ms,
      streak: streaks(datesByUser.get(entry.user_id) ?? [], dateKey).current,
    })),
  );
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
