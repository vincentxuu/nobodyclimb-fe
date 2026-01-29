/**
 * Biography V2 類型定義
 * 三層漸進式設計 + 開放式內容
 *
 * @see docs/persona-content-redesign.md
 * @see docs/persona-page-layout.md
 */

// ═══════════════════════════════════════════
// 內容來源類型
// ═══════════════════════════════════════════

/**
 * 內容來源標記
 */
export type ContentSource = 'system' | 'user'

/**
 * 可擴展項目的基礎介面
 */
export interface ExtensibleItem {
  id: string // sys_xxx 或 usr_xxx
  source: ContentSource // 來源標記
  created_by?: string // 用戶自訂時的 user_id
  created_at?: string // 建立時間
}

// ═══════════════════════════════════════════
// 標籤系統類型
// ═══════════════════════════════════════════

/**
 * 標籤維度定義
 */
export interface TagDimension extends ExtensibleItem {
  id: string
  source: ContentSource
  name: string
  emoji: string
  icon: string // Lucide icon name
  description: string
  selection_mode: 'single' | 'multiple'
  options: TagOption[]
  order: number
  is_active: boolean
}

/**
 * 標籤選項定義
 */
export interface TagOption extends ExtensibleItem {
  id: string
  source: ContentSource
  dimension_id: string
  label: string
  description: string
  order: number
  // 動態標籤專用欄位
  is_dynamic?: boolean
  template?: string // 顯示模板，如 "#{value}常客"
  source_field?: string // 資料來源欄位，如 "home_gym"
}

/**
 * 用戶的標籤選擇結果（複雜結構，用於擴展功能）
 */
export interface BiographyTagsV2 {
  selections: Record<string, string[]> // key: 維度 ID，value: 選中的選項 ID 陣列
  custom_dimensions?: TagDimension[]
  custom_options?: TagOption[]
}

/**
 * 標籤選擇項目（簡化結構，用於編輯器）
 */
export interface TagSelection {
  tag_id: string
  source: ContentSource
}

/**
 * 用於資料庫儲存的標籤資料結構
 * 包含選擇的標籤以及用戶自訂標籤的定義
 */
export interface TagsDataStorage {
  selections: TagSelection[]
  custom_tags?: TagOption[] // 用戶為系統維度新增的自訂標籤
  custom_dimensions?: TagDimension[] // 用戶自訂的標籤維度（包含其中的標籤選項）
  display_tags?: string[] // 要在卡片上展示的 tag_id 陣列，最多 3 個
}

// ═══════════════════════════════════════════
// 一句話系列類型
// ═══════════════════════════════════════════

/**
 * 一句話問題定義
 */
export interface OneLinerQuestion extends ExtensibleItem {
  id: string
  source: ContentSource
  question: string
  format_hint: string | null // 格式引導，如「因為＿＿＿」
  placeholder: string
  order: number
  category?: string
}

/**
 * 用戶的一句話回答（含時間戳）
 */
export interface OneLinerAnswer {
  question_id: string
  answer: string
  updated_at: string
}

/**
 * 一句話項目（簡化結構，用於編輯器）
 */
export interface OneLinerItem {
  question_id: string
  answer: string
  source: ContentSource
}

/** 一句話項目別名 */
export type OneLiner = OneLinerItem

/**
 * 一句話系列資料結構（複雜結構，用於擴展功能）
 */
export interface BiographyOneLinersV2 {
  answers: OneLinerAnswer[]
  custom_questions?: OneLinerQuestion[]
}

// ═══════════════════════════════════════════
// 深度故事類型
// ═══════════════════════════════════════════

/**
 * 故事類別字串類型
 */
export type StoryCategory = 'growth' | 'psychology' | 'community' | 'practical' | 'dreams' | 'life'

/**
 * 故事分類定義（完整物件）
 */
export interface StoryCategoryDefinition extends ExtensibleItem {
  id: string
  source: ContentSource
  name: string
  icon: string // Lucide icon name
  description: string
  order: number
}

/**
 * 故事問題定義
 */
export interface StoryQuestion extends ExtensibleItem {
  id: string
  source: ContentSource
  category_id: string
  title: string
  subtitle: string
  placeholder: string
  difficulty: 'easy' | 'medium' | 'deep'
  order: number
}

/**
 * 用戶的故事回答（含時間戳）
 */
