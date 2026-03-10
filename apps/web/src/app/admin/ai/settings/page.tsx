'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Loader2, Save, CheckCircle, Plus, Trash2, Pencil, GripVertical, AlertTriangle, RotateCcw } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useAIConfig, useUpdateAIConfig, DEFAULT_COST_PROVIDERS, type CostProvider, usePipelineSteps, useUpdatePipelineSteps, type PipelineStepInfo, type PipelineStepUpdate } from '@/lib/api/admin-ai'

// =============================================
// CONFIG_FIELDS 按 tab 分組
// =============================================

interface ConfigField {
  key: string
  label: string
  placeholder: string
  hint: string
}

interface TabConfig {
  id: string
  label: string
  sections: { title: string; desc: string; fields: ConfigField[] }[]
  guardrails?: GuardrailConfig[]
}

interface GuardrailConfig {
  key: string
  label: string
  desc: string
}

const TABS: TabConfig[] = [
  {
    id: 'models',
    label: '模型設定',
    sections: [
      {
        title: '模型設定',
        desc: '各 pipeline 階段使用的 AI 模型，更換後立即生效',
        fields: [
          { key: 'llm_model', label: '複雜查詢模型', placeholder: '@cf/google/gemma-3-12b-it', hint: 'complex queryType 的主力生成模型（Stage 6 LLM C）' },
          { key: 'simple_model', label: '簡單查詢模型', placeholder: '@cf/meta/llama-3.1-8b-instruct', hint: 'simple queryType 的輕量生成模型，速度較快' },
          { key: 'lightweight_model', label: '輕量模型', placeholder: '@cf/meta/llama-3.1-8b-instruct', hint: 'Judge 品質評判 + 通識回答（general-knowledge 路徑）使用' },
          { key: 'embedding_model', label: 'Embedding 模型', placeholder: '@cf/baai/bge-m3', hint: '文字轉向量模型，更換後需重新索引所有文件' },
          { key: 'contextual_rag_model', label: 'Contextual RAG 模型', placeholder: '@cf/meta/llama-3.1-8b-instruct', hint: '索引時生成語意摘要（Contextual RAG）使用的輕量 LLM，不影響查詢路徑' },
        ],
      },
    ],
  },
  {
    id: 'search',
    label: '搜尋與排名',
    sections: [
      {
        title: '搜尋與檢索',
        desc: 'Vectorize 候選池大小、RRF 合併門檻、最終傳給 LLM 的文件數',
        fields: [
          { key: 'max_results', label: '最終文件數', placeholder: '5', hint: 'MMR 選取後傳給 LLM C 的文件數（1–20）' },
          { key: 'merge_top_k', label: 'Vectorize 候選池', placeholder: '10', hint: '每路 Vectorize 搜尋候選數（5–50），多岩場查詢自動 ×2' },
          { key: 'bm25_top_k', label: 'BM25 候選數', placeholder: '10', hint: 'BM25 全文搜尋（FTS5）每次回傳的候選文件數（5–50），與向量路一同 RRF 合併' },
          { key: 'multi_query_count', label: 'Multi-Query 子查詢數', placeholder: '3', hint: 'Complex 查詢擴展為 N 個角度的子查詢（1–5），各自向量搜尋後 RRF 合併' },
          { key: 'min_rrf_score', label: 'RRF 門檻（無 filter）', placeholder: '0.005', hint: '無 metadata filter 時過濾低分文件，越低 recall 越高（0–1）' },
          { key: 'min_rrf_score_filtered', label: 'RRF 門檻（有 filter）', placeholder: '0.002', hint: '有 grade/crag filter 時放寬門檻，因 metadata 已保障相關性' },
          { key: 'min_vector_score', label: 'Vector Score 門檻', placeholder: '0.5', hint: '/ai/search 純語義搜尋端點的向量相似度門檻（0–1，越高結果越精準但數量越少）' },
        ],
      },
      {
        title: '排名與多樣性',
        desc: 'MMR 多樣性、Cross-encoder 與熱門度加權比例',
        fields: [
          { key: 'mmr_lambda', label: 'MMR Lambda', placeholder: '0.6', hint: 'λ 越高越重視相關性，越低結果越多樣（0.0–1.0，建議 0.5–0.7）' },
          { key: 'reranker_weight', label: 'Cross-encoder 權重', placeholder: '0.7', hint: '兩者自動歸一化，total = reranker + popularity；比例越高，cross-encoder 分數佔比越大' },
          { key: 'popularity_weight', label: '熱門度權重', placeholder: '0.3', hint: '依路線影片數量加權，兩者自動歸一化，無需與 reranker_weight 合計恰好為 1' },
          { key: 'reranker_relevance_threshold', label: 'Reranker 相關性閾值', placeholder: '0.3', hint: 'Cross-encoder reranker score 低於此值的文件直接丟棄，減少 LLM context 雜訊（0–1，預設 0.3）' },
          { key: 'reranker_min_keep', label: 'Reranker 最低保留數', placeholder: '2', hint: '即使全部低於閾值，至少保留 score 最高的前 N 筆文件（1–20，預設 2）' },
        ],
      },
      {
        title: 'Tool Selection 信心',
        desc: 'LLM 工具選擇的信心分數閾值，低信心查詢自動降級為通識回答',
        fields: [
          { key: 'tool_confidence_threshold', label: '信心閾值', placeholder: '0.7', hint: 'Tool Selection confidence 低於此值時降級為 general_knowledge，避免低信心檢索浪費資源（0–1，預設 0.7）' },
        ],
      },
    ],
  },
  {
    id: 'quality',
    label: '品質與 Token',
    sections: [
      {
        title: 'Token 限制',
        desc: '各 LLM 呼叫的最大輸出 token 數，影響回答長度與費用',
        fields: [
          { key: 'max_tokens_generation', label: '生成最大 Tokens', placeholder: '800', hint: '主力生成（LLM C）與 self-reflection 重生成（200–2000）' },
          { key: 'max_tokens_gk', label: '通識最大 Tokens', placeholder: '600', hint: 'general-knowledge 路徑（不走 RAG）的 max_tokens（200–2000）' },
          { key: 'high_consumption_threshold', label: '高消耗門檻（tokens）', placeholder: '1000', hint: '超過此 token 數時日誌標記 is_high_consumption，供監控告警' },
        ],
      },
      {
        title: '品質閾值',
        desc: 'Groundedness 分數決定免責聲明與自動送審的觸發條件',
        fields: [
          { key: 'groundedness_disclaimer_low', label: '強警示閾值', placeholder: '0.6', hint: 'Groundedness 低於此值時，在回答前注入強警示（0–1）' },
          { key: 'groundedness_disclaimer_mid', label: '輕警示閾值', placeholder: '0.8', hint: 'Groundedness 低於此值時，在回答前注入提醒（應大於強警示閾值）' },
          { key: 'groundedness_flag_threshold', label: '自動送審閾值', placeholder: '0.5', hint: 'Groundedness 低於此值時自動寫入 ai_flagged_responses 待人工審核' },
        ],
      },
      {
        title: 'Judge 設定',
        desc: '品質評判 LLM 的逾時、context 截斷，以及 Judge 驅動重生成的觸發條件',
        fields: [
          { key: 'judge_timeout_ms', label: 'Judge 逾時（ms）', placeholder: '8000', hint: 'Judge LLM 呼叫逾時上限，超時則跳過評分繼續回答（1000–30000）' },
          { key: 'judge_context_truncate', label: 'Context 截斷（字）', placeholder: '2000', hint: '傳給 Judge LLM 的 context 最大字元數（200–3000）' },
          { key: 'judge_regen_quality_max', label: '重生成觸發門檻', placeholder: '2', hint: 'Judge quality 等於或低於此值時觸發重生成（1=很差、2=差、3=好、4=優；建議設 2）' },
        ],
      },
      {
        title: 'Self-Reflection 設定',
        desc: '重生成的最小回答長度門檻',
        fields: [
          { key: 'self_reflection_min_length', label: '最小觸發長度（字）', placeholder: '50', hint: '回答字元數低於此值時跳過 self-reflection（太短無意義評估）（10–500）' },
        ],
      },
    ],
  },
  {
    id: 'chat',
    label: '對話與快取',
    sections: [
      {
        title: '對話與快取',
        desc: '多輪對話歷史深度與 KV 快取存活時間',
        fields: [
          { key: 'chat_history_depth', label: '對話歷史深度（則）', placeholder: '6', hint: '帶入 LLM 的最近對話訊息數（1 輪 = 2 則，預設 3 輪 = 6 則）（2–20）' },
          { key: 'assistant_history_truncate', label: 'Assistant 歷史截斷（字）', placeholder: '500', hint: '歷史 assistant 訊息傳入 LLM 前的截斷長度，避免占用過多 context window（100–2000）' },
          { key: 'cache_ttl', label: '快取 TTL（秒）', placeholder: '3600', hint: '相同查詢的 KV 快取存活時間，預設 1 小時（60–86400）' },
        ],
      },
      {
        title: '語義快取',
        desc: '使用向量相似度對語意相近的問題命中快取，跳過完整 RAG pipeline（僅匿名且無對話歷史）',
        fields: [
          { key: 'semantic_cache_enabled', label: '啟用語義快取', placeholder: '0', hint: '0 = 停用，1 = 啟用；建議先在測試環境驗證命中率再開啟' },
          { key: 'semantic_cache_threshold', label: '相似度門檻', placeholder: '0.95', hint: 'Cosine similarity 高於此值視為相同問題（0.80–1.00，建議 0.90–0.95）' },
        ],
      },
    ],
  },
  {
    id: 'agentic',
    label: 'Agentic 模式',
    sections: [
      {
        title: 'Agentic 模式',
        desc: '多輪動態搜尋模式，讓 LLM 自主決定是否需要補充搜尋；僅對 complex 查詢生效，成本顯著較高',
        fields: [
          { key: 'rag_strategy', label: 'RAG 策略', placeholder: 'baseline', hint: 'baseline = 單輪搜尋；agentic = 多輪動態搜尋；plan-execute = 子任務規劃 + 執行 + 合成；auto = 依查詢複雜度自動選擇（plan-execute 優先，子任務太少降級 agentic）' },
          { key: 'agentic_max_steps', label: '最大搜尋輪數', placeholder: '3', hint: 'Agentic loop 最多執行幾次額外搜尋（1–5），每輪 +0.5–1s 延遲' },
          { key: 'agentic_min_docs_to_answer', label: '提前結束文件數', placeholder: '3', hint: '累積超過此數量的文件後提前結束迴圈，不等到 max_steps（1–10）' },
        ],
      },
    ],
  },
  {
    id: 'plan_execute',
    label: 'Plan & Execute',
    sections: [
      {
        title: 'Plan-and-Execute 模式',
        desc: '將複雜查詢分解為子任務計畫，各子任務獨立搜尋後合成統一 context；僅 complex 查詢且 rag_strategy = plan-execute 或 auto 時生效',
        fields: [
          { key: 'plan_execute_max_steps', label: '最大子任務數', placeholder: '4', hint: '規劃階段 LLM 最多生成幾個子任務（1–8），子任務越多搜尋越全面但延遲越高' },
          { key: 'plan_execute_min_entities', label: 'Auto 最低實體數', placeholder: '2', hint: '僅 auto 模式生效：規劃子任務數少於此值時降級為 agentic（1–5）' },
          { key: 'planning_timeout_ms', label: '規劃超時（ms）', placeholder: '8000', hint: 'Planning LLM 超時上限，超時則 fallback 到 agentic（3000–15000）' },
          { key: 'plan_step_timeout_ms', label: '子任務超時（ms）', placeholder: '5000', hint: '每個子任務（embedding + 搜尋）超時上限，超時回傳空結果（2000–10000）' },
          { key: 'synthesis_timeout_ms', label: '合成超時（ms）', placeholder: '8000', hint: 'Synthesis LLM 超時上限，超時使用 fallback 拼接（3000–15000）' },
          { key: 'adaptive_plan_enabled', label: '啟用 Adaptive Replan', placeholder: '1', hint: '0 = 停用，1 = 啟用；子任務結果為空時自動生成替代子任務' },
        ],
      },
    ],
  },
  {
    id: 'timeout',
    label: '超時與熔斷',
    sections: [
      {
        title: 'Pipeline 超時',
        desc: '各階段超時上限，超時後自動降級繼續執行',
        fields: [
          { key: 'pipeline_timeout_ms', label: 'Pipeline 整體超時（ms）', placeholder: '40000', hint: '整個 pipeline 的最大執行時間，超時回傳 408（5000–60000）' },
          { key: 'embedding_timeout_ms', label: 'Embedding 超時（ms）', placeholder: '3000', hint: '向量嵌入超時 → 降級為僅 BM25 搜尋（1000–10000）' },
          { key: 'search_timeout_ms', label: '搜尋超時（ms）', placeholder: '4000', hint: 'Hybrid Search 超時（1000–15000）' },
          { key: 'generation_timeout_ms', label: 'LLM 生成超時（ms）', placeholder: '18000', hint: 'LLM 回答生成超時 → 回傳超時錯誤訊息，跳過 evaluation（3000–30000）' },
          { key: 'hyde_timeout_ms', label: 'HyDE 超時（ms）', placeholder: '5000', hint: 'HyDE 假設文件生成超時 → 跳過，使用原始查詢（1000–10000）' },
          { key: 'multi_query_timeout_ms', label: 'Multi-Query 超時（ms）', placeholder: '5000', hint: 'Multi-Query 擴展超時 → 跳過，使用原始查詢（1000–10000）' },
        ],
      },
      {
        title: 'Circuit Breaker 熔斷器',
        desc: 'Workers AI 連續失敗時自動熔斷，避免雪崩；冷卻後自動探測恢復',
        fields: [
          { key: 'circuit_breaker_threshold', label: '熔斷觸發次數', placeholder: '5', hint: '連續失敗幾次後觸發 Open 狀態（2–20）' },
          { key: 'circuit_breaker_reset_ms', label: '冷卻時間（ms）', placeholder: '30000', hint: 'Open 狀態持續多久後進入 Half-Open 探測（5000–120000）' },
        ],
      },
    ],
  },
  {
    id: 'guardrails',
    label: '防護設定',
    sections: [
      {
        title: '防護設定',
        desc: '輸出截斷上限（超過字元數自動截斷），其他規則由下方自訂黑名單管理',
        fields: [
          { key: 'max_output_length', label: '輸出最大字元數', placeholder: '3000', hint: '回應超過此字元數時自動截斷並提示（500–10000，預設 3000）' },
        ],
      },
    ],
    guardrails: [
      { key: 'prompt_injection_keywords', label: '輸入防護：Prompt Injection 關鍵字', desc: '含有這些關鍵字的輸入會被拒絕（不分大小寫）' },
      { key: 'jailbreak_patterns', label: '輸入防護：Jailbreak 模式', desc: '用於偵測角色扮演、繞過限制等越獄嘗試（不分大小寫）' },
      { key: 'system_prompt_leakage_patterns', label: '輸出防護：System Prompt 洩漏模式', desc: '輸出包含這些模式時視為 system prompt 洩漏，整段回答會替換為錯誤訊息' },
      { key: 'input_blocklist', label: '輸入防護：自訂黑名單', desc: '補充上方規則的自訂封鎖詞，適合加入特定業務需求的禁止詞彙' },
    ],
  },
]

