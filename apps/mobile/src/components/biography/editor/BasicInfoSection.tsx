import React, { useState, useMemo } from 'react'
import { View, Pressable, TextInput, ScrollView } from 'react-native'
import { Image } from 'expo-image'
import { YStack, XStack, Text } from 'tamagui'
import {
  User,
  ImageIcon,
  Pencil,
  Clock,
  Link,
  Instagram,
  Youtube,
  X,
  Plus,
  Lightbulb,
} from 'lucide-react-native'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'
import type { SocialLinks } from '@nobodyclimb/types'

interface BasicInfoSectionProps {
  /** 用戶名稱 */
  name: string
  /** 名稱變更回調 */
  onNameChange: (name: string) => void
  /** 個人標題 */
  title: string | null
  /** 標題變更回調 */
  onTitleChange: (title: string | null) => void
  /** 頭像 URL */
  avatarUrl: string | null
  /** 頭像變更回調 */
  onAvatarChange: () => void
  /** 封面圖 URL */
  coverUrl: string | null
  /** 封面圖變更回調 */
  onCoverChange: () => void
  /** 開始攀岩年份 */
  climbingStartYear: number | null
  /** 開始攀岩年份變更回調 */
  onClimbingStartYearChange: (year: number | null) => void
  /** 平常出沒的地方 */
  frequentLocations: string[]
  /** 平常出沒的地方變更回調 */
  onFrequentLocationsChange: (locations: string[]) => void
  /** 喜歡的路線型態 */
  favoriteRouteTypes: string[]
  /** 喜歡的路線型態變更回調 */
  onFavoriteRouteTypesChange: (types: string[]) => void
  /** 社群連結 */
  socialLinks: SocialLinks
  /** 社群連結變更回調 */
  onSocialLinksChange: (socialLinks: SocialLinks) => void
}

// 預設的路線型態選項（分類）
const routeTypeGroups = [
  {
    category: '攀登方式',
    options: [
      { label: '抱石', value: '抱石' },
      { label: '運動攀登', value: '運動攀登' },
      { label: '頂繩攀登', value: '頂繩攀登' },
      { label: '速度攀登', value: '速度攀登' },
      { label: '傳統攀登', value: '傳統攀登' },
    ],
  },
  {
    category: '地形型態',
    options: [
      { label: '平板岩', value: '平板岩' },
      { label: '垂直岩壁', value: '垂直岩壁' },
      { label: '外傾岩壁', value: '外傾岩壁' },
      { label: '屋簷', value: '屋簷' },
      { label: '裂隙', value: '裂隙' },
    ],
  },
  {
    category: '動作風格',
    options: [
      { label: '動態路線', value: '動態路線' },
      { label: '靜態', value: '靜態' },
      { label: '技術性', value: '技術性' },
      { label: '力量型', value: '力量型' },
      { label: '耐力型', value: '耐力型' },
    ],
  },
]

/**
 * 基本資料編輯區塊
 *
 * 用於編輯用戶的基本資料
 */
