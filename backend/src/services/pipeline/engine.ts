import { AIAskResponse } from '../../types';
import {
  PipelineContext,
  PipelineStep,
  PipelineStepConfig,
  PipelinePhase,
  PHASE_ORDER,
  SkipCondition,
  StepId,
  BranchConfig,
} from './types';
import { STEP_REGISTRY, getDefaultStepConfigs } from './registry';

// Step 實作匯入
import { semanticCacheStep } from './steps/semantic-cache';
import { toolSelectionStep } from './steps/tool-selection';
import { hydeStep } from './steps/hyde';
import { multiQueryStep } from './steps/multi-query';
import { filterBuildStep } from './steps/filter-build';
import { embeddingStep } from './steps/embedding';
import { hybridSearchStep } from './steps/hybrid-search';
import { crossEncoderStep } from './steps/cross-encoder';
import { mmrStep } from './steps/mmr';
import { popularityRerankStep } from './steps/popularity-rerank';
import { llmGenerationStep } from './steps/llm-generation';
import { judgeStep } from './steps/judge';
import { selfReflectionStep } from './steps/self-reflection';
import { textToSqlStep } from './steps/text-to-sql';
import { extractMemoriesFromQuery } from '../memory-extractor';

const STEP_MAP: Record<StepId, PipelineStep> = {
  'semantic-cache': semanticCacheStep,
  'tool-selection': toolSelectionStep,
  'text-to-sql': textToSqlStep,
  'hyde': hydeStep,
  'multi-query': multiQueryStep,
  'filter-build': filterBuildStep,
  'embedding': embeddingStep,
  'hybrid-search': hybridSearchStep,
  'cross-encoder': crossEncoderStep,
  'mmr': mmrStep,
  'popularity-rerank': popularityRerankStep,
  'llm-generation': llmGenerationStep,
  'judge': judgeStep,
  'self-reflection': selfReflectionStep,
};

function sumTokenBreakdown(tb: Record<string, unknown>): number {
  let total = 0;
  for (const v of Object.values(tb)) {
    if (Array.isArray(v)) {
      for (const item of v) total += (item as { total_tokens?: number }).total_tokens ?? 0;
    } else if (v && typeof v === 'object') {
      total += (v as { total_tokens?: number }).total_tokens ?? 0;
    }
  }
  return total;
}

export class PipelineEngine {
  private env: { DB: D1Database; CACHE: KVNamespace };

  constructor(env: { DB: D1Database; CACHE: KVNamespace }) {
    this.env = env;
  }

  // 載入 pipeline step 設定（從 ai_config）
  private async loadStepConfigs(): Promise<PipelineStepConfig[]> {
    try {
      const row = await this.env.DB.prepare(
        `SELECT value FROM ai_config WHERE key = 'pipeline_steps'`
      ).first<{ value: string }>();
      if (row?.value) {
        const stored = JSON.parse(row.value) as PipelineStepConfig[];
        // 自動合併 registry 中新增但不在已存配置的 step
        const storedIds = new Set(stored.map((s) => s.id));
        const defaults = getDefaultStepConfigs();
        for (const def of defaults) {
          if (!storedIds.has(def.id)) {
            stored.push(def);
          }
        }
        return stored;
      }
    } catch (err) {
      console.error('[PipelineEngine] loadStepConfigs failed, using defaults:', err);
    }
    return getDefaultStepConfigs();
  }

  // 載入分支配置
  private async loadBranchConfigs(): Promise<BranchConfig[]> {
    try {
      const row = await this.env.DB.prepare(
        `SELECT value FROM ai_config WHERE key = 'pipeline_branches'`
      ).first<{ value: string }>();
      if (row?.value) {
        return JSON.parse(row.value) as BranchConfig[];
      }
    } catch (err) {
      console.error('[PipelineEngine] loadBranchConfigs failed:', err);
    }
    return [];
  }

