'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, CheckCircle } from 'lucide-react'
import { useAIConfig, useUpdateAIConfig } from '@/lib/api/admin-ai'

const CONFIG_FIELDS = [
  {
    section: '模型設定',
    desc: '選擇用於生成回答和建立向量的 AI 模型',
    fields: [
      {
        key: 'llm_model',
        label: 'LLM 模型',
        placeholder: '@cf/meta/llama-3.1-8b-instruct',
        hint: '用於生成自然語言回答',
      },
      {
        key: 'embedding_model',
        label: 'Embedding 模型',
        placeholder: '@cf/baai/bge-m3',
        hint: '用於將文字轉為向量，更換後需重新索引',
      },
      {
        key: 'search_limit',
        label: '搜尋結果數',
        placeholder: '5',
        hint: 'RAG 取回的參考文件數量（1–20）',
      },
    ],
  },
  {
    section: '快取設定',
    desc: '相同查詢的結果快取設定，減少重複呼叫 LLM',
    fields: [
      {
        key: 'cache_ttl',
        label: '快取 TTL（秒）',
        placeholder: '3600',
        hint: '預設 1 小時（3600 秒）',
      },
    ],
  },
  {
    section: '速率限制',
    desc: '防止濫用的請求頻率上限設定',
    fields: [
      {
        key: 'rate_limit_per_minute',
        label: '每分鐘請求上限',
        placeholder: '10',
        hint: '單一 IP 每分鐘可呼叫次數',
      },
      {
        key: 'rate_limit_per_day',
        label: '每日請求上限',
        placeholder: '100',
        hint: '單一 IP 每日可呼叫次數',
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
        <h1 className="text-xl font-bold text-wb-100">AI 設定</h1>
        <p className="mt-1 text-sm text-wb-60">設定模型、快取和速率限制參數</p>
      </div>

      {CONFIG_FIELDS.map((section) => (
        <div key={section.section} className="rounded-xl border border-wb-20 bg-white overflow-hidden">
          {/* 區塊標題 */}
          <div className="border-b border-wb-10 px-5 py-4">
            <h2 className="text-sm font-semibold text-wb-100">{section.section}</h2>
            <p className="mt-0.5 text-xs text-wb-50">{section.desc}</p>
          </div>

          {/* 欄位列表 */}
          <div className="divide-y divide-wb-10">
            {section.fields.map((field) => (
              <div key={field.key} className="flex items-start gap-6 px-5 py-4">
                <div className="w-36 shrink-0 pt-1.5">
                  <label className="text-sm font-medium text-wb-80">{field.label}</label>
                  <p className="mt-0.5 text-xs text-wb-50 leading-snug">{field.hint}</p>
                </div>
                <div className="flex-1">
                  <input
                    value={values[field.key] ?? ''}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-wb-20 bg-white px-3 py-2 text-sm text-wb-100 placeholder:text-wb-40 outline-none focus:border-wb-50 focus:ring-1 focus:ring-wb-50 transition-colors"
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
