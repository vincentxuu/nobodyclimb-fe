'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Camera,
  Calendar,
  MapPin,
  Mountain,
  Sparkles,
  MessageCircle,
  Plus,
  X,
  Loader2,
  BookOpen,
  Upload,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BiographyInput } from '@/lib/types'
import { generateUniqueId } from '@/lib/utils/biography-ui'
import { userService } from '@/lib/api/services'
import { useToast } from '@/components/ui/use-toast'
import { processImage, validateImageType } from '@/lib/utils/image'

/**
 * 帶 ID 的列表項目
 */
interface ListItem {
  id: string
  value: string
}

/**
 * 攀登方式選項
 */
const CLIMBING_METHODS = [
  '抱石',
  '運動攀登',
  '頂繩攀登',
  '速度攀登',
  '傳統攀登',
]

/**
 * 地形型態選項
 */
const TERRAIN_TYPES = [
  '平板岩',
  '垂直岩壁',
  '外傾岩壁',
  '屋簷',
  '裂隙',
  '稜線',
  '壁面',
  '煙囪',
]

/**
 * 動作風格選項
 */
const MOVEMENT_STYLES = [
  '動態路線',
  '跑酷風格',
  '協調性',
  '靜態',
  '技術性',
  '力量型',
  '耐力型',
]

/**
 * 生成年份選項 (從當前年往前 50 年)
 */
function generateYearOptions(): string[] {
  const currentYear = new Date().getFullYear()
  const years: string[] = []
  for (let year = currentYear; year >= currentYear - 50; year--) {
    years.push(year.toString())
  }
  return years
}

interface BiographyWizardProps {
  initialData?: Partial<BiographyInput>
  onSave: (_formData: Partial<BiographyInput>) => Promise<void>
  onCancel?: () => void
  onComplete?: () => void
  mode?: 'create' | 'edit'
  className?: string
}

type WizardStep = 1 | 2 | 3

/**
 * 人物誌填寫精靈
 * 三階段引導式填寫流程
 */
