/**
 * Profile Setup - 基本資料頁面
 *
 * 對應 apps/web/src/app/auth/profile-setup/basic-info/page.tsx
 */
import React, { useState, useCallback } from 'react'
import {
  StyleSheet,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { YStack, XStack } from 'tamagui'
import { User, Camera } from 'lucide-react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text, Button, Avatar, ProgressBar } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, FONT_SIZE, RADIUS } from '@nobodyclimb/constants'

export default function BasicInfoScreen() {
  const router = useRouter()

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // 處理下一步
  const handleNext = useCallback(async () => {
    if (!displayName.trim()) {
      return
    }

    setIsLoading(true)
    try {
      // TODO: 儲存基本資料到後端
      router.push('/auth/profile-setup/tags')
    } catch (error) {
      console.error('儲存失敗', error)
    } finally {
      setIsLoading(false)
    }
  }, [displayName, router])

  // 處理選擇頭像
  const handleSelectAvatar = useCallback(() => {
    // TODO: 實作圖片選擇 (expo-image-picker)
    console.log('選擇頭像')
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
            <YStack gap={SPACING.lg}>
              {/* 進度條 */}
              <YStack gap={SPACING.xs}>
                <XStack justifyContent="space-between">
                  <Text variant="small" color="textSubtle">
                    步驟 1/4
                  </Text>
                  <Text variant="small" color="textSubtle">
                    基本資料
                  </Text>
                </XStack>
                <ProgressBar value={25} />
              </YStack>

              {/* 標題 */}
              <YStack gap={SPACING.xs}>
                <Text variant="h2">完善您的個人資料</Text>
                <Text color="textSubtle">
                  讓其他攀岩愛好者認識您
                </Text>
              </YStack>

              {/* 頭像選擇 */}
              <YStack alignItems="center" gap={SPACING.sm}>
                <Pressable onPress={handleSelectAvatar} style={styles.avatarContainer}>
                  <Avatar
                    size="xl"
                    source={avatarUri ? { uri: avatarUri } : undefined}
                    fallback={<User size={40} color={SEMANTIC_COLORS.textMuted} />}
                  />
                  <View style={styles.cameraIcon}>
                    <Camera size={16} color="#FFFFFF" />
                  </View>
                </Pressable>
                <Text variant="small" color="textSubtle">
                  點擊更換頭像
                </Text>
              </YStack>

              {/* 表單 */}
              <YStack gap={SPACING.md}>
                {/* 顯示名稱 */}
                <YStack gap={SPACING.xs}>
                  <Text variant="body" fontWeight="500">
                    顯示名稱 <Text color="textSubtle">*</Text>
                  </Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="您的暱稱或真名"
                      placeholderTextColor={SEMANTIC_COLORS.textMuted}
                      value={displayName}
                      onChangeText={setDisplayName}
                      autoCapitalize="words"
                      maxLength={30}
                    />
                  </View>
                  <Text variant="caption" color="textMuted">
                    {displayName.length}/30
                  </Text>
                </YStack>

                {/* 個人簡介 */}
                <YStack gap={SPACING.xs}>
                  <Text variant="body" fontWeight="500">
                    個人簡介
                  </Text>
                  <View style={[styles.inputContainer, styles.textAreaContainer]}>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      placeholder="簡單介紹一下自己..."
                      placeholderTextColor={SEMANTIC_COLORS.textMuted}
                      value={bio}
                      onChangeText={setBio}
                      multiline
                      numberOfLines={4}
                      maxLength={200}
                      textAlignVertical="top"
                    />
                  </View>
                  <Text variant="caption" color="textMuted">
                    {bio.length}/200
                  </Text>
                </YStack>
              </YStack>

              {/* 按鈕 */}
              <YStack gap={SPACING.sm}>
                <Button
                  variant="primary"
                  onPress={handleNext}
                  disabled={!displayName.trim() || isLoading}
                  style={styles.nextButton}
                >
                  <Text style={styles.buttonText}>
                    {isLoading ? '處理中...' : '下一步'}
                  </Text>
                </Button>
                <Button
                  variant="ghost"
                  onPress={() => router.replace('/')}
                  style={styles.skipButton}
                >
                  <Text color="textSubtle">稍後再說</Text>
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
    padding: SPACING.lg,
  },
  avatarContainer: {
    position: 'relative',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: SEMANTIC_COLORS.textMain,
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.sm,
    height: 44,
    justifyContent: 'center',
  },
  textAreaContainer: {
    height: 100,
    paddingVertical: SPACING.sm,
  },
  input: {
    fontSize: FONT_SIZE.sm,
    color: SEMANTIC_COLORS.textMain,
  },
  textArea: {
    flex: 1,
  },
  nextButton: {
    width: '100%',
    height: 44,
  },
  skipButton: {
    width: '100%',
    height: 44,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
})
