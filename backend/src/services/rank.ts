import { D1Database } from '@cloudflare/workers-types';
import { RankId, UserRank, RankScoreBreakdown, UserRankDetail } from '@nobodyclimb/types';

// 段位積分門檻（須與 climber_ranks 資料表一致）
const RANK_THRESHOLDS: { id: RankId; min_score: number; daily_ai_limit: number }[] = [
  { id: 'summit',  min_score: 85, daily_ai_limit: 24 },
  { id: 'ridge',   min_score: 55, daily_ai_limit: 12 },
  { id: 'wall',    min_score: 25, daily_ai_limit: 6  },
  { id: 'foothill',min_score: 0,  daily_ai_limit: 2  },
];

function scoreToRank(score: number): { id: RankId; daily_ai_limit: number } {
  return RANK_THRESHOLDS.find(r => score >= r.min_score) ?? RANK_THRESHOLDS[3];
}

/** 計算用戶的段位積分明細 */
export async function calculateUserScore(userId: string, db: D1Database): Promise<RankScoreBreakdown> {
  // 取得 biography_id
  const bio = await db
    .prepare('SELECT id, climbing_start_year, frequent_locations, favorite_route_type, climbing_reason, climbing_meaning, bucket_list, is_public FROM biographies WHERE user_id = ?')
    .bind(userId)
    .first<{ id: string; climbing_start_year: string | null; frequent_locations: string | null; favorite_route_type: string | null; climbing_reason: string | null; climbing_meaning: string | null; bucket_list: string | null; is_public: number }>();

  if (!bio) {
    return { biography_fields: 0, biography_bucket_list: 0, biography_public: 0, core_stories: 0, one_liners: 0, stories: 0, route_ascents: 0, bucket_list_items: 0, bucket_list_completed: 0, total: 0 };
  }

  const bioId = bio.id;

  // 並行查詢各積分來源
  const [coreStoriesRow, oneLinerRow, storiesRow, ascentsRow, bucketRow, bucketCompletedRow] = await Promise.all([
    db.prepare('SELECT COUNT(*) as cnt FROM biography_core_stories WHERE biography_id = ?').bind(bioId).first<{ cnt: number }>(),
    db.prepare('SELECT COUNT(*) as cnt FROM biography_one_liners WHERE biography_id = ?').bind(bioId).first<{ cnt: number }>(),
    db.prepare('SELECT COUNT(*) as cnt FROM biography_stories WHERE biography_id = ?').bind(bioId).first<{ cnt: number }>(),
    db.prepare('SELECT COUNT(*) as cnt FROM user_route_ascents WHERE user_id = ?').bind(userId).first<{ cnt: number }>(),
    db.prepare('SELECT COUNT(*) as cnt FROM bucket_list_items WHERE biography_id = ?').bind(bioId).first<{ cnt: number }>(),
    db.prepare("SELECT COUNT(*) as cnt FROM bucket_list_items WHERE biography_id = ? AND status = 'completed'").bind(bioId).first<{ cnt: number }>(),
  ]);

  // biography 文字欄位（每填一欄 +3，上限 15）
  const filledFields = [bio.climbing_start_year, bio.frequent_locations, bio.favorite_route_type, bio.climbing_reason, bio.climbing_meaning].filter(Boolean).length;
  const biography_fields = Math.min(filledFields * 3, 15);

  // bucket_list 欄位
  const biography_bucket_list = bio.bucket_list ? 3 : 0;

  // 公開 biography
  const biography_public = bio.is_public ? 5 : 0;

  // 核心故事（上限 24 = 3篇 × 8）
  const core_stories = Math.min((coreStoriesRow?.cnt ?? 0) * 8, 24);

  // one-liners（上限 20 = 10篇 × 2）
  const one_liners = Math.min((oneLinerRow?.cnt ?? 0) * 2, 20);

  // stories（上限 15 = 5篇 × 3）
  const stories = Math.min((storiesRow?.cnt ?? 0) * 3, 15);

  // 攀爬記錄（上限 20 = 20筆 × 1）
  const route_ascents = Math.min(ascentsRow?.cnt ?? 0, 20);

  // 人生清單（上限 10 = 10項 × 1）
  const bucket_list_items = Math.min(bucketRow?.cnt ?? 0, 10);

  // 人生清單已完成（上限 10 = 5項 × 2）
  const bucket_list_completed = Math.min((bucketCompletedRow?.cnt ?? 0) * 2, 10);

  const total = biography_fields + biography_bucket_list + biography_public + core_stories + one_liners + stories + route_ascents + bucket_list_items + bucket_list_completed;

  return { biography_fields, biography_bucket_list, biography_public, core_stories, one_liners, stories, route_ascents, bucket_list_items, bucket_list_completed, total };
}

