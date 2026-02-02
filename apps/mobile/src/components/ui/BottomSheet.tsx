/**
 * BottomSheet 組件
 *
 * 底部彈出面板組件
 */
import React, { useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import GorhomBottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetScrollView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import {
  SEMANTIC_COLORS,
  BORDER_RADIUS,
  SPACING,
  WB_COLORS,
} from '@nobodyclimb/constants'
import { Text } from './Text'

export interface BottomSheetRef {
  /** 展開到指定 snap point 索引 */
  snapTo: (index: number) => void
  /** 完全展開 */
  expand: () => void
  /** 關閉 */
  close: () => void
}

export interface BottomSheetProps {
  /** 子元素 */
  children: React.ReactNode
  /** Snap points (百分比或像素) */
  snapPoints?: (string | number)[]
  /** 初始 snap point 索引 */
  initialIndex?: number
  /** 標題 */
  title?: string
  /** 是否顯示拖曳指示器 */
  showHandle?: boolean
  /** 是否可滾動 */
  scrollable?: boolean
  /** 關閉時回調 */
  onClose?: () => void
  /** 索引變更回調 */
  onChange?: (index: number) => void
  /** 內容區域樣式 */
  contentStyle?: ViewStyle
}

/**
 * 底部彈出面板
 *
 * @example
 * ```tsx
 * const bottomSheetRef = useRef<BottomSheetRef>(null)
 *
 * <BottomSheet
 *   ref={bottomSheetRef}
 *   snapPoints={['25%', '50%', '90%']}
 *   title="選擇選項"
 * >
 *   <View>內容</View>
 * </BottomSheet>
 *
 * // 控制
 * bottomSheetRef.current?.expand()
 * bottomSheetRef.current?.close()
 * ```
 */
export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  function BottomSheet(
    {
      children,
      snapPoints = ['25%', '50%'],
      initialIndex = -1,
      title,
      showHandle = true,
      scrollable = false,
      onClose,
      onChange,
      contentStyle,
    },
    ref
  ) {
    const bottomSheetRef = useRef<GorhomBottomSheet>(null)

    // Memoize snap points
    const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints])

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      snapTo: (index: number) => {
        bottomSheetRef.current?.snapToIndex(index)
      },
      expand: () => {
        bottomSheetRef.current?.expand()
      },
      close: () => {
        bottomSheetRef.current?.close()
      },
    }))

    // Handle sheet changes
    const handleSheetChanges = useCallback(
      (index: number) => {
        onChange?.(index)
        if (index === -1) {
          onClose?.()
        }
      },
      [onChange, onClose]
    )

    // Render backdrop
    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
        />
      ),
      []
    )

    // Render handle
    const renderHandle = useCallback(
      () =>
        showHandle ? (
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
        ) : null,
      [showHandle]
    )

    const ContentContainer = scrollable ? BottomSheetScrollView : BottomSheetView

    return (
      <GorhomBottomSheet
        ref={bottomSheetRef}
        index={initialIndex}
        snapPoints={memoizedSnapPoints}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        handleComponent={renderHandle}
        enablePanDownToClose
        backgroundStyle={styles.background}
      >
        <ContentContainer style={[styles.content, contentStyle]}>
          {title && (
            <View style={styles.header}>
              <Text variant="h4" color="main" align="center">
                {title}
              </Text>
            </View>
          )}
          {children}
        </ContentContainer>
      </GorhomBottomSheet>
    )
  }
)

const styles = StyleSheet.create({
  background: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: SPACING[2],
    paddingBottom: SPACING[1],
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: WB_COLORS[30],
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: SPACING[4],
  },
  header: {
    marginBottom: SPACING[4],
    paddingBottom: SPACING[3],
    borderBottomWidth: 1,
    borderBottomColor: SEMANTIC_COLORS.border,
  },
})

export default BottomSheet
