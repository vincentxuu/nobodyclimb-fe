import { Env, AISource } from '../types';
import { QueryService } from './query';
import { generateId } from '../utils/id';

interface RecentAscent {
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

  // 依近期完攀紀錄構建推薦查詢字串
  // 注意：只帶路線名稱與難度，不帶岩場名稱，避免 LLM Tool Calling 誤將用戶舊岩場設為位置篩選
  buildRecommendationQuery(recentAscents: RecentAscent[]): string {
    if (recentAscents.length === 0) {
      return '我想嘗試新路線，請推薦幾條適合初學到中級攀岩者的台灣運攀路線。';
    }

    const ascentList = recentAscents
      .slice(0, 5)
      .map((a) => `${a.route_name}（${a.grade}）`)
      .join('、');

    return `我最近完攀了：${ascentList}。請推薦 3 條我尚未爬過、適合下一步挑戰的路線，難度可以稍高一級或類型不同。`;
  }

  // 主方法：產生推薦並儲存
  async generate(userId: string, triggeredBy: 'ascent' | 'manual'): Promise<void> {
    const id = generateId();

    try {
      // 取用戶近 5 條完攀紀錄
      const ascentsResult = await this.env.DB.prepare(
        `SELECT r.name as route_name, r.grade, c.name as crag_name
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

      // 呼叫現有 RAG pipeline
      const aiResult = await this.queryService.ask(
        { query, limit: 5, include_sources: true, no_cache: true },
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
