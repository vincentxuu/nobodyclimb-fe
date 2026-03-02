'use client'

import { useState, useEffect } from 'react'
import { Loader2, Save, Trash2, Layers } from 'lucide-react'
import { AdminSector } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import { adminCragService } from '@/lib/api/services'

interface InlineSectorFormProps {
  sector: AdminSector | null
  cragId: string
  areaId: string
  areaName?: string
  cragName?: string
  isNew?: boolean
  onSave: () => void
  onCancel: () => void
  onDelete?: () => void
}

interface SectorFormData {
  name: string
  name_en: string
}

const emptySectorForm: SectorFormData = {
  name: '',
  name_en: '',
}

export default function InlineSectorForm({
  sector,
  cragId,
  areaId,
  areaName,
  cragName,
  isNew = false,
  onSave,
  onCancel,
  onDelete,
}: InlineSectorFormProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [form, setForm] = useState<SectorFormData>(emptySectorForm)

  // Initialize form when sector changes
  useEffect(() => {
    if (sector) {
      setForm({
        name: sector.name,
        name_en: sector.name_en || '',
      })
    } else {
      setForm(emptySectorForm)
    }
    setShowDeleteConfirm(false)
  }, [sector])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setSubmitting(true)
    try {
      const data = {
        name: form.name.trim(),
        name_en: form.name_en.trim() || undefined,
      }

      if (sector) {
        await adminCragService.updateSector(cragId, areaId, sector.id, data)
        toast({ title: '成功', description: '岩壁已更新' })
      } else {
        await adminCragService.createSector(cragId, areaId, data)
        toast({ title: '成功', description: '岩壁已新增' })
      }

      onSave()
    } catch (error) {
      console.error('Failed to save sector:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '儲存岩壁失敗' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!sector) return

    setDeleting(true)
    try {
      await adminCragService.deleteSector(cragId, areaId, sector.id)
      toast({ title: '成功', description: '岩壁已刪除' })
      onDelete?.()
    } catch (error) {
      console.error('Failed to delete sector:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '刪除岩壁失敗' })
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
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Layers className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-wb-100">
              {isNew ? '新增岩壁' : `編輯岩壁：${sector?.name}`}
            </h2>
            <p className="text-xs text-wb-50">
              {cragName && areaName
                ? `${cragName} / ${areaName}`
                : '填寫岩壁資料'}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-wb-70 mb-1">
              岩壁名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="例：人面岩"
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
              placeholder="例：Face Rock"
              className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
            />
          </div>

          {/* 提示訊息 */}
          <div className="bg-blue-50 rounded-lg p-4 mt-6">
            <p className="text-sm text-blue-800">
              岩壁是區域內的具體岩面分區，例如龍洞校門口區域中的「人面岩」、「門簷」等。
              建立岩壁後，可以在樹狀導航中點擊岩壁旁的 [+] 按鈕來新增路線。
            </p>
          </div>
        </div>
      </form>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-wb-20 flex items-center justify-between flex-shrink-0 bg-white">
        <div>
          {sector && !isNew && (
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
                  刪除岩壁
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
            {sector ? '更新岩壁' : '新增岩壁'}
          </button>
        </div>
      </div>
    </div>
  )
}
