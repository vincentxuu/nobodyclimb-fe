import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import {
  AlertCircle,
  ArrowLeft,
  ListChecks,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, EmptyState, Text } from '@/components/ui'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  type CostProvider,
  DEFAULT_COST_PROVIDERS,
  type PipelineStepInfo,
  useAIConfig,
  usePipelineSteps,
  useUpdateAIConfig,
  useUpdatePipelineSteps,
} from '@/lib/hooks/useAdminDashboard'
import { useAuthStore } from '@/store/authStore'

type TabType =
  | 'models'
  | 'search'
  | 'quality'
  | 'chat'
  | 'agentic'
  | 'plan_execute'
  | 'timeout'
  | 'guardrails'
  | 'pipeline'
  | 'cost'

interface ConfigField {
  key: string
  label: string
  placeholder: string
  hint: string
  options?: Array<{ value: string; label: string }>
  multiline?: boolean
}

interface ConfigSection {
  title: string
  desc: string
  fields: ConfigField[]
}

interface TabConfig {
  id: TabType
  label: string
  sections: ConfigSection[]
}

const tabs: Array<{ id: TabType; label: string }> = [
  { id: 'models', label: '模型' },
  { id: 'search', label: '搜尋' },
  { id: 'quality', label: '品質' },
  { id: 'chat', label: '對話' },
  { id: 'agentic', label: 'Agentic' },
  { id: 'plan_execute', label: 'Plan' },
  { id: 'timeout', label: '超時' },
  { id: 'guardrails', label: '防護' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'cost', label: '費用' },
]