// =============================================
// Pipeline Flow Panel 元件
// =============================================

const PHASE_LABELS: Record<string, string> = {
  'pre-retrieval': 'Pre-retrieval',
  'retrieval': 'Retrieval',
  'post-retrieval': 'Post-retrieval',
  'generation': 'Generation',
  'evaluation': 'Evaluation',
}

const PHASE_COLORS: Record<string, string> = {
  'pre-retrieval': 'border-blue-200 bg-blue-50/50',
  'retrieval': 'border-emerald-200 bg-emerald-50/50',
  'post-retrieval': 'border-amber-200 bg-amber-50/50',
  'generation': 'border-purple-200 bg-purple-50/50',
  'evaluation': 'border-rose-200 bg-rose-50/50',
}

function PipelineFlowPanel() {
  const { data: steps, isLoading } = usePipelineSteps()
  const { mutate: updateSteps, isPending } = useUpdatePipelineSteps()
  const [localSteps, setLocalSteps] = useState<PipelineStepInfo[]>([])
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragItem, setDragItem] = useState<string | null>(null)

  useEffect(() => {
    if (steps) {
      setLocalSteps([...steps])
    }
  }, [steps])

  const hasChanges = useMemo(() => {
    if (!steps || steps.length !== localSteps.length) return false
    return localSteps.some((local) => {
      const original = steps.find((s) => s.id === local.id)
      if (!original) return true
      return local.enabled !== original.enabled || local.order !== original.order
    })
  }, [steps, localSteps])

  const toggleStep = (stepId: string) => {
    setLocalSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, enabled: !s.enabled } : s))
    )

  }

  // 檢查 step 的依賴是否被滿足（上游 provides 是否涵蓋 requires）
  const getMissingDeps = (stepId: string): string[] => {
    const step = localSteps.find((s) => s.id === stepId)
    if (!step || !step.enabled) return []
    const EXEC_PHASE_ORDER = ['pre-retrieval', 'retrieval', 'post-retrieval', 'generation', 'evaluation']
    // 按實際執行順序排序
    const sorted = [...localSteps].sort((a, b) => {
      const pa = EXEC_PHASE_ORDER.indexOf(a.phase)
      const pb = EXEC_PHASE_ORDER.indexOf(b.phase)
      if (pa !== pb) return pa - pb
      return a.order - b.order
    })
    // 初始 context 已提供的欄位
    const providedBefore = new Set([
      'env', 'request', 'pipelineConfig', 'prompts', 'trace', 'tokenBreakdown',
      'queryService', 'startTime', 'cacheKey', 'recentHistory', 'isAnonymousNoHistory',
      'earlyQueryVector', 'memorySummary', 'ascentContext', 'abilityLevel',
      'streamingMode', 'vectorFilter', 'hydeDoc', 'expandedQueries',
    ])
    for (const other of sorted) {
      if (other.id === stepId) break
      if (!other.enabled) continue
      for (const p of other.provides) providedBefore.add(p)
    }
    return step.requires.filter((r) => !providedBefore.has(r))
  }

  const handleDragStart = (stepId: string) => {
    setDragItem(stepId)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!dragItem || dragItem === targetId) return
    const dragStep = localSteps.find((s) => s.id === dragItem)
    const targetStep = localSteps.find((s) => s.id === targetId)
    if (!dragStep || !targetStep || dragStep.phase !== targetStep.phase) return
  }

  const handleDrop = (targetId: string) => {
    if (!dragItem || dragItem === targetId) { setDragItem(null); return }
    const dragStep = localSteps.find((s) => s.id === dragItem)
    const targetStep = localSteps.find((s) => s.id === targetId)
    if (!dragStep || !targetStep || dragStep.phase !== targetStep.phase) { setDragItem(null); return }

    setLocalSteps((prev) => {
      const phaseSteps = prev.filter((s) => s.phase === dragStep.phase)
      const otherSteps = prev.filter((s) => s.phase !== dragStep.phase)
      const dragIdx = phaseSteps.findIndex((s) => s.id === dragItem)
      const targetIdx = phaseSteps.findIndex((s) => s.id === targetId)
      const [moved] = phaseSteps.splice(dragIdx, 1)
      phaseSteps.splice(targetIdx, 0, moved)
      // 重新排序 order
      phaseSteps.forEach((s, i) => { s.order = i })
      return [...otherSteps, ...phaseSteps].sort((a, b) => {
        const phases = ['pre-retrieval', 'retrieval', 'post-retrieval', 'generation', 'evaluation']
        const pa = phases.indexOf(a.phase)
        const pb = phases.indexOf(b.phase)
        if (pa !== pb) return pa - pb
        return a.order - b.order
      })
    })

    setDragItem(null)
  }

  const handleSave = () => {
    const payload: PipelineStepUpdate[] = localSteps.map((s) => ({
      id: s.id,
      enabled: s.enabled,
      order: s.order,
    }))
    setError(null)
    updateSteps(payload, {
      onSuccess: () => {
        setSaved(true)

        setTimeout(() => setSaved(false), 2500)
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : '儲存失敗'
        setError(msg)
      },
    })
  }

  const handleReset = () => {
    if (steps) {
      setLocalSteps([...steps])
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-wb-40" />
      </div>
    )
  }

  // 按 phase 分組
  const phases = ['pre-retrieval', 'retrieval', 'post-retrieval', 'generation', 'evaluation'] as const
  const grouped = phases.map((phase) => ({
    phase,
    steps: localSteps.filter((s) => s.phase === phase).sort((a, b) => a.order - b.order),
  }))

  return (
    <div className="space-y-6">
      {grouped.map(({ phase, steps: phaseSteps }) => (
        <div key={phase} className={`rounded-xl border ${PHASE_COLORS[phase]} overflow-hidden`}>
          <div className="border-b border-inherit px-5 py-3">
            <h2 className="text-sm font-semibold text-wb-100">{PHASE_LABELS[phase]}</h2>
            <p className="text-xs text-wb-50">{phaseSteps.length} steps</p>
          </div>
          <div className="divide-y divide-inherit">
            {phaseSteps.map((step) => {
              const missing = getMissingDeps(step.id)
              return (
                <div
                  key={step.id}
                  draggable
                  onDragStart={() => handleDragStart(step.id)}
                  onDragOver={(e) => handleDragOver(e, step.id)}
                  onDrop={() => handleDrop(step.id)}
                  className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                    dragItem === step.id ? 'opacity-50' : ''
                  } ${step.enabled ? '' : 'opacity-60'}`}
                >
                  <GripVertical className="h-4 w-4 text-wb-30 cursor-grab shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-wb-100">{step.name}</span>
                      <span className="font-mono text-[10px] text-wb-40">{step.id}</span>
                    </div>
                    <p className="text-xs text-wb-50 truncate">{step.description}</p>
                    {step.skipWhen.length > 0 && (
                      <p className="text-[10px] text-wb-40 mt-0.5">
                        skipWhen: {step.skipWhen.map((c) => `${c.field} ${c.operator} ${String(c.value)}`).join(', ')}
                      </p>
                    )}
                    {missing.length > 0 && (
                      <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3 inline shrink-0" />
                        缺少依賴: {missing.join(', ')}
                      </p>
                    )}
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={step.enabled}
                      onChange={() => toggleStep(step.id)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-wb-20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle className="h-4 w-4" />
            已儲存
          </span>
        )}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 rounded-xl border border-wb-20 px-4 py-2.5 text-sm font-medium text-wb-60 hover:bg-wb-05 transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          重設
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-wb-100 px-5 py-2.5 text-sm font-medium text-white hover:bg-wb-90 disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          儲存設定
        </button>
      </div>
    </div>
  )
}

// =============================================
// 費用模擬 Tab 元件
// =============================================

function CostSimulationPanel({ config }: { config: Record<string, string> }) {
  const { mutate: updateConfig, isPending } = useUpdateAIConfig()
  const [providers, setProviders] = useState<CostProvider[]>(() => {
    try {
      const raw = config['cost_providers']
      if (raw) {
        const parsed = JSON.parse(raw) as CostProvider[]
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch { /* fallback */ }
    return DEFAULT_COST_PROVIDERS
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Partial<CostProvider>>({})
  const [addingNew, setAddingNew] = useState(false)
  const [newProvider, setNewProvider] = useState<Partial<CostProvider>>({})
  const [saved, setSaved] = useState(false)

  const handleSave = useCallback(() => {
    updateConfig({ cost_providers: JSON.stringify(providers) }, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      },
    })
  }, [providers, updateConfig])

  const startEdit = (provider: CostProvider) => {
    setEditingId(provider.id)
    setEditValues({ ...provider })
    setAddingNew(false)
  }

  const commitEdit = () => {
    if (!editingId) return
    setProviders((prev) => prev.map((p) =>
      p.id === editingId
        ? { ...p, name: editValues.name ?? p.name, input_per_1m: Number(editValues.input_per_1m ?? p.input_per_1m), output_per_1m: Number(editValues.output_per_1m ?? p.output_per_1m) }
        : p
    ))
    setEditingId(null)
  }

  const deleteProvider = (id: string) => {
    setProviders((prev) => prev.filter((p) => p.id !== id))
    if (editingId === id) setEditingId(null)
  }

  const commitAdd = () => {
    if (!newProvider.name?.trim()) return
    const id = `custom-${Date.now()}`
    setProviders((prev) => [...prev, {
      id,
      name: newProvider.name!.trim(),
      input_per_1m: Number(newProvider.input_per_1m ?? 0),
      output_per_1m: Number(newProvider.output_per_1m ?? 0),
    }])
    setNewProvider({})
    setAddingNew(false)
  }

  const resetToDefaults = () => {
    setProviders(DEFAULT_COST_PROVIDERS)
    setEditingId(null)
    setAddingNew(false)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-wb-20 bg-white overflow-hidden">
        <div className="border-b border-wb-10 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-wb-100">LLM 供應商費用</h2>
            <p className="mt-0.5 text-xs text-wb-50">設定各供應商每百萬 token 的輸入/輸出費用（USD），供 Log 詳情頁費用分析使用</p>
          </div>
          <button
            onClick={resetToDefaults}
            className="text-xs text-wb-50 hover:text-wb-80 transition-colors"
          >
            恢復預設
          </button>
        </div>

        {/* 表頭 */}
        <div className="grid grid-cols-[1fr_120px_120px_80px] gap-2 px-5 py-2 bg-wb-05 border-b border-wb-10 text-[10px] font-semibold text-wb-50 uppercase tracking-wider">
          <span>供應商名稱</span>
          <span>Input $/1M</span>
          <span>Output $/1M</span>
          <span></span>
        </div>

        <div className="divide-y divide-wb-10">
          {providers.map((p) =>
            editingId === p.id ? (
              <div key={p.id} className="grid grid-cols-[1fr_120px_120px_80px] gap-2 px-5 py-3 items-center bg-blue-50/30">
                <input
                  className="rounded border border-wb-30 px-2 py-1 text-sm text-wb-100 outline-none focus:border-blue-400 w-full"
                  value={editValues.name ?? ''}
                  onChange={(e) => setEditValues((v) => ({ ...v, name: e.target.value }))}
                  placeholder="供應商名稱"
                />
                <input
                  type="number"
                  className="rounded border border-wb-30 px-2 py-1 text-sm font-mono text-wb-100 outline-none focus:border-blue-400 w-full"
                  value={editValues.input_per_1m ?? ''}
                  onChange={(e) => setEditValues((v) => ({ ...v, input_per_1m: parseFloat(e.target.value) || 0 }))}
                  step="0.001"
                />
                <input
                  type="number"
                  className="rounded border border-wb-30 px-2 py-1 text-sm font-mono text-wb-100 outline-none focus:border-blue-400 w-full"
                  value={editValues.output_per_1m ?? ''}
                  onChange={(e) => setEditValues((v) => ({ ...v, output_per_1m: parseFloat(e.target.value) || 0 }))}
                  step="0.001"
                />
                <div className="flex gap-1">
                  <button onClick={commitEdit} className="rounded px-2 py-1 text-xs bg-wb-100 text-white hover:bg-wb-90 transition-colors">確認</button>
                  <button onClick={() => setEditingId(null)} className="rounded px-2 py-1 text-xs border border-wb-20 text-wb-60 hover:bg-wb-10 transition-colors">取消</button>
                </div>
              </div>
            ) : (
              <div key={p.id} className="grid grid-cols-[1fr_120px_120px_80px] gap-2 px-5 py-3 items-center hover:bg-wb-05 transition-colors">
                <span className="text-sm text-wb-80">{p.name}</span>
                <span className="text-sm font-mono text-wb-70">${p.input_per_1m.toFixed(3)}</span>
                <span className="text-sm font-mono text-wb-70">${p.output_per_1m.toFixed(3)}</span>
                <div className="flex gap-1">
                  <button onClick={() => startEdit(p)} className="p-1.5 rounded text-wb-40 hover:text-wb-80 hover:bg-wb-10 transition-colors" title="編輯">
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteProvider(p.id)} className="p-1.5 rounded text-wb-40 hover:text-red-500 hover:bg-red-50 transition-colors" title="刪除">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          )}

          {/* 新增列 */}
          {addingNew ? (
            <div className="grid grid-cols-[1fr_120px_120px_80px] gap-2 px-5 py-3 items-center bg-emerald-50/30">
              <input
                className="rounded border border-wb-30 px-2 py-1 text-sm text-wb-100 outline-none focus:border-emerald-400 w-full"
                value={newProvider.name ?? ''}
                onChange={(e) => setNewProvider((v) => ({ ...v, name: e.target.value }))}
                placeholder="供應商名稱"
                autoFocus
              />
              <input
                type="number"
                className="rounded border border-wb-30 px-2 py-1 text-sm font-mono text-wb-100 outline-none focus:border-emerald-400 w-full"
                value={newProvider.input_per_1m ?? ''}
                onChange={(e) => setNewProvider((v) => ({ ...v, input_per_1m: parseFloat(e.target.value) || 0 }))}
                step="0.001"
                placeholder="0.000"
              />
              <input
                type="number"
                className="rounded border border-wb-30 px-2 py-1 text-sm font-mono text-wb-100 outline-none focus:border-emerald-400 w-full"
                value={newProvider.output_per_1m ?? ''}
                onChange={(e) => setNewProvider((v) => ({ ...v, output_per_1m: parseFloat(e.target.value) || 0 }))}
                step="0.001"
                placeholder="0.000"
              />
              <div className="flex gap-1">
                <button onClick={commitAdd} className="rounded px-2 py-1 text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">新增</button>
                <button onClick={() => { setAddingNew(false); setNewProvider({}) }} className="rounded px-2 py-1 text-xs border border-wb-20 text-wb-60 hover:bg-wb-10 transition-colors">取消</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setAddingNew(true); setEditingId(null) }}
              className="flex w-full items-center gap-2 px-5 py-3 text-sm text-wb-50 hover:bg-wb-05 hover:text-wb-80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              新增供應商
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-wb-10 bg-wb-05 px-5 py-3">
        <p className="text-xs text-wb-50 leading-relaxed">
          費用資料儲存於 <span className="font-mono bg-white border border-wb-15 rounded px-1 py-0.5 text-[10px]">cost_providers</span> 設定鍵，Log 詳情頁依此計算各 stage 費用。
          Cloudflare Workers AI 定價請參考官方文件。
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle className="h-4 w-4" />
            已儲存
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-wb-100 px-5 py-2.5 text-sm font-medium text-white hover:bg-wb-90 disabled:opacity-50 transition-colors"
        >
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          儲存設定
        </button>
      </div>
    </div>
  )
}

// =============================================
// 取得 tab 包含的所有 config keys
// =============================================

function getTabKeys(tab: TabConfig): string[] {
  const keys: string[] = []
  for (const section of tab.sections) {
    for (const field of section.fields) {
      keys.push(field.key)
    }
  }
  if (tab.guardrails) {
    for (const g of tab.guardrails) {
      keys.push(g.key)
    }
  }
  return keys
}

// =============================================
// 將 JSON array 字串轉為 tag 陣列
// =============================================

function parseTagList(json: string): string[] {
  try {
    const arr = JSON.parse(json) as string[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

// =============================================
// TabPanel 元件：獨立 state + 獨立儲存
// =============================================

function TabPanel({
  tab,
  config,
}: {
  tab: TabConfig
  config: Record<string, string>
}) {
  const { mutate: updateConfig, isPending } = useUpdateAIConfig()
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  // 從 global config 初始化 tab 的 values
  useEffect(() => {
    const tabKeys = getTabKeys(tab)
    const initial: Record<string, string> = {}
    for (const key of tabKeys) {
      if (config[key] !== undefined) initial[key] = config[key]
    }
    setValues(initial)
  }, [config, tab])

  const handleSave = useCallback(() => {
    // 只送出此 tab 的 keys
    const tabKeys = getTabKeys(tab)
    const payload: Record<string, string> = {}
    for (const key of tabKeys) {
      if (values[key] !== undefined) payload[key] = values[key]
    }
    updateConfig(payload, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      },
    })
  }, [tab, values, updateConfig])

  return (
    <div className="space-y-6">
      {tab.sections.map((section) => (
        <div
          key={section.title}
          className="rounded-xl border border-wb-20 bg-white overflow-hidden"
        >
          <div className="border-b border-wb-10 px-5 py-4">
            <h2 className="text-sm font-semibold text-wb-100">{section.title}</h2>
            <p className="mt-0.5 text-xs text-wb-50">{section.desc}</p>
          </div>
          <div className="divide-y divide-wb-10">
            {section.fields.map((field) => (
              <div key={field.key} className="flex items-start gap-6 px-5 py-4">
                <div className="w-40 shrink-0 pt-1.5">
                  <label className="text-sm font-medium text-wb-80">{field.label}</label>
                  <p className="mt-0.5 text-xs text-wb-50 leading-snug">{field.hint}</p>
                  <p className="mt-1.5 font-mono text-[10px] text-wb-30 bg-wb-5 rounded px-1 py-0.5 inline-block">
                    {field.key}
                  </p>
                </div>
                <div className="flex-1 pt-1">
                  <input
                    value={values[field.key] ?? ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-wb-20 bg-white px-3 py-2 text-sm text-wb-100 placeholder:text-wb-40 outline-none focus:border-wb-50 focus:ring-1 focus:ring-wb-50 transition-colors font-mono"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Guardrail tag inputs */}
      {tab.guardrails?.map((g) => {
        const tags = parseTagList(values[g.key] ?? '[]')
        return (
          <GuardrailTagInput
            key={g.key}
            label={g.label}
            desc={g.desc}
            configKey={g.key}
            tags={tags}
            onChange={(newTags) =>
              setValues((prev) => ({ ...prev, [g.key]: JSON.stringify(newTags) }))
            }
          />
        )
      })}

      {/* Save button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-emerald-600">
            <CheckCircle className="h-4 w-4" />
            已儲存
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-wb-100 px-5 py-2.5 text-sm font-medium text-white hover:bg-wb-90 disabled:opacity-50 transition-colors"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          儲存設定
        </button>
      </div>
    </div>
  )
}

// =============================================
// GuardrailTagInput 元件
// =============================================

function GuardrailTagInput({
  label,
  desc,
  configKey,
  tags,
  onChange,
}: {
  label: string
  desc: string
  configKey: string
  tags: string[]
  onChange: (_tags: string[]) => void
}) {
  const [input, setInput] = useState('')

  const addTag = (text: string) => {
    const trimmed = text.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
  }

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(input)
      setInput('')
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text')
    if (text.includes('\n')) {
      e.preventDefault()
      const lines = text.split('\n').map((s) => s.trim()).filter(Boolean)
      const newTags = [...tags]
      for (const line of lines) {
        if (!newTags.includes(line)) newTags.push(line)
      }
      onChange(newTags)
      setInput('')
    }
  }

  return (
    <div className="rounded-xl border border-wb-20 bg-white overflow-hidden">
      <div className="border-b border-wb-10 px-5 py-4">
        <h2 className="text-sm font-semibold text-wb-100">{label}</h2>
        <p className="mt-0.5 text-xs text-wb-50">{desc}</p>
      </div>
      <div className="px-5 py-4 space-y-3">
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, i) => (
              <span
                key={`${tag}-${i}`}
                className="inline-flex items-center gap-1 rounded-md bg-wb-05 border border-wb-20 px-2 py-1 font-mono text-xs text-wb-80"
              >
                {tag}
                <button
                  onClick={() => removeTag(i)}
                  className="ml-0.5 text-wb-40 hover:text-red-500 transition-colors"
                  aria-label={`刪除 ${tag}`}
                >
                  &times;
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Input */}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="輸入關鍵字後按 Enter 新增，支援多行貼上"
          className="w-full rounded-lg border border-wb-20 bg-white px-3 py-2 text-sm text-wb-100 placeholder:text-wb-40 outline-none focus:border-wb-50 focus:ring-1 focus:ring-wb-50 transition-colors font-mono"
        />

        <div className="flex items-center gap-3">
          <p className="font-mono text-[10px] text-wb-30 bg-wb-5 rounded px-1 py-0.5 inline-block">
            {configKey}
          </p>
          <p className="text-xs text-wb-40">
            目前共{' '}
            <span className="font-semibold text-wb-80">{tags.length}</span> 個
          </p>
        </div>
      </div>
    </div>
  )
}

// =============================================
// Main Page
// =============================================

export default function AdminAISettingsPage() {
  const { data: config, isLoading } = useAIConfig()
  const allTabIds = [...TABS.map((t) => t.id), 'pipeline', 'cost']
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.slice(1)
      if (allTabIds.includes(hash)) return hash
    }
    return 'models'
  })

  // URL hash 同步
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1)
      if (allTabIds.includes(hash)) setActiveTab(hash)
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value)
    window.history.replaceState(null, '', `#${value}`)
  }, [])

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-wb-40" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-wb-100">AI Pipeline 設定</h1>
        <p className="mt-1 text-sm text-wb-60">
          所有參數儲存後立即生效（無需重啟），每個分頁獨立儲存
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="flex flex-wrap gap-1 rounded-lg bg-wb-05 p-1">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="pipeline" className="text-xs">Pipeline Flow</TabsTrigger>
          <TabsTrigger value="cost" className="text-xs">費用模擬</TabsTrigger>
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <TabPanel tab={tab} config={config ?? {}} />
          </TabsContent>
        ))}
        <TabsContent value="pipeline">
          <PipelineFlowPanel />
        </TabsContent>
        <TabsContent value="cost">
          <CostSimulationPanel config={config ?? {}} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