export interface StoryAnswer {
  question_id: string
  content: string
  updated_at: string
  word_count?: number
}

/**
 * 故事項目（簡化結構，用於編輯器）
 */
export interface StoryItem {
  question_id: string
  content: string
  source: ContentSource
}

/** 故事項目別名 */
export type Story = StoryItem

/**
 * 深度故事資料結構（複雜結構，用於擴展功能）
 */
export interface BiographyStoriesV2 {
  answers: StoryAnswer[]
  custom_categories?: StoryCategoryDefinition[]
  custom_questions?: StoryQuestion[]
}

// ═══════════════════════════════════════════
// 輔助類型
// ═══════════════════════════════════════════

/**
 * 圖片資料
 */
export interface GalleryImage {
  id: string
  url: string
  caption?: string
  order: number
}

/**
 * 社群連結
 */
export interface SocialLinks {
  instagram?: string
  youtube?: string
  facebook?: string
  threads?: string
  website?: string
}

/**
 * 隱私設定
 */
export type VisibilityLevel = 'public' | 'community' | 'private' | 'anonymous'

// ═══════════════════════════════════════════
// 主要資料結構
// ═══════════════════════════════════════════

/**
 * 人物誌介面 v2
 * 三層漸進式設計 + 開放式內容
 *
 * 此介面使用簡化的陣列結構，方便編輯器操作
 */
export interface BiographyV2 {
  // ═══════════════════════════════════════════
  // 基本資訊
  // ═══════════════════════════════════════════
  id: string
  user_id: string | null
  slug: string
  name: string
  title: string | null // 一句話介紹自己
  bio: string | null
  avatar_url: string | null
  cover_url: string | null // 封面圖片

  // ═══════════════════════════════════════════
  // 攀岩基本資料
  // ═══════════════════════════════════════════
  climbing_start_year: number | null // 開始攀岩的年份
  climbing_years: number | null // 攀岩年資（從 climbing_start_year 計算）
  frequent_locations: string[] | null // 平常出沒的地方（可多選）
  favorite_route_types: string[] | null // 喜歡的路線型態（可多選）
  home_gym: string | null

  // ═══════════════════════════════════════════
  // 第一層：標籤系統（簡化陣列結構）
  // ═══════════════════════════════════════════
  tags: TagSelection[]
  custom_tags?: TagOption[] // 用戶為系統維度新增的自訂標籤定義
  custom_dimensions?: TagDimension[] // 用戶自訂的標籤維度（包含其中的標籤選項）

  // ═══════════════════════════════════════════
  // 第二層：一句話系列（簡化陣列結構）
  // ═══════════════════════════════════════════
  one_liners: OneLinerItem[]

  // ═══════════════════════════════════════════
  // 第三層：深度故事（簡化陣列結構）
  // ═══════════════════════════════════════════
  stories: StoryItem[]

  // ═══════════════════════════════════════════
  // 媒體與社群
  // ═══════════════════════════════════════════
  gallery_images: GalleryImage[] | null
  social_links: SocialLinks | null
  featured_video_id: string | null

  // ═══════════════════════════════════════════
  // 隱私與狀態
  // ═══════════════════════════════════════════
  visibility: VisibilityLevel
  is_featured: boolean
  published_at: string | null
  created_at: string
  updated_at: string

  // ═══════════════════════════════════════════
  // 統計
  // ═══════════════════════════════════════════
  total_likes: number
  total_views: number
  follower_count: number
  comment_count: number
}

// ═══════════════════════════════════════════
// 儲存狀態類型
// ═══════════════════════════════════════════

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface AutoSaveState {
  status: SaveStatus
  lastSavedAt: Date | null
  hasUnsavedChanges: boolean
  error?: string
}

// ═══════════════════════════════════════════
// 編輯器狀態類型
// ═══════════════════════════════════════════

export interface ProfileEditorState {
  biography: BiographyV2 | null
  isLoading: boolean
  isSaving: boolean
  saveStatus: SaveStatus
  lastSavedAt: Date | null
  hasUnsavedChanges: boolean
  activeSection: string | null
  errors: Record<string, string>
}

// ═══════════════════════════════════════════
// 進度計算類型
// ═══════════════════════════════════════════

export interface ProfileProgress {
  basicInfo: { completed: boolean; count: number; total: number }
  tags: { completed: boolean; count: number; total: number }
  oneLiners: { completed: boolean; count: number; total: number }
  stories: { completed: boolean; count: number; total: number }
  overallPercentage: number
}

