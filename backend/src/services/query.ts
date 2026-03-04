import { Env, AIAskRequest, AIAskResponse, AISearchRequest, AISource, AIDocument, AIDocumentMetadata, ParsedQuery, AIChatMessage } from '../types';
import { EmbeddingService } from './embedding';
import { SYSTEM_PROMPT, QUERY_TEMPLATE, TOOL_SELECTION_PROMPT, HYDE_PROMPT, GENERAL_KNOWLEDGE_SYSTEM_PROMPT } from '../utils/ai-prompts';

const CACHE_TTL = 3600; // 1 小時

// 解析 LLM 回應中的建議問題，回傳純回答與建議陣列
function parseSuggestedQuestions(raw: string): { answer: string; suggested_questions: string[] } {
  const SEP = '---SUGGESTIONS---';
  const idx = raw.indexOf(SEP);
  if (idx !== -1) {
    const rawAnswer = raw.slice(0, idx).trim();
    const suggestionsBlock = raw.slice(idx + SEP.length).trim();
    const suggested_questions = suggestionsBlock
      .split('\n')
      .map((line) => line.replace(/^\d+\.\s*/, '').trim())
      .filter((line) => line.length > 0 && (line.endsWith('？') || line.endsWith('?')))
      .slice(0, 3);

    // 清理 answer 末尾模型多輸出的問句行（Gemma 3 有時在分隔符前就先列出問題）
    const answerLines = rawAnswer.split('\n');
    let cutIndex = answerLines.length;
    for (let i = answerLines.length - 1; i >= 0; i--) {
      const trimmed = answerLines[i].trim();
      if (trimmed === '') continue;
      const cleaned = trimmed.replace(/^\d+\.\s*/, '').trim();
      if (cleaned.endsWith('？') || cleaned.endsWith('?')) {
        cutIndex = i;
      } else {
        break;
      }
    }
    const answer = answerLines.slice(0, cutIndex).join('\n').trim();

    return { answer, suggested_questions };
  }

  // Fallback：模型未輸出分隔符時，偵測末尾連續問句行
  const lines = raw.trim().split('\n');
  const questions: string[] = [];
  let cutIndex = lines.length;

  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (trimmed === '') continue;
    const cleaned = trimmed.replace(/^\d+\.\s*/, '').trim();
    if (cleaned.endsWith('？') || cleaned.endsWith('?')) {
      questions.unshift(cleaned);
      cutIndex = i;
    } else {
      break;
    }
  }

  if (questions.length >= 2) {
    const answerLines = lines.slice(0, cutIndex);
    while (answerLines.length > 0 && answerLines[answerLines.length - 1].trim() === '') {
      answerLines.pop();
    }
    return { answer: answerLines.join('\n').trim(), suggested_questions: questions.slice(0, 3) };
  }

  return { answer: raw.trim(), suggested_questions: [] };
}
const DEFAULT_TOP_K = 5;
const MIN_SCORE = 0.5;          // 無 filter 時的基準門檻
const MIN_SCORE_FILTERED = 0.2; // 有 grade/crag filter 時放寬門檻（metadata 已保障相關性）
const DEFAULT_LLM_MODEL = '@cf/google/gemma-3-12b-it';

