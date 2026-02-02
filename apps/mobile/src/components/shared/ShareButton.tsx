/**
 * ShareButton 組件
 *
 * 分享按鈕，對應 apps/web/src/components/shared/share-button.tsx
 * 使用 expo-sharing 和 React Native Share API
 */
import React, { useCallback, useRef, useState } from 'react'
import { Share, StyleSheet, View, Linking } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { Share as ShareIcon, Link2, Check } from 'lucide-react-native'
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet'

import { IconButton, Text, Button } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { SEMANTIC_COLORS, SPACING, RADIUS } from '@nobodyclimb/constants'

interface ShareButtonProps {
  /** 分享的 URL */
  url?: string
  /** 分享標題 */
  title?: string
  /** 分享描述 */
  description?: string
  /** 按鈕尺寸 */
  size?: 'sm' | 'md' | 'lg'
}

export function ShareButton({
  url,
  title = '',
  description = '',
  size = 'md',
}: ShareButtonProps) {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const [copied, setCopied] = useState(false)
  const { showToast } = useToast()

  // 分享 URL
  const shareUrl = url || ''

  // 打開分享選單
  const handleOpenShare = useCallback(() => {
    bottomSheetRef.current?.expand()
  }, [])

  // 使用原生分享
  const handleNativeShare = useCallback(async () => {
    try {
      await Share.share({
        message: description ? `${title}\n\n${description}\n\n${shareUrl}` : `${title}\n\n${shareUrl}`,
        url: shareUrl,
        title,
      })
      bottomSheetRef.current?.close()
    } catch (error: any) {
      if (error.message !== 'User did not share') {
        console.error('Share failed:', error)
      }
    }
  }, [title, description, shareUrl])

  // 複製連結
  const handleCopyLink = useCallback(async () => {
    try {
      await Clipboard.setStringAsync(shareUrl)
      setCopied(true)
      showToast({
        message: '已複製連結',
        variant: 'success',
      })
      setTimeout(() => setCopied(false), 2000)
      bottomSheetRef.current?.close()
    } catch (error) {
      console.error('Failed to copy link:', error)
      showToast({
        message: '複製失敗',
        variant: 'error',
      })
    }
  }, [shareUrl, showToast])

  // 分享到 Facebook
  const handleShareFacebook = useCallback(() => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    Linking.openURL(facebookUrl)
    bottomSheetRef.current?.close()
  }, [shareUrl])

  // 分享到 LINE
  const handleShareLine = useCallback(() => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`
    Linking.openURL(lineUrl)
    bottomSheetRef.current?.close()
  }, [shareUrl])

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
      />
    ),
    []
  )

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20

  return (
    <>
      <IconButton
        icon={<ShareIcon size={iconSize} color={SEMANTIC_COLORS.textMain} />}
        onPress={handleOpenShare}
        variant="ghost"
      />

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={['40%']}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text variant="h4" fontWeight="600" style={styles.sheetTitle}>
            分享
          </Text>

          {/* 原生分享 */}
          <Button
            variant="ghost"
            onPress={handleNativeShare}
            style={styles.shareOption}
          >
            <View style={styles.shareOptionContent}>
              <ShareIcon size={20} color={SEMANTIC_COLORS.textMain} />
              <Text>分享...</Text>
            </View>
          </Button>

          {/* 複製連結 */}
          <Button
            variant="ghost"
            onPress={handleCopyLink}
            style={styles.shareOption}
          >
            <View style={styles.shareOptionContent}>
              {copied ? (
                <>
                  <Check size={20} color="#22C55E" />
                  <Text style={{ color: '#22C55E' }}>已複製</Text>
                </>
              ) : (
                <>
                  <Link2 size={20} color={SEMANTIC_COLORS.textMain} />
                  <Text>複製連結</Text>
                </>
              )}
            </View>
          </Button>

          <View style={styles.divider} />

          {/* Facebook */}
          <Button
            variant="ghost"
            onPress={handleShareFacebook}
            style={styles.shareOption}
          >
            <View style={styles.shareOptionContent}>
              <ShareIcon size={20} color="#1877F2" />
              <Text>分享到 Facebook</Text>
            </View>
          </Button>

          {/* LINE */}
          <Button
            variant="ghost"
            onPress={handleShareLine}
            style={styles.shareOption}
          >
            <View style={styles.shareOptionContent}>
              <ShareIcon size={20} color="#00B900" />
              <Text>分享到 LINE</Text>
            </View>
          </Button>
        </BottomSheetView>
      </BottomSheet>
    </>
  )
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: '#FFFFFF',
  },
  sheetIndicator: {
    backgroundColor: '#D3D3D3',
    width: 40,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  sheetTitle: {
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  shareOption: {
    justifyContent: 'flex-start',
    paddingVertical: SPACING.sm,
  },
  shareOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  divider: {
    height: 1,
    backgroundColor: '#EBEAEA',
    marginVertical: SPACING.sm,
  },
})

export default ShareButton
