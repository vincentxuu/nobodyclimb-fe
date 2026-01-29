'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { User, Tag, MessageCircle, BookOpen, Globe } from 'lucide-react'
import { biographyService } from '@/lib/api/services'
import { useToast } from '@/components/ui/use-toast'
import ImageCropper from '@/components/shared/image-cropper'
import type {
  BiographyV2,
  TagDimension,
  TagOption,
  OneLinerQuestion,
  StoryQuestion,
  StoryCategory,
} from '@/lib/types/biography-v2'
import { PrivacyBanner } from './PrivacyBanner'
import { ProgressIndicator } from './ProgressIndicator'
import { BasicInfoSection } from './BasicInfoSection'
import { TagsSection } from './TagsSection'
import { OneLinersSection } from './OneLinersSection'
import { StoriesSection } from './StoriesSection'
import { StoryEditModal } from './StoryEditModal'
import { FixedBottomBar, BottomBarSpacer } from './FixedBottomBar'
import { AutoSaveIndicator, useSaveStatus } from '../shared/AutoSaveIndicator'
import { ClimbingFootprintsEditorSection } from './ClimbingFootprintsEditorSection'
import { AddCustomTagModal } from './AddCustomTagModal'
import { AddCustomDimensionModal } from './AddCustomDimensionModal'
import { AddCustomOneLinerModal } from './AddCustomOneLinerModal'
import { AddCustomStoryModal } from './AddCustomStoryModal'
import { TagsBottomSheet } from './TagsBottomSheet'
import { StoryEditFullscreen } from './StoryEditFullscreen'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback'

interface ProfileEditorProps {
  /** 人物誌資料 */
  biography: BiographyV2
  /** 標籤維度列表 */
  tagDimensions: TagDimension[]
  /** 快問快答問題列表 */
  oneLinerQuestions: OneLinerQuestion[]
  /** 故事問題列表（按類別分組） */
  storyQuestionsByCategory: Record<StoryCategory, StoryQuestion[]>
  /** 資料變更回調 */
  onChange: (_biography: Partial<BiographyV2>) => void
  /** 儲存回調 */
  onSave: (_biography: BiographyV2) => Promise<void>
  /** 預覽連結 */
  previewHref: string
  /** 發布回調 */
  onPublish?: () => Promise<void>
  /** 自訂樣式 */
  className?: string
}

/**
 * 人物誌編輯器
 *
 * 主要的編輯器容器組件
 */
