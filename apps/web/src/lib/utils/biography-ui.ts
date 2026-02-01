/**
 * 人物誌 UI 相關工具函式與常數
 * 提供共用的圖標映射與分類資訊
 */

import {
  TrendingUp,
  Brain,
  Users,
  Lightbulb,
  Compass,
  Mountain,
  Star,
  TreePine,
  Trophy,
  CloudRain,
  Shield,
  RefreshCw,
  Waves,
  Scale,
  Gift,
  UserCheck,
  Smile,
  MapPin,
  MessageSquare,
  Building,
  Route,
  Dumbbell,
  Target,
  Wrench,
  Backpack,
  Cloud,
  Plane,
  CheckCircle,
  Flag,
  Layers,
  Video,
  Palette,
  Sparkles,
  MessageCircle,
  BookOpen,
} from 'lucide-react'
import { StoryCategory, StoryCategoryInfo, STORY_CATEGORIES } from '@/lib/constants/biography-stories'

/**
 * 故事問題圖標映射表
 */
export const STORY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  Brain,
  Users,
  Lightbulb,
  Compass,
  Mountain,
  Star,
  TreePine,
  Trophy,
  CloudRain,
  Shield,
  RefreshCw,
  Waves,
  Scale,
  Gift,
  UserCheck,
  Smile,
  MapPin,
  MessageSquare,
  Building,
  Route,
  Dumbbell,
  Target,
  Wrench,
  Backpack,
  Cloud,
  Plane,
  CheckCircle,
  Flag,
  Layers,
  Video,
  Palette,
  Sparkles,
  MessageCircle,
  BookOpen,
}

/**
 * 分類圖標映射
 */
export const CATEGORY_ICONS: Record<StoryCategory, React.ComponentType<{ className?: string }>> = {
  growth: TrendingUp,
  psychology: Brain,
  community: Users,
  practical: Lightbulb,
  dreams: Compass,
  life: Mountain,
}

/**
 * 取得故事問題圖標組件
 * @param iconName - 圖標名稱
 * @returns React 圖標組件
 */
export function getStoryIcon(iconName?: string): React.ComponentType<{ className?: string }> {
  if (!iconName) return BookOpen
  return STORY_ICON_MAP[iconName] || BookOpen
}

/**
 * 取得分類資訊
 * @param categoryId - 分類 ID
 * @returns 分類資訊或 undefined
 */
export function getCategoryInfo(categoryId: string): StoryCategoryInfo | undefined {
  return STORY_CATEGORIES.find((c) => c.id === categoryId)
}

/**
 * 取得分類圖標組件
 * @param categoryId - 分類 ID
 * @returns React 圖標組件
 */
export function getCategoryIcon(categoryId: StoryCategory): React.ComponentType<{ className?: string }> {
  return CATEGORY_ICONS[categoryId] || BookOpen
}

/**
 * 產生唯一 ID
 * 用於列表項目的 key
 */
export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
