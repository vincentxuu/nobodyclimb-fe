import { BORDER_RADIUS, SPACING } from '@nobodyclimb/constants'
import type { PostCategory } from '@nobodyclimb/types'
import { LinearGradient } from 'expo-linear-gradient'
import {
  Backpack,
  Building2,
  Calendar,
  Dumbbell,
  FileText,
  Globe,
  HeartPulse,
  Lightbulb,
  Map,
  Newspaper,
  Plane,
  Sprout,
  Trophy,
  Users,
} from 'lucide-react-native'
import type { ComponentType } from 'react'
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native'
import { Text } from '@/components/ui'

type CoverIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>

interface ArticleCoverTheme {
  colors: readonly [string, string]
  Icon: CoverIcon
  pattern: 'dots' | 'lines' | 'grid'
}

interface ArticleCoverGeneratorProps {
  category: PostCategory | string | null | undefined
  title?: string | null
  showIcon?: boolean
  showTitle?: boolean
  style?: StyleProp<ViewStyle>
}

const CATEGORY_LABELS: Record<PostCategory, string> = {
  beginner: '新手入門',
  news: '新聞動態',
  gear: '裝備分享',
  skills: '技巧分享',
  training: '訓練計畫',
  routes: '路線攻略',
  crags: '岩場開箱',
  gyms: '岩館開箱',
  travel: '攀岩旅遊',
  competition: '賽事介紹',
  events: '活動介紹',
  community: '社群資源',
  injury: '傷害防護',
}

const CATEGORY_THEMES: Record<PostCategory, ArticleCoverTheme> = {
  beginner: { colors: ['#FDE68A', '#F59E0B'], Icon: Sprout, pattern: 'dots' },
  news: { colors: ['#CBD5E1', '#64748B'], Icon: Newspaper, pattern: 'grid' },
  gear: { colors: ['#FED7AA', '#FB923C'], Icon: Backpack, pattern: 'lines' },
  skills: { colors: ['#FDE68A', '#FBBF24'], Icon: Lightbulb, pattern: 'lines' },
  training: { colors: ['#5EEAD4', '#14B8A6'], Icon: Dumbbell, pattern: 'dots' },
  routes: { colors: ['#5EEAD4', '#0D9488'], Icon: Map, pattern: 'lines' },
  crags: { colors: ['#6EE7B7', '#10B981'], Icon: Globe, pattern: 'grid' },
  gyms: { colors: ['#C4B5FD', '#8B5CF6'], Icon: Building2, pattern: 'grid' },
  travel: { colors: ['#FDBA74', '#F97316'], Icon: Plane, pattern: 'dots' },
  competition: { colors: ['#FDE68A', '#F59E0B'], Icon: Trophy, pattern: 'dots' },
  events: { colors: ['#C4B5FD', '#8B5CF6'], Icon: Calendar, pattern: 'grid' },
  community: { colors: ['#FECDD3', '#FB7185'], Icon: Users, pattern: 'dots' },
  injury: { colors: ['#FECDD3', '#F43F5E'], Icon: HeartPulse, pattern: 'lines' },
}

const DEFAULT_THEME: ArticleCoverTheme = {
  colors: ['#CBD5E1', '#64748B'],
  Icon: FileText,
  pattern: 'dots',
}

function getTheme(category: ArticleCoverGeneratorProps['category']) {
  if (category && Object.prototype.hasOwnProperty.call(CATEGORY_THEMES, category)) {
    return CATEGORY_THEMES[category as PostCategory]
  }
  return DEFAULT_THEME
}

function getCategoryLabel(category: ArticleCoverGeneratorProps['category']) {
  if (category && Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, category)) {
    return CATEGORY_LABELS[category as PostCategory]
  }
  return category || '文章'
}

function PatternOverlay({ pattern }: { pattern: ArticleCoverTheme['pattern'] }) {
  const items = Array.from({ length: 10 }, (_, index) => index)

  return (
    <View pointerEvents="none" style={styles.patternLayer}>
      {items.map((item) => {
        const size = pattern === 'dots' ? 8 : pattern === 'grid' ? 2 : 42
        return (
          <View
            key={item}
            style={[
              styles.patternItem,
              {
                width: size,
                height: pattern === 'lines' ? 2 : size,
                left: `${(item * 23) % 100}%`,
                top: `${(item * 31) % 100}%`,
                transform: [{ rotate: pattern === 'lines' ? '-28deg' : '0deg' }],
              },
              pattern === 'dots' && styles.patternDot,
            ]}
          />
        )
      })}
    </View>
  )
}

export function ArticleCoverGenerator({
  category,
  title,
  showIcon = true,
  showTitle = true,
  style,
}: ArticleCoverGeneratorProps) {
  const theme = getTheme(category)
  const Icon = theme.Icon

  return (
    <LinearGradient colors={theme.colors} style={[styles.cover, style]}>
      <PatternOverlay pattern={theme.pattern} />
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconWrap}>
            <Icon size={34} color="#FFFFFF" strokeWidth={1.6} />
          </View>
        )}
        {showTitle && title ? (
          <Text variant="h4" fontWeight="700" numberOfLines={2} style={styles.title}>
            {title}
          </Text>
        ) : null}
        <View style={styles.badge}>
          <Text variant="caption" fontWeight="700" style={styles.badgeText}>
            {getCategoryLabel(category)}
          </Text>
        </View>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  cover: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patternLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },
  patternItem: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
  },
  patternDot: {
    borderRadius: 999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  iconWrap: {
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.22)',
    padding: SPACING.sm,
  },
  title: {
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  badge: {
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#1F1F1F',
  },
})
