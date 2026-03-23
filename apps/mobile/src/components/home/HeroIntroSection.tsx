/**
 * HeroIntroSection 組件
 *
 * 首頁品牌介紹區，對應 apps/web/src/components/home/hero-intro-section.tsx
 * 顯示 Logo + 標語 + 行動呼籲
 */
import React from 'react'
import { StyleSheet, View, Image } from 'react-native'
import { YStack } from 'tamagui'
import Animated, { FadeInDown } from 'react-native-reanimated'

import { Text } from '@/components/ui'
import { SEMANTIC_COLORS, SPACING, WB_COLORS } from '@nobodyclimb/constants'

export function HeroIntroSection() {
  return (
    <View style={styles.container}>
      <YStack alignItems="center" justifyContent="center" flex={1} gap={SPACING[4]}>
        {/* Logo */}
        <Animated.View entering={FadeInDown.duration(600)}>
          <Image
            source={require('../../../assets/logo-black.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* 標語 */}
        <Animated.View entering={FadeInDown.delay(200).duration(600)}>
          <Text style={styles.subtitle}>台灣攀岩社群</Text>
        </Animated.View>

        {/* 行動呼籲 */}
        <Animated.View entering={FadeInDown.delay(400).duration(600)}>
          <Text style={styles.actions}>查路線 · 看故事 · 寫紀錄</Text>
        </Animated.View>
      </YStack>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    minHeight: 300,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING[12],
    paddingHorizontal: SPACING[4],
  },
  logo: {
    width: 280,
    height: 80,
  },
  subtitle: {
    fontSize: 16,
    color: WB_COLORS[70],
    textAlign: 'center',
  },
  actions: {
    fontSize: 20,
    fontWeight: '500',
    color: WB_COLORS[100],
    textAlign: 'center',
  },
})

export default HeroIntroSection
