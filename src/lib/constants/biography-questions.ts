/**
 * 系統預設問題：一句話系列 + 深度故事
 *
 * @see docs/persona-content-redesign.md
 */

import type {
  OneLinerQuestion,
  StoryCategoryDefinition,
  StoryQuestion,
} from '@/lib/types/biography-v2'

// ═══════════════════════════════════════════
// 一句話系列 ID 常量
// ═══════════════════════════════════════════

export const SYSTEM_ONELINER_QUESTIONS = {
  WHY_STARTED: 'sys_ol_why_started',
  FAVORITE_PLACE: 'sys_ol_favorite_place',
  BEST_MOMENT: 'sys_ol_best_moment',
  ADVICE_FOR_BEGINNERS: 'sys_ol_advice_for_beginners',
  CURRENT_GOAL: 'sys_ol_current_goal',
  CLIMBING_LESSON: 'sys_ol_climbing_lesson',
  CLIMBING_STYLE_DESC: 'sys_ol_climbing_style_desc',
  LIFE_OUTSIDE: 'sys_ol_life_outside',
} as const

export type SystemOneLinerQuestionId =
  (typeof SYSTEM_ONELINER_QUESTIONS)[keyof typeof SYSTEM_ONELINER_QUESTIONS]

// ═══════════════════════════════════════════
// 一句話問題清單
// ═══════════════════════════════════════════

export const SYSTEM_ONELINER_QUESTION_LIST: OneLinerQuestion[] = [
  {
    id: SYSTEM_ONELINER_QUESTIONS.WHY_STARTED,
    source: 'system',
    question: '為什麼開始攀岩？',
    format_hint: '因為＿＿＿',
    placeholder: '朋友拉我去，結果就回不去了',
    order: 1,
  },
  {
    id: SYSTEM_ONELINER_QUESTIONS.BEST_MOMENT,
    source: 'system',
    question: '爬岩最爽的是？',
    format_hint: '當＿＿＿的時候',
    placeholder: '終於送出卡了一個月的 project',
    order: 2,
  },
  {
    id: SYSTEM_ONELINER_QUESTIONS.ADVICE_FOR_BEGINNERS,
    source: 'system',
    question: '給新手一句話？',
    format_hint: null,
    placeholder: '不要急，享受過程最重要',
    order: 3,
  },
  {
    id: SYSTEM_ONELINER_QUESTIONS.FAVORITE_PLACE,
    source: 'system',
    question: '最喜歡在哪裡爬？',
    format_hint: null,
    placeholder: '龍洞的海邊岩壁',
    order: 4,
  },
  {
    id: SYSTEM_ONELINER_QUESTIONS.CURRENT_GOAL,
    source: 'system',
    question: '目前的攀岩小目標？',
    format_hint: null,
    placeholder: '這個月送出 V4',
    order: 5,
  },
  {
    id: SYSTEM_ONELINER_QUESTIONS.CLIMBING_LESSON,
    source: 'system',
    question: '攀岩教會我的一件事？',
    format_hint: null,
    placeholder: '失敗沒什麼，再來就好',
    order: 6,
  },
  {
    id: SYSTEM_ONELINER_QUESTIONS.CLIMBING_STYLE_DESC,
    source: 'system',
    question: '用一句話形容你的攀岩風格？',
    format_hint: null,
    placeholder: '慢慢來但很穩',
    order: 7,
  },
  {
    id: SYSTEM_ONELINER_QUESTIONS.LIFE_OUTSIDE,
    source: 'system',
    question: '攀岩之外，你是誰？',
    format_hint: null,
    placeholder: '工程師/學生/全職岩棍',
    order: 8,
  },
]

// ═══════════════════════════════════════════
// 故事分類 ID 常量
// ═══════════════════════════════════════════

export const SYSTEM_STORY_CATEGORIES = {
  GROWTH: 'sys_cat_growth',
  PSYCHOLOGY: 'sys_cat_psychology',
  COMMUNITY: 'sys_cat_community',
  PRACTICAL: 'sys_cat_practical',
  DREAMS: 'sys_cat_dreams',
  LIFE: 'sys_cat_life',
} as const

export type SystemStoryCategoryId =
  (typeof SYSTEM_STORY_CATEGORIES)[keyof typeof SYSTEM_STORY_CATEGORIES]

