import type { PersonalityType, PersonalityTypeCode, QuizAxis } from '@nobodyclimb/types'

export interface AxisDirection {
  code: string
  nameZh: string
  nameEn: string
}

export interface QuizAxisDefinition {
  id: QuizAxis
  nameZh: string
  nameEn: string
  left: AxisDirection
  right: AxisDirection
}

export const QUIZ_AXES: readonly QuizAxisDefinition[] = [
  {
    id: 'body',
    nameZh: '身體',
    nameEn: 'Body',
    left: { code: 'P', nameZh: '力量型', nameEn: 'Power' },
    right: { code: 'T', nameZh: '技巧型', nameEn: 'Technique' },
  },
  {
    id: 'motive',
    nameZh: '動機',
    nameEn: 'Motive',
    left: { code: 'G', nameZh: '目標導向', nameEn: 'Goal' },
    right: { code: 'F', nameZh: '自由探索', nameEn: 'Free' },
  },
  {
    id: 'mind',
    nameZh: '心態',
    nameEn: 'Mind',
    left: { code: 'B', nameZh: '大膽突破', nameEn: 'Bold' },
    right: { code: 'S', nameZh: '穩健漸進', nameEn: 'Steady' },
  },
] as const

export const PERSONALITY_TYPES: readonly PersonalityType[] = [
  {
    code: 'PGB',
    nameZh: '碎岩者',
    nameEn: 'Crusher',
    color: '#E84545',
    tagline: '以力量征服，用決心突破',
    description:
      '你是天生的力量型攀岩者，總是用最直接的方式面對挑戰。明確的目標驅動你不斷前進，大膽的心態讓你敢於嘗試極限動作。在岩壁上，你就像一台碎岩機——勢不可擋。',
    keywords: ['力量', '爆發', '目標', '突破', '挑戰'],
    strengths: ['強大的身體素質與爆發力', '目標明確不輕易放棄', '敢於挑戰高難度路線'],
    blindSpots: ['可能忽略技巧與節奏的重要性', '過度執著目標時容易受傷'],
    bestPartner: 'TGB',
    worstMatch: 'TFS',
    flowState: '全力輸出，感受肌肉與岩壁的對話',
    clutchState: '面對 crux 時用爆發力一搏',
  },
  {
    code: 'PGS',
    nameZh: '鍛造者',
    nameEn: 'Forger',
    color: '#F4845F',
    tagline: '穩扎穩打，鍛造實力',
    description:
      '你相信力量需要時間鍛造。目標導向的你會制定長期訓練計畫，搭配穩健的心態逐步累積實力。你不急於求成，但每一步都踏得紮實。',
    keywords: ['耐力', '計畫', '穩健', '累積', '扎實'],
    strengths: ['有紀律的訓練習慣', '穩定的進步軌跡', '良好的體能管理'],
    blindSpots: ['可能過於保守錯過突破時機', '計畫過於僵化缺乏彈性'],
    bestPartner: 'TGS',
    worstMatch: 'TFB',
    flowState: '在熟悉的訓練節奏中感受力量的成長',
    clutchState: '靠長期累積的實力穩定通過難點',
  },
  {
    code: 'PFB',
    nameZh: '野火',
    nameEn: 'Wildfire',
    color: '#F7B731',
    tagline: '燃燒熱情，自由攀登',
    description:
      '你像野火般充滿能量與不可預測性。偏好力量型攀登但不受目標束縛，大膽的心態讓你願意嘗試各種風格。你享受攀岩本身的樂趣，不在乎分數與等級。',
    keywords: ['熱情', '自由', '大膽', '多元', '能量'],
    strengths: ['充沛的攀岩熱情', '願意嘗試不同風格', '不怕失敗的勇氣'],
    blindSpots: ['缺乏系統性訓練', '難以在單一方向深入精進'],
    bestPartner: 'TFB',
    worstMatch: 'TGS',
    flowState: '在新路線上感受身體的自由與力量',
    clutchState: '靠直覺與膽量突破未知難點',
  },
  {
    code: 'PFS',
    nameZh: '恆者',
    nameEn: 'Anchor',
    color: '#2C3E50',
    tagline: '如錨般堅定，享受過程',
    description:
      '你是攀岩世界的定海神針。力量型的身體搭配自由探索的動機與穩健的心態，讓你能在各種環境中保持穩定。你不追求速成，而是享受每次攀登的過程。',
    keywords: ['穩定', '持久', '從容', '享受', '基礎'],
    strengths: ['情緒穩定不易受壓力影響', '良好的基礎體能', '持續且不間斷的攀岩習慣'],
    blindSpots: ['可能缺乏明確的進步方向', '過於舒適不願跳出安全圈'],
    bestPartner: 'TFS',
    worstMatch: 'TGB',
    flowState: '在熟悉的岩場中感受力量與平靜的交融',
    clutchState: '用穩定的心態與體能慢慢磨過難點',
  },
  {
    code: 'TGB',
    nameZh: '狙擊手',
    nameEn: 'Sniper',
    color: '#27AE60',
    tagline: '精準出手，一擊必殺',
    description:
      '你是技巧型攀岩者中的狙擊手。明確的目標讓你專注於特定路線的攻克，大膽的心態讓你敢於嘗試極限動作。你追求的是用最精準的技巧完成最難的挑戰。',
    keywords: ['精準', '技巧', '專注', '目標', '效率'],
    strengths: ['優秀的動作閱讀能力', '對目標路線的專注力', '關鍵時刻的執行力'],
    blindSpots: ['對非目標路線可能缺乏耐心', '過度追求效率忽略體驗'],
    bestPartner: 'PGB',
    worstMatch: 'PFS',
    flowState: '在完美的技巧執行中感受精準的快感',
    clutchState: '用精準的動作解讀一次性通過 crux',
  },
  {
    code: 'TGS',
    nameZh: '解碼者',
    nameEn: 'Cipher',
    color: '#3742FA',
    tagline: '解讀岩壁，系統精進',
    description:
      '你像密碼學家一樣分析每條路線。技巧型的攀登風格搭配目標導向的動機與穩健的心態，讓你善於拆解問題、制定策略，然後系統性地攻克挑戰。',
    keywords: ['分析', '系統', '策略', '精進', '理性'],
    strengths: ['出色的路線解讀能力', '系統化的訓練方法', '冷靜的問題解決能力'],
    blindSpots: ['可能過度分析而猶豫不決', '缺乏即興應變的彈性'],
    bestPartner: 'PGS',
    worstMatch: 'PFB',
    flowState: '在解讀路線謎題的過程中進入心流',
    clutchState: '用冷靜的分析找到最佳解法',
  },
  {
    code: 'TFB',
    nameZh: '浪人',
    nameEn: 'Wanderer',
    color: '#0ABDE3',
    tagline: '四處遊走，技巧為伴',
    description:
      '你是攀岩界的遊牧者。精湛的技巧讓你適應各種岩質與風格，自由探索的動機驅動你走遍各地岩場，大膽的心態讓你無畏未知。每一面岩壁都是新的冒險。',
    keywords: ['探索', '冒險', '適應', '多元', '技巧'],
    strengths: ['適應力強可攀登各種岩質', '豐富的攀岩經驗與見識', '享受探索的樂趣'],
    blindSpots: ['難以在單一領域達到頂尖', '缺乏長期訓練的持續性'],
    bestPartner: 'PFB',
    worstMatch: 'PGS',
    flowState: '在全新的岩場中發現身體與岩壁的對話',
    clutchState: '靠豐富的經驗即興應對未知難點',
  },
  {
    code: 'TFS',
    nameZh: '禪者',
    nameEn: 'Zen',
    color: '#6C5CE7',
    tagline: '靜心攀登，與岩合一',
    description:
      '你是攀岩界的修行者。技巧型的攀登風格搭配自由探索的動機與穩健的心態，讓你追求的不是等級或成績，而是攀登過程中身心合一的境界。',
    keywords: ['平靜', '專注', '平衡', '內在', '和諧'],
    strengths: ['優秀的身心協調能力', '不受外在壓力影響的穩定性', '深度的攀岩感受力'],
    blindSpots: ['可能缺乏突破的動力', '對競技面向興趣較低'],
    bestPartner: 'PFS',
    worstMatch: 'PGB',
    flowState: '在攀登中感受呼吸、動作與岩壁的合一',
    clutchState: '用深呼吸與專注力找到內在的穩定',
  },
]

export function getPersonalityType(code: PersonalityTypeCode): PersonalityType | undefined {
  return PERSONALITY_TYPES.find((t) => t.code === code)
}

/**
 * Body 軸反風格關鍵字：用於 AI 推薦的反風格補充檢索
 * P 型（力量型）→ 反風格為技巧型路線關鍵字
 * T 型（技巧型）→ 反風格為力量型路線關鍵字
 */
export const ANTI_STYLE_KEYWORDS: Record<'P' | 'T', string[]> = {
  P: ['slab', 'vertical', 'technique', 'balance', '平衡', '技巧', '薄面'],
  T: ['overhang', 'roof', 'dynamic', 'power', '動態', '力量', '懸岩', '天花板'],
}
