/**
 * 攀岩人格演化頁面
 *
 * 對應 apps/web/src/app/profile/evolution/page.tsx
 */
import { SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { ChevronLeft, RefreshCw } from 'lucide-react-native'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import EvolutionTimeline from '@/components/profile/evolution/EvolutionTimeline'
import StyleSpectrumCard from '@/components/profile/evolution/StyleSpectrumCard'
import { Button, Text } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import {
  useCalculateEvolution,
  useEvolutionTimeline,
  useStyleSpectrum,
} from '@/lib/hooks/useEvolution'

export default function EvolutionScreen() {
  const router = useRouter()
  const toast = useToast()

  const {
    data: timeline,
    isLoading: timelineLoading,
    isError: timelineError,
    refetch: refetchTimeline,
  } = useEvolutionTimeline()

  const { data: spectrum, isLoading: spectrumLoading } = useStyleSpectrum()

  const calculateEvolution = useCalculateEvolution()

  const handleCalculate = async () => {
    try {
      const result = await calculateEvolution.mutateAsync()
      if (result.changed) {
        toast.show({ message: '人格已演化！', variant: 'success' })
      } else {
        toast.show({ message: result.reason ?? '人格未改變', variant: 'info' })
      }
    } catch {
      toast.show({ message: '計算失敗，每日僅限一次', variant: 'error' })
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color={WB_COLORS[70]} />
        </Pressable>
        <Text style={styles.title}>攀岩人格演化</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Style Spectrum */}
        <StyleSpectrumCard data={spectrum} isLoading={spectrumLoading} />

        {/* Manual Calculate */}
        <Button
          variant="outline"
          size="md"
          leftIcon={RefreshCw}
          loading={calculateEvolution.isPending}
          onPress={handleCalculate}
          fullWidth
        >
          手動計算演化
        </Button>

        {/* Timeline Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>演化歷程</Text>
          {timelineLoading ? (
            <ActivityIndicator
              style={{ marginVertical: SPACING.xl }}
              color={SEMANTIC_COLORS.success}
            />
          ) : timelineError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>載入失敗，請稍後再試。</Text>
              <Button onPress={() => refetchTimeline()} variant="outline" size="sm">
                重新載入
              </Button>
            </View>
          ) : (
            <EvolutionTimeline records={timeline ?? []} />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SEMANTIC_COLORS.pageBg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: SEMANTIC_COLORS.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '600' },
  content: { padding: SPACING.md, gap: SPACING.lg },
  section: {
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: SEMANTIC_COLORS.textMain,
  },
  errorBox: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
  },
  errorText: {
    fontSize: 14,
    color: SEMANTIC_COLORS.textSubtle,
    textAlign: 'center',
  },
})
