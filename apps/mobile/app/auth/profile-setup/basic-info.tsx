/**
 * Profile Setup - 基本資料頁面
 *
 * 對應 apps/web/src/app/auth/profile-setup/basic-info/page.tsx
 */

import { FONT_SIZE, RADIUS, SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { Camera, Lightbulb, Plus, User, X } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'
import { XStack, YStack } from 'tamagui'
import { Avatar, Button, ProgressBar, Text } from '@/components/ui'
import biographyService from '@/lib/biographyService'
import { userService } from '@/lib/userService'
import { useAuthStore } from '@/store/authStore'

const ROUTE_TYPE_GROUPS = [
  {
    category: '攀登方式',
    options: ['抱石', '運動攀登', '頂繩攀登', '速度攀登', '傳統攀登'],
  },
  {
    category: '地形型態',
    options: ['平板岩', '垂直岩壁', '外傾岩壁', '屋簷', '裂隙'],
  },
  {
    category: '動作風格',
    options: ['動態路線', '靜態', '技術性', '力量型', '耐力型'],
  },
]

export default function BasicInfoScreen() {
  const router = useRouter()
  const { hydrate, user } = useAuthStore()

  const [displayName, setDisplayName] = useState('')
  const [title, setTitle] = useState('')
  const [startYear, setStartYear] = useState('')
  const [newLocation, setNewLocation] = useState('')
  const [frequentLocations, setFrequentLocations] = useState<string[]>([])
  const [favoriteRouteTypes, setFavoriteRouteTypes] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const currentYear = new Date().getFullYear()
  const startYearHint = useMemo(() => `1970 - ${currentYear}`, [currentYear])

  useEffect(() => {
    if (user && !displayName) {
      setDisplayName(user.displayName || user.username || '')
    }
  }, [displayName, user])

  const handleAddLocation = useCallback(() => {
    const value = newLocation.trim()
    if (!value || frequentLocations.includes(value)) return
    setFrequentLocations((prev) => [...prev, value])
    setNewLocation('')
  }, [frequentLocations, newLocation])

  const handleRemoveLocation = useCallback((location: string) => {
    setFrequentLocations((prev) => prev.filter((item) => item !== location))
  }, [])

  const handleToggleRouteType = useCallback((value: string) => {
    setFavoriteRouteTypes((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    )
  }, [])

  // 處理下一步
  const handleNext = useCallback(async () => {
    if (!displayName.trim()) {
      return
    }
    const normalizedStartYear = startYear.trim()
    if (normalizedStartYear) {
      const parsedYear = Number(normalizedStartYear)
      if (
        !Number.isInteger(parsedYear) ||
        parsedYear < 1970 ||
        parsedYear > currentYear ||
        normalizedStartYear.length !== 4
      ) {
        Alert.alert('年份格式錯誤', `請輸入 1970 到 ${currentYear} 之間的年份`)
        return
      }
    }

    setIsLoading(true)
    try {
      const avatarUrl = avatarUri ? await userService.uploadAvatar(avatarUri) : undefined
      await userService.updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl,
      })
      await biographyService.updateRegistrationBiography({
        name: displayName.trim(),
        title: title.trim() || undefined,
        climbing_start_year: normalizedStartYear || undefined,
        frequent_locations: frequentLocations,
        favorite_route_type: favoriteRouteTypes.join('、') || undefined,
        visibility: 'public',
      })
      await hydrate()
      router.push('/auth/profile-setup/tags')
    } catch (error) {
      console.error('儲存失敗', error)
      const message = error instanceof Error ? error.message : '請稍後再試'
      Alert.alert('儲存失敗', message)
    } finally {
      setIsLoading(false)
    }
  }, [
    avatarUri,
    bio,
    displayName,
    favoriteRouteTypes,
    frequentLocations,
    hydrate,
    currentYear,
    router,
    startYear,
    title,
  ])

  // 處理選擇頭像
  const handleSelectAvatar = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri)
    }
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
                <Text color="textSubtle">讓其他攀岩愛好者認識您</Text>
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

                {/* 一句話介紹 */}
                <YStack gap={SPACING.xs}>
                  <Text variant="body" fontWeight="500">
                    一句話介紹
                  </Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder="例如：週末出沒的抱石解題派"
                      placeholderTextColor={SEMANTIC_COLORS.textMuted}
                      value={title}
                      onChangeText={setTitle}
                      maxLength={100}
                    />
                  </View>
                  <XStack alignItems="center" gap={4}>
                    <Lightbulb size={12} color={SEMANTIC_COLORS.textMuted} />
                    <Text variant="caption" color="textMuted">
                      會顯示在人物誌名稱下方
                    </Text>
                  </XStack>
                </YStack>

                {/* 開始攀岩年份 */}
                <YStack gap={SPACING.xs}>
                  <Text variant="body" fontWeight="500">
                    開始攀岩年份
                  </Text>
                  <View style={styles.inputContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder={startYearHint}
                      placeholderTextColor={SEMANTIC_COLORS.textMuted}
                      value={startYear}
                      onChangeText={setStartYear}
                      keyboardType="number-pad"
                      maxLength={4}
                    />
                  </View>
                </YStack>

                {/* 常去地點 */}
                <YStack gap={SPACING.xs}>
                  <Text variant="body" fontWeight="500">
                    平常出沒的地方
                  </Text>
                  <XStack gap={SPACING.xs} alignItems="center">
                    <View style={[styles.inputContainer, styles.locationInput]}>
                      <TextInput
                        style={styles.input}
                        placeholder="輸入地點或岩館"
                        placeholderTextColor={SEMANTIC_COLORS.textMuted}
                        value={newLocation}
                        onChangeText={setNewLocation}
                        onSubmitEditing={handleAddLocation}
                        returnKeyType="done"
                      />
                    </View>
                    <Button
                      variant="secondary"
                      onPress={handleAddLocation}
                      disabled={!newLocation.trim()}
                      style={styles.addButton}
                    >
                      <Plus size={18} color={SEMANTIC_COLORS.textMain} />
                    </Button>
                  </XStack>
                  {frequentLocations.length > 0 && (
                    <XStack flexWrap="wrap" gap={SPACING.xs}>
                      {frequentLocations.map((location) => (
                        <Pressable
                          key={location}
                          onPress={() => handleRemoveLocation(location)}
                          style={styles.chip}
                        >
                          <Text variant="caption">{location}</Text>
                          <X size={12} color={SEMANTIC_COLORS.textMuted} />
                        </Pressable>
                      ))}
                    </XStack>
                  )}
                </YStack>

                {/* 喜歡的路線型態 */}
                <YStack gap={SPACING.sm}>
                  <Text variant="body" fontWeight="500">
                    喜歡的路線型態
                  </Text>
                  {ROUTE_TYPE_GROUPS.map((group) => (
                    <YStack key={group.category} gap={SPACING.xs}>
                      <Text variant="caption" color="textMuted">
                        {group.category}
                      </Text>
                      <XStack flexWrap="wrap" gap={SPACING.xs}>
                        {group.options.map((option) => {
                          const selected = favoriteRouteTypes.includes(option)
                          return (
                            <Pressable
                              key={option}
                              onPress={() => handleToggleRouteType(option)}
                              style={[styles.routeChip, selected && styles.routeChipSelected]}
                            >
                              <Text
                                variant="caption"
                                style={selected ? styles.routeChipTextSelected : undefined}
                              >
                                {option}
                              </Text>
                            </Pressable>
                          )
                        })}
                      </XStack>
                    </YStack>
                  ))}
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
                  <Text style={styles.buttonText}>{isLoading ? '處理中...' : '下一步'}</Text>
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
  locationInput: {
    flex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    paddingHorizontal: 0,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: WB_COLORS[10],
  },
  routeChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#D3D3D3',
    backgroundColor: '#FFFFFF',
  },
  routeChipSelected: {
    borderColor: SEMANTIC_COLORS.textMain,
    backgroundColor: SEMANTIC_COLORS.textMain,
  },
  routeChipTextSelected: {
    color: '#FFFFFF',
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
