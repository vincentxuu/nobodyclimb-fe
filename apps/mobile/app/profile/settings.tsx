/**
 * 帳號設定頁面
 *
 * 對應 apps/web/src/app/profile/settings/page.tsx
 */

import { RADIUS, SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import {
  AtSign,
  Bell,
  Camera,
  ChevronLeft,
  ChevronRight,
  Eye,
  HelpCircle,
  Key,
  Lock,
  Mail,
  UserCircle,
} from 'lucide-react-native'
import React, { useEffect, useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { NotificationPreferences, NotificationStats } from '@/components/profile'
import { ProtectedRoute } from '@/components/shared'
import { Button, IconButton, Text } from '@/components/ui'
import { userService } from '@/lib/userService'
import { useAuthStore } from '@/store/authStore'

type SettingsTab = 'profile' | 'security' | 'notifications'

interface ProfileFormData {
  username: string
  displayName: string
  email: string
  bio: string
}

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,30}$/

interface SettingItemProps {
  icon: React.ReactNode
  label: string
  onPress?: () => void
  rightElement?: React.ReactNode
  destructive?: boolean
}

function SettingItem({
  icon,
  label,
  onPress,
  rightElement,
  destructive = false,
}: SettingItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingItem, pressed && styles.settingItemPressed]}
      onPress={onPress}
      disabled={!onPress && !rightElement}
    >
      <View style={styles.settingLeft}>
        {icon}
        <Text fontWeight="500" style={destructive ? styles.destructiveText : undefined}>
          {label}
        </Text>
      </View>
      {rightElement ||
        (onPress && (
          <ChevronRight size={20} color={destructive ? '#D94A4A' : SEMANTIC_COLORS.textMuted} />
        ))}
    </Pressable>
  )
}