// ═══════════════════════════════════════════
// 故事分類定義
// ═══════════════════════════════════════════

export const SYSTEM_STORY_CATEGORY_LIST: StoryCategoryDefinition[] = [
  {
    id: SYSTEM_STORY_CATEGORIES.GROWTH,
    source: 'system',
    name: '成長與突破',
    emoji: '🌱',
    description: '你的攀岩成長故事',
    order: 1,
  },
  {
    id: SYSTEM_STORY_CATEGORIES.PSYCHOLOGY,
    source: 'system',
    name: '心理與哲學',
    emoji: '🧠',
    description: '攀岩帶給你的思考',
    order: 2,
  },
  {
    id: SYSTEM_STORY_CATEGORIES.COMMUNITY,
    source: 'system',
    name: '社群與連結',
    emoji: '😄',
    description: '攀岩社群的故事',
    order: 3,
  },
  {
    id: SYSTEM_STORY_CATEGORIES.PRACTICAL,
    source: 'system',
    name: '實用分享',
    emoji: '🔧',
    description: '經驗與技巧分享',
    order: 4,
  },
  {
    id: SYSTEM_STORY_CATEGORIES.DREAMS,
    source: 'system',
    name: '夢想與探索',
    emoji: '🎯',
    description: '攀岩的夢想與目標',
    order: 5,
  },
  {
    id: SYSTEM_STORY_CATEGORIES.LIFE,
    source: 'system',
    name: '生活整合',
    emoji: '🌈',
    description: '攀岩與生活的交集',
    order: 6,
  },
]

// ═══════════════════════════════════════════
// 故事問題定義
// ═══════════════════════════════════════════

// A. 成長與突破（6題）
const growthQuestions: StoryQuestion[] = [
  {
    id: 'sys_story_growth_memorable_moment',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.GROWTH,
    title: '有沒有某次攀爬讓你一直記到現在？',
    subtitle: '不一定要多厲害，只要對你有意義',
    placeholder: '去年第一次去龍洞...',
    difficulty: 'easy',
    order: 1,
  },
  {
    id: 'sys_story_growth_biggest_challenge',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.GROWTH,
    title: '有遇過什麼卡關的時候嗎？',
    subtitle: '卡關也是成長的一部分',
    placeholder: '有一段時間怎麼爬都沒進步...',
    difficulty: 'medium',
    order: 2,
  },
  {
    id: 'sys_story_growth_breakthrough',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.GROWTH,
    title: '最近有沒有覺得自己進步的時刻？',
    subtitle: '小小的進步也值得記錄',
    placeholder: '上週終於送出卡了一個月的那條路線...',
    difficulty: 'easy',
    order: 3,
  },
  {
    id: 'sys_story_growth_first_outdoor',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.GROWTH,
    title: '還記得第一次戶外攀岩嗎？',
    subtitle: '室內和戶外的差別',
    placeholder: '第一次站在真的岩壁前...',
    difficulty: 'easy',
    order: 4,
  },
  {
    id: 'sys_story_growth_first_grade',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.GROWTH,
    title: '有沒有哪條路線讓你特別有成就感？',
    subtitle: '可能是第一次突破某個難度',
    placeholder: '第一次送出 V4 的時候...',
    difficulty: 'easy',
    order: 5,
  },
  {
    id: 'sys_story_growth_frustrating',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.GROWTH,
    title: '有沒有讓你很挫折的經驗？後來怎麼面對？',
    subtitle: '挫折也是故事的一部分',
    placeholder: '有一次摔傷了，休息了三個月...',
    difficulty: 'medium',
    order: 6,
  },
]

