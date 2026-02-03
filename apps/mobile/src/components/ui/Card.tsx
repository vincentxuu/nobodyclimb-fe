/**
 * Card 組件
 *
 * 卡片容器組件
 */
import React from 'react'
import {
  View,
  Pressable,
  Image,
  StyleSheet,
  type ViewStyle,
  type ImageProps,
  type PressableProps,
} from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import {
  SEMANTIC_COLORS,
  BORDER_RADIUS,
  SPACING,
  SHADOWS,
} from '@nobodyclimb/constants'
import { Text, type TextProps } from './Text'
import { springConfigLight } from '@/theme/animations'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// ============================================
// Card 主容器
// ============================================

export interface CardProps extends Omit<PressableProps, 'style'> {
  /** 子元素 */
  children?: React.ReactNode
  /** 自定義樣式 */
  style?: ViewStyle
  /** 是否可按壓 */
  pressable?: boolean
  /** 是否有陰影 */
  shadow?: boolean | 'sm' | 'md' | 'lg'
}

/**
 * 卡片容器
 *
 * @example
 * ```tsx
 * <Card>
 *   <CardContent>
 *     <CardTitle>標題</CardTitle>
 *   </CardContent>
 * </Card>
 *
 * <Card pressable onPress={() => console.log('pressed')}>
 *   <CardMedia source={{ uri: 'https://...' }} />
 *   <CardContent>
 *     <CardTitle>可點擊的卡片</CardTitle>
 *   </CardContent>
 * </Card>
 * ```
 */
export function Card({
  children,
  style,
  pressable = false,
  shadow = 'sm',
  onPressIn,
  onPressOut,
  ...props
}: CardProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
    if (pressable) {
      scale.value = withSpring(0.98, springConfigLight)
    }
    onPressIn?.(e)
  }

  const handlePressOut = (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
    scale.value = withSpring(1, springConfigLight)
    onPressOut?.(e)
  }

  const shadowStyle = shadow
    ? typeof shadow === 'boolean'
      ? SHADOWS.sm
      : SHADOWS[shadow]
    : {}

  if (pressable) {
    return (
      <AnimatedPressable
        style={[styles.card, shadowStyle, animatedStyle, style]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        {...props}
      >
        {children}
      </AnimatedPressable>
    )
  }

  return (
    <View style={[styles.card, shadowStyle, style]} {...props}>
      {children}
    </View>
  )
}

// ============================================
// CardMedia 子組件
// ============================================

export interface CardMediaProps extends Omit<ImageProps, 'style'> {
  /** 圖片高度 */
  height?: number
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * 卡片媒體區域（圖片）
 */
export function CardMedia({ height = 160, style, ...props }: CardMediaProps) {
  return (
    <Image
      style={[styles.media, { height }, style]}
      resizeMode="cover"
      {...props}
    />
  )
}

// ============================================
// CardContent 子組件
// ============================================

export interface CardContentProps {
  /** 子元素 */
  children?: React.ReactNode
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * 卡片內容區域
 */
export function CardContent({ children, style }: CardContentProps) {
  return <View style={[styles.content, style]}>{children}</View>
}

// ============================================
// CardTitle 子組件
// ============================================

export interface CardTitleProps extends Omit<TextProps, 'variant'> {
  /** 子元素 */
  children?: React.ReactNode
}

/**
 * 卡片標題
 */
export function CardTitle({ children, ...props }: CardTitleProps) {
  return (
    <Text variant="bodyBold" {...props}>
      {children}
    </Text>
  )
}

// ============================================
// CardInfo 子組件
// ============================================

export interface CardInfoProps extends Omit<TextProps, 'variant' | 'color'> {
  /** 子元素 */
  children?: React.ReactNode
}

/**
 * 卡片資訊文字
 */
export function CardInfo({ children, ...props }: CardInfoProps) {
  return (
    <Text variant="caption" color="subtle" {...props}>
      {children}
    </Text>
  )
}

// ============================================
// CardFooter 子組件
// ============================================

export interface CardFooterProps {
  /** 子元素 */
  children?: React.ReactNode
  /** 自定義樣式 */
  style?: ViewStyle
}

/**
 * 卡片底部區域
 */
export function CardFooter({ children, style }: CardFooterProps) {
  return <View style={[styles.footer, style]}>{children}</View>
}

// ============================================
// 樣式
// ============================================

const styles = StyleSheet.create({
  card: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: SEMANTIC_COLORS.border,
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    borderTopLeftRadius: BORDER_RADIUS.lg - 1,
    borderTopRightRadius: BORDER_RADIUS.lg - 1,
  },
  content: {
    padding: SPACING[4],
  },
  footer: {
    paddingHorizontal: SPACING[4],
    paddingBottom: SPACING[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
})

export default Card
