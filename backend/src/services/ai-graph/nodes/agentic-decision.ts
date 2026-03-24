import { GraphState } from '../state';
import { startSpan, endSpan } from '../langfuse';
import { AGENTIC_DECISION_PROMPT } from '../../../utils/ai-prompts';
import { SearchResult } from '../../pipeline/types';

/**
 * 建立 evidence summary：列出目前已找到的文件摘要
 */
function buildEvidenceSummary(docs: SearchResult[]): string {
  if (docs.length === 0) return '（尚無資料）';
  return docs.map((doc) => {
    const meta = doc.metadata as Record<string, unknown> | undefined;
    if (!meta) return `文件：${doc.id}`;
    const docType = meta['type'] as string | undefined;
    if (docType === 'route') {
      return `路線：${meta['name'] ?? doc.id}｜${meta['crag_name'] ?? ''}｜${meta['grade'] ?? ''}`;
    } else if (docType === 'crag') {
      return `岩場：${meta['name'] ?? doc.id}｜${meta['region'] ?? ''}`;
    }
    return `文件：${meta['name'] ?? doc.id}`;
  }).join('\n');
}

/**
 * Agentic Decision Node
 *
 * 讓 LLM 評估目前 candidateMatches 是否足夠回答問題，
 * 決定下一步是繼續搜尋（RETRIEVE）還是直接回答（ANSWER）。
 * 同時將 loopBack 資訊存入 state，供 agenticRetrieve 使用。
 */
export async function agenticDecisionNode(state: GraphState): Promise<Partial<GraphState>> {
  const span = startSpan(state.langfuseTrace ?? null, 'agentic-decision', {
    loopCount: state.loopCount,
    currentDocCount: state.candidateMatches?.length ?? 0,
  });

  try {
    const { pipelineConfig, request, prompts } = state;
    const currentDocs = state.candidateMatches ?? [];
    const loopCount = state.loopCount ?? 0;

    // 達到最大步數：強制 ANSWER
    if (loopCount >= pipelineConfig.agentic_max_steps) {
      endSpan(span, { output: { action: 'ANSWER', reason: 'max_steps_reached' } });
      return {
        agenticAction: 'ANSWER',
        loopCount: loopCount + 1,
        trace: { agentic_decision: { step: loopCount, action: 'ANSWER', reason: 'max_steps_reached' } },
      };
    }

    // 已有足夠文件：ANSWER
    if (currentDocs.length >= pipelineConfig.agentic_min_docs_to_answer) {
      endSpan(span, { output: { action: 'ANSWER', reason: 'enough_docs', docCount: currentDocs.length } });
      return {
        agenticAction: 'ANSWER',
        loopCount: loopCount + 1,
        trace: { agentic_decision: { step: loopCount, action: 'ANSWER', reason: 'enough_docs', doc_count: currentDocs.length } },
      };
    }

    // 無 LLM provider：降級為 RETRIEVE（若尚無文件），否則 ANSWER
    if (!state.llmProvider) {
      const fallbackAction: 'RETRIEVE' | 'ANSWER' = currentDocs.length === 0 ? 'RETRIEVE' : 'ANSWER';
      endSpan(span, { output: { action: fallbackAction, reason: 'no_llm_provider' } });
      return {
        agenticAction: fallbackAction,
        loopCount: loopCount + 1,
        trace: { agentic_decision: { step: loopCount, action: fallbackAction, reason: 'no_llm_provider' } },
      };
    }

    // 呼叫 LLM 進行 agentic 決策
    const remainingSteps = pipelineConfig.agentic_max_steps - loopCount - 1;
    const evidenceSummary = buildEvidenceSummary(currentDocs);
    const promptTemplate = prompts?.['AGENTIC_DECISION_PROMPT'] ?? AGENTIC_DECISION_PROMPT;
    const prompt = promptTemplate
      .replace('{count}', String(currentDocs.length))
      .replace('{evidence_summary}', evidenceSummary)
      .replace('{min_docs}', String(pipelineConfig.agentic_min_docs_to_answer))
      .replace('{remaining_steps}', String(remainingSteps))
      .replace('{query}', request.query);

    let action: 'RETRIEVE' | 'ANSWER' = 'RETRIEVE';
    let refinedQuery: string | undefined;
    let decisionReason: string | undefined;
    let tokenUsage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | undefined;

    try {
      const llmResult = await state.llmProvider.chat(
        [{ role: 'user', content: prompt }],
        {
          model: pipelineConfig.lightweight_model,
          maxTokens: 200,
          gatewayOptions: state.gatewayOptions,
        },
      );

      tokenUsage = llmResult.usage;

      const raw = llmResult.content ?? '';
      const jsonMatch = raw.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as {
          type?: string;
          refinedQuery?: string;
          reason?: string;
        };

        if (parsed.type === 'RETRIEVE' && typeof parsed.refinedQuery === 'string' && parsed.refinedQuery.trim().length > 0) {
          action = 'RETRIEVE';
          refinedQuery = parsed.refinedQuery.slice(0, 500);
          decisionReason = parsed.reason;
        } else {
          // ANSWER, BROADEN（已有文件），或無效動作均歸為 ANSWER
          action = 'ANSWER';
          decisionReason = parsed.reason ?? parsed.type;
        }
      } else {
        // 無法解析 JSON → 預設 ANSWER（有資料）或 RETRIEVE（無資料）
        action = currentDocs.length === 0 ? 'RETRIEVE' : 'ANSWER';
        decisionReason = 'json_parse_failed';
      }
    } catch {
      // LLM 呼叫失敗 → 降級決策
      action = currentDocs.length === 0 ? 'RETRIEVE' : 'ANSWER';
      decisionReason = 'llm_error';
    }

    const newTokenBreakdown = state.tokenBreakdown ? { ...state.tokenBreakdown } : {};
    if (tokenUsage) {
      const existingDecisions = (newTokenBreakdown['agentic_decisions'] as Array<{ prompt_tokens: number; completion_tokens: number; total_tokens: number; model: string; estimated: boolean; step: number }> | undefined) ?? [];
      newTokenBreakdown['agentic_decisions'] = [
        ...existingDecisions,
        {
          prompt_tokens: tokenUsage.prompt_tokens,
          completion_tokens: tokenUsage.completion_tokens,
          total_tokens: tokenUsage.total_tokens,
          model: pipelineConfig.lightweight_model,
          estimated: false,
          step: loopCount,
        },
      ];
    }

    endSpan(span, {
      output: {
        action,
        reason: decisionReason,
        docCount: currentDocs.length,
        refinedQuery,
      },
    });

    const result: Partial<GraphState> = {
      agenticAction: action,
      loopCount: loopCount + 1,
      tokenBreakdown: newTokenBreakdown,
      trace: {
        agentic_decision: {
          step: loopCount,
          action,
          reason: decisionReason,
          doc_count: currentDocs.length,
          refined_query: refinedQuery,
        },
      },
    };

    // 將 refinedQuery 存入 loopBack，供 agenticRetrieve 使用
    if (action === 'RETRIEVE' && refinedQuery) {
      result.loopBack = { targetPhase: 'retrieval', reason: refinedQuery };
    }

    return result;
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } });
    throw err;
  }
}
