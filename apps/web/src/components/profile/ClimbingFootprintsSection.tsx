'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Globe, Loader2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Label } from '@/components/ui/label'
import { ClimbingFootprintsEditor } from '@/components/biography/climbing-footprints-editor'
import { ClimbingLocation, ClimbingLocationRecord } from '@/lib/types'
import { climbingLocationService } from '@/lib/api/services'
import { getCountryFlag } from '@/lib/utils/country'
import { useToast } from '@/components/ui/use-toast'

interface ClimbingFootprintsSectionProps {
  isEditing: boolean
  isMobile: boolean
}

// 將 ClimbingLocationRecord 轉換為 ClimbingLocation（給 Editor 使用）
function recordToLocation(record: ClimbingLocationRecord): ClimbingLocation & { _id: string } {
  return {
    _id: record.id, // 保留 id 以便後續更新/刪除
    location: record.location,
    country: record.country,
    visit_year: record.visit_year,
    notes: record.notes,
    photos: record.photos,
    is_public: record.is_public,
  }
}

// 將 ClimbingLocation 轉換為 API 請求格式
function locationToCreateData(loc: ClimbingLocation) {
  return {
    location: loc.location,
    country: loc.country,
    visit_year: loc.visit_year || undefined,
    notes: loc.notes || undefined,
    photos: loc.photos || undefined,
    is_public: loc.is_public,
  }
}

