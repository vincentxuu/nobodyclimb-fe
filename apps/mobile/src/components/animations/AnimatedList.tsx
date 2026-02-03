/**
 * AnimatedList 組件
 *
 * FlatList 子項目進入動畫
 */
import React, { useCallback, ReactElement } from 'react'
import {
  FlatList,
  FlatListProps,
  ListRenderItem,
  ViewStyle,
  StyleProp,
} from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'

interface AnimatedListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[]
  renderItem: (item: T, index: number) => ReactElement
  staggerDelay?: number
  animationDuration?: number
  contentContainerStyle?: StyleProp<ViewStyle>
}

export function AnimatedList<T>({
  data,
  renderItem,
  staggerDelay = 50,
  animationDuration = 300,
  ...props
}: AnimatedListProps<T>) {
  const renderAnimatedItem: ListRenderItem<T> = useCallback(
    ({ item, index }) => {
      return (
        <Animated.View
          entering={FadeInDown.duration(animationDuration).delay(index * staggerDelay)}
        >
          {renderItem(item, index)}
        </Animated.View>
      )
    },
    [renderItem, staggerDelay, animationDuration]
  )

  return (
    <FlatList
      data={data}
      renderItem={renderAnimatedItem}
      keyExtractor={(_, index) => index.toString()}
      {...props}
    />
  )
}
