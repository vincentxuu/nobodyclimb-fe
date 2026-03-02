/**
 * 繩索系統遊戲首頁
 *
 * 對應 apps/web/src/app/games/rope-system/page.tsx
 */
import React, { useState, useEffect } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ChevronLeft,
  ChevronRight,
  Trophy,
  BookOpen,
  CheckCircle2,
  Lock,
  Volume2,
  VolumeX,
} from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, IconButton, Button } from '@/components/ui'
import { useRopeGameStore } from '@/store/ropeGameStore'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface Category {
  id: string
  name: string
  description: string
  questionsCount: number
  difficulty: 'easy' | 'medium' | 'hard'
  isLocked: boolean
  requiredScore?: number
}

// 模擬資料
const CATEGORIES: Category[] = [
  {
    id: 'basics',
    name: '基礎知識',
    description: '認識繩索系統的基本概念',
    questionsCount: 10,
    difficulty: 'easy',
    isLocked: false,
  },
  {
    id: 'knots',
    name: '繩結技巧',
    description: '學習常用的攀岩繩結',
    questionsCount: 15,
    difficulty: 'easy',
    isLocked: false,
  },
  {
    id: 'belaying',
    name: '確保技術',
    description: '確保系統與操作流程',
    questionsCount: 12,
    difficulty: 'medium',
    isLocked: false,
  },
  {
    id: 'anchors',
    name: '固定點設置',
    description: '建立安全的固定點系統',
    questionsCount: 15,
    difficulty: 'medium',
    isLocked: true,
    requiredScore: 100,
  },
  {
    id: 'rescue',
    name: '救援技術',
    description: '緊急狀況處理與救援',
    questionsCount: 20,
    difficulty: 'hard',
    isLocked: true,
    requiredScore: 200,
  },
]

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

interface CategoryCardProps {
  category: Category
  progress?: {
    answeredQuestions: number
    correctAnswers: number
    isCompleted: boolean
  }
  onPress: () => void
  index: number
  totalScore: number
}

function CategoryCard({ category, progress, onPress, index, totalScore }: CategoryCardProps) {
  const isUnlocked = !category.isLocked || totalScore >= (category.requiredScore || 0)
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

        {!isUnlocked && category.requiredScore && (
          <View style={styles.lockedInfo}>
            <Trophy size={14} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="small" color="textMuted">
              需要 {category.requiredScore} 分解鎖
            </Text>
          </View>
        )}

        {isUnlocked && (
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${progressPercent}%` }]}
              />
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
  const {
    progress,
    totalScore,
    soundEnabled,
    isInitialized,
    initProgress,
    toggleSound,
  } = useRopeGameStore()

  useEffect(() => {
    if (!isInitialized) {
      initProgress()
    }
  }, [isInitialized, initProgress])

  const handleBack = () => {
    router.back()
  }

  const handleCategoryPress = (category: Category) => {
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
        <LinearGradient
          colors={['#1B1A1A', '#333333']}
          style={styles.statsSection}
        >
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

        {/* 類別列表 */}
        <View style={styles.categoriesSection}>
          <Text variant="h4" fontWeight="600" style={styles.sectionTitle}>
            學習章節
          </Text>
          {CATEGORIES.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              progress={progress.get(category.id)}
              onPress={() => handleCategoryPress(category)}
              index={index}
              totalScore={totalScore}
            />
          ))}
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
  sectionTitle: {
    marginBottom: SPACING.md,
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
})
