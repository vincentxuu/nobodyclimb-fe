/**
 * Breadcrumb 組件
 *
 * 麵包屑導航組件
 */
import React from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { ChevronRight } from 'lucide-react-native'
import { Text } from './Text'
import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'

export interface BreadcrumbItem {
  /** 標籤 */
  label: string
  /** 連結（可選） */
  href?: string
  /** 點擊回調 */
  onPress?: () => void
}

export interface BreadcrumbProps {
  /** 項目列表 */
  items: BreadcrumbItem[]
  /** 分隔符（默認為 ChevronRight） */
  separator?: React.ReactNode
  /** 容器樣式 */
  style?: object
}

/**
 * 麵包屑導航
 *
 * @example
 * ```tsx
 * <Breadcrumb
 *   items={[
 *     { label: '首頁', onPress: () => router.push('/') },
 *     { label: '人物誌', onPress: () => router.push('/biography') },
 *     { label: '台北' },
 *   ]}
 * />
 * ```
 */
export function Breadcrumb({
  items,
  separator,
  style,
}: BreadcrumbProps) {
  return (
    <View style={[styles.container, style]}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1
        const isClickable = !isLast && (item.onPress || item.href)

        return (
          <View key={index} style={styles.itemContainer}>
            {isClickable ? (
              <Pressable onPress={item.onPress}>
                <Text color="subtle" variant="caption">
                  {item.label}
                </Text>
              </Pressable>
            ) : (
              <Text
                color={isLast ? 'main' : 'subtle'}
                variant="caption"
              >
                {item.label}
              </Text>
            )}
            {!isLast && (
              <View style={styles.separator}>
                {separator || (
                  <ChevronRight
                    size={14}
                    color={SEMANTIC_COLORS.textMuted}
                  />
                )}
              </View>
            )}
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  separator: {
    marginHorizontal: SPACING.xs,
  },
})

export default Breadcrumb
