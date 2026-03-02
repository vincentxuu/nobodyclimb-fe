/**
 * 忘記密碼頁面
 *
 * 對應 apps/web/src/app/auth/forgot-password/page.tsx
 */
import React, { useState, useCallback } from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { YStack, XStack } from 'tamagui'
import { Mail, ArrowLeft, Send, CheckCircle } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { apiClient } from '@/lib/api'
import { Text, Button, Link, Spinner } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, FONT_SIZE, RADIUS } from '@nobodyclimb/constants'

export default function ForgotPasswordScreen() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  // 處理發送重設密碼郵件
  const handleSubmit = useCallback(async () => {
    if (!email) {
      setError('請輸入電子郵件')
      return
    }

    setError('')
    setIsLoading(true)

    try {
      await apiClient.post('/auth/forgot-password', { email })
      setIsSuccess(true)
    } catch (err: any) {
      setError(err.response?.data?.message || '發送失敗，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }, [email])

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
                <Text variant="h2">郵件已發送</Text>
                <Text color="textSubtle" style={styles.successText}>
                  請檢查您的電子郵件信箱，我們已發送密碼重設連結至 {email}
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
                  忘記密碼
                </Text>
                <Text color="textSubtle" style={styles.subtitle}>
                  輸入您的電子郵件，我們將發送密碼重設連結給您
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
                  <Mail
                    size={16}
                    color={SEMANTIC_COLORS.textMuted}
                    style={styles.inputIcon}
                  />
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
                      <Text style={styles.buttonText}>發送中...</Text>
                    </XStack>
                  ) : (
                    <XStack alignItems="center" gap={8}>
                      <Text style={styles.buttonText}>發送重設連結</Text>
                      <Send size={16} color="#FFFFFF" />
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