// B. 心理與哲學（6題）
const psychologyQuestions: StoryQuestion[] = [
  {
    id: 'sys_story_psychology_fear',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.PSYCHOLOGY,
    title: '會怕高或怕墜落嗎？怎麼面對的？',
    subtitle: '每個人都有害怕的時候',
    placeholder: '剛開始真的很怕，每次爬高一點心跳就加速...',
    difficulty: 'medium',
    order: 1,
  },
  {
    id: 'sys_story_psychology_lesson',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.PSYCHOLOGY,
    title: '攀岩有沒有讓你學到什麼？',
    subtitle: '可能是對生活的啟發',
    placeholder: '學會了面對失敗，一次不行就再來...',
    difficulty: 'medium',
    order: 2,
  },
  {
    id: 'sys_story_psychology_failure',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.PSYCHOLOGY,
    title: '爬不上去的時候會怎麼想？',
    subtitle: '你的心態是什麼',
    placeholder: '會有點挫折，但告訴自己下次再來...',
    difficulty: 'easy',
    order: 3,
  },
  {
    id: 'sys_story_psychology_flow',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.PSYCHOLOGY,
    title: '有沒有爬到忘記時間的經驗？',
    subtitle: '那種完全投入的感覺',
    placeholder: '有一次在龍洞，不知不覺就爬了六小時...',
    difficulty: 'easy',
    order: 4,
  },
  {
    id: 'sys_story_psychology_balance',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.PSYCHOLOGY,
    title: '怎麼安排攀岩和其他生活？',
    subtitle: '工作、家庭、社交的平衡',
    placeholder: '平日上班，週末盡量安排一天去爬...',
    difficulty: 'medium',
    order: 5,
  },
  {
    id: 'sys_story_psychology_gain',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.PSYCHOLOGY,
    title: '攀岩有帶給你什麼意外的收穫嗎？',
    subtitle: '可能是你沒想到的好處',
    placeholder: '認識了很多很棒的朋友...',
    difficulty: 'deep',
    order: 6,
  },
]

// C. 社群與連結（6題）
const communityQuestions: StoryQuestion[] = [
  {
    id: 'sys_story_community_mentor',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.COMMUNITY,
    title: '有沒有想感謝的人？',
    subtitle: '可能是教你的人、一起爬的朋友',
    placeholder: '很感謝第一個帶我去爬的朋友...',
    difficulty: 'easy',
    order: 1,
  },
  {
    id: 'sys_story_community_partner',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.COMMUNITY,
    title: '有沒有固定的攀岩夥伴？有什麼故事？',
    subtitle: '你們怎麼認識的',
    placeholder: '在岩館認識的，現在每週都約...',
    difficulty: 'easy',
    order: 2,
  },
  {
    id: 'sys_story_community_funny',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.COMMUNITY,
    title: '有沒有什麼搞笑或尷尬的經歷？',
    subtitle: '爬岩的糗事也很有趣',
    placeholder: '有一次在岩館，爬到一半褲子裂開了...',
    difficulty: 'easy',
    order: 3,
  },
  {
    id: 'sys_story_community_spot',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.COMMUNITY,
    title: '最常去或最推薦哪裡爬？為什麼？',
    subtitle: '分享你的秘密基地',
    placeholder: '最常去原岩，因為離家近而且氣氛很好...',
    difficulty: 'easy',
    order: 4,
  },
  {
    id: 'sys_story_community_advice',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.COMMUNITY,
    title: '想對新手（或某個族群）說什麼？',
    subtitle: '你的建議或鼓勵',
    placeholder: '不要因為爬不上去就覺得丟臉...',
    difficulty: 'medium',
    order: 5,
  },
  {
    id: 'sys_story_community_space',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.COMMUNITY,
    title: '有沒有對你特別有意義的岩館或地點？',
    subtitle: '那個地方對你有什麼意義',
    placeholder: '龍洞對我來說是特別的地方...',
    difficulty: 'medium',
    order: 6,
  },
]

// D. 實用分享（6題）
const practicalQuestions: StoryQuestion[] = [
  {
    id: 'sys_story_practical_injury',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.PRACTICAL,
    title: '有受過傷嗎？怎麼復原的？',
    subtitle: '分享你的經驗',
    placeholder: '有一次 A2 滑輪受傷，休息了兩個月...',
    difficulty: 'medium',
    order: 1,
  },
  {
    id: 'sys_story_practical_route',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.PRACTICAL,
    title: '有沒有想分享的路線或經驗？',
    subtitle: '你的私房路線',
    placeholder: '龍洞的那條 5.10a 很適合練習...',
    difficulty: 'easy',
    order: 2,
  },
  {
    id: 'sys_story_practical_training',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.PRACTICAL,
    title: '你平常怎麼練習？有什麼小習慣？',
    subtitle: '你的訓練方式',
    placeholder: '每次爬完都會做伸展...',
    difficulty: 'easy',
    order: 3,
  },
  {
    id: 'sys_story_practical_practice',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.PRACTICAL,
    title: '有沒有對你特別有效的練習方法？',
    subtitle: '分享你的秘訣',
    placeholder: '用 4x4 訓練法之後，耐力進步很多...',
    difficulty: 'medium',
    order: 4,
  },
  {
    id: 'sys_story_practical_technique',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.PRACTICAL,
    title: '有沒有學到什麼實用的技巧？',
    subtitle: '可能是某個動作或心法',
    placeholder: '學會 heel hook 之後，很多路線突然變簡單了...',
    difficulty: 'easy',
    order: 5,
  },
  {
    id: 'sys_story_practical_gear',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.PRACTICAL,
    title: '關於裝備有沒有什麼心得？',
    subtitle: '你的裝備觀',
    placeholder: '攀岩鞋真的要試穿，網購踩雷過...',
    difficulty: 'easy',
    order: 6,
  },
]