interface LLMResponse {
  response: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

interface SearchResult {
  id: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export class QueryService {
  private embeddingService: EmbeddingService;

  constructor(private env: Env) {
    this.embeddingService = new EmbeddingService(env);
  }

  // 從 query 中偵測岩場區域/岩場/地區，查 DB 回傳匹配資訊（支援多岩場）
  async extractLocationFilter(query: string): Promise<{ cragIds?: string[]; areaId?: string; region?: string }> {
    // 1. 優先比對區域名稱（最精確，如「校門口」「鐘塔」）
    const areas = await this.env.DB.prepare(
      'SELECT id, name FROM areas WHERE name IS NOT NULL'
    ).all<{ id: string; name: string }>();
    for (const area of areas.results) {
      if (query.includes(area.name)) {
        return { areaId: area.id };
      }
    }

    // 2. 再比對岩場名稱（如「龍洞」「墾丁」），收集所有匹配岩場
    const crags = await this.env.DB.prepare(
      'SELECT id, name, region FROM crags WHERE name IS NOT NULL'
    ).all<{ id: string; name: string; region: string | null }>();
    const matchedCragIds: string[] = [];
    for (const crag of crags.results) {
      if (query.includes(crag.name)) {
        matchedCragIds.push(crag.id);
      }
    }
    if (matchedCragIds.length > 0) {
      return { cragIds: matchedCragIds };
    }

    // 3. 最後比對地區名稱（如「花蓮」「北部」）
    const regions = [...new Set(crags.results.map((c) => c.region).filter(Boolean))] as string[];
    for (const region of regions) {
      if (query.includes(region)) {
        return { region };
      }
    }

    return {};
  }

  // 從 query 文字中偵測 YDS 難度，回傳 Vectorize grade_numeric 範圍
  // 支援完整格式（5.12a）與縮寫格式（12a、12）
  extractGradeFilter(query: string): { $gte: number; $lte: number } | null {
    // 先比對完整 5.XX 格式，再比對縮寫 10-15 格式（如「12a」「11b」）
    const fullMatches = [...query.matchAll(/5\.(\d+)([a-d])?/gi)];
    const shortMatches = [...query.matchAll(/\b(1[0-5])([a-d])?\b/gi)].filter(
      (m) => !query.slice(Math.max(0, m.index! - 2), m.index!).includes('5.')
    );
    const allMatches = fullMatches.length > 0 ? fullMatches : shortMatches;
    if (allMatches.length === 0) return null;

    const numerics = allMatches.map((m) => {
      const base = parseInt(m[1], 10) * 10;
      const suffix = m[2] ? 'abcd'.indexOf(m[2].toLowerCase()) : 0;
      return base + suffix;
    });

    const min = Math.min(...numerics);
    const maxMatch = allMatches.reduce((prev, curr) => {
      const prevNum = parseInt(prev[1], 10) * 10 + (prev[2] ? 'abcd'.indexOf(prev[2].toLowerCase()) : 0);
      const currNum = parseInt(curr[1], 10) * 10 + (curr[2] ? 'abcd'.indexOf(curr[2].toLowerCase()) : 0);
      return currNum > prevNum ? curr : prev;
    });
    // 若最大值的 grade 沒有 a-d 後綴，擴展到 +3（含 a/b/c/d 子等級）
    const maxBase = parseInt(maxMatch[1], 10) * 10 + (maxMatch[2] ? 'abcd'.indexOf(maxMatch[2].toLowerCase()) : 0);
    const max = maxMatch[2] ? maxBase : maxBase + 3;

    return { $gte: min, $lte: max };
  }

  // 完整 RAG 流程（增強版）：
  // Stage 1（並行）：LLM A（Tool Calling）+ LLM B（HyDE）
  // Stage 2：決定 Vectorize filter（grade / crag / region）
  // Stage 3（並行）：embed(query) + embed(hydeDoc)
  // Stage 4（並行）：兩路 Vectorize 搜尋 → RRF 合併 → D1 fetch
  // Stage 5：Cross-encoder reranking（bge-reranker-base）
  // Stage 6：MMR 多樣性選取（λ=0.6）
  // Stage 7：熱門度加權排序 → LLM C 生成回答
  async ask(request: AIAskRequest, userId?: string): Promise<AIAskResponse> {
    const { query, limit = DEFAULT_TOP_K, include_sources = true, chat_history } = request;

    // 有 chat_history 時帶入最近 3 輪（6 則），避免快取衝突故加入 history hash
    const recentHistory: AIChatMessage[] = chat_history ? chat_history.slice(-6) : [];
    const historyHash = recentHistory.length > 0 ? `:h${this.hashQuery(recentHistory.map(m => m.content).join('|'))}` : '';
    const cacheKey = `ai:ask:${this.hashQuery(query)}${historyHash}`;
    const cached = await this.env.CACHE.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as AIAskResponse;
    }

    const startTime = Date.now();

    // 取得 LLM 模型設定
    const llmModelRow = await this.env.DB.prepare(
      `SELECT value FROM ai_config WHERE key = 'llm_model'`
    ).first<{ value: string }>();
    const llmModel = llmModelRow?.value ?? DEFAULT_LLM_MODEL;

    const gatewayOptions = this.env.AI_GATEWAY_SLUG
      ? { gateway: { id: this.env.AI_GATEWAY_SLUG } }
      : undefined;

    // 優先路徑：相似路線推薦（「爬完X，推薦下一條」）
    // 需要從 DB 查出該路線的難度和岩場，不依賴 LLM A
    let vectorFilter: Record<string, unknown> = {};
    let hydeDoc = '';
    let excludeRouteId: string | null = null; // 排除來源路線本身
    let referenceRouteInfo: string | null = null; // 來源路線資訊，注入 context 讓 LLM 有正確難度
    let isSimRouteSearch = false; // 是否走「相似路線」流程，供後段 fallback 判斷

    if (this.hasSimilarRouteIntent(query)) {
      isSimRouteSearch = true;
      // 並行：DB 查路線資訊 + HyDE 生成
      const [routeRef, hydeDocResult] = await Promise.all([
        this.extractRouteReference(query),
        this.generateHyDE(query, llmModel, gatewayOptions),
      ]);
      hydeDoc = hydeDocResult;

      if (routeRef) {
        // 優先同岩場 + 相近難度（±3 步，範圍更合理）
        // 不限制 route_type：向量搜尋本身已語意匹配，額外限制反而過嚴
        if (routeRef.cragId) vectorFilter['crag_id'] = { $eq: routeRef.cragId };
        if (routeRef.gradeNumeric > 0) {
          vectorFilter['grade_numeric'] = this.similarGradeRange(routeRef.gradeNumeric, 3);
        }
        vectorFilter['type'] = { $eq: 'route' };
        excludeRouteId = routeRef.routeId; // 記錄來源路線，後續排除
        // 記錄來源路線資訊，避免 LLM 猜錯難度
        const typeLabel = routeRef.routeType ? `，類型：${routeRef.routeType}` : '';
        referenceRouteInfo = `使用者剛爬完的路線：${routeRef.name}（難度：${routeRef.grade ?? '未知'}${typeLabel}）`;
      }
    } else {
      // Stage 1a：取得岩場/區域/地區清單（供 LLM A prompt 注入）
      const [cragsResult, areasResult] = await Promise.all([
        this.env.DB.prepare('SELECT name, region FROM crags WHERE name IS NOT NULL').all<{ name: string; region: string | null }>(),
        this.env.DB.prepare('SELECT name FROM areas WHERE name IS NOT NULL').all<{ name: string }>(),
      ]);
      const cragNames = cragsResult.results.map((c) => c.name);
      const areaNames = areasResult.results.map((a) => a.name);
      const regionNames = [...new Set(cragsResult.results.map((c) => c.region).filter(Boolean))] as string[];

      // Stage 1b（並行）：LLM A（Tool Calling）+ LLM B（HyDE）
      const [parsedQuery, hydeDocResult] = await Promise.all([
        this.parseQueryWithLLM(query, llmModel, cragNames, areaNames, regionNames, gatewayOptions),
        this.generateHyDE(query, llmModel, gatewayOptions),
      ]);
      hydeDoc = hydeDocResult;

      // general_knowledge：直接跳過向量搜尋，用 LLM 通識能力回答
      if (parsedQuery?.tool === 'general_knowledge') {
        const llmResult = (await this.env.AI.run(
          llmModel,
          { messages: [{ role: 'system', content: GENERAL_KNOWLEDGE_SYSTEM_PROMPT }, { role: 'user', content: query }], max_tokens: 600 },
          gatewayOptions
        )) as LLMResponse;
        const rawAnswer = llmResult.response ?? '抱歉，無法生成回答，請稍後再試。';
        const { answer, suggested_questions } = parseSuggestedQuestions(rawAnswer);
        const latencyMs = Date.now() - startTime;
        const estimatedTokens = Math.ceil((GENERAL_KNOWLEDGE_SYSTEM_PROMPT.length + query.length + answer.length) / 2);
        const queryId = await this.logQuery({ userId: userId ?? null, query, response: answer, sources: [], latencyMs, tokenCount: llmResult.usage?.total_tokens ?? estimatedTokens });
        const response: AIAskResponse = { answer, sources: [], query_id: queryId, suggested_questions };
        await this.env.CACHE.put(cacheKey, JSON.stringify(response), { expirationTtl: CACHE_TTL });
        return response;
      }

      // Stage 2：決定過濾條件
      if (parsedQuery) {
        vectorFilter = await this.buildFiltersFromParsed(parsedQuery);
        // 補充保底：若 LLM 未抽取 grade，用 regex 補回（避免 Gemma 漏填難度）
        if (!vectorFilter['grade_numeric']) {
          const gradeFilter = this.extractGradeFilter(query);
          if (gradeFilter) vectorFilter['grade_numeric'] = gradeFilter;
        }
        // 補充保底：多岩場偵測（Tool Calling 只能抽一個岩場，若 regex 找到更多則升級為 $in）
        // 無論 Tool Calling 是否已設 crag_id，都重新偵測，以處理多岩場查詢
        const { cragIds, areaId, region } = await this.extractLocationFilter(query);
        if (areaId && !vectorFilter['area_id']) {
          vectorFilter['area_id'] = { $eq: areaId };
        } else if (cragIds && cragIds.length > 1) {
          // 多岩場：直接覆蓋 Tool Calling 的單一 crag_id
          vectorFilter['crag_id'] = { $in: cragIds };
        } else if (cragIds && cragIds.length === 1 && !vectorFilter['crag_id']) {
          vectorFilter['crag_id'] = { $eq: cragIds[0] };
        } else if (region && !vectorFilter['crag_id'] && !vectorFilter['area_id'] && !vectorFilter['region']) {
          vectorFilter['region'] = { $eq: region };
        }
      } else {
        // Fallback：使用現有 regex 方法
        const gradeFilter = this.extractGradeFilter(query);
        const { cragIds, areaId, region } = await this.extractLocationFilter(query);
        const typeFilter = this.extractTypeFilter(query);

        if (gradeFilter) vectorFilter['grade_numeric'] = gradeFilter;
        if (areaId) {
          vectorFilter['area_id'] = { $eq: areaId };
          vectorFilter['type'] = { $eq: 'route' };
        } else if (cragIds && cragIds.length > 0) {
          vectorFilter['crag_id'] = cragIds.length === 1 ? { $eq: cragIds[0] } : { $in: cragIds };
          if (typeFilter) vectorFilter['type'] = { $eq: typeFilter };
        } else if (region) {
          vectorFilter['region'] = { $eq: region };
          if (typeFilter) vectorFilter['type'] = { $eq: typeFilter };
        } else if (typeFilter) {
          vectorFilter['type'] = { $eq: typeFilter };
        }
      }
    }

    // Context 補充：若 query 含指代詞（「附近」「還有」等）且 filter 無明確位置，
    // 從對話歷史的 user + assistant 訊息中補充 crag/region 來源
    const hasExplicitLocationFilter = !!(vectorFilter['crag_id'] || vectorFilter['area_id'] || vectorFilter['region']);
    if (!hasExplicitLocationFilter && recentHistory.length > 0 && this.isContextDependentQuery(query)) {
      const historyText = recentHistory.map((m) => m.content).join(' ');
      const historyLocation = await this.extractLocationFilter(historyText);
      if (historyLocation.areaId) {
        vectorFilter['area_id'] = { $eq: historyLocation.areaId };
        vectorFilter['type'] = { $eq: 'route' };
      } else if (historyLocation.cragIds && historyLocation.cragIds.length > 0) {
        vectorFilter['crag_id'] = historyLocation.cragIds.length === 1
          ? { $eq: historyLocation.cragIds[0] }
          : { $in: historyLocation.cragIds };
        if (!vectorFilter['type']) vectorFilter['type'] = { $eq: 'route' };
      } else if (historyLocation.region) {
        vectorFilter['region'] = { $eq: historyLocation.region };
      }
    }

    // Stage 3（並行）：embed(query) + embed(hydeDoc)
    const embedTasks: Promise<number[]>[] = [this.embeddingService.embed(query)];
    if (hydeDoc) {
      embedTasks.push(this.embeddingService.embed(hydeDoc));
    }
    const embedResults = await Promise.all(embedTasks);
    const queryVector = embedResults[0];
    const hydeVector = hydeDoc ? embedResults[1] : null;

    // Stage 4（並行）：兩路 Vectorize 搜尋
    // 多岩場（$in）時加大 topK，確保每個岩場都有足夠結果
    const cragFilter = vectorFilter['crag_id'] as { $in?: string[] } | undefined;
    const isMultiCrag = Array.isArray(cragFilter?.$in) && cragFilter.$in.length > 1;
    const MERGE_TOP_K = isMultiCrag ? 20 : 10;
    const searchTasks: Promise<{ matches: SearchResult[] }>[] = [
      this.env.VECTOR_INDEX.query(queryVector, {
        topK: MERGE_TOP_K,
        returnMetadata: 'all',
        filter: Object.keys(vectorFilter).length > 0 ? vectorFilter : undefined,
      }),
    ];

    // HyDE filter 策略：
    // - 有 crag_id（相似路線意圖）→ 套用全部 filter（確保同岩場同難度）
    // - 其他情況 → 只套 type filter（讓語義搜尋有彈性）
    if (hydeVector) {
      const hydeFilter: Record<string, unknown> =
        vectorFilter['crag_id'] || vectorFilter['area_id']
          ? { ...vectorFilter }                           // 相似路線：完整 filter
          : vectorFilter['type'] ? { type: vectorFilter['type'] } : {}; // 一般：只限 type
      searchTasks.push(
        this.env.VECTOR_INDEX.query(hydeVector, {
          topK: MERGE_TOP_K,
          returnMetadata: 'all',
          filter: Object.keys(hydeFilter).length > 0 ? hydeFilter : undefined,
        })
      );
    }

    const searchResponses = await Promise.all(searchTasks);
    let queryMatches: SearchResult[] = searchResponses[0].matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
    let rawHydeMatches: SearchResult[] = hydeVector && searchResponses[1]
      ? searchResponses[1].matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }))
      : [];

    // 相似路線 fallback：若同岩場搜尋無結果，放寬為全站相近難度搜尋
    // 讓使用者不被限制在同一岩場（例如難度太高岩場路線稀少的情況）
    if (isSimRouteSearch && queryMatches.length === 0 && vectorFilter['crag_id']) {
      const relaxedFilter: Record<string, unknown> = { type: { $eq: 'route' } };
      if (vectorFilter['grade_numeric']) relaxedFilter['grade_numeric'] = vectorFilter['grade_numeric'];

      const [fbQueryResult, fbHydeResult] = await Promise.all([
        this.env.VECTOR_INDEX.query(queryVector, { topK: MERGE_TOP_K, returnMetadata: 'all', filter: relaxedFilter }),
        hydeVector
          ? this.env.VECTOR_INDEX.query(hydeVector, { topK: MERGE_TOP_K, returnMetadata: 'all', filter: relaxedFilter })
          : Promise.resolve({ matches: [] as SearchResult[] }),
      ]);
      queryMatches = fbQueryResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
      rawHydeMatches = fbHydeResult.matches.map((m) => ({ id: m.id, score: m.score, metadata: m.metadata }));
    }

    // 有 location 過濾（crag/area/region）但 primary 搜尋無結果時，
    // 不合併 HyDE 結果，避免引入不相關岩場/地區
    const hasLocationFilter = !!(vectorFilter['crag_id'] || vectorFilter['area_id'] || vectorFilter['region']);
    const hydeMatches = (hasLocationFilter && queryMatches.length === 0) ? [] : rawHydeMatches;

    // Stage 5：合併結果、過濾低分、取 D1 完整文件
    // 注意：先保留全部候選（最多 MERGE_TOP_K），熱門度重排後再截斷至 limit
    const mergedMatches = this.mergeResults(queryMatches, hydeMatches, MERGE_TOP_K);
    const hasFilter = Object.keys(vectorFilter).some((k) => ['grade_numeric', 'crag_id', 'area_id', 'region'].includes(k));
    const minScore = hasFilter ? MIN_SCORE_FILTERED : MIN_SCORE;
    const candidateMatches = mergedMatches.filter((m) => m.score >= minScore);

    const documents = await this.getDocuments(candidateMatches.map((m) => m.id));

    // 排除來源路線本身（相似路線推薦不應推薦使用者剛爬完的那條）
    if (excludeRouteId) {
      for (const [embeddingId, doc] of documents) {
        if (doc.source_id === excludeRouteId) {
          documents.delete(embeddingId);
        }
      }
    }

    // Cross-encoder Reranking：用 bge-reranker-base 對候選文件重新評分
    // 候選數 > 1 時才值得呼叫（單一結果無需重排）
    let scoredCandidates = candidateMatches;
    const rerankCandidates = candidateMatches.filter((m) => documents.has(m.id));
    if (rerankCandidates.length > 1) {
      try {
        const contexts = rerankCandidates.map((m) => ({ text: documents.get(m.id)!.text }));
        const rerankerResult = await (this.env.AI.run as Function)(
          '@cf/baai/bge-reranker-base',
          { query, contexts }
        ) as { response: { id: number; score: number }[] };

        if (rerankerResult?.response?.length > 0) {
          const scoreByIdx = new Map(rerankerResult.response.map((r) => [r.id, r.score]));
          scoredCandidates = rerankCandidates.map((m, idx) => ({
            ...m,
            score: scoreByIdx.get(idx) ?? m.score,
          }));
        }
      } catch {
        // reranker 失敗時保留原始 vector score，不影響正常流程
      }
    }

    // MMR：從 cross-encoder 重排後的候選中，選出相關且多樣的 top-N
    // 避免回傳一堆難度/岩場完全相同的路線，提升結果多樣性
    const mmrSelected = this.applyMMR(scoredCandidates, documents, 0.6, limit);

    // 熱門度排序：依影片數為路線評分加權（combined = reranker*0.7 + popularity*0.3）
    // 在 MMR 選出的候選中加權，決定最終顯示順序
    const routeSourceIds = [...documents.values()]
      .filter((d) => d.type === 'route')
      .map((d) => d.source_id);

    const videoCountMap = new Map<string, number>();
    const latestVideoMap = new Map<string, string>(); // route_id → YouTube URL
    if (routeSourceIds.length > 0) {
      const placeholders = routeSourceIds.map(() => '?').join(', ');
      const [vcResult, latestVideoResult] = await Promise.all([
        this.env.DB.prepare(
          `SELECT route_id, COUNT(*) as cnt FROM route_videos WHERE route_id IN (${placeholders}) GROUP BY route_id`
        ).bind(...routeSourceIds).all<{ route_id: string; cnt: number }>(),
        this.env.DB.prepare(
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
      // 每個路線只取最新一筆（已按 route_id, 日期 DESC 排序，取第一筆）
      const seenRoutes = new Set<string>();
      for (const row of latestVideoResult.results) {
        if (!seenRoutes.has(row.route_id)) {
          latestVideoMap.set(row.route_id, `https://youtube.com/watch?v=${row.youtube_id}`);
          seenRoutes.add(row.route_id);
        }
      }
    }

    const maxVideoCount = videoCountMap.size > 0 ? Math.max(...videoCountMap.values()) : 1;
    const safeMax = Math.max(maxVideoCount, 1);

    const rerankedMatches = mmrSelected
      .map((match) => {
        const doc = documents.get(match.id);
        if (!doc || doc.type !== 'route') return { ...match, finalScore: match.score };
        const videoCount = videoCountMap.get(doc.source_id) ?? 0;
        const normalizedPop = videoCount / safeMax;
        return { ...match, finalScore: match.score * 0.7 + normalizedPop * 0.3 };
      })
      .sort((a, b) => b.finalScore - a.finalScore);
    // MMR 已限制至 limit，不需再 slice

    // 組合 sources（依熱門度重排後的順序）
    const sources: AISource[] = rerankedMatches
      .map((match) => {
        const doc = documents.get(match.id);
        if (!doc) return null;
        return {
          id: doc.source_id,
          type: doc.type,
          title: this.extractTitle(doc),
          excerpt: this.buildExcerpt(doc),
          url: this.buildUrl(doc),
          score: match.finalScore,
          latestVideoUrl: doc.type === 'route' ? latestVideoMap.get(doc.source_id) : undefined,
        } as AISource;
      })
      .filter((s): s is AISource => s !== null);

    // Stage 6：LLM C 生成回答（依熱門度重排，context 順序影響 LLM 生成品質）
    const orderedDocs = rerankedMatches
      .map((m) => documents.get(m.id))
      .filter((d): d is AIDocument => d !== undefined);

    const docsText = orderedDocs.length > 0
      ? orderedDocs.map((d) => {
          if (d.type === 'route') {
            const videoCount = videoCountMap.get(d.source_id) ?? 0;
            const latestVideoUrl = latestVideoMap.get(d.source_id);
            let text = d.text;
            // 加入路線 URL，供 LLM 在回答中產生連結
            const meta = d.metadata ? (JSON.parse(d.metadata) as AIDocumentMetadata) : {} as AIDocumentMetadata;
            if (meta.crag_id) {
              text += `\n路線連結：/crag/${meta.crag_id}/route/${d.source_id}`;
            }
            if (videoCount > 0) {
              text += `\n影片數量：${videoCount}`;
            }
            return text;
          }
          return d.text;
        }).join('\n\n---\n\n')
      : '目前沒有找到相關資料。';

    // 若是相似路線推薦，在 context 開頭加入來源路線資訊，避免 LLM 猜測難度
    const context = referenceRouteInfo
      ? `${referenceRouteInfo}\n\n以下是相近難度的推薦路線：\n\n${docsText}`
      : docsText;

    const prompt = QUERY_TEMPLATE
      .replace('{context}', context)
      .replace('{query}', query);

    // 將對話歷史（最多 3 輪 = 6 則）加入 LLM messages，讓 LLM 有記憶脈絡
    // assistant 歷史訊息只取純文字（截斷 500 字），避免超過 context window
    const historyLLMMessages = recentHistory.slice(-6).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.role === 'assistant' ? m.content.slice(0, 500) : m.content,
    }));

    const llmResult = (await this.env.AI.run(
      llmModel,
      {
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...historyLLMMessages,
          { role: 'user', content: prompt },
        ],
        max_tokens: 800,
      },
      gatewayOptions
    )) as LLMResponse;

    const rawLLMAnswer = llmResult.response ?? '抱歉，無法生成回答，請稍後再試。';
    const { answer: parsedAnswer, suggested_questions } = parseSuggestedQuestions(rawLLMAnswer);
    const latencyMs = Date.now() - startTime;

    // LLM 明確表示無法回答時，不回傳來源（來源與答案無關，顯示會造成誤解）
    const cannotAnswer =
      parsedAnswer.includes('超出我的知識範圍') || parsedAnswer.includes('找不到相關資訊');
    const finalSources = cannotAnswer ? [] : sources;

    // 後處理：將路線名稱注入 markdown 連結（不依賴 LLM 是否遵守格式指令）
    const answer = !cannotAnswer && finalSources.length > 0
      ? this.injectRouteLinks(parsedAnswer, finalSources)
      : parsedAnswer;

    // Workers AI binding 不回傳 usage，用字元長度估算 token 數
    // 中英混合約每 2 字元 = 1 token
    const estimatedTokens = Math.ceil(
      (SYSTEM_PROMPT.length + prompt.length + answer.length) / 2
    );
    const tokenCount = llmResult.usage?.total_tokens ?? estimatedTokens;

    // 記錄查詢日誌
    const queryId = await this.logQuery({
      userId: userId ?? null,
      query,
      response: answer,
      sources: include_sources ? finalSources : [],
      latencyMs,
      tokenCount,
    });

    const response: AIAskResponse = {
      answer,
      sources: include_sources ? finalSources : [],
      query_id: queryId,
      suggested_questions,
    };

    // 快取結果
    await this.env.CACHE.put(cacheKey, JSON.stringify(response), {
      expirationTtl: CACHE_TTL,
    });

    return response;
  }

  // 純語義搜尋（不呼叫 LLM）
  async search(request: AISearchRequest): Promise<{ results: AISource[]; count: number }> {
    const { query, limit = DEFAULT_TOP_K } = request;

    const queryVector = await this.embeddingService.embed(query);
    const filter = this.buildFilter(request);

    const searchResults = await this.env.VECTOR_INDEX.query(queryVector, {
      topK: Math.min(limit, 50),
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      returnMetadata: 'all',
    });

    const relevantMatches = searchResults.matches.filter((m) => m.score >= MIN_SCORE);
    const documents = await this.getDocuments(relevantMatches.map((m) => m.id));

    const results: AISource[] = relevantMatches
      .map((match) => {
        const doc = documents.get(match.id);
        if (!doc) return null;
        return {
          id: doc.source_id,
          type: doc.type,
          title: this.extractTitle(doc),
          excerpt: this.buildExcerpt(doc),
          url: this.buildUrl(doc),
          score: match.score,
        } as AISource;
      })
      .filter((s): s is AISource => s !== null);

    return { results, count: results.length };
  }

  // 建立 Vectorize metadata 過濾條件
  buildFilter(request: AISearchRequest): Record<string, unknown> {
    const filter: Record<string, unknown> = {};

    if (request.type) {
      filter['type'] = { $eq: request.type };
    }
    if (request.filters?.crag_id) {
      filter['crag_id'] = { $eq: request.filters.crag_id };
    }
    if (request.filters?.route_type) {
      filter['route_type'] = { $eq: request.filters.route_type };
    }
    if (request.filters?.grade_min !== undefined || request.filters?.grade_max !== undefined) {
      const gradeFilter: Record<string, number> = {};
      if (request.filters?.grade_min !== undefined) {
        gradeFilter['$gte'] = request.filters.grade_min;
      }
      if (request.filters?.grade_max !== undefined) {
        gradeFilter['$lte'] = request.filters.grade_max;
      }
      filter['grade_numeric'] = gradeFilter;
    }

    return filter;
  }

  // YDS 等級轉數值（5.12a → 120，與 IndexingService 一致）
  private gradeToNumeric(grade: string | null): number {
    if (!grade) return 0;
    const match = grade.match(/5\.(\d+)([a-d])?/);
    if (!match) return 0;
    const base = parseInt(match[1], 10) * 10;
    const suffix = match[2] ? 'abcd'.indexOf(match[2]) : 0;
    return base + suffix;
  }

  // grade_numeric ↔ 連續 position 互轉（消除大等級間的跳躍 gap）
  // 5.10d(103)=43, 5.11a(110)=44，在 position 上相鄰
  private gradeToPosition(numeric: number): number {
    return Math.floor(numeric / 10) * 4 + (numeric % 10);
  }

  private positionToGrade(position: number): number {
    const major = Math.floor(position / 4);
    const sub = position % 4;
    return major * 10 + sub;
  }

  // 取得「差不多難度」的 grade_numeric 範圍（連續序列中 ±steps）
  private similarGradeRange(gradeNumeric: number, steps = 2): { $gte: number; $lte: number } {
    const pos = this.gradeToPosition(gradeNumeric);
    return {
      $gte: this.positionToGrade(Math.max(0, pos - steps)),
      $lte: this.positionToGrade(pos + steps),
    };
  }

  // 偵測 query 是否有「推薦相似/類似路線」意圖
  private hasSimilarRouteIntent(query: string): boolean {
    return ['差不多', '類似', '相似', '爬完', '爬過', '爬了', 'rp', 'RP', 'redpoint', 'red point'].some((k) => query.includes(k));
  }

  // 偵測 query 是否含有指代前文的 context-dependent 詞（需從對話歷史補充位置）
  private isContextDependentQuery(query: string): boolean {
    return ['附近', '那裡', '那邊', '這裡', '這邊', '這個岩場', '該岩場', '同岩場', '繼續', '再推薦', '還有', '還有哪些', '更多'].some((k) => query.includes(k));
  }

  // 若 query 提到已知路線名稱，回傳該路線的難度數值、所屬岩場、路線 ID、名稱、難度字串（用於相似路線過濾及 LLM 參考）
  // 按名稱長度由長到短比對，優先匹配更精確的路線名
  // 支援縮寫：若完整名稱比對失敗，嘗試路線名後綴部分匹配（如「天藍」→「天天天藍」）
  async extractRouteReference(query: string): Promise<{
    gradeNumeric: number;
    cragId: string | null;
    routeId: string;
    name: string;
    grade: string | null;
    routeType: string | null;
  } | null> {
    const routes = await this.env.DB.prepare(
      'SELECT id, name, grade, crag_id, route_type FROM routes WHERE name IS NOT NULL ORDER BY LENGTH(name) DESC'
    ).all<{ id: string; name: string; grade: string | null; crag_id: string | null; route_type: string | null }>();

    const toMatch = (route: { id: string; name: string; grade: string | null; crag_id: string | null; route_type: string | null }) => ({
      gradeNumeric: this.gradeToNumeric(route.grade),
      cragId: route.crag_id,
      routeId: route.id,
      name: route.name,
      grade: route.grade,
      routeType: route.route_type,
    });

    // 第一輪：完整路線名稱精確比對
    for (const route of routes.results) {
      if (route.name.length >= 2 && query.includes(route.name)) {
        return toMatch(route);
      }
    }

    // 第二輪：後綴縮寫比對（如使用者說「天藍」，路線名為「天天天藍」）
    // 只對 3 字以上的路線名嘗試，最短取 name 長度一半的後綴，避免誤配
    for (const route of routes.results) {
      if (route.name.length < 3) continue;
      const minLen = Math.ceil(route.name.length / 2);
      for (let len = route.name.length - 1; len >= minLen; len--) {
        const suffix = route.name.slice(-len);
        if (query.includes(suffix)) {
          return toMatch(route);
        }
      }
    }

    return null;
  }

  // 從 query 文字偵測使用者意圖，回傳適合的文件類型過濾（'crag' | 'route' | null）
  // 原則：若明確詢問岩場資訊（無路線意圖） → 'crag'；明確詢問路線 → 'route'；混合/不明 → null
  extractTypeFilter(query: string): 'crag' | 'route' | null {
    const cragKeywords = ['岩場', '攀岩場', '岩區', '岩壁', '介紹', '哪些岩場', '台灣岩場'];
    const routeKeywords = ['路線', '幾條', '多少條', '5.', 'V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', '難度', '幾級', '幾b', '幾c'];

    const hasCragIntent = cragKeywords.some((k) => query.includes(k));
    const hasRouteIntent = routeKeywords.some((k) => query.includes(k));

    if (hasCragIntent && !hasRouteIntent) return 'crag';
    if (hasRouteIntent && !hasCragIntent) return 'route';
    return null;
  }

  // 從 D1 批次取得文件
  async getDocuments(ids: string[]): Promise<Map<string, AIDocument>> {
    const result = new Map<string, AIDocument>();
    if (ids.length === 0) return result;

    const placeholders = ids.map(() => '?').join(', ');
    const docs = await this.env.DB.prepare(
      `SELECT * FROM ai_documents WHERE embedding_id IN (${placeholders})`
    )
      .bind(...ids)
      .all<AIDocument>();

    for (const doc of docs.results) {
      result.set(doc.embedding_id ?? doc.id, doc);
    }
    return result;
  }

  // 從文件中提取標題；無中文名稱時 fallback 到 name_en
  extractTitle(doc: AIDocument): string {
    const firstLine = doc.text.split('\n')[0];
    const name = firstLine.replace(/^路線名稱：|^岩場名稱：/, '').trim();
    if (name) return name;
    // 路線名稱空白時，嘗試從 metadata 取 name / name_en，否則用 source_id
    if (doc.metadata) {
      try {
        const meta = JSON.parse(doc.metadata) as AIDocumentMetadata;
        if (meta.name) return meta.name;
        if (meta.name_en) return meta.name_en;
      } catch { /* ignore */ }
    }
    return doc.source_id;
  }

  // 路線類型英文 → 中文顯示名稱
  private routeTypeLabel(type: string): string {
    const map: Record<string, string> = {
      sport: '運攀',
      trad: '傳攀',
      boulder: '抱石',
      mixed: '混合',
    };
    return map[type.toLowerCase()] ?? type;
  }

  // 從文件欄位建立清晰的來源摘要
  // 路線：「岩場 · 難度 · 類型」；其他：原始文字截斷
  buildExcerpt(doc: AIDocument): string {
    if (doc.type === 'route') {
      const fieldMap: Record<string, string> = {};
      for (const line of doc.text.split('\n')) {
        const match = line.match(/^([^：\n]+)：(.+)$/);
        if (match) fieldMap[match[1].trim()] = match[2].trim();
      }
      const parts: string[] = [];
      if (fieldMap['所屬岩場']) parts.push(fieldMap['所屬岩場']);
      if (fieldMap['難度等級']) parts.push(fieldMap['難度等級']);
      if (fieldMap['攀登類型']) parts.push(this.routeTypeLabel(fieldMap['攀登類型']));
      if (fieldMap['岩場區域']) parts.push(fieldMap['岩場區域']);
      if (parts.length > 0) return parts.join(' · ');
    }
    return doc.text.slice(0, 120).replace(/\n/g, ' ');
  }

  // 依文件類型建立 URL
  buildUrl(doc: AIDocument): string | undefined {
    if (doc.type === 'route') {
      const meta = doc.metadata ? (JSON.parse(doc.metadata) as AIDocumentMetadata) : {};
      if (meta.crag_id) {
        return `/crag/${meta.crag_id}/route/${doc.source_id}`;
      }
      return undefined;
    }
    if (doc.type === 'crag') {
      return `/crag/${doc.source_id}`;
    }
    if (doc.type === 'video') {
      const meta = doc.metadata ? (JSON.parse(doc.metadata) as AIDocumentMetadata) : {};
      if (meta.youtube_id) {
        return `https://youtube.com/watch?v=${meta.youtube_id}`;
      }
    }
    return undefined;
  }

  // LLM 回答後處理：將已知路線名稱替換為 markdown 連結，並於第一次出現時附上影片連結
  // 依名稱長度由長到短排序，避免短名稱提前匹配到長名稱的一部分
  private injectRouteLinks(text: string, sources: AISource[]): string {
    let result = text;
    const routeSources = sources
      .filter((s) => s.type === 'route' && s.url && s.title)
      .sort((a, b) => b.title.length - a.title.length);

    for (const source of routeSources) {
      const name = source.title;
      const url = source.url!;
      // 1. **name** → [**name**](routeUrl)，第一次出現附上影片連結，之後只替換連結
      const videoSuffix = source.latestVideoUrl ? ` [觀看影片](${source.latestVideoUrl})` : '';
      let firstReplace = true;
      result = result.replace(
        new RegExp(`\\*\\*${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\*\\*`, 'g'),
        () => {
          const replacement = firstReplace
            ? `[**${name}**](${url})${videoSuffix}`
            : `[**${name}**](${url})`;
          firstReplace = false;
          return replacement;
        }
      );

      // 2. 純文字 name → [name](url)（排除已在連結內的）
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      result = result.replace(
        new RegExp(`(?<!\\[\\*\\*|\\[)${escaped}(?!\\*\\*\\]|\\])`, 'g'),
        `[${name}](${url})`
      );
    }
    return result;
  }

  // 記錄查詢日誌，回傳 query_id
  async logQuery(params: {
    userId: string | null;
    query: string;
    response: string;
    sources: AISource[];
    latencyMs: number;
    tokenCount: number | null;
  }): Promise<string> {
    const id = crypto.randomUUID();
    try {
      await this.env.DB.prepare(`
        INSERT INTO ai_query_logs (id, user_id, query, response, sources, latency_ms, token_count)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          id,
          params.userId,
          params.query,
          params.response,
          JSON.stringify(params.sources),
          params.latencyMs,
          params.tokenCount
        )
        .run();
    } catch (error) {
      console.error('Failed to log AI query:', error);
    }
    return id;
  }

  // 生成查詢快取鍵（簡單雜湊）
  hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 轉為 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // LLM A：解析查詢意圖，選擇搜尋工具與參數
  // 失敗時回傳 null，由呼叫方 fallback 到 regex 方法
  private async parseQueryWithLLM(
    query: string,
    llmModel: string,
    crags: string[],
    areas: string[],
    regions: string[],
    gatewayOptions?: { gateway: { id: string } }
  ): Promise<ParsedQuery | null> {
    try {
      const prompt = TOOL_SELECTION_PROMPT
        .replace('{crags}', crags.join('、') || '無')
        .replace('{areas}', areas.join('、') || '無')
        .replace('{regions}', regions.join('、') || '無')
        .replace('{query}', query);

      const result = (await this.env.AI.run(
        llmModel,
        { messages: [{ role: 'user', content: prompt }] },
        gatewayOptions
      )) as LLMResponse;

      const text = result.response?.trim() ?? '';
      // 移除可能包裹的 markdown code fence
      const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(jsonText) as ParsedQuery;

      if (!parsed.tool || !['search_routes', 'search_crags', 'general_knowledge'].includes(parsed.tool)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  // LLM B：HyDE - 生成假設性理想答案文件以提升語義搜尋效果
  // 失敗時回傳空字串，由呼叫方跳過 HyDE 搜尋
  private async generateHyDE(
    query: string,
    llmModel: string,
    gatewayOptions?: { gateway: { id: string } }
  ): Promise<string> {
    try {
      const prompt = HYDE_PROMPT.replace('{query}', query);

      const result = (await this.env.AI.run(
        llmModel,
        { messages: [{ role: 'user', content: prompt }] },
        gatewayOptions
      )) as LLMResponse;

      return result.response?.trim() ?? '';
    } catch {
      return '';
    }
  }

  // 將 ParsedQuery.params 轉換成 Vectorize metadata filter
  // 需要 DB 查詢將名稱解析為 ID
  private async buildFiltersFromParsed(
    parsed: ParsedQuery
  ): Promise<Record<string, unknown>> {
    const filter: Record<string, unknown> = {};
    const { params, tool } = parsed;

    // 根據工具類型設定 type 過濾
    if (tool === 'search_routes') {
      filter['type'] = { $eq: 'route' };
    } else if (tool === 'search_crags') {
      filter['type'] = { $eq: 'crag' };
    }

    // 解析 area_name → area_id
    if (params.area_name) {
      const area = await this.env.DB.prepare(
        'SELECT id FROM areas WHERE name = ? LIMIT 1'
      ).bind(params.area_name).first<{ id: string }>();
      if (area) {
        filter['area_id'] = { $eq: area.id };
      }
    }

    // 解析 crag_name → crag_id（area_id 優先，有 area_id 就不需要 crag_id）
    if (params.crag_name && !filter['area_id']) {
      const crag = await this.env.DB.prepare(
        'SELECT id FROM crags WHERE name = ? LIMIT 1'
      ).bind(params.crag_name).first<{ id: string }>();
      if (crag) {
        filter['crag_id'] = { $eq: crag.id };
      }
    }

    // 解析地區
    if (params.region && !filter['area_id'] && !filter['crag_id']) {
      filter['region'] = { $eq: params.region };
    }

    // 解析 route_type
    if (params.route_type) {
      filter['route_type'] = { $eq: params.route_type };
    }

    // 解析 grade（支援 "5.11b" 或 "5.10-5.12" 格式）
    if (params.grade) {
      const rangeMatch = params.grade.match(/5\.(\d+)([a-d])?[-~]5\.(\d+)([a-d])?/i);
      if (rangeMatch) {
        const minNumeric = parseInt(rangeMatch[1], 10) * 10 + (rangeMatch[2] ? 'abcd'.indexOf(rangeMatch[2].toLowerCase()) : 0);
        const maxNumeric = parseInt(rangeMatch[3], 10) * 10 + (rangeMatch[4] ? 'abcd'.indexOf(rangeMatch[4].toLowerCase()) : 3);
        filter['grade_numeric'] = { $gte: minNumeric, $lte: maxNumeric };
      } else {
        const gradeFilter = this.extractGradeFilter(params.grade);
        if (gradeFilter) {
          filter['grade_numeric'] = gradeFilter;
        }
      }
    }

    return filter;
  }

  // 合併兩個 Vectorize 搜尋結果：Reciprocal Rank Fusion（RRF）
  // score = Σ 1/(k + rank_i)，k=60 為標準值，出現在兩路的結果自動加分
  private mergeResults(r1: SearchResult[], r2: SearchResult[], limit = 10): SearchResult[] {
    const K = 60;
    const rrfScores = new Map<string, number>();
    const metaMap = new Map<string, SearchResult>();

    for (const [rank, item] of r1.entries()) {
      rrfScores.set(item.id, (rrfScores.get(item.id) ?? 0) + 1 / (K + rank + 1));
      if (!metaMap.has(item.id)) metaMap.set(item.id, item);
    }
    for (const [rank, item] of r2.entries()) {
      rrfScores.set(item.id, (rrfScores.get(item.id) ?? 0) + 1 / (K + rank + 1));
      if (!metaMap.has(item.id)) metaMap.set(item.id, item);
    }

    return Array.from(rrfScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id, score]) => ({ ...metaMap.get(id)!, score }));
  }

  // MMR（Maximal Marginal Relevance）：兼顧相關性與多樣性
  // score = λ × relevance - (1-λ) × max_sim_to_selected
  // lambda=0.6 表示 60% 重視相關性、40% 重視多樣性
  private applyMMR(
    candidates: SearchResult[],
    documents: Map<string, AIDocument>,
    lambda: number,
    k: number
  ): SearchResult[] {
    if (candidates.length <= 1) return candidates;

    const selected: SearchResult[] = [];
    const remaining = [...candidates];

    while (selected.length < k && remaining.length > 0) {
      let bestIdx = 0;
      let bestScore = -Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const relevance = candidate.score;

        // 已選集合中，與本候選最相似的相似度
        let maxSim = 0;
        for (const sel of selected) {
          const sim = this.documentSimilarity(
            documents.get(candidate.id),
            documents.get(sel.id)
          );
          if (sim > maxSim) maxSim = sim;
        }

        const mmrScore = lambda * relevance - (1 - lambda) * maxSim;
        if (mmrScore > bestScore) {
          bestScore = mmrScore;
          bestIdx = i;
        }
      }

      selected.push(remaining[bestIdx]);
      remaining.splice(bestIdx, 1);
    }

    return selected;
  }

  // 文件相似度（metadata-based approximation）
  // 同岩場 + 相近難度 → 高相似；不同岩場 → 低相似
  private documentSimilarity(docA: AIDocument | undefined, docB: AIDocument | undefined): number {
    if (!docA || !docB) return 0;
    if (docA.source_id === docB.source_id) return 1;

    try {
      const metaA = docA.metadata ? JSON.parse(docA.metadata) as AIDocumentMetadata : null;
      const metaB = docB.metadata ? JSON.parse(docB.metadata) as AIDocumentMetadata : null;
      if (!metaA || !metaB) return 0;

      let sim = 0;
      // 同岩場 → +0.6
      if (metaA.crag_id && metaA.crag_id === metaB.crag_id) sim += 0.6;
      // 相近難度（grade_numeric 差距 ≤ 5，如 5.10a~5.10c）→ 最多 +0.4
      if (metaA.grade_numeric && metaB.grade_numeric) {
        const diff = Math.abs(metaA.grade_numeric - metaB.grade_numeric);
        if (diff <= 5) sim += 0.4 * (1 - diff / 5);
      }
      // 同攀登類型 → +0.1
      if (metaA.route_type && metaA.route_type === metaB.route_type) sim += 0.1;

      return Math.min(sim, 1);
    } catch {
      return 0;
    }
  }
}
