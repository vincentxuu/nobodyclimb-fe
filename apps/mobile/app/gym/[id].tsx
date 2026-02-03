/**
 * 岩館詳情頁面
 *
 * 對應 apps/web/src/app/gym/[id]/GymDetailClient.tsx
 *
 * 功能：
 * - 封面展示區
 * - 基本資訊（名稱、類型、評分、設施）
 * - 場地介紹
 * - 收費方式（入場費、裝備租借）
 * - 交通方式（地址、大眾運輸、停車）
 * - 營業時間
 * - 聯絡資訊（電話、社群平台）
 * - 開箱介紹連結
 * - 相關岩館推薦
 * - 上一篇/下一篇導航
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Share,
  Linking,
  Pressable,
} from 'react-native'
import { useLocalSearchParams, useRouter, Link } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import {
  ChevronLeft,
  ChevronRight,
  Share2,
  MapPin,
  Clock,
  Phone,
  Globe,
  Star,
  Navigation,
  ExternalLink,
  Facebook,
  Instagram,
  Youtube,
  MessageCircle,
  Train,
  Bus,
  ParkingCircle,
  TramFront,
} from 'lucide-react-native'

import { Text, IconButton, Button, Card } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, RADIUS, COLORS } from '@nobodyclimb/constants'
import {
  getGymById,
  getAdjacentGyms,
  getRelatedGyms,
  type GymDetailData,
  type GymListItem,
  type GymPricing,
} from '@/lib/gym-data'

// ============ 封面產生器組件 ============

interface GymCoverProps {
  type: 'bouldering' | 'lead' | 'mixed'
  name: string
  typeLabel: string
}

function GymCoverLarge({ type, name, typeLabel }: GymCoverProps) {
  const gradientColors = useMemo(() => {
    switch (type) {
      case 'bouldering':
        return ['#7DD3FC', '#38BDF8', '#0284C7'] as const
      case 'lead':
        return ['#6EE7B7', '#10B981', '#047857'] as const
      case 'mixed':
        return ['#A5B4FC', '#6366F1', '#4338CA'] as const
      default:
        return ['#D4D4D8', '#A1A1AA', '#71717A'] as const
    }
  }, [type])

  return (
    <LinearGradient colors={gradientColors} style={styles.coverGradient}>
      <View style={styles.coverOverlay}>
        <Text
          variant="h2"
          fontWeight="700"
          numberOfLines={2}
          style={styles.coverTitle}
        >
          {name}
        </Text>
        <View style={styles.coverBadge}>
          <Text variant="small" fontWeight="500" style={styles.coverBadgeText}>
            {typeLabel}
          </Text>
        </View>
      </View>
    </LinearGradient>
  )
}

// ============ 開箱介紹類型對應的配置 ============

const reviewTypeConfig = {
  facebook: {
    icon: (size: number) => <Facebook size={size} color="#1877F2" />,
    label: 'Facebook 貼文',
    color: '#1877F2',
  },
  instagram: {
    icon: (size: number) => <Instagram size={size} color="#E4405F" />,
    label: 'Instagram 貼文',
    color: '#E4405F',
  },
  youtube: {
    icon: (size: number) => <Youtube size={size} color="#FF0000" />,
    label: 'YouTube 影片',
    color: '#FF0000',
  },
} as const

// ============ Section 標題組件 ============

interface SectionHeaderProps {
  title: string
}

function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text variant="body" fontWeight="600" style={styles.sectionTitle}>
        {title}
      </Text>
      <View style={styles.sectionDivider} />
    </View>
  )
}

// ============ 相關岩館卡片組件 ============

interface RelatedGymCardProps {
  gym: GymListItem
  onPress: () => void
}

function RelatedGymCard({ gym, onPress }: RelatedGymCardProps) {
  const bgColor = useMemo(() => {
    switch (gym.type) {
      case 'bouldering':
        return '#7DD3FC'
      case 'lead':
        return '#6EE7B7'
      case 'mixed':
        return '#A5B4FC'
      default:
        return '#D4D4D8'
    }
  }, [gym.type])

  return (
    <Pressable onPress={onPress} style={styles.relatedCard}>
      <View style={[styles.relatedCardImage, { backgroundColor: bgColor }]}>
        <Text variant="small" fontWeight="600" style={styles.relatedCardName}>
          {gym.name}
        </Text>
        <View style={styles.relatedCardBadge}>
          <Text style={styles.relatedCardBadgeText}>{gym.typeLabel}</Text>
        </View>
      </View>
      <View style={styles.relatedCardContent}>
        <Text variant="body" fontWeight="500" numberOfLines={1}>
          {gym.name}
        </Text>
        {gym.nameEn && gym.nameEn !== gym.name && (
          <Text variant="small" color="textMuted" numberOfLines={1}>
            {gym.nameEn}
          </Text>
        )}
        <View style={styles.relatedCardLocation}>
          <MapPin size={12} color={SEMANTIC_COLORS.textMuted} />
          <Text variant="small" color="textMuted">
            {gym.location}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

// ============ 主頁面組件 ============

export default function GymDetailScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const [gym, setGym] = useState<GymDetailData | null>(null)
  const [adjacentGyms, setAdjacentGyms] = useState<{
    prev: GymListItem | null
    next: GymListItem | null
  }>({ prev: null, next: null })
  const [relatedGyms, setRelatedGyms] = useState<GymListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 載入資料
  const loadGym = useCallback(async () => {
    if (!id) return

    try {
      setError(null)
      const gymData = await getGymById(id)
      const adjacent = await getAdjacentGyms(id)
      const related = await getRelatedGyms(id, 3)

      if (!gymData) {
        setError('找不到這間岩館')
        return
      }

      setGym(gymData)
      setAdjacentGyms(adjacent)
      setRelatedGyms(related)
    } catch (err) {
      console.error('Error fetching gym data:', err)
      setError('無法載入岩館資料，請稍後再試')
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }, [id])

  useEffect(() => {
    setIsLoading(true)
    loadGym()
  }, [loadGym])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadGym()
  }, [loadGym])

  const handleBack = () => {
    router.back()
  }

  const handleShare = async () => {
    if (!gym) return
    try {
      await Share.share({
        title: `${gym.name} - NobodyClimb`,
        message: `來看看 ${gym.name}！\nhttps://nobodyclimb.cc/gym/${gym.id}`,
      })
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  const handleNavigate = () => {
    if (!gym?.location.address) return
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(gym.location.address)}`
    Linking.openURL(url)
  }

  const handleCall = () => {
    if (!gym?.contact.phone) return
    Linking.openURL(`tel:${gym.contact.phone}`)
  }

  const handleWebsite = () => {
    if (!gym?.contact.website) return
    Linking.openURL(gym.contact.website)
  }

  const handleOpenLink = (url: string) => {
    Linking.openURL(url)
  }

  const handleGymPress = (gymId: string) => {
    router.push(`/gym/${gymId}` as any)
  }

  // 格式化營業時間顯示
  const formatOpeningHours = (hours: GymDetailData['openingHours']) => {
    const days = [
      { key: 'monday', label: '週一' },
      { key: 'tuesday', label: '週二' },
      { key: 'wednesday', label: '週三' },
      { key: 'thursday', label: '週四' },
      { key: 'friday', label: '週五' },
      { key: 'saturday', label: '週六' },
      { key: 'sunday', label: '週日' },
      { key: 'holiday', label: '國定假日' },
    ]

    return days.map((day) => ({
      label: day.label,
      time: hours[day.key as keyof typeof hours] || '休息',
    }))
  }

  // 格式化價格顯示
  const formatPricing = (pricing: GymPricing) => {
    const items: { label: string; price: string }[] = []

    if (pricing.singleEntry) {
      items.push({ label: '平日', price: `$${pricing.singleEntry.weekday}` })
      items.push({ label: '假日', price: `$${pricing.singleEntry.weekend}` })
      if (pricing.singleEntry.twilight) {
        items.push({ label: '星光票', price: `$${pricing.singleEntry.twilight}` })
      }
      if (pricing.singleEntry.student) {
        items.push({ label: '學生票', price: `$${pricing.singleEntry.student}` })
      }
    }

    return items
  }

  // 格式化租借價格
  const formatRental = (rental: GymPricing['rental']) => {
    const items: { label: string; price: string }[] = []
    items.push({ label: '岩鞋租借', price: `$${rental.shoes}` })
    items.push({ label: '粉袋租借', price: `$${rental.chalkBag}` })
    if (rental.harness) {
      items.push({ label: '吊帶租借', price: `$${rental.harness}` })
    }
    return items
  }

  // 載入中狀態
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SEMANTIC_COLORS.textMain} />
          <Text color="textSubtle" style={styles.loadingText}>
            載入中...
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  // 錯誤狀態
  if (error || !gym) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
        </View>
        <View style={styles.errorContainer}>
          <Text color="textSubtle">{error || '找不到這間岩館'}</Text>
          <Button variant="secondary" size="md" onPress={() => router.push('/gym' as any)}>
            返回岩館列表
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 導航列 */}
      <View style={styles.header}>
        <IconButton
          icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleBack}
          variant="ghost"
        />
        <IconButton
          icon={<Share2 size={20} color={SEMANTIC_COLORS.textMain} />}
          onPress={handleShare}
          variant="ghost"
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 封面展示區 */}
        <View style={styles.coverContainer}>
          <GymCoverLarge
            type={gym.type}
            name={gym.name}
            typeLabel={gym.typeLabel}
          />
        </View>

        {/* 標題和基本資訊 */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <View style={styles.titleContent}>
              <Text variant="h3" fontWeight="700">
                {gym.name}
              </Text>
              {gym.nameEn && gym.nameEn !== gym.name && (
                <Text variant="body" color="textMuted">
                  {gym.nameEn}
                </Text>
              )}
            </View>
            <View style={styles.typeBadge}>
              <Text variant="small" style={styles.typeBadgeText}>
                {gym.typeLabel}
              </Text>
            </View>
          </View>

          {/* 評分和設施 */}
          <View style={styles.metaRow}>
            {gym.rating > 0 && (
              <View style={styles.ratingRow}>
                <Star size={16} color="#FFE70C" fill="#FFE70C" />
                <Text variant="body" fontWeight="500">
                  {gym.rating.toFixed(1)}
                </Text>
              </View>
            )}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.facilitiesScroll}
              contentContainerStyle={styles.facilitiesContent}
            >
              {gym.facilities.slice(0, 5).map((facility, index) => (
                <View key={index} style={styles.facilityTag}>
                  <Text variant="small" color="textSubtle">
                    {facility}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* 快速操作 */}
        <View style={styles.quickActions}>
          <Button
            variant="primary"
            size="md"
            onPress={handleNavigate}
            style={styles.actionButton}
          >
            <Navigation size={16} color="#FFFFFF" />
            <Text fontWeight="600" style={styles.actionButtonText}>
              導航
            </Text>
          </Button>
          {gym.contact.phone && (
            <Button
              variant="secondary"
              size="md"
              onPress={handleCall}
              style={styles.actionButton}
            >
              <Phone size={16} color={SEMANTIC_COLORS.textMain} />
              <Text fontWeight="600">電話</Text>
            </Button>
          )}
          {gym.contact.website && (
            <Button
              variant="secondary"
              size="md"
              onPress={handleWebsite}
              style={styles.actionButton}
            >
              <Globe size={16} color={SEMANTIC_COLORS.textMain} />
              <Text fontWeight="600">官網</Text>
            </Button>
          )}
        </View>

        {/* 場地介紹 */}
        <Card style={styles.section}>
          <SectionHeader title="場地介紹" />
          <Text variant="body" color="textSubtle" style={styles.description}>
            {gym.description}
          </Text>
        </Card>

        {/* 收費方式 */}
        <Card style={styles.section}>
          <SectionHeader title="收費方式" />

          <Text variant="body" fontWeight="600" style={styles.subSectionTitle}>
            入場費
          </Text>
          <View style={styles.priceGrid}>
            {formatPricing(gym.pricing).map((item, index) => (
              <View key={index} style={styles.priceItem}>
                <Text variant="small" color="textSubtle">
                  {item.label}
                </Text>
                <Text variant="body" fontWeight="500">
                  {item.price}
                </Text>
              </View>
            ))}
          </View>
          {gym.pricing.notes && (
            <Text variant="small" color="textMuted" style={styles.priceNotes}>
              {gym.pricing.notes}
            </Text>
          )}

          <Text variant="body" fontWeight="600" style={styles.subSectionTitle}>
            裝備租借
          </Text>
          <View style={styles.priceGrid}>
            {formatRental(gym.pricing.rental).map((item, index) => (
              <View key={index} style={styles.priceItem}>
                <Text variant="small" color="textSubtle">
                  {item.label}
                </Text>
                <Text variant="body" fontWeight="500">
                  {item.price}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* 交通方式 */}
        <Card style={styles.section}>
          <SectionHeader title="交通方式" />

          <Pressable onPress={handleNavigate} style={styles.addressRow}>
            <MapPin size={16} color={SEMANTIC_COLORS.textSubtle} />
            <Text variant="body" style={styles.addressText}>
              {gym.location.address}
            </Text>
            <ExternalLink size={14} color={COLORS.brand.primary} />
          </Pressable>

          <View style={styles.transportList}>
            {gym.transportation.mrt && (
              <View style={styles.transportItem}>
                <TramFront size={16} color={SEMANTIC_COLORS.textSubtle} />
                <Text variant="body" color="textSubtle" style={styles.transportText}>
                  {gym.transportation.mrt}
                </Text>
              </View>
            )}
            {gym.transportation.train && (
              <View style={styles.transportItem}>
                <Train size={16} color={SEMANTIC_COLORS.textSubtle} />
                <Text variant="body" color="textSubtle" style={styles.transportText}>
                  {gym.transportation.train}
                </Text>
              </View>
            )}
            {gym.transportation.bus && (
              <View style={styles.transportItem}>
                <Bus size={16} color={SEMANTIC_COLORS.textSubtle} />
                <Text variant="body" color="textSubtle" style={styles.transportText}>
                  {gym.transportation.bus}
                </Text>
              </View>
            )}
            {gym.transportation.parking && (
              <View style={styles.transportItem}>
                <ParkingCircle size={16} color={SEMANTIC_COLORS.textSubtle} />
                <Text variant="body" color="textSubtle" style={styles.transportText}>
                  {gym.transportation.parking}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* 營業時間 */}
        <Card style={styles.section}>
          <SectionHeader title="營業時間" />
          <View style={styles.hoursGrid}>
            {formatOpeningHours(gym.openingHours).map((day, index) => (
              <View key={index} style={styles.hoursRow}>
                <Text variant="body" color="textSubtle">
                  {day.label}
                </Text>
                <Text
                  variant="body"
                  fontWeight="500"
                  style={
                    day.time === '公休' || day.time === '休息'
                      ? styles.closedText
                      : undefined
                  }
                >
                  {day.time}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* 聯絡資訊 */}
        <Card style={styles.section}>
          <SectionHeader title="聯絡資訊" />
          <View style={styles.contactList}>
            {gym.contact.phone && (
              <Pressable onPress={handleCall} style={styles.contactItem}>
                <Phone size={16} color={SEMANTIC_COLORS.textSubtle} />
                <Text variant="body" style={styles.contactLink}>
                  {gym.contact.phone}
                </Text>
              </Pressable>
            )}
            {gym.contact.facebook && (
              <Pressable
                onPress={() =>
                  gym.contact.facebookUrl && handleOpenLink(gym.contact.facebookUrl)
                }
                style={styles.contactItem}
                disabled={!gym.contact.facebookUrl}
              >
                <Facebook size={16} color={SEMANTIC_COLORS.textSubtle} />
                <Text
                  variant="body"
                  style={gym.contact.facebookUrl ? styles.contactLink : undefined}
                  color={gym.contact.facebookUrl ? undefined : 'textSubtle'}
                >
                  {gym.contact.facebook}
                </Text>
              </Pressable>
            )}
            {gym.contact.instagram && (
              <Pressable
                onPress={() =>
                  gym.contact.instagramUrl && handleOpenLink(gym.contact.instagramUrl)
                }
                style={styles.contactItem}
                disabled={!gym.contact.instagramUrl}
              >
                <Instagram size={16} color={SEMANTIC_COLORS.textSubtle} />
                <Text
                  variant="body"
                  style={gym.contact.instagramUrl ? styles.contactLink : undefined}
                  color={gym.contact.instagramUrl ? undefined : 'textSubtle'}
                >
                  @{gym.contact.instagram}
                </Text>
              </Pressable>
            )}
            {gym.contact.youtube && (
              <Pressable
                onPress={() => handleOpenLink(gym.contact.youtube!)}
                style={styles.contactItem}
              >
                <Youtube size={16} color={SEMANTIC_COLORS.textSubtle} />
                <Text variant="body" style={styles.contactLink}>
                  YouTube 影片介紹
                </Text>
              </Pressable>
            )}
            {gym.contact.website && (
              <Pressable onPress={handleWebsite} style={styles.contactItem}>
                <ExternalLink size={16} color={SEMANTIC_COLORS.textSubtle} />
                <Text variant="body" style={styles.contactLink}>
                  官方網站
                </Text>
              </Pressable>
            )}
            {gym.contact.line && (
              <View style={styles.contactItem}>
                <MessageCircle size={16} color={SEMANTIC_COLORS.textSubtle} />
                <Text variant="body" color="textSubtle">
                  LINE: {gym.contact.line}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* 注意事項 */}
        {gym.notes && (
          <Card style={styles.section}>
            <SectionHeader title="注意事項" />
            <Text variant="body" color="textSubtle" style={styles.description}>
              {gym.notes}
            </Text>
          </Card>
        )}

        {/* 開箱介紹 */}
        {gym.unboxingReviews && gym.unboxingReviews.length > 0 && (
          <Card style={styles.section}>
            <SectionHeader title="開箱介紹" />
            <View style={styles.reviewsGrid}>
              {gym.unboxingReviews.map((review, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleOpenLink(review.url)}
                  style={styles.reviewCard}
                >
                  <View style={styles.reviewIconContainer}>
                    {reviewTypeConfig[review.type].icon(20)}
                  </View>
                  <View style={styles.reviewContent}>
                    <Text variant="body" numberOfLines={2}>
                      {review.title}
                    </Text>
                    <Text variant="small" color="textMuted">
                      {reviewTypeConfig[review.type].label}
                    </Text>
                  </View>
                  <ExternalLink size={14} color={SEMANTIC_COLORS.textMuted} />
                </Pressable>
              ))}
            </View>
          </Card>
        )}

        {/* 上一篇/下一篇 */}
        <View style={styles.navigationSection}>
          {adjacentGyms.prev && (
            <Pressable
              onPress={() => handleGymPress(adjacentGyms.prev!.id)}
              style={styles.navCard}
            >
              <View style={styles.navDirection}>
                <ChevronLeft size={16} color={SEMANTIC_COLORS.textMuted} />
                <Text variant="small" color="textMuted">
                  上一篇
                </Text>
              </View>
              <Text variant="body" numberOfLines={1}>
                {adjacentGyms.prev.name}
              </Text>
              <Text variant="small" color="textMuted" numberOfLines={1}>
                {adjacentGyms.prev.location}
              </Text>
            </Pressable>
          )}
          {adjacentGyms.next && (
            <Pressable
              onPress={() => handleGymPress(adjacentGyms.next!.id)}
              style={[styles.navCard, styles.navCardRight]}
            >
              <View style={[styles.navDirection, styles.navDirectionRight]}>
                <Text variant="small" color="textMuted">
                  下一篇
                </Text>
                <ChevronRight size={16} color={SEMANTIC_COLORS.textMuted} />
              </View>
              <Text variant="body" numberOfLines={1} style={styles.textRight}>
                {adjacentGyms.next.name}
              </Text>
              <Text
                variant="small"
                color="textMuted"
                numberOfLines={1}
                style={styles.textRight}
              >
                {adjacentGyms.next.location}
              </Text>
            </Pressable>
          )}
        </View>

        {/* 其他岩館 */}
        {relatedGyms.length > 0 && (
          <View style={styles.relatedSection}>
            <View style={styles.relatedHeader}>
              <Text variant="h4" fontWeight="600">
                其他岩館
              </Text>
              <Pressable onPress={() => router.push('/gym' as any)}>
                <Text variant="body" style={styles.moreLink}>
                  更多岩館
                </Text>
              </Pressable>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedScroll}
            >
              {relatedGyms.map((relatedGym) => (
                <RelatedGymCard
                  key={relatedGym.id}
                  gym={relatedGym}
                  onPress={() => handleGymPress(relatedGym.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
}

// ============ 樣式 ============

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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
  },

  // 封面
  coverContainer: {
    height: 200,
  },
  coverGradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  coverOverlay: {
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  coverTitle: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  coverBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  coverBadgeText: {
    color: '#1B1A1A',
  },

  // 標題區
  titleSection: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  titleContent: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  typeBadge: {
    backgroundColor: '#FFF7ED',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  typeBadgeText: {
    color: '#EA580C',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  facilitiesScroll: {
    flex: 1,
  },
  facilitiesContent: {
    gap: SPACING.xs,
  },
  facilityTag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },

  // 快速操作
  quickActions: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
  },
  actionButtonText: {
    color: '#FFFFFF',
  },

  // Section 通用
  section: {
    margin: SPACING.md,
    marginBottom: 0,
    padding: SPACING.md,
  },
  sectionHeader: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: '#EA580C',
    marginBottom: 4,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
  },
  subSectionTitle: {
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  description: {
    lineHeight: 22,
  },

  // 價格
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  priceItem: {
    width: '45%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  priceNotes: {
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },

  // 交通
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  addressText: {
    flex: 1,
  },
  transportList: {
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  transportItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  transportText: {
    flex: 1,
    lineHeight: 22,
  },

  // 營業時間
  hoursGrid: {
    gap: 4,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  closedText: {
    color: '#EF4444',
  },

  // 聯絡資訊
  contactList: {
    gap: SPACING.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingVertical: 4,
  },
  contactLink: {
    color: '#2563EB',
  },

  // 開箱介紹
  reviewsGrid: {
    gap: SPACING.sm,
  },
  reviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: RADIUS.md,
  },
  reviewIconContainer: {
    width: 32,
    alignItems: 'center',
  },
  reviewContent: {
    flex: 1,
    gap: 2,
  },

  // 導航
  navigationSection: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  navCard: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    gap: 4,
  },
  navCardRight: {
    alignItems: 'flex-end',
  },
  navDirection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  navDirectionRight: {
    flexDirection: 'row-reverse',
  },
  textRight: {
    textAlign: 'right',
  },

  // 相關岩館
  relatedSection: {
    padding: SPACING.md,
  },
  relatedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  moreLink: {
    color: SEMANTIC_COLORS.textSubtle,
    borderBottomWidth: 1,
    borderBottomColor: SEMANTIC_COLORS.textSubtle,
  },
  relatedScroll: {
    gap: SPACING.sm,
  },
  relatedCard: {
    width: 160,
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  relatedCardImage: {
    height: 80,
    justifyContent: 'flex-end',
    padding: SPACING.sm,
  },
  relatedCardName: {
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  relatedCardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginTop: 4,
  },
  relatedCardBadgeText: {
    fontSize: 10,
    color: '#1B1A1A',
  },
  relatedCardContent: {
    padding: SPACING.sm,
  },
  relatedCardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },

  bottomPadding: {
    height: SPACING.xxl,
  },
})