// E. 夢想與探索（6題）
const dreamsQuestions: StoryQuestion[] = [
  {
    id: 'sys_story_dreams_dream_climb',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.DREAMS,
    title: '如果能去任何地方爬，你想去哪？',
    subtitle: '你的夢想攀岩地點',
    placeholder: '想去優勝美地爬 El Cap...',
    difficulty: 'easy',
    order: 1,
  },
  {
    id: 'sys_story_dreams_trip',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.DREAMS,
    title: '有沒有印象深刻的攀岩旅行？',
    subtitle: '分享你的旅行故事',
    placeholder: '去泰國的喀比爬了一週...',
    difficulty: 'easy',
    order: 2,
  },
  {
    id: 'sys_story_dreams_bucket_list',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.DREAMS,
    title: '有沒有完成過什麼攀岩目標？感覺如何？',
    subtitle: '你的里程碑',
    placeholder: '去年終於完成了龍洞的經典路線...',
    difficulty: 'medium',
    order: 3,
  },
  {
    id: 'sys_story_dreams_goal',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.DREAMS,
    title: '最近有什麼想達成的小目標？',
    subtitle: '你現在在努力什麼',
    placeholder: '想在這個月內送出那條紫色 V4...',
    difficulty: 'easy',
    order: 4,
  },
  {
    id: 'sys_story_dreams_style',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.DREAMS,
    title: '最喜歡什麼樣的路線或風格？',
    subtitle: '你的攀岩偏好',
    placeholder: '喜歡技巧型的 slab...',
    difficulty: 'easy',
    order: 5,
  },
  {
    id: 'sys_story_dreams_inspiration',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.DREAMS,
    title: '有沒有啟發你的人、影片或故事？',
    subtitle: '誰或什麼啟發了你',
    placeholder: 'Alex Honnold 的 Free Solo 看了好幾遍...',
    difficulty: 'easy',
    order: 6,
  },
]

// F. 生活整合（1題）
const lifeQuestions: StoryQuestion[] = [
  {
    id: 'sys_story_life_outside',
    source: 'system',
    category_id: SYSTEM_STORY_CATEGORIES.LIFE,
    title: '攀岩之外，還有什麼讓你著迷？',
    subtitle: '你的其他興趣',
    placeholder: '還喜歡衝浪和露營...',
    difficulty: 'easy',
    order: 1,
  },
]

// ═══════════════════════════════════════════
// 彙整所有故事問題
// ═══════════════════════════════════════════

export const SYSTEM_STORY_QUESTION_LIST: StoryQuestion[] = [
  ...growthQuestions,
  ...psychologyQuestions,
  ...communityQuestions,
  ...practicalQuestions,
  ...dreamsQuestions,
  ...lifeQuestions,
]

// ═══════════════════════════════════════════
// 工具函數
// ═══════════════════════════════════════════

/**
 * 根據分類 ID 取得分類
 */
export function getStoryCategoryById(
  categoryId: string
): StoryCategoryDefinition | undefined {
  return SYSTEM_STORY_CATEGORY_LIST.find((cat) => cat.id === categoryId)
}

/**
 * 根據分類 ID 取得該分類的所有問題
 */
export function getStoryQuestionsByCategory(
  categoryId: string
): StoryQuestion[] {
  return SYSTEM_STORY_QUESTION_LIST.filter(
    (q) => q.category_id === categoryId
  ).sort((a, b) => a.order - b.order)
}

