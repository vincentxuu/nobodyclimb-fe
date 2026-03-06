'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, CheckCircle } from 'lucide-react'
import { useAIConfig, useUpdateAIConfig } from '@/lib/api/admin-ai'

/** 將 JSON array 字串轉為每行一個關鍵字（顯示用） */
function blocklistToLines(json: string): string {
  try {
    const arr = JSON.parse(json) as string[]
    return arr.join('\n')
  } catch {
    return ''
  }
}

/** 將每行一個關鍵字轉為 JSON array 字串（儲存用） */
function linesToBlocklist(text: string): string {
  const arr = text.split('\n').map((s) => s.trim()).filter(Boolean)
  return JSON.stringify(arr)
}

const CONFIG_FIELDS = [
  {
    section: '模型設定',
    desc: '各 pipeline 階段使用的 AI 模型，更換後立即生效',
    fields: [
      {
        key: 'llm_model',
        label: '複雜查詢模型',
        placeholder: '@cf/google/gemma-3-12b-it',
        hint: 'complex queryType 的主力生成模型（Stage 6 LLM C）',
      },
      {
        key: 'simple_model',
        label: '簡單查詢模型',
        placeholder: '@cf/meta/llama-3.1-8b-instruct',
        hint: 'simple queryType 的輕量生成模型，速度較快',
      },
      {
        key: 'lightweight_model',
        label: '輕量模型',
        placeholder: '@cf/meta/llama-3.1-8b-instruct',
        hint: 'Judge 品質評判 + 通識回答（general-knowledge 路徑）使用',
      },
      {
        key: 'embedding_model',
        label: 'Embedding 模型',
        placeholder: '@cf/baai/bge-m3',
        hint: '文字轉向量模型，更換後需重新索引所有文件',
      },
      {
        key: 'contextual_rag_model',
        label: 'Contextual RAG 模型',
        placeholder: '@cf/meta/llama-3.1-8b-instruct',
        hint: '索引時生成語意摘要（Contextual RAG）使用的輕量 LLM，不影響查詢路徑',
      },
    ],
  },
  {
    section: '搜尋與檢索',
    desc: 'Vectorize 候選池大小、RRF 合併門檻、最終傳給 LLM 的文件數',
    fields: [
      {
        key: 'max_results',
        label: '最終文件數',
        placeholder: '5',
        hint: 'MMR 選取後傳給 LLM C 的文件數（1–20）',
      },
      {
        key: 'merge_top_k',
        label: 'Vectorize 候選池',
        placeholder: '10',
        hint: '每路 Vectorize 搜尋候選數（5–50），多岩場查詢自動 ×2',
      },
      {
        key: 'bm25_top_k',
        label: 'BM25 候選數',
        placeholder: '10',
        hint: 'BM25 全文搜尋（FTS5）每次回傳的候選文件數（5–50），與向量路一同 RRF 合併',
      },
      {
        key: 'multi_query_count',
        label: 'Multi-Query 子查詢數',
        placeholder: '3',
        hint: 'Complex 查詢擴展為 N 個角度的子查詢（1–5），各自向量搜尋後 RRF 合併',
      },
      {
        key: 'min_rrf_score',
        label: 'RRF 門檻（無 filter）',
        placeholder: '0.005',
        hint: '無 metadata filter 時過濾低分文件，越低 recall 越高（0–1）',
      },
      {
        key: 'min_rrf_score_filtered',
        label: 'RRF 門檻（有 filter）',
        placeholder: '0.002',
        hint: '有 grade/crag filter 時放寬門檻，因 metadata 已保障相關性',
      },
      {
        key: 'min_vector_score',
        label: 'Vector Score 門檻',
        placeholder: '0.5',
        hint: '/ai/search 純語義搜尋端點的向量相似度門檻（0–1，越高結果越精準但數量越少）',
      },
    ],
  },
  {
    section: '排名與多樣性',
    desc: 'MMR 多樣性、Cross-encoder 與熱門度加權比例',
    fields: [
      {
        key: 'mmr_lambda',
        label: 'MMR Lambda',
        placeholder: '0.6',
        hint: 'λ 越高越重視相關性，越低結果越多樣（0.0–1.0，建議 0.5–0.7）',
      },
      {
        key: 'reranker_weight',
        label: 'Cross-encoder 權重',
        placeholder: '0.7',
        hint: '兩者自動歸一化，total = reranker + popularity；比例越高，cross-encoder 分數佔比越大',
      },
      {
        key: 'popularity_weight',
        label: '熱門度權重',
        placeholder: '0.3',
        hint: '依路線影片數量加權，兩者自動歸一化，無需與 reranker_weight 合計恰好為 1',
      },
    ],
  },
  {
    section: 'Token 限制',
    desc: '各 LLM 呼叫的最大輸出 token 數，影響回答長度與費用',
    fields: [
      {
        key: 'max_tokens_generation',
        label: '生成最大 Tokens',
        placeholder: '800',
        hint: '主力生成（LLM C）與 self-reflection 重生成（200–2000）',
      },
      {
        key: 'max_tokens_gk',
        label: '通識最大 Tokens',
        placeholder: '600',
        hint: 'general-knowledge 路徑（不走 RAG）的 max_tokens（200–2000）',
      },
      {
        key: 'high_consumption_threshold',
        label: '高消耗門檻（tokens）',
        placeholder: '1000',
        hint: '超過此 token 數時日誌標記 is_high_consumption，供監控告警',
      },
    ],
  },
  {
    section: '品質閾值',
    desc: 'Groundedness 分數決定免責聲明與自動送審的觸發條件',
    fields: [
      {
        key: 'groundedness_disclaimer_low',
        label: '❓ 強警示閾值',
        placeholder: '0.6',
        hint: 'Groundedness 低於此值時，在回答前注入 ❓ 強警示（0–1）',
      },
      {
        key: 'groundedness_disclaimer_mid',
        label: '⚠️ 輕警示閾值',
        placeholder: '0.8',
        hint: 'Groundedness 低於此值時，在回答前注入 ⚠️ 提醒（應大於強警示閾值）',
      },
      {
        key: 'groundedness_flag_threshold',
        label: '自動送審閾值',
        placeholder: '0.5',
        hint: 'Groundedness 低於此值時自動寫入 ai_flagged_responses 待人工審核',
      },
    ],
  },
  {
    section: 'Judge 設定',
    desc: '品質評判 LLM 的逾時、context 截斷，以及 Judge 驅動重生成的觸發條件',
    fields: [
      {
        key: 'judge_timeout_ms',
        label: 'Judge 逾時（ms）',
        placeholder: '8000',
        hint: 'Judge LLM 呼叫逾時上限，超時則跳過評分繼續回答（1000–30000）',
      },
      {
        key: 'judge_context_truncate',
        label: 'Context 截斷（字）',
        placeholder: '800',
        hint: '傳給 Judge LLM 的 context 最大字元數（200–3000）',
      },
      {
        key: 'judge_regen_quality_max',
        label: '重生成觸發門檻',
        placeholder: '2',
        hint: 'Judge quality 等於或低於此值時觸發重生成（1=很差、2=差、3=好、4=優；建議設 2）',
      },
    ],
  },
  {
    section: 'Self-Reflection 設定',
    desc: '重生成的最小回答長度門檻（Judge 驅動重生成與串流模式均參考此值）',
    fields: [
      {
        key: 'self_reflection_min_length',
        label: '最小觸發長度（字）',
        placeholder: '50',
        hint: '回答字元數低於此值時跳過 self-reflection（太短無意義評估）（10–500）',
      },
    ],
  },
  {
    section: '對話與快取',
    desc: '多輪對話歷史深度與 KV 快取存活時間',
    fields: [
      {
        key: 'chat_history_depth',
        label: '對話歷史深度（則）',
        placeholder: '6',
        hint: '帶入 LLM 的最近對話訊息數（1 輪 = 2 則，預設 3 輪 = 6 則）（2–20）',
      },
      {
        key: 'assistant_history_truncate',
        label: 'Assistant 歷史截斷（字）',
        placeholder: '500',
        hint: '歷史 assistant 訊息傳入 LLM 前的截斷長度，避免占用過多 context window（100–2000）',
      },
      {
        key: 'cache_ttl',
        label: '快取 TTL（秒）',
        placeholder: '3600',
        hint: '相同查詢的 KV 快取存活時間，預設 1 小時（60–86400）',
      },
    ],
  },
  {
    section: '語義快取',
    desc: '使用向量相似度對語意相近的問題命中快取，跳過完整 RAG pipeline（僅匿名且無對話歷史）',
    fields: [
      {
        key: 'semantic_cache_enabled',
        label: '啟用語義快取',
        placeholder: '0',
        hint: '0 = 停用，1 = 啟用；建議先在測試環境驗證命中率再開啟',
      },
      {
        key: 'semantic_cache_threshold',
        label: '相似度門檻',
        placeholder: '0.95',
        hint: 'Cosine similarity 高於此值視為相同問題（0.80–1.00，建議 0.90–0.95）',
      },
    ],
  },
  {
    section: 'Agentic 模式',
    desc: '多輪動態搜尋模式，讓 LLM 自主決定是否需要補充搜尋；僅對 complex 查詢生效，成本顯著較高',
    fields: [
      {
        key: 'rag_strategy',
        label: 'RAG 策略',
        placeholder: 'baseline',
        hint: 'baseline = 現行單輪搜尋；agentic = 多輪動態搜尋（complex 查詢）',
      },
      {
        key: 'agentic_max_steps',
        label: '最大搜尋輪數',
        placeholder: '3',
        hint: 'Agentic loop 最多執行幾次額外搜尋（1–5），每輪 +0.5–1s 延遲',
      },
      {
        key: 'agentic_min_docs_to_answer',
        label: '提前結束文件數',
        placeholder: '3',
        hint: '累積超過此數量的文件後提前結束迴圈，不等到 max_steps（1–10）',
      },
    ],
  },
  {
    section: '防護設定',
    desc: '輸出截斷上限（超過字元數自動截斷），其他規則由下方自訂黑名單管理',
    fields: [
      {
        key: 'max_output_length',
        label: '輸出最大字元數',
        placeholder: '3000',
        hint: '回應超過此字元數時自動截斷並提示（500–10000，預設 3000）',
      },
    ],
  },
]