// ═══════════════════════════════════════════
// 工具類型
// ═══════════════════════════════════════════

/**
 * 類型守衛，確保值不為 null/undefined
 */
export function isDefined<T>(value: T | null | undefined | false): value is T {
  return value !== null && value !== undefined && value !== false
}

/**
 * 渲染動態標籤
 */
export function renderDynamicTag(
  tag: TagOption,
  biography: BiographyV2
): string | string[] {
  if (!tag.is_dynamic || !tag.template || !tag.source_field) {
    return tag.label
  }

  const value = biography[tag.source_field as keyof BiographyV2]
  if (!value) return tag.label

  // 處理陣列類型（如 frequent_locations）
  if (Array.isArray(value)) {
    return value.map((v) => tag.template!.replace('{value}', String(v)))
  }

  return tag.template.replace('{value}', String(value))
}

/**
 * 取得隨機未填寫的故事問題
 */
export function getRandomQuestion(
  stories: StoryItem[],
  allQuestions: StoryQuestion[]
): StoryQuestion | null {
  if (!allQuestions.length) return null

  const answeredQuestionIds = new Set(
    stories.map((s) => s.question_id)
  )

  // 優先推薦：尚未填寫的 easy 問題
  const unfilledEasy = allQuestions.filter(
    (q) => !answeredQuestionIds.has(q.id) && q.difficulty === 'easy'
  )

  if (unfilledEasy.length > 0) {
    return unfilledEasy[Math.floor(Math.random() * unfilledEasy.length)]
  }

  // 其次：任何未填寫的問題
  const unfilled = allQuestions.filter((q) => !answeredQuestionIds.has(q.id))
  if (unfilled.length > 0) {
    return unfilled[Math.floor(Math.random() * unfilled.length)]
  }

  // 最後：隨機選一個讓用戶更新
  return allQuestions[Math.floor(Math.random() * allQuestions.length)]
}

// ═══════════════════════════════════════════
// 後端資料格式（JSON 字串）
// ═══════════════════════════════════════════

/**
 * 後端 Biography 資料格式
 * 後端儲存 JSON 字串，前端需要解析
 */
export interface BiographyBackend {
  id: string
  user_id: string | null
  slug: string
  name: string
  title: string | null
  bio: string | null
  avatar_url: string | null
  cover_image: string | null
  climbing_start_year: number | string | null
  frequent_locations: string | null // JSON string or comma-separated string
  favorite_route_type: string | null // comma-separated string
  home_gym: string | null
  visibility: VisibilityLevel | null
  tags_data: string | null // JSON string
  one_liners_data: string | null // JSON string
  stories_data: string | null // JSON string
  basic_info_data: string | null // JSON string
  gallery_images: string | null // JSON string
  social_links: string | null // JSON string
  featured_video_id: string | null
  is_featured: number
  is_public: number
  published_at: string | null
  created_at: string
  updated_at: string
  total_likes: number
  total_views: number
  follower_count: number

  // ═══════════════════════════════════════════
  // 舊版故事欄位（直接存在資料庫中）
  // ═══════════════════════════════════════════
  // 核心故事
  climbing_origin?: string | null
  climbing_meaning?: string | null
  advice_to_self?: string | null
  // A. 成長與突破
  memorable_moment?: string | null
  biggest_challenge?: string | null
  breakthrough_story?: string | null
  first_outdoor?: string | null
  first_grade?: string | null
  frustrating_climb?: string | null
  // B. 心理與哲學
  fear_management?: string | null
  climbing_lesson?: string | null
  failure_perspective?: string | null
  flow_moment?: string | null
  life_balance?: string | null
  unexpected_gain?: string | null
  // C. 社群與連結
  climbing_mentor?: string | null
  climbing_partner?: string | null
  funny_moment?: string | null
  favorite_spot?: string | null
  advice_to_group?: string | null
  climbing_space?: string | null
  // D. 實用分享
  injury_recovery?: string | null
  memorable_route?: string | null
  training_method?: string | null
  effective_practice?: string | null
  technique_tip?: string | null
  gear_choice?: string | null
  // E. 夢想與探索
  dream_climb?: string | null
  climbing_trip?: string | null
  bucket_list_story?: string | null
  climbing_goal?: string | null
  climbing_style?: string | null
  climbing_inspiration?: string | null
  // F. 生活整合
  life_outside_climbing?: string | null
}

