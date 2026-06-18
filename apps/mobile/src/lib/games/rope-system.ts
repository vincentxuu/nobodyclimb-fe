export type RopeDifficulty = 'easy' | 'medium' | 'hard'

export interface RopeCategory {
  id: string
  name: string
  description: string
  questionsCount: number
  difficulty: RopeDifficulty
  parentName: string
  isLocked: boolean
}

export interface RopeQuestion {
  id: string
  categoryId: string
  type: 'choice' | 'ordering' | 'situation'
  scenario?: string
  question: string
  options: Array<{ id: string; text: string; image?: string }>
  correctAnswer: string | string[]
  explanation: string
  hint?: string
  referenceSources?: string[]
  imageUrl?: string
  tags?: string[]
  difficulty: RopeDifficulty
}

interface RawRopeQuestion {
  id: string
  categoryId: string
  type: 'choice' | 'ordering' | 'situation'
  difficulty: 1 | 2 | 3
  scenario?: string
  question: string
  options: Array<{ id: string; text: string; image?: string }>
  correctAnswer: string | string[]
  explanation?: string
  hint?: string
  referenceSources?: string[]
  imageUrl?: string
  tags?: string[]
}

export const ROPE_CATEGORIES: RopeCategory[] = [
  {
    id: 'sport-belay',
    name: '基礎確保',
    description: '學習正確的確保技術與安全觀念',
    questionsCount: 15,
    difficulty: 'easy',
    parentName: '運動攀登',
    isLocked: false,
  },
  {
    id: 'sport-lead',
    name: '先鋒攀登',
    description: '掌握先鋒攀登的繩索管理與掛繩技巧',
    questionsCount: 20,
    difficulty: 'medium',
    parentName: '運動攀登',
    isLocked: false,
  },
  {
    id: 'sport-toprope',
    name: '頂繩架設',
    description: '學習頂繩系統的架設與安全確認',
    questionsCount: 15,
    difficulty: 'medium',
    parentName: '運動攀登',
    isLocked: false,
  },
  {
    id: 'sport-rappel',
    name: '垂降系統',
    description: '掌握垂降設備操作與安全程序',
    questionsCount: 15,
    difficulty: 'medium',
    parentName: '運動攀登',
    isLocked: false,
  },
  {
    id: 'trad-anchor',
    name: '固定點架設',
    description: '學習多點固定系統的架設原則',
    questionsCount: 15,
    difficulty: 'medium',
    parentName: '傳統攀登',
    isLocked: false,
  },
  {
    id: 'trad-protection',
    name: '保護裝備',
    description: '掌握各類保護裝備的放置技巧',
    questionsCount: 15,
    difficulty: 'medium',
    parentName: '傳統攀登',
    isLocked: false,
  },
  {
    id: 'trad-multipitch',
    name: '多繩距系統',
    description: '學習多繩距攀登的繩索管理',
    questionsCount: 15,
    difficulty: 'hard',
    parentName: '傳統攀登',
    isLocked: false,
  },
  {
    id: 'trad-rescue',
    name: '自我救援',
    description: '掌握基本的自我救援技術',
    questionsCount: 15,
    difficulty: 'hard',
    parentName: '傳統攀登',
    isLocked: false,
  },
]

const QUESTIONS_BASE_URL = 'https://nobodyclimb.cc/data/games/rope-system'

export async function fetchRopeQuestionsByCategory(categoryId: string): Promise<RopeQuestion[]> {
  const response = await fetch(`${QUESTIONS_BASE_URL}/${categoryId}.json`)

  if (!response.ok) {
    throw new Error('Failed to load rope system questions')
  }

  const rawQuestions = (await response.json()) as RawRopeQuestion[]
  return rawQuestions.map(transformQuestion)
}

function transformQuestion(question: RawRopeQuestion): RopeQuestion {
  return {
    id: question.id,
    categoryId: question.categoryId,
    type: question.type,
    scenario: question.scenario,
    question: question.question,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation ?? '',
    hint: question.hint,
    referenceSources: question.referenceSources,
    imageUrl: question.imageUrl,
    tags: question.tags,
    difficulty: toMobileDifficulty(question.difficulty),
  }
}

function toMobileDifficulty(difficulty: 1 | 2 | 3): RopeDifficulty {
  if (difficulty === 1) return 'easy'
  if (difficulty === 2) return 'medium'
  return 'hard'
}
