import { RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import type {
  OneLiner,
  OneLinerQuestion,
  BiographyV2 as PackageBiographyV2,
  SaveStatus,
  Story,
  StoryCategoryDefinition,
  StoryCategoryId,
  StoryQuestion,
  TagDimension,
  TagOption,
  VisibilityLevel,
} from '@nobodyclimb/types'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  Globe,
  MessageCircle,
  Plus,
  Tag,
  Target,
  Trash2,
  TrendingUp,
  User,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { XStack, YStack } from 'tamagui'
import {
  AddCustomDimensionModal,
  AddCustomOneLinerModal,
  AddCustomStoryModal,
  AddCustomTagModal,
  BasicInfoSection,
  BottomBarSpacer,
  FixedBottomBar,
  OneLinersSection,
  PrivacyBanner,
  ProgressIndicator,
  StoriesSection,
  StoryEditFullscreen,
  TagsBottomSheet,
  TagsSection,
  useCustomContent,
  useEditorModals,
  useImageCropper,
} from '@/components/biography/editor'
import { ClimbingFootprintsSection } from '@/components/profile'
import { EmptyState, Text } from '@/components/ui'
import { apiClient } from '@/lib/api'
import biographyService from '@/lib/biographyService'
import { SYSTEM_TAG_DIMENSION_LIST } from '@/lib/constants/biography-tags'
import { useQuestions } from '@/lib/hooks/useQuestions'
import { useAuthStore } from '@/store/authStore'

type GradeTarget = {
  year: number
  grade_system: 'boulder' | 'sport' | 'trad'
  grade: string
  target_count: number
  completed_count?: number
}

type EditorBiography = {
  id: string
  user_id: string | null
  slug: string
  name: string
  title: string | null
  bio: string | null
  avatar_url: string | null
  cover_url: string | null
  climbing_start_year: number | null
  climbing_years: number | null
  frequent_locations: string[] | null
  favorite_route_types: string[] | null
  home_gym: string | null
  height_cm: number | null
  arm_span_cm: number | null
  grade_targets: GradeTarget[] | null
  tags: Array<{ tag_id: string; source: 'system' | 'user' }>
  custom_tags?: TagOption[]
  custom_dimensions?: TagDimension[]
  one_liners: OneLiner[]
  stories: Story[]
  social_links: Record<string, string | undefined> | null
  visibility: VisibilityLevel
  created_at: string
  updated_at: string
  total_likes: number
  total_views: number
  follower_count: number
  comment_count: number
}

type BackendBiography = Record<string, any>

const STORY_CATEGORY_MAP: Record<string, StoryCategoryId> = {
  sys_cat_growth: 'growth',
  sys_cat_psychology: 'psychology',
  sys_cat_community: 'community',
  sys_cat_practical: 'practical',
  sys_cat_dreams: 'dreams',
  sys_cat_life: 'life',
  growth: 'growth',
  psychology: 'psychology',
  community: 'community',
  practical: 'practical',
  dreams: 'dreams',
  life: 'life',
}

const SYSTEM_TAG_DIMENSIONS: TagDimension[] = SYSTEM_TAG_DIMENSION_LIST

const GRADE_OPTIONS = {
  boulder: ['V0', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10'],
  sport: ['5.8', '5.9', '5.10', '5.11', '5.12', '5.13', '5.14'],
  trad: ['5.6', '5.7', '5.8', '5.9', '5.10', '5.11', '5.12'],
}

function safeJsonParse<T>(value: unknown, fallback: T): T {
  if (value == null || value === '') return fallback
  if (typeof value !== 'string') return value as T
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function splitList(value: unknown): string[] | null {
  if (!value) return null
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string')
  if (typeof value !== 'string') return null
  const parsed = safeJsonParse<unknown>(value, null)
  if (Array.isArray(parsed))
    return parsed.filter((item): item is string => typeof item === 'string')
  return value
    .split(/[/,、，]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function createEmptyBiography(userId?: string): EditorBiography {
  const now = new Date().toISOString()
  return {
    id: '',
    user_id: userId ?? null,
    slug: '',
    name: '',
    title: null,
    bio: null,
    avatar_url: null,
    cover_url: null,
    climbing_start_year: null,
    climbing_years: null,
    frequent_locations: null,
    favorite_route_types: null,
    home_gym: null,
    height_cm: null,
    arm_span_cm: null,
    grade_targets: null,
    tags: [],
    one_liners: [],
    stories: [],
    social_links: null,
    visibility: 'private',
    created_at: now,
    updated_at: now,
    total_likes: 0,
    total_views: 0,
    follower_count: 0,
    comment_count: 0,
  }
}

function normalizeTags(raw: unknown): EditorBiography['tags'] {
  const parsed = safeJsonParse<any>(raw, [])
  const selections = Array.isArray(parsed) ? parsed : parsed?.selections

  if (Array.isArray(selections)) {
    return selections.flatMap((item) => {
      if (!item?.tag_id) return []
      return [
        {
          tag_id: String(item.tag_id),
          source: item.source === 'user' ? ('user' as const) : ('system' as const),
        },
      ]
    })
  }

  if (selections && typeof selections === 'object') {
    return Object.values(selections)
      .flat()
      .filter((tagId): tagId is string => typeof tagId === 'string')
      .map((tagId) => ({ tag_id: tagId, source: 'system' }))
  }

  return []
}

function transformBackendToEditorBiography(
  backend: BackendBiography,
  userId?: string
): EditorBiography {
  const basicInfo = safeJsonParse<Record<string, any>>(backend.basic_info_data, {})
  const tagsRaw = safeJsonParse<any>(backend.tags_data, [])
  const oneLinersRaw = safeJsonParse<Record<string, any>>(backend.one_liners_data, {})
  const storiesRaw = safeJsonParse<Record<string, Record<string, any>>>(backend.stories_data, {})
  const rawSocialLinks = safeJsonParse<Record<string, string | undefined>>(backend.social_links, {})
  const startYearRaw = basicInfo.climbing_start_year ?? backend.climbing_start_year
  const startYear =
    typeof startYearRaw === 'number'
      ? startYearRaw
      : startYearRaw
        ? Number.parseInt(String(startYearRaw), 10)
        : null

  return {
    id: backend.id ?? '',
    user_id: backend.user_id ?? userId ?? null,
    slug: backend.slug ?? '',
    name: backend.name ?? basicInfo.name ?? '',
    title: backend.title ?? basicInfo.title ?? null,
    bio: backend.bio ?? basicInfo.bio ?? null,
    avatar_url: backend.avatar_url ?? null,
    cover_url: backend.cover_image ?? backend.cover_url ?? null,
    climbing_start_year: startYear && !Number.isNaN(startYear) ? startYear : null,
    climbing_years:
      startYear && !Number.isNaN(startYear) ? new Date().getFullYear() - startYear : null,
    frequent_locations: splitList(basicInfo.frequent_locations ?? backend.frequent_locations),
    favorite_route_types: splitList(basicInfo.favorite_route_type ?? backend.favorite_route_type),
    home_gym: basicInfo.home_gym ?? null,
    height_cm: backend.height_cm ?? null,
    arm_span_cm: backend.arm_span_cm ?? null,
    grade_targets: safeJsonParse<GradeTarget[] | null>(backend.grade_targets, null),
    tags: normalizeTags(backend.tags_data),
    custom_tags: Array.isArray(tagsRaw?.custom_tags) ? tagsRaw.custom_tags : undefined,
    custom_dimensions: Array.isArray(tagsRaw?.custom_dimensions)
      ? tagsRaw.custom_dimensions
      : undefined,
    one_liners: Object.entries(oneLinersRaw).map(([questionId, item]) => ({
      id: questionId,
      question_id: questionId,
      answer: typeof item === 'string' ? item : (item?.answer ?? ''),
      source: 'system',
    })),
    stories: Object.values(storiesRaw)
      .flatMap((category) =>
        Object.entries(category ?? {}).map(([questionId, item]) => ({
          id: questionId,
          question_id: questionId,
          category_id: item?.category_id,
          content: typeof item === 'string' ? item : (item?.answer ?? item?.content ?? ''),
          source: 'system' as const,
        }))
      )
      .filter((item) => item.content.trim().length > 0),
    social_links: {
      instagram: rawSocialLinks.instagram,
      youtube: rawSocialLinks.youtube || rawSocialLinks.youtube_channel,
      website: rawSocialLinks.website,
    },
    visibility: backend.visibility ?? (Number(backend.is_public ?? 1) === 1 ? 'public' : 'private'),
    created_at: backend.created_at ?? new Date().toISOString(),
    updated_at: backend.updated_at ?? new Date().toISOString(),
    total_likes: backend.total_likes ?? 0,
    total_views: backend.total_views ?? 0,
    follower_count: backend.follower_count ?? 0,
    comment_count: backend.comment_count ?? 0,
  }
}

function serializeBiography(bio: EditorBiography) {
  const storiesByCategory: Record<string, Record<string, any>> = {}
  for (const story of bio.stories) {
    const categoryId = story.category_id || 'uncategorized'
    storiesByCategory[categoryId] ??= {}
    storiesByCategory[categoryId][story.question_id] = {
      answer: story.content,
      visibility: 'public',
      updated_at: new Date().toISOString(),
    }
  }

  return {
    name: bio.name,
    title: bio.title ?? undefined,
    bio: bio.bio ?? undefined,
    avatar_url: bio.avatar_url ?? undefined,
    cover_image: bio.cover_url ?? undefined,
    climbing_start_year: bio.climbing_start_year?.toString() ?? undefined,
    frequent_locations: bio.frequent_locations?.join(', ') ?? undefined,
    favorite_route_type: bio.favorite_route_types?.join(', ') ?? undefined,
    social_links: bio.social_links ? JSON.stringify(bio.social_links) : undefined,
    visibility: bio.visibility,
    tags_data: JSON.stringify({
      selections: bio.tags,
      custom_tags: bio.custom_tags,
      custom_dimensions: bio.custom_dimensions,
    }),
    one_liners_data: JSON.stringify(
      bio.one_liners.reduce<Record<string, { answer: string; visibility: string }>>((acc, item) => {
        acc[item.question_id] = { answer: item.answer, visibility: 'public' }
        return acc
      }, {})
    ),
    stories_data: JSON.stringify(storiesByCategory),
    basic_info_data: JSON.stringify({
      name: bio.name,
      title: bio.title ?? '',
      bio: bio.bio ?? '',
      climbing_start_year: bio.climbing_start_year ?? '',
      frequent_locations: bio.frequent_locations?.join(', ') ?? '',
      home_gym: bio.home_gym ?? '',
      favorite_route_type: bio.favorite_route_types?.join(', ') ?? '',
    }),
    height_cm: bio.height_cm ?? null,
    arm_span_cm: bio.arm_span_cm ?? null,
    grade_targets: bio.grade_targets?.length ? JSON.stringify(bio.grade_targets) : null,
  }
}

function GradeTargetsSection({
  gradeTargets,
  onGradeTargetsChange,
}: {
  gradeTargets: GradeTarget[]
  onGradeTargetsChange: (targets: GradeTarget[]) => void
}) {
  const currentYear = new Date().getFullYear()

  const addTarget = () => {
    onGradeTargetsChange([
      ...gradeTargets,
      {
        year: currentYear,
        grade_system: 'boulder',
        grade: 'V4',
        target_count: 3,
        completed_count: 0,
      },
    ])
  }

  const updateTarget = (index: number, updates: Partial<GradeTarget>) => {
    onGradeTargetsChange(
      gradeTargets.map((target, idx) => (idx === index ? { ...target, ...updates } : target))
    )
  }

  return (
    <YStack gap="$4">
      <XStack alignItems="center" justifyContent="space-between">
        <XStack alignItems="center" gap="$2">
          <Target size={18} color={SEMANTIC_COLORS.textSubtle} />
          <Text fontWeight="600">年度級數目標</Text>
        </XStack>
        <Pressable onPress={addTarget} style={styles.smallAction}>
          <Plus size={16} color={SEMANTIC_COLORS.textMain} />
          <Text variant="caption">新增</Text>
        </Pressable>
      </XStack>

      {gradeTargets.length === 0 ? (
        <Text variant="small" color="textMuted">
          設定今年想完成的抱石、運動攀登或傳攀級數目標。
        </Text>
      ) : (
        <YStack gap="$3">
          {gradeTargets.map((target, index) => (
            <View key={`${target.year}-${target.grade_system}-${index}`} style={styles.targetCard}>
              <XStack gap="$2" alignItems="center" flexWrap="wrap">
                {(['boulder', 'sport', 'trad'] as const).map((system) => (
                  <Pressable
                    key={system}
                    onPress={() =>
                      updateTarget(index, {
                        grade_system: system,
                        grade: GRADE_OPTIONS[system][0],
                      })
                    }
                    style={[styles.segment, target.grade_system === system && styles.segmentActive]}
                  >
                    <Text
                      variant="caption"
                      style={target.grade_system === system && styles.segmentTextActive}
                    >
                      {system === 'boulder' ? '抱石' : system === 'sport' ? '運動' : '傳攀'}
                    </Text>
                  </Pressable>
                ))}
              </XStack>

              <XStack gap="$2" alignItems="center">
                <TextInput
                  value={String(target.year)}
                  onChangeText={(text) =>
                    updateTarget(index, { year: Number.parseInt(text, 10) || currentYear })
                  }
                  keyboardType="number-pad"
                  style={[styles.input, styles.yearInput]}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.gradeScroller}
                >
                  <XStack gap="$2">
                    {GRADE_OPTIONS[target.grade_system].map((grade) => (
                      <Pressable
                        key={grade}
                        onPress={() => updateTarget(index, { grade })}
                        style={[styles.gradeChip, target.grade === grade && styles.gradeChipActive]}
                      >
                        <Text
                          variant="caption"
                          style={target.grade === grade && styles.segmentTextActive}
                        >
                          {grade}
                        </Text>
                      </Pressable>
                    ))}
                  </XStack>
                </ScrollView>
              </XStack>

              <XStack gap="$2" alignItems="center">
                <Text variant="small" color="textMuted">
                  目標完成數
                </Text>
                <TextInput
                  value={String(target.target_count)}
                  onChangeText={(text) =>
                    updateTarget(index, { target_count: Number.parseInt(text, 10) || 1 })
                  }
                  keyboardType="number-pad"
                  style={[styles.input, styles.countInput]}
                />
                <Pressable
                  onPress={() =>
                    onGradeTargetsChange(gradeTargets.filter((_, idx) => idx !== index))
                  }
                  style={styles.deleteButton}
                >
                  <Trash2 size={16} color="#DC2626" />
                </Pressable>
              </XStack>
            </View>
          ))}
        </YStack>
      )}
    </YStack>
  )
}

export default function ProfileEditorScreen() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const { data: questionsData, isLoading: questionsLoading } = useQuestions()
  const [biography, setBiography] = useState<EditorBiography | null>(null)
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const biographyQuery = useQuery({
    queryKey: ['mobile-biography-v2', user?.id],
    enabled: isAuthenticated,
    queryFn: async () => {
      const response = await biographyService.getMyBiography()
      if (response.success && response.data) {
        return transformBackendToEditorBiography(response.data as BackendBiography, user?.id)
      }
      return createEmptyBiography(user?.id)
    },
  })

  useEffect(() => {
    if (biographyQuery.data) {
      setBiography(biographyQuery.data)
    }
  }, [biographyQuery.data])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const oneLinerQuestions = useMemo<OneLinerQuestion[]>(() => {
    if (!questionsData) return []
    const coreAsOneLiners = questionsData.coreStories.map((question) => ({
      id: question.id,
      source: 'system' as const,
      question: question.title,
      format_hint: question.subtitle,
      placeholder: question.placeholder || '',
      display_order: question.display_order,
      is_active: 1,
      order: question.display_order,
    }))
    const oneLiners = questionsData.oneLiners.map((question) => ({
      id: question.id,
      source: 'system' as const,
      question: question.question,
      format_hint: question.format_hint,
      placeholder: question.placeholder || '',
      display_order: question.display_order,
      is_active: 1,
      order: question.display_order,
    }))
    return [...coreAsOneLiners, ...oneLiners].sort((a, b) => a.order - b.order)
  }, [questionsData])

  const storyQuestionsByCategory = useMemo<Record<StoryCategoryId, StoryQuestion[]>>(() => {
    const result: Record<StoryCategoryId, StoryQuestion[]> = {
      growth: [],
      psychology: [],
      community: [],
      practical: [],
      dreams: [],
      life: [],
    }
    for (const question of questionsData?.stories ?? []) {
      const category = STORY_CATEGORY_MAP[question.category_id]
      if (!category) continue
      result[category].push({
        id: question.id,
        source: 'system',
        category_id: category,
        title: question.title,
        subtitle: question.subtitle,
        placeholder: question.placeholder || '',
        difficulty: question.difficulty === 'deep' ? 'hard' : question.difficulty,
        display_order: question.display_order,
        is_active: 1,
        order: question.display_order,
      })
    }
    for (const category of Object.keys(result) as StoryCategoryId[]) {
      result[category].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    }
    return result
  }, [questionsData])

  const storyCategories = useMemo<StoryCategoryDefinition[]>(
    () =>
      (questionsData?.categories ?? []).map((category) => ({
        id: STORY_CATEGORY_MAP[category.id] ?? category.id,
        source: 'system',
        name: category.name,
        icon: category.icon ?? 'BookOpen',
        description: category.description ?? '',
        order: category.display_order,
        questions:
          storyQuestionsByCategory[
            STORY_CATEGORY_MAP[category.id] ?? (category.id as StoryCategoryId)
          ] ?? [],
      })),
    [questionsData, storyQuestionsByCategory]
  )

  const saveBiography = useCallback(async (nextBiography: EditorBiography) => {
    setStatus('saving')
    setError(null)
    const response = await apiClient.put(
      '/biographies/me/autosave',
      serializeBiography(nextBiography)
    )
    if (!response.data?.success) {
      throw new Error(response.data?.error || '儲存失敗')
    }
    setStatus('saved')
  }, [])

  const scheduleSave = useCallback(
    (nextBiography: EditorBiography, immediate = false) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      const runSave = async () => {
        try {
          await saveBiography(nextBiography)
        } catch (err) {
          setStatus('error')
          setError(err instanceof Error ? err.message : '儲存失敗，請稍後再試')
        }
      }
      if (immediate) {
        runSave()
        return
      }
      setStatus('saving')
      saveTimerRef.current = setTimeout(runSave, 1200)
    },
    [saveBiography]
  )

  const handleChange = useCallback(
    (updates: Partial<EditorBiography>, immediate = false) => {
      setBiography((current) => {
        if (!current) return current
        const next = { ...current, ...updates, updated_at: new Date().toISOString() }
        scheduleSave(next, immediate)
        return next
      })
    },
    [scheduleSave]
  )

  const imageCropper = useImageCropper({
    avatarUrl: biography?.avatar_url,
    coverUrl: biography?.cover_url,
    onAvatarChange: (url) => handleChange({ avatar_url: url }, true),
    onCoverChange: (url) => handleChange({ cover_url: url }, true),
    onFlushSave: () => biography && scheduleSave(biography, true),
  })

  const modals = useEditorModals()

  const customContent = useCustomContent({
    biography: (biography ?? createEmptyBiography(user?.id)) as unknown as PackageBiographyV2,
    tagDimensions: SYSTEM_TAG_DIMENSIONS,
    oneLinerQuestions,
    storyQuestionsByCategory,
    onSaveCustomTag: (tag, _isUserDimension, newCustomDimensions, newCustomTags) => {
      if (!biography) return
      const dimensionId = tag.dimension_id
      const currentDimensionTagIds = new Set(
        SYSTEM_TAG_DIMENSIONS.find((dimension) => dimension.id === dimensionId)?.options.map(
          (option) => option.id
        ) ?? []
      )
      const nextTags = [
        ...biography.tags.filter((item) => !currentDimensionTagIds.has(item.tag_id)),
        { tag_id: tag.id, source: 'user' as const },
      ]
      handleChange(
        { tags: nextTags, custom_dimensions: newCustomDimensions, custom_tags: newCustomTags },
        true
      )
      modals.closeCustomTagModal()
    },
    onSaveCustomDimension: (_dimension, newCustomDimensions) => {
      handleChange({ custom_dimensions: newCustomDimensions }, true)
      modals.closeCustomDimensionModal()
    },
  })

  const tagSelections = useMemo(() => {
    const selections: Record<string, string[]> = {}
    for (const item of biography?.tags ?? []) {
      const dimension = customContent.allTagDimensions.find((candidate) =>
        candidate.options.some((option) => option.id === item.tag_id)
      )
      if (!dimension) continue
      selections[dimension.id] ??= []
      selections[dimension.id].push(item.tag_id)
    }
    return selections
  }, [biography?.tags, customContent.allTagDimensions])

  const handleTagSelectionChange = useCallback(
    (dimensionId: string, selectedIds: string[]) => {
      if (!biography) return
      const dimension = customContent.allTagDimensions.find((item) => item.id === dimensionId)
      const dimensionTagIds = new Set(dimension?.options.map((option) => option.id) ?? [])
      const otherTags = biography.tags.filter((item) => !dimensionTagIds.has(item.tag_id))
      const nextTags = selectedIds.map((tagId) => {
        const option = dimension?.options.find((item) => item.id === tagId)
        return {
          tag_id: tagId,
          source: option?.source === 'user' ? ('user' as const) : ('system' as const),
        }
      })
      handleChange({ tags: [...otherTags, ...nextTags] })
    },
    [biography, customContent.allTagDimensions, handleChange]
  )

  const handleOneLinerChange = useCallback(
    (questionId: string, answer: string | null) => {
      if (!biography) return
      const existing = biography.one_liners.findIndex((item) => item.question_id === questionId)
      const next = [...biography.one_liners]
      if (existing >= 0) {
        if (answer) next[existing] = { ...next[existing], answer }
        else next.splice(existing, 1)
      } else if (answer) {
        next.push({ id: questionId, question_id: questionId, answer, source: 'system' })
      }
      handleChange({ one_liners: next })
    },
    [biography, handleChange]
  )

  const handleStorySave = useCallback(
    (content: string) => {
      if (!biography || !editingStoryId) return
      const question = Object.values(customContent.allStoryQuestionsByCategory)
        .flat()
        .find((item) => item.id === editingStoryId)
      const existing = biography.stories.findIndex((item) => item.question_id === editingStoryId)
      const next = [...biography.stories]
      const story = {
        id: editingStoryId,
        question_id: editingStoryId,
        category_id: question?.category_id,
        content,
        source: question?.source === 'user' ? ('user' as const) : ('system' as const),
      }
      if (existing >= 0) next[existing] = { ...next[existing], ...story }
      else next.push(story)
      setEditingStoryId(null)
      handleChange({ stories: next }, true)
    },
    [biography, customContent.allStoryQuestionsByCategory, editingStoryId, handleChange]
  )

  const handleStoryDelete = useCallback(() => {
    if (!biography || !editingStoryId) return
    setEditingStoryId(null)
    handleChange(
      { stories: biography.stories.filter((item) => item.question_id !== editingStoryId) },
      true
    )
  }, [biography, editingStoryId, handleChange])

  const sections = useMemo(
    () => [
      { id: 'basic', label: '基本資料', icon: User, isCompleted: Boolean(biography?.name) },
      {
        id: 'targets',
        label: '年度目標',
        icon: TrendingUp,
        isCompleted: Boolean(biography?.grade_targets?.length),
      },
      {
        id: 'tags',
        label: '身份標籤',
        icon: Tag,
        isCompleted: Boolean(biography?.tags.length),
        progress: {
          completed: biography?.tags.length ?? 0,
          total: SYSTEM_TAG_DIMENSIONS.length * 2,
        },
      },
      {
        id: 'oneliners',
        label: '快問快答',
        icon: MessageCircle,
        isCompleted: Boolean(biography?.one_liners.some((item) => item.answer?.trim())),
        progress: {
          completed: biography?.one_liners.filter((item) => item.answer?.trim()).length ?? 0,
          total: oneLinerQuestions.length,
        },
      },
      {
        id: 'stories',
        label: '深度故事',
        icon: BookOpen,
        isCompleted: Boolean(biography?.stories.some((item) => item.content?.trim())),
        progress: {
          completed: biography?.stories.filter((item) => item.content?.trim()).length ?? 0,
          total: Object.values(storyQuestionsByCategory).flat().length,
        },
      },
      {
        id: 'footprints',
        label: '攀岩足跡',
        icon: Globe,
        isCompleted: Boolean(
          (biography?.frequent_locations && biography.frequent_locations.length > 0) ||
            biography?.home_gym
        ),
      },
    ],
    [biography, oneLinerQuestions.length, storyQuestionsByCategory]
  )

  const overallProgress = Math.round(
    (sections.filter((section) => section.isCompleted).length / sections.length) * 100
  )
  const editingQuestion = editingStoryId
    ? (Object.values(customContent.allStoryQuestionsByCategory)
        .flat()
        .find((item) => item.id === editingStoryId) ?? null)
    : null
  const editingStory = editingStoryId
    ? biography?.stories.find((item) => item.question_id === editingStoryId)
    : null

  const handlePublish = useCallback(async () => {
    if (!biography) return
    setIsPublishing(true)
    try {
      const next = { ...biography, visibility: 'public' as VisibilityLevel }
      const response = await biographyService.updateMyBiography(serializeBiography(next))
      if (!response.success) throw new Error(response.error || '發布失敗')
      setBiography(next)
      setStatus('saved')
      Alert.alert('已發布', '人物誌已設為公開。')
    } catch (err) {
      Alert.alert('發布失敗', err instanceof Error ? err.message : '請稍後再試')
    } finally {
      setIsPublishing(false)
    }
  }, [biography])

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState
          icon={User}
          title="請先登入"
          description="登入後即可編輯人物誌。"
          actionLabel="前往登入"
          onAction={() => router.replace('/auth/login' as never)}
          style={styles.fullState}
        />
      </SafeAreaView>
    )
  }

  if (biographyQuery.isLoading || questionsLoading || !biography) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
          <Text color="textSubtle">載入人物誌編輯器...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (biographyQuery.isError) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <EmptyState
          icon={BarChart3}
          title="載入失敗"
          description="無法載入人物誌資料，請稍後再試。"
          actionLabel="重新載入"
          onAction={() => biographyQuery.refetch()}
          style={styles.fullState}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={WB_COLORS[70]} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>編輯人物誌</Text>
          <Text style={styles.subtitle}>V2 編輯器：標籤、故事、目標與發布設定</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error && (
          <View style={styles.errorCard}>
            <Text variant="small" style={styles.errorText}>
              {error}
            </Text>
          </View>
        )}

        <View style={styles.card}>
          <PrivacyBanner
            visibility={biography.visibility}
            onVisibilityChange={(visibility) => handleChange({ visibility })}
          />
        </View>

        <ProgressIndicator sections={sections} />

        <View style={styles.card}>
          <BasicInfoSection
            name={biography.name}
            onNameChange={(name) => handleChange({ name })}
            title={biography.title}
            onTitleChange={(title) => handleChange({ title })}
            avatarUrl={biography.avatar_url}
            onAvatarChange={imageCropper.handleAvatarSelect}
            coverUrl={biography.cover_url}
            onCoverChange={imageCropper.handleCoverSelect}
            climbingStartYear={biography.climbing_start_year}
            onClimbingStartYearChange={(year) =>
              handleChange({
                climbing_start_year: year,
                climbing_years: year ? new Date().getFullYear() - year : null,
              })
            }
            heightCm={biography.height_cm}
            onHeightCmChange={(height) => handleChange({ height_cm: height })}
            armSpanCm={biography.arm_span_cm}
            onArmSpanCmChange={(armSpan) => handleChange({ arm_span_cm: armSpan })}
            frequentLocations={biography.frequent_locations ?? []}
            onFrequentLocationsChange={(locations) =>
              handleChange({ frequent_locations: locations })
            }
            favoriteRouteTypes={biography.favorite_route_types ?? []}
            onFavoriteRouteTypesChange={(types) => handleChange({ favorite_route_types: types })}
            socialLinks={biography.social_links ?? {}}
            onSocialLinksChange={(socialLinks) =>
              handleChange({ social_links: socialLinks as Record<string, string | undefined> })
            }
          />
        </View>

        <View style={styles.card}>
          <GradeTargetsSection
            gradeTargets={biography.grade_targets ?? []}
            onGradeTargetsChange={(targets) =>
              handleChange({ grade_targets: targets.length ? targets : null })
            }
          />
        </View>

        <View style={styles.card}>
          <TagsSection
            dimensions={customContent.allTagDimensions}
            selections={tagSelections}
            onSelectionChange={handleTagSelectionChange}
            onAddCustomTag={modals.openCustomTagModal}
            onAddCustomDimension={modals.openCustomDimensionModal}
            onOpenBottomSheet={modals.openTagsBottomSheet}
          />
        </View>

        <View style={styles.card}>
          <OneLinersSection
            questions={customContent.allOneLinerQuestions}
            answers={biography.one_liners}
            onAnswerChange={handleOneLinerChange}
            onAddCustomQuestion={modals.openCustomOneLinerModal}
          />
        </View>

        <View style={styles.card}>
          <StoriesSection
            questionsByCategory={customContent.allStoryQuestionsByCategory}
            stories={biography.stories}
            onStoryClick={setEditingStoryId}
            onAddCustomQuestion={modals.openCustomStoryModal}
          />
        </View>

        <View style={styles.card}>
          <ClimbingFootprintsSection isEditing />
        </View>

        <BottomBarSpacer />
      </ScrollView>

      <FixedBottomBar
        saveStatus={status}
        previewHref={
          biography.slug || biography.id
            ? `/biography/profile/${biography.slug || biography.id}`
            : ''
        }
        onPublish={handlePublish}
        canPublish={overallProgress > 0}
        isPublishing={isPublishing}
        progress={overallProgress}
      />

      <StoryEditFullscreen
        isOpen={Boolean(editingStoryId)}
        onClose={() => setEditingStoryId(null)}
        question={editingQuestion}
        story={editingStory}
        onSave={handleStorySave}
        onDelete={handleStoryDelete}
      />

      <TagsBottomSheet
        isOpen={modals.tagsBottomSheetOpen}
        onClose={modals.closeTagsBottomSheet}
        dimensions={customContent.allTagDimensions}
        selections={tagSelections}
        onSelectionChange={handleTagSelectionChange}
        onAddCustomTag={modals.openCustomTagModal}
        onAddCustomDimension={modals.openCustomDimensionModal}
      />

      <AddCustomTagModal
        isOpen={modals.customTagModalOpen}
        onClose={modals.closeCustomTagModal}
        dimensions={customContent.allTagDimensions}
        defaultDimensionId={modals.customTagDimensionId}
        onSave={customContent.handleSaveCustomTag}
      />

      <AddCustomDimensionModal
        isOpen={modals.customDimensionModalOpen}
        onClose={modals.closeCustomDimensionModal}
        onSave={customContent.handleSaveCustomDimension}
      />

      <AddCustomOneLinerModal
        isOpen={modals.customOneLinerModalOpen}
        onClose={modals.closeCustomOneLinerModal}
        onSave={customContent.handleSaveCustomOneLiner}
      />

      <AddCustomStoryModal
        isOpen={modals.customStoryModalOpen}
        onClose={modals.closeCustomStoryModal}
        categories={storyCategories}
        defaultCategoryId={modals.customStoryCategoryId}
        onSave={customContent.handleSaveCustomStory}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SEMANTIC_COLORS.pageBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: SEMANTIC_COLORS.border,
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1, alignItems: 'center', gap: 2 },
  title: { textAlign: 'center', fontSize: 18, fontWeight: '600', color: SEMANTIC_COLORS.textMain },
  subtitle: { textAlign: 'center', fontSize: 12, color: SEMANTIC_COLORS.textMuted },
  headerSpacer: { width: 40 },
  content: {
    padding: SPACING.md,
    paddingBottom: 140,
    gap: SPACING.md,
  },
  card: {
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  errorCard: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: '#FEE2E2',
  },
  errorText: {
    color: '#DC2626',
  },
  fullState: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  smallAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: WB_COLORS[10],
  },
  targetCard: {
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    borderRadius: RADIUS.md,
    backgroundColor: WB_COLORS[0],
  },
  segment: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
  },
  segmentActive: {
    borderColor: SEMANTIC_COLORS.textMain,
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  segmentTextActive: {
    color: WB_COLORS[0],
  },
  input: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    borderRadius: RADIUS.sm,
    color: SEMANTIC_COLORS.textMain,
  },
  yearInput: {
    width: 72,
  },
  countInput: {
    width: 64,
  },
  gradeScroller: {
    flex: 1,
  },
  gradeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
  },
  gradeChipActive: {
    borderColor: SEMANTIC_COLORS.textMain,
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  deleteButton: {
    marginLeft: 'auto',
    padding: 8,
  },
})