export default function ClimbingFootprintsSection({
  isEditing,
  isMobile,
}: ClimbingFootprintsSectionProps) {
  const { toast } = useToast()
  const [records, setRecords] = useState<ClimbingLocationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // 載入攀岩足跡
  const loadLocations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await climbingLocationService.getMyLocations()
      if (response.success && response.data) {
        setRecords(response.data)
      } else {
        setError(response.error || '載入失敗')
      }
    } catch (err) {
      console.error('Failed to load climbing locations:', err)
      setError('無法載入攀岩足跡')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLocations()
  }, [loadLocations])

  // 將 records 轉換為 Editor 使用的格式
  const locations: ClimbingLocation[] = records.map(recordToLocation)

  // 處理編輯器的變更
  const handleChange = useCallback(
    async (newLocations: ClimbingLocation[]) => {
      setIsSaving(true)

      try {
        // 建立 id -> record 的映射（在 callback 內部創建以避免依賴問題）
        const recordMap = new Map(records.map((r) => [r.id, r]))

        // 計算新增、更新、刪除的項目
        const newLocationIds = new Set(
          newLocations
            .filter((loc) => (loc as ClimbingLocation & { _id?: string })._id)
            .map((loc) => (loc as ClimbingLocation & { _id?: string })._id)
        )
        const existingIds = new Set(records.map((r) => r.id))

        // 找出要刪除的（原本有但新的沒有）
        const toDelete = records.filter((r) => !newLocationIds.has(r.id))

        // 找出要新增的（沒有 _id 的）
        const toCreate = newLocations.filter(
          (loc) => !(loc as ClimbingLocation & { _id?: string })._id
        )

        // 找出要更新的（有 _id 且內容有變化）
        const toUpdate: Array<{ id: string; data: ClimbingLocation }> = []
        for (const loc of newLocations) {
          const id = (loc as ClimbingLocation & { _id?: string })._id
          if (id && existingIds.has(id)) {
            const existing = recordMap.get(id)
            if (existing) {
              // 檢查是否有變化
              if (
                loc.location !== existing.location ||
                loc.country !== existing.country ||
                loc.visit_year !== existing.visit_year ||
                loc.notes !== existing.notes ||
                loc.is_public !== existing.is_public ||
                JSON.stringify(loc.photos) !== JSON.stringify(existing.photos)
              ) {
                toUpdate.push({ id, data: loc })
              }
            }
          }
        }

        // 平行執行刪除、新增、更新
        await Promise.all([
          ...toDelete.map((record) => climbingLocationService.deleteLocation(record.id)),
          ...toCreate.map((loc) => climbingLocationService.createLocation(locationToCreateData(loc))),
          ...toUpdate.map(({ id, data }) =>
            climbingLocationService.updateLocation(id, {
              location: data.location,
              country: data.country,
              visit_year: data.visit_year,
              notes: data.notes,
              photos: data.photos,
              is_public: data.is_public,
            })
          ),
        ])

        // 重新載入資料
        await loadLocations()

        // 顯示成功訊息
        const actions = []
        if (toCreate.length > 0) actions.push(`新增 ${toCreate.length} 個`)
        if (toUpdate.length > 0) actions.push(`更新 ${toUpdate.length} 個`)
        if (toDelete.length > 0) actions.push(`刪除 ${toDelete.length} 個`)

        if (actions.length > 0) {
          toast({
            title: '攀岩足跡已更新',
            description: actions.join('、'),
          })
        }
      } catch (err) {
        console.error('Failed to update climbing locations:', err)
        toast({
          title: '更新失敗',
          description: '請稍後再試',
          variant: 'destructive',
        })
        // 重新載入以恢復正確狀態
        await loadLocations()
      } finally {
        setIsSaving(false)
      }
    },
    [records, loadLocations, toast]
  )

  // Group locations by country
  const locationsByCountry = locations.reduce(
    (acc, loc) => {
      const country = loc.country || '未知'
      if (!acc[country]) {
        acc[country] = []
      }
      acc[country].push(loc)
      return acc
    },
    {} as Record<string, ClimbingLocation[]>
  )

  const countryCount = Object.keys(locationsByCountry).length
  const totalLocations = locations.length

  // 載入中狀態
  if (loading) {
    return (
      <div className="space-y-4">
        <div>
          <Label className={`font-medium text-strong ${isMobile ? 'text-sm' : 'text-base'}`}>
            攀岩足跡
          </Label>
          <p className="mt-1 text-xs text-gray-500">記錄你去過的攀岩地點和旅程</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  // 錯誤狀態
  if (error) {
    return (
      <div className="space-y-4">
        <div>
          <Label className={`font-medium text-strong ${isMobile ? 'text-sm' : 'text-base'}`}>
            攀岩足跡
          </Label>
          <p className="mt-1 text-xs text-gray-500">記錄你去過的攀岩地點和旅程</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={loadLocations}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            重試
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div>
        <Label className={`font-medium text-strong ${isMobile ? 'text-sm' : 'text-base'}`}>
          攀岩足跡
        </Label>
        <p className="mt-1 text-xs text-gray-500">記錄你去過的攀岩地點和旅程</p>
      </div>
      {/* Stats Badge */}
      {totalLocations > 0 && (
        <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {countryCount} 國 · {totalLocations} 地點
        </span>
      )}

      {/* Saving Indicator */}
      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-sm text-gray-500"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>儲存中...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Display Mode */}
      {!isEditing && (
        <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
          {totalLocations === 0 ? (
            <div className="py-4 text-center text-gray-500">
              <Globe className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm">還沒有記錄攀岩足跡</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(locationsByCountry).map(([country, locs]) => (
                <div key={country}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-lg">{getCountryFlag(country)}</span>
                    <span className="text-sm font-medium text-gray-700">{country}</span>
                    <span className="text-xs text-gray-500">({locs.length})</span>
                  </div>
                  <div className={`flex flex-wrap gap-2 ${isMobile ? '' : 'pl-7'}`}>
                    {locs.map((loc, idx) => (
                      <span
                        key={`${loc.country}-${loc.location}-${idx}`}
                        className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm text-gray-700"
                      >
                        {loc.location}
                        {loc.visit_year && (
                          <span className="ml-1 text-xs text-gray-400">({loc.visit_year})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && (
        <ClimbingFootprintsEditor locations={locations} onChange={handleChange} disabled={isSaving} />
      )}
    </div>
  )
}
