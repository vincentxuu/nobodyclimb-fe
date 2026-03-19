import { AISource, AIDocumentMetadata } from '../../../types';
import { PipelineStep, PipelineContext } from '../types';

export const popularityRerankStep: PipelineStep = {
  id: 'popularity-rerank',
  name: '熱門度加權排序',
  description: '依影片數量加權排序路線，組合 sources 和 context 文字',
  phase: 'post-retrieval',
  defaultEnabled: true,
  defaultOrder: 10,
  requires: ['rerankedMatches', 'documents'],
  provides: ['sources', 'context'],
  skipWhen: [{ field: 'queryType', operator: 'in', value: ['general-knowledge', 'sql', 'hybrid', 'clarification-needed', 'multi-tool'] }],

  async execute(ctx: PipelineContext): Promise<PipelineContext> {
    // Plan-and-Execute 已完成 synthesis，跳過 post-retrieval
    if (ctx.skipPostRetrieval) {
      return ctx;
    }

    const { env, pipelineConfig, trace, queryService } = ctx;
    let rerankedMatches = ctx.rerankedMatches ?? [];
    const documents = ctx.documents ?? new Map();

    // 排除已完攀路線（推薦情境：ctx.climbed_route_ids 由 RecommendationService 注入）
    const climbedIds = ctx.climbed_route_ids;
    if (climbedIds && climbedIds.length > 0) {
      const climbedSet = new Set(climbedIds);
      const before = rerankedMatches.length;
      rerankedMatches = rerankedMatches.filter((match) => {
        const doc = documents.get(match.id);
        return !doc || doc.type !== 'route' || !climbedSet.has(doc.source_id);
      });
      if (trace.mmr_selection) {
        (trace.mmr_selection as Record<string, unknown>).climbed_excluded = before - rerankedMatches.length;
      }
    }

    // 查詢影片數量（限制 500 筆避免超過 D1 bind 參數上限）
    const routeSourceIds = [...documents.values()]
      .filter((d) => d.type === 'route')
      .map((d) => d.source_id)
      .slice(0, 500);

    const videoCountMap = new Map<string, number>();
    const latestVideoMap = new Map<string, string>();

    if (routeSourceIds.length > 0) {
      const placeholders = routeSourceIds.map(() => '?').join(', ');
      const [vcResult, latestVideoResult] = await Promise.all([
        env.DB.prepare(
          `SELECT route_id, COUNT(*) as cnt FROM route_videos WHERE route_id IN (${placeholders}) GROUP BY route_id`
        ).bind(...routeSourceIds).all<{ route_id: string; cnt: number }>(),
        env.DB.prepare(
          `SELECT rv.route_id, v.youtube_id
           FROM route_videos rv
           JOIN videos v ON rv.video_id = v.id
           WHERE rv.route_id IN (${placeholders}) AND v.youtube_id IS NOT NULL
           ORDER BY rv.route_id, COALESCE(v.published_at, rv.created_at) DESC`
        ).bind(...routeSourceIds).all<{ route_id: string; youtube_id: string }>(),
      ]);
      for (const row of vcResult.results) {
        videoCountMap.set(row.route_id, row.cnt);
      }
      const seenRoutes = new Set<string>();
      for (const row of latestVideoResult.results) {
        if (!seenRoutes.has(row.route_id)) {
          latestVideoMap.set(row.route_id, `https://youtube.com/watch?v=${row.youtube_id}`);
          seenRoutes.add(row.route_id);
        }
      }
    }

    ctx.videoCountMap = videoCountMap;
    ctx.latestVideoMap = latestVideoMap;

    const maxVideoCount = videoCountMap.size > 0 ? Math.max(...videoCountMap.values()) : 1;
    const safeMax = Math.max(maxVideoCount, 1);

    // 熱門度加權排序
    const finalReranked = rerankedMatches
      .map((match) => {
        const doc = documents.get(match.id);
        if (!doc || doc.type !== 'route') return { ...match, finalScore: match.score };
        const videoCount = videoCountMap.get(doc.source_id) ?? 0;
        const normalizedPop = videoCount / safeMax;
        return { ...match, finalScore: match.score * pipelineConfig.reranker_weight + normalizedPop * pipelineConfig.popularity_weight };
      })
      .sort((a, b) => b.finalScore - a.finalScore);

    ctx.rerankedMatches = finalReranked;

    // mmr_selection top_selected
    if (trace.mmr_selection) {
      (trace.mmr_selection as Record<string, unknown>).top_selected = finalReranked.map((m) => {
        const doc = documents.get(m.id);
        const videoCount = doc?.source_id ? (videoCountMap.get(doc.source_id) ?? 0) : 0;
        const normalizedPop = safeMax > 0 ? videoCount / safeMax : 0;
        return {
          title: doc ? queryService.extractTitle(doc) : m.id,
          relevance_score: Math.round(m.score * 1000) / 1000,
          popularity_score: Math.round(normalizedPop * 1000) / 1000,
          final_score: Math.round(m.finalScore * 1000) / 1000,
        };
      });
    }

    // 組合 sources
    const sources: AISource[] = finalReranked
      .map((match) => {
        const doc = documents.get(match.id);
        if (!doc) return null;
        return {
          id: doc.source_id,
          type: doc.type,
          title: queryService.extractTitle(doc),
          excerpt: queryService.buildExcerpt(doc),
          url: queryService.buildUrl(doc),
          score: match.finalScore,
          latestVideoUrl: doc.type === 'route' ? latestVideoMap.get(doc.source_id) : undefined,
        } as AISource;
      })
      .filter((s): s is AISource => s !== null);

    ctx.sources = sources;

    // 組合 context 文字
    const orderedDocs = finalReranked
      .map((m) => documents.get(m.id))
      .filter((d): d is import('../../../types').AIDocument => d !== undefined);

    const docsText = orderedDocs.length > 0
      ? orderedDocs.map((d) => {
          if (d.type === 'route') {
            const vc = videoCountMap.get(d.source_id) ?? 0;
            let text = d.text;
            const meta = d.metadata ? (JSON.parse(d.metadata) as AIDocumentMetadata) : {} as AIDocumentMetadata;
            if (meta.crag_id) {
              text += `\n路線連結：/crag/${meta.crag_id}/route/${d.source_id}`;
            }
            if (vc > 0) {
              text += `\n影片數量：${vc}`;
            }
            return text;
          }
          return d.text;
        }).join('\n\n---\n\n')
      : '目前沒有找到相關資料。';

    ctx.context = ctx.referenceRouteInfo
      ? `${ctx.referenceRouteInfo}\n\n以下是相近難度的推薦路線：\n\n${docsText}`
      : docsText;

    // generation trace
    const isPersonalized = !!(ctx.memorySummary || ctx.ascentContext?.length);
    trace.generation = {
      context_doc_count: orderedDocs.length,
      personalized: !!ctx.userId,
      regen_triggered: false,
      ability_level: ctx.abilityLevel,
      memory_summary_length: ctx.memorySummary ? ctx.memorySummary.length : 0,
      context_doc_titles: orderedDocs.slice(0, 10).map((d) => queryService.extractTitle(d)),
      prompt_template: isPersonalized ? 'personalized' : 'default',
      memory_summary_preview: ctx.memorySummary ? ctx.memorySummary.slice(0, 200) : null,
    };

    return ctx;
  },
};
