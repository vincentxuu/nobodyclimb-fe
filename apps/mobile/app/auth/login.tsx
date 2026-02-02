/**
 * 登入頁面
 *
 * 對應 apps/web/src/app/auth/login/page.tsx
 */
import React, { useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { YStack, XStack } from 'tamagui'
import { Eye, EyeOff, Mail, Lock, LogIn, ArrowRight } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { useAuthStore } from '@/store/authStore'
import { Text, Button, Link, Spinner } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, FONT_SIZE, RADIUS } from '@nobodyclimb/constants'

export default function LoginScreen() {
  const router = useRouter()
  const { isAuthenticated, login, isLoading } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // 已登入用戶自動重導向到首頁
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/')
    }
  }, [isAuthenticated, router])

  // 處理登入
  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      setError('請填寫所有欄位')
      return
    }

    setError('')
    try {
      await login(email, password)
      router.replace('/')
    } catch (err: any) {
      setError(err.message || '登入失敗，請檢查您的帳號密碼')
    }
  }, [email, password, login, router])

  // 清除錯誤
  const clearError = useCallback(() => {
    setError('')
  }, [])

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
              {/* 標題 */}
              <YStack alignItems="center" gap={SPACING.xs}>
                <Text variant="h1" style={styles.title}>
                  歡迎回來
                </Text>
                <Text color="textSubtle">登入您的帳號以繼續</Text>
              </YStack>

              {/* 錯誤提示 */}
              {error && (
                <View style={styles.errorContainer}>
                  <Text variant="small" color="textMain" style={styles.errorText}>
                    {error}
                  </Text>
                  <Pressable onPress={clearError}>
                    <Text
                      variant="small"
                      color="textMain"
                      style={styles.clearButton}
                    >
                      清除
                    </Text>
                  </Pressable>
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

                {/* Password */}
                <YStack gap={SPACING.xs}>
                  <View style={styles.inputContainer}>
                    <Lock
                      size={16}
                      color={SEMANTIC_COLORS.textMuted}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="密碼"
                      placeholderTextColor={SEMANTIC_COLORS.textMuted}
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />
                    <Pressable
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      {showPassword ? (
                        <EyeOff size={16} color={SEMANTIC_COLORS.textMuted} />
                      ) : (
                        <Eye size={16} color={SEMANTIC_COLORS.textMuted} />
                      )}
                    </Pressable>
                  </View>

                  <XStack justifyContent="flex-end">
                    <Link href="/auth/forgot-password">
                      <Text variant="caption" color="textMuted">
                        忘記密碼?
                      </Text>
                    </Link>
                  </XStack>
                </YStack>

                {/* 登入按鈕 */}
                <Button
                  variant="primary"
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={styles.submitButton}
                >
                  {isLoading ? (
                    <XStack alignItems="center" gap={8}>
                      <Spinner size="sm" color="#FFFFFF" />
                      <Text style={styles.buttonText}>登入中...</Text>
                    </XStack>
                  ) : (
                    <XStack alignItems="center" gap={8}>
                      <Text style={styles.buttonText}>登入</Text>
                      <LogIn size={16} color="#FFFFFF" />
                    </XStack>
                  )}
                </Button>
              </YStack>

              {/* 分隔線 */}
              <XStack alignItems="center" width="100%" gap={SPACING.md}>
                <View style={styles.divider} />
                <Text variant="caption" color="textMuted">
                  或
                </Text>
                <View style={styles.divider} />
              </XStack>

              {/* Google 登入 (TODO: 實作 expo-auth-session) */}
              <Button variant="secondary" style={styles.googleButton}>
                <Text>使用 Google 登入</Text>
              </Button>

              {/* 註冊連結 */}
              <XStack gap={SPACING.xs}>
                <Text color="textSubtle">還沒有帳號？</Text>
                <Link href="/auth/register">
                  <XStack alignItems="center" gap={4}>
                    <Text fontWeight="600">立即註冊</Text>
                    <ArrowRight size={12} color={SEMANTIC_COLORS.textMain} />
                  </XStack>
                </Link>
              </XStack>
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    width: '100%',
  },
  errorText: {
    flex: 1,
    color: '#DC2626',
  },
  clearButton: {
    textDecorationLine: 'underline',
    color: '#DC2626',
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
  eyeButton: {
    padding: SPACING.xs,
  },
  submitButton: {
    width: '100%',
    height: 44,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#D3D3D3',
  },
  googleButton: {
    width: '100%',
    height: 44,
  },
})
