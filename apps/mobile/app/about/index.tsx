/**
 * 關於頁面
 *
 * 對應 apps/web/src/app/about/page.tsx
 */
import React from 'react'
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  Dimensions,
  Image as RNImage,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import {
  ChevronLeft,
  MountainSnow,
  Users,
  BookOpen,
  MapPin,
  Video,
  Camera,
  FileText,
  Building2,
  type LucideIcon,
} from 'lucide-react-native'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'

import { Text, Button, IconButton, Skeleton } from '@/components/ui'
import {
  SEMANTIC_COLORS,
  SPACING,
  BRAND_YELLOW,
  WB_COLORS,
} from '@nobodyclimb/constants'
import { useAboutStats } from '@/lib/hooks/useAboutStats'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

// 語意化間距別名（數字 key 映射）
const GAP = {
  xs: SPACING[2],   // 8
  sm: SPACING[3],   // 12
  md: SPACING[4],   // 16
  lg: SPACING[5],   // 20
  xl: SPACING[6],   // 24
  xxl: SPACING[8],  // 32
}

// ============================================
// Hero Section
// ============================================
function HeroSection() {
  return (
    <View style={styles.heroContainer}>
      {/* 背景漸層 */}
      <View style={styles.heroBackground} />

      {/* 內容 */}
      <View style={styles.heroContent}>
        <Animated.View entering={FadeInDown.duration(600)}>
          <Image
            source={require('../../assets/logo/nobodyclimb-white.png')}
            style={styles.heroLogo}
            contentFit="contain"
          />
        </Animated.View>

        <Animated.View
          entering={FadeIn.duration(400).delay(300)}
          style={styles.heroAccentLine}
        />

        <Animated.View entering={FadeInDown.duration(600).delay(400)}>
          <Text style={styles.heroTagline}>
            每個 Nobody 都有屬於自己的攀岩故事
          </Text>
        </Animated.View>
      </View>
    </View>
  )
}

// ============================================
// Story Section
// ============================================
function StorySection() {
  return (
    <View style={styles.sectionWhite}>
      <View style={styles.storyGrid}>
        {/* 文字內容 */}
        <Animated.View
          entering={FadeInDown.duration(600).delay(100)}
          style={styles.storyContent}
        >
          <Text variant="h2" style={styles.sectionTitle}>
            故事起源
          </Text>
          <View style={styles.titleUnderline} />

          <View style={styles.storyTextContainer}>
            <Text style={styles.storyHighlight}>
              「小人物攀岩」緣起於一個 Nobody 對攀岩的熱愛。
            </Text>
            <Text style={styles.storyText}>
              在攀岩的路上，我們都是小人物。不論你是剛踏入岩館的新手，還是征戰各大岩場的老手，每個人都有屬於自己的故事、自己的掙扎、自己的突破。
            </Text>
            <Text style={styles.storyText}>
              我們希望打造一個平台，讓每位攀岩愛好者都能找到資訊、分享故事、建立連結。因為在這裡，每個 Nobody 都值得被看見。
            </Text>
          </View>
        </Animated.View>

        {/* Logo 區塊 */}
        <Animated.View
          entering={FadeIn.duration(600).delay(200)}
          style={styles.storyLogoContainer}
        >
          <Image
            source={require('../../assets/logo/logo512.png')}
            style={styles.storyLogo}
            contentFit="contain"
          />
        </Animated.View>
      </View>
    </View>
  )
}

// ============================================
// Mission Section
// ============================================
interface MissionItem {
  icon: LucideIcon
  title: string
  description: string
  color: string
}

const MISSIONS: MissionItem[] = [
  {
    icon: MountainSnow,
    title: '推廣攀岩',
    description:
      '降低入門門檻，提供完整的岩場資訊與攻略，讓更多人認識並愛上攀岩運動。',
    color: BRAND_YELLOW[100],
  },
  {
    icon: Users,
    title: '建立社群',
    description:
      '連結台灣各地的攀岩愛好者，創造交流與分享的空間，一起成長進步。',
    color: BRAND_YELLOW[200],
  },
  {
    icon: BookOpen,
    title: '記錄故事',
    description:
      '透過人物誌與部落格，記錄每位攀岩者的珍貴回憶與獨特經歷。',
    color: '#DA3737',
  },
]

