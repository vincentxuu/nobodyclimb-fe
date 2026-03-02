/**
 * LoadMoreButton 組件
 *
 * 載入更多按鈕，與 apps/web/src/components/ui/load-more-button.tsx 對應
 */
import React from 'react'
import { StyleSheet, View, ActivityIndicator } from 'react-native'
import { YStack } from 'tamagui'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Button } from './Button'
import { Text } from './Text'

export interface LoadMoreButtonProps {
  /** 按鈕點擊事件 */
  onPress: () => void
  /** 是否正在載入中 */
  loading?: boolean
  /** 是否還有更多資料可載入 */
  hasMore?: boolean
  /** 按鈕文字 */
  text?: string
  /** 載入中的文字 */
  loadingText?: string
  /** 沒有更多資料時的文字 */
  noMoreText?: string
}

export function LoadMoreButton({
  onPress,
  loading = false,
  hasMore = true,
  text = '看更多',
  loadingText = '載入中...',
  noMoreText = '已顯示全部',
}: LoadMoreButtonProps) {
  if (!hasMore) {
    return (
      <YStack paddingVertical={SPACING.lg} alignItems="center">
        <Text color="textSubtle">{noMoreText}</Text>
      </YStack>
    )
  }

  return (
    <YStack
      paddingVertical={SPACING.lg}
      marginTop={SPACING.md}
      alignItems="center"
    >
      <Button
        variant="secondary"
        onPress={onPress}
        disabled={loading}
        style={styles.button}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator
              size="small"
              color={SEMANTIC_COLORS.textMain}
              style={styles.spinner}
            />
            <Text>{loadingText}</Text>
          </View>
        ) : (
          text
        )}
      </Button>
    </YStack>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 44,
    paddingHorizontal: 32,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spinner: {
    marginRight: 8,
  },
})
