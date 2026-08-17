import { getBeijingDateKey } from "@fireflydle/game-engine";
import { Hono } from "hono";
import { ok } from "../lib/http";
import { requireAuth } from "../services/auth";
import { getReplayGame } from "../services/games";
import type { AppContext } from "../types";

interface AggregateRow {
  practice_played: number;
  practice_won: number;
  guess_sum: number;
  guess_games: number;
}

interface RankedRow {
  ranked_played: number;
  ranked_won: number;
}

interface RecentRow {
  game_id: string;
  mode_id: string;
  activity_id: string;
  result: string;
  guess_count: number;
  elapsed_ms: number;
  completed_at: number;
}

interface DailyCompletionRow {
  game_id: string;
  user_id: string;
  date_key: string;
  result: "won" | "lost";
  guess_count: number;
  completed_at: number;
}

interface CountRow {
  count: number;
}

interface MultiplayerRecentRow {
  match_id: string;
  mode_id: string;
  activity_id: string;
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
  const today = getBeijingDateKey();
  const [aggregate, ranked, recentRows, multiplayerRows, dailyRows, todayRow] = await Promise.all([
    context.env.DB.prepare(
      `SELECT
         SUM(CASE WHEN activity_id = 'practice' THEN 1 ELSE 0 END) AS practice_played,
         SUM(CASE WHEN activity_id = 'practice' AND result = 'won' THEN 1 ELSE 0 END) AS practice_won,
         SUM(CASE WHEN activity_id = 'practice' AND result IN ('won', 'lost')
                  THEN guess_count ELSE 0 END)
           AS guess_sum,
         SUM(CASE WHEN activity_id = 'practice' AND result IN ('won', 'lost')
                  THEN 1 ELSE 0 END)
           AS guess_games
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
         AND m.mode_id = 'playable' AND m.activity_id = 'ranked-match'
         AND m.match_format = 3
         AND COALESCE(m.resolution, m.finish_reason) <> 'cancelled'`,
    )
      .bind(auth.user.id, auth.user.id)
      .first<RankedRow>(),
    context.env.DB.prepare(
      `SELECT game_id, mode_id, activity_id, result, guess_count, elapsed_ms, completed_at
       FROM game_results WHERE user_id = ? AND mode_id = 'playable'
         AND activity_id IN ('daily', 'practice')
       ORDER BY completed_at DESC LIMIT 20`,
    )
      .bind(auth.user.id)
      .all<RecentRow>(),
    context.env.DB.prepare(
      `SELECT m.id AS match_id, m.mode_id, m.activity_id, m.winner_user_id,
              opponent.display_name AS opponent_display_name,
              own.score AS score_for, opponent.score AS score_against,
              COUNT(mg.ordinal) AS guess_count, m.ranked, m.started_at, m.completed_at
       FROM matches m
       JOIN match_players own ON own.match_id = m.id AND own.user_id = ?
       JOIN match_players opponent ON opponent.match_id = m.id AND opponent.user_id <> own.user_id
       LEFT JOIN match_guesses mg ON mg.match_id = m.id AND mg.user_id = own.user_id
       WHERE COALESCE(m.resolution, m.finish_reason) <> 'cancelled'
        GROUP BY m.id, m.mode_id, m.activity_id, m.winner_user_id, opponent.display_name,
                 own.score, opponent.score, m.ranked, m.started_at, m.completed_at
       ORDER BY m.completed_at DESC LIMIT 20`,
    )
      .bind(auth.user.id)
      .all<MultiplayerRecentRow>(),
    context.env.DB.prepare(
      `SELECT result.game_id, result.user_id, result.date_key, result.result,
              result.guess_count, result.completed_at
       FROM game_results result
       JOIN users owner ON owner.id = result.user_id
       WHERE (result.user_id = ? OR owner.merged_into_user_id = ?)
         AND result.mode_id = 'playable' AND result.activity_id = 'daily'
         AND result.result IN ('won', 'lost')
         AND result.date_key IS NOT NULL
       ORDER BY result.date_key DESC,
                CASE WHEN result.user_id = ? THEN 0 ELSE 1 END,
                result.completed_at DESC`,
    )
      .bind(auth.user.id, auth.user.id, auth.user.id)
      .all<DailyCompletionRow>(),
    context.env.DB.prepare(
      `SELECT COUNT(DISTINCT COALESCE(owner.merged_into_user_id, result.user_id)) AS count
       FROM game_results result
       JOIN users owner ON owner.id = result.user_id
       WHERE result.mode_id = 'playable' AND result.activity_id = 'daily'
         AND result.result IN ('won', 'lost')
         AND result.date_key = ?`,
    )
      .bind(today)
      .first<CountRow>(),
  ]);
  const dailyByDate = new Map<string, DailyCompletionRow>();
  for (const row of dailyRows.results) {
    if (!dailyByDate.has(row.date_key)) dailyByDate.set(row.date_key, row);
  }
  const uniqueDaily = [...dailyByDate.values()];
  const dailyStreak = streaks(
    uniqueDaily.map((row) => row.date_key),
    today,
  );
  const guessDistribution = Array.from({ length: 6 }, (_, index) => ({
    guesses: index + 1,
    count: uniqueDaily.filter((row) => row.result === "won" && row.guess_count === index + 1)
      .length,
  }));
  const dailyGuessSum = uniqueDaily.reduce((sum, row) => sum + row.guess_count, 0);
  const totalGuessGames = (aggregate?.guess_games ?? 0) + uniqueDaily.length;
  const soloRecent = await Promise.all(
    recentRows.results.map(async (row) => {
      const game = await getReplayGame(context.env.DB, row.game_id);
      return {
        id: row.game_id,
        modeId: row.mode_id,
        activityId: row.activity_id,
        result: row.result === "expired" ? "lost" : row.result,
        guesses: row.guess_count,
        elapsedMs: row.elapsed_ms,
        playedAt: new Date(row.completed_at).toISOString(),
        ...(game.guesses.length === row.guess_count && game.inferenceReview
          ? { inferenceReview: game.inferenceReview }
          : {}),
      };
    }),
  );
  return ok(context, {
    dailyPlayed: uniqueDaily.length,
    dailyWon: uniqueDaily.filter((row) => row.result === "won").length,
    currentStreak: dailyStreak.current,
    bestStreak: dailyStreak.best,
    practicePlayed: aggregate?.practice_played ?? 0,
    practiceWon: aggregate?.practice_won ?? 0,
    rankedPlayed: ranked?.ranked_played ?? 0,
    rankedWon: ranked?.ranked_won ?? 0,
    averageGuesses:
      totalGuessGames === 0 ? 0 : ((aggregate?.guess_sum ?? 0) + dailyGuessSum) / totalGuessGames,
    dailyHistory: uniqueDaily.map((row) => ({
      id: row.game_id,
      dateKey: row.date_key,
      result: row.result,
      guesses: row.guess_count,
      completedAt: new Date(row.completed_at).toISOString(),
    })),
    guessDistribution,
    failedDaily: uniqueDaily.filter((row) => row.result === "lost").length,
    todayCompletions: todayRow?.count ?? 0,
    recent: [
      ...soloRecent,
      ...multiplayerRows.results.map((row) => ({
        id: row.match_id,
        modeId: row.mode_id,
        activityId: row.activity_id,
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
