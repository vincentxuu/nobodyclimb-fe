import { SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { ArrowLeft, Building2, Mail, ShieldCheck } from 'lucide-react-native'
import { Linking, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Text } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'

export default function AddGymScreen() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const canManageGyms = user?.role === 'admin' || user?.role === 'moderator'

  const handlePrimaryAction = () => {
    if (!isAuthenticated) {
      router.push('/auth/login')
      return
    }

    if (canManageGyms) {
      router.replace('/admin/gyms?add=1' as never)
      return
    }

    Linking.openURL('mailto:hello@nobodyclimb.cc?subject=新增攀岩館資訊').catch(() => {})
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Button variant="ghost" leftIcon={ArrowLeft} onPress={() => router.back()}>
          返回
        </Button>
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          {canManageGyms ? (
            <ShieldCheck size={40} color={SEMANTIC_COLORS.textMain} />
          ) : (
            <Building2 size={40} color={SEMANTIC_COLORS.textMain} />
          )}
        </View>

        <Text variant="h2" fontWeight="700" style={styles.title}>
          新增攀岩館
        </Text>
        <Text variant="body" color="textSubtle" style={styles.description}>
          {canManageGyms
            ? '你可以直接進入管理後台建立新的岩館資料。'
            : '目前岩館資料由站方審核維護。分享你知道的攀岩館資訊，我們會協助補上。'}
        </Text>

        <Button
          variant="primary"
          size="lg"
          leftIcon={canManageGyms ? ShieldCheck : isAuthenticated ? Mail : undefined}
          onPress={handlePrimaryAction}
          style={styles.primaryButton}
        >
          <Text fontWeight="600" style={styles.primaryText}>
            {!isAuthenticated ? '登入後提供資訊' : canManageGyms ? '前往新增表單' : '寄送岩館資訊'}
          </Text>
        </Button>

        <Button variant="secondary" size="lg" onPress={() => router.push('/gym')}>
          瀏覽現有岩館
        </Button>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: SEMANTIC_COLORS.border,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE70C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  title: {
    color: SEMANTIC_COLORS.textMain,
  },
  description: {
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  primaryButton: {
    marginTop: SPACING.sm,
  },
  primaryText: {
    color: WB_COLORS[0],
  },
})