/**
 * 根據問題 ID 取得問題
 */
export function getStoryQuestionById(
  questionId: string
): StoryQuestion | undefined {
  return SYSTEM_STORY_QUESTION_LIST.find((q) => q.id === questionId)
}

/**
 * 根據問題 ID 取得所屬分類
 */
export function getStoryCategoryByQuestionId(
  questionId: string
): StoryCategoryDefinition | undefined {
  const question = getStoryQuestionById(questionId)
  if (!question) return undefined
  return getStoryCategoryById(question.category_id)
}

/**
 * 根據一句話問題 ID 取得問題
 */
export function getOneLinerQuestionById(
  questionId: string
): OneLinerQuestion | undefined {
  return SYSTEM_ONELINER_QUESTION_LIST.find((q) => q.id === questionId)
}

/**
 * 取得故事問題按分類分組
 */
export function getStoryQuestionsGroupedByCategory(): Map<
  StoryCategoryDefinition,
  StoryQuestion[]
> {
  const grouped = new Map<StoryCategoryDefinition, StoryQuestion[]>()

  for (const category of SYSTEM_STORY_CATEGORY_LIST) {
    const questions = getStoryQuestionsByCategory(category.id)
    grouped.set(category, questions)
  }

  return grouped
}

/**
 * 計算故事完成進度
 */
export function calculateStoryProgress(answeredQuestionIds: Set<string>): {
  byCategory: Map<string, { completed: number; total: number }>
  total: { completed: number; total: number }
} {
  const byCategory = new Map<string, { completed: number; total: number }>()
  let totalCompleted = 0
  let totalQuestions = 0

  for (const category of SYSTEM_STORY_CATEGORY_LIST) {
    const questions = getStoryQuestionsByCategory(category.id)
    const completed = questions.filter((q) =>
      answeredQuestionIds.has(q.id)
    ).length

    byCategory.set(category.id, {
      completed,
      total: questions.length,
    })

    totalCompleted += completed
    totalQuestions += questions.length
  }

  return {
    byCategory,
    total: {
      completed: totalCompleted,
      total: totalQuestions,
    },
  }
}

// ═══════════════════════════════════════════
// StoryCategory 類型映射
// ═══════════════════════════════════════════

/**
 * 將系統分類 ID 映射到 StoryCategory 類型
 */
const CATEGORY_ID_TO_TYPE: Record<string, import('@/lib/types/biography-v2').StoryCategory> = {
  [SYSTEM_STORY_CATEGORIES.GROWTH]: 'growth',
  [SYSTEM_STORY_CATEGORIES.PSYCHOLOGY]: 'psychology',
  [SYSTEM_STORY_CATEGORIES.COMMUNITY]: 'community',
  [SYSTEM_STORY_CATEGORIES.PRACTICAL]: 'practical',
  [SYSTEM_STORY_CATEGORIES.DREAMS]: 'dreams',
  [SYSTEM_STORY_CATEGORIES.LIFE]: 'life',
}

/**
 * 取得故事問題按 StoryCategory 類型分組
 * 用於 ProfileEditor 組件
 */
export function getStoryQuestionsByStoryCategory(): Record<
  import('@/lib/types/biography-v2').StoryCategory,
  StoryQuestion[]
> {
  return {
    growth: getStoryQuestionsByCategory(SYSTEM_STORY_CATEGORIES.GROWTH),
    psychology: getStoryQuestionsByCategory(SYSTEM_STORY_CATEGORIES.PSYCHOLOGY),
    community: getStoryQuestionsByCategory(SYSTEM_STORY_CATEGORIES.COMMUNITY),
    practical: getStoryQuestionsByCategory(SYSTEM_STORY_CATEGORIES.PRACTICAL),
    dreams: getStoryQuestionsByCategory(SYSTEM_STORY_CATEGORIES.DREAMS),
    life: getStoryQuestionsByCategory(SYSTEM_STORY_CATEGORIES.LIFE),
  }
}

/**
 * 將系統分類 ID 轉換為 StoryCategory 類型
 */
export function categoryIdToType(categoryId: string): import('@/lib/types/biography-v2').StoryCategory | undefined {
  return CATEGORY_ID_TO_TYPE[categoryId]
}
