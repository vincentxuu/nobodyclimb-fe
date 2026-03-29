import { AIDocumentMetadata, AISource } from '../../../types'
import { endSpan, startSpan } from '../../../utils/langfuse'
import { SearchResult } from '../../pipeline/types'
import { GraphState } from '../state'

/**
 * Agentic Retrieve Node
 *
 * 執行單步 agentic 搜尋，基於 agenticDecision 設定的 loopBack.reason（refinedQuery）
 * 搜尋新文件並合併到 candidateMatches。
 *
 * 使用 queryService.searchBM25 + env.VECTOR_INDEX + embeddingProvider 執行 hybrid 搜尋，
 * 再以 RRF 合併所有路徑的結果。
 */
export async function agenticRetrieveNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'agentic-retrieve', {
    loopCount: state.loopCount,
    currentDocCount: state.candidateMatches?.length ?? 0,
  })

  try {
    const { pipelineConfig, request, queryService, env, embeddingProvider } = state
    const existingMatches = state.candidateMatches ?? []

    // 取得本步搜尋的 query：優先使用 loopBack.reason（由 agenticDecision 設定的 refinedQuery）
    const searchQuery = state.loopBack?.reason ?? request.query
    const vectorFilter = state.vectorFilter ?? {}

    const cragFilter = vectorFilter['crag_id'] as { $in?: string[] } | undefined
    const isMultiCrag = Array.isArray(cragFilter?.$in) && cragFilter.$in.length > 1
    const MERGE_TOP_K = isMultiCrag
      ? Math.max(20, pipelineConfig.merge_top_k * 2)
      : pipelineConfig.merge_top_k

    const newMatches: SearchResult[] = []

    // 向量搜尋（若有 embeddingProvider）
    if (embeddingProvider) {
      try {
        const queryVector = await embeddingProvider.embed(searchQuery)
        const vecResult = await env.VECTOR_INDEX.query(queryVector, {
          topK: MERGE_TOP_K,
          returnMetadata: 'all',
          filter: Object.keys(vectorFilter).length > 0 ? vectorFilter : undefined,
        })
        const vecMatches: SearchResult[] = vecResult.matches.map(
          (m: { id: string; score: number; metadata?: Record<string, unknown> }) => ({
            id: m.id,
            score: m.score,
            metadata: m.metadata,
          })
        )
        newMatches.push(...vecMatches)
      } catch {
        // embedding 失敗：靜默降級，繼續 BM25
      }
    }

    // BM25 搜尋
    const bm25Matches = await queryService.searchBM25(searchQuery, pipelineConfig.bm25_top_k)
    newMatches.push(...bm25Matches)

    // RRF 合併：新結果 + 既有結果一起合併，去重並重新排序
    const allPaths: SearchResult[][] = [newMatches, existingMatches]
    const AGENTIC_MERGE_K = MERGE_TOP_K * 3
    const merged = queryService.mergeResults(allPaths, AGENTIC_MERGE_K)

    const retrievalScore = merged.length > 0 ? Math.max(...merged.map((m) => m.score)) : 0

    // Fetch 全文文件 + 排除參考路線（支援多條）
    const documents = await queryService.getDocuments(merged.map((m) => m.id))
    const excludeIds = state.excludeRouteIds ?? (state.excludeRouteId ? [state.excludeRouteId] : [])
    if (excludeIds.length > 0) {
      const excludeSet = new Set(excludeIds)
      for (const [embeddingId, doc] of documents) {
        if (excludeSet.has(doc.source_id)) documents.delete(embeddingId)
      }
    }

    // 組裝 context 與 sources，讓 llmGeneration 有內容可用
    const orderedDocs = merged
      .map((m) => documents.get(m.id))
      .filter((d): d is import('../../../types').AIDocument => d !== undefined)

    // 查詢影片數量與最新影片連結（同 popularityRerankNode 邏輯）
    const routeSourceIds = orderedDocs
      .filter((d) => d.type === 'route')
      .map((d) => d.source_id)
      .slice(0, 500)

    const videoCountMap = new Map<string, number>()
    const latestVideoMap = new Map<string, string>()

    if (routeSourceIds.length > 0) {
      const placeholders = routeSourceIds.map(() => '?').join(', ')
      const [vcResult, latestVideoResult] = await Promise.all([
        env.DB.prepare(
          `SELECT route_id, COUNT(*) as cnt FROM route_videos WHERE route_id IN (${placeholders}) GROUP BY route_id`
        )
          .bind(...routeSourceIds)
          .all<{ route_id: string; cnt: number }>(),
        env.DB.prepare(
          `SELECT rv.route_id, v.youtube_id
           FROM route_videos rv
           JOIN videos v ON rv.video_id = v.id
           WHERE rv.route_id IN (${placeholders}) AND v.youtube_id IS NOT NULL
           ORDER BY rv.route_id, COALESCE(v.published_at, rv.created_at) DESC`
        )
          .bind(...routeSourceIds)
          .all<{ route_id: string; youtube_id: string }>(),
      ])
      for (const row of vcResult.results) {
        videoCountMap.set(row.route_id, row.cnt)
      }
      const seenRoutes = new Set<string>()
      for (const row of latestVideoResult.results) {
        if (!seenRoutes.has(row.route_id)) {
          latestVideoMap.set(row.route_id, `https://youtube.com/watch?v=${row.youtube_id}`)
          seenRoutes.add(row.route_id)
        }
      }
    }

    const docsText =
      orderedDocs.length > 0
        ? orderedDocs
            .map((d) => {
              if (d.type === 'route') {
                let text = d.text
                const meta = d.metadata
                  ? (JSON.parse(d.metadata) as AIDocumentMetadata)
                  : ({} as AIDocumentMetadata)
                if (meta.crag_id) {
                  text += `\n路線連結：/crag/${meta.crag_id}/route/${d.source_id}`
                }
                const vc = videoCountMap.get(d.source_id) ?? 0
                if (vc > 0) {
                  text += `\n影片數量：${vc}`
                }
                return text
              }
              return d.text
            })
            .join('\n\n---\n\n')
        : '目前沒有找到相關資料。'

    const context = state.referenceRouteInfo
      ? `${state.referenceRouteInfo}\n\n以下是相近難度的推薦路線：\n\n${docsText}`
      : docsText

    const sources: AISource[] = orderedDocs
      .map(
        (doc) =>
          ({
            id: doc.source_id,
            type: doc.type,
            title: queryService.extractTitle(doc),
            excerpt: queryService.buildExcerpt(doc),
            url: queryService.buildUrl(doc),
            score:
              merged.find((m) => m.id === doc.source_id || documents.get(m.id) === doc)?.score ?? 0,
            latestVideoUrl:
              doc.type === 'route' ? latestVideoMap.get(doc.source_id) : undefined,
          }) as AISource
      )
      .filter((s): s is AISource => s !== null)

    endSpan(span, {
      output: {
        newDocCount: newMatches.length,
        mergedDocCount: merged.length,
        searchQuery,
      },
    })

    return {
      candidateMatches: merged,
      documents,
      context,
      sources,
      retrievalScore,
      loopBack: undefined, // 清除 loopBack，避免殘留
      trace: {
        agentic_retrieve: {
          step: (state.loopCount ?? 1) - 1,
          search_query: searchQuery,
          new_doc_count: newMatches.length,
          merged_doc_count: merged.length,
          context_doc_count: orderedDocs.length,
        },
      },
    }
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    throw err
  }
}
