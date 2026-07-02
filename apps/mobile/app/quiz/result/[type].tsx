/**
 * 攀岩人格測驗結果頁
 *
 * 顯示測驗結果、雷達圖、優劣勢分析與分享功能
 */

import { getPersonalityType, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import type { PersonalityTypeCode } from '@nobodyclimb/types'
import * as Clipboard from 'expo-clipboard'
import * as Haptics from 'expo-haptics'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Sharing from 'expo-sharing'
import { Copy, Home, RefreshCw, Share2 } from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { captureRef } from 'react-native-view-shot'
import { QuizRadarChart } from '@/components/quiz/QuizRadarChart'
import { QuizResultHero } from '@/components/quiz/QuizResultHero'
import { QuizShareCard } from '@/components/quiz/QuizShareCard'
import { ResultCompat } from '@/components/quiz/ResultCompat'
import { ResultProfile } from '@/components/quiz/ResultProfile'
import { ResultStrengths } from '@/components/quiz/ResultStrengths'
import { ResultTraining } from '@/components/quiz/ResultTraining'
import { Button, ConfirmDialog, Text, useToast } from '@/components/ui'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import { useQuizStore } from '@/store/quizStore'

export default function QuizResultScreen() {
  const { type } = useLocalSearchParams<{ type: string }>()
  const router = useRouter()
  const toast = useToast()
  const { result, reset } = useQuizStore()
  const { isAuthenticated } = useAuthStore()

  const [showResetDialog, setShowResetDialog] = useState(false)
  const [isSharing, setIsSharing] = useState(false)

  const shareCardRef = useRef<View>(null)

  // 取得人格類型資料
  const personalityType = getPersonalityType(type as PersonalityTypeCode)

  // 直接存取 URL 但無結果時顯示錯誤
  if (!personalityType) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Text variant="h3" fontWeight="600">
            找不到此人格類型
          </Text>
          <Button variant="primary" size="md" onPress={() => router.replace('/quiz' as any)}>
            回到測驗首頁
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  // 儲存結果（靜默 API 呼叫）
  useEffect(() => {
    if (isAuthenticated && result) {
      api
        .post('/quiz/results', {
          type_code: result.typeCode,
          axis_scores: result.axisScores,
          grit_index: result.gritIndex,
          flow_index: result.flowIndex,
        })
        .catch(() => {}) // 靜默失敗
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 分享結果
  const handleShare = useCallback(async () => {
    if (!shareCardRef.current) return

    setIsSharing(true)
    try {
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 1,
      })
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: '分享我的攀岩人格',
      })
    } catch {
      toast.show({ message: '分享失敗，請稍後再試', variant: 'error' })
    } finally {
      setIsSharing(false)
    }
  }, [toast])

  // 複製連結
  const handleCopyLink = useCallback(async () => {
    await Clipboard.setStringAsync(`https://nobodyclimb.cc/quiz/result/${type}`)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    toast.show({ message: '連結已複製', variant: 'success' })
  }, [type, toast])

  // 重新測驗
  const handleRestart = useCallback(() => {
    setShowResetDialog(false)
    reset()
    router.replace('/quiz' as any)
  }, [reset, router])

  // 前往其他人格類型
  const handleTypePress = useCallback(
    (code: string) => {
      router.push(`/quiz/result/${code}` as any)
    },
    [router]
  )

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 結果英雄區 */}
        <QuizResultHero personalityType={personalityType} />

        {/* 雷達圖 */}
        {result && (
          <View style={styles.section}>
            <QuizRadarChart result={result} />
          </View>
        )}

        {/* 個人檔案 */}
        {result && (
          <View style={styles.section}>
            <ResultProfile result={result} personalityType={personalityType} />
          </View>
        )}

        {/* 優劣勢分析 */}
        <View style={styles.section}>
          <ResultStrengths personalityType={personalityType} />
        </View>

        {/* 專屬訓練計畫 */}
        <View style={styles.section}>
          <ResultTraining personality={personalityType} />
        </View>

        {/* 相性分析 */}
        <View style={styles.section}>
          <ResultCompat personalityType={personalityType} onTypePress={handleTypePress} />
        </View>

        {/* 登入提示 */}
        {!isAuthenticated && (
          <View style={styles.loginBanner}>
            <Text variant="small" color="textMuted">
              登入以保存測驗結果
            </Text>
            <Button variant="outline" size="sm" onPress={() => router.push('/auth/login')}>
              登入
            </Button>
          </View>
        )}

        {/* 底部操作列 */}
        <View style={styles.actionSection}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleShare}
            loading={isSharing}
            leftIcon={Share2}
          >
            分享結果
          </Button>

          <Pressable style={styles.copyLinkButton} onPress={handleCopyLink}>
            <Copy size={16} color={SEMANTIC_COLORS.textSubtle} />
            <Text variant="small" color="textSubtle">
              複製連結
            </Text>
          </Pressable>

          <View style={styles.secondaryActions}>
            <Button
              variant="outline"
              size="md"
              onPress={() => setShowResetDialog(true)}
              leftIcon={RefreshCw}
              style={styles.halfButton}
            >
              重新測驗
            </Button>
            <Button
              variant="ghost"
              size="md"
              onPress={() => router.replace('/(tabs)' as any)}
              leftIcon={Home}
              style={styles.halfButton}
            >
              回首頁
            </Button>
          </View>
        </View>
      </ScrollView>

      {/* 分享卡片（螢幕外渲染） */}
      {result && (
        <View style={styles.offscreen}>
          <View ref={shareCardRef} collapsable={false}>
            <QuizShareCard personalityType={personalityType} result={result} />
          </View>
        </View>
      )}

      {/* 重新測驗確認對話框 */}
      <ConfirmDialog
        open={showResetDialog}
        title="重新測驗？"
        message="目前的結果將會被清除，確定要重新開始嗎？"
        confirmLabel="重新開始"
        cancelLabel="取消"
        destructive
        onConfirm={handleRestart}
        onCancel={() => setShowResetDialog(false)}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING[4],
    padding: SPACING[6],
  },
  section: {
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
  },
  loginBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: SPACING[4],
    marginVertical: SPACING[3],
    paddingHorizontal: SPACING[4],
    paddingVertical: SPACING[3],
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: 12,
  },
  actionSection: {
    paddingHorizontal: SPACING[6],
    paddingTop: SPACING[4],
    gap: SPACING[3],
  },
  copyLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING[2],
    paddingVertical: SPACING[2],
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: SPACING[3],
  },
  halfButton: {
    flex: 1,
  },
  offscreen: {
    position: 'absolute',
    left: -9999,
    top: -9999,
  },
})