  // 依賴驗證：檢查所有已啟用 step 的 requires 是否被前置 step 的 provides 滿足
  static validateDependencies(configs: PipelineStepConfig[]): { valid: boolean; errors: string[] } {
    const enabledSteps = configs
      .filter((c) => c.enabled)
      .sort((a, b) => {
        const metaA = STEP_REGISTRY.find((s) => s.id === a.id);
        const metaB = STEP_REGISTRY.find((s) => s.id === b.id);
        if (!metaA || !metaB) return 0;
        const phaseA = PHASE_ORDER.indexOf(metaA.phase);
        const phaseB = PHASE_ORDER.indexOf(metaB.phase);
        if (phaseA !== phaseB) return phaseA - phaseB;
        return a.order - b.order;
      });

    const errors: string[] = [];
    const providedFields = new Set<string>();
    // 初始化時 context 已有的欄位
    const initialFields = ['env', 'request', 'pipelineConfig', 'prompts', 'trace', 'tokenBreakdown', 'queryService', 'startTime', 'cacheKey', 'recentHistory', 'isAnonymousNoHistory', 'earlyQueryVector', 'memorySummary', 'ascentContext', 'abilityLevel', 'streamingMode', 'vectorFilter', 'hydeDoc', 'expandedQueries'];
    for (const f of initialFields) providedFields.add(f);

    for (const config of enabledSteps) {
      const meta = STEP_REGISTRY.find((s) => s.id === config.id);
      if (!meta) continue;

      for (const req of meta.requires) {
        if (!providedFields.has(req as string)) {
          errors.push(`Step "${meta.id}" requires "${String(req)}" but no preceding enabled step provides it`);
        }
      }
      for (const prov of meta.provides) {
        providedFields.add(prov as string);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // skipWhen 條件評估
  private evaluateSkipWhen(conditions: SkipCondition[] | undefined, ctx: PipelineContext): { skip: boolean; reason?: string } {
    if (!conditions || conditions.length === 0) return { skip: false };

    for (const cond of conditions) {
      const fieldValue = ctx[cond.field];
      let matches = false;

      switch (cond.operator) {
        case 'eq':
          matches = fieldValue === cond.value;
          break;
        case 'neq':
          matches = fieldValue !== cond.value;
          break;
        case 'in':
          matches = Array.isArray(cond.value) && (cond.value as unknown[]).includes(fieldValue);
          break;
      }

      if (matches) {
        return { skip: true, reason: `skipWhen: ${String(cond.field)} ${cond.operator} ${String(cond.value)}` };
      }
    }

    return { skip: false };
  }

  // 深拷貝分支 context（避免分支間共享引用型態欄位）
  private cloneBranchContext(ctx: PipelineContext): PipelineContext {
    return {
      ...ctx,
      trace: { ...ctx.trace },
      tokenBreakdown: { ...ctx.tokenBreakdown },
      // 陣列欄位淺拷貝
      recentHistory: [...ctx.recentHistory],
      expandedQueries: ctx.expandedQueries ? [...ctx.expandedQueries] : undefined,
      expandedVectors: ctx.expandedVectors ? ctx.expandedVectors.map((v) => [...v]) : undefined,
      candidateMatches: ctx.candidateMatches ? [...ctx.candidateMatches] : undefined,
      scoredCandidates: ctx.scoredCandidates ? [...ctx.scoredCandidates] : undefined,
      rerankedMatches: ctx.rerankedMatches ? [...ctx.rerankedMatches] : undefined,
      sources: ctx.sources ? [...ctx.sources] : undefined,
      suggestedQuestions: ctx.suggestedQuestions ? [...ctx.suggestedQuestions] : undefined,
      // Map 欄位深拷貝
      documents: ctx.documents ? new Map(ctx.documents) : undefined,
      videoCountMap: ctx.videoCountMap ? new Map(ctx.videoCountMap) : undefined,
      latestVideoMap: ctx.latestVideoMap ? new Map(ctx.latestVideoMap) : undefined,
      // Record 欄位淺拷貝
      vectorFilter: ctx.vectorFilter ? { ...ctx.vectorFilter } : undefined,
      prompts: { ...ctx.prompts },
    };
  }

  // 清除指定 phase 及後續所有 phase 的產出欄位
  private clearPhaseOutputs(ctx: PipelineContext, fromPhase: PipelinePhase): void {
    const startIdx = PHASE_ORDER.indexOf(fromPhase);
    for (let i = startIdx; i < PHASE_ORDER.length; i++) {
      const phase = PHASE_ORDER[i];
      for (const meta of STEP_REGISTRY) {
        if (meta.phase === phase) {
          for (const field of meta.provides) {
            delete (ctx as unknown as Record<string, unknown>)[field as string];
          }
        }
      }
    }
  }

  // Phase transition 清理：釋放不再需要的大型中間資料
  private cleanupCompletedPhase(ctx: PipelineContext, completedPhase: PipelinePhase): void {
    // looping 可能需要回跳，不清理
    if (ctx.loopCount < ctx.pipelineConfig.max_pipeline_loops) return;

    switch (completedPhase) {
      case 'retrieval':
        // embedding vectors 已用完
        ctx.queryVector = undefined;
        ctx.hydeVector = undefined;
        ctx.expandedVectors = undefined;
        break;
      case 'post-retrieval':
        // 原始候選已被 rerank，不再需要
        ctx.candidateMatches = undefined;
        ctx.scoredCandidates = undefined;
        break;
      case 'generation':
        // 文件 Map 已組成 context 文字，不再需要
        ctx.documents = undefined;
        ctx.videoCountMap = undefined;
        ctx.latestVideoMap = undefined;
        break;
    }
  }

  // 主執行方法
  async run(ctx: PipelineContext): Promise<PipelineContext> {
    const [stepConfigs, branchConfigs] = await Promise.all([
      this.loadStepConfigs(),
      this.loadBranchConfigs(),
    ]);

    // 依 phase + order 排序已啟用的 step
    const enabledSteps = stepConfigs
      .filter((c) => c.enabled)
      .map((c) => ({
        config: c,
        step: STEP_MAP[c.id],
        meta: STEP_REGISTRY.find((s) => s.id === c.id)!,
      }))
      .filter((s) => s.step && s.meta)
      .sort((a, b) => {
        const phaseA = PHASE_ORDER.indexOf(a.meta.phase);
        const phaseB = PHASE_ORDER.indexOf(b.meta.phase);
        if (phaseA !== phaseB) return phaseA - phaseB;
        return a.config.order - b.config.order;
      });

    // Pipeline execution trace
    const pipelineExecution: Array<{
      id: string;
      phase: string;
      duration_ms: number;
      skipped?: boolean;
      reason?: string;
      error?: string;
    }> = [];

    // 記錄所有被停用的 step
    for (const meta of STEP_REGISTRY) {
      const config = stepConfigs.find((c) => c.id === meta.id);
      if (!config || !config.enabled) {
        pipelineExecution.push({
          id: meta.id,
          phase: meta.phase,
          duration_ms: 0,
          skipped: true,
          reason: 'disabled',
        });
      }
    }

    // Fallback：若 text-to-sql step 被停用，記錄以便在 tool-selection 完成後回復 queryType
    const textToSqlDisabled = !stepConfigs.find((c) => c.id === 'text-to-sql')?.enabled;

    // 建立 branch group lookup
    const branchStepSet = new Set<StepId>();
    for (const bc of branchConfigs) {
      for (const branch of bc.branches) {
        for (const stepId of branch) branchStepSet.add(stepId);
      }
    }

    // 依序執行 step（支援 loopBack）
    let stepIdx = 0;
    while (stepIdx < enabledSteps.length) {
      const { step, meta, config } = enabledSteps[stepIdx];

      // 分支檢查：若此 step 屬於某 branch group，執行分支邏輯
      if (branchStepSet.has(config.id)) {
        const bc = branchConfigs.find((b) =>
          b.branches.some((branch) => branch.includes(config.id))
        );
        if (bc) {
          // 跳過此 branch group 內所有 step（由分支邏輯統一執行）
          const allBranchStepIds = new Set(bc.branches.flat());
          const branchStart = Date.now();

          // 為各分支建立 context 深拷貝，並行執行
          const branchPromises = bc.branches.map(async (branchSteps) => {
            const branchCtx = this.cloneBranchContext(ctx);
            for (const bStepId of branchSteps) {
              const bStep = STEP_MAP[bStepId];
              if (bStep) {
                try {
                  await bStep.execute(branchCtx);
                } catch (err) {
                  const errorMsg = err instanceof Error ? err.message : String(err);
                  if (!branchCtx.trace.step_errors) branchCtx.trace.step_errors = [];
                  (branchCtx.trace.step_errors as Array<{ step: string; error: string }>).push({ step: bStepId, error: errorMsg });
                }
              }
            }
            return branchCtx;
          });

          const branchResults = await Promise.all(branchPromises);
          ctx.branchResults = new Map();
          branchResults.forEach((bCtx, i) => {
            ctx.branchResults!.set(String(i), bCtx);
          });

          // 執行 fusion step
          const fusionStep = STEP_MAP[bc.fusionStep];
          if (fusionStep) {
            await fusionStep.execute(ctx);
          }

          const branchDuration = Date.now() - branchStart;
          pipelineExecution.push({
            id: `branch:${bc.id}`,
            phase: meta.phase,
            duration_ms: branchDuration,
          });

          // 跳過此 branch group 的所有 step
          while (stepIdx < enabledSteps.length && allBranchStepIds.has(enabledSteps[stepIdx].config.id)) {
            stepIdx++;
          }
          continue;
        }
      }

      // skipWhen 評估
      const skipResult = this.evaluateSkipWhen(meta.skipWhen, ctx);
      if (skipResult.skip) {
        pipelineExecution.push({
          id: meta.id,
          phase: meta.phase,
          duration_ms: 0,
          skipped: true,
          reason: skipResult.reason,
        });
        stepIdx++;
        continue;
      }

      // 執行 step（含錯誤邊界，避免單一 step 崩潰導致整個 pipeline 失敗）
      const stepStart = Date.now();
      try {
        await step.execute(ctx);
      } catch (err) {
        const stepDuration = Date.now() - stepStart;
        const errorMsg = err instanceof Error ? err.message : String(err);
        pipelineExecution.push({
          id: meta.id,
          phase: meta.phase,
          duration_ms: stepDuration,
          error: errorMsg,
        });
        if (!ctx.trace.step_errors) ctx.trace.step_errors = [];
        (ctx.trace.step_errors as Array<{ step: string; error: string; phase: string }>).push({
          step: meta.id,
          error: errorMsg,
          phase: meta.phase,
        });

        // generation 和 evaluation phase 的 step 失敗不阻斷（還能用已有的 context 繼續）
        // 但如果連 answer 都沒有就停止
        if (meta.phase === 'generation' && !ctx.answer && !ctx.earlyReturn) {
          ctx.answer = '抱歉，AI 服務暫時發生問題，請稍後再試。';
        }
        stepIdx++;
        continue;
      }
      const stepDuration = Date.now() - stepStart;

      pipelineExecution.push({
        id: meta.id,
        phase: meta.phase,
        duration_ms: stepDuration,
      });

      // earlyReturn 檢查
      if (ctx.earlyReturn) break;

      // Phase transition cleanup：偵測 phase 切換並釋放前一 phase 的大型中間資料
      const nextStep = enabledSteps[stepIdx + 1];
      if (nextStep && nextStep.meta.phase !== meta.phase) {
        this.cleanupCompletedPhase(ctx, meta.phase);
      }

      // Fallback：若 text-to-sql step 被停用，tool-selection 完成後將 sql/hybrid/clarification-needed 回復為 complex
      if (textToSqlDisabled && meta.id === 'tool-selection') {
        const sqlTypes = ['sql', 'hybrid', 'clarification-needed'];
        if (ctx.queryType && sqlTypes.includes(ctx.queryType)) {
          ctx.trace.text_to_sql_disabled_fallback = ctx.queryType;
          ctx.queryType = 'complex';
        }
      }

      // loopBack 檢查
      if (ctx.loopBack) {
        const maxLoops = ctx.pipelineConfig.max_pipeline_loops;
        if (ctx.loopCount < maxLoops) {
          const loopEntry = {
            loop: ctx.loopCount + 1,
            reason: ctx.loopBack.reason,
            targetPhase: ctx.loopBack.targetPhase,
            groundedness_before: ctx.groundedness,
          };

          ctx.loopCount++;
          const targetPhase = ctx.loopBack.targetPhase;
          ctx.loopBack = undefined;

          // 清除目標 phase 及後續的舊產出
          this.clearPhaseOutputs(ctx, targetPhase);

          // 跳回目標 phase 重新執行
          const targetPhaseIdx = PHASE_ORDER.indexOf(targetPhase);
          const jumpIdx = enabledSteps.findIndex((s) => PHASE_ORDER.indexOf(s.meta.phase) >= targetPhaseIdx);
          if (jumpIdx >= 0) {
            stepIdx = jumpIdx;

            // 記錄 loop history
            if (!ctx.trace.loop_history) ctx.trace.loop_history = [];
            (ctx.trace.loop_history as unknown[]).push(loopEntry);

            continue;
          }
        } else {
          // 超限：忽略 loopBack
          ctx.trace.loop_limit_reached = true;
          ctx.loopBack = undefined;
        }
      }

      stepIdx++;
    }

    ctx.trace.pipeline_execution = pipelineExecution;

    // Post-pipeline 後處理（僅 earlyReturn 未被提前設定的情況下才需要完整後處理）
    // earlyReturn 由各 step 自行處理日誌和快取
    if (!ctx.earlyReturn) {
      await this.postPipelineProcessing(ctx);
    }

    return ctx;
  }

  // Post-pipeline 後處理
  private async postPipelineProcessing(ctx: PipelineContext): Promise<void> {
    const { queryService, pipelineConfig } = ctx;

    // 計算 token 總量
    if (Object.keys(ctx.tokenBreakdown).length > 0) {
      ctx.trace.token_breakdown = ctx.tokenBreakdown;
    }
    const totalStageTokens = sumTokenBreakdown(ctx.tokenBreakdown as Record<string, unknown>);
    const estimatedTokens = Math.ceil(
      ((ctx.prompts['SYSTEM_PROMPT']?.length ?? 0) + (ctx.request.query.length) + (ctx.answer?.length ?? 0)) / 2
    );
    const mainGenUsage = ctx.tokenBreakdown.main_generation;
    const tokenCount = totalStageTokens > 0 ? totalStageTokens : (mainGenUsage?.total_tokens ?? estimatedTokens);

    // memory extraction trace
    if (ctx.userId && ctx.waitUntilCtx) {
      ctx.trace.memory_extraction = { triggered: true, async: true };
    } else {
      ctx.trace.memory_extraction = { triggered: false, async: false, reason: ctx.userId ? 'no_ctx' : 'anonymous' };
    }

    // 1. logQuery
    const queryId = await queryService.logQuery({
      userId: ctx.userId ?? null,
      query: ctx.request.query,
      response: ctx.answer ?? '',
      sources: ctx.request.include_sources !== false ? (ctx.sources ?? []) : [],
      latencyMs: Date.now() - ctx.startTime,
      tokenCount,
      groundednessScore: ctx.groundedness ?? null,
      autoScore: ctx.quality ?? null,
      queryType: ctx.queryType,
      modelUsed: ctx.effectiveLlmModel,
      retrievalScore: ctx.retrievalScore ?? 0,
      selfReflectionTriggered: ctx.selfReflectionTriggered ?? 0,
      isHighConsumption: tokenCount > pipelineConfig.high_consumption_threshold,
      hydeTriggered: (ctx.hydeDoc ?? '') !== '',
      pipelineTrace: Object.keys(ctx.trace).length > 0 ? JSON.stringify(ctx.trace) : undefined,
    });

    // 2. KV 快取寫入
    const response: AIAskResponse = {
      answer: ctx.answer ?? '',
      sources: ctx.request.include_sources !== false ? (ctx.sources ?? []) : [],
      query_id: queryId,
      suggested_questions: ctx.suggestedQuestions ?? [],
    };
    await ctx.env.CACHE.put(ctx.cacheKey, JSON.stringify(response), {
      expirationTtl: ctx.cacheTtl,
    });

    // 3. flagResponse（非串流）
    if (!ctx.streamingMode && ctx.groundedness !== null && ctx.groundedness !== undefined && ctx.groundedness < pipelineConfig.groundedness_flag_threshold) {
      await queryService.flagResponse(queryId, 'low_groundedness');
    }

    // waitUntil 後處理
    if (ctx.waitUntilCtx) {
      // 4. 語義快取寫入
      if (pipelineConfig.semantic_cache_enabled && ctx.earlyQueryVector) {
        ctx.waitUntilCtx.waitUntil(
          queryService.storeSemanticCache(`sc:${queryService.hashQuery(ctx.request.query)}`, ctx.earlyQueryVector, ctx.cacheKey)
        );
      }

      // 5. 串流模式異步 Judge
      if (ctx.streamingMode) {
        ctx.waitUntilCtx.waitUntil((async () => {
          const { groundedness: gs, quality: ql } = await queryService.runJudge(
            ctx.request.query, ctx.context ?? '', ctx.parsedAnswer ?? '',
            { model: pipelineConfig.lightweight_model, timeoutMs: pipelineConfig.judge_timeout_ms, contextTruncate: pipelineConfig.judge_context_truncate, promptTemplate: ctx.prompts['JUDGE_PROMPT'] }
          );
          if (gs !== null || ql !== null) {
            await ctx.env.DB.prepare(
              `UPDATE ai_query_logs SET groundedness_score = ?, auto_score = ? WHERE id = ?`
            ).bind(gs, ql, queryId).run().catch(() => {});
          }
          if (gs !== null && gs < pipelineConfig.groundedness_flag_threshold) {
            await queryService.flagResponse(queryId, 'low_groundedness');
          }
        })());
      }

      // 6. Memory extraction
      if (ctx.userId) {
        const gatewayOpts = ctx.env.AI_GATEWAY_SLUG
          ? { gateway: { id: ctx.env.AI_GATEWAY_SLUG } }
          : undefined;
        ctx.waitUntilCtx.waitUntil(
          extractMemoriesFromQuery(ctx.request.query, ctx.userId, ctx.env.DB, ctx.env.AI, gatewayOpts)
        );
      }
    }

    ctx.finalResponse = response;
  }
}
