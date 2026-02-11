'use client'

import { useState, useCallback, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { User, Tag, MessageCircle, BookOpen, Globe } from 'lucide-react'
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
import UnsavedChangesPrompt from '@/components/shared/unsaved-changes-prompt'

// Custom hooks
import {
  useImageCropper,
  useEditorModals,
  useCustomContent,
  useAutoSaveBiography,
} from './hooks'

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
  const [activeSection, setActiveSection] = useState<string>('basic')
  const { status, lastSavedAt, error, setSaving, setSaved, setError } = useSaveStatus()
  const isMobile = useIsMobile()

  // Section refs for scroll navigation
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  // Auto-save hook
  const { localBiography, hasUnsavedChanges, handleChange, flushSave } = useAutoSaveBiography({
    biography,
    onChange,
    onSave,
    setSaving,
    setSaved,
    setError,
  })

  // Image cropper hook
  const imageCropper = useImageCropper({
    avatarUrl: localBiography.avatar_url,
    coverUrl: localBiography.cover_url,
    onAvatarChange: (url) => handleChange({ avatar_url: url }),
    onCoverChange: (url) => handleChange({ cover_url: url }),
    onFlushSave: flushSave,
  })

  // Modals hook
  const modals = useEditorModals()

  // Custom content hook
  const customContent = useCustomContent({
    biography,
    tagDimensions,
    oneLinerQuestions,
    storyQuestionsByCategory,
    onSaveCustomTag: (tag, isUserDimension, newCustomDimensions, newCustomTags) => {
      // 自動選中新增的標籤
      const dimensionId = tag.dimension_id
      const otherTags = localBiography.tags.filter((t) => {
        const dim = customContent.allTagDimensions.find((d) =>
          d.options.some((o) => o.id === t.tag_id)
        )
        return dim?.id !== dimensionId
      })
      const currentDimensionTags = localBiography.tags.filter((t) => {
        const dim = customContent.allTagDimensions.find((d) =>
          d.options.some((o) => o.id === t.tag_id)
        )
        return dim?.id === dimensionId
      })
      const newTags = [
        ...otherTags,
        ...currentDimensionTags,
        { tag_id: tag.id, source: 'user' as const },
      ]

      if (isUserDimension && newCustomDimensions) {
        handleChange({ tags: newTags, custom_dimensions: newCustomDimensions })
      } else if (newCustomTags) {
        handleChange({ tags: newTags, custom_tags: newCustomTags })
      }
      flushSave()
      modals.closeCustomTagModal()
    },
    onSaveCustomDimension: (_dimension, newCustomDimensions) => {
      handleChange({ custom_dimensions: newCustomDimensions })
      flushSave()
      modals.closeCustomDimensionModal()
    },
  })

  // Handle section click - scroll to section
  const handleSectionClick = useCallback((sectionId: string) => {
    setActiveSection(sectionId)
    const element = sectionRefs.current[sectionId]
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  // Handle tag selection change
  const handleTagSelectionChange = useCallback(
    (dimensionId: string, selectedIds: string[]) => {
      const otherTags = localBiography.tags.filter((t) => {
        const dim = customContent.allTagDimensions.find((d) =>
          d.options.some((o) => o.id === t.tag_id)
        )
        return dim?.id !== dimensionId
      })
      const newTags = selectedIds.map((id) => {
        const option = customContent.allTagDimensions
          .find((d) => d.id === dimensionId)
          ?.options.find((o) => o.id === id)
        return {
          tag_id: id,
          source: option?.source || 'system',
        }
      })
      handleChange({ tags: [...otherTags, ...newTags] })
    },
    [localBiography.tags, customContent.allTagDimensions, handleChange]
  )

  // Handle one-liner answer change
  const handleOneLinerChange = useCallback(
    (questionId: string, answer: string | null) => {
      const existingIndex = localBiography.one_liners.findIndex(
        (o) => o.question_id === questionId
      )
      let newOneLiners = [...localBiography.one_liners]
      if (existingIndex >= 0) {
        if (answer) {
          newOneLiners[existingIndex] = { ...newOneLiners[existingIndex], answer }
        } else {
          newOneLiners.splice(existingIndex, 1)
        }
      } else if (answer) {
        const question = customContent.allOneLinerQuestions.find((q) => q.id === questionId)
        newOneLiners.push({
          question_id: questionId,
          answer,
          source: question?.source || 'system',
        })
      }
      handleChange({ one_liners: newOneLiners })
    },
    [localBiography.one_liners, customContent.allOneLinerQuestions, handleChange]
  )

  // Handle story save
  const handleStorySave = useCallback(
    (content: string) => {
      if (!modals.editingStoryId) return
      const existingIndex = localBiography.stories.findIndex(
        (s) => s.question_id === modals.editingStoryId
      )
      let newStories = [...localBiography.stories]
      if (existingIndex >= 0) {
        newStories[existingIndex] = { ...newStories[existingIndex], content }
      } else {
        const question = Object.values(customContent.allStoryQuestionsByCategory)
          .flat()
          .find((q) => q.id === modals.editingStoryId)
        newStories.push({
          question_id: modals.editingStoryId,
          content,
          source: question?.source || 'system',
        })
      }
      handleChange({ stories: newStories })
      flushSave()
      modals.closeStoryEditor()
    },
    [modals.editingStoryId, localBiography.stories, customContent.allStoryQuestionsByCategory, handleChange, flushSave, modals]
  )

  // Handle story delete
  const handleStoryDelete = useCallback(() => {
    if (!modals.editingStoryId) return
    const newStories = localBiography.stories.filter(
      (s) => s.question_id !== modals.editingStoryId
    )
    handleChange({ stories: newStories })
    flushSave()
    modals.closeStoryEditor()
  }, [modals.editingStoryId, localBiography.stories, handleChange, flushSave, modals])

  // Calculate tag selections for TagsSection
  const tagSelections = useMemo(() => {
    return localBiography.tags.reduce(
      (acc, tag) => {
        const dimension = customContent.allTagDimensions.find((d) =>
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
    )
  }, [localBiography.tags, customContent.allTagDimensions])

  // Calculate progress sections
  const sections = useMemo(
    () => [
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
          total: tagDimensions.length * 2,
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
    ],
    [localBiography, tagDimensions.length, oneLinerQuestions.length, storyQuestionsByCategory]
  )

  const overallProgress = Math.round(
    (sections.filter((s) => s.isCompleted).length / sections.length) * 100
  )

  // Get current editing story
  const editingQuestion = modals.editingStoryId
    ? Object.values(customContent.allStoryQuestionsByCategory)
        .flat()
        .find((q) => q.id === modals.editingStoryId)
    : null
  const editingStory = modals.editingStoryId
    ? localBiography.stories.find((s) => s.question_id === modals.editingStoryId)
    : null

  return (
    <div className={cn('min-h-screen bg-[#F5F5F5]', className)}>
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-[#1B1A1A]">編輯人物誌</h1>
            <AutoSaveIndicator status={status} lastSavedAt={lastSavedAt} error={error} />
          </div>
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
              ref={(el) => {
                sectionRefs.current['basic'] = el
              }}
              className="bg-white rounded-lg p-4 md:p-6"
            >
              <BasicInfoSection
                name={localBiography.name}
                onNameChange={(name) => handleChange({ name })}
                title={localBiography.title}
                onTitleChange={(title) => handleChange({ title })}
                avatarUrl={localBiography.avatar_url}
                onAvatarChange={imageCropper.handleAvatarSelect}
                coverUrl={localBiography.cover_url}
                onCoverChange={imageCropper.handleCoverSelect}
                climbingStartYear={localBiography.climbing_start_year}
                onClimbingStartYearChange={(year) => {
                  const climbingYears = year ? new Date().getFullYear() - year : null
                  handleChange({ climbing_start_year: year, climbing_years: climbingYears })
                }}
                frequentLocations={localBiography.frequent_locations || []}
                onFrequentLocationsChange={(locations) =>
                  handleChange({ frequent_locations: locations })
                }
                favoriteRouteTypes={localBiography.favorite_route_types || []}
                onFavoriteRouteTypesChange={(types) =>
                  handleChange({ favorite_route_types: types })
                }
                socialLinks={localBiography.social_links || {}}
                onSocialLinksChange={(socialLinks) => handleChange({ social_links: socialLinks })}
              />
            </section>

            {/* Tags */}
            <section
              id="tags"
              ref={(el) => {
                sectionRefs.current['tags'] = el
              }}
              className="bg-white rounded-lg p-4 md:p-6"
            >
              <TagsSection
                dimensions={customContent.allTagDimensions}
                selections={tagSelections}
                onSelectionChange={handleTagSelectionChange}
                onAddCustomTag={modals.openCustomTagModal}
                onAddCustomDimension={modals.openCustomDimensionModal}
                isMobile={isMobile}
                onOpenBottomSheet={modals.openTagsBottomSheet}
              />
            </section>

            {/* One-liners */}
            <section
              id="oneliners"
              ref={(el) => {
                sectionRefs.current['oneliners'] = el
              }}
              className="bg-white rounded-lg p-4 md:p-6"
            >
              <OneLinersSection
                questions={customContent.allOneLinerQuestions}
                answers={localBiography.one_liners}
                onAnswerChange={handleOneLinerChange}
                onAddCustomQuestion={modals.openCustomOneLinerModal}
              />
            </section>

            {/* Stories */}
            <section
              id="stories"
              ref={(el) => {
                sectionRefs.current['stories'] = el
              }}
              className="bg-white rounded-lg p-4 md:p-6"
            >
              <StoriesSection
                questionsByCategory={customContent.allStoryQuestionsByCategory}
                stories={localBiography.stories}
                onStoryClick={modals.openStoryEditor}
                onAddCustomQuestion={modals.openCustomStoryModal}
              />
            </section>

            {/* Climbing Footprints */}
            <section
              id="footprints"
              ref={(el) => {
                sectionRefs.current['footprints'] = el
              }}
              className="bg-white rounded-lg p-4 md:p-6"
            >
              <ClimbingFootprintsEditorSection />
            </section>
          </main>
        </div>

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
          isOpen={!!modals.editingStoryId}
          onClose={modals.closeStoryEditor}
          question={editingQuestion || null}
          story={editingStory}
          onSave={handleStorySave}
          onDelete={handleStoryDelete}
        />
      )}

      {/* Story Edit Fullscreen - 手機版 */}
      {isMobile && (
        <StoryEditFullscreen
          isOpen={!!modals.editingStoryId}
          onClose={modals.closeStoryEditor}
          question={editingQuestion || null}
          story={editingStory}
          onSave={handleStorySave}
          onDelete={handleStoryDelete}
        />
      )}

      {/* Tags Bottom Sheet - 手機版 */}
      <TagsBottomSheet
        isOpen={modals.tagsBottomSheetOpen}
        onClose={modals.closeTagsBottomSheet}
        dimensions={customContent.allTagDimensions}
        selections={tagSelections}
        onSelectionChange={handleTagSelectionChange}
        onAddCustomTag={modals.openCustomTagModal}
        onAddCustomDimension={modals.openCustomDimensionModal}
      />

      {/* Custom Tag Modal */}
      <AddCustomTagModal
        isOpen={modals.customTagModalOpen}
        onClose={modals.closeCustomTagModal}
        dimensions={customContent.allTagDimensions}
        defaultDimensionId={modals.customTagDimensionId}
        onSave={customContent.handleSaveCustomTag}
      />

      {/* Custom Dimension Modal */}
      <AddCustomDimensionModal
        isOpen={modals.customDimensionModalOpen}
        onClose={modals.closeCustomDimensionModal}
        onSave={customContent.handleSaveCustomDimension}
      />

      {/* Custom One-liner Modal */}
      <AddCustomOneLinerModal
        isOpen={modals.customOneLinerModalOpen}
        onClose={modals.closeCustomOneLinerModal}
        onSave={customContent.handleSaveCustomOneLiner}
      />

      {/* Custom Story Modal */}
      <AddCustomStoryModal
        isOpen={modals.customStoryModalOpen}
        onClose={modals.closeCustomStoryModal}
        defaultCategoryId={modals.customStoryCategoryId}
        onSave={customContent.handleSaveCustomStory}
      />

      {/* 圖片裁切器 */}
      <ImageCropper
        open={imageCropper.showCropper}
        onClose={imageCropper.handleCropperClose}
        imageSrc={imageCropper.cropperImageSrc}
        onCropComplete={imageCropper.handleCropComplete}
        aspectRatio={imageCropper.cropType === 'avatar' ? 1 : 3}
        title={imageCropper.cropType === 'avatar' ? '裁切頭像' : '裁切封面圖片'}
        outputSize={imageCropper.cropType === 'avatar' ? 400 : 1200}
      />

      <UnsavedChangesPrompt
        when={hasUnsavedChanges}
        title="尚未儲存"
        message="尚有未儲存的變更，確定要離開嗎？"
        confirmText="離開"
        cancelText="留下"
      />
    </div>
  )
}

export default ProfileEditor
