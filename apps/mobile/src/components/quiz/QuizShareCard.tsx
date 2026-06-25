/**
 * QuizShareCard
 *
 * 離屏分享卡片，供 react-native-view-shot 擷取為圖片
 */

import { FONT_SIZE, FONT_WEIGHT, SPACING, WB_COLORS } from '@nobodyclimb/constants'
import type { PersonalityType, QuizResult } from '@nobodyclimb/types'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View } from 'react-native'

import { Text } from '@/components/ui'

import { QuizRadarChart } from './QuizRadarChart'

interface QuizShareCardProps {
  /** 人格類型資料 */
  personalityType: PersonalityType
  /** 測驗結果 */
  result: QuizResult
}

export function QuizShareCard({ personalityType, result }: QuizShareCardProps) {
  return (
    <View style={styles.offScreen}>
      <LinearGradient
        colors={[personalityType.color, personalityType.color + 'CC']}
        style={styles.container}
      >
        {/* 人格類型圖示佔位 */}
        <View style={[styles.iconPlaceholder, { backgroundColor: WB_COLORS[100] + '30' }]} />

        {/* 中文名稱 */}
        <Text variant="h1" align="center" style={{ color: WB_COLORS[100] }}>
          {personalityType.nameZh}
        </Text>

        {/* 英文名稱 */}
        <Text
          style={{
            fontSize: FONT_SIZE.sm,
            fontWeight: FONT_WEIGHT.medium,
            color: WB_COLORS[100] + 'CC',
            letterSpacing: 2,
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          {personalityType.nameEn}
        </Text>

        {/* 標語 */}
        <Text
          style={{
            fontSize: FONT_SIZE.base,
            color: WB_COLORS[100] + 'E6',
            textAlign: 'center',
          }}
        >
          {personalityType.tagline}
        </Text>

        {/* 雷達圖 */}
        <View style={styles.chartContainer}>
          <QuizRadarChart result={result} size={200} />
        </View>

        {/* 指數 */}
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text
              style={{
                fontSize: FONT_SIZE.xs,
                color: WB_COLORS[100] + 'CC',
              }}
            >
              Grit
            </Text>
            <Text
              style={{
                fontSize: FONT_SIZE.lg,
                fontWeight: FONT_WEIGHT.bold,
                color: WB_COLORS[100],
              }}
            >
              {Math.round(result.gritIndex)}%
            </Text>
          </View>
          <View style={styles.metric}>
            <Text
              style={{
                fontSize: FONT_SIZE.xs,
                color: WB_COLORS[100] + 'CC',
              }}
            >
              Flow
            </Text>
            <Text
              style={{
                fontSize: FONT_SIZE.lg,
                fontWeight: FONT_WEIGHT.bold,
                color: WB_COLORS[100],
              }}
            >
              {Math.round(result.flowIndex)}%
            </Text>
          </View>
        </View>

        {/* 品牌與 CTA */}
        <View style={styles.footer}>
          <Text
            style={{
              fontSize: FONT_SIZE.sm,
              fontWeight: FONT_WEIGHT.bold,
              color: WB_COLORS[100],
              letterSpacing: 1,
            }}
          >
            NobodyClimb
          </Text>
          <Text
            style={{
              fontSize: FONT_SIZE.xs,
              color: WB_COLORS[100] + 'B3',
            }}
          >
            你是哪種攀岩者？
          </Text>
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  offScreen: {
    position: 'absolute',
    left: -9999,
  },
  container: {
    width: 375,
    height: 500,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING[6],
    paddingHorizontal: SPACING[4],
    gap: SPACING[2],
  },
  iconPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginBottom: SPACING[2],
  },
  chartContainer: {
    marginVertical: SPACING[2],
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING[8],
  },
  metric: {
    alignItems: 'center',
    gap: SPACING[0.5],
  },
  footer: {
    alignItems: 'center',
    gap: SPACING[1],
    marginTop: SPACING[2],
  },
})
