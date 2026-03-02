/**
 * 人物誌故事問題設定
 * 三層式設計的題目配置
 */

/**
 * 故事問題分類
 */
export type StoryCategory =
  | 'growth' // A. 成長與突破
  | 'psychology' // B. 心理與哲學
  | 'community' // C. 社群與連結
  | 'practical' // D. 實用分享
  | 'dreams' // E. 夢想與探索
  | 'life' // F. 生活整合

/**
 * 故事問題定義
 */
export interface StoryQuestion {
  field: string // 對應 Biography 介面的欄位名稱
  category: StoryCategory
  title: string // 問題標題
  subtitle: string // 問題副標題/引導
  placeholder: string // 輸入提示
  icon?: string // Lucide 圖標名稱
}

/**
 * 分類資訊
 */
export interface StoryCategoryInfo {
  id: StoryCategory
  name: string
  description: string
  icon: string
  color: string // Tailwind color class
}

/**
 * 故事分類配置
 */
export const STORY_CATEGORIES: StoryCategoryInfo[] = [
  {
    id: 'growth',
    name: '成長與突破',
    description: '紀錄攀岩路上的重要時刻',
    icon: 'TrendingUp',
    color: 'text-brand-dark',
  },
  {
    id: 'psychology',
    name: '心理與哲學',
    description: '探索攀岩帶來的內在轉變',
    icon: 'Brain',
    color: 'text-brand-dark',
  },
  {
    id: 'community',
    name: '社群與連結',
    description: '分享與岩友們的故事',
    icon: 'Users',
    color: 'text-brand-dark',
  },
  {
    id: 'practical',
    name: '實用分享',
    description: '傳承實用的經驗與技巧',
    icon: 'Lightbulb',
    color: 'text-brand-dark',
  },
  {
    id: 'dreams',
    name: '夢想與探索',
    description: '描繪攀岩的夢想藍圖',
    icon: 'Compass',
    color: 'text-brand-dark',
  },
  {
    id: 'life',
    name: '生活整合',
    description: '攀岩之外的你',
    icon: 'Mountain',
    color: 'text-brand-dark',
  },
]

/**
 * 第二層：核心故事問題
 */
export const CORE_STORY_QUESTIONS: StoryQuestion[] = [
  {
    field: 'climbing_origin',
    category: 'growth',
    title: '你與攀岩的相遇',
    subtitle: '描述第一次接觸攀岩的情景，是什麼讓你想繼續？',
    placeholder: '那年某天，我第一次踏進岩館...',
    icon: 'Sparkles',
  },
  {
    field: 'climbing_meaning',
    category: 'psychology',
    title: '攀岩對你來說是什麼',
    subtitle: '攀岩在你生活中扮演什麼角色？帶給你什麼？',
    placeholder: '攀岩對我來說，是...',
    icon: 'Mountain',
  },
  {
    field: 'advice_to_self',
    category: 'practical',
    title: '給剛開始攀岩的自己',
    subtitle: '如果能回到起點，你會對自己說什麼？',
    placeholder: '如果能回到那時候，我想說...',
    icon: 'MessageCircle',
  },
]

/**
 * 第三層：進階故事問題 - A. 成長與突破（6題）
 */
export const GROWTH_QUESTIONS: StoryQuestion[] = [
  {
    field: 'memorable_moment',
    category: 'growth',
    title: '最難忘的攀登經歷',
    subtitle: '可以是某個瞬間或一次完整的攀登，聚焦在最觸動你的部分',
    placeholder: '那一次攀登，讓我永遠難忘...',
    icon: 'Star',
  },
  {
    field: 'biggest_challenge',
    category: 'growth',
    title: '遇到的最大挑戰與如何面對',
    subtitle: '描述具體的挑戰（受傷、瓶頸、恐懼等）和你的應對方式',
    placeholder: '我曾經遇到最大的挑戰是...',
    icon: 'Mountain',
  },
  {
    field: 'breakthrough_story',
    category: 'growth',
    title: '最大的突破經歷',
    subtitle: '難度突破、心理突破、技術突破等',
    placeholder: '那次突破讓我明白了...',
    icon: 'TrendingUp',
  },
  {
    field: 'first_outdoor',
    category: 'growth',
    title: '第一次戶外攀岩的經歷',
    subtitle: '第一次從室內走到戶外的經驗、感受與收穫',
    placeholder: '第一次戶外攀岩，我記得...',
    icon: 'TreePine',
  },
  {
    field: 'first_grade',
    category: 'growth',
    title: '第一次完攀某個難度的感覺',
    subtitle: '選一個對你有意義的難度（如 5.11a, V4），分享過程',
    placeholder: '當我第一次完攀那個難度時...',
    icon: 'Trophy',
  },
  {
    field: 'frustrating_climb',
    category: 'growth',
    title: '最挫折的一次攀登經歷',
    subtitle: '失敗、放棄、或特別困難的經歷，以及如何面對',
    placeholder: '那次挫折讓我學到...',
    icon: 'CloudRain',
  },
]