export function BiographyWizard({
  initialData = {},
  onSave,
  onCancel,
  onComplete,
  mode = 'create',
  className,
}: BiographyWizardProps) {
  const { toast } = useToast()
  const [currentStep, setCurrentStep] = useState<WizardStep>(1)
  const [formData, setFormData] = useState<Partial<BiographyInput>>(initialData)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationInput, setLocationInput] = useState('')
  const [bucketListInput, setBucketListInput] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialData.avatar_url || null
  )
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // 帶 ID 的地點列表
  const [locationItems, setLocationItems] = useState<ListItem[]>(() => {
    if (!initialData.frequent_locations) return []
    return initialData.frequent_locations
      .split(',')
      .filter((l) => l.trim())
      .map((value) => ({ id: generateUniqueId(), value: value.trim() }))
  })

  // 帶 ID 的人生清單
  const [bucketListItems, setBucketListItems] = useState<ListItem[]>(() => {
    if (!initialData.bucket_list_story) return []
    return initialData.bucket_list_story
      .split('\n')
      .filter((item) => item.trim())
      .map((value) => ({ id: generateUniqueId(), value: value.trim() }))
  })

  const yearOptions = useMemo(() => generateYearOptions(), [])

  // 解析路線類型
  const selectedRouteTypes = useMemo(() => {
    if (!formData.favorite_route_type) return []
    return formData.favorite_route_type.split(',').filter((t) => t.trim())
  }, [formData.favorite_route_type])

  // 更新表單資料
  const updateFormData = useCallback((field: keyof BiographyInput, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  // 處理頭像上傳
  const handleAvatarChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // 檢查檔案類型
      if (!validateImageType(file)) {
        toast({
          title: '檔案格式錯誤',
          description: '請上傳 JPG、PNG、WebP 或 GIF 格式的圖片',
          variant: 'destructive',
        })
        return
      }

      try {
        setIsUploadingAvatar(true)

        // 壓縮圖片到 500KB
        const compressedFile = await processImage(file)

        // 先顯示預覽
        const reader = new FileReader()
        reader.onload = (event) => {
          setAvatarPreview((event.target?.result as string) || null)
        }
        reader.readAsDataURL(compressedFile)

        // 上傳檔案
        const response = await userService.uploadAvatar(compressedFile)

        if (response.success && response.data?.url) {
          updateFormData('avatar_url', response.data.url)
          toast({
            title: '上傳成功',
            description: '頭像已更新',
          })
        } else {
          throw new Error('上傳失敗')
        }
      } catch (error) {
        console.error('Failed to upload avatar:', error)
        const message = error instanceof Error ? error.message : '頭像上傳時發生錯誤，請稍後再試'
        toast({
          title: '上傳失敗',
          description: message,
          variant: 'destructive',
        })
        // 恢復原本的預覽
        setAvatarPreview(formData.avatar_url || null)
      } finally {
        setIsUploadingAvatar(false)
      }
    },
    [formData.avatar_url, toast, updateFormData]
  )

  // 同步地點到 formData
  const syncLocations = useCallback(
    (items: ListItem[]) => {
      const locationString = items.map((item) => item.value).join(',')
      updateFormData('frequent_locations', locationString || null)
    },
    [updateFormData]
  )

  // 同步人生清單到 formData
  const syncBucketList = useCallback(
    (items: ListItem[]) => {
      const bucketString = items.map((item) => item.value).join('\n')
      updateFormData('bucket_list_story', bucketString || null)
    },
    [updateFormData]
  )

  // 新增地點
  const handleAddLocation = useCallback(() => {
    if (!locationInput.trim()) return
    const newItem: ListItem = { id: generateUniqueId(), value: locationInput.trim() }
    const newItems = [...locationItems, newItem]
    setLocationItems(newItems)
    syncLocations(newItems)
    setLocationInput('')
  }, [locationInput, locationItems, syncLocations])

  // 移除地點
  const handleRemoveLocation = useCallback(
    (id: string) => {
      const newItems = locationItems.filter((item) => item.id !== id)
      setLocationItems(newItems)
      syncLocations(newItems)
    },
    [locationItems, syncLocations]
  )

  // 切換路線類型
  const handleToggleRouteType = useCallback(
    (type: string) => {
      const newTypes = selectedRouteTypes.includes(type)
        ? selectedRouteTypes.filter((t) => t !== type)
        : [...selectedRouteTypes, type]
      updateFormData('favorite_route_type', newTypes.join(','))
    },
    [selectedRouteTypes, updateFormData]
  )

  // 新增人生清單項目
  const handleAddBucketListItem = useCallback(() => {
    if (!bucketListInput.trim()) return
    const newItem: ListItem = { id: generateUniqueId(), value: bucketListInput.trim() }
    const newItems = [...bucketListItems, newItem]
    setBucketListItems(newItems)
    syncBucketList(newItems)
    setBucketListInput('')
  }, [bucketListInput, bucketListItems, syncBucketList])

  // 移除人生清單項目
  const handleRemoveBucketListItem = useCallback(
    (id: string) => {
      const newItems = bucketListItems.filter((item) => item.id !== id)
      setBucketListItems(newItems)
      syncBucketList(newItems)
    },
    [bucketListItems, syncBucketList]
  )

  // 儲存並進入下一步
  const handleNext = useCallback(async () => {
    setIsSaving(true)
    setError(null)
    try {
      await onSave(formData)
      if (currentStep < 3) {
        setCurrentStep((prev) => (prev + 1) as WizardStep)
      } else {
        onComplete?.()
      }
    } catch (err) {
      console.error('Failed to save:', err)
      setError('儲存失敗，請稍後再試')
    } finally {
      setIsSaving(false)
    }
  }, [formData, currentStep, onSave, onComplete])

  // 返回上一步
  const handlePrev = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep)
    }
  }, [currentStep])

  // 跳過此步驟
  const handleSkip = useCallback(() => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as WizardStep)
    } else {
      onComplete?.()
    }
  }, [currentStep, onComplete])

  // 步驟指示器
  const StepIndicator = () => (
    <div className="mb-8 flex items-center justify-center">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors',
              currentStep === step
                ? 'bg-gray-900 text-white'
                : currentStep > step
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 text-gray-500'
            )}
          >
            {currentStep > step ? <Check className="h-5 w-5" /> : step}
          </div>
          {step < 3 && (
            <div
              className={cn(
                'mx-2 h-1 w-16 rounded-full transition-colors',
                currentStep > step ? 'bg-green-500' : 'bg-gray-200'
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )

  // 步驟標題
  const stepTitles: Record<WizardStep, { title: string; subtitle: string }> = {
    1: { title: '基本資訊', subtitle: '設定你的人物誌' },
    2: { title: '你的攀岩故事', subtitle: '這部分會讓你的人物誌更有溫度' },
    3: { title: '人生清單', subtitle: '在攀岩世界裡，你想完成的目標有什麼？' },
  }

  return (
    <div className={cn('mx-auto max-w-2xl', className)}>
      {/* 步驟指示器 */}
      <StepIndicator />

      {/* 步驟標題 */}
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900">{stepTitles[currentStep].title}</h2>
        <p className="mt-2 text-gray-500">{stepTitles[currentStep].subtitle}</p>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-center">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 步驟內容 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="rounded-lg bg-white p-6 shadow-sm"
        >
          {/* 步驟 1: 基本資訊 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* 頭像上傳 */}
              <div>
                <Label className="mb-2 block text-sm font-medium">
                  頭像 <span className="text-xs text-gray-400">（選填）</span>
                </Label>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gray-100">
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarPreview}
                          alt="頭像"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Camera className="h-8 w-8 text-gray-400" />
                      )}
                    </div>
                    {isUploadingAvatar && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-50">
                        <Loader2 className="h-6 w-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm transition-colors hover:bg-gray-50',
                        isUploadingAvatar && 'cursor-not-allowed opacity-50'
                      )}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                        disabled={isUploadingAvatar}
                      />
                      <Upload className="h-4 w-4" />
                      {isUploadingAvatar ? '上傳中...' : '上傳照片'}
                    </label>
                  </div>
                </div>
              </div>

              {/* 暱稱 */}
              <div>
                <Label htmlFor="name" className="mb-2 block text-sm font-medium">
                  你的暱稱
                </Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="輸入你的暱稱"
                />
              </div>

              {/* 個人標籤 */}
              <div>
                <Label htmlFor="title" className="mb-2 block text-sm font-medium">
                  個人標籤 <span className="text-xs text-gray-400">（選填）</span>
                </Label>
                <Input
                  id="title"
                  value={formData.title || ''}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="例如：專業攀岩者、業餘愛好者、攀岩教練"
                />
                <p className="mt-1 text-xs text-gray-500">
                  一句話描述你在攀岩界的身份或定位
                </p>
              </div>

              {/* 開始攀岩年份 */}
              <div>
                <Label className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4" />
                  哪一年開始攀岩
                </Label>
                <Select
                  value={formData.climbing_start_year || ''}
                  onValueChange={(value) => updateFormData('climbing_start_year', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇年份" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 常出沒地點 */}
              <div>
                <Label className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <MapPin className="h-4 w-4" />
                  平常出沒的地方
                </Label>
                <div className="mb-2 flex flex-wrap gap-2">
                  {locationItems.map((item) => (
                    <span
                      key={item.id}
                      className="flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm"
                    >
                      {item.value}
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(item.id)}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="輸入地點後按 Enter 或點擊新增"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddLocation()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddLocation}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* 喜歡的路線型態 */}
              <div>
                <Label className="mb-3 block text-sm font-medium">喜歡的路線型態（可複選）</Label>

                {/* 攀登方式 */}
                <div className="mb-3">
                  <p className="mb-2 text-xs text-gray-500">攀登方式</p>
                  <div className="flex flex-wrap gap-2">
                    {CLIMBING_METHODS.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => handleToggleRouteType(method)}
                        className={cn(
                          'rounded-full px-3 py-1 text-sm transition-colors',
                          selectedRouteTypes.includes(method)
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 地形型態 */}
                <div className="mb-3">
                  <p className="mb-2 text-xs text-gray-500">地形型態</p>
                  <div className="flex flex-wrap gap-2">
                    {TERRAIN_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleToggleRouteType(type)}
                        className={cn(
                          'rounded-full px-3 py-1 text-sm transition-colors',
                          selectedRouteTypes.includes(type)
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 動作風格 */}
                <div>
                  <p className="mb-2 text-xs text-gray-500">動作風格</p>
                  <div className="flex flex-wrap gap-2">
                    {MOVEMENT_STYLES.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => handleToggleRouteType(style)}
                        className={cn(
                          'rounded-full px-3 py-1 text-sm transition-colors',
                          selectedRouteTypes.includes(style)
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        )}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 步驟 2: 核心故事 */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* 你與攀岩的相遇 */}
              <div>
                <Label className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  你與攀岩的相遇
                </Label>
                <p className="mb-2 text-xs text-gray-500">
                  描述第一次接觸攀岩的情景，是什麼讓你想繼續？
                </p>
                <Textarea
                  value={formData.climbing_origin || ''}
                  onChange={(e) => updateFormData('climbing_origin', e.target.value)}
                  placeholder="那年某天，我第一次踏進岩館..."
                  className="min-h-[120px]"
                />
              </div>

              {/* 攀岩對你來說是什麼 */}
              <div>
                <Label className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <Mountain className="h-4 w-4 text-pink-500" />
                  攀岩對你來說是什麼
                </Label>
                <p className="mb-2 text-xs text-gray-500">
                  攀岩在你生活中扮演什麼角色？帶給你什麼？
                </p>
                <Textarea
                  value={formData.climbing_meaning || ''}
                  onChange={(e) => updateFormData('climbing_meaning', e.target.value)}
                  placeholder="攀岩對我來說，是..."
                  className="min-h-[120px]"
                />
              </div>

              {/* 給剛開始攀岩的自己 */}
              <div>
                <Label className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  給剛開始攀岩的自己
                </Label>
                <p className="mb-2 text-xs text-gray-500">
                  如果能回到起點，你會對自己說什麼？
                </p>
                <Textarea
                  value={formData.advice_to_self || ''}
                  onChange={(e) => updateFormData('advice_to_self', e.target.value)}
                  placeholder="如果能回到那時候，我想說..."
                  className="min-h-[120px]"
                />
              </div>
            </div>
          )}

          {/* 步驟 3: 人生清單 */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <Label className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <BookOpen className="h-4 w-4 text-orange-500" />
                  快速新增目標
                </Label>
                <p className="mb-3 text-xs text-gray-500">
                  輸入你想達成的攀岩目標，之後可以在人生清單詳細編輯
                </p>

                {/* 已新增的目標 */}
                <div className="mb-4 space-y-2">
                  {bucketListItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
                    >
                      <span className="text-sm text-gray-700">{item.value}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveBucketListItem(item.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* 新增輸入 */}
                <div className="flex gap-2">
                  <Input
                    value={bucketListInput}
                    onChange={(e) => setBucketListInput(e.target.value)}
                    placeholder="例如：完攀龍洞校門口、抱石 V6..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddBucketListItem()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={handleAddBucketListItem}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <p className="mt-4 text-center text-xs text-gray-400">
                  之後可以隨時回來詳細編輯每個目標
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 導航按鈕 */}
      <div className="mt-6 flex items-center justify-between">
        <div>
          {currentStep > 1 ? (
            <Button variant="ghost" onClick={handlePrev}>
              <ChevronLeft className="mr-2 h-4 w-4" />
              上一步
            </Button>
          ) : onCancel ? (
            <Button variant="ghost" onClick={onCancel}>
              取消
            </Button>
          ) : (
            <div />
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={handleSkip}>
            跳過，稍後再填
          </Button>
          <Button onClick={handleNext} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {currentStep === 3 ? (
              mode === 'create' ? (
                '完成並發布人物誌'
              ) : (
                '儲存'
              )
            ) : (
              <>
                下一步
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BiographyWizard
