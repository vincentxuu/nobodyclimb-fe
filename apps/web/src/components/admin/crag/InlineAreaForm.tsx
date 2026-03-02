'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, Trash2, FolderOpen } from 'lucide-react'
import { AdminArea } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import { adminCragService } from '@/lib/api/services'

interface InlineAreaFormProps {
  area: AdminArea | null
  cragId: string
  cragName?: string
  isNew?: boolean
  onSave: () => void
  onCancel: () => void
  onDelete?: () => void
}

interface AreaFormData {
  name: string
  name_en: string
  description: string
}

const emptyAreaForm: AreaFormData = {
  name: '',
  name_en: '',
  description: '',
}

export default function InlineAreaForm({
  area,
  cragId,
  cragName,
  isNew = false,
  onSave,
  onCancel,
  onDelete,
}: InlineAreaFormProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [form, setForm] = useState<AreaFormData>(emptyAreaForm)

  // Initialize form when area changes
  useEffect(() => {
    if (area) {
      setForm({
        name: area.name,
        name_en: area.name_en || '',
        description: area.description || '',
      })
    } else {
      setForm(emptyAreaForm)
    }
    setShowDeleteConfirm(false)
  }, [area])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setSubmitting(true)
    try {
      const data = {
        name: form.name.trim(),
        name_en: form.name_en.trim() || undefined,
        description: form.description.trim() || undefined,
      }

      if (area) {
        await adminCragService.updateArea(cragId, area.id, data)
        toast({ title: '成功', description: '區域已更新' })
      } else {
        await adminCragService.createArea(cragId, data)
        toast({ title: '成功', description: '區域已新增' })
      }

      onSave()
    } catch (error) {
      console.error('Failed to save area:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '儲存區域失敗' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!area) return

    setDeleting(true)
    try {
      await adminCragService.deleteArea(cragId, area.id)
      toast({ title: '成功', description: '區域已刪除' })
      onDelete?.()
    } catch (error) {
      console.error('Failed to delete area:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '刪除區域失敗' })
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-wb-20 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <FolderOpen className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="font-semibold text-wb-100">
              {isNew ? '新增區域' : `編輯區域：${area?.name}`}
            </h2>
            <p className="text-xs text-wb-50">
              {cragName ? `所屬岩場：${cragName}` : '填寫區域資料'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-wb-70 mb-1">
              區域名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例：校門口"
              className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-wb-70 mb-1">
              英文名稱
            </label>
            <input
              type="text"
              value={form.name_en}
              onChange={(e) => setForm({ ...form, name_en: e.target.value })}
              placeholder="例：School Gate"
              className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-wb-70 mb-1">
              描述
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="區域的描述或特色說明..."
              className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20 resize-none"
            />
          </div>

          {/* 區域統計資訊（僅在編輯模式顯示） */}
          {area && !isNew && (
            <div className="bg-wb-10/50 rounded-lg p-4 mt-6">
              <h3 className="text-sm font-medium text-wb-90 mb-3">統計資訊</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs text-wb-50 mb-0.5">路線數</dt>
                  <dd className="text-lg font-semibold text-wb-100">
                    {area.route_count || 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-wb-50 mb-0.5">Bolt 數</dt>
                  <dd className="text-lg font-semibold text-wb-100">
                    {area.bolt_count || 0}
                  </dd>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-wb-20 flex items-center justify-between flex-shrink-0 bg-white">
        <div>
          {area && !isNew && (
            <>
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600">確定要刪除嗎？</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      '確認刪除'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 text-sm text-wb-70 hover:text-wb-100 rounded-lg hover:bg-wb-10 transition-colors"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  刪除區域
                </button>
              )}
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-wb-70 hover:text-wb-100 rounded-lg hover:bg-wb-10 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={submitting || !form.name.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {area ? '更新區域' : '新增區域'}
          </button>
        </div>
      </div>
    </div>
  )
}
