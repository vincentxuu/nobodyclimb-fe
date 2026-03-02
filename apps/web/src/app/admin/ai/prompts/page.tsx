'use client'

import Link from 'next/link'
import { Loader2, Plus, Trash2, Edit } from 'lucide-react'
import { useAIPrompts, useDeleteAIPrompt } from '@/lib/api/admin-ai'

const STATUS_LABEL: Record<string, string> = {
  draft: '草稿',
  active: '啟用',
  archived: '封存',
}

const STATUS_COLOR: Record<string, string> = {
  draft: 'bg-yellow-50 text-yellow-700',
  active: 'bg-emerald-50 text-emerald-700',
  archived: 'bg-wb-10 text-wb-50',
}

export default function AdminAIPromptsPage() {
  const { data: prompts, isLoading } = useAIPrompts()
  const { mutate: deletePrompt } = useDeleteAIPrompt()

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`確定要刪除 Prompt「${name}」嗎？`)) return
    deletePrompt(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-wb-100">Prompt 管理</h1>
          <p className="mt-0.5 text-sm text-wb-70">管理 AI 系統提示詞與版本歷史</p>
        </div>
        <Link
          href="/admin/ai/prompts/new"
          className="flex items-center gap-1.5 rounded-xl bg-wb-100 px-4 py-2 text-sm text-white hover:bg-wb-90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          新增 Prompt
        </Link>
      </div>

      <div className="rounded-xl border border-wb-20 bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-wb-50" />
          </div>
        ) : !prompts?.length ? (
          <p className="py-12 text-center text-sm text-wb-50">尚無 Prompt，請點選「新增 Prompt」建立</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-wb-20 bg-wb-05">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-wb-70">名稱</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-wb-70">版本</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-wb-70">狀態</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-wb-70">更新時間</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-wb-10">
              {prompts.map((prompt) => (
                <tr key={prompt.id} className="hover:bg-wb-05 transition-colors">
                  <td className="px-5 py-4 font-medium text-wb-100">{prompt.name}</td>
                  <td className="px-5 py-4 text-wb-70">v{prompt.version}</td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[prompt.status] ?? ''}`}>
                      {STATUS_LABEL[prompt.status] ?? prompt.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-wb-50 text-xs">
                    {new Date(prompt.updated_at).toLocaleString('zh-TW')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <Link
                        href={`/admin/ai/prompts/${prompt.id}`}
                        className="rounded-lg border border-wb-20 p-1.5 text-wb-70 hover:bg-wb-10 transition-colors"
                        aria-label="編輯"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(prompt.id, prompt.name)}
                        className="rounded-lg border border-wb-20 p-1.5 text-wb-70 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                        aria-label="刪除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