function MissionSection() {
  return (
    <View style={styles.sectionGray}>
      <Animated.View
        entering={FadeInDown.duration(500)}
        style={styles.sectionHeader}
      >
        <Text variant="h2" style={styles.sectionTitle}>
          我們的使命
        </Text>
        <View style={[styles.titleUnderline, styles.titleUnderlineAccent]} />
      </Animated.View>

      <View style={styles.missionsGrid}>
        {MISSIONS.map((mission, index) => {
          const IconComponent = mission.icon
          return (
            <Animated.View
              key={mission.title}
              entering={FadeInDown.duration(500).delay(index * 100)}
              style={styles.missionCard}
            >
              <View
                style={[styles.missionIconContainer, { backgroundColor: mission.color }]}
              >
                <IconComponent size={32} color={SEMANTIC_COLORS.textMain} />
              </View>
              <Text variant="h4" style={styles.missionTitle}>
                {mission.title}
              </Text>
              <Text style={styles.missionDescription}>{mission.description}</Text>
            </Animated.View>
          )
        })}
      </View>
    </View>
  )
}

// ============================================
// Features Section
// ============================================
interface FeatureItem {
  icon: LucideIcon
  title: string
  description: string
  href: string
}

const FEATURES: FeatureItem[] = [
  {
    icon: MapPin,
    title: '岩場探索',
    description: '台灣各地天然岩場的完整資訊與路線資料',
    href: '/crag',
  },
  {
    icon: Users,
    title: '人物誌',
    description: '記錄攀岩者們的故事與心路歷程',
    href: '/biography',
  },
  {
    icon: Video,
    title: '攀岩影片',
    description: '精選攀岩教學與紀錄影片',
    href: '/videos',
  },
  {
    icon: Camera,
    title: '攝影集',
    description: '捕捉攀岩的精彩瞬間',
    href: '/gallery',
  },
  {
    icon: FileText,
    title: '部落格',
    description: '攀岩知識、心得與攻略分享',
    href: '/blog',
  },
  {
    icon: Building2,
    title: '岩館資訊',
    description: '全台室內攀岩館完整指南',
    href: '/gym',
  },
]

function FeaturesSection() {
  const router = useRouter()

  return (
    <View style={styles.sectionWhite}>
      <Animated.View
        entering={FadeInDown.duration(500)}
        style={styles.sectionHeader}
      >
        <Text variant="h2" style={styles.sectionTitle}>
          平台功能
        </Text>
        <View style={styles.titleUnderline} />
        <Text style={styles.sectionSubtitle}>
          從入門到進階，提供你攀岩旅程所需的一切資源
        </Text>
      </Animated.View>

      <View style={styles.featuresGrid}>
        {FEATURES.map((feature, index) => {
          const IconComponent = feature.icon
          return (
            <Animated.View
              key={feature.title}
              entering={FadeInDown.duration(500).delay(index * 80)}
            >
              <Pressable
                style={({ pressed }) => [
                  styles.featureCard,
                  pressed && styles.featureCardPressed,
                ]}
                onPress={() => router.push(feature.href as any)}
              >
                <View style={styles.featureIconContainer}>
                  <IconComponent size={24} color={SEMANTIC_COLORS.textMain} />
                </View>
                <View style={styles.featureContent}>
                  <Text fontWeight="600" style={styles.featureTitle}>
                    {feature.title}
                  </Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </Pressable>
            </Animated.View>
          )
        })}
      </View>
    </View>
  )
}

// ============================================
// Stats Section
// ============================================
interface StatsConfig {
  key: 'totalGyms' | 'totalCrags' | 'totalBiographies' | 'totalArticles' | 'totalVideos'
  label: string
  suffix: string
  fallback: number
}

