/**
 * 繩索系統遊戲首頁
 *
 * 對應 apps/web/src/app/games/rope-system/page.tsx
 */

import { RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Lock,
  Mountain,
  MountainSnow,
  Trophy,
  Volume2,
  VolumeX,
} from 'lucide-react-native'
import { useEffect } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconButton, Text } from '@/components/ui'
import { ROPE_CATEGORIES, type RopeCategory } from '@/lib/games/rope-system'
import { useRopeGameStore } from '@/store/ropeGameStore'

const DIFFICULTY_COLORS = {
  easy: '#10B981',
  medium: '#F59E0B',
  hard: '#EF4444',
}

const DIFFICULTY_LABELS = {
  easy: '入門',
  medium: '進階',
  hard: '專業',
}

const PARENT_SECTIONS = [
  {
    id: 'sport',
    name: '運動攀登',
    description: '從確保、先鋒到頂繩與垂降，建立戶外運動攀登的安全基礎。',
    Icon: Dumbbell,
  },
  {
    id: 'trad',
    name: '傳統攀登',
    description: '練習固定點、保護裝備、多繩距與自我救援等進階系統判斷。',
    Icon: MountainSnow,
  },
]

const QUICK_ACTIONS = [
  {
    title: '學習模式',
    description: '依章節練習繩索系統題目',
    Icon: BookOpen,
    disabled: false,
  },
  {
    title: '測驗模式',
    description: '即將開放',
    Icon: Trophy,
    disabled: true,
  },
  {
    title: '認證挑戰',
    description: '即將開放',
    Icon: Mountain,
    disabled: true,
  },
]

interface CategoryCardProps {
  category: RopeCategory
  progress?: {
    answeredQuestions: number
    correctAnswers: number
    isCompleted: boolean
  }
  onPress: () => void
  index: number
}

