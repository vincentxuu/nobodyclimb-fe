/**
 * 忘記密碼頁面
 *
 * 對應 apps/web/src/app/auth/forgot-password/page.tsx
 */

import { FONT_SIZE, RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { useRouter } from 'expo-router'
import { ArrowLeft, CheckCircle, Eye, EyeOff, KeyRound, Lock, Mail } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { XStack, YStack } from 'tamagui'
import { Button, Link, Spinner, Text } from '@/components/ui'
import { apiClient } from '@/lib/api'

export default function ForgotPasswordScreen() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  // 處理直接重設密碼
  const handleSubmit = useCallback(async () => {
    if (!email) {
      setError('請輸入電子郵件')
      return
    }

    if (password.length < 8) {
      setError('密碼至少需要 8 個字元')
      return
    }

    if (password !== confirmPassword) {
      setError('兩次輸入的密碼不一致')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const response = await apiClient.post('/auth/forgot-password', { email, password })
      if (response.data?.success) {
        setIsSuccess(true)
      } else {
        setError(response.data?.message || '重設失敗，請稍後再試')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '重設失敗，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }, [email, password, confirmPassword])

  // 成功畫面
  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.successContainer}>
          <Animated.View entering={FadeInDown.duration(400)}>
            <YStack alignItems="center" gap={SPACING.lg}>
              <View style={styles.successIcon}>
                <CheckCircle size={64} color="#22C55E" />
              </View>
              <YStack alignItems="center" gap={SPACING.xs}>
                <Text variant="h2">密碼已重設</Text>
                <Text color="textSubtle" style={styles.successText}>
                  密碼已成功重設，請使用新密碼登入 {email}
                </Text>
              </YStack>
              <Button
                variant="primary"
                onPress={() => router.replace('/auth/login')}
                style={styles.backButton}
              >
                <Text style={styles.buttonText}>返回登入</Text>
              </Button>
            </YStack>
          </Animated.View>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.duration(400)}>
            <YStack alignItems="center" gap={SPACING.lg}>
              {/* 返回按鈕 */}
              <XStack width="100%">
                <Link href="/auth/login">
                  <XStack alignItems="center" gap={SPACING.xs}>
                    <ArrowLeft size={20} color={SEMANTIC_COLORS.textMain} />
                    <Text>返回</Text>
                  </XStack>
                </Link>
              </XStack>

              {/* 標題 */}
              <YStack alignItems="center" gap={SPACING.xs}>
                <Text variant="h1" style={styles.title}>
                  重設密碼
                </Text>
                <Text color="textSubtle" style={styles.subtitle}>
                  輸入您的電子郵件與新密碼即可完成重設
                </Text>
              </YStack>

              {/* 錯誤提示 */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text variant="small" style={styles.errorText}>
                    {error}
                  </Text>
                </View>
              )}

              {/* 表單 */}
              <YStack width="100%" gap={SPACING.md}>
                {/* Email */}
                <View style={styles.inputContainer}>
                  <Mail size={16} color={SEMANTIC_COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="電子郵件"
                    placeholderTextColor={SEMANTIC_COLORS.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* New Password */}
                <View style={styles.inputContainer}>
                  <Lock size={16} color={SEMANTIC_COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="新密碼"
                    placeholderTextColor={SEMANTIC_COLORS.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    onPress={() => setShowPassword((current) => !current)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={showPassword ? '隱藏密碼' : '顯示密碼'}
                  >
                    {showPassword ? (
                      <EyeOff size={18} color={SEMANTIC_COLORS.textMuted} />
                    ) : (
                      <Eye size={18} color={SEMANTIC_COLORS.textMuted} />
                    )}
                  </Pressable>
                </View>
                <Text variant="small" color="textMuted" style={styles.passwordHint}>
                  密碼至少需要 8 個字元
                </Text>

                {/* Confirm Password */}
                <View style={styles.inputContainer}>
                  <Lock size={16} color={SEMANTIC_COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="確認新密碼"
                    placeholderTextColor={SEMANTIC_COLORS.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword((current) => !current)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={showConfirmPassword ? '隱藏確認密碼' : '顯示確認密碼'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} color={SEMANTIC_COLORS.textMuted} />
                    ) : (
                      <Eye size={18} color={SEMANTIC_COLORS.textMuted} />
                    )}
                  </Pressable>
                </View>

                {/* 發送按鈕 */}
                <Button
                  variant="primary"
                  onPress={handleSubmit}
                  disabled={isLoading}
                  style={styles.submitButton}
                >
                  {isLoading ? (
                    <XStack alignItems="center" gap={8}>
                      <Spinner size="sm" color="#FFFFFF" />
                      <Text style={styles.buttonText}>重設中...</Text>
                    </XStack>
                  ) : (
                    <XStack alignItems="center" gap={8}>
                      <Text style={styles.buttonText}>重設密碼</Text>
                      <KeyRound size={16} color="#FFFFFF" />
                    </XStack>
                  )}
                </Button>
              </YStack>
            </YStack>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    width: '100%',
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    height: 44,
  },
  inputIcon: {
    marginRight: SPACING.xs,
  },
  input: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.textMain,
  },
  passwordHint: {
    marginTop: -SPACING.xs,
  },
  submitButton: {
    width: '100%',
    height: 44,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  successIcon: {
    marginBottom: SPACING.md,
  },
  successText: {
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
  backButton: {
    width: '100%',
    height: 44,
    marginTop: SPACING.md,
  },
})
