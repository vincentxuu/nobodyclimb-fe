/**
 * 編輯個人資料頁面
 *
 * 對應 apps/web/src/app/profile/edit/page.tsx
 */
import React, { useState, useCallback } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import {
  ChevronLeft,
  Camera,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Instagram,
  Facebook,
  Youtube,
} from 'lucide-react-native'
import * as ImagePicker from 'expo-image-picker'

import { Text, IconButton, Button, Input } from '@/components/ui'
import { ProtectedRoute } from '@/components/shared'
import { useAuthStore } from '@/store/authStore'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface ProfileFormData {
  displayName: string
  email: string
  phone: string
  location: string
  birthday: string
  bio: string
  instagram: string
  facebook: string
  youtube: string
}

export default function EditProfileScreen() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [avatar, setAvatar] = useState<string | null>(
    user?.avatar || 'https://picsum.photos/200?random=user'
  )
  const [formData, setFormData] = useState<ProfileFormData>({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    location: '',
    birthday: '',
    bio: '',
    instagram: '',
    facebook: '',
    youtube: '',
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

    setIsSubmitting(true)
    try {
      // TODO: 整合 userService.updateProfile
      await new Promise((resolve) => setTimeout(resolve, 1000))
      Alert.alert('儲存成功', '個人資料已更新', [
        { text: '好', onPress: () => router.back() },
      ])
    } catch (error) {
      Alert.alert('儲存失敗', '請稍後再試')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, avatar, router])

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
          <Button
            variant="primary"
            size="sm"
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            <Text fontWeight="600" style={styles.saveText}>
              {isSubmitting ? '儲存中...' : '儲存'}
            </Text>
          </Button>
        </View>

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scrollView}
            keyboardShouldPersistTaps="handled"
          >
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

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Phone size={18} color={SEMANTIC_COLORS.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.phone}
                  onChangeText={(v) => handleInputChange('phone', v)}
                  placeholder="電話號碼"
                  placeholderTextColor={SEMANTIC_COLORS.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <MapPin size={18} color={SEMANTIC_COLORS.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.location}
                  onChangeText={(v) => handleInputChange('location', v)}
                  placeholder="所在地區"
                  placeholderTextColor={SEMANTIC_COLORS.textMuted}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Calendar size={18} color={SEMANTIC_COLORS.textMuted} />
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.birthday}
                  onChangeText={(v) => handleInputChange('birthday', v)}
                  placeholder="生日 (YYYY-MM-DD)"
                  placeholderTextColor={SEMANTIC_COLORS.textMuted}
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

            {/* 社群連結 */}
            <View style={styles.section}>
              <Text variant="small" color="textMuted" style={styles.sectionTitle}>
                社群連結
              </Text>

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Instagram size={18} color="#E4405F" />
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.instagram}
                  onChangeText={(v) => handleInputChange('instagram', v)}
                  placeholder="Instagram 用戶名"
                  placeholderTextColor={SEMANTIC_COLORS.textMuted}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Facebook size={18} color="#1877F2" />
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.facebook}
                  onChangeText={(v) => handleInputChange('facebook', v)}
                  placeholder="Facebook 用戶名"
                  placeholderTextColor={SEMANTIC_COLORS.textMuted}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputIcon}>
                  <Youtube size={18} color="#FF0000" />
                </View>
                <TextInput
                  style={styles.input}
                  value={formData.youtube}
                  onChangeText={(v) => handleInputChange('youtube', v)}
                  placeholder="YouTube 頻道"
                  placeholderTextColor={SEMANTIC_COLORS.textMuted}
                  autoCapitalize="none"
                />
              </View>
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
