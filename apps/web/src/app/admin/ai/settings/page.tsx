'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, CheckCircle } from 'lucide-react'
import { useAIConfig, useUpdateAIConfig } from '@/lib/api/admin-ai'

const CONFIG_FIELDS = [
  {
    section: '模型設定',
    desc: '各 pipeline 階段使用的 AI 模型，更換後立即生效（無需重啟）',
    fields: [
      {
        key: 'llm_model',
        label: '複雜查詢模型',
        placeholder: '@cf/google/gemma-3-12b-it',
        hint: '用於 complex 查詢的主力生成模型（Stage 6 LLM C）',
      },
      {
        key: 'simple_model',
        label: '簡單查詢模型',
        placeholder: '@cf/meta/llama-3.1-8b-instruct',
        hint: '用於 simple 查詢的輕量生成模型，速度較快',
      },
      {
        key: 'lightweight_model',
        label: '輕量模型',
        placeholder: '@cf/meta/llama-3.1-8b-instruct',
        hint: '用於 Judge 品質評判 + 通識回答（general-knowledge 路徑）',
      },
      {
        key: 'embedding_model',
        label: 'Embedding 模型',
        placeholder: '@cf/baai/bge-m3',
        hint: '將文字轉為向量，更換後需重新索引所有文件',
      },
    ],
  },
  {
    section: '搜尋與檢索',
    desc: 'Vectorize 向量搜尋候選數量與最終回傳文件數的設定',
    fields: [
      {
        key: 'max_results',
        label: '最終文件數',
        placeholder: '5',
        hint: 'MMR 多樣性選取後傳給 LLM 的文件數（1–20）。此為主要「搜尋結果數」設定',
      },
      {
        key: 'merge_top_k',
        label: 'Vectorize 候選池',
        placeholder: '10',
        hint: 'RRF 合併前每路 Vectorize 搜尋的候選數（5–50）。多岩場查詢自動 ×2',
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
        hint: '主力生成（LLM C）與 self-reflection 重生成的 max_tokens（200–2000）',
      },
      {
        key: 'max_tokens_gk',
        label: '通識最大 Tokens',
        placeholder: '600',
        hint: 'general-knowledge 路徑（不走 RAG）的 max_tokens（200–2000）',
      },
    ],
  },
  {
    section: '快取設定',
    desc: '相同查詢的結果快取，減少重複呼叫 LLM',
    fields: [
      {
        key: 'cache_ttl',
        label: '快取 TTL（秒）',
        placeholder: '3600',
        hint: '預設 1 小時（3600 秒），最小 60 秒',
      },
    ],
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
        <p className="mt-1 text-sm text-wb-60">設定各階段模型、搜尋參數、token 限制與快取策略，儲存後立即生效</p>
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
                  <p className="mt-1 font-mono text-[10px] text-wb-30">{field.key}</p>
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
