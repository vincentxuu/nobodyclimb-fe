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
import { SYSTEM_STORY_CATEGORY_LIST } from '@/lib/constants/biography-questions'
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

  // 合併系統維度和用戶自訂維度
  const [customDimensions, setCustomDimensions] = useState<TagDimension[]>([])
  const [customOneLinerQuestions, setCustomOneLinerQuestions] = useState<OneLinerQuestion[]>([])
  const [customStoryQuestions, setCustomStoryQuestions] = useState<StoryQuestion[]>([])

  // 所有維度（系統 + 自訂）
  const allTagDimensions = useMemo(
    () => [...tagDimensions, ...customDimensions],
    [tagDimensions, customDimensions]
  )
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

  // Auto-save with debounce
  const [pendingChanges, setPendingChanges] = useState(false)

  useEffect(() => {
    if (!pendingChanges) return

    const timer = setTimeout(async () => {
      try {
        setSaving()
        await onSave(biography)
        setSaved()
        setPendingChanges(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : '儲存失敗')
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [biography, pendingChanges, onSave, setSaving, setSaved, setError])

  // Handle changes
  const handleChange = useCallback(
    (updates: Partial<BiographyV2>) => {
      onChange(updates)
      setPendingChanges(true)
    },
    [onChange]
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
        cropType === 'avatar' ? biography.avatar_url || undefined : biography.cover_url || undefined
      )

      if (response.success && response.data) {
        const permanentUrl = response.data.url
        if (cropType === 'avatar') {
          handleChange({ avatar_url: permanentUrl })
        } else {
          handleChange({ cover_url: permanentUrl })
        }
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
  }, [cropType, biography.avatar_url, biography.cover_url, handleChange, toast, cropperImageSrc])

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
      // 如果是用戶自訂維度，更新該維度
      if (dimension.source === 'user') {
        setCustomDimensions((prev) =>
          prev.map((d) =>
            d.id === dimensionId
              ? { ...d, options: [...d.options, tag] }
              : d
          )
        )
      }
      // 自動選中新增的標籤
      const otherTags = biography.tags.filter((t) => {
        const dim = allTagDimensions.find((d) =>
          d.options.some((o) => o.id === t.tag_id)
        )
        return dim?.id !== dimensionId
      })
      const currentDimensionTags = biography.tags.filter((t) => {
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
      handleChange({ tags: newTags })
    }
    setCustomTagModalOpen(false)
  }, [allTagDimensions, biography.tags, handleChange])

  // Handle custom dimension modal
  const handleAddCustomDimension = useCallback(() => {
    setCustomDimensionModalOpen(true)
  }, [])

  const handleSaveCustomDimension = useCallback((dimension: TagDimension) => {
    setCustomDimensions((prev) => [...prev, dimension])
    setCustomDimensionModalOpen(false)
  }, [])

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
      isCompleted: !!biography.name,
    },
    {
      id: 'tags',
      label: '身份標籤',
      icon: Tag,
      isCompleted: biography.tags.length > 0,
      progress: {
        completed: biography.tags.length,
        total: tagDimensions.length * 2, // Rough estimate
      },
    },
    {
      id: 'oneliners',
      label: '快問快答',
      icon: MessageCircle,
      isCompleted: biography.one_liners.some((o) => o.answer?.trim()),
      progress: {
        completed: biography.one_liners.filter((o) => o.answer?.trim()).length,
        total: oneLinerQuestions.length,
      },
    },
    {
      id: 'stories',
      label: '深度故事',
      icon: BookOpen,
      isCompleted: biography.stories.some((s) => s.content?.trim()),
      progress: {
        completed: biography.stories.filter((s) => s.content?.trim()).length,
        total: Object.values(storyQuestionsByCategory).flat().length,
      },
    },
    {
      id: 'footprints',
      label: '攀岩足跡',
      icon: Globe,
      isCompleted:
        (biography.frequent_locations && biography.frequent_locations.length > 0) ||
        !!biography.home_gym,
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
    ? biography.stories.find((s) => s.question_id === editingStoryId)
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
            visibility={biography.visibility}
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
                name={biography.name}
                onNameChange={(name) => handleChange({ name })}
                title={biography.title}
                onTitleChange={(title) => handleChange({ title })}
                avatarUrl={biography.avatar_url}
                onAvatarChange={handleAvatarSelect}
                coverUrl={biography.cover_url}
                onCoverChange={handleCoverSelect}
                climbingStartYear={biography.climbing_start_year}
                onClimbingStartYearChange={(year) => {
                  const climbingYears = year ? new Date().getFullYear() - year : null
                  handleChange({ climbing_start_year: year, climbing_years: climbingYears })
                }}
                frequentLocations={biography.frequent_locations || []}
                onFrequentLocationsChange={(locations) => handleChange({ frequent_locations: locations })}
                favoriteRouteTypes={biography.favorite_route_types || []}
                onFavoriteRouteTypesChange={(types) => handleChange({ favorite_route_types: types })}
                socialLinks={biography.social_links || {}}
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
                selections={biography.tags.reduce(
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
                  const otherTags = biography.tags.filter((t) => {
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
                answers={biography.one_liners}
                onAnswerChange={(questionId, answer) => {
                  const existingIndex = biography.one_liners.findIndex(
                    (o) => o.question_id === questionId
                  )
                  let newOneLiners = [...biography.one_liners]
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
                stories={biography.stories}
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
            const existingIndex = biography.stories.findIndex(
              (s) => s.question_id === editingStoryId
            )
            let newStories = [...biography.stories]
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
            setEditingStoryId(null)
          }}
          onDelete={() => {
            if (!editingStoryId) return
            const newStories = biography.stories.filter(
              (s) => s.question_id !== editingStoryId
            )
            handleChange({ stories: newStories })
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
            const existingIndex = biography.stories.findIndex(
              (s) => s.question_id === editingStoryId
            )
            let newStories = [...biography.stories]
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
            setEditingStoryId(null)
          }}
          onDelete={() => {
            if (!editingStoryId) return
            const newStories = biography.stories.filter(
              (s) => s.question_id !== editingStoryId
            )
            handleChange({ stories: newStories })
            setEditingStoryId(null)
          }}
        />
      )}

      {/* Tags Bottom Sheet - 手機版 */}
      <TagsBottomSheet
        isOpen={tagsBottomSheetOpen}
        onClose={() => setTagsBottomSheetOpen(false)}
        dimensions={allTagDimensions}
        selections={biography.tags.reduce(
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
          const otherTags = biography.tags.filter((t) => {
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
        categories={SYSTEM_STORY_CATEGORY_LIST}
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
