/**
 * 編輯個人資料頁面
 *
 * 對應 apps/web/src/app/profile/edit/page.tsx
 */

import { RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { AtSign, Camera, ChevronLeft, Mail, User } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ProtectedRoute } from '@/components/shared'
import { Button, IconButton, Text } from '@/components/ui'
import { userService } from '@/lib/userService'
import { useAuthStore } from '@/store/authStore'

interface ProfileFormData {
  username: string
  displayName: string
  email: string
  bio: string
}

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/

export default function EditProfileScreen() {
  const router = useRouter()
  const { user, hydrate } = useAuthStore()

  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null)
  const [formData, setFormData] = useState<ProfileFormData>({
    username: user?.username || '',
    displayName: user?.displayName || '',
    email: user?.email || '',
    bio: user?.bio || '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleBack = () => {
    Alert.alert('放棄變更？', '你的變更尚未儲存，確定要離開嗎？', [
      { text: '取消', style: 'cancel' },
      { text: '確定', style: 'destructive', onPress: () => router.back() },
    ])
  }

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri)
    }
  }

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = useCallback(async () => {
    if (!formData.displayName.trim()) {
      Alert.alert('請輸入顯示名稱')
      return
    }

    if (!USERNAME_PATTERN.test(formData.username.trim())) {
      Alert.alert('使用者名稱格式錯誤', '請輸入 3-30 個英文、數字或底線')
      return
    }

    setIsSubmitting(true)
    try {
      let avatarUrl = avatar || undefined

      if (avatar && avatar !== user?.avatar && !avatar.startsWith('http')) {
        avatarUrl = await userService.uploadAvatar(avatar)
      }

      await userService.updateProfile({
        username: formData.username.trim(),
        display_name: formData.displayName.trim(),
        bio: formData.bio.trim(),
        avatar_url: avatarUrl,
      })

      await hydrate()
      Alert.alert('儲存成功', '個人資料已更新', [{ text: '好', onPress: () => router.back() }])
    } catch (error) {
      const message = error instanceof Error ? error.message : '請稍後再試'
      Alert.alert('儲存失敗', message)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, avatar, hydrate, router, user?.avatar])

  return (
    <ProtectedRoute>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* 導航列 */}
        <View style={styles.header}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
          <Text variant="h3" fontWeight="600">
            編輯個人資料
          </Text>
          <Button variant="primary" size="sm" onPress={handleSubmit} disabled={isSubmitting}>
            <Text fontWeight="600" style={styles.saveText}>
              {isSubmitting ? '儲存中...' : '儲存'}
            </Text>
          </Button>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
            {/* 頭像 */}
            <View style={styles.avatarSection}>
              <Pressable onPress={handlePickAvatar} style={styles.avatarContainer}>
                <Image
                  source={{ uri: avatar || undefined }}
                  style={styles.avatar}
                  contentFit="cover"
                />
                <View style={styles.cameraButton}>
                  <Camera size={16} color="#FFFFFF" />
                </View>
              </Pressable>
              <Text variant="small" color="textMuted" style={styles.avatarHint}>
                點擊更換頭像
              </Text>
            </View>

            {/* 基本資訊 */}
            <View style={styles.section}>
              <Text variant="small" color="textMuted" style={styles.sectionTitle}>
                基本資訊
              </Text>

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <User size={18} color={SEMANTIC_COLORS.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.displayName}
                  onChangeText={(v) => handleInputChange('displayName', v)}
                  placeholder="顯示名稱"
                  placeholderTextColor={SEMANTIC_COLORS.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <AtSign size={18} color={SEMANTIC_COLORS.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.username}
                  onChangeText={(v) => handleInputChange('username', v)}
                  placeholder="使用者名稱"
                  placeholderTextColor={SEMANTIC_COLORS.textMuted}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Mail size={18} color={SEMANTIC_COLORS.textMuted} />
                </View>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={formData.email}
                  placeholder="電子郵件"
                  placeholderTextColor={SEMANTIC_COLORS.textMuted}
                  editable={false}
                />
              </View>
            </View>

            {/* 個人簡介 */}
            <View style={styles.section}>
              <Text variant="small" color="textMuted" style={styles.sectionTitle}>
                個人簡介
              </Text>
              <TextInput
                style={styles.bioInput}
                value={formData.bio}
                onChangeText={(v) => handleInputChange('bio', v)}
                placeholder="介紹一下自己和你的攀岩經歷..."
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
              />
              <Text variant="small" color="textMuted" style={styles.charCount}>
                {formData.bio.length}/500
              </Text>
            </View>

            {/* 底部間距 */}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </KeyboardAvoidingView>
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
  saveText: {
    color: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: SEMANTIC_COLORS.textMain,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    marginTop: SPACING.sm,
  },
  section: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  sectionTitle: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    textTransform: 'uppercase',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
  },
  inputIcon: {
    width: 32,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: SEMANTIC_COLORS.textMain,
  },
  inputDisabled: {
    color: SEMANTIC_COLORS.textMuted,
  },
  bioInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    fontSize: 16,
    color: SEMANTIC_COLORS.textMain,
    minHeight: 120,
  },
  charCount: {
    textAlign: 'right',
    marginTop: SPACING.xs,
  },
  bottomPadding: {
    height: SPACING.xxl,
  },
})
