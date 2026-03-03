'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import { useAIPrompt, useUpdateAIPrompt, createAIPrompt } from '@/lib/api/admin-ai'

const STATUS_OPTIONS = [
  { value: 'draft', label: '草稿' },
  { value: 'active', label: '啟用（正式環境）' },
  { value: 'archived', label: '封存' },
]

export default function AdminAIPromptEditorPage({
  params,
}: {
  params: Promise<{ promptId: string }>
}) {
  const { promptId } = use(params)
  const isNew = promptId === 'new'
  const router = useRouter()

  const { data: prompt, isLoading } = useAIPrompt(isNew ? '' : promptId)
  const { mutate: updatePrompt, isPending: isUpdating } = useUpdateAIPrompt()

  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [status, setStatus] = useState<'draft' | 'active' | 'archived'>('draft')
  const [saved, setSaved] = useState(false)

  // 載入現有 prompt 資料
  useEffect(() => {
    if (prompt) {
      setName(prompt.name)
      setContent(prompt.content ?? '')
      setStatus(prompt.status)
    }
  }, [prompt])

  const handleSave = async () => {
    if (!content.trim()) return

    if (isNew) {
      if (!name.trim()) return
      try {
        const result = await createAIPrompt({ name, content, status })
        router.push(`/admin/ai/prompts/${result.id}`)
      } catch {
        alert('建立失敗，請稍後再試。')
      }
      return
    }

    updatePrompt(
      { id: promptId, data: { content, status } },
      {
        onSuccess: () => {
          setSaved(true)
          setTimeout(() => setSaved(false), 2000)
        },
      }
    )
  }

  if (!isNew && isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-wb-50" />
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/ai/prompts"
          className="flex items-center gap-1 text-sm text-wb-70 hover:text-wb-100 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </Link>
        <span className="text-wb-30">/</span>
        <span className="text-sm font-medium text-wb-100">
          {isNew ? '新增 Prompt' : `編輯：${prompt?.name ?? ''} v${prompt?.version}`}
        </span>
      </div>

      <div className="rounded-xl border border-wb-20 bg-white p-5 space-y-5">
        {/* 名稱（新增時才可編輯） */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-wb-100">Prompt 名稱</label>
          {isNew ? (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：system_prompt、query_template"
              className="w-full rounded-lg border border-wb-20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-wb-100"
            />
          ) : (
            <p className="rounded-lg bg-wb-05 px-3 py-2 text-sm text-wb-70">{prompt?.name}</p>
          )}
        </div>

        {/* 狀態 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-wb-100">狀態</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="rounded-lg border border-wb-20 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-wb-100"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* 內容編輯器 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-wb-100">Prompt 內容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            className="w-full rounded-lg border border-wb-20 bg-wb-05 px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-wb-100 resize-y"
            placeholder="輸入 prompt 內容..."
            spellCheck={false}
          />
          <p className="mt-1 text-xs text-wb-50">可使用 {'{context}'} 和 {'{query}'} 作為佔位符</p>
        </div>

        <div className="flex items-center justify-between border-t border-wb-10 pt-4">
          {!isNew && prompt && (
            <p className="text-xs text-wb-40">
              最後更新：{new Date(prompt.updated_at).toLocaleString('zh-TW')}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={isUpdating || (!content.trim()) || (isNew && !name.trim())}
            className="ml-auto flex items-center gap-2 rounded-xl bg-wb-100 px-4 py-2 text-sm text-white hover:bg-wb-90 disabled:opacity-50 transition-colors"
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {saved ? '已儲存！' : isNew ? '建立' : '儲存變更'}
          </button>
        </div>
      </div>
    </div>
  )
}