export function ProfileEditor({
  biography,
  tagDimensions,
  oneLinerQuestions,
  storyQuestionsByCategory,
  onChange,
  onSave,
  previewHref,
  onPublish,
  className,
}: ProfileEditorProps) {
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string>('basic')
  const { status, lastSavedAt, error, setSaving, setSaved, setError } = useSaveStatus()
  const isMobile = useIsMobile()
  const { toast } = useToast()

  // 圖片裁切器狀態
  const [showCropper, setShowCropper] = useState(false)
  const [cropperImageSrc, setCropperImageSrc] = useState<string>('')
  const [cropType, setCropType] = useState<'avatar' | 'cover'>('avatar')
  const [_isUploading, setIsUploading] = useState(false)

  // 手機版 TagsBottomSheet 狀態
  const [tagsBottomSheetOpen, setTagsBottomSheetOpen] = useState(false)

  // Modal 狀態管理
  const [customTagModalOpen, setCustomTagModalOpen] = useState(false)
  const [customTagDimensionId, setCustomTagDimensionId] = useState<string | undefined>(undefined)
  const [customDimensionModalOpen, setCustomDimensionModalOpen] = useState(false)
  const [customOneLinerModalOpen, setCustomOneLinerModalOpen] = useState(false)
  const [customStoryModalOpen, setCustomStoryModalOpen] = useState(false)
  const [customStoryCategoryId, setCustomStoryCategoryId] = useState<string | undefined>(undefined)

  // 合併系統維度和用戶自訂維度（從 biography.custom_dimensions 初始化）
  const [customDimensions, setCustomDimensions] = useState<TagDimension[]>(
    () => biography.custom_dimensions || []
  )
  // 用戶為系統維度新增的自訂標籤（從 biography.custom_tags 初始化）
  const [customTagsForSystemDimensions, setCustomTagsForSystemDimensions] = useState<TagOption[]>(
    () => biography.custom_tags || []
  )
  const [customOneLinerQuestions, setCustomOneLinerQuestions] = useState<OneLinerQuestion[]>([])
  const [customStoryQuestions, setCustomStoryQuestions] = useState<StoryQuestion[]>([])

  // 所有維度（系統 + 自訂），並將用戶為系統維度新增的自訂標籤合併進去
  const allTagDimensions = useMemo(() => {
    // 將用戶自訂標籤合併到對應的系統維度
    const mergedSystemDimensions = tagDimensions.map((dim) => {
      const customTags = customTagsForSystemDimensions.filter(
        (tag) => tag.dimension_id === dim.id
      )
      if (customTags.length > 0) {
        return {
          ...dim,
          options: [...customTags, ...dim.options],
        }
      }
      return dim
    })
    return [...mergedSystemDimensions, ...customDimensions]
  }, [tagDimensions, customDimensions, customTagsForSystemDimensions])
  // 所有一句話問題（系統 + 自訂）
  const allOneLinerQuestions = [...oneLinerQuestions, ...customOneLinerQuestions]
  // 所有故事問題（系統 + 自訂）
  const allStoryQuestionsByCategory = { ...storyQuestionsByCategory }
  customStoryQuestions.forEach((q) => {
    const category = q.category_id as StoryCategory
    if (allStoryQuestionsByCategory[category]) {
      allStoryQuestionsByCategory[category] = [...allStoryQuestionsByCategory[category], q]
    }
  })

  // Section refs for scroll navigation
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  // Handle section click - scroll to section
  const handleSectionClick = useCallback((sectionId: string) => {
    setActiveSection(sectionId)
    const element = sectionRefs.current[sectionId]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  // 同步 biography.custom_tags 到 customTagsForSystemDimensions
  // 當 biography 從父組件更新時（例如初始載入或重新載入）
  // 使用 JSON.stringify 進行深度比較，避免因陣列引用變化導致不必要的更新
  const customTagsJson = JSON.stringify(biography.custom_tags || [])
  useEffect(() => {
    const parsed = JSON.parse(customTagsJson) as TagOption[]
    setCustomTagsForSystemDimensions(parsed)
  }, [customTagsJson])

  // 同步 biography.custom_dimensions 到 customDimensions
  const customDimensionsJson = JSON.stringify(biography.custom_dimensions || [])
  useEffect(() => {
    const parsed = JSON.parse(customDimensionsJson) as TagDimension[]
    setCustomDimensions(parsed)
  }, [customDimensionsJson])

  // 本地草稿管理
  // 使用本地 state 維護編輯中的草稿，避免儲存時覆蓋正在編輯的內容
  const [localBiography, setLocalBiography] = useState(biography)

  // 追蹤是否正在編輯和最後儲存的版本
  const isEditingRef = useRef(false)
  const lastSavedBiographyRef = useRef(biography)
  const isSavingRef = useRef(false)
  // 儲存請求 ID 計數器，用於追蹤版本
  const saveIdRef = useRef(0)
  // 當前正在進行的儲存 ID
  const currentSaveIdRef = useRef(0)
  // 是否需要再次儲存（當儲存進行中時有新的編輯）
  const needsAnotherSaveRef = useRef(false)
  // 重試計數
  const retryCountRef = useRef(0)
  // 追蹤最新的編輯內容（避免使用閉包捕獲的過期值）
  const latestBiographyRef = useRef(biography)
  // 追蹤組件是否已掛載（避免 unmount 後 setState）
  const isMountedRef = useRef(true)
  // 重試定時器 ref，用於取消過期的重試
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 組件掛載/卸載追蹤
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      // 清理重試定時器
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
      }
    }
  }, [])

  // 從 props 同步到本地草稿
  // 只在非編輯狀態且非儲存中時同步外部更新
  useEffect(() => {
    if (!isEditingRef.current && !isSavingRef.current) {
      setLocalBiography(biography)
      lastSavedBiographyRef.current = biography
      latestBiographyRef.current = biography
    }
  }, [biography])

  // 當 biography.id 變更時（例如切換用戶），強制同步並重置編輯狀態
  useEffect(() => {
    setLocalBiography(biography)
    lastSavedBiographyRef.current = biography
    latestBiographyRef.current = biography
    isEditingRef.current = false
    // 重置儲存相關的 refs
    saveIdRef.current = 0
    currentSaveIdRef.current = 0
    needsAnotherSaveRef.current = false
    retryCountRef.current = 0
    // 清理重試定時器
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
  }, [biography.id])

  // 自動儲存 - 使用 debounce，支援 maxWait
  const debouncedSave = useDebouncedCallback(
    async (bioToSave: BiographyV2) => {
      // 如果組件已卸載，取消儲存（額外保護，避免意外情況下 unmount 後發送請求）
      // 注意：useDebouncedCallback 已在 unmount 時清理 timers 不會 flush
      // 這裡的檢查是雙重保險
      if (!isMountedRef.current) {
        return
      }

      // 序列化儲存：如果已經有儲存正在進行中，標記需要再次儲存
      if (isSavingRef.current) {
        needsAnotherSaveRef.current = true
        return
      }

      // 遞增儲存 ID
      saveIdRef.current += 1
      const thisSaveId = saveIdRef.current

      try {
        isSavingRef.current = true
        currentSaveIdRef.current = thisSaveId
        // 只在組件已掛載時更新狀態
        if (isMountedRef.current) {
          setSaving()
        }
        await onSave(bioToSave)

        // 版本檢查：只有最新的儲存完成才更新狀態
        if (thisSaveId === saveIdRef.current) {
          lastSavedBiographyRef.current = bioToSave
          // 只在組件已掛載時更新狀態
          if (isMountedRef.current) {
            setSaved()
          }
          isEditingRef.current = false
          // 儲存成功，重置重試計數
          retryCountRef.current = 0
          // 清理重試定時器
          if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current)
            retryTimerRef.current = null
          }
        }
        // 如果不是最新的儲存（有更新的儲存請求產生），則忽略此次儲存結果
      } catch (err) {
        // 只在組件已掛載時更新狀態
        if (isMountedRef.current) {
          setError(err instanceof Error ? err.message : '儲存失敗')
        }
        // 儲存失敗時保持編輯狀態，防止外部資料覆蓋用戶編輯
        // isEditingRef.current 保持為 true，確保用戶編輯的內容不會丟失

        // 自動重試機制（最多 3 次，指數退避）
        retryCountRef.current += 1
        if (retryCountRef.current <= 3) {
          const retryDelay = 2000 * retryCountRef.current // 2s, 4s, 6s
          // 清理舊的重試定時器
          if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current)
          }
          // 重試時使用最新的草稿，而不是失敗那次的舊資料
          retryTimerRef.current = setTimeout(() => {
            // 檢查版本：只有當這次儲存仍然是最新時才重試
            if (thisSaveId === saveIdRef.current && isMountedRef.current) {
              debouncedSave(latestBiographyRef.current)
            }
          }, retryDelay)
        }
      } finally {
        isSavingRef.current = false

        // 檢查是否需要再次儲存（儲存進行中時有新的編輯）
        if (needsAnotherSaveRef.current) {
          needsAnotherSaveRef.current = false
          // 先調用 debouncedSave 更新 latestArgsRef，然後立即 flush 執行
          // 這樣確保 flush 使用的是最新的資料
          debouncedSave(latestBiographyRef.current)
          debouncedSave.flush()
        }
      }
    },
    {
      delay: 5000,      // 停止輸入 5 秒後儲存
      maxWait: 15000    // 持續編輯也至少每 15 秒儲存一次
    }
  )

  // Handle changes - 樂觀更新
  const handleChange = useCallback(
    (updates: Partial<BiographyV2>) => {
      setLocalBiography((prev) => {
        const newBio = { ...prev, ...updates }

        // 同步更新最新草稿 ref（確保 finally 區塊和重試使用最新資料）
        latestBiographyRef.current = newBio

        // 標記為編輯中
        isEditingRef.current = true

        // 立即通知父組件（樂觀更新，不等待儲存）
        onChange(updates)

        // 觸發防抖儲存
        debouncedSave(newBio)

        return newBio
      })
    },
    [onChange, debouncedSave]
  )

  // 處理頭像選擇 - 開啟裁切器
  const handleAvatarSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    setCropperImageSrc(url)
    setCropType('avatar')
    setShowCropper(true)
  }, [])

  // 處理封面選擇 - 開啟裁切器
  const handleCoverSelect = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    setCropperImageSrc(url)
    setCropType('cover')
    setShowCropper(true)
  }, [])

  // 裁切器關閉時清理 blob URL
  const handleCropperClose = useCallback(() => {
    setShowCropper(false)
    if (cropperImageSrc && cropperImageSrc.startsWith('blob:')) {
      URL.revokeObjectURL(cropperImageSrc)
      setCropperImageSrc('')
    }
  }, [cropperImageSrc])

  // 處理裁切完成 - 上傳圖片
  const handleCropComplete = useCallback(async (croppedFile: File) => {
    setIsUploading(true)
    try {
      const response = await biographyService.uploadImage(croppedFile,
        cropType === 'avatar' ? localBiography.avatar_url || undefined : localBiography.cover_url || undefined
      )

      if (response.success && response.data) {
        const permanentUrl = response.data.url
        if (cropType === 'avatar') {
          handleChange({ avatar_url: permanentUrl })
        } else {
          handleChange({ cover_url: permanentUrl })
        }
        // 立即執行儲存，避免使用者重新整理時遺失圖片
        debouncedSave.flush()
        toast({
          title: '上傳成功',
          description: cropType === 'avatar' ? '頭像已更新' : '封面圖片已更新',
        })
      } else {
        throw new Error('上傳失敗')
      }
    } catch (err) {
      console.error('圖片上傳失敗:', err)
      toast({
        title: '上傳失敗',
        description: err instanceof Error ? err.message : '請稍後再試',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      // 清理 blob URL
      if (cropperImageSrc && cropperImageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(cropperImageSrc)
        setCropperImageSrc('')
      }
    }
  }, [cropType, localBiography.avatar_url, localBiography.cover_url, handleChange, toast, cropperImageSrc, debouncedSave])

  // Handle custom tag modal
  const handleAddCustomTag = useCallback((dimensionId?: string) => {
    setCustomTagDimensionId(dimensionId)
    setCustomTagModalOpen(true)
  }, [])

  const handleSaveCustomTag = useCallback((tag: TagOption) => {
    // 將新標籤加入維度
    const dimensionId = tag.dimension_id
    const dimension = allTagDimensions.find((d) => d.id === dimensionId)
    if (dimension) {
      // 自動選中新增的標籤
      const otherTags = localBiography.tags.filter((t) => {
        const dim = allTagDimensions.find((d) =>
          d.options.some((o) => o.id === t.tag_id)
        )
        return dim?.id !== dimensionId
      })
      const currentDimensionTags = localBiography.tags.filter((t) => {
        const dim = allTagDimensions.find((d) =>
          d.options.some((o) => o.id === t.tag_id)
        )
        return dim?.id === dimensionId
      })
      const newTags = [
        ...otherTags,
        ...currentDimensionTags,
        { tag_id: tag.id, source: 'user' as const },
      ]

      // 根據維度來源決定如何儲存自訂標籤
      if (dimension.source === 'user') {
        // 用戶自訂維度：更新該維度的 options 並同步到 localBiography.custom_dimensions
        const newCustomDimensions = customDimensions.map((d) =>
          d.id === dimensionId
            ? { ...d, options: [...d.options, tag] }
            : d
        )
        setCustomDimensions(newCustomDimensions)
        handleChange({ tags: newTags, custom_dimensions: newCustomDimensions })
      } else {
        // 系統維度：將標籤加入 customTagsForSystemDimensions 並同步到 localBiography.custom_tags
        const newCustomTags = [...customTagsForSystemDimensions, tag]
        setCustomTagsForSystemDimensions(newCustomTags)
        handleChange({ tags: newTags, custom_tags: newCustomTags })
      }
      // 立即執行儲存，避免使用者重新整理時遺失新增的標籤
      debouncedSave.flush()
    }
    setCustomTagModalOpen(false)
  }, [allTagDimensions, localBiography.tags, customDimensions, customTagsForSystemDimensions, handleChange, debouncedSave])

  // Handle custom dimension modal
  const handleAddCustomDimension = useCallback(() => {
    setCustomDimensionModalOpen(true)
  }, [])

  const handleSaveCustomDimension = useCallback((dimension: TagDimension) => {
    const newCustomDimensions = [...customDimensions, dimension]
    setCustomDimensions(newCustomDimensions)
    handleChange({ custom_dimensions: newCustomDimensions })
    // 立即執行儲存，避免使用者重新整理時遺失新增的維度
    debouncedSave.flush()
    setCustomDimensionModalOpen(false)
  }, [customDimensions, handleChange, debouncedSave])

  // Handle custom one-liner modal
  const handleAddCustomOneLiner = useCallback(() => {
    setCustomOneLinerModalOpen(true)
  }, [])

  const handleSaveCustomOneLiner = useCallback((question: OneLinerQuestion) => {
    setCustomOneLinerQuestions((prev) => [...prev, question])
    setCustomOneLinerModalOpen(false)
  }, [])

  // Handle custom story modal
  const handleAddCustomStory = useCallback((categoryId?: string) => {
    setCustomStoryCategoryId(categoryId)
    setCustomStoryModalOpen(true)
  }, [])

  const handleSaveCustomStory = useCallback((question: StoryQuestion) => {
    setCustomStoryQuestions((prev) => [...prev, question])
    setCustomStoryModalOpen(false)
  }, [])

  // Calculate progress
  const sections = [
    {
      id: 'basic',
      label: '基本資料',
      icon: User,
      isCompleted: !!localBiography.name,
    },
    {
      id: 'tags',
      label: '身份標籤',
      icon: Tag,
      isCompleted: localBiography.tags.length > 0,
      progress: {
        completed: localBiography.tags.length,
        total: tagDimensions.length * 2, // Rough estimate
      },
    },
    {
      id: 'oneliners',
      label: '快問快答',
      icon: MessageCircle,
      isCompleted: localBiography.one_liners.some((o) => o.answer?.trim()),
      progress: {
        completed: localBiography.one_liners.filter((o) => o.answer?.trim()).length,
        total: oneLinerQuestions.length,
      },
    },
    {
      id: 'stories',
      label: '深度故事',
      icon: BookOpen,
      isCompleted: localBiography.stories.some((s) => s.content?.trim()),
      progress: {
        completed: localBiography.stories.filter((s) => s.content?.trim()).length,
        total: Object.values(storyQuestionsByCategory).flat().length,
      },
    },
    {
      id: 'footprints',
      label: '攀岩足跡',
      icon: Globe,
      isCompleted:
        (localBiography.frequent_locations && localBiography.frequent_locations.length > 0) ||
        !!localBiography.home_gym,
    },
  ]

  const overallProgress = Math.round(
    (sections.filter((s) => s.isCompleted).length / sections.length) * 100
  )

  // Get current editing story question
  const editingQuestion = editingStoryId
    ? Object.values(allStoryQuestionsByCategory)
      .flat()
      .find((q) => q.id === editingStoryId)
    : null
  const editingStory = editingStoryId
    ? localBiography.stories.find((s) => s.question_id === editingStoryId)
    : null

  return (
    <div className={cn('min-h-screen bg-[#F5F5F5]', className)}>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-[#1B1A1A]">編輯人物誌</h1>
            <AutoSaveIndicator
              status={status}
              lastSavedAt={lastSavedAt}
              error={error}
            />
          </div>

          {/* Privacy Settings */}
          <PrivacyBanner
            visibility={localBiography.visibility}
            onVisibilityChange={(visibility) => handleChange({ visibility })}
          />
        </div>

        {/* Desktop Layout: Sidebar + Content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar: Progress (Desktop only) */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-6">
              <ProgressIndicator
                sections={sections}
                activeSection={activeSection}
                onSectionClick={handleSectionClick}
              />
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-6">
            {/* Basic Info */}
            <section
              id="basic"
              ref={(el) => { sectionRefs.current['basic'] = el }}
              className="bg-white rounded-xl p-4 md:p-6"
            >
              <BasicInfoSection
                name={localBiography.name}
                onNameChange={(name) => handleChange({ name })}
                title={localBiography.title}
                onTitleChange={(title) => handleChange({ title })}
                avatarUrl={localBiography.avatar_url}
                onAvatarChange={handleAvatarSelect}
                coverUrl={localBiography.cover_url}
                onCoverChange={handleCoverSelect}
                climbingStartYear={localBiography.climbing_start_year}
                onClimbingStartYearChange={(year) => {
                  const climbingYears = year ? new Date().getFullYear() - year : null
                  handleChange({ climbing_start_year: year, climbing_years: climbingYears })
                }}
                frequentLocations={localBiography.frequent_locations || []}
                onFrequentLocationsChange={(locations) => handleChange({ frequent_locations: locations })}
                favoriteRouteTypes={localBiography.favorite_route_types || []}
                onFavoriteRouteTypesChange={(types) => handleChange({ favorite_route_types: types })}
                socialLinks={localBiography.social_links || {}}
                onSocialLinksChange={(socialLinks) => handleChange({ social_links: socialLinks })}
              />
            </section>

            {/* Tags */}
            <section
              id="tags"
              ref={(el) => { sectionRefs.current['tags'] = el }}
              className="bg-white rounded-xl p-4 md:p-6"
            >
              <TagsSection
                dimensions={allTagDimensions}
                selections={localBiography.tags.reduce(
                  (acc, tag) => {
                    const dimension = allTagDimensions.find((d) =>
                      d.options.some((o) => o.id === tag.tag_id)
                    )
                    if (dimension) {
                      if (!acc[dimension.id]) {
                        acc[dimension.id] = []
                      }
                      acc[dimension.id].push(tag.tag_id)
                    }
                    return acc
                  },
                  {} as Record<string, string[]>
                )}
                onSelectionChange={(dimensionId, selectedIds) => {
                  const otherTags = localBiography.tags.filter((t) => {
                    const dim = allTagDimensions.find((d) =>
                      d.options.some((o) => o.id === t.tag_id)
                    )
                    return dim?.id !== dimensionId
                  })
                  const newTags = selectedIds.map((id) => ({
                    tag_id: id,
                    source: 'system' as const,
                  }))
                  handleChange({ tags: [...otherTags, ...newTags] })
                }}
                onAddCustomTag={handleAddCustomTag}
                onAddCustomDimension={handleAddCustomDimension}
                isMobile={isMobile}
                onOpenBottomSheet={() => setTagsBottomSheetOpen(true)}
              />
            </section>

            {/* One-liners */}
            <section
              id="oneliners"
              ref={(el) => { sectionRefs.current['oneliners'] = el }}
              className="bg-white rounded-xl p-4 md:p-6"
            >
              <OneLinersSection
                questions={allOneLinerQuestions}
                answers={localBiography.one_liners}
                onAnswerChange={(questionId, answer) => {
                  const existingIndex = localBiography.one_liners.findIndex(
                    (o) => o.question_id === questionId
                  )
                  let newOneLiners = [...localBiography.one_liners]
                  if (existingIndex >= 0) {
                    if (answer) {
                      newOneLiners[existingIndex] = {
                        ...newOneLiners[existingIndex],
                        answer,
                      }
                    } else {
                      newOneLiners.splice(existingIndex, 1)
                    }
                  } else if (answer) {
                    const question = allOneLinerQuestions.find((q) => q.id === questionId)
                    newOneLiners.push({
                      question_id: questionId,
                      answer,
                      source: question?.source || 'system',
                    })
                  }
                  handleChange({ one_liners: newOneLiners })
                }}
                onAddCustomQuestion={handleAddCustomOneLiner}
              />
            </section>

            {/* Stories */}
            <section
              id="stories"
              ref={(el) => { sectionRefs.current['stories'] = el }}
              className="bg-white rounded-xl p-4 md:p-6"
            >
              <StoriesSection
                questionsByCategory={allStoryQuestionsByCategory}
                stories={localBiography.stories}
                onStoryClick={(questionId) => setEditingStoryId(questionId)}
                onAddCustomQuestion={(category) => handleAddCustomStory(category)}
              />
            </section>

            {/* Climbing Footprints */}
            <section
              id="footprints"
              ref={(el) => { sectionRefs.current['footprints'] = el }}
              className="bg-white rounded-xl p-4 md:p-6"
            >
              <ClimbingFootprintsEditorSection />
            </section>
          </main>
        </div>

        {/* Spacer for fixed bottom bar */}
        <BottomBarSpacer />
      </div>

      {/* Fixed Bottom Bar */}
      <FixedBottomBar
        saveStatus={status}
        previewHref={previewHref}
        onPublish={onPublish}
        canPublish={overallProgress > 0}
        progress={overallProgress}
      />

      {/* Story Edit Modal - 桌面版 */}
      {!isMobile && (
        <StoryEditModal
          isOpen={!!editingStoryId}
          onClose={() => setEditingStoryId(null)}
          question={editingQuestion || null}
          story={editingStory}
          onSave={(content) => {
            if (!editingStoryId) return
            const existingIndex = localBiography.stories.findIndex(
              (s) => s.question_id === editingStoryId
            )
            let newStories = [...localBiography.stories]
            if (existingIndex >= 0) {
              newStories[existingIndex] = {
                ...newStories[existingIndex],
                content,
              }
            } else {
              const question = editingQuestion
              newStories.push({
                question_id: editingStoryId,
                content,
                source: question?.source || 'system',
              })
            }
            handleChange({ stories: newStories })
            // 用戶點擊儲存按鈕時，立即執行儲存而不等待 debounce
            debouncedSave.flush()
            setEditingStoryId(null)
          }}
          onDelete={() => {
            if (!editingStoryId) return
            const newStories = localBiography.stories.filter(
              (s) => s.question_id !== editingStoryId
            )
            handleChange({ stories: newStories })
            // 立即執行儲存，避免使用者重新整理時遺失刪除操作
            debouncedSave.flush()
            setEditingStoryId(null)
          }}
        />
      )}

      {/* Story Edit Fullscreen - 手機版 */}
      {isMobile && (
        <StoryEditFullscreen
          isOpen={!!editingStoryId}
          onClose={() => setEditingStoryId(null)}
          question={editingQuestion || null}
          story={editingStory}
          onSave={(content) => {
            if (!editingStoryId) return
            const existingIndex = localBiography.stories.findIndex(
              (s) => s.question_id === editingStoryId
            )
            let newStories = [...localBiography.stories]
            if (existingIndex >= 0) {
              newStories[existingIndex] = {
                ...newStories[existingIndex],
                content,
              }
            } else {
              const question = editingQuestion
              newStories.push({
                question_id: editingStoryId,
                content,
                source: question?.source || 'system',
              })
            }
            handleChange({ stories: newStories })
            // 用戶點擊儲存按鈕時，立即執行儲存而不等待 debounce
            debouncedSave.flush()
            setEditingStoryId(null)
          }}
          onDelete={() => {
            if (!editingStoryId) return
            const newStories = localBiography.stories.filter(
              (s) => s.question_id !== editingStoryId
            )
            handleChange({ stories: newStories })
            // 立即執行儲存，避免使用者重新整理時遺失刪除操作
            debouncedSave.flush()
            setEditingStoryId(null)
          }}
        />
      )}

      {/* Tags Bottom Sheet - 手機版 */}
      <TagsBottomSheet
        isOpen={tagsBottomSheetOpen}
        onClose={() => setTagsBottomSheetOpen(false)}
        dimensions={allTagDimensions}
        selections={localBiography.tags.reduce(
          (acc, tag) => {
            const dimension = allTagDimensions.find((d) =>
              d.options.some((o) => o.id === tag.tag_id)
            )
            if (dimension) {
              if (!acc[dimension.id]) {
                acc[dimension.id] = []
              }
              acc[dimension.id].push(tag.tag_id)
            }
            return acc
          },
          {} as Record<string, string[]>
        )}
        onSelectionChange={(dimensionId, selectedIds) => {
          const otherTags = localBiography.tags.filter((t) => {
            const dim = allTagDimensions.find((d) =>
              d.options.some((o) => o.id === t.tag_id)
            )
            return dim?.id !== dimensionId
          })
          const newTags = selectedIds.map((id) => ({
            tag_id: id,
            source: 'system' as const,
          }))
          handleChange({ tags: [...otherTags, ...newTags] })
        }}
        onAddCustomTag={handleAddCustomTag}
        onAddCustomDimension={handleAddCustomDimension}
      />

      {/* Custom Tag Modal */}
      <AddCustomTagModal
        isOpen={customTagModalOpen}
        onClose={() => setCustomTagModalOpen(false)}
        dimensions={allTagDimensions}
        defaultDimensionId={customTagDimensionId}
        onSave={handleSaveCustomTag}
      />

      {/* Custom Dimension Modal */}
      <AddCustomDimensionModal
        isOpen={customDimensionModalOpen}
        onClose={() => setCustomDimensionModalOpen(false)}
        onSave={handleSaveCustomDimension}
      />

      {/* Custom One-liner Modal */}
      <AddCustomOneLinerModal
        isOpen={customOneLinerModalOpen}
        onClose={() => setCustomOneLinerModalOpen(false)}
        onSave={handleSaveCustomOneLiner}
      />

      {/* Custom Story Modal */}
      <AddCustomStoryModal
        isOpen={customStoryModalOpen}
        onClose={() => setCustomStoryModalOpen(false)}
        defaultCategoryId={customStoryCategoryId}
        onSave={handleSaveCustomStory}
      />

      {/* 圖片裁切器 */}
      <ImageCropper
        open={showCropper}
        onClose={handleCropperClose}
        imageSrc={cropperImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={cropType === 'avatar' ? 1 : 3}
        title={cropType === 'avatar' ? '裁切頭像' : '裁切封面圖片'}
        outputSize={cropType === 'avatar' ? 400 : 1200}
      />
    </div>
  )
}

export default ProfileEditor
