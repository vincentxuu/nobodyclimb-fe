'use client'

import { useState } from 'react'
import { Loader2, Save, X } from 'lucide-react'
import { AdminCrag } from '@/lib/types'
import { useToast } from '@/components/ui/use-toast'
import apiClient from '@/lib/api/client'
import { CragFormData, emptyCragForm, REGIONS } from './types'

interface CragFormProps {
  crag: AdminCrag | null
  onSave: () => void
  onCancel: () => void
}

export default function CragForm({ crag, onSave, onCancel }: CragFormProps) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<CragFormData>(() => {
    if (crag) {
      return {
        name: crag.name,
        slug: crag.slug,
        description: crag.description || '',
        location: crag.location || '',
        region: crag.region || '',
        latitude: crag.latitude?.toString() || '',
        longitude: crag.longitude?.toString() || '',
        altitude: crag.altitude?.toString() || '',
        rock_type: crag.rock_type || '',
        climbing_types: Array.isArray(crag.climbing_types)
          ? crag.climbing_types.join(', ')
          : '',
        difficulty_range: crag.difficulty_range || '',
        is_featured: crag.is_featured === 1,
        access_info: crag.access_info || '',
        parking_info: crag.parking_info || '',
        approach_time: crag.approach_time?.toString() || '',
        best_seasons: Array.isArray(crag.best_seasons)
          ? crag.best_seasons.join(', ')
          : '',
        restrictions: crag.restrictions || '',
      }
    }
    return emptyCragForm
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description || null,
        location: form.location || null,
        region: form.region || null,
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
        altitude: form.altitude ? Number(form.altitude) : null,
        rock_type: form.rock_type || null,
        climbing_types: form.climbing_types
          ? form.climbing_types.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        difficulty_range: form.difficulty_range || null,
        is_featured: form.is_featured ? 1 : 0,
        access_info: form.access_info || null,
        parking_info: form.parking_info || null,
        approach_time: form.approach_time || null,
        best_seasons: form.best_seasons
          ? form.best_seasons.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        restrictions: form.restrictions || null,
        ...(!crag && form.slug ? { slug: form.slug.trim() } : {}),
      }

      if (crag) {
        await apiClient.put(`/crags/${crag.id}`, payload)
      } else {
        await apiClient.post('/crags', payload)
      }

      onSave()
    } catch (error) {
      console.error('Failed to save crag:', error)
      toast({ variant: 'destructive', title: '錯誤', description: '儲存岩場失敗' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-wb-20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-wb-100">
          {crag ? '編輯岩場' : '新增岩場'}
        </h3>
        <button
          onClick={onCancel}
          className="p-2 text-wb-50 hover:text-wb-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 基本資訊 */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-wb-90 mb-2">基本資訊</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-wb-70 mb-1">
                名稱 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                required
              />
            </div>
            {!crag && (
              <div>
                <label className="block text-sm font-medium text-wb-70 mb-1">
                  Slug <span className="text-xs text-wb-50">(留空自動產生)</span>
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="例：longdong"
                  className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-wb-70 mb-1">區域</label>
              <select
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg focus:outline-none focus:ring-2 focus:ring-wb-100/20 bg-white"
              >
                <option value="">選擇區域</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-wb-70 mb-1">位置描述</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="例：新北市瑞芳區龍洞"
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="block text-sm font-medium text-wb-70 mb-1">描述</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20 resize-none"
              />
            </div>
          </div>
        </fieldset>

        {/* 地理資訊 */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-wb-90 mb-2">地理資訊</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-wb-70 mb-1">緯度</label>
              <input
                type="number"
                step="any"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                placeholder="例：25.1082"
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-wb-70 mb-1">經度</label>
              <input
                type="number"
                step="any"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                placeholder="例：121.9227"
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-wb-70 mb-1">海拔 (m)</label>
              <input
                type="number"
                value={form.altitude}
                onChange={(e) => setForm({ ...form, altitude: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
              />
            </div>
          </div>
        </fieldset>

        {/* 攀岩資訊 */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-wb-90 mb-2">攀岩資訊</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-wb-70 mb-1">岩質</label>
              <input
                type="text"
                value={form.rock_type}
                onChange={(e) => setForm({ ...form, rock_type: e.target.value })}
                placeholder="例：砂岩、石灰岩、花崗岩"
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-wb-70 mb-1">攀登類型</label>
              <input
                type="text"
                value={form.climbing_types}
                onChange={(e) => setForm({ ...form, climbing_types: e.target.value })}
                placeholder="逗號分隔，例：sport, trad, boulder"
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-wb-70 mb-1">難度範圍</label>
              <input
                type="text"
                value={form.difficulty_range}
                onChange={(e) => setForm({ ...form, difficulty_range: e.target.value })}
                placeholder="例：5.6-5.13a"
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
              />
            </div>
          </div>
        </fieldset>

        {/* 交通與環境 */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-wb-90 mb-2">交通與環境</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-wb-70 mb-1">進場時間</label>
              <input
                type="text"
                value={form.approach_time}
                onChange={(e) => setForm({ ...form, approach_time: e.target.value })}
                placeholder="例：15（分鐘）"
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-wb-70 mb-1">適合季節</label>
              <input
                type="text"
                value={form.best_seasons}
                onChange={(e) => setForm({ ...form, best_seasons: e.target.value })}
                placeholder="逗號分隔，例：秋, 冬, 春"
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-wb-70 mb-1">交通資訊</label>
              <textarea
                value={form.access_info}
                onChange={(e) => setForm({ ...form, access_info: e.target.value })}
                rows={2}
                placeholder="如何抵達、大眾運輸方式等"
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-wb-70 mb-1">停車資訊</label>
              <textarea
                value={form.parking_info}
                onChange={(e) => setForm({ ...form, parking_info: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-wb-70 mb-1">限制事項</label>
              <textarea
                value={form.restrictions}
                onChange={(e) => setForm({ ...form, restrictions: e.target.value })}
                rows={2}
                placeholder="例：雨後禁止攀爬、需申請入山證等"
                className="w-full px-3 py-2 text-sm border border-wb-20 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-wb-100/20 resize-none"
              />
            </div>
          </div>
        </fieldset>

        {/* 其他設定 */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="crag_is_featured"
            checked={form.is_featured}
            onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            className="rounded border-wb-20 text-wb-100 focus:ring-wb-100/20"
          />
          <label htmlFor="crag_is_featured" className="text-sm text-wb-70">
            設為精選岩場
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-wb-70 hover:text-wb-100 rounded-lg hover:bg-wb-10 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting || !form.name.trim()}
            className="flex items-center gap-1.5 px-4 py-2 text-sm bg-wb-100 text-white rounded-lg hover:bg-wb-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {crag ? '更新岩場' : '新增岩場'}
          </button>
        </div>
      </form>
    </div>
  )
}
