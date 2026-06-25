/**
 * QuizResultHero
 *
 * 測驗結果頁的 Hero 區塊，含 Lottie 動畫與人格類型名稱
 */

import { FONT_SIZE, FONT_WEIGHT, SPACING } from '@nobodyclimb/constants'
import type { PersonalityType } from '@nobodyclimb/types'
import { LinearGradient } from 'expo-linear-gradient'
import LottieView from 'lottie-react-native'
import { useRef } from 'react'
import { StyleSheet, View } from 'react-native'

import { Text } from '@/components/ui'

// 人格類型對應 Lottie 動畫
const LOTTIE_MAP: Record<string, any> = {
  PGB: require('@/../../assets/quiz/lottie/crusher.json'),
  PGS: require('@/../../assets/quiz/lottie/forger.json'),
  PFB: require('@/../../assets/quiz/lottie/wildfire.json'),
  PFS: require('@/../../assets/quiz/lottie/anchor.json'),
  TGB: require('@/../../assets/quiz/lottie/sniper.json'),
  TGS: require('@/../../assets/quiz/lottie/cipher.json'),
  TFB: require('@/../../assets/quiz/lottie/wanderer.json'),
  TFS: require('@/../../assets/quiz/lottie/zen.json'),
}

interface QuizResultHeroProps {
  /** 人格類型資料 */
  personalityType: PersonalityType
}

export function QuizResultHero({ personalityType }: QuizResultHeroProps) {
  const lottieRef = useRef<LottieView>(null)
  const lottieSource = LOTTIE_MAP[personalityType.code]

  return (
    <LinearGradient colors={[personalityType.color + '20', 'transparent']} style={styles.container}>
      {/* Lottie 動畫或佔位圓形 */}
      <View style={styles.animationContainer}>
        {lottieSource ? (
          <LottieView ref={lottieRef} source={lottieSource} autoPlay loop style={styles.lottie} />
        ) : (
          <View
            style={[styles.placeholderCircle, { backgroundColor: personalityType.color + '30' }]}
          />
        )}
      </View>

      {/* 英文名稱（小型大寫） */}
      <Text
        style={{
          fontSize: FONT_SIZE.sm,
          fontWeight: FONT_WEIGHT.medium,
          color: personalityType.color,
          letterSpacing: 2,
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        {personalityType.nameEn}
      </Text>

      {/* 中文名稱 */}
      <Text variant="h1" align="center" style={{ color: personalityType.color }}>
        {personalityType.nameZh}
      </Text>

      {/* 標語 */}
      <Text variant="body" color="subtle" align="center">
        {personalityType.tagline}
      </Text>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: SPACING[8],
    paddingHorizontal: SPACING[4],
    gap: SPACING[2],
  },
  animationContainer: {
    width: 160,
    height: 160,
    marginBottom: SPACING[4],
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    width: 160,
    height: 160,
  },
  placeholderCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
})