// ═══════════════════════════════════════════
// 資料轉換工具
// ═══════════════════════════════════════════

/**
 * 安全解析 JSON 字串
 */
function safeJsonParse<T>(json: string | null, defaultValue: T | null): T | null {
  if (!json) return defaultValue
  try {
    return JSON.parse(json)
  } catch {
    return defaultValue
  }
}

/**
 * 將後端 Biography 資料轉換為前端 BiographyV2 格式
 */
export function transformBackendToBiographyV2(backend: BiographyBackend): BiographyV2 {
  // 解析 basic_info_data - 包含 climbing_start_year, frequent_locations, favorite_route_type 等欄位
  const basicInfo = safeJsonParse<{
    climbing_start_year?: number | string | null
    frequent_locations?: string | null
    favorite_route_type?: string | null
    home_gym?: string | null
    [key: string]: any
  }>(backend.basic_info_data, {})

  // 解析 tags_data - 可能是舊格式 TagSelection[] 或新格式 TagsDataStorage
  const tagsRaw = safeJsonParse<TagSelection[] | TagsDataStorage>(backend.tags_data, [])
  let tags: TagSelection[] = []
  let custom_tags: TagOption[] | undefined = undefined
  let custom_dimensions: TagDimension[] | undefined = undefined

  if (Array.isArray(tagsRaw)) {
    // 舊格式：直接是 TagSelection[]
    tags = tagsRaw
  } else if (tagsRaw && typeof tagsRaw === 'object') {
    // 新格式：TagsDataStorage
    tags = tagsRaw.selections || []
    custom_tags = tagsRaw.custom_tags
    custom_dimensions = tagsRaw.custom_dimensions
  }

  // 清理無效的用戶自訂標籤引用
  // 過濾掉 source 為 'user' 但在 custom_tags 或 custom_dimensions 中找不到定義的標籤
  const customTagIds = new Set([
    ...(custom_tags?.map((t) => t.id) || []),
    ...(custom_dimensions?.flatMap((d) => d.options.map((o) => o.id)) || []),
  ])
  tags = tags.filter((tag) => {
    // 系統標籤：保留（假設系統維度總是包含它們）
    if (tag.source === 'system') return true
    // 用戶自訂標籤：只保留有定義的
    return customTagIds.has(tag.tag_id)
  })

  // 解析 one_liners_data - 後端格式為 Record<string, { answer, visibility }>
  const oneLinersRaw = safeJsonParse<Record<string, { answer: string; visibility: string }>>(
    backend.one_liners_data,
    {}
  ) || {}
  const oneLinersFromJson: OneLinerItem[] = Object.entries(oneLinersRaw)
    .filter(([, data]) => data?.answer)
    .map(([question_id, data]) => ({
      question_id,
      answer: data.answer,
      source: 'system' as ContentSource,
    }))

  // 從舊版欄位中提取一句話問題（直接存在資料庫欄位中的資料）
  const legacyOneLinerFields = [
    'climbing_origin',
    'climbing_meaning',
    'advice_to_self',
  ] as const

  const oneLinersFromLegacy: OneLinerItem[] = legacyOneLinerFields
    .filter((field) => {
      const value = backend[field as keyof BiographyBackend]
      return value && typeof value === 'string' && value.trim().length > 0
    })
    .map((field) => ({
      question_id: field,
      answer: backend[field as keyof BiographyBackend] as string,
      source: 'system' as ContentSource,
    }))

  // 合併兩個來源的一句話問題，優先使用 one_liners_data 中的資料
  const existingOneLinerIds = new Set(oneLinersFromJson.map((o) => o.question_id))
  const one_liners: OneLinerItem[] = [
    ...oneLinersFromJson,
    ...oneLinersFromLegacy.filter((o) => !existingOneLinerIds.has(o.question_id)),
  ]

  // 解析 stories_data - 後端格式為 Record<category, Record<field, { answer, visibility, updated_at }>>
  const storiesRaw = safeJsonParse<Record<string, Record<string, { answer: string; visibility: string; updated_at: string } | null>>>(
    backend.stories_data,
    {}
  ) || {}
  const storiesFromJson: StoryItem[] = Object.values(storiesRaw)
    .flatMap((category) =>
      Object.entries(category || {})
        .filter(([, data]) => data?.answer)
        .map(([question_id, data]) => ({
          question_id,
          content: data!.answer,
          source: 'system' as ContentSource,
        }))
    )

  // 從舊版欄位中提取故事資料（直接存在資料庫欄位中的資料）
  // 注意：climbing_origin, climbing_meaning, advice_to_self 是一句話問題，不在此列表
  const legacyStoryFields = [
    // A. 成長與突破
    'memorable_moment',
    'biggest_challenge',
    'breakthrough_story',
    'first_outdoor',
    'first_grade',
    'frustrating_climb',
    // B. 心理與哲學
    'fear_management',
    'climbing_lesson',
    'failure_perspective',
    'flow_moment',
    'life_balance',
    'unexpected_gain',
    // C. 社群與連結
    'climbing_mentor',
    'climbing_partner',
    'funny_moment',
    'favorite_spot',
    'advice_to_group',
    'climbing_space',
    // D. 實用分享
    'injury_recovery',
    'memorable_route',
    'training_method',
    'effective_practice',
    'technique_tip',
    'gear_choice',
    // E. 夢想與探索
    'dream_climb',
    'climbing_trip',
    'bucket_list_story',
    'climbing_goal',
    'climbing_style',
    'climbing_inspiration',
    // F. 生活整合
    'life_outside_climbing',
  ] as const

  const storiesFromLegacy: StoryItem[] = legacyStoryFields
    .filter((field) => {
      const value = backend[field as keyof BiographyBackend]
      return value && typeof value === 'string' && value.trim().length > 0
    })
    .map((field) => ({
      question_id: field,
      content: backend[field as keyof BiographyBackend] as string,
      source: 'system' as ContentSource,
    }))

  // 這些是一句話問題的 ID，不應該出現在故事中
  const oneLinerIds = new Set([
    'climbing_origin',
    'climbing_meaning',
    'advice_to_self',
    'favorite_place',
    'best_moment',
    'current_goal',
    'climbing_takeaway',
    'climbing_style_desc',
    'life_outside',
    'bucket_list',
  ])

  // 過濾掉一句話問題
  const filteredStoriesFromJson = storiesFromJson.filter((s) => !oneLinerIds.has(s.question_id))

  // 合併兩個來源的故事，優先使用 stories_data 中的資料（如果有的話）
  const existingQuestionIds = new Set(filteredStoriesFromJson.map((s) => s.question_id))
  const stories: StoryItem[] = [
    ...filteredStoriesFromJson,
    ...storiesFromLegacy.filter((s) => !existingQuestionIds.has(s.question_id)),
  ]

  // 解析 frequent_locations - 從 basic_info_data 中讀取
  // 可能是字串（以 / 或逗號分隔）或 JSON 陣列字串
  let frequent_locations: string[] | null = null
  if (basicInfo?.frequent_locations) {
    const locStr = basicInfo.frequent_locations
    // 先嘗試 JSON 解析
    const parsed = safeJsonParse<unknown>(locStr, null)
    if (Array.isArray(parsed)) {
      frequent_locations = parsed.filter((item): item is string => typeof item === 'string')
    } else {
      // 當作純字串處理，以 /、逗號或頓號分隔
      frequent_locations = locStr
        .split(/[/,、，]/)
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }

  // 解析 favorite_route_types - 從 basic_info_data 中讀取
  let favorite_route_types: string[] | null = null
  if (basicInfo?.favorite_route_type) {
    const typeStr = basicInfo.favorite_route_type
    // 先嘗試 JSON 解析
    const parsed = safeJsonParse<unknown>(typeStr, null)
    if (Array.isArray(parsed)) {
      favorite_route_types = parsed.filter((item): item is string => typeof item === 'string')
    } else {
      // 當作純字串處理，以 /、逗號或頓號分隔
      favorite_route_types = typeStr
        .split(/[/,、，]/)
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }

  const gallery_images = safeJsonParse<GalleryImage[] | null>(backend.gallery_images, null)

  // 解析 social_links，並處理舊版欄位名稱兼容（youtube_channel -> youtube）
  const rawSocialLinks = safeJsonParse<Record<string, string | undefined> | null>(backend.social_links, null)
  const social_links: SocialLinks | null = rawSocialLinks ? {
    instagram: rawSocialLinks.instagram,
    youtube: rawSocialLinks.youtube || rawSocialLinks.youtube_channel, // 兼容舊版欄位名稱
    facebook: rawSocialLinks.facebook,
    threads: rawSocialLinks.threads,
    website: rawSocialLinks.website,
  } : null

  // climbing_start_year - 從 basic_info_data 中讀取
  const startYear = basicInfo?.climbing_start_year
    ? (typeof basicInfo.climbing_start_year === 'string'
        ? parseInt(basicInfo.climbing_start_year, 10)
        : basicInfo.climbing_start_year)
    : null

  return {
    id: backend.id,
    user_id: backend.user_id,
    slug: backend.slug,
    name: backend.name,
    title: backend.title,
    bio: backend.bio,
    avatar_url: backend.avatar_url,
    cover_url: backend.cover_image,
    climbing_start_year: startYear && !isNaN(startYear) ? startYear : null,
    climbing_years:
      startYear && !isNaN(startYear) ? new Date().getFullYear() - startYear : null,
    frequent_locations,
    favorite_route_types,
    home_gym: basicInfo?.home_gym || null,
    tags,
    custom_tags,
    custom_dimensions,
    one_liners,
    stories,
    gallery_images,
    social_links,
    featured_video_id: backend.featured_video_id,
    visibility: backend.visibility || 'public',
    is_featured: backend.is_featured === 1,
    published_at: backend.published_at,
    created_at: backend.created_at,
    updated_at: backend.updated_at,
    total_likes: backend.total_likes || 0,
    total_views: backend.total_views || 0,
    follower_count: backend.follower_count || 0,
    comment_count: 0,
  }
}

/**
 * 將前端 BiographyV2 資料轉換為後端儲存格式
 */
export function transformBiographyV2ToBackend(bio: BiographyV2): {
  tags_data: string
  one_liners_data: string
  stories_data: string
  basic_info_data: string
} {
  // 將 tags 陣列轉為 JSON（使用新格式 TagsDataStorage）
  const tagsStorage: TagsDataStorage = {
    selections: bio.tags,
    custom_tags: bio.custom_tags,
    custom_dimensions: bio.custom_dimensions,
  }
  const tags_data = JSON.stringify(tagsStorage)

  // 將 one_liners 陣列轉為後端格式
  const oneLinersObj: Record<string, { answer: string; visibility: string }> = {}
  bio.one_liners.forEach((item) => {
    oneLinersObj[item.question_id] = {
      answer: item.answer,
      visibility: 'public',
    }
  })
  const one_liners_data = JSON.stringify(oneLinersObj)

  // 將 stories 陣列轉為後端格式（按 category 分組）
  // 注意：這裡需要知道每個 question 屬於哪個 category
  // 暫時使用扁平結構
  const storiesObj: Record<string, Record<string, { answer: string; visibility: string; updated_at: string }>> = {}
  bio.stories.forEach((item) => {
    // 暫時放入 'uncategorized' 類別，實際使用時應根據 question_id 查找對應類別
    if (!storiesObj['uncategorized']) {
      storiesObj['uncategorized'] = {}
    }
    storiesObj['uncategorized'][item.question_id] = {
      answer: item.content,
      visibility: 'public',
      updated_at: new Date().toISOString(),
    }
  })
  const stories_data = JSON.stringify(storiesObj)

  // basic_info_data
  const basic_info_data = JSON.stringify({
    name: bio.name,
    title: bio.title || '',
    bio: bio.bio || '',
    climbing_start_year: bio.climbing_start_year || '',
    frequent_locations: bio.frequent_locations?.join(', ') || '',
    home_gym: bio.home_gym || '',
  })

  return {
    tags_data,
    one_liners_data,
    stories_data,
    basic_info_data,
  }
}

/**
 * 建立空白的 BiographyV2 物件
 */
export function createEmptyBiographyV2(userId: string): BiographyV2 {
  return {
    id: '',
    user_id: userId,
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
    tags: [],
    custom_tags: undefined,
    custom_dimensions: undefined,
    one_liners: [],
    stories: [],
    gallery_images: null,
    social_links: null,
    featured_video_id: null,
    visibility: 'private',
    is_featured: false,
    published_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_likes: 0,
    total_views: 0,
    follower_count: 0,
    comment_count: 0,
  }
}
