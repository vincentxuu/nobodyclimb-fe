/**
 * 徽章系統常數與類型定義
 * Phase 8: 統計與徽章
 */

import type { LucideIcon } from 'lucide-react'
import {
  Sprout,
  Edit3,
  Sparkles,
  Flame,
  Target,
  Award,
  Trophy,
  Mountain,
  MessageCircle,
  Eye,
  Globe,
  Plane,
} from 'lucide-react'

/**
 * 徽章分類
 */
export type BadgeCategory = 'story' | 'goal' | 'social' | 'footprint'

/**
 * 徽章等級
 */
export type BadgeLevel = 'bronze' | 'silver' | 'gold'

/**
 * 徽章定義
 *
 * 顏色系統說明：
 * - 所有徽章統一使用專案品牌色系
 * - 已解鎖狀態：bg-brand-accent/20（淺黃背景）+ text-brand-dark（深色圖標）
 * - 未解鎖狀態：bg-brand-light（淺灰背景）+ text-subtle（灰色圖標）
 * - 解鎖指示器：bg-brand-accent（黃色）+ text-brand-dark（深色勾選）
 */
export interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: LucideIcon
  category: BadgeCategory
  requirement: string
  threshold?: number
}

/**
 * 徽章統一顏色配置 - 遵循專案品牌色系
 */
export const BADGE_COLORS = {
  // 已解鎖狀態
  unlocked: {
    bg: 'bg-brand-accent/20', // 淺黃色背景
    icon: 'text-brand-dark', // 深色圖標
    border: 'border-brand-accent', // 黃色邊框
  },
  // 未解鎖狀態
  locked: {
    bg: 'bg-brand-light', // 淺灰色背景
    icon: 'text-subtle', // 灰色圖標
    border: 'border-subtle/50', // 淺灰邊框
  },
  // 解鎖指示器（勾選標記）
  indicator: {
    bg: 'bg-brand-accent', // 黃色背景
    icon: 'text-brand-dark', // 深色勾選
  },
  // 進度條
  progress: {
    bg: 'bg-brand-light', // 進度條背景
    fill: 'bg-brand-accent', // 進度條填充
  },
} as const

/**
 * 使用者徽章狀態
 */
export interface UserBadge {
  badge_id: string
  unlocked: boolean
  unlocked_at: string | null
  progress: number // 0-100
  current_value: number
  target_value: number
}

/**
 * 徽章分類標籤
 */
export const BADGE_CATEGORIES: Record<BadgeCategory, string> = {
  story: '故事分享',
  goal: '目標追蹤',
  social: '社群互動',
  footprint: '攀岩足跡',
}

/**
 * 徽章定義列表
 * 所有徽章統一使用 BADGE_COLORS 定義的專案品牌色系
 */
export const BADGES: Record<string, BadgeDefinition> = {
  // ═══════════════════════════════════════════
  // 故事分享徽章
  // ═══════════════════════════════════════════
  story_beginner: {
    id: 'story_beginner',
    name: '故事新芽',
    description: '完成第一篇故事',
    icon: Sprout,
    category: 'story',
    requirement: 'complete_first_story',
    threshold: 1,
  },
  story_writer: {
    id: 'story_writer',
    name: '故事達人',
    description: '完成 5 個進階故事',
    icon: Edit3,
    category: 'story',
    requirement: 'complete_5_stories',
    threshold: 5,
  },
  inspirator: {
    id: 'inspirator',
    name: '啟發者',
    description: '故事被 10 人標記「受到鼓勵」',
    icon: Sparkles,
    category: 'story',
    requirement: 'story_encouraged_10_times',
    threshold: 10,
  },
  trending: {
    id: 'trending',
    name: '熱門故事',
    description: '單篇故事獲得 50 讚',
    icon: Flame,
    category: 'story',
    requirement: 'story_50_likes',
    threshold: 50,
  },

  // ═══════════════════════════════════════════
  // 目標追蹤徽章
  // ═══════════════════════════════════════════
  goal_setter: {
    id: 'goal_setter',
    name: '目標設定者',
    description: '設定第一個目標',
    icon: Target,
    category: 'goal',
    requirement: 'create_first_goal',
    threshold: 1,
  },
  achiever: {
    id: 'achiever',
    name: '成就達成',
    description: '完成第一個目標',
    icon: Award,
    category: 'goal',
    requirement: 'complete_first_goal',
    threshold: 1,
  },
  consistent: {
    id: 'consistent',
    name: '堅持者',
    description: '完成 3 個目標',
    icon: Trophy,
    category: 'goal',
    requirement: 'complete_3_goals',
    threshold: 3,
  },

  // ═══════════════════════════════════════════
  // 社群互動徽章
  // ═══════════════════════════════════════════
  supportive: {
    id: 'supportive',
    name: '鼓勵大使',
    description: '給出 50 個讚',
    icon: Mountain,
    category: 'social',
    requirement: 'give_50_likes',
    threshold: 50,
  },
  conversationalist: {
    id: 'conversationalist',
    name: '對話者',
    description: '留言 20 則',
    icon: MessageCircle,
    category: 'social',
    requirement: 'post_20_comments',
    threshold: 20,
  },
  explorer: {
    id: 'explorer',
    name: '好奇寶寶',
    description: '閱讀 20 篇人物誌',
    icon: Eye,
    category: 'social',
    requirement: 'read_20_biographies',
    threshold: 20,
  },

  // ═══════════════════════════════════════════
  // 攀岩足跡徽章
  // ═══════════════════════════════════════════
  traveler: {
    id: 'traveler',
    name: '攀岩旅行者',
    description: '記錄 5 個攀岩地點',
    icon: Globe,
    category: 'footprint',
    requirement: 'add_5_locations',
    threshold: 5,
  },
  international: {
    id: 'international',
    name: '國際攀岩者',
    description: '記錄 3 個海外攀岩地點',
    icon: Plane,
    category: 'footprint',
    requirement: 'add_3_international_locations',
    threshold: 3,
  },
}

/**
 * 根據分類取得徽章列表
 */
export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return Object.values(BADGES).filter((badge) => badge.category === category)
}

/**
 * 取得所有徽章 ID 列表
 */
export function getAllBadgeIds(): string[] {
  return Object.keys(BADGES)
}

/**
 * 根據 ID 取得徽章定義
 */
export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGES[id]
}

/**
 * 計算徽章進度百分比
 */
export function calculateBadgeProgress(currentValue: number, threshold: number): number {
  if (threshold <= 0) return 0
  return Math.min(100, Math.round((currentValue / threshold) * 100))
}