const GUARDRAIL_LISTS = [
  {
    key: 'prompt_injection_keywords',
    label: '輸入防護：Prompt Injection 關鍵字',
    desc: '含有這些關鍵字的輸入會被拒絕（不分大小寫）。每行一個關鍵字，儲存後立即生效',
    rows: 10,
    placeholder: 'ignore previous instructions\njailbreak\ndan mode',
  },
  {
    key: 'jailbreak_patterns',
    label: '輸入防護：Jailbreak 模式',
    desc: '用於偵測角色扮演、繞過限制等越獄嘗試（不分大小寫）。每行一個模式',
    rows: 8,
    placeholder: 'act as \nroleplay as\n扮演\n假裝你是',
  },
  {
    key: 'system_prompt_leakage_patterns',
    label: '輸出防護：System Prompt 洩漏模式',
    desc: '輸出包含這些模式時視為 system prompt 洩漏，整段回答會替換為錯誤訊息（不分大小寫）',
    rows: 6,
    placeholder: 'SYSTEM_PROMPT\nYou are a climbing assistant\n你是攀岩助理',
  },
  {
    key: 'input_blocklist',
    label: '輸入防護：自訂黑名單',
    desc: '補充上方規則的自訂封鎖詞，適合加入特定業務需求的禁止詞彙（不分大小寫）',
    rows: 6,
    placeholder: '（選填）\n投資建議\n色情',
  },
]

