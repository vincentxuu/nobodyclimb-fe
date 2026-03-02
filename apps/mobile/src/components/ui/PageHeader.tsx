/**
 * PageHeader 組件
 *
 * 頁面標題，與 apps/web/src/components/ui/page-header.tsx 對應
 */
import React from 'react'
import { YStack } from 'tamagui'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { SEMANTIC_COLORS, SPACING, FONT_SIZE } from '@nobodyclimb/constants'
import { Text } from './Text'

export interface PageHeaderProps {
  /** 頁面標題 */
  title: string
  /** 副標題 */
  subtitle?: string
  /** 是否顯示動畫 */
  animated?: boolean
}

const AnimatedYStack = Animated.createAnimatedComponent(YStack)

export function PageHeader({
  title,
  subtitle,
  animated = true,
}: PageHeaderProps) {
  const Container = animated ? AnimatedYStack : YStack

  return (
    <Container
      backgroundColor={SEMANTIC_COLORS.pageBg}
      paddingVertical={SPACING.lg}
      paddingHorizontal={SPACING.md}
      entering={animated ? FadeInDown.duration(400) : undefined}
    >
      <Text
        variant="h1"
        style={{
          fontSize: FONT_SIZE['2xl'],
          fontWeight: '700',
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          variant="body"
          color="textSubtle"
          marginTop={SPACING.xs}
          style={{
            fontSize: FONT_SIZE.sm,
          }}
        >
          {subtitle}
        </Text>
      )}
    </Container>
  )
}