const STATS_CONFIG: StatsConfig[] = [
  { key: 'totalGyms', label: '間岩館', suffix: '+', fallback: 120 },
  { key: 'totalCrags', label: '個岩場', suffix: '+', fallback: 45 },
  { key: 'totalBiographies', label: '篇人物誌', suffix: '+', fallback: 150 },
  { key: 'totalArticles', label: '篇文章', suffix: '+', fallback: 350 },
  { key: 'totalVideos', label: '部影片', suffix: '+', fallback: 800 },
]

function StatsSkeleton() {
  return (
    <View style={styles.statItem}>
      <Skeleton width={80} height={48} style={styles.statSkeleton} />
      <Skeleton width={60} height={20} style={{ marginTop: GAP.xs }} />
    </View>
  )
}

function StatsSection() {
  const { stats, isLoading } = useAboutStats()

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statsGrid}>
        {STATS_CONFIG.map((item, index) => (
          <Animated.View
            key={item.key}
            entering={FadeInDown.duration(500).delay(index * 50)}
            style={styles.statItem}
          >
            {isLoading ? (
              <StatsSkeleton />
            ) : (
              <>
                <Text style={styles.statNumber}>
                  {(stats as any)?.[item.key] ?? item.fallback}
                  <Text style={styles.statSuffix}>{item.suffix}</Text>
                </Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </>
            )}
          </Animated.View>
        ))}
      </View>
    </View>
  )
}

// ============================================
// CTA Section
// ============================================
function CTASection() {
  const router = useRouter()

  return (
    <View style={styles.sectionGray}>
      <Animated.View
        entering={FadeInDown.duration(500)}
        style={styles.ctaContent}
      >
        <Image
          source={require('../../assets/logo/nobodyclimb-black.png')}
          style={styles.ctaLogo}
          contentFit="contain"
        />

        <Text variant="h2" style={styles.ctaTitle}>
          成為小人物的一份子
        </Text>
        <View style={styles.titleUnderline} />
        <Text style={styles.ctaDescription}>
          加入我們的社群，和其他攀岩愛好者一起分享、學習、成長
        </Text>

        <Button
          variant="primary"
          size="lg"
          style={styles.ctaButton}
          onPress={() => router.push('/auth/register')}
        >
          立即加入
        </Button>
      </Animated.View>
    </View>
  )
}