/**
 * 第三層：進階故事問題 - B. 心理與哲學（6題）
 */
export const PSYCHOLOGY_QUESTIONS: StoryQuestion[] = [
  {
    field: 'fear_management',
    category: 'psychology',
    title: '如何克服攀岩中的恐懼',
    subtitle: '分享你克服墜落、高度、失敗等恐懼的具體方法',
    placeholder: '面對恐懼時，我會...',
    icon: 'Shield',
  },
  {
    field: 'climbing_lesson',
    category: 'psychology',
    title: '攀岩教會你最重要的一件事',
    subtitle: '可以是關於失敗、堅持、專注、信任等的領悟',
    placeholder: '攀岩教會我最重要的是...',
    icon: 'Lightbulb',
  },
  {
    field: 'failure_perspective',
    category: 'psychology',
    title: '攀岩如何改變你看待失敗',
    subtitle: '攀岩經驗如何影響你面對失敗的態度',
    placeholder: '攀岩改變了我看待失敗的方式...',
    icon: 'RefreshCw',
  },
  {
    field: 'flow_moment',
    category: 'psychology',
    title: '在岩壁上的心流時刻',
    subtitle: '描述一次完全專注、忘我的攀爬體驗',
    placeholder: '那種心流的感覺...',
    icon: 'Waves',
  },
  {
    field: 'life_balance',
    category: 'psychology',
    title: '攀岩與生活的平衡',
    subtitle: '如何在工作、家庭、攀岩之間取得平衡',
    placeholder: '在平衡生活與攀岩上，我的方式是...',
    icon: 'Scale',
  },
  {
    field: 'unexpected_gain',
    category: 'psychology',
    title: '攀岩帶給你的意外收穫',
    subtitle: '原本沒預期到，但因攀岩而獲得的好處',
    placeholder: '沒想到攀岩還帶給我...',
    icon: 'Gift',
  },
]

/**
 * 第三層：進階故事問題 - C. 社群與連結（6題）
 */
export const COMMUNITY_QUESTIONS: StoryQuestion[] = [
  {
    field: 'climbing_mentor',
    category: 'community',
    title: '攀岩路上的貴人',
    subtitle: '教練、岩友、家人，或甚至是某個影片中的攀岩者',
    placeholder: '在我的攀岩路上，有一個人...',
    icon: 'UserCheck',
  },
  {
    field: 'climbing_partner',
    category: 'community',
    title: '最喜歡的攀岩夥伴與故事',
    subtitle: '分享一個特別的岩友以及你們之間的故事',
    placeholder: '我和我的繩伴...',
    icon: 'Users',
  },
  {
    field: 'funny_moment',
    category: 'community',
    title: '攀岩時最尷尬或搞笑的時刻',
    subtitle: '輕鬆有趣的經歷，讓大家笑一笑',
    placeholder: '有一次超尷尬的是...',
    icon: 'Smile',
  },
  {
    field: 'favorite_spot',
    category: 'community',
    title: '最推薦的攀岩地點與原因',
    subtitle: '室內或戶外皆可，說明為何推薦',
    placeholder: '我最推薦的攀岩地點是...',
    icon: 'MapPin',
  },
  {
    field: 'advice_to_group',
    category: 'community',
    title: '想對某個族群說的話',
    subtitle: '給女生/新手/年長者/小孩等特定族群的建議',
    placeholder: '我想對...說的是...',
    icon: 'MessageSquare',
  },
  {
    field: 'climbing_space',
    category: 'community',
    title: '最難忘的岩館或攀岩空間',
    subtitle: '對你有特殊意義的攀岩場所',
    placeholder: '對我來說最特別的攀岩空間是...',
    icon: 'Building',
  },
]