const configTabs: TabConfig[] = [
  {
    id: 'models',
    label: '模型設定',
    sections: [
      {
        title: '模型設定',
        desc: '各 pipeline 階段使用的 AI 模型，更換後立即生效。',
        fields: [
          {
            key: 'llm_model',
            label: '複雜查詢模型',
            placeholder: '@cf/google/gemma-3-12b-it',
            hint: 'complex queryType 的主力生成模型。',
          },
          {
            key: 'simple_model',
            label: '簡單查詢模型',
            placeholder: '@cf/meta/llama-3.1-8b-instruct',
            hint: 'simple queryType 的輕量生成模型。',
          },
          {
            key: 'lightweight_model',
            label: '輕量模型',
            placeholder: '@cf/meta/llama-3.1-8b-instruct',
            hint: 'Judge 與通識回答使用。',
          },
          {
            key: 'embedding_model',
            label: 'Embedding 模型',
            placeholder: '@cf/baai/bge-m3',
            hint: '更換後需重新索引知識庫。',
          },
          {
            key: 'contextual_rag_model',
            label: 'Contextual RAG 模型',
            placeholder: '@cf/meta/llama-3.1-8b-instruct',
            hint: '索引時生成語意摘要使用。',
          },
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
        desc: 'Vectorize、BM25、RRF 與最終文件數。',
        fields: [
          {
            key: 'max_results',
            label: '最終文件數',
            placeholder: '5',
            hint: '傳給 LLM 的文件數。',
          },
          {
            key: 'list_response_limit',
            label: '清單輸出上限',
            placeholder: '10',
            hint: '列表型回答最大輸出數。',
          },
          {
            key: 'merge_top_k',
            label: 'Vectorize 候選池',
            placeholder: '10',
            hint: '每路 Vectorize 搜尋候選數。',
          },
          { key: 'bm25_top_k', label: 'BM25 候選數', placeholder: '10', hint: '全文搜尋候選數。' },
          {
            key: 'multi_query_count',
            label: 'Multi-Query 子查詢數',
            placeholder: '3',
            hint: 'Complex 查詢擴展角度數。',
          },
          {
            key: 'min_rrf_score',
            label: 'RRF 門檻',
            placeholder: '0.005',
            hint: '無 filter 時的低分文件過濾門檻。',
          },
          {
            key: 'min_rrf_score_filtered',
            label: 'Filtered RRF 門檻',
            placeholder: '0.002',
            hint: '有 metadata filter 時放寬門檻。',
          },
          {
            key: 'min_vector_score',
            label: 'Vector Score 門檻',
            placeholder: '0.5',
            hint: '純語義搜尋端點的相似度門檻。',
          },
          {
            key: 'mmr_lambda',
            label: 'MMR Lambda',
            placeholder: '0.6',
            hint: '越高越重視相關性。',
          },
          {
            key: 'reranker_weight',
            label: 'Reranker 權重',
            placeholder: '0.7',
            hint: 'Cross-encoder 分數佔比。',
          },
          {
            key: 'popularity_weight',
            label: '熱門度權重',
            placeholder: '0.3',
            hint: '依路線影片數量加權。',
          },
          {
            key: 'reranker_relevance_threshold',
            label: 'Reranker 閾值',
            placeholder: '0.3',
            hint: '低於此分數的文件丟棄。',
          },
          {
            key: 'reranker_min_keep',
            label: 'Reranker 最低保留數',
            placeholder: '2',
            hint: '至少保留的文件數。',
          },
          {
            key: 'tool_confidence_threshold',
            label: '工具信心閾值',
            placeholder: '0.7',
            hint: '低信心時降級為通識回答。',
          },
        ],
      },
    ],
  },
  {
    id: 'quality',
    label: '品質與 Token',
    sections: [
      {
        title: 'Token 與品質',
        desc: '輸出長度、Groundedness 與 Judge 設定。',
        fields: [
          {
            key: 'max_tokens_generation',
            label: '生成最大 Tokens',
            placeholder: '800',
            hint: '主力生成最大 token。',
          },
          {
            key: 'max_tokens_gk',
            label: '通識最大 Tokens',
            placeholder: '600',
            hint: 'general-knowledge 路徑最大 token。',
          },
          {
            key: 'high_consumption_threshold',
            label: '高消耗門檻',
            placeholder: '1000',
            hint: '超過後日誌標記高耗。',
          },
          {
            key: 'groundedness_disclaimer_low',
            label: '強警示閾值',
            placeholder: '0.6',
            hint: '低於此值注入強警示。',
          },
          {
            key: 'groundedness_disclaimer_mid',
            label: '輕警示閾值',
            placeholder: '0.8',
            hint: '低於此值注入提醒。',
          },
          {
            key: 'groundedness_flag_threshold',
            label: '自動送審閾值',
            placeholder: '0.5',
            hint: '低於此值寫入待審。',
          },
          {
            key: 'judge_timeout_ms',
            label: 'Judge 逾時',
            placeholder: '8000',
            hint: 'Judge LLM 呼叫逾時上限。',
          },
          {
            key: 'judge_context_truncate',
            label: 'Judge Context 截斷',
            placeholder: '2000',
            hint: '傳給 Judge 的 context 字數。',
          },
          {
            key: 'judge_regen_quality_max',
            label: '重生成觸發門檻',
            placeholder: '2',
            hint: 'Judge quality 低於此值重生成。',
          },
          {
            key: 'self_reflection_min_length',
            label: 'Self-reflection 最小長度',
            placeholder: '50',
            hint: '太短回答跳過 self-reflection。',
          },
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
        desc: '多輪對話歷史與 KV / semantic cache。',
        fields: [
          {
            key: 'chat_history_depth',
            label: '對話歷史深度',
            placeholder: '6',
            hint: '帶入 LLM 的最近訊息數。',
          },
          {
            key: 'assistant_history_truncate',
            label: 'Assistant 歷史截斷',
            placeholder: '500',
            hint: '歷史 assistant 訊息截斷長度。',
          },
          { key: 'cache_ttl', label: '快取 TTL', placeholder: '3600', hint: 'KV 快取存活秒數。' },
          {
            key: 'semantic_cache_enabled',
            label: '啟用語義快取',
            placeholder: '0',
            hint: '0 停用，1 啟用。',
            options: [
              { value: '0', label: '停用' },
              { value: '1', label: '啟用' },
            ],
          },
          {
            key: 'semantic_cache_threshold',
            label: '語義快取相似度',
            placeholder: '0.95',
            hint: '高於此值視為相同問題。',
          },
        ],
      },
    ],
  },
  {
    id: 'agentic',
    label: 'Agentic',
    sections: [
      {
        title: 'Agentic 模式',
        desc: 'LangGraph 與 RAG strategy。',
        fields: [
          {
            key: 'use_langgraph_engine',
            label: 'LangGraph 引擎',
            placeholder: '0',
            hint: '0 Pipeline Engine，1 LangGraph。',
            options: [
              { value: '0', label: 'Pipeline' },
              { value: '1', label: 'LangGraph' },
            ],
          },
          {
            key: 'rag_strategy',
            label: 'RAG 策略',
            placeholder: 'baseline',
            hint: 'baseline / agentic / plan-execute / react / auto。',
            options: [
              { value: 'baseline', label: 'baseline' },
              { value: 'agentic', label: 'agentic' },
              { value: 'plan-execute', label: 'plan-execute' },
              { value: 'react', label: 'react' },
              { value: 'auto', label: 'auto' },
            ],
          },
          {
            key: 'agentic_max_steps',
            label: '最大搜尋輪數',
            placeholder: '3',
            hint: 'Agentic loop 額外搜尋輪數。',
          },
          {
            key: 'agentic_min_docs_to_answer',
            label: '提前結束文件數',
            placeholder: '3',
            hint: '累積文件超過此數提前結束。',
          },
        ],
      },
    ],
  },
  {
    id: 'plan_execute',
    label: 'Plan & Execute',
    sections: [
      {
        title: 'Plan-and-Execute / ReAct',
        desc: '子任務規劃、超時、adaptive replan 與 ReAct 預算。',
        fields: [
          {
            key: 'plan_execute_max_steps',
            label: '最大子任務數',
            placeholder: '4',
            hint: '規劃階段最多子任務。',
          },
          {
            key: 'plan_execute_min_entities',
            label: 'Auto 最低實體數',
            placeholder: '2',
            hint: '子任務過少時降級。',
          },
          {
            key: 'planning_timeout_ms',
            label: '規劃超時',
            placeholder: '8000',
            hint: 'Planning LLM 超時。',
          },
          {
            key: 'plan_step_timeout_ms',
            label: '子任務超時',
            placeholder: '5000',
            hint: '每個子任務搜尋超時。',
          },
          {
            key: 'synthesis_timeout_ms',
            label: '合成超時',
            placeholder: '8000',
            hint: 'Synthesis LLM 超時。',
          },
          {
            key: 'adaptive_plan_enabled',
            label: 'Adaptive Replan',
            placeholder: '1',
            hint: '0 停用，1 啟用。',
            options: [
              { value: '0', label: '停用' },
              { value: '1', label: '啟用' },
            ],
          },
          {
            key: 'react_max_turns',
            label: 'ReAct 最大 Turn',
            placeholder: '3',
            hint: 'ReAct loop 最大 LLM 呼叫輪數。',
          },
          {
            key: 'react_token_budget',
            label: 'ReAct Token 預算',
            placeholder: '8000',
            hint: '累計 token 上限。',
          },
          {
            key: 'react_usd_to_twd',
            label: 'USD/TWD 匯率',
            placeholder: '32.0',
            hint: '成本換算匯率。',
          },
          {
            key: 'react_models',
            label: 'ReAct 模型配置 JSON',
            placeholder: '{"orchestrator":{"provider":"workers-ai","model":"..."}}',
            hint: 'ModelMap JSON。',
            multiline: true,
          },
        ],
      },
    ],
  },
  {
    id: 'timeout',
    label: '超時與熔斷',
    sections: [
      {
        title: '超時與熔斷',
        desc: '各階段超時與 circuit breaker。',
        fields: [
          {
            key: 'pipeline_timeout_ms',
            label: 'Pipeline 整體超時',
            placeholder: '40000',
            hint: '整個 pipeline 最大執行時間。',
          },
          {
            key: 'embedding_timeout_ms',
            label: 'Embedding 超時',
            placeholder: '3000',
            hint: '超時降級為 BM25。',
          },
          {
            key: 'search_timeout_ms',
            label: '搜尋超時',
            placeholder: '4000',
            hint: 'Hybrid Search 超時。',
          },
          {
            key: 'generation_timeout_ms',
            label: '生成超時',
            placeholder: '18000',
            hint: 'LLM 回答生成超時。',
          },
          {
            key: 'hyde_timeout_ms',
            label: 'HyDE 超時',
            placeholder: '5000',
            hint: 'HyDE 生成超時。',
          },
          {
            key: 'multi_query_timeout_ms',
            label: 'Multi-Query 超時',
            placeholder: '5000',
            hint: 'Multi-query 擴展超時。',
          },
          {
            key: 'circuit_breaker_threshold',
            label: '熔斷觸發次數',
            placeholder: '5',
            hint: '連續失敗幾次後熔斷。',
          },
          {
            key: 'circuit_breaker_reset_ms',
            label: '冷卻時間',
            placeholder: '30000',
            hint: 'Open 狀態冷卻時間。',
          },
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
        desc: '多行輸入會儲存為 JSON array。',
        fields: [
          {
            key: 'max_output_length',
            label: '輸出最大字元數',
            placeholder: '3000',
            hint: '超過字數自動截斷。',
          },
          {
            key: 'prompt_injection_keywords',
            label: 'Prompt Injection 關鍵字',
            placeholder: 'ignore previous instructions',
            hint: '一行一個關鍵字。',
            multiline: true,
          },
          {
            key: 'jailbreak_patterns',
            label: 'Jailbreak 模式',
            placeholder: 'developer mode',
            hint: '一行一個模式。',
            multiline: true,
          },
          {
            key: 'system_prompt_leakage_patterns',
            label: 'System Prompt 洩漏模式',
            placeholder: 'system prompt',
            hint: '一行一個模式。',
            multiline: true,
          },
          {
            key: 'input_blocklist',
            label: '自訂黑名單',
            placeholder: '禁止詞',
            hint: '一行一個封鎖詞。',
            multiline: true,
          },
        ],
      },
    ],
  },
]

function getTabKeys(tab: TabConfig) {
  return tab.sections.flatMap((section) => section.fields.map((field) => field.key))
}

function parseTagText(value: string) {
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.join('\n')
  } catch {
    return value
  }
  return value
}

function serializeTagText(value: string) {
  return JSON.stringify(
    value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
  )
}

function ConfigPanel({ tab, config }: { tab: TabConfig; config: Record<string, string> }) {
  const updateConfig = useUpdateAIConfig()
  const [values, setValues] = useState<Record<string, string>>({})

  useEffect(() => {
    const initial: Record<string, string> = {}
    for (const key of getTabKeys(tab)) {
      const current = config[key] ?? ''
      initial[key] =
        tab.id === 'guardrails' && key !== 'max_output_length' ? parseTagText(current) : current
    }
    setValues(initial)
  }, [config, tab])

  const handleSave = useCallback(async () => {
    const payload: Record<string, string> = {}
    for (const section of tab.sections) {
      for (const field of section.fields) {
        const value = values[field.key] ?? ''
        payload[field.key] =
          tab.id === 'guardrails' && field.key !== 'max_output_length'
            ? serializeTagText(value)
            : value
      }
    }
    await updateConfig.mutateAsync(payload)
    Alert.alert('已儲存', `${tab.label} 設定已更新。`)
  }, [tab, updateConfig, values])

  return (
    <View style={styles.panel}>
      {tab.sections.map((section) => (
        <View key={section.title} style={styles.card}>
          <Text variant="bodyBold">{section.title}</Text>
          <Text variant="caption" color="textSubtle" style={styles.sectionDesc}>
            {section.desc}
          </Text>
          {section.fields.map((field) => (
            <View key={field.key} style={styles.field}>
              <Text variant="caption" fontWeight="600">
                {field.label}
              </Text>
              <Text variant="caption" color="textMuted">
                {field.hint}
              </Text>
              {field.options ? (
                <View style={styles.optionRow}>
                  {field.options.map((option) => (
                    <Pressable
                      key={option.value}
                      style={[
                        styles.optionButton,
                        (values[field.key] || field.placeholder) === option.value &&
                          styles.optionButtonActive,
                      ]}
                      onPress={() =>
                        setValues((current) => ({ ...current, [field.key]: option.value }))
                      }
                    >
                      <Text
                        variant="caption"
                        fontWeight="600"
                        style={
                          (values[field.key] || field.placeholder) === option.value
                            ? styles.optionTextActive
                            : styles.optionText
                        }
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <TextInput
                  value={values[field.key] ?? ''}
                  onChangeText={(text) =>
                    setValues((current) => ({ ...current, [field.key]: text }))
                  }
                  placeholder={field.placeholder}
                  placeholderTextColor={SEMANTIC_COLORS.textMuted}
                  multiline={field.multiline}
                  textAlignVertical={field.multiline ? 'top' : 'center'}
                  style={[styles.input, field.multiline && styles.multilineInput]}
                />
              )}
              <Text variant="caption" color="textMuted" style={styles.configKey}>
                {field.key}
              </Text>
            </View>
          ))}
        </View>
      ))}
      <Button
        variant="primary"
        leftIcon={updateConfig.isPending ? undefined : Save}
        loading={updateConfig.isPending}
        disabled={updateConfig.isPending}
        onPress={handleSave}
      >
        儲存設定
      </Button>
    </View>
  )
}

function PipelinePanel() {
  const stepsQuery = usePipelineSteps()
  const updateSteps = useUpdatePipelineSteps()
  const [steps, setSteps] = useState<PipelineStepInfo[]>([])

  useEffect(() => {
    if (stepsQuery.data) setSteps([...stepsQuery.data].sort((a, b) => a.order - b.order))
  }, [stepsQuery.data])

  const grouped = useMemo(() => {
    const phases: PipelineStepInfo['phase'][] = [
      'pre-retrieval',
      'retrieval',
      'post-retrieval',
      'generation',
      'evaluation',
    ]
    return phases.map((phase) => ({
      phase,
      steps: steps.filter((step) => step.phase === phase).sort((a, b) => a.order - b.order),
    }))
  }, [steps])

  const toggleStep = useCallback((id: string) => {
    setSteps((current) =>
      current.map((step) => (step.id === id ? { ...step, enabled: !step.enabled } : step))
    )
  }, [])

  const moveStep = useCallback((id: string, direction: -1 | 1) => {
    setSteps((current) => {
      const step = current.find((item) => item.id === id)
      if (!step) return current
      const samePhase = current
        .filter((item) => item.phase === step.phase)
        .sort((a, b) => a.order - b.order)
      const index = samePhase.findIndex((item) => item.id === id)
      const target = samePhase[index + direction]
      if (!target) return current
      return current.map((item) => {
        if (item.id === step.id) return { ...item, order: target.order }
        if (item.id === target.id) return { ...item, order: step.order }
        return item
      })
    })
  }, [])

  const handleSave = useCallback(async () => {
    await updateSteps.mutateAsync(
      steps.map((step) => ({ id: step.id, enabled: step.enabled, order: step.order }))
    )
    Alert.alert('已儲存', 'Pipeline steps 已更新。')
  }, [steps, updateSteps])

  if (stepsQuery.isLoading) return <LoadingSpinner size="large" style={styles.loading} />
  if (stepsQuery.error) {
    return (
      <EmptyState
        icon={ListChecks}
        title="無法載入 Pipeline"
        description="請稍後重試。"
        actionLabel="重新載入"
        onAction={() => stepsQuery.refetch()}
        style={styles.stateCard}
      />
    )
  }

  return (
    <View style={styles.panel}>
      {grouped.map(({ phase, steps: phaseSteps }) => (
        <View key={phase} style={styles.card}>
          <Text variant="bodyBold">{phase}</Text>
          <Text variant="caption" color="textSubtle" style={styles.sectionDesc}>
            {phaseSteps.length} steps
          </Text>
          {phaseSteps.map((step, index) => (
            <View key={step.id} style={styles.stepItem}>
              <View style={styles.stepText}>
                <Text variant="bodyBold" numberOfLines={1}>
                  {step.name}
                </Text>
                <Text variant="caption" color="textMuted" numberOfLines={2}>
                  {step.description}
                </Text>
                <Text variant="caption" color="textMuted">
                  {step.id}
                </Text>
              </View>
              <View style={styles.stepControls}>
                <Switch value={step.enabled} onValueChange={() => toggleStep(step.id)} />
                <View style={styles.moveRow}>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={index === 0}
                    onPress={() => moveStep(step.id, -1)}
                  >
                    上
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={index === phaseSteps.length - 1}
                    onPress={() => moveStep(step.id, 1)}
                  >
                    下
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </View>
      ))}
      <Button
        variant="primary"
        leftIcon={updateSteps.isPending ? undefined : Save}
        loading={updateSteps.isPending}
        disabled={updateSteps.isPending}
        onPress={handleSave}
      >
        儲存 Pipeline
      </Button>
    </View>
  )
}

function parseProviders(config: Record<string, string>) {
  try {
    const parsed = JSON.parse(config.cost_providers ?? '')
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as CostProvider[]
  } catch {
    /* defaults */
  }
  return DEFAULT_COST_PROVIDERS
}

function CostPanel({ config }: { config: Record<string, string> }) {
  const updateConfig = useUpdateAIConfig()
  const [providers, setProviders] = useState<CostProvider[]>([])

  useEffect(() => {
    setProviders(parseProviders(config))
  }, [config])

  const updateProvider = (index: number, patch: Partial<CostProvider>) => {
    setProviders((current) =>
      current.map((provider, currentIndex) =>
        currentIndex === index ? { ...provider, ...patch } : provider
      )
    )
  }

  const handleSave = useCallback(async () => {
    await updateConfig.mutateAsync({ cost_providers: JSON.stringify(providers) })
    Alert.alert('已儲存', '成本 provider 設定已更新。')
  }, [providers, updateConfig])

  return (
    <View style={styles.panel}>
      <View style={styles.card}>
        <Text variant="bodyBold">LLM 供應商費用</Text>
        <Text variant="caption" color="textSubtle" style={styles.sectionDesc}>
          每百萬 token 的輸入/輸出費用，供成本頁與 log detail 使用。
        </Text>
        {providers.map((provider, index) => (
          <View key={`${provider.id}-${index}`} style={styles.providerItem}>
            <TextInput
              value={provider.name}
              onChangeText={(text) => updateProvider(index, { name: text })}
              style={styles.input}
              placeholder="名稱"
            />
            <View style={styles.providerPrices}>
              <TextInput
                value={String(provider.input_per_1m)}
                onChangeText={(text) => updateProvider(index, { input_per_1m: Number(text) || 0 })}
                style={[styles.input, styles.priceInput]}
                keyboardType="decimal-pad"
                placeholder="Input"
              />
              <TextInput
                value={String(provider.output_per_1m)}
                onChangeText={(text) => updateProvider(index, { output_per_1m: Number(text) || 0 })}
                style={[styles.input, styles.priceInput]}
                keyboardType="decimal-pad"
                placeholder="Output"
              />
              <Pressable
                style={styles.deleteButton}
                onPress={() => setProviders((current) => current.filter((_, i) => i !== index))}
              >
                <Trash2 size={18} color="#DC2626" />
              </Pressable>
            </View>
          </View>
        ))}
        <Button
          variant="outline"
          leftIcon={Plus}
          onPress={() =>
            setProviders((current) => [
              ...current,
              {
                id: `custom-${Date.now()}`,
                name: 'Custom Provider',
                input_per_1m: 0,
                output_per_1m: 0,
              },
            ])
          }
        >
          新增供應商
        </Button>
      </View>
      <Button
        variant="primary"
        leftIcon={updateConfig.isPending ? undefined : Save}
        loading={updateConfig.isPending}
        disabled={updateConfig.isPending}
        onPress={handleSave}
      >
        儲存費用設定
      </Button>
    </View>
  )
}

export default function AdminAISettingsScreen() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [activeTab, setActiveTab] = useState<TabType>('models')
  const [refreshing, setRefreshing] = useState(false)
  const isAdmin = user?.role === 'admin' || user?.role === 'moderator'
  const configQuery = useAIConfig()
  const activeConfig = configTabs.find((tab) => tab.id === activeTab)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await configQuery.refetch()
    setRefreshing(false)
  }, [configQuery])

  if (!isAuthenticated || !isAdmin) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.navbar}>
          <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
            返回
          </Button>
        </View>
        <EmptyState
          icon={Settings}
          title="需要管理員權限"
          description="請使用具備管理權限的帳號登入。"
          actionLabel="回到 AI 管理"
          onAction={() => router.replace('/admin/ai' as never)}
          style={styles.fullState}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.navbar}>
        <Button variant="ghost" size="sm" leftIcon={ArrowLeft} onPress={() => router.back()}>
          返回
        </Button>
        <View style={styles.navTitle}>
          <Settings size={18} color={SEMANTIC_COLORS.textMain} />
          <Text variant="h4" fontWeight="600">
            AI 設定
          </Text>
        </View>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={RefreshCw}
          onPress={handleRefresh}
          loading={refreshing}
          style={styles.refreshButton}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text variant="h2" fontWeight="700">
            AI Pipeline 設定
          </Text>
          <Text variant="body" color="textSubtle">
            所有參數儲存後立即生效，每個分頁獨立儲存。
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <View style={styles.tabs}>
            {tabs.map((tab) => (
              <Pressable
                key={tab.id}
                style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text
                  variant="caption"
                  fontWeight="600"
                  style={activeTab === tab.id ? styles.tabTextActive : styles.tabText}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {configQuery.isLoading ? (
          <LoadingSpinner size="large" style={styles.loading} />
        ) : configQuery.error || !configQuery.data ? (
          <EmptyState
            icon={AlertCircle}
            title="無法載入 AI 設定"
            description="請稍後重試，或確認帳號權限是否仍有效。"
            actionLabel="重新載入"
            onAction={handleRefresh}
            style={styles.stateCard}
          />
        ) : activeTab === 'pipeline' ? (
          <PipelinePanel />
        ) : activeTab === 'cost' ? (
          <CostPanel config={configQuery.data} />
        ) : activeConfig ? (
          <ConfigPanel tab={activeConfig} config={configQuery.data} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SEMANTIC_COLORS.pageBg },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: WB_COLORS[20],
  },
  navTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  refreshButton: { minWidth: 44 },
  scrollView: { flex: 1 },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xxl },
  header: { gap: 6, marginBottom: SPACING.lg },
  fullState: { flex: 1 },
  loading: { paddingVertical: 80 },
  stateCard: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  tabsScroll: { marginBottom: SPACING.lg },
  tabs: { flexDirection: 'row', gap: SPACING.sm, paddingRight: SPACING.md },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
  },
  tabButtonActive: { backgroundColor: SEMANTIC_COLORS.textMain },
  tabText: { color: SEMANTIC_COLORS.textSubtle },
  tabTextActive: { color: WB_COLORS[0] },
  panel: { gap: SPACING.lg },
  card: {
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  sectionDesc: { marginTop: -SPACING.xs },
  field: { gap: 6 },
  input: {
    minHeight: 44,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
    color: SEMANTIC_COLORS.textMain,
    backgroundColor: WB_COLORS[0],
  },
  multilineInput: { minHeight: 120 },
  configKey: { fontFamily: 'monospace' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  optionButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[10],
  },
  optionButtonActive: { backgroundColor: SEMANTIC_COLORS.textMain },
  optionText: { color: SEMANTIC_COLORS.textSubtle },
  optionTextActive: { color: WB_COLORS[0] },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: WB_COLORS[20],
  },
  stepText: { flex: 1 },
  stepControls: { alignItems: 'flex-end', gap: SPACING.sm },
  moveRow: { flexDirection: 'row', gap: 6 },
  providerItem: { gap: SPACING.sm, paddingVertical: SPACING.sm },
  providerPrices: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  priceInput: { flex: 1 },
  deleteButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    backgroundColor: '#FEF2F2',
  },
})
