import { checkOutput } from '../../../utils/guardrails'
import { endSpan, startSpan } from '../../../utils/langfuse'
import { extractMemoriesFromQuery } from '../../memory-extractor'
import { buildPersonalizedSystemPrompt } from '../../personalization'
import { parseSuggestedQuestions } from '../../pipeline/utils'
import { ChatMessage } from '../providers/types'
import { GraphState } from '../state'

export async function llmGenerationNode(state: GraphState): Promise<Partial<GraphState>> {
  const { pipelineConfig, prompts, trace, tokenBreakdown, queryService, request } = state
  const { query } = request

  const effectiveLlmModel = state.effectiveLlmModel ?? pipelineConfig.llm_model

  const span = startSpan(state.langfuseTrace ?? null, 'llm-generation', {
    model: effectiveLlmModel,
    queryType: state.queryType,
  })

  try {
    // GK 通識路徑
    if (state.queryType === 'general-knowledge') {
      const gkPersonalized = buildPersonalizedSystemPrompt(
        state.memorySummary ?? null,
        state.ascentContext ?? null,
        state.abilityLevel ?? null,
        prompts['GENERAL_KNOWLEDGE_SYSTEM_PROMPT']
      )

      const gkMessages: ChatMessage[] = [
        { role: 'system', content: gkPersonalized },
        { role: 'user', content: query },
      ]

      const llmResult = await state.llmProvider!.chat(gkMessages, {
        model: effectiveLlmModel,
        maxTokens: pipelineConfig.max_tokens_gk,
        gatewayOptions: state.gatewayOptions,
      })

      const rawAnswer = llmResult.content || '抱歉，無法生成回答，請稍後再試。'
      const { answer: rawGkAnswer, suggested_questions } = parseSuggestedQuestions(rawAnswer)
      const { output: gkFiltered, trace: gkOutputTrace } = checkOutput(
        rawGkAnswer,
        pipelineConfig.max_output_length,
        pipelineConfig.system_prompt_leakage_patterns
      )
      const answer = gkFiltered || '抱歉，無法生成回答，請稍後再試。'

      const newTokenBreakdown = { ...tokenBreakdown }
      if (llmResult.usage) {
        newTokenBreakdown.main_generation = {
          ...llmResult.usage,
          model: effectiveLlmModel,
          estimated: false,
        }
      } else {
        const estP = Math.ceil((gkPersonalized.length + query.length) / 2)
        const estC = Math.ceil(answer.length / 2)
        newTokenBreakdown.main_generation = {
          prompt_tokens: estP,
          completion_tokens: estC,
          total_tokens: estP + estC,
          model: effectiveLlmModel,
          estimated: true,
        }
      }

      const totalTokens = Object.values(newTokenBreakdown).reduce((sum, v) => {
        if (v && typeof v === 'object' && 'total_tokens' in v)
          return sum + ((v as { total_tokens: number }).total_tokens ?? 0)
        return sum
      }, 0)

      let memoryTrace: Record<string, unknown>
      if (state.userId && state.waitUntilCtx) {
        memoryTrace = { triggered: true, async: true }
      } else {
        memoryTrace = {
          triggered: false,
          async: false,
          reason: state.userId ? 'no_ctx' : 'anonymous',
        }
      }

      const queryId = await queryService.logQuery({
        userId: state.userId ?? null,
        query,
        response: answer,
        sources: [],
        latencyMs: Date.now() - state.startTime,
        tokenCount:
          totalTokens > 0
            ? totalTokens
            : (llmResult.usage?.total_tokens ??
              Math.ceil((gkPersonalized.length + query.length + answer.length) / 2)),
        queryType: 'general-knowledge',
        modelUsed: effectiveLlmModel,
        retrievalScore: 0,
        selfReflectionTriggered: 0,
        isHighConsumption: (totalTokens || 0) > pipelineConfig.high_consumption_threshold,
        hydeTriggered: false,
        pipelineTrace: Object.keys(trace).length > 0 ? JSON.stringify(trace) : undefined,
      })

      const sources: import('../../../types').AISource[] = []
      const gkResponse = { answer, sources, query_id: queryId, suggested_questions }
      await state.env.CACHE.put(state.cacheKey, JSON.stringify(gkResponse), {
        expirationTtl: state.cacheTtl,
      })

      // Circuit Breaker：LLM generation 成功
      if (state.circuitBreaker) {
        state.circuitBreaker.recordSuccess().catch(() => {})
      }

      // 非同步記憶體萃取
      if (state.userId && state.waitUntilCtx) {
        const gkGatewayOpts = state.env.AI_GATEWAY_SLUG
          ? { gateway: { id: state.env.AI_GATEWAY_SLUG } }
          : undefined
        state.waitUntilCtx.waitUntil(
          extractMemoriesFromQuery(query, state.userId, state.env.DB, state.env.AI, gkGatewayOpts)
        )
      }

      endSpan(span, { output: { answerLength: answer.length, queryType: 'general-knowledge' } })
      return {
        answer,
        rawAnswer,
        suggestedQuestions: suggested_questions,
        tokenBreakdown: newTokenBreakdown,
        trace: { guardrails_output: gkOutputTrace, memory_extraction: memoryTrace },
        earlyReturn: gkResponse,
      }
    }

    // RAG 路徑（含 hybrid 分支）
    const context =
      state.queryType === 'hybrid' && state.sqlContext
        ? state.sqlContext
        : (state.context ?? '目前沒有找到相關資料。')
    const prompt = prompts['QUERY_TEMPLATE'].replace('{context}', context).replace('{query}', query)

    const recentHistory = state.recentHistory
    const historyLLMMessages = recentHistory.slice(-pipelineConfig.chat_history_depth).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content:
        m.role === 'assistant'
          ? m.content.slice(0, pipelineConfig.assistant_history_truncate)
          : m.content,
    }))

    const personalizedSystemPrompt = buildPersonalizedSystemPrompt(
      state.memorySummary ?? null,
      state.ascentContext ?? null,
      state.abilityLevel ?? null,
      prompts['SYSTEM_PROMPT']
    )

    const llmMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system' as const, content: personalizedSystemPrompt },
      ...historyLLMMessages,
      { role: 'user' as const, content: prompt },
    ]

    let rawLLMAnswer: string
    let llmUsage:
      | { prompt_tokens: number; completion_tokens: number; total_tokens: number }
      | undefined

    if (state.streamingMode && state.onToken) {
      const streamResult = await state.llmProvider!.streamChat(llmMessages, {
        model: effectiveLlmModel,
        maxTokens: pipelineConfig.max_tokens_generation,
        gatewayOptions: state.gatewayOptions,
        onToken: state.onToken,
      })
      rawLLMAnswer = streamResult.content || '抱歉，無法生成回答，請稍後再試。'
      llmUsage = streamResult.usage
    } else {
      const llmResult = await state.llmProvider!.chat(llmMessages, {
        model: effectiveLlmModel,
        maxTokens: pipelineConfig.max_tokens_generation,
        gatewayOptions: state.gatewayOptions,
      })
      rawLLMAnswer = llmResult.content || '抱歉，無法生成回答，請稍後再試。'
      llmUsage = llmResult.usage
    }

    const newTokenBreakdown = { ...tokenBreakdown }
    if (llmUsage) {
      newTokenBreakdown.main_generation = {
        ...llmUsage,
        model: effectiveLlmModel,
        estimated: false,
      }
    } else {
      const msgLen = llmMessages.reduce((sum, m) => sum + m.content.length, 0)
      const estP = Math.ceil(msgLen / 2)
      const estC = Math.ceil(rawLLMAnswer.length / 2)
      newTokenBreakdown.main_generation = {
        prompt_tokens: estP,
        completion_tokens: estC,
        total_tokens: estP + estC,
        model: effectiveLlmModel,
        estimated: true,
      }
    }

    // Circuit Breaker：LLM generation 成功
    if (state.circuitBreaker) {
      state.circuitBreaker.recordSuccess().catch(() => {})
    }

    let { answer: parsedAnswer, suggested_questions } = parseSuggestedQuestions(rawLLMAnswer)

    const generationTrace: Record<string, unknown> = {}
    if (suggested_questions.length > 0) {
      generationTrace.suggested_questions = suggested_questions
    }

    if (!parsedAnswer) {
      parsedAnswer = '抱歉，目前無法生成回答，請換個方式提問或稍後再試。'
    }

    const cannotAnswer =
      parsedAnswer.includes('超出我的知識範圍') ||
      parsedAnswer.includes('找不到相關資訊') ||
      parsedAnswer.includes('找不到符合條件') ||
      parsedAnswer.includes('找不到相關路線') ||
      parsedAnswer.includes('無法提供任何推薦或建議')

    const finalSources = cannotAnswer ? [] : (state.sources ?? [])

    // 注入路線連結
    const answer =
      !cannotAnswer && finalSources.length > 0
        ? queryService.injectRouteLinks(parsedAnswer, finalSources)
        : parsedAnswer

    endSpan(span, { output: { answerLength: answer.length } })

    return {
      rawAnswer: rawLLMAnswer,
      answer,
      parsedAnswer,
      suggestedQuestions: suggested_questions,
      cannotAnswer,
      sources: finalSources,
      llmMessages,
      tokenBreakdown: newTokenBreakdown,
      trace: { generation: generationTrace },
    }
  } catch (err) {
    endSpan(span, { level: 'ERROR', metadata: { error: String(err) } })
    throw err
  }
}
