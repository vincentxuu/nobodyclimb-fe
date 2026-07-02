/**
 * 攀岩人格測驗 Landing Page
 *
 * 測驗入口頁面，展示 8 種人格類型預覽
 */

import {
  BORDER_RADIUS,
  FONT_SIZE,
  PERSONALITY_TYPES,
  SEMANTIC_COLORS,
  SPACING,
} from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button, ConfirmDialog, IconButton, Text } from '@/components/ui'
import { useQuizStore } from '@/store/quizStore'

export default function QuizLandingScreen() {
  const router = useRouter()
  const { answers, isCompleted, reset } = useQuizStore()
  const [showResumeDialog, setShowResumeDialog] = useState(false)

  const hasPartialProgress = answers.length > 0 && !isCompleted

  const handleStartQuiz = useCallback(() => {
    if (hasPartialProgress) {
      setShowResumeDialog(true)
    } else {
      reset()
      router.push('/quiz/test' as any)
    }
  }, [hasPartialProgress, reset, router])

  const handleResume = useCallback(() => {
    setShowResumeDialog(false)
    router.push('/quiz/test' as any)
  }, [router])

  const handleRestart = useCallback(() => {
    setShowResumeDialog(false)
    reset()
    router.push('/quiz/test' as any)
  }, [reset, router])

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 返回按鈕 */}
        <View style={styles.header}>
          <IconButton
            icon={ChevronLeft}
            variant="ghost"
            onPress={() => router.back()}
            accessibilityLabel="返回"
          />
        </View>

        {/* Hero 區域 */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.heroSection}>
          <Text variant="h1" fontWeight="700" style={styles.heroTitle}>
            你是哪種攀岩者？
          </Text>
          <Text variant="body" color="textSubtle" style={styles.heroSubtitle}>
            24 道情境題，找出你的攀岩人格
          </Text>
        </Animated.View>

        {/* 人格類型預覽 */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.typesSection}>
          <Text variant="h4" fontWeight="600" style={styles.sectionTitle}>
            8 種攀岩人格
          </Text>
          <View style={styles.typesGrid}>
            {PERSONALITY_TYPES.map((type, index) => (
              <Animated.View
                key={type.code}
                entering={FadeInDown.duration(300).delay(150 + index * 50)}
                style={styles.typeCell}
              >
                <View style={[styles.typeCellInner, { backgroundColor: `${type.color}14` }]}>
                  <View style={[styles.typeDot, { backgroundColor: type.color }]} />
                  <Text
                    variant="small"
                    fontWeight="600"
                    style={[styles.typeNameZh, { color: type.color }]}
                  >
                    {type.nameZh}
                  </Text>
                  <Text variant="small" color="textMuted" style={styles.typeNameEn}>
                    {type.nameEn}
                  </Text>
                </View>
              </Animated.View>
            ))}
          </View>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => router.push('/quiz/collection' as any)}
            rightIcon={ChevronRight}
            style={styles.collectionLink}
          >
            探索 8 種人格
          </Button>
        </Animated.View>

        {/* 時間提示 */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <Text variant="small" color="textMuted" style={styles.timeNote}>
            約需 3-5 分鐘
          </Text>
        </Animated.View>

        {/* 開始按鈕 */}
        <Animated.View entering={FadeInDown.duration(400).delay(350)} style={styles.ctaSection}>
          <Button variant="primary" size="lg" fullWidth onPress={handleStartQuiz}>
            開始測驗
          </Button>
        </Animated.View>
      </ScrollView>

      {/* 繼續測驗確認對話框 */}
      <ConfirmDialog
        open={showResumeDialog}
        title="繼續上次的測驗？"
        message={`你上次已完成 ${answers.length}/24 題，要繼續還是重新開始？`}
        confirmLabel="繼續"
        cancelLabel="重新開始"
        onConfirm={handleResume}
        onCancel={handleRestart}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING[10],
  },
  header: {
    paddingHorizontal: SPACING[2],
    paddingVertical: SPACING[2],
  },
  heroSection: {
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[4],
    paddingBottom: SPACING[6],
    alignItems: 'center',
  },
  heroTitle: {
    textAlign: 'center',
    marginBottom: SPACING[2],
  },
  heroSubtitle: {
    textAlign: 'center',
  },
  typesSection: {
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[6],
  },
  sectionTitle: {
    marginBottom: SPACING[4],
    paddingHorizontal: SPACING[2],
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING[3],
  },
  collectionLink: {
    alignSelf: 'center',
    marginTop: SPACING[3],
  },
  typeCell: {
    width: '47%',
  },
  typeCellInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[3],
    paddingHorizontal: SPACING[3],
    borderRadius: BORDER_RADIUS.lg,
  },
  typeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  typeNameZh: {
    fontSize: FONT_SIZE.sm,
  },
  typeNameEn: {
    fontSize: FONT_SIZE.xs,
  },
  timeNote: {
    textAlign: 'center',
    marginBottom: SPACING[3],
  },
  ctaSection: {
    paddingHorizontal: SPACING[6],
  },
})