// ============================================
// Main Page
// ============================================
export default function AboutScreen() {
  const router = useRouter()

  const handleBack = () => {
    router.back()
  }

  return (
    <View style={styles.container}>
      {/* 標題區 */}
      <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
        <View style={styles.header}>
          <IconButton
            icon={<ChevronLeft size={24} color={SEMANTIC_COLORS.textMain} />}
            onPress={handleBack}
            variant="ghost"
          />
          <Text variant="h3" fontWeight="600">
            關於小人物
          </Text>
          <View style={styles.placeholder} />
        </View>
      </SafeAreaView>

      {/* 內容 */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <HeroSection />
        <StorySection />
        <MissionSection />
        <FeaturesSection />
        <StatsSection />
        <CTASection />

        {/* Footer spacing */}
        <SafeAreaView edges={['bottom']}>
          <View style={styles.footerSpacing} />
        </SafeAreaView>
      </ScrollView>
    </View>
  )
}

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SEMANTIC_COLORS.pageBg,
  },
  headerSafeArea: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GAP.sm,
    paddingVertical: GAP.xs,
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

  // Hero
  heroContainer: {
    height: 300,
    position: 'relative',
  },
  heroBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: WB_COLORS[100],
  },
  heroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: GAP.lg,
  },
  heroLogo: {
    width: 220,
    height: 60,
  },
  heroAccentLine: {
    width: 64,
    height: 4,
    backgroundColor: BRAND_YELLOW[100],
    marginVertical: GAP.lg,
    borderRadius: 2,
  },
  heroTagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },

  // Section Base
  sectionWhite: {
    backgroundColor: WB_COLORS[0],
    paddingVertical: GAP.xl,
    paddingHorizontal: GAP.md,
  },
  sectionGray: {
    backgroundColor: WB_COLORS[10],
    paddingVertical: GAP.xl,
    paddingHorizontal: GAP.md,
  },
  sectionHeader: {
    alignItems: 'center',
    marginBottom: GAP.lg,
  },
  sectionTitle: {
    color: SEMANTIC_COLORS.textMain,
    textAlign: 'center',
  },
  titleUnderline: {
    width: 48,
    height: 4,
    backgroundColor: SEMANTIC_COLORS.textMain,
    marginTop: GAP.sm,
    borderRadius: 2,
  },
  titleUnderlineAccent: {
    backgroundColor: BRAND_YELLOW[100],
  },
  sectionSubtitle: {
    color: WB_COLORS[70],
    textAlign: 'center',
    marginTop: GAP.sm,
    paddingHorizontal: GAP.lg,
  },

  // Story
  storyGrid: {
    gap: GAP.lg,
  },
  storyContent: {},
  storyTextContainer: {
    gap: GAP.md,
    marginTop: GAP.md,
  },
  storyHighlight: {
    fontSize: 18,
    lineHeight: 28,
    color: WB_COLORS[90],
  },
  storyText: {
    fontSize: 14,
    lineHeight: 24,
    color: WB_COLORS[90],
  },
  storyLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: GAP.lg,
  },
  storyLogo: {
    width: 160,
    height: 160,
  },

  // Mission
  missionsGrid: {
    gap: GAP.md,
  },
  missionCard: {
    backgroundColor: WB_COLORS[0],
    borderRadius: 12,
    padding: GAP.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  missionIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: GAP.sm,
  },
  missionTitle: {
    color: SEMANTIC_COLORS.textMain,
    marginBottom: GAP.xs,
    textAlign: 'center',
  },
  missionDescription: {
    color: WB_COLORS[70],
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
  },

  // Features
  featuresGrid: {
    gap: GAP.sm,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: WB_COLORS[0],
    borderRadius: 12,
    padding: GAP.md,
    borderWidth: 1,
    borderColor: WB_COLORS[20],
  },
  featureCardPressed: {
    borderColor: BRAND_YELLOW[100],
    backgroundColor: WB_COLORS[10],
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: WB_COLORS[10],
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: GAP.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: SEMANTIC_COLORS.textMain,
    marginBottom: 4,
  },
  featureDescription: {
    color: WB_COLORS[70],
    fontSize: 14,
  },

  // Stats
  statsContainer: {
    backgroundColor: BRAND_YELLOW[100],
    paddingVertical: GAP.xl,
    paddingHorizontal: GAP.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: (SCREEN_WIDTH - GAP.md * 2 - GAP.md) / 2,
    alignItems: 'center',
    marginBottom: GAP.lg,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: SEMANTIC_COLORS.textMain,
  },
  statSuffix: {
    fontSize: 24,
  },
  statLabel: {
    color: 'rgba(27, 26, 26, 0.8)',
    marginTop: GAP.xs,
  },
  statSkeleton: {
    borderRadius: 4,
  },

  // CTA
  ctaContent: {
    alignItems: 'center',
  },
  ctaLogo: {
    width: 220,
    height: 60,
    marginBottom: GAP.lg,
  },
  ctaTitle: {
    color: SEMANTIC_COLORS.textMain,
    textAlign: 'center',
  },
  ctaDescription: {
    color: WB_COLORS[70],
    textAlign: 'center',
    marginTop: GAP.sm,
    marginBottom: GAP.lg,
    paddingHorizontal: GAP.md,
  },
  ctaButton: {
    paddingHorizontal: GAP.xl,
  },

  // Footer
  footerSpacing: {
    height: GAP.xl,
  },
})
