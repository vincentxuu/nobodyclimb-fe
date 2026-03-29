import type { AISource } from '../../../types'
import { SQL_RESULT_ASSEMBLY_PROMPT } from '../../../utils/ai-prompts'
import { endSpan, startSpan } from '../../../utils/langfuse'
import { SqlExecutionError, TextToSqlService } from '../../text-to-sql'
import { GraphState } from '../state'

export async function textToSqlNode(state: GraphState): Promise<Partial<GraphState>> {
  // skipWhen：queryType in ['simple', 'complex', 'general-knowledge', 'multi-tool']
  if (
    state.queryType === 'simple' ||
    state.queryType === 'complex' ||
    state.queryType === 'general-knowledge' ||
    state.queryType === 'multi-tool'
  ) {
    return {}
  }

  const span = startSpan(state.langfuseTrace ?? null, 'text-to-sql', {
    query: state.request.query,
    queryType: state.queryType,
  })

  try {
    const sqlService = new TextToSqlService(state.env.DB)

    // 個人完攀模板：未登入時直接回傳
    if (
      state.sqlTemplate &&
      TextToSqlService.isPersonalTemplate(state.sqlTemplate) &&
      !state.userId
    ) {
      const result = await handleLoginRequired(state)
      endSpan(span, { output: { path: 'login_required' } })
      return result
    }

    // === SQL 路徑 ===
    if (state.queryType === 'sql') {
      const result = await handleSqlPath(state, sqlService, span)
      return result
    }

    // === Hybrid 路徑 ===
    if (state.queryType === 'hybrid') {
      const result = await handleHybridPath(state, sqlService, span)
      return result
    }

    // === Clarification-needed 路徑 ===
    if (state.queryType === 'clarification-needed') {
      const result = await handleClarificationPath(state, span)
      return result
    }

    endSpan(span, { output: { path: 'noop' } })
    return {}
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    throw err
  }
}