/** 查詢用戶段位記錄，不存在時回傳 null */
export async function getUserRank(userId: string, db: D1Database): Promise<UserRank | null> {
  return db
    .prepare('SELECT * FROM user_ranks WHERE user_id = ?')
    .bind(userId)
    .first<UserRank>();
}

/** 首次使用時初始化麓段位記錄（INSERT OR IGNORE） */
export async function initUserRank(userId: string, db: D1Database): Promise<void> {
  await db
    .prepare(`
      INSERT OR IGNORE INTO user_ranks (user_id, score, rank_id, daily_ai_used, daily_ai_limit, last_reset_date)
      VALUES (?, 0, 'foothill', 0, 2, date('now'))
    `)
    .bind(userId)
    .run();
}

/** 重算單一用戶積分與段位（有 rank_override_id 時跳過段位更新） */
export async function updateUserRank(userId: string, db: D1Database): Promise<UserRank> {
  const breakdown = await calculateUserScore(userId, db);
  const current = await getUserRank(userId, db);

  if (current?.rank_override_id) {
    // 有覆寫：只更新積分，不動段位與配額
    await db
      .prepare(`UPDATE user_ranks SET score = ?, last_score_calculated_at = datetime('now'), updated_at = datetime('now') WHERE user_id = ?`)
      .bind(breakdown.total, userId)
      .run();
  } else {
    const { id: rankId, daily_ai_limit } = scoreToRank(breakdown.total);
    await db
      .prepare(`
        INSERT INTO user_ranks (user_id, score, rank_id, daily_ai_used, daily_ai_limit, last_reset_date, last_score_calculated_at)
        VALUES (?, ?, ?, 0, ?, date('now'), datetime('now'))
        ON CONFLICT(user_id) DO UPDATE SET
          score = excluded.score,
          rank_id = excluded.rank_id,
          daily_ai_limit = excluded.daily_ai_limit,
          last_score_calculated_at = excluded.last_score_calculated_at,
          updated_at = datetime('now')
      `)
      .bind(userId, breakdown.total, rankId, daily_ai_limit)
      .run();
  }

  return (await getUserRank(userId, db))!;
}

/** Cron: 重置所有用戶當日 AI 使用量 */
export async function resetDailyUsage(db: D1Database): Promise<void> {
  await db
    .prepare(`UPDATE user_ranks SET daily_ai_used = 0, last_reset_date = date('now'), updated_at = datetime('now')`)
    .run();
}

/** Cron: 批次重算所有活躍用戶段位（有 rank_override_id 的用戶只更新積分） */
export async function recalculateAllRanks(db: D1Database): Promise<void> {
  const users = await db
    .prepare('SELECT id FROM users WHERE is_active = 1')
    .all<{ id: string }>();

  for (const user of (users.results ?? [])) {
    try {
      await updateUserRank(user.id, db);
    } catch (err) {
      console.error(`[rank] 重算用戶 ${user.id} 失敗:`, err);
    }
  }
}

/** 查詢用戶段位詳情（含積分明細），供管理員使用 */
export async function getUserRankDetail(userId: string, db: D1Database): Promise<UserRankDetail | null> {
  const rank = await getUserRank(userId, db);
  if (!rank) return null;

  const breakdown = await calculateUserScore(userId, db);
  const rankInfo = RANK_THRESHOLDS.find(r => r.id === rank.rank_id);

  return {
    ...rank,
    rank_display_name: { foothill: '麓', wall: '壁', ridge: '稜', summit: '巔' }[rank.rank_id] ?? rank.rank_id,
    score_breakdown: breakdown,
  };
}
