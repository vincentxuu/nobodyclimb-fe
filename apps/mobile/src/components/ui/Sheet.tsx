/**
 * Sheet 組件
 *
 * 底部彈出面板，使用 @gorhom/bottom-sheet
 */
import React, { useCallback, useRef, useEffect, ReactNode } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import { SEMANTIC_COLORS } from '@nobodyclimb/constants'

export interface SheetProps {
  /** 是否開啟 */
  open: boolean
  /** 開關狀態變化回調 */
  onOpenChange: (open: boolean) => void
  /** 吸附點 (如 ['25%', '50%', '85%']) */
  snapPoints?: string[]
  /** 子元素 */
  children: ReactNode
}

export function Sheet({
  open,
  onOpenChange,
  snapPoints = ['50%'],
  children,
}: SheetProps) {
  const bottomSheetRef = useRef<BottomSheet>(null)

  useEffect(() => {
    if (open) {
      bottomSheetRef.current?.expand()
    } else {
      bottomSheetRef.current?.close()
    }
  }, [open])

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        onOpenChange(false)
      }
    },
    [onOpenChange]
  )

  const renderBackdrop = useCallback(
    (props: React.ComponentProps<typeof BottomSheetBackdrop>) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    []
  )

  if (!open) return null

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={0}
      snapPoints={snapPoints}
      onChange={handleSheetChanges}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      handleIndicatorStyle={styles.handleIndicator}
      backgroundStyle={styles.background}
    >
      <BottomSheetView style={styles.contentContainer}>
        {children}
      </BottomSheetView>
    </BottomSheet>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
  },
  handleIndicator: {
    backgroundColor: SEMANTIC_COLORS.border,
    width: 40,
  },
  background: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
  },
})

export default Sheet