/**
 * 第三層：進階故事問題 - D. 實用分享（6題）
 */
export const PRACTICAL_QUESTIONS: StoryQuestion[] = [
  {
    field: 'injury_recovery',
    category: 'practical',
    title: '一次受傷經歷與從中學到的事',
    subtitle: '描述一次具體的受傷經歷、復原過程，以及這次經驗帶給你的收穫與啟發',
    placeholder: '那次受傷讓我學到...',
    icon: 'MountainPulse',
  },
  {
    field: 'memorable_route',
    category: 'practical',
    title: '最想分享的一次攀登經驗',
    subtitle: '可以是某條路線、某次戶外攀登，分享過程、技巧、心得',
    placeholder: '這條路線我最想分享的是...',
    icon: 'Route',
  },
  {
    field: 'training_method',
    category: 'practical',
    title: '你的訓練方式與心得',
    subtitle: '分享你的訓練內容、頻率、心得',
    placeholder: '我的訓練方式是...',
    icon: 'Dumbbell',
  },
  {
    field: 'effective_practice',
    category: 'practical',
    title: '對你最有效的練習方法',
    subtitle: '某個特別有效的練習，幫助你進步',
    placeholder: '這個練習方法對我特別有效...',
    icon: 'Target',
  },
  {
    field: 'technique_tip',
    category: 'practical',
    title: '一個對你很有幫助的技巧',
    subtitle: '某個技巧的領悟或訣竅（如腳法、重心等）',
    placeholder: '這個技巧對我很有幫助...',
    icon: 'Wrench',
  },
  {
    field: 'gear_choice',
    category: 'practical',
    title: '攀岩裝備的選擇心得',
    subtitle: '鞋子、粉袋、確保器等裝備的選擇經驗',
    placeholder: '關於裝備選擇，我的經驗是...',
    icon: 'Backpack',
  },
]

/**
 * 第三層：進階故事問題 - E. 夢想與探索（6題）
 */
export const DREAMS_QUESTIONS: StoryQuestion[] = [
  {
    field: 'dream_climb',
    category: 'dreams',
    title: '夢想中的攀登',
    subtitle: '國內外皆可，說明這個地點或路線為何吸引你',
    placeholder: '我夢想中的攀登是...',
    icon: 'Cloud',
  },
  {
    field: 'climbing_trip',
    category: 'dreams',
    title: '一次特別的攀岩旅行',
    subtitle: '國內外攀岩旅行的經歷與收穫',
    placeholder: '那次攀岩旅行...',
    icon: 'Plane',
  },
  {
    field: 'bucket_list_story',
    category: 'dreams',
    title: '完成人生清單中某個目標的故事',
    subtitle: '詳細描述完成過程（與人生清單完成故事可互補）',
    placeholder: '當我完成這個目標時...',
    icon: 'CheckCircle',
  },
  {
    field: 'climbing_goal',
    category: 'dreams',
    title: '目前最想達成的攀岩目標',
    subtitle: '現在正在努力的目標與進度',
    placeholder: '我目前最想達成的目標是...',
    icon: 'Flag',
  },
  {
    field: 'climbing_style',
    category: 'dreams',
    title: '最吸引你的攀岩風格',
    subtitle: '抱石/先鋒/裂隙/屋簷等，為何吸引你',
    placeholder: '最吸引我的攀岩風格是...',
    icon: 'Layers',
  },
  {
    field: 'climbing_inspiration',
    category: 'dreams',
    title: '啟發你的攀岩者或影片',
    subtitle: '某個攀岩者、影片、書籍對你的啟發',
    placeholder: '啟發我最深的是...',
    icon: 'Video',
  },
]

