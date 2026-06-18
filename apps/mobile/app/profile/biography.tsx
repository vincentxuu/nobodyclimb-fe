/**
 * 我的 人物誌入口
 *
 * 對應 web profile 中「我的人物誌」入口：
 * - 已有人物誌時導到公開/預覽詳情頁
 * - 尚未建立時導到人物誌建立流程
 */

import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { ChevronLeft, FileText } from 'lucide-react-native'
import { useEffect } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ProtectedRoute } from '@/components/shared'
import { Button, IconButton, Text } from '@/components/ui'
import { apiClient } from '@/lib/api'

interface MyBiography {
  id: string
  slug?: string | null
}

export default function MyBiographyEntryScreen() {
  const router = useRouter()
  const {
    data: biography,
    isLoading,
    isError,
  } = useQuery<MyBiography | null>({
    queryKey: ['biography', 'me', 'entry'],
    queryFn: async () => {
      const response = await apiClient.get('/biographies/me')
      return response.data?.data ?? response.data ?? null
    },
    retry: false,
  })

  useEffect(() => {
    if (isLoading || !biography) return
    const target = biography.slug || biography.id
    if (target) {
      router.replace(`/biography/${target}` as never)
    }
  }, [biography, isLoading, router])

  const handleBack = () => {
    router.back()
  }

  const handleCreateBiography = () => {
    router.replace('/auth/profile-setup/basic-info' as never)
  }

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
          <Text variant="h3" fontWeight="600">
            我的人物誌
          </Text>
          <View style={styles.placeholder} />
        </View>

        {isLoading || biography ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
            <Text variant="body" color="textSubtle" style={styles.message}>
              載入人物誌...
            </Text>
          </View>
        ) : (
          <View style={styles.center}>
            <FileText size={56} color={SEMANTIC_COLORS.textMuted} />
            <Text variant="h3" fontWeight="600" style={styles.title}>
              尚未建立人物誌
            </Text>
            <Text variant="body" color="textSubtle" style={styles.description}>
              建立你的人物誌，記錄攀岩故事、目標與足跡。
            </Text>
            <Button variant="primary" size="lg" onPress={handleCreateBiography}>
              <Text fontWeight="600" style={styles.primaryButtonText}>
                開始建立
              </Text>
            </Button>
            {isError ? (
              <Text variant="small" color="textMuted" style={styles.errorHint}>
                如果已建立但無法載入，請稍後再試。
              </Text>
            ) : null}
          </View>
        )}
      </SafeAreaView>
    </ProtectedRoute>
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
  placeholder: {
    width: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  message: {
    marginTop: SPACING.sm,
  },
  title: {
    marginTop: SPACING.md,
  },
  description: {
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
  errorHint: {
    textAlign: 'center',
    marginTop: SPACING.md,
  },
})
