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
  emoji: string
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
  climbing_years: number | null // 攀岩年資
  frequent_locations: string[] | null
  home_gym: string | null

  // ═══════════════════════════════════════════
  // 第一層：標籤系統（簡化陣列結構）
  // ═══════════════════════════════════════════
  tags: TagSelection[]

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
  climbing_start_year: number | null
  frequent_locations: string | null // JSON string
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
  // 解析 tags_data - 後端格式為 TagSelection[]
  const tags: TagSelection[] = safeJsonParse<TagSelection[]>(backend.tags_data, []) || []

  // 解析 one_liners_data - 後端格式為 Record<string, { answer, visibility }>
  const oneLinersRaw = safeJsonParse<Record<string, { answer: string; visibility: string }>>(
    backend.one_liners_data,
    {}
  ) || {}
  const one_liners: OneLinerItem[] = Object.entries(oneLinersRaw)
    .filter(([, data]) => data?.answer)
    .map(([question_id, data]) => ({
      question_id,
      answer: data.answer,
      source: 'system' as ContentSource,
    }))

  // 解析 stories_data - 後端格式為 Record<category, Record<field, { answer, visibility, updated_at }>>
  const storiesRaw = safeJsonParse<Record<string, Record<string, { answer: string; visibility: string; updated_at: string } | null>>>(
    backend.stories_data,
    {}
  ) || {}
  const stories: StoryItem[] = Object.values(storiesRaw)
    .flatMap((category) =>
      Object.entries(category || {})
        .filter(([, data]) => data?.answer)
        .map(([question_id, data]) => ({
          question_id,
          content: data!.answer,
          source: 'system' as ContentSource,
        }))
    )

  // 解析其他 JSON 欄位
  const frequent_locations = safeJsonParse<string[] | null>(backend.frequent_locations, null)
  const gallery_images = safeJsonParse<GalleryImage[] | null>(backend.gallery_images, null)
  const social_links = safeJsonParse<SocialLinks | null>(backend.social_links, null)

  return {
    id: backend.id,
    user_id: backend.user_id,
    slug: backend.slug,
    name: backend.name,
    title: backend.title,
    bio: backend.bio,
    avatar_url: backend.avatar_url,
    cover_url: backend.cover_image,
    climbing_years: backend.climbing_start_year,
    frequent_locations,
    home_gym: backend.home_gym,
    tags,
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
  // 將 tags 陣列轉為 JSON
  const tags_data = JSON.stringify(bio.tags)

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
    climbing_start_year: bio.climbing_years || '',
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
    climbing_years: null,
    frequent_locations: null,
    home_gym: null,
    tags: [],
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
