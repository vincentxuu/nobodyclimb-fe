import React from 'react'
import { View, Pressable, ActivityIndicator } from 'react-native'
import { XStack, Text } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Eye, Loader2 } from 'lucide-react-native'
import { SEMANTIC_COLORS, COLORS } from '@nobodyclimb/constants'
import type { SaveStatus } from '@nobodyclimb/types'

interface FixedBottomBarProps {
  /** 儲存狀態 */
  saveStatus: SaveStatus
  /** 預覽連結 */
  previewHref: string
  /** 發布回調 */
  onPublish?: () => void
  /** 是否可以發布 */
  canPublish?: boolean
  /** 是否正在發布 */
  isPublishing?: boolean
  /** 完成進度百分比 */
  progress?: number
}

/**
 * 固定底部操作列
 *
 * 顯示儲存狀態和預覽/發布按鈕
 */
export function FixedBottomBar({
  saveStatus,
  previewHref,
  onPublish,
  canPublish = true,
  isPublishing = false,
  progress = 0,
}: FixedBottomBarProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const getSaveStatusContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <XStack alignItems="center" gap="$1">
            <ActivityIndicator size="small" color={COLORS.text.muted} />
            <Text fontSize={14} color={COLORS.text.muted}>
              儲存中...
            </Text>
          </XStack>
        )
      case 'saved':
        return (
          <Text fontSize={14} color={COLORS.brand.dark}>
            已儲存
          </Text>
        )
      case 'error':
        return (
          <Text fontSize={14} color={COLORS.status.error}>
            儲存失敗
          </Text>
        )
      case 'idle':
      default:
        return (
          <Text fontSize={14} color={COLORS.text.muted}>
            自動儲存已啟用
          </Text>
        )
    }
  }

  const handlePreview = () => {
    if (previewHref) {
      router.push(previewHref as `/biography/${string}`)
    }
  }

  return (
    <View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: COLORS.border.light,
        paddingBottom: insets.bottom,
      }}
    >
      {/* Progress Bar */}
      {progress > 0 && progress < 100 && (
        <View
          style={{
            height: 4,
            backgroundColor: COLORS.background.muted,
          }}
        >
          <View
            style={{
              height: '100%',
              width: `${progress}%`,
              backgroundColor: COLORS.brand.accent,
            }}
          />
        </View>
      )}

      {/* Content */}
      <XStack
        paddingHorizontal="$4"
        paddingVertical="$3"
        alignItems="center"
        justifyContent="space-between"
      >
        {/* Left: Save Status */}
        <View>{getSaveStatusContent()}</View>

        {/* Right: Actions */}
        <XStack alignItems="center" gap="$2">
          {/* Preview Button */}
          <Pressable
            onPress={handlePreview}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderWidth: 1,
              borderColor: COLORS.border.default,
              borderRadius: 8,
              backgroundColor: pressed ? COLORS.background.subtle : 'transparent',
            })}
          >
            <Eye size={16} color={SEMANTIC_COLORS.textSubtle} />
            <Text fontSize={14} fontWeight="500" color={SEMANTIC_COLORS.textSubtle}>
              預覽
            </Text>
          </Pressable>

          {/* Publish Button */}
          {onPublish && (
            <Pressable
              onPress={onPublish}
              disabled={!canPublish || isPublishing}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                backgroundColor: canPublish
                  ? pressed
                    ? '#333'
                    : COLORS.brand.dark
                  : COLORS.background.muted,
                opacity: !canPublish || isPublishing ? 0.5 : 1,
              })}
            >
              {isPublishing ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text fontSize={14} fontWeight="500" color="white">
                    發布中...
                  </Text>
                </>
              ) : (
                <Text
                  fontSize={14}
                  fontWeight="500"
                  color={canPublish ? 'white' : COLORS.border.default}
                >
                  發布
                </Text>
              )}
            </Pressable>
          )}
        </XStack>
      </XStack>
    </View>
  )
}

/**
 * 底部空白佔位
 *
 * 用於防止內容被固定底部欄擋住
 */
export function BottomBarSpacer() {
  const insets = useSafeAreaInsets()
  return <View style={{ height: 80 + insets.bottom }} />
}

export default FixedBottomBar