// SQL 路徑：執行 SQL 模板，組裝自然語言回答
async function handleSqlPath(
  state: GraphState,
  sqlService: TextToSqlService,
  span: ReturnType<typeof startSpan>
): Promise<Partial<GraphState>> {
  const { request, pipelineConfig, queryService } = state
  const { query } = request
  const template = state.sqlTemplate

  if (!template || !TextToSqlService.isSupported(template)) {
    endSpan(span, { output: { path: 'sql', fallback: 'no_template' } })
    return fallbackToRag('no_template')
  }

  try {
    const params = { ...(state.sqlParams || {}) } as Record<string, unknown>

    // 個人完攀模板注入 user_id
    if (TextToSqlService.isPersonalTemplate(template)) {
      params.user_id = state.userId
    }

    // 需要岩場 ID 的模板：解析 crag_name → crag_id
    if (params.crag_name && !params.crag_id) {
      const crags = state.preloadedCrags ?? []
      const areas = state.preloadedAreas ?? []
      const locationFilter = queryService.extractLocationFilter(query, crags, areas)
      if (locationFilter?.cragIds?.length) {
        params.crag_id = locationFilter.cragIds[0]
      } else {
        const crag = crags.find(
          (c) => c.name === params.crag_name || c.name.includes(params.crag_name as string)
        )
        if (crag) params.crag_id = crag.id
      }
    }

    // 需要路線名稱驗證的模板
    if (TextToSqlService.requiresRouteValidation(template) && params.route_name) {
      const cragId = params.crag_id as string | undefined
      const route = await sqlService.validateRouteName(params.route_name as string, cragId)
      if (!route) {
        endSpan(span, { output: { path: 'sql', fallback: 'route_not_found' } })
        return fallbackToRag('route_not_found')
      }
      params.route_id = route.id
    }

    // 清單模板：限制回傳筆數
    const isListTemplate = [
      'LIST_ROUTES_BY_CRITERIA',
      'LIST_ROUTES_AT_GRADE',
      'ROUTES_WITH_VIDEOS',
    ].includes(template)
    if (isListTemplate && params.limit == null) {
      params.limit = pipelineConfig.list_response_limit
    }

    // 執行 SQL 模板
    const result = await sqlService.execute(template, params)

    if (result.rows.length === 0) {
      // 個人模板空結果：直接回傳友善訊息
      if (TextToSqlService.isPersonalTemplate(template)) {
        const emptyResult = await handleEmptyPersonalResponse(state, template, span)
        return emptyResult
      }
      endSpan(span, { output: { path: 'sql', fallback: 'empty_result' } })
      return fallbackToRag('empty_result')
    }

    // 用 LLM provider 組裝自然語言回答
    const assemblyRows = isListTemplate
      ? result.rows.map(({ description, ...rest }) => rest)
      : result.rows
    const assemblyMaxTokens = Math.min(200 + result.rows.length * 30, 2000)

    const assemblyPrompt = SQL_RESULT_ASSEMBLY_PROMPT.replace('{query}', query)
      .replace('{count}', String(result.rows.length))
      .replace('{results}', JSON.stringify(assemblyRows, null, 2))

    let answer: string
    let tokenBreakdownUpdate: GraphState['tokenBreakdown'] = {}

    if (state.llmProvider) {
      const llmResult = await state.llmProvider.chat([{ role: 'user', content: assemblyPrompt }], {
        model: pipelineConfig.lightweight_model,
        maxTokens: assemblyMaxTokens,
      })
      answer = llmResult.content || formatFallback(query, result.rows, template)
      if (llmResult.usage) {
        tokenBreakdownUpdate = {
          text_to_sql: {
            ...llmResult.usage,
            model: pipelineConfig.lightweight_model,
            estimated: false,
          },
        }
      } else {
        const estP = Math.ceil(assemblyPrompt.length / 2)
        const estC = Math.ceil(answer.length / 2)
        tokenBreakdownUpdate = {
          text_to_sql: {
            prompt_tokens: estP,
            completion_tokens: estC,
            total_tokens: estP + estC,
            model: pipelineConfig.lightweight_model,
            estimated: true,
          },
        }
      }
    } else {
      answer = formatFallback(query, result.rows, template)
      const estP = Math.ceil(assemblyPrompt.length / 2)
      const estC = Math.ceil(answer.length / 2)
      tokenBreakdownUpdate = {
        text_to_sql: {
          prompt_tokens: estP,
          completion_tokens: estC,
          total_tokens: estP + estC,
          model: pipelineConfig.lightweight_model,
          estimated: true,
        },
      }
    }

    const traceUpdate = {
      text_to_sql: {
        template,
        row_count: result.rows.length,
        path: 'sql',
      },
    }

    // tokenBreakdown 寫入 trace（earlyReturn 不經過 engine 的 postPipelineProcessing）
    const mergedTokenBreakdown = {
      ...state.tokenBreakdown,
      ...tokenBreakdownUpdate,
    }
    if (Object.keys(mergedTokenBreakdown).length > 0) {
      Object.assign(traceUpdate, { token_breakdown: mergedTokenBreakdown })
    }

    // 計算 token 總和
    const allTokenBreakdown = mergedTokenBreakdown
    const totalTokens = Object.values(allTokenBreakdown).reduce((sum, v) => {
      if (v && typeof v === 'object' && 'total_tokens' in v)
        return sum + ((v as { total_tokens: number }).total_tokens ?? 0)
      return sum
    }, 0)

    const queryId = await queryService.logQuery({
      userId: state.userId ?? null,
      query,
      response: answer,
      sources: [],
      latencyMs: Date.now() - state.startTime,
      tokenCount:
        totalTokens > 0 ? totalTokens : (tokenBreakdownUpdate.text_to_sql?.total_tokens ?? null),
      queryType: 'sql',
      modelUsed: pipelineConfig.lightweight_model,
      retrievalScore: 0,
      selfReflectionTriggered: 0,
      pipelineTrace: JSON.stringify({ ...state.trace, ...traceUpdate }),
    })

    const response = {
      answer,
      sources: [] as AISource[],
      query_id: queryId,
      suggested_questions: [] as string[],
      query_route: 'sql' as const,
    }

    // 個人模板不快取
    if (!TextToSqlService.isPersonalTemplate(template)) {
      await state.env.CACHE.put(state.cacheKey, JSON.stringify(response), {
        expirationTtl: state.cacheTtl,
      })
    }

    endSpan(span, {
      output: { path: 'sql', template, rowCount: result.rows.length },
    })

    return {
      earlyReturn: response,
      tokenBreakdown: tokenBreakdownUpdate,
      trace: traceUpdate,
    }
  } catch (err) {
    if (err instanceof Error && err.message === 'LOGIN_REQUIRED') {
      const result = await handleLoginRequired(state)
      endSpan(span, { output: { path: 'login_required' } })
      return result
    }
    const errorMessage = err instanceof Error ? err.message : String(err)
    const fallbackReason = err instanceof SqlExecutionError ? 'sql_error' : 'unknown_error'
    endSpan(span, {
      level: 'ERROR',
      metadata: { error: errorMessage, fallback: fallbackReason },
    })
    return {
      ...fallbackToRag(fallbackReason),
      trace: { sql_error: errorMessage },
    }
  }
}