export default function AdminAISettingsPage() {
  const { data: config, isLoading } = useAIConfig()
  const { mutate: updateConfig, isPending } = useUpdateAIConfig()
  const [values, setValues] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (config) setValues(config)
  }, [config])

  const handleSave = () => {
    updateConfig(values, {
      onSuccess: () => {
        setSaved(true)
        setTimeout(() => setSaved(false), 2500)
      },
    })
  }

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
        <p className="mt-1 text-sm text-wb-60">所有參數儲存後立即生效（無需重啟），每欄位下方顯示對應的 config key</p>
      </div>

      {CONFIG_FIELDS.map((section) => (
        <div key={section.section} className="rounded-xl border border-wb-20 bg-white overflow-hidden">
          <div className="border-b border-wb-10 px-5 py-4">
            <h2 className="text-sm font-semibold text-wb-100">{section.section}</h2>
            <p className="mt-0.5 text-xs text-wb-50">{section.desc}</p>
          </div>

          <div className="divide-y divide-wb-10">
            {section.fields.map((field) => (
              <div key={field.key} className="flex items-start gap-6 px-5 py-4">
                <div className="w-40 shrink-0 pt-1.5">
                  <label className="text-sm font-medium text-wb-80">{field.label}</label>
                  <p className="mt-0.5 text-xs text-wb-50 leading-snug">{field.hint}</p>
                  <p className="mt-1.5 font-mono text-[10px] text-wb-30 bg-wb-5 rounded px-1 py-0.5 inline-block">{field.key}</p>
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

      {/* 防護清單管理：每行一個關鍵字，儲存為 JSON array */}
      {GUARDRAIL_LISTS.map((list) => {
        const count = (() => { try { return (JSON.parse(values[list.key] ?? '[]') as string[]).length } catch { return 0 } })()
        return (
          <div key={list.key} className="rounded-xl border border-wb-20 bg-white overflow-hidden">
            <div className="border-b border-wb-10 px-5 py-4">
              <h2 className="text-sm font-semibold text-wb-100">{list.label}</h2>
              <p className="mt-0.5 text-xs text-wb-50">{list.desc}</p>
            </div>
            <div className="px-5 py-4">
              <textarea
                rows={list.rows}
                value={blocklistToLines(values[list.key] ?? '[]')}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [list.key]: linesToBlocklist(e.target.value) }))
                }
                placeholder={list.placeholder}
                className="w-full rounded-lg border border-wb-20 bg-white px-3 py-2 text-sm text-wb-100 placeholder:text-wb-40 outline-none focus:border-wb-50 focus:ring-1 focus:ring-wb-50 transition-colors font-mono resize-y"
              />
              <div className="mt-2 flex items-center gap-3">
                <p className="font-mono text-[10px] text-wb-30 bg-wb-5 rounded px-1 py-0.5 inline-block">{list.key}</p>
                <p className="text-xs text-wb-40">目前共 <span className="font-semibold text-wb-80">{count}</span> 個</p>
              </div>
            </div>
          </div>
        )
      })}

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