/**
 * 第三層：進階故事問題 - F. 生活整合（1題）
 */
export const LIFE_QUESTIONS: StoryQuestion[] = [
  {
    field: 'life_outside_climbing',
    category: 'life',
    title: '除了攀岩，還讓我著迷的事',
    subtitle: '其他讓你投入熱情的興趣或活動',
    placeholder: '除了攀岩，我也熱愛...',
    icon: 'Palette',
  },
]

/**
 * 所有進階故事問題（按分類排序）
 */
export const ADVANCED_STORY_QUESTIONS: StoryQuestion[] = [
  ...GROWTH_QUESTIONS,
  ...PSYCHOLOGY_QUESTIONS,
  ...COMMUNITY_QUESTIONS,
  ...PRACTICAL_QUESTIONS,
  ...DREAMS_QUESTIONS,
  ...LIFE_QUESTIONS,
]

/**
 * 所有故事問題（核心 + 進階）
 */
export const ALL_STORY_QUESTIONS: StoryQuestion[] = [
  ...CORE_STORY_QUESTIONS,
  ...ADVANCED_STORY_QUESTIONS,
]

/**
 * 根據分類取得問題
 */
export function getQuestionsByCategory(category: StoryCategory): StoryQuestion[] {
  return ADVANCED_STORY_QUESTIONS.filter((q) => q.category === category)
}

/**
 * 根據欄位名稱取得問題
 */
export function getQuestionByField(field: string): StoryQuestion | undefined {
  return ALL_STORY_QUESTIONS.find((q) => q.field === field)
}

/**
 * 計算故事完成進度
 */
export function calculateStoryProgress(biography: Record<string, unknown>): {
  total: number
  completed: number
  percentage: number
  byCategory: Record<StoryCategory, { total: number; completed: number }>
} {
  const byCategory: Record<StoryCategory, { total: number; completed: number }> = {
    growth: { total: 0, completed: 0 },
    psychology: { total: 0, completed: 0 },
    community: { total: 0, completed: 0 },
    practical: { total: 0, completed: 0 },
    dreams: { total: 0, completed: 0 },
    life: { total: 0, completed: 0 },
  }

  let total = 0
  let completed = 0

  ADVANCED_STORY_QUESTIONS.forEach((question) => {
    total++
    byCategory[question.category].total++

    const value = biography[question.field]
    if (value && typeof value === 'string' && value.trim().length > 0) {
      completed++
      byCategory[question.category].completed++
    }
  })

  return {
    total,
    completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    byCategory,
  }
}

/**
 * 取得未填寫的問題欄位
 */
export function getUnfilledQuestions(biography: Record<string, unknown>): StoryQuestion[] {
  return ADVANCED_STORY_QUESTIONS.filter((question) => {
    const value = biography[question.field]
    return !value || (typeof value === 'string' && value.trim().length === 0)
  })
}

/**
 * 取得已填寫的問題欄位
 */
export function getFilledQuestions(biography: Record<string, unknown>): StoryQuestion[] {
  return ADVANCED_STORY_QUESTIONS.filter((question) => {
    const value = biography[question.field]
    return value && typeof value === 'string' && value.trim().length > 0
  })
}

/**
 * 將故事按分類分組，並分開已填寫和未填寫
 */
export function groupStoriesByCategory(
  biography: Record<string, unknown>
): {
  filled: Map<StoryCategory, StoryQuestion[]>
  unfilled: StoryQuestion[]
} {
  const filled = new Map<StoryCategory, StoryQuestion[]>()
  const unfilled: StoryQuestion[] = []

  // 初始化所有分類
  STORY_CATEGORIES.forEach((cat) => {
    filled.set(cat.id, [])
  })

  // 分類故事
  ADVANCED_STORY_QUESTIONS.forEach((question) => {
    const value = biography[question.field]
    const hasContent = value && typeof value === 'string' && value.trim().length > 0

    if (hasContent) {
      const categoryQuestions = filled.get(question.category) || []
      categoryQuestions.push(question)
      filled.set(question.category, categoryQuestions)
    } else {
      unfilled.push(question)
    }
  })

  return { filled, unfilled }
}
