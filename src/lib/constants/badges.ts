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
  Heart,
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
 */
export interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: LucideIcon
  color: string // Tailwind color class
  bgColor: string // Tailwind background color class
  category: BadgeCategory
  requirement: string
  threshold?: number
}

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
    color: 'text-green-500',
    bgColor: 'bg-green-100',
    category: 'story',
    requirement: 'complete_first_story',
    threshold: 1,
  },
  story_writer: {
    id: 'story_writer',
    name: '故事達人',
    description: '完成 5 個進階故事',
    icon: Edit3,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
    category: 'story',
    requirement: 'complete_5_stories',
    threshold: 5,
  },
  inspirator: {
    id: 'inspirator',
    name: '啟發者',
    description: '故事被 10 人標記「受到鼓勵」',
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
    category: 'story',
    requirement: 'story_encouraged_10_times',
    threshold: 10,
  },
  trending: {
    id: 'trending',
    name: '熱門故事',
    description: '單篇故事獲得 50 讚',
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100',
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
    color: 'text-red-500',
    bgColor: 'bg-red-100',
    category: 'goal',
    requirement: 'create_first_goal',
    threshold: 1,
  },
  achiever: {
    id: 'achiever',
    name: '成就達成',
    description: '完成第一個目標',
    icon: Award,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100',
    category: 'goal',
    requirement: 'complete_first_goal',
    threshold: 1,
  },
  consistent: {
    id: 'consistent',
    name: '堅持者',
    description: '完成 3 個目標',
    icon: Trophy,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100',
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
    icon: Heart,
    color: 'text-pink-500',
    bgColor: 'bg-pink-100',
    category: 'social',
    requirement: 'give_50_likes',
    threshold: 50,
  },
  conversationalist: {
    id: 'conversationalist',
    name: '對話者',
    description: '留言 20 則',
    icon: MessageCircle,
    color: 'text-teal-500',
    bgColor: 'bg-teal-100',
    category: 'social',
    requirement: 'post_20_comments',
    threshold: 20,
  },
  explorer: {
    id: 'explorer',
    name: '好奇寶寶',
    description: '閱讀 20 篇人物誌',
    icon: Eye,
    color: 'text-cyan-500',
    bgColor: 'bg-cyan-100',
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
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100',
    category: 'footprint',
    requirement: 'add_5_locations',
    threshold: 5,
  },
  international: {
    id: 'international',
    name: '國際攀岩者',
    description: '記錄 3 個海外攀岩地點',
    icon: Plane,
    color: 'text-sky-500',
    bgColor: 'bg-sky-100',
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