// Hybrid 路徑：撈取候選集
async function handleHybridPath(
  state: GraphState,
  sqlService: TextToSqlService,
  span: ReturnType<typeof startSpan>
): Promise<Partial<GraphState>> {
  if (state.sqlTemplate && TextToSqlService.isPersonalTemplate(state.sqlTemplate)) {
    endSpan(span, {
      output: {
        path: 'hybrid',
        fallback: 'personal_template_not_supported_in_hybrid',
      },
    })
    return fallbackToRag('personal_template_not_supported_in_hybrid')
  }

  const { queryService } = state
  const params = { ...(state.sqlParams || {}) } as Record<string, unknown>

  try {
    // 解析 crag_name → crag_id
    if (params.crag_name && !params.crag_id) {
      const crags = state.preloadedCrags ?? []
      const areas = state.preloadedAreas ?? []
      const locationFilter = queryService.extractLocationFilter(state.request.query, crags, areas)
      if (locationFilter?.cragIds?.length) {
        params.crag_id = locationFilter.cragIds[0]
      } else {
        const crag = crags.find(
          (c) => c.name === params.crag_name || c.name.includes(params.crag_name as string)
        )
        if (crag) params.crag_id = crag.id
      }
    }

    const excludedIds: string[] | undefined =
      state.climbed_route_ids && state.climbed_route_ids.length > 0
        ? state.climbed_route_ids
        : undefined
    const candidates = await sqlService.queryCandidates(params, excludedIds)

    if (candidates.length === 0) {
      endSpan(span, {
        output: { path: 'hybrid', fallback: 'empty_candidates' },
      })
      return fallbackToRag('empty_candidates')
    }

    // 格式化為 context 文字
    const sqlContext = candidates
      .map((r) => {
        const routeType =
          r.route_type === 'sport'
            ? '運攀'
            : r.route_type === 'trad'
              ? '傳攀'
              : r.route_type === 'boulder'
                ? '抱石'
                : r.route_type === 'mixed'
                  ? '混合攀登'
                  : (r.route_type ?? '')
        const parts = [`路線名稱：${r.name}`, `難度：${r.grade ?? '未知'}`]
        if (routeType) parts.push(`類型：${routeType}`)
        if (r.crag_name) parts.push(`岩場：${r.crag_name}`)
        if (r.bolt_count) parts.push(`bolt 數：${r.bolt_count}`)
        if (r.height) parts.push(`高度：${r.height}m`)
        if (r.description) parts.push(`描述：${(r.description as string).slice(0, 100)}`)
        return parts.join('，')
      })
      .join('\n')

    const candidateDetails = candidates.map((r) => ({
      name: r.name,
      grade: r.grade ?? null,
      route_type: r.route_type ?? null,
      crag_name: r.crag_name ?? null,
      bolt_count: typeof r.bolt_count === 'number' ? r.bolt_count : null,
      height: typeof r.height === 'number' ? r.height : null,
      description:
        typeof r.description === 'string' && r.description.trim().length > 0
          ? r.description.trim().slice(0, 200)
          : null,
    }))
    const contextPreview = sqlContext.length > 1200 ? `${sqlContext.slice(0, 1200)}…` : sqlContext

    const traceUpdate = {
      text_to_sql: {
        path: 'hybrid',
        candidate_count: candidates.length,
        context_preview: contextPreview,
        candidates: candidateDetails,
      },
    }

    endSpan(span, {
      output: { path: 'hybrid', candidateCount: candidates.length },
    })

    return {
      sqlCandidates: candidates,
      sqlContext,
      trace: traceUpdate,
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    endSpan(span, {
      level: 'ERROR',
      metadata: { error: errorMessage, path: 'hybrid' },
    })
    return {
      ...fallbackToRag('hybrid_error'),
      trace: { hybrid_error: errorMessage },
    }
  }
}

// Clarification 路徑：組裝回問
async function handleClarificationPath(
  state: GraphState,
  span: ReturnType<typeof startSpan>
): Promise<Partial<GraphState>> {
  const { request, queryService } = state
  const { query } = request

  let answer: string
  let options: string[]

  if (state.clarificationType === 'intent') {
    answer = '你是想要：\nA. 列出符合條件的路線清單\n還是\nB. 根據你的程度個人化推薦？'
    options = ['A. 查詢清單', 'B. 個人化推薦']
  } else {
    // missing-crag
    answer = '請問是哪個岩場的路線？'
    options = []
  }

  const traceUpdate = {
    text_to_sql: {
      path: 'clarification',
      clarification_type: state.clarificationType,
    },
  }

  const queryId = await queryService.logQuery({
    userId: state.userId ?? null,
    query,
    response: answer,
    sources: [],
    latencyMs: Date.now() - state.startTime,
    tokenCount: 0,
    queryType: 'clarification-needed',
    modelUsed: state.effectiveLlmModel,
    pipelineTrace: JSON.stringify({ ...state.trace, ...traceUpdate }),
  })

  endSpan(span, {
    output: {
      path: 'clarification',
      clarificationType: state.clarificationType,
    },
  })

  return {
    earlyReturn: {
      answer,
      sources: [],
      query_id: queryId,
      suggested_questions: [],
      clarification_needed: true,
      clarification_options: options,
      query_route: 'clarification',
    },
    trace: traceUpdate,
  }
}

// 未登入回應
async function handleLoginRequired(state: GraphState): Promise<Partial<GraphState>> {
  const { request, queryService } = state
  const queryId = await queryService.logQuery({
    userId: null,
    query: request.query,
    response: '請先登入才能查詢個人完攀紀錄。',
    sources: [],
    latencyMs: Date.now() - state.startTime,
    tokenCount: 0,
    queryType: 'sql',
    modelUsed: state.effectiveLlmModel,
    pipelineTrace: Object.keys(state.trace).length > 0 ? JSON.stringify(state.trace) : undefined,
  })
  return {
    earlyReturn: {
      answer: '請先登入才能查詢個人完攀紀錄。',
      sources: [],
      query_id: queryId,
      suggested_questions: [],
      query_route: 'sql',
    },
  }
}

// 個人模板空結果：直接回傳友善訊息，不走 RAG
async function handleEmptyPersonalResponse(
  state: GraphState,
  template: string,
  span: ReturnType<typeof startSpan>
): Promise<Partial<GraphState>> {
  const { request, queryService } = state

  const messageMap: Record<string, string> = {
    MY_ASCENT_LIST: '你目前還沒有完攀紀錄喔！去紀錄你的第一條路線吧 🧗',
    MY_ASCENT_COUNT: '你目前還沒有完攀紀錄。',
    MY_ASCENT_BY_TYPE: '你目前還沒有完攀紀錄。',
    MY_ASCENT_AT_CRAG: '你在這個岩場還沒有完攀紀錄。',
    MY_ASCENT_BY_DATE: '你目前還沒有完攀紀錄。',
    MY_HIGHEST_GRADE: '你目前還沒有完攀紀錄，無法查詢最高難度。',
    MY_RATED_ROUTES: '你目前還沒有評分過任何路線。',
  }
  const answer = messageMap[template] ?? '你目前還沒有相關紀錄。'

  const traceUpdate = {
    text_to_sql: { template, row_count: 0, path: 'sql', empty_personal: true },
  }

  const queryId = await queryService.logQuery({
    userId: state.userId ?? null,
    query: request.query,
    response: answer,
    sources: [],
    latencyMs: Date.now() - state.startTime,
    tokenCount: 0,
    queryType: 'sql',
    modelUsed: state.effectiveLlmModel,
    pipelineTrace: JSON.stringify({ ...state.trace, ...traceUpdate }),
  })

  endSpan(span, { output: { path: 'sql', template, empty_personal: true } })

  return {
    earlyReturn: {
      answer,
      sources: [],
      query_id: queryId,
      suggested_questions: [],
      query_route: 'sql' as const,
    },
    trace: traceUpdate,
  }
}

// 程式化格式化 fallback（LLM 組裝失敗時使用）
const ROUTE_TYPE_ZH: Record<string, string> = {
  sport: '運攀',
  trad: '傳攀',
  boulder: '抱石',
  mixed: '混合攀登',
}
function formatFallback(query: string, rows: Record<string, unknown>[], template: string): string {
  if (rows.length === 0) return '找不到符合條件的資料。'

  // 計數模板
  if (template === 'COUNT_ROUTES_AT_CRAG') {
    const count = (rows[0] as { count?: number })?.count ?? rows.length
    return `共有 ${count} 條路線。`
  }

  // 清單模板：格式化為 markdown 列表
  const lines = rows.map((r) => {
    const name = r.name as string
    const grade = r.grade as string | null
    const type = ROUTE_TYPE_ZH[(r.route_type as string) ?? ''] ?? ''
    const parts = [name]
    if (grade) parts.push(`(${grade})`)
    if (type) parts.push(`(${type})`)
    return `- ${parts.join(' ')}`
  })

  return `共有 ${rows.length} 條路線：\n\n${lines.join('\n')}`
}

// Fallback：回復為 complex，讓 pipeline 繼續走 RAG
function fallbackToRag(reason: string): Partial<GraphState> {
  return {
    queryType: 'complex',
    trace: { sql_fallback: true, sql_fallback_reason: reason },
  }
}
