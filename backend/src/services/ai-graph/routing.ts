import { GraphState } from './state';

/** 檢查是否有 earlyReturn（cache hit 或特殊路徑），直接到 END */
export function routeAfterSemanticCache(state: GraphState): 'END' | 'toolSelection' {
  if (state.earlyReturn) return 'END';
  return 'toolSelection';
}

/** tool-selection 後的分流 */
export function routeAfterToolSelection(state: GraphState):
  | 'textToSql'      // SQL 路徑
  | 'filterBuild'    // 一般向量搜尋路徑（先建立 filter，再 embedding）
  | 'llmGeneration'  // general-knowledge：不需要 retrieval，直接生成
  | 'END'            // 需要澄清的問題
{
  if (state.earlyReturn) return 'END';
  if (state.queryType === 'sql') return 'textToSql';
  if (state.queryType === 'clarification-needed') return 'END';
  if (state.queryType === 'general-knowledge') return 'llmGeneration'; // 跳過 retrieval
  // queryType 'simple', 'complex', 'vector', 'hybrid', 'multi-tool' 等
  // 均走向量搜尋路徑（filterBuild → embedding → ...）
  return 'filterBuild';
}

/** text-to-sql 後：成功有結果→生成回答，無結果→ fallback 向量搜尋，earlyReturn（澄清/錯誤）→ END */
export function routeAfterTextToSql(state: GraphState): 'llmGeneration' | 'embedding' | 'END' {
  if (state.earlyReturn) return 'END'; // 澄清需求或 SQL error
  if (state.sqlCandidates && state.sqlCandidates.length > 0) return 'llmGeneration'; // SQL 有結果，直接生成
  return 'embedding'; // 無結果，fallback 到向量搜尋
}

/** embedding 後：若失敗則跳過 HyDE/MultiQuery，直接 hybrid-search（BM25-only fallback）*/
export function routeAfterEmbedding(state: GraphState): 'hyde' | 'hybridSearch' {
  if (state.embeddingFailed) return 'hybridSearch';
  return 'hyde';
}

/** judge 後：quality 不足且未超過 loop 限制則觸發 self-reflection */
export function routeAfterJudge(state: GraphState): 'selfReflection' | 'memoryExtractor' {
  const cfg = state.pipelineConfig;
  const quality = state.quality ?? 4;
  const loopCount = state.loopCount ?? 0;
  if (
    quality <= cfg.judge_regen_quality_max &&
    loopCount < cfg.max_pipeline_loops &&
    (state.context?.length ?? 0) >= cfg.self_reflection_min_length
  ) {
    return 'selfReflection';
  }
  return 'memoryExtractor';
}

/**
 * self-reflection 後：檢查 loopBack.targetPhase
 * - 'retrieval' → 回到 hybridSearch（重新搜尋）
 * - 其他 / 未設定 → 回到 llmGeneration（重新生成）
 */
export function routeAfterSelfReflection(state: GraphState): 'hybridSearch' | 'llmGeneration' {
  if (state.loopBack?.targetPhase === 'retrieval') return 'hybridSearch';
  return 'llmGeneration';
}

// ---- Agentic Strategy ----

/** agentic decision 後的分流 */
export function routeAgenticDecision(state: GraphState):
  | 'agenticRetrieve'
  | 'llmGeneration'   // ANSWER action
  | 'END'
{
  if (state.earlyReturn) return 'END';
  if (state.agenticAction === 'ANSWER') return 'llmGeneration';
  return 'agenticRetrieve';
}

/** agentic retrieve 後：繼續迭代或回答 */
export function routeAfterAgenticRetrieve(state: GraphState): 'agenticDecision' | 'llmGeneration' {
  const cfg = state.pipelineConfig;
  const loopCount = state.loopCount ?? 0;
  if (loopCount >= cfg.agentic_max_steps) return 'llmGeneration';
  const docCount = state.candidateMatches?.length ?? 0;
  if (docCount >= cfg.agentic_min_docs_to_answer) return 'llmGeneration';
  return 'agenticDecision';
}
