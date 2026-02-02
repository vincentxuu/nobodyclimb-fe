import React, { useState, useMemo } from 'react'
import { View, Pressable } from 'react-native'
import { Text } from '../ui/Text'
import { Icon } from '../ui/Icon'
import { COLORS, SEMANTIC_COLORS } from '@nobodyclimb/constants'

interface ProfileTextDisplayProps {
  text: string
  minHeight?: number
  isMobile?: boolean
  /** 是否將逗號分隔的文字顯示為標籤 */
  asTags?: boolean
  /** 收合時最多顯示幾個標籤（僅在 asTags 為 true 時有效） */
  maxVisibleTags?: number
}

export default function ProfileTextDisplay({
  text,
  minHeight,
  asTags = false,
  maxVisibleTags = 6,
}: ProfileTextDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // 將逗號分隔的文字轉為標籤陣列
  const tags = useMemo(() => {
    if (!asTags || !text) return []
    return text
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
  }, [text, asTags])

  // 決定要顯示的標籤
  const visibleTags = useMemo(() => {
    if (!asTags) return []
    if (isExpanded || tags.length <= maxVisibleTags) return tags
    return tags.slice(0, maxVisibleTags)
  }, [asTags, tags, isExpanded, maxVisibleTags])

  const hasMore = tags.length > maxVisibleTags

  // 標籤式顯示
  if (asTags && tags.length > 0) {
    return (
      <View
        style={{
          width: '100%',
          borderRadius: 4,
          borderWidth: 1,
          borderColor: '#B6B3B3',
          backgroundColor: COLORS.white,
          padding: 12,
          minHeight,
        }}
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {visibleTags.map((tag, index) => (
            <View
              key={`${tag}-${index}`}
              style={{
                backgroundColor: COLORS.gray[100],
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
              }}
            >
              <Text variant="caption" style={{ color: COLORS.gray[700] }}>
                {tag}
              </Text>
            </View>
          ))}
          {hasMore && (
            <Pressable
              onPress={() => setIsExpanded(!isExpanded)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 2,
                backgroundColor: COLORS.gray[200],
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 999,
              }}
            >
              <Text variant="caption" style={{ color: COLORS.gray[600] }}>
                {isExpanded ? '收起' : `+${tags.length - maxVisibleTags}`}
              </Text>
              <Icon
                name={isExpanded ? 'ChevronUp' : 'ChevronDown'}
                size="xs"
                color={COLORS.gray[600]}
              />
            </Pressable>
          )}
        </View>
      </View>
    )
  }

  // 一般文字顯示
  return (
    <View
      style={{
        width: '100%',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#B6B3B3',
        backgroundColor: COLORS.white,
        padding: 12,
        minHeight,
      }}
    >
      <Text variant="body" style={{ color: SEMANTIC_COLORS.textMain }}>
        {text}
      </Text>
    </View>
  )
}