export default function SettingsScreen() {
  const router = useRouter()
  const { user, hydrate } = useAuthStore()

  const [activeTab, setActiveTab] = useState<SettingsTab>('profile')
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null)
  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    username: user?.username || '',
    displayName: user?.displayName || '',
    email: user?.email || '',
    bio: user?.bio || '',
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  useEffect(() => {
    setAvatar(user?.avatar || null)
    setProfileForm({
      username: user?.username || '',
      displayName: user?.displayName || '',
      email: user?.email || '',
      bio: user?.bio || '',
    })
  }, [user])

  const handleBack = () => {
    router.back()
  }

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]?.uri) {
      setAvatar(result.assets[0].uri)
    }
  }

  const handleProfileFieldChange = (field: keyof ProfileFormData, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    if (!profileForm.displayName.trim()) {
      Alert.alert('請輸入顯示名稱')
      return
    }

    if (!USERNAME_PATTERN.test(profileForm.username.trim())) {
      Alert.alert('使用者名稱格式錯誤', '請輸入 3-30 個英文、數字或底線')
      return
    }

    setIsSavingProfile(true)
    try {
      let avatarUrl = avatar || undefined

      if (avatar && avatar !== user?.avatar && !avatar.startsWith('http')) {
        avatarUrl = await userService.uploadAvatar(avatar)
      }

      await userService.updateProfile({
        username: profileForm.username.trim(),
        display_name: profileForm.displayName.trim(),
        bio: profileForm.bio.trim(),
        avatar_url: avatarUrl,
      })

      await hydrate()
      Alert.alert('儲存成功', '個人資料已更新')
    } catch (error) {
      const message = error instanceof Error ? error.message : '請稍後再試'
      Alert.alert('儲存失敗', message)
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = () => {
    setIsPasswordModalVisible(true)
  }

  const handleClosePasswordModal = () => {
    if (isChangingPassword) return
    setIsPasswordModalVisible(false)
  }

  const handleSubmitPassword = async () => {
    if (!currentPassword) {
      Alert.alert('請輸入目前密碼')
      return
    }
    if (!newPassword) {
      Alert.alert('請輸入新密碼')
      return
    }
    if (newPassword.length < 8) {
      Alert.alert('新密碼太短', '密碼至少需要 8 個字元')
      return
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('密碼不一致', '請確認兩次輸入的新密碼相同')
      return
    }

    setIsChangingPassword(true)
    try {
      await userService.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setIsPasswordModalVisible(false)
      Alert.alert('更新成功', '密碼已更新')
    } catch (error) {
      const message = error instanceof Error ? error.message : '請稍後再試'
      Alert.alert('更新失敗', message)
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleOpenUrl = async (url: string) => {
    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert('無法開啟連結', url)
    }
  }

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
            帳號設定
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.tabBar}>
            <Pressable
              style={[styles.tabButton, activeTab === 'profile' && styles.tabButtonActive]}
              onPress={() => setActiveTab('profile')}
            >
              <UserCircle
                size={18}
                color={
                  activeTab === 'profile' ? SEMANTIC_COLORS.textMain : SEMANTIC_COLORS.textMuted
                }
              />
              <Text
                variant="small"
                fontWeight="600"
                color={activeTab === 'profile' ? 'textMain' : 'textMuted'}
              >
                個人資料
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabButton, activeTab === 'security' && styles.tabButtonActive]}
              onPress={() => setActiveTab('security')}
            >
              <Key
                size={18}
                color={
                  activeTab === 'security' ? SEMANTIC_COLORS.textMain : SEMANTIC_COLORS.textMuted
                }
              />
              <Text
                variant="small"
                fontWeight="600"
                color={activeTab === 'security' ? 'textMain' : 'textMuted'}
              >
                安全
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tabButton, activeTab === 'notifications' && styles.tabButtonActive]}
              onPress={() => setActiveTab('notifications')}
            >
              <Bell
                size={18}
                color={
                  activeTab === 'notifications'
                    ? SEMANTIC_COLORS.textMain
                    : SEMANTIC_COLORS.textMuted
                }
              />
              <Text
                variant="small"
                fontWeight="600"
                color={activeTab === 'notifications' ? 'textMain' : 'textMuted'}
              >
                通知
              </Text>
            </Pressable>
          </View>

          {activeTab === 'profile' && (
            <>
              <View style={styles.avatarSection}>
                <Pressable onPress={handlePickAvatar} style={styles.avatarContainer}>
                  <Image
                    source={avatar ? { uri: avatar } : undefined}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                  {!avatar && (
                    <View style={styles.avatarFallback}>
                      <UserCircle size={56} color={SEMANTIC_COLORS.textMuted} />
                    </View>
                  )}
                  <View style={styles.cameraButton}>
                    <Camera size={16} color="#FFFFFF" />
                  </View>
                </Pressable>
                <Text variant="small" color="textMuted" style={styles.avatarHint}>
                  點擊上傳或裁切頭像
                </Text>
              </View>

              <View style={styles.section}>
                <Text variant="small" color="textMuted" style={styles.sectionTitle}>
                  帳號資料
                </Text>

                <View style={styles.inputGroup}>
                  <UserCircle size={18} color={SEMANTIC_COLORS.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={profileForm.displayName}
                    onChangeText={(value) => handleProfileFieldChange('displayName', value)}
                    placeholder="顯示名稱"
                    placeholderTextColor={SEMANTIC_COLORS.textMuted}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <AtSign size={18} color={SEMANTIC_COLORS.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={profileForm.username}
                    onChangeText={(value) => handleProfileFieldChange('username', value)}
                    placeholder="使用者名稱"
                    placeholderTextColor={SEMANTIC_COLORS.textMuted}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Mail size={18} color={SEMANTIC_COLORS.textMuted} />
                  <TextInput
                    style={[styles.input, styles.inputDisabled]}
                    value={profileForm.email}
                    placeholder="電子郵件"
                    placeholderTextColor={SEMANTIC_COLORS.textMuted}
                    editable={false}
                  />
                </View>

                <TextInput
                  style={styles.bioInput}
                  value={profileForm.bio}
                  onChangeText={(value) => handleProfileFieldChange('bio', value)}
                  placeholder="介紹一下自己和你的攀岩經歷..."
                  placeholderTextColor={SEMANTIC_COLORS.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text variant="small" color="textMuted" style={styles.charCount}>
                  {profileForm.bio.length}/500
                </Text>

                <Button
                  variant="primary"
                  onPress={handleSaveProfile}
                  disabled={isSavingProfile}
                  style={styles.saveProfileButton}
                >
                  <Text fontWeight="600" style={styles.primaryButtonText}>
                    {isSavingProfile ? '儲存中...' : '儲存變更'}
                  </Text>
                </Button>
              </View>

              <View style={styles.section}>
                <Text variant="small" color="textMuted" style={styles.sectionTitle}>
                  隱私
                </Text>
                <SettingItem
                  icon={<Eye size={20} color={SEMANTIC_COLORS.textMain} />}
                  label="人物誌隱私設定"
                  onPress={() => router.push('/profile/editor' as never)}
                />
              </View>
            </>
          )}

          {activeTab === 'security' && (
            <View style={styles.section}>
              <Text variant="small" color="textMuted" style={styles.sectionTitle}>
                安全
              </Text>
              <SettingItem
                icon={<Lock size={20} color={SEMANTIC_COLORS.textMain} />}
                label="變更密碼"
                onPress={handleChangePassword}
              />
            </View>
          )}

          {activeTab === 'notifications' && (
            <View style={styles.section}>
              <Text variant="small" color="textMuted" style={styles.sectionTitle}>
                通知
              </Text>
              <View style={styles.embeddedPanel}>
                <View style={styles.panelTitleRow}>
                  <Bell size={18} color={SEMANTIC_COLORS.textMain} />
                  <Text variant="bodyBold">通知統計</Text>
                </View>
                <NotificationStats />
              </View>
              <View style={styles.embeddedPanel}>
                <NotificationPreferences />
              </View>
            </View>
          )}

          {/* 關於 */}
          <View style={styles.section}>
            <Text variant="small" color="textMuted" style={styles.sectionTitle}>
              關於
            </Text>
            <SettingItem
              icon={<HelpCircle size={20} color={SEMANTIC_COLORS.textMain} />}
              label="幫助中心"
              onPress={() => handleOpenUrl('https://nobodyclimb.cc/about')}
            />
          </View>

          {/* 版本資訊 */}
          <View style={styles.versionSection}>
            <Text variant="small" color="textMuted">
              NobodyClimb v1.0.0
            </Text>
          </View>
        </ScrollView>

        <Modal
          visible={isPasswordModalVisible}
          animationType="slide"
          transparent
          onRequestClose={handleClosePasswordModal}
        >
          <KeyboardAvoidingView
            style={styles.modalOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.passwordModal}>
              <Text variant="h3" fontWeight="600" style={styles.modalTitle}>
                變更密碼
              </Text>

              <TextInput
                style={styles.passwordInput}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                placeholder="目前密碼"
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="新密碼"
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="確認新密碼"
                placeholderTextColor={SEMANTIC_COLORS.textMuted}
                secureTextEntry
                autoCapitalize="none"
              />

              <View style={styles.modalActions}>
                <Button
                  variant="ghost"
                  onPress={handleClosePasswordModal}
                  disabled={isChangingPassword}
                  style={styles.modalButton}
                >
                  取消
                </Button>
                <Button
                  variant="primary"
                  onPress={handleSubmitPassword}
                  disabled={isChangingPassword}
                  style={styles.modalButton}
                >
                  <Text fontWeight="600" style={styles.primaryButtonText}>
                    {isChangingPassword ? '更新中...' : '更新密碼'}
                  </Text>
                </Button>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
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
  scrollView: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#DBD8D8',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: SEMANTIC_COLORS.textMain,
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
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: '#F5F5F5',
  },
  avatarFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
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
  },
  sectionTitle: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xs,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  settingItemPressed: {
    backgroundColor: '#F5F5F5',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: '#F5F5F5',
  },
  input: {
    flex: 1,
    minHeight: 48,
    fontSize: 16,
    color: SEMANTIC_COLORS.textMain,
  },
  inputDisabled: {
    color: SEMANTIC_COLORS.textMuted,
  },
  bioInput: {
    minHeight: 112,
    marginHorizontal: SPACING.md,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: '#F5F5F5',
    color: SEMANTIC_COLORS.textMain,
    fontSize: 16,
  },
  charCount: {
    marginTop: SPACING.xs,
    marginHorizontal: SPACING.md,
    textAlign: 'right',
  },
  saveProfileButton: {
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  embeddedPanel: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  destructiveText: {
    color: '#D94A4A',
  },
  versionSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  passwordModal: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING.lg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    gap: SPACING.sm,
  },
  modalTitle: {
    marginBottom: SPACING.sm,
  },
  passwordInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    color: SEMANTIC_COLORS.textMain,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  modalButton: {
    minWidth: 104,
  },
  primaryButtonText: {
    color: '#FFFFFF',
  },
})