function CategoryCard({ category, progress, onPress, index }: CategoryCardProps) {
  const isUnlocked = !category.isLocked
  const progressPercent = progress
    ? Math.round((progress.answeredQuestions / category.questionsCount) * 100)
    : 0

  return (
    <Animated.View entering={FadeInDown.duration(300).delay(index * 100)}>
      <Pressable
        style={({ pressed }) => [
          styles.categoryCard,
          !isUnlocked && styles.categoryCardLocked,
          pressed && styles.categoryCardPressed,
        ]}
        onPress={onPress}
        disabled={!isUnlocked}
      >
        <View style={styles.categoryHeader}>
          <View
            style={[
              styles.difficultyBadge,
              { backgroundColor: DIFFICULTY_COLORS[category.difficulty] },
            ]}
          >
            <Text variant="small" style={styles.difficultyText}>
              {DIFFICULTY_LABELS[category.difficulty]}
            </Text>
          </View>
          {!isUnlocked ? (
            <Lock size={20} color={SEMANTIC_COLORS.textMuted} />
          ) : progress?.isCompleted ? (
            <CheckCircle2 size={20} color="#10B981" />
          ) : (
            <ChevronRight size={20} color={SEMANTIC_COLORS.textMuted} />
          )}
        </View>

        <Text variant="h4" fontWeight="600" style={styles.categoryName}>
          {category.name}
        </Text>
        <Text variant="small" color="textMuted" style={styles.categoryDescription}>
          {category.description}
        </Text>
        <Text variant="small" color="textMuted" style={styles.parentName}>
          {category.parentName}
        </Text>

        {!isUnlocked && (
          <View style={styles.lockedInfo}>
            <Trophy size={14} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="small" color="textMuted">
              尚未開放
            </Text>
          </View>
        )}

        {isUnlocked && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text variant="small" color="textMuted">
              {progress?.answeredQuestions || 0}/{category.questionsCount} 題
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  )
}

export default function RopeSystemGameScreen() {
  const router = useRouter()
  const { progress, totalScore, soundEnabled, isInitialized, initProgress, toggleSound } =
    useRopeGameStore()

  useEffect(() => {
    if (!isInitialized) {
      initProgress()
    }
  }, [isInitialized, initProgress])

  const handleBack = () => {
    router.back()
  }

  const handleCategoryPress = (category: RopeCategory) => {
    router.push(`/games/rope-system/learn/${category.id}` as any)
  }

  if (!isInitialized) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 導航列 */}
      <View style={styles.header}>
        <IconButton
          icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleBack}
          variant="ghost"
        />
        <Text variant="h3" fontWeight="600">
          繩索系統學習
        </Text>
        <IconButton
          icon={
            soundEnabled ? (
              <Volume2 size={24} color={SEMANTIC_COLORS.textMain} />
            ) : (
              <VolumeX size={24} color={SEMANTIC_COLORS.textMuted} />
            )
          }
          onPress={toggleSound}
          variant="ghost"
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 統計區 */}
        <LinearGradient colors={['#1B1A1A', '#333333']} style={styles.statsSection}>
          <View style={styles.statsContent}>
            <View style={styles.statItem}>
              <Trophy size={24} color="#FFE70C" />
              <Text variant="h3" fontWeight="700" style={styles.statValue}>
                {totalScore}
              </Text>
              <Text variant="small" style={styles.statLabel}>
                總分數
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <BookOpen size={24} color="#FFE70C" />
              <Text variant="h3" fontWeight="700" style={styles.statValue}>
                {Array.from(progress.values()).filter((p) => p.isCompleted).length}
              </Text>
              <Text variant="small" style={styles.statLabel}>
                完成章節
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.introSection}>
          <Text variant="h2" fontWeight="700" style={styles.introTitle}>
            繩索系統學習
          </Text>
          <Text variant="body" color="textMuted" style={styles.introSubtitle}>
            用互動題目熟悉確保、先鋒、固定點與自我救援的安全判斷。
          </Text>
        </View>

        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map(({ title, description, Icon, disabled }) => (
            <View key={title} style={[styles.quickActionCard, disabled && styles.disabledCard]}>
              <View style={styles.quickActionIcon}>
                <Icon size={22} color={disabled ? SEMANTIC_COLORS.textMuted : '#1B1A1A'} />
              </View>
              <View style={styles.quickActionCopy}>
                <Text variant="body" fontWeight="600">
                  {title}
                </Text>
                <Text variant="small" color="textMuted">
                  {description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 類別列表 */}
        <View style={styles.categoriesSection}>
          {PARENT_SECTIONS.map((section) => {
            const categories = ROPE_CATEGORIES.filter(
              (category) => category.parentName === section.name
            )
            const Icon = section.Icon
            return (
              <View key={section.id} style={styles.parentSection}>
                <View style={styles.parentHeader}>
                  <Icon size={24} color={SEMANTIC_COLORS.textMain} />
                  <View style={styles.parentCopy}>
                    <Text variant="h4" fontWeight="600">
                      {section.name}
                    </Text>
                    <Text variant="small" color="textMuted">
                      {section.description}
                    </Text>
                  </View>
                </View>
                {categories.map((category, index) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    progress={progress.get(category.id)}
                    onPress={() => handleCategoryPress(category)}
                    index={index}
                  />
                ))}
              </View>
            )
          })}
        </View>

        <View style={styles.disclaimer}>
          <Text variant="small" color="textMuted" style={styles.disclaimerText}>
            此工具用於輔助學習，實際操作請在合格教練或有經驗者指導下進行。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsSection: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    gap: SPACING.xs,
  },
  statValue: {
    color: '#FFFFFF',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  categoriesSection: {
    padding: SPACING.md,
  },
  introSection: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    alignItems: 'center',
  },
  introTitle: {
    textAlign: 'center',
    color: SEMANTIC_COLORS.textMain,
  },
  introSubtitle: {
    marginTop: SPACING.xs,
    textAlign: 'center',
    lineHeight: 20,
  },
  quickActions: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.sm,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  disabledCard: {
    opacity: 0.55,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 231, 12, 0.22)',
  },
  quickActionCopy: {
    flex: 1,
    gap: 2,
  },
  parentSection: {
    marginBottom: SPACING.lg,
  },
  parentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  parentCopy: {
    flex: 1,
  },
  categoryCard: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  categoryCardLocked: {
    opacity: 0.6,
  },
  categoryCardPressed: {
    backgroundColor: '#F5F5F5',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  difficultyBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  difficultyText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 10,
  },
  categoryName: {
    marginBottom: 4,
  },
  categoryDescription: {
    marginBottom: 4,
  },
  parentName: {
    marginBottom: SPACING.sm,
  },
  lockedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  progressSection: {
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  disclaimer: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.xl,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  disclaimerText: {
    textAlign: 'center',
    lineHeight: 20,
  },
})
