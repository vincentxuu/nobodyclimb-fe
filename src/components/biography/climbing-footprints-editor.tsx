'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Plus, Trash2, Globe, Calendar, Eye, EyeOff, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ClimbingLocation } from '@/lib/types'
import { getCountryFlag, COMMON_COUNTRIES } from '@/lib/utils/country'

interface ClimbingFootprintsEditorProps {
  locations: ClimbingLocation[]
  onChange: (locations: ClimbingLocation[]) => void
  disabled?: boolean
}

export function ClimbingFootprintsEditor({
  locations,
  onChange,
  disabled = false,
}: ClimbingFootprintsEditorProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState<ClimbingLocation>({
    location: '',
    country: '台灣',
    visit_year: null,
    notes: null,
    photos: null,
    is_public: true,
  })

  const resetForm = () => {
    setFormData({
      location: '',
      country: '台灣',
      visit_year: null,
      notes: null,
      photos: null,
      is_public: true,
    })
    setShowAddForm(false)
    setEditingIndex(null)
  }

  const handleAdd = () => {
    if (!formData.location.trim()) return

    const newLocations = [...locations, { ...formData, location: formData.location.trim() }]
    onChange(newLocations)
    resetForm()
  }

  const handleUpdate = () => {
    if (editingIndex === null || !formData.location.trim()) return

    const newLocations = [...locations]
    newLocations[editingIndex] = { ...formData, location: formData.location.trim() }
    onChange(newLocations)
    resetForm()
  }

  const handleDelete = (index: number) => {
    const newLocations = locations.filter((_, i) => i !== index)
    onChange(newLocations)
  }

  const handleEdit = (index: number) => {
    setFormData(locations[index])
    setEditingIndex(index)
    setShowAddForm(true)
  }

  const handleTogglePublic = (index: number) => {
    const newLocations = [...locations]
    newLocations[index] = { ...newLocations[index], is_public: !newLocations[index].is_public }
    onChange(newLocations)
  }

  // 生成唯一 key（使用所有欄位組合，避免使用 index 以確保動畫穩定）
  const getLocationKey = (loc: ClimbingLocation, index: number) => {
    // 使用所有欄位組合來生成 key，index 作為最後手段區分完全相同的項目
    const notesHash = loc.notes ? loc.notes.length.toString() : '0'
    return `loc-${loc.location}-${loc.country}-${loc.visit_year || 'na'}-${notesHash}-${loc.is_public}-${index}`
  }

  return (
    <div className="space-y-4">
      {/* 現有地點列表 */}
      <div className="space-y-2">
        {locations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
            <MapPin className="mx-auto mb-2 h-8 w-8 text-gray-400" />
            <p>還沒有記錄攀岩足跡</p>
            <p className="text-sm">點擊下方按鈕新增你去過的攀岩地點</p>
          </div>
        ) : (
          <div className="space-y-2">
            {locations.map((loc, index) => (
              <motion.div
                key={getLocationKey(loc, index)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="flex items-center justify-between rounded-lg border bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getCountryFlag(loc.country)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{loc.location}</span>
                      {loc.visit_year && (
                        <span className="text-sm text-gray-500">({loc.visit_year})</span>
                      )}
                      {!loc.is_public && (
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                          私密
                        </span>
                      )}
                    </div>
                    {loc.notes && (
                      <p className="mt-1 line-clamp-1 text-sm text-gray-500">{loc.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePublic(index)}
                    disabled={disabled}
                    title={loc.is_public ? '設為私密' : '設為公開'}
                  >
                    {loc.is_public ? (
                      <Eye className="h-4 w-4 text-gray-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(index)}
                    disabled={disabled}
                  >
                    <FileText className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(index)}
                    disabled={disabled}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* 新增/編輯表單 */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden rounded-lg border bg-gray-50 p-4"
          >
            <div className="mb-4 flex items-center justify-between">
              <h4 className="font-medium">
                {editingIndex !== null ? '編輯地點' : '新增攀岩地點'}
              </h4>
              <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {/* 地點名稱 */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  地點名稱 <span className="text-red-500">*</span>
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="例如：龍洞、Krabi、陽朔"
                  disabled={disabled}
                />
              </div>

              {/* 國家 */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  <Globe className="mr-1 inline h-4 w-4" />
                  國家
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
                  disabled={disabled}
                >
                  {COMMON_COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {getCountryFlag(country)} {country}
                    </option>
                  ))}
                </select>
              </div>

              {/* 造訪年份 */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  <Calendar className="mr-1 inline h-4 w-4" />
                  造訪年份
                </label>
                <Input
                  value={formData.visit_year || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, visit_year: e.target.value || null })
                  }
                  placeholder="例如：2024 或 2023-2024"
                  disabled={disabled}
                />
              </div>

              {/* 心得筆記 */}
              <div>
                <label className="mb-1 block text-sm font-medium">
                  <FileText className="mr-1 inline h-4 w-4" />
                  心得筆記（選填）
                </label>
                <Textarea
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value || null })}
                  placeholder="分享你的攀岩心得..."
                  rows={3}
                  disabled={disabled}
                />
              </div>

              {/* 是否公開 */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                  disabled={disabled}
                />
                <label htmlFor="is_public" className="text-sm">
                  公開此地點（其他人可以在探索頁面看到）
                </label>
              </div>

              {/* 按鈕 */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm} disabled={disabled}>
                  取消
                </Button>
                <Button
                  type="button"
                  onClick={editingIndex !== null ? handleUpdate : handleAdd}
                  disabled={disabled || !formData.location.trim()}
                >
                  {editingIndex !== null ? '更新' : '新增'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 新增按鈕 */}
      {!showAddForm && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setShowAddForm(true)}
          disabled={disabled}
        >
          <Plus className="mr-2 h-4 w-4" />
          新增攀岩地點
        </Button>
      )}
    </div>
  )
}
