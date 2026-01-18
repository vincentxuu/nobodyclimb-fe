'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { cn } from '@/lib/utils'
import { User, Tag, MessageCircle, BookOpen, Globe } from 'lucide-react'
import type {
  BiographyV2,
  TagDimension,
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
    ? Object.values(storyQuestionsByCategory)
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
                onAvatarChange={(file) => {
                  // TODO: Upload avatar
                  const url = URL.createObjectURL(file)
                  handleChange({ avatar_url: url })
                }}
                coverUrl={biography.cover_url}
                onCoverChange={(file) => {
                  // TODO: Upload cover
                  const url = URL.createObjectURL(file)
                  handleChange({ cover_url: url })
                }}
                climbingStartYear={biography.climbing_start_year}
                onClimbingStartYearChange={(year) => {
                  const climbingYears = year ? new Date().getFullYear() - year : null
                  handleChange({ climbing_start_year: year, climbing_years: climbingYears })
                }}
                homeGym={biography.home_gym}
                onHomeGymChange={(gym) => handleChange({ home_gym: gym })}
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
                dimensions={tagDimensions}
                selections={biography.tags.reduce(
                  (acc, tag) => {
                    const dimension = tagDimensions.find((d) =>
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
                    const dim = tagDimensions.find((d) =>
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
              />
            </section>

            {/* One-liners */}
            <section
              id="oneliners"
              ref={(el) => { sectionRefs.current['oneliners'] = el }}
              className="bg-white rounded-xl p-4 md:p-6"
            >
              <OneLinersSection
                questions={oneLinerQuestions}
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
                    newOneLiners.push({
                      question_id: questionId,
                      answer,
                      source: 'system',
                    })
                  }
                  handleChange({ one_liners: newOneLiners })
                }}
              />
            </section>

            {/* Stories */}
            <section
              id="stories"
              ref={(el) => { sectionRefs.current['stories'] = el }}
              className="bg-white rounded-xl p-4 md:p-6"
            >
              <StoriesSection
                questionsByCategory={storyQuestionsByCategory}
                stories={biography.stories}
                onStoryClick={(questionId) => setEditingStoryId(questionId)}
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

      {/* Story Edit Modal */}
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
            newStories.push({
              question_id: editingStoryId,
              content,
              source: 'system',
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
    </div>
  )
}

export default ProfileEditor
