'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/useAuth'
import { X, Plus, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/page-transition'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface BasicInfoFormData {
  displayName: string
  title: string
  startYear: string
  frequentLocations: string[]
  favoriteRouteTypes: string[]
}

// 預設的路線型態選項（與 BasicInfoSection 一致）
const ROUTE_TYPE_GROUPS = [
  {
    category: '攀登方式',
    options: [
      { label: '抱石', value: '抱石' },
      { label: '運動攀登', value: '運動攀登' },
      { label: '頂繩攀登', value: '頂繩攀登' },
      { label: '速度攀登', value: '速度攀登' },
      { label: '傳統攀登', value: '傳統攀登' },
    ],
  },
  {
    category: '地形型態',
    options: [
      { label: '平板岩', value: '平板岩' },
      { label: '垂直岩壁', value: '垂直岩壁' },
      { label: '外傾岩壁', value: '外傾岩壁' },
      { label: '屋簷', value: '屋簷' },
      { label: '裂隙', value: '裂隙' },
    ],
  },
  {
    category: '動作風格',
    options: [
      { label: '動態路線', value: '動態路線' },
      { label: '靜態', value: '靜態' },
      { label: '技術性', value: '技術性' },
      { label: '力量型', value: '力量型' },
      { label: '耐力型', value: '耐力型' },
    ],
  },
]

export default function BasicInfoPage() {
  const router = useRouter()
  const { user, updateUser } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState<BasicInfoFormData>({
    displayName: '',
    title: '',
    startYear: '',
    frequentLocations: [],
    favoriteRouteTypes: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newLocation, setNewLocation] = useState('')

  // 年份選項
  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => {
    const years: number[] = []
    for (let year = currentYear; year >= 1970; year--) {
      years.push(year)
    }
    return years
  }, [currentYear])

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        displayName: user.displayName || user.username || '',
      }))
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // 新增常去地點
  const handleAddLocation = () => {
    if (newLocation.trim() && !formData.frequentLocations.includes(newLocation.trim())) {
      setFormData((prev) => ({
        ...prev,
        frequentLocations: [...prev.frequentLocations, newLocation.trim()],
      }))
      setNewLocation('')
    }
  }

  // 移除常去地點
  const handleRemoveLocation = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      frequentLocations: prev.frequentLocations.filter((_, i) => i !== index),
    }))
  }

  // 切換路線型態選擇
  const handleToggleRouteType = (value: string) => {
    setFormData((prev) => {
      if (prev.favoriteRouteTypes.includes(value)) {
        return {
          ...prev,
          favoriteRouteTypes: prev.favoriteRouteTypes.filter((t) => t !== value),
        }
      } else {
        return {
          ...prev,
          favoriteRouteTypes: [...prev.favoriteRouteTypes, value],
        }
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const userData = {
        displayName: formData.displayName,
        title: formData.title,
        climbingStartYear: formData.startYear,
        frequentLocations: formData.frequentLocations,
        favoriteRouteTypes: formData.favoriteRouteTypes,
      }

      const result = await updateUser(userData)

      if (result.success) {
        toast({
          title: '基本資料已更新',
          description: '您的個人資料已成功更新',
          variant: 'default',
        })
        router.push('/auth/profile-setup/tags')
      } else {
        toast({
          title: '更新失敗',
          description: result.error || '更新資料時發生錯誤',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('更新資料失敗', error)
      toast({
        title: '更新失敗',
        description: '更新資料時發生錯誤，請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageTransition>
      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* 步驟指示器 */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  1
                </div>
                <span className="mt-2 text-xs sm:text-sm">基本資料</span>
              </div>
              <div className="h-1 w-8 sm:w-12 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-gray-600">
                  2
                </div>
                <span className="mt-2 text-xs sm:text-sm text-gray-500">標籤</span>
              </div>
              <div className="h-1 w-8 sm:w-12 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-gray-600">
                  3
                </div>
                <span className="mt-2 text-xs sm:text-sm text-gray-500">一句話</span>
              </div>
              <div className="h-1 w-8 sm:w-12 bg-gray-300"></div>
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300 text-gray-600">
                  4
                </div>
                <span className="mt-2 text-xs sm:text-sm text-gray-500">完成</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">基本資料</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 名稱 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              placeholder="你想怎麼被稱呼？"
              required
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              maxLength={50}
            />
          </div>

          {/* 一句話介紹自己 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              一句話介紹自己
              <span className="text-gray-400 font-normal ml-1">(選填)</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="例如：快樂最重要的週末岩友"
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              maxLength={100}
            />
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Lightbulb size={12} />
              這句話會顯示在你的名字下方
            </p>
          </div>

          {/* 開始攀岩年份 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              開始攀岩年份
              <span className="text-gray-400 font-normal ml-1">(選填)</span>
            </label>
            <select
              name="startYear"
              value={formData.startYear}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="">選擇年份</option>
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* 平常出沒的地方 - 多選標籤 */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              平常出沒的地方
              <span className="text-gray-400 font-normal ml-1">(可多選)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {formData.frequentLocations.map((location, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-sm text-gray-900"
                >
                  {location}
                  <button
                    type="button"
                    onClick={() => handleRemoveLocation(index)}
                    className="ml-1 text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <div className="inline-flex items-center gap-1">
                <input
                  type="text"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddLocation()
                    }
                  }}
                  placeholder="輸入後按 Enter"
                  className="w-32 px-3 py-1.5 text-sm bg-white text-gray-900 border border-dashed border-gray-300 rounded-full placeholder:text-gray-400 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={handleAddLocation}
                  className="p-1.5 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500">岩館、戶外岩場都可以加</p>
          </div>

          {/* 喜歡的路線型態 - 分類多選 */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700">
              喜歡的路線型態
              <span className="text-gray-400 font-normal ml-1">(可多選)</span>
            </label>
            {ROUTE_TYPE_GROUPS.map((group) => (
              <div key={group.category} className="space-y-2">
                <span className="text-xs text-gray-500">{group.category}</span>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const isSelected = formData.favoriteRouteTypes.includes(option.value)
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleToggleRouteType(option.value)}
                        className={cn(
                          'px-3 py-1.5 text-sm rounded-full border transition-colors',
                          isSelected
                            ? 'bg-primary text-white border-primary'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary hover:bg-gray-50'
                        )}
                      >
                        {option.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* 按鈕區 */}
          <div className="pt-4">
            <Button
              type="submit"
              className="w-full rounded-lg py-3 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? '處理中...' : '下一步'}
            </Button>
          </div>
        </form>
      </div>
    </PageTransition>
  )
}
