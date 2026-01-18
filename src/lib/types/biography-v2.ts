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
 * 用戶的標籤選擇結果
 */
export interface BiographyTagsV2 {
  selections: Record<string, string[]> // key: 維度 ID，value: 選中的選項 ID 陣列
  custom_dimensions?: TagDimension[]
  custom_options?: TagOption[]
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
 * 用戶的一句話回答
 */
export interface OneLinerAnswer {
  question_id: string
  answer: string
  updated_at: string
}

/**
 * 一句話系列資料結構
 */
export interface BiographyOneLinersV2 {
  answers: OneLinerAnswer[]
  custom_questions?: OneLinerQuestion[]
}

// ═══════════════════════════════════════════
// 深度故事類型
// ═══════════════════════════════════════════

/**
 * 故事分類定義
 */
export interface StoryCategory extends ExtensibleItem {
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
 * 用戶的故事回答
 */
export interface StoryAnswer {
  question_id: string
  content: string
  updated_at: string
  word_count?: number
}

/**
 * 深度故事資料結構
 */
export interface BiographyStoriesV2 {
  answers: StoryAnswer[]
  custom_categories?: StoryCategory[]
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
  cover_image: string | null

  // ═══════════════════════════════════════════
  // 攀岩基本資料
  // ═══════════════════════════════════════════
  climbing_start_year: number | null
  frequent_locations: string[] | null
  home_gym: string | null

  // ═══════════════════════════════════════════
  // 第一層：標籤系統（開放式）
  // ═══════════════════════════════════════════
  tags: BiographyTagsV2 | null

  // ═══════════════════════════════════════════
  // 第二層：一句話系列（開放式）
  // ═══════════════════════════════════════════
  one_liners: BiographyOneLinersV2 | null

  // ═══════════════════════════════════════════
  // 第三層：深度故事（開放式）
  // ═══════════════════════════════════════════
  stories: BiographyStoriesV2 | null

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
  stories: BiographyStoriesV2 | null,
  allQuestions: StoryQuestion[]
): StoryQuestion | null {
  if (!allQuestions.length) return null

  const answeredQuestionIds = new Set(
    (stories?.answers || []).map((a) => a.question_id)
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