export function BasicInfoSection({
  name,
  onNameChange,
  title,
  onTitleChange,
  avatarUrl,
  onAvatarChange,
  coverUrl,
  onCoverChange,
  climbingStartYear,
  onClimbingStartYearChange,
  frequentLocations,
  onFrequentLocationsChange,
  favoriteRouteTypes,
  onFavoriteRouteTypesChange,
  socialLinks,
  onSocialLinksChange,
}: BasicInfoSectionProps) {
  const [newLocation, setNewLocation] = useState('')

  // Generate year options from current year back to 1970
  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => {
    const years: number[] = []
    for (let year = currentYear; year >= 1970; year--) {
      years.push(year)
    }
    return years
  }, [currentYear])

  // Calculate climbing years for display
  const climbingYearsDisplay = climbingStartYear
    ? currentYear - climbingStartYear
    : null

  // Handle social links change
  const handleSocialLinkChange = (field: keyof SocialLinks, value: string) => {
    onSocialLinksChange({
      ...socialLinks,
      [field]: value || undefined,
    })
  }

  // 扁平化所有選項
  const allRouteTypeOptions = routeTypeGroups.flatMap((g) => g.options)

  const addLocation = () => {
    if (newLocation.trim() && !frequentLocations.includes(newLocation.trim())) {
      onFrequentLocationsChange([...frequentLocations, newLocation.trim()])
      setNewLocation('')
    }
  }

  const removeLocation = (index: number) => {
    const newLocations = frequentLocations.filter((_, i) => i !== index)
    onFrequentLocationsChange(newLocations)
  }

  const toggleRouteType = (value: string) => {
    if (favoriteRouteTypes.includes(value)) {
      onFavoriteRouteTypesChange(favoriteRouteTypes.filter((t) => t !== value))
    } else {
      onFavoriteRouteTypesChange([...favoriteRouteTypes, value])
    }
  }

  return (
    <YStack gap="$6">
      {/* Section Header */}
      <XStack alignItems="center" gap="$2">
        <User size={18} color={SEMANTIC_COLORS.textSubtle} />
        <Text fontSize={16} fontWeight="600" color={SEMANTIC_COLORS.textMain}>
          基本資料
        </Text>
        <XStack
          alignItems="center"
          gap="$1"
          paddingHorizontal="$2"
          paddingVertical="$1"
          backgroundColor={COLORS.background.subtle}
          borderRadius="$6"
        >
          <Clock size={12} color={COLORS.text.muted} />
          <Text fontSize={12} color={COLORS.text.muted}>
            1 分鐘
          </Text>
        </XStack>
      </XStack>

      {/* Cover Image */}
      <YStack gap="$2">
        <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textSubtle}>
          封面圖片
        </Text>
        <Pressable
          onPress={onCoverChange}
          style={{
            height: 128,
            backgroundColor: COLORS.background.muted,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ImageIcon size={32} color={COLORS.text.muted} />
              <Text fontSize={14} color={COLORS.text.muted} marginTop="$2">
                點擊上傳封面圖片
              </Text>
            </View>
          )}
        </Pressable>
        <Text fontSize={12} color={COLORS.text.muted}>
          建議尺寸：1200 x 400 像素
        </Text>
      </YStack>

      {/* Avatar */}
      <YStack gap="$2">
        <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textSubtle}>
          頭像
        </Text>
        <XStack alignItems="center" gap="$4">
          <Pressable
            onPress={onAvatarChange}
            style={{
              width: 80,
              height: 80,
              backgroundColor: COLORS.background.muted,
              borderRadius: 40,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <User size={32} color={COLORS.text.muted} />
            )}
          </Pressable>
          <View>
            <Text fontSize={14} color={COLORS.text.muted}>
              點擊頭像更換
            </Text>
            <Text fontSize={12} color={COLORS.text.muted}>
              建議使用正方形圖片
            </Text>
          </View>
        </XStack>
      </YStack>

      {/* Name */}
      <YStack gap="$2">
        <XStack alignItems="center">
          <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textSubtle}>
            顯示名稱
          </Text>
          <Text fontSize={14} color={COLORS.status.error}>
            {' '}*
          </Text>
        </XStack>
        <TextInput
          value={name}
          onChangeText={onNameChange}
          placeholder="你想怎麼被稱呼？"
          placeholderTextColor={COLORS.text.placeholder}
          maxLength={50}
          style={{
            width: '100%',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: COLORS.border.default,
            borderRadius: 12,
            color: SEMANTIC_COLORS.textMain,
            fontSize: 14,
          }}
        />
        <Text fontSize={12} color={COLORS.text.muted}>
          這會顯示在你的人物誌上
        </Text>
      </YStack>

      {/* Title / Tagline */}
      <YStack gap="$2">
        <XStack alignItems="center">
          <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textSubtle}>
            一句話介紹自己
          </Text>
          <Text fontSize={12} color={COLORS.text.muted}>
            {' '}(選填)
          </Text>
        </XStack>
        <TextInput
          value={title || ''}
          onChangeText={(text) => onTitleChange(text || null)}
          placeholder="例如：快樂最重要的週末岩友"
          placeholderTextColor={COLORS.text.placeholder}
          maxLength={100}
          style={{
            width: '100%',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: COLORS.border.default,
            borderRadius: 12,
            color: SEMANTIC_COLORS.textMain,
            fontSize: 14,
          }}
        />
        <XStack alignItems="center" gap="$1">
          <Lightbulb size={12} color={COLORS.text.muted} />
          <Text fontSize={12} color={COLORS.text.muted}>
            這句話會顯示在你的名字下方
          </Text>
        </XStack>
      </YStack>

      {/* Climbing Start Year */}
      <YStack gap="$2">
        <XStack alignItems="center">
          <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textSubtle}>
            開始攀岩年份
          </Text>
          <Text fontSize={12} color={COLORS.text.muted}>
            {' '}(選填)
          </Text>
        </XStack>
        <XStack alignItems="center" gap="$3">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ maxWidth: 150 }}
          >
            <XStack gap="$2">
              {[null, ...yearOptions.slice(0, 10)].map((year) => (
                <Pressable
                  key={year ?? 'none'}
                  onPress={() => onClimbingStartYearChange(year)}
                  style={({ pressed }) => ({
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor:
                      climbingStartYear === year
                        ? COLORS.brand.dark
                        : COLORS.border.default,
                    backgroundColor:
                      climbingStartYear === year
                        ? COLORS.brand.dark
                        : pressed
                          ? COLORS.background.subtle
                          : 'white',
                  })}
                >
                  <Text
                    fontSize={14}
                    color={climbingStartYear === year ? 'white' : SEMANTIC_COLORS.textSubtle}
                  >
                    {year ?? '選擇'}
                  </Text>
                </Pressable>
              ))}
            </XStack>
          </ScrollView>
          <Text fontSize={14} color={COLORS.text.muted}>
            {climbingYearsDisplay !== null && climbingYearsDisplay >= 0
              ? `約 ${climbingYearsDisplay} 年經驗`
              : '從入坑那天起算'}
          </Text>
        </XStack>
      </YStack>

      {/* Frequent Locations */}
      <YStack gap="$2">
        <XStack alignItems="center">
          <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textSubtle}>
            平常出沒的地方
          </Text>
          <Text fontSize={12} color={COLORS.text.muted}>
            {' '}(可多選)
          </Text>
        </XStack>
        <XStack flexWrap="wrap" gap="$2">
          {frequentLocations.map((location, index) => (
            <XStack
              key={index}
              alignItems="center"
              gap="$1"
              paddingHorizontal="$3"
              paddingVertical="$1.5"
              backgroundColor={COLORS.background.subtle}
              borderRadius="$6"
            >
              <Text fontSize={14} color={SEMANTIC_COLORS.textMain}>
                {location}
              </Text>
              <Pressable onPress={() => removeLocation(index)}>
                <X size={14} color={COLORS.text.muted} />
              </Pressable>
            </XStack>
          ))}
          <XStack alignItems="center" gap="$1">
            <TextInput
              value={newLocation}
              onChangeText={setNewLocation}
              onSubmitEditing={addLocation}
              placeholder="輸入後按確認"
              placeholderTextColor={COLORS.text.placeholder}
              style={{
                width: 120,
                paddingHorizontal: 12,
                paddingVertical: 6,
                fontSize: 14,
                backgroundColor: 'white',
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: COLORS.border.default,
                borderRadius: 16,
                color: SEMANTIC_COLORS.textMain,
              }}
            />
            <Pressable
              onPress={addLocation}
              style={{
                padding: 6,
                borderRadius: 16,
              }}
            >
              <Plus size={16} color={COLORS.text.muted} />
            </Pressable>
          </XStack>
        </XStack>
        <Text fontSize={12} color={COLORS.text.muted}>
          岩館、戶外岩場都可以加
        </Text>
      </YStack>

      {/* Favorite Route Types */}
      <YStack gap="$4">
        <XStack alignItems="center">
          <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textSubtle}>
            喜歡的路線型態
          </Text>
          <Text fontSize={12} color={COLORS.text.muted}>
            {' '}(可多選)
          </Text>
        </XStack>
        {routeTypeGroups.map((group) => (
          <YStack key={group.category} gap="$2">
            <Text fontSize={12} color={COLORS.text.muted}>
              {group.category}
            </Text>
            <XStack flexWrap="wrap" gap="$2">
              {group.options.map((option) => {
                const isSelected = favoriteRouteTypes.includes(option.value)
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => toggleRouteType(option.value)}
                    style={({ pressed }) => ({
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: isSelected ? COLORS.brand.dark : COLORS.border.default,
                      backgroundColor: isSelected
                        ? COLORS.brand.dark
                        : pressed
                          ? COLORS.background.subtle
                          : 'white',
                    })}
                  >
                    <Text
                      fontSize={14}
                      color={isSelected ? 'white' : SEMANTIC_COLORS.textSubtle}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                )
              })}
            </XStack>
          </YStack>
        ))}
      </YStack>

      {/* Divider */}
      <View
        style={{
          height: 1,
          backgroundColor: COLORS.background.muted,
          marginVertical: 8,
        }}
      />

      {/* Social Links Header */}
      <XStack alignItems="center" gap="$2">
        <Link size={18} color={SEMANTIC_COLORS.textSubtle} />
        <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textMain}>
          社群連結
        </Text>
      </XStack>
      <Text fontSize={14} color={COLORS.text.muted}>
        新增你的社群帳號，讓其他岩友可以追蹤你的動態
      </Text>

      {/* Instagram */}
      <YStack gap="$2">
        <XStack alignItems="center" gap="$2">
          <Instagram size={16} color="#E1306C" />
          <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textSubtle}>
            Instagram
          </Text>
          <Text fontSize={12} color={COLORS.text.muted}>
            (選填)
          </Text>
        </XStack>
        <XStack alignItems="center" gap="$2">
          <Text fontSize={14} color={COLORS.text.muted}>
            @
          </Text>
          <TextInput
            value={socialLinks.instagram || ''}
            onChangeText={(text) => handleSocialLinkChange('instagram', text)}
            placeholder="your_username"
            placeholderTextColor={COLORS.text.placeholder}
            maxLength={50}
            style={{
              flex: 1,
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: 'white',
              borderWidth: 1,
              borderColor: COLORS.border.default,
              borderRadius: 12,
              color: SEMANTIC_COLORS.textMain,
              fontSize: 14,
            }}
          />
        </XStack>
      </YStack>

      {/* YouTube */}
      <YStack gap="$2">
        <XStack alignItems="center" gap="$2">
          <Youtube size={16} color="#FF0000" />
          <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textSubtle}>
            YouTube 頻道
          </Text>
          <Text fontSize={12} color={COLORS.text.muted}>
            (選填)
          </Text>
        </XStack>
        <TextInput
          value={socialLinks.youtube || ''}
          onChangeText={(text) => handleSocialLinkChange('youtube', text)}
          placeholder="頻道 ID 或網址"
          placeholderTextColor={COLORS.text.placeholder}
          maxLength={100}
          style={{
            width: '100%',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: COLORS.border.default,
            borderRadius: 12,
            color: SEMANTIC_COLORS.textMain,
            fontSize: 14,
          }}
        />
      </YStack>

      {/* Website */}
      <YStack gap="$2">
        <XStack alignItems="center" gap="$2">
          <Link size={16} color={SEMANTIC_COLORS.textSubtle} />
          <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textSubtle}>
            個人網站
          </Text>
          <Text fontSize={12} color={COLORS.text.muted}>
            (選填)
          </Text>
        </XStack>
        <TextInput
          value={socialLinks.website || ''}
          onChangeText={(text) => handleSocialLinkChange('website', text)}
          placeholder="https://your-website.com"
          placeholderTextColor={COLORS.text.placeholder}
          maxLength={200}
          keyboardType="url"
          style={{
            width: '100%',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: COLORS.border.default,
            borderRadius: 12,
            color: SEMANTIC_COLORS.textMain,
            fontSize: 14,
          }}
        />
      </YStack>
    </YStack>
  )
}

export default BasicInfoSection
