/**
 * Hero 組件
 *
 * 首頁英雄區，對應 apps/web/src/components/home/hero.tsx
 */
import React from 'react'
import { StyleSheet, View, Dimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { YStack } from 'tamagui'
import { ArrowDown } from 'lucide-react-native'
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated'

import { Text } from '@/components/ui'
import { SPACING } from '@nobodyclimb/constants'

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window')

export function Hero() {
  // 箭頭動畫
  const arrowY = useSharedValue(0)

  React.useEffect(() => {
    arrowY.value = withRepeat(
      withSequence(
        withTiming(10, { duration: 500 }),
        withTiming(0, { duration: 500 })
      ),
      -1, // 無限重複
      true
    )
  }, [arrowY])

  const arrowAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: arrowY.value }],
  }))

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >

        {/* 內容 */}
        <YStack
          flex={1}
          alignItems="center"
          justifyContent="center"
          padding={SPACING.lg}
        >
          <Animated.View
            entering={FadeInDown.duration(700)}
            style={styles.content}
          >
            {/* 標題 */}
            <Text style={styles.title}>小人物攀岩</Text>

            {/* Logo 文字 */}
            <Text style={styles.logoText}>NobodyClimb</Text>

            {/* 副標題 */}
            <Text style={styles.subtitle}>
              攀岩像是在牆上跳舞，像是在牆上即興演出，{'\n'}
              像是在走一條迷宮，起點終點很明確，{'\n'}
              過程自由發揮，你就是答案。
            </Text>
          </Animated.View>
        </YStack>

        {/* 向下箭頭 */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(700)}
          style={[styles.arrowContainer, arrowAnimatedStyle]}
        >
          <ArrowDown size={24} color="#FFFFFF" />
        </Animated.View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT * 0.6,
    width: SCREEN_WIDTH,
    marginHorizontal: -SPACING.md,
  },
  background: {
    flex: 1,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    gap: SPACING.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginVertical: SPACING.sm,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
    marginTop: SPACING.md,
  },
  arrowContainer: {
    position: 'absolute',
    bottom: SPACING.lg,
    alignSelf: 'center',
  },
})

export default Hero
