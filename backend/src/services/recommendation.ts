import { Env, AISource } from '../types';
import { QueryService } from './query';
import { generateId } from '../utils/id';

interface RecentAscent {
  route_id: string;
  route_name: string;
  grade: string;
  crag_name: string;
}

export interface RecommendationPayload {
  answer: string;
  sources: AISource[];
  query: string;
  context_ascents: RecentAscent[];
}

// YDS grade → numeric（5.11d → 113, 5.12a → 120）
function gradeToNumeric(grade: string): number {
  const match = grade.match(/5\.(\d+)([a-d])?/);
  if (!match) return 0;
  const base = parseInt(match[1], 10) * 10;
  const suffix = match[2] ? 'abcd'.indexOf(match[2]) : 0;
  return base + suffix;
}

// numeric → YDS grade string
function numericToGrade(n: number): string {
  const base = Math.floor(n / 10);
  const suffix = 'abcd'[n % 10] ?? '';
  return `5.${base}${suffix}`;
}

// 取得比當前難度高一級的目標範圍（min, max）
// 例如 5.11d (113) → min 5.12a (120), max 5.12b (121)
function incrementGrade(n: number): number {
  const suffix = n % 10;
  return suffix === 3 ? (Math.floor(n / 10) + 1) * 10 : n + 1;
}

// 從完攀紀錄取最高難度，計算推薦目標範圍
export function getTargetGradeRange(ascents: RecentAscent[]): { maxGrade: string; targetMin: string; targetMax: string } | null {
  const numerics = ascents
    .map((a) => gradeToNumeric(a.grade))
    .filter((n) => n > 0);
  if (numerics.length === 0) return null;

  const maxNumeric = Math.max(...numerics);
  const targetMinNumeric = incrementGrade(maxNumeric);
  const targetMaxNumeric = incrementGrade(targetMinNumeric);

  return {
    maxGrade: numericToGrade(maxNumeric),
    targetMin: numericToGrade(targetMinNumeric),
    targetMax: numericToGrade(targetMaxNumeric),
  };
}

export class RecommendationService {
  private queryService: QueryService;

  constructor(private env: Env) {
    this.queryService = new QueryService(env);
  }

  // 檢查系統觸發的每日上限（最多 3 次）
  async checkDailySystemLimit(userId: string): Promise<boolean> {
    const today = new Date().toISOString().slice(0, 10);
    const result = await this.env.DB.prepare(
      `SELECT COUNT(*) as count FROM user_recommendations
       WHERE user_id = ? AND triggered_by = 'ascent'
       AND date(created_at) = ?`
    )
      .bind(userId, today)
      .first<{ count: number }>();

    return (result?.count ?? 0) < 3;
  }

  // 依攀登能力程度構建推薦查詢字串（不含路線名稱，避免 vector 搜尋回撈已完攀路線）
  buildRecommendationQuery(recentAscents: RecentAscent[]): string {
    if (recentAscents.length === 0) {
      return '我想嘗試新路線，請推薦幾條適合初學到中級攀岩者的台灣運攀路線。';
    }

    const range = getTargetGradeRange(recentAscents);
    if (!range) {
      return '我想嘗試新路線，請推薦幾條適合中級攀岩者的台灣運攀路線。';
    }

    return `我的攀登程度約 ${range.maxGrade}，請推薦難度在 ${range.targetMin}–${range.targetMax} 的路線，或難度相近但類型不同的路線（傳攀 / 抱石）。`;
  }

  // 主方法：產生推薦並儲存
  async generate(userId: string, triggeredBy: 'ascent' | 'manual'): Promise<void> {
    const id = generateId();

    try {
      // 取用戶近 5 條完攀紀錄，包含 route_id 供排除用
      const ascentsResult = await this.env.DB.prepare(
        `SELECT a.route_id, r.name as route_name, r.grade, c.name as crag_name
         FROM user_route_ascents a
         JOIN routes r ON a.route_id = r.id
         JOIN crags c ON r.crag_id = c.id
         WHERE a.user_id = ?
         ORDER BY a.ascent_date DESC, a.created_at DESC
         LIMIT 5`
      )
        .bind(userId)
        .all<RecentAscent>();

      const recentAscents = ascentsResult.results ?? [];
      const query = this.buildRecommendationQuery(recentAscents);

      // 已完攀 route_id 清單，供 pipeline retrieval 層排除
      const climbed_route_ids = recentAscents.map((a) => a.route_id).filter(Boolean);

      // 呼叫現有 RAG pipeline，傳入排除清單
      const aiResult = await this.queryService.ask(
        { query, limit: 5, include_sources: true, no_cache: true, climbed_route_ids },
        userId
      );

      const payload: RecommendationPayload = {
        answer: aiResult.answer,
        sources: aiResult.sources,
        query,
        context_ascents: recentAscents,
      };

      await this.env.DB.prepare(
        `INSERT INTO user_recommendations (id, user_id, triggered_by, status, recommendation, created_at)
         VALUES (?, ?, ?, 'success', ?, datetime('now'))`
      )
        .bind(id, userId, triggeredBy, JSON.stringify(payload))
        .run();
    } catch (error) {
      console.error('[RecommendationService] generate failed:', error);

      // DB 寫入失敗紀錄（兜底：若 insert 本身也失敗只有 console.error 可查）
      try {
        await this.env.DB.prepare(
          `INSERT INTO user_recommendations (id, user_id, triggered_by, status, recommendation, created_at)
           VALUES (?, ?, ?, 'failed', NULL, datetime('now'))`
        )
          .bind(id, userId, triggeredBy)
          .run();
      } catch (dbError) {
        console.error('[RecommendationService] failed to write error record:', dbError);
      }
    }
  }
}
