/**
 * Select 組件
 *
 * 下拉選擇器，與 apps/web/src/components/ui/select.tsx 對應
 * 使用 BottomSheet 顯示選項 (Native)
 */
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { Pressable, StyleSheet, FlatList, View } from 'react-native'
import { ChevronDown, Check } from 'lucide-react-native'
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import { SEMANTIC_COLORS, FONT_SIZE, SPACING, RADIUS } from '@nobodyclimb/constants'
import { Text } from './Text'

export interface SelectOption {
  /** 選項值 */
  value: string
  /** 選項顯示文字 */
  label: string
  /** 是否禁用 */
  disabled?: boolean
}

export interface SelectProps {
  /** 選項列表 */
  options: SelectOption[]
  /** 當前選中值 */
  value?: string
  /** 值變化時的回調 */
  onValueChange?: (value: string) => void
  /** 佔位符文字 */
  placeholder?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 標題（顯示在 BottomSheet 頂部） */
  title?: string
}

export function Select({
  options,
  value,
  onValueChange,
  placeholder = '請選擇',
  disabled = false,
  title,
}: SelectProps) {
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ['50%', '75%'], [])

  const selectedOption = options.find((opt) => opt.value === value)

  const handleOpen = useCallback(() => {
    if (!disabled) {
      bottomSheetRef.current?.expand()
    }
  }, [disabled])

  const handleSelect = useCallback(
    (optionValue: string) => {
      onValueChange?.(optionValue)
      bottomSheetRef.current?.close()
    },
    [onValueChange]
  )

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

  const renderOption = useCallback(
    ({ item }: { item: SelectOption }) => {
      const isSelected = item.value === value
      return (
        <Pressable
          onPress={() => !item.disabled && handleSelect(item.value)}
          disabled={item.disabled}
          style={[
            styles.option,
            isSelected && styles.optionSelected,
            item.disabled && styles.optionDisabled,
          ]}
        >
          <Text
            color={item.disabled ? 'textMuted' : 'textMain'}
            style={isSelected && styles.optionTextSelected}
          >
            {item.label}
          </Text>
          {isSelected && (
            <Check size={20} color={SEMANTIC_COLORS.textMain} />
          )}
        </Pressable>
      )
    },
    [value, handleSelect]
  )

  return (
    <>
      <Pressable
        onPress={handleOpen}
        disabled={disabled}
        style={[
          styles.trigger,
          disabled && styles.triggerDisabled,
        ]}
      >
        <Text
          color={selectedOption ? 'textMain' : 'textSubtle'}
          style={styles.triggerText}
        >
          {selectedOption?.label || placeholder}
        </Text>
        <ChevronDown
          size={20}
          color={disabled ? SEMANTIC_COLORS.textMuted : SEMANTIC_COLORS.textMain}
        />
      </Pressable>

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.sheetIndicator}
      >
        <BottomSheetView style={styles.sheetContent}>
          {title && (
            <View style={styles.sheetHeader}>
              <Text variant="h4" fontWeight="600">
                {title}
              </Text>
            </View>
          )}
          <FlatList
            data={options}
            keyExtractor={(item) => item.value}
            renderItem={renderOption}
            showsVerticalScrollIndicator={false}
          />
        </BottomSheetView>
      </BottomSheet>
    </>
  )
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D3D3D3',
    borderRadius: RADIUS.md,
    height: 44,
    paddingHorizontal: SPACING.sm,
  },
  triggerDisabled: {
    opacity: 0.5,
    backgroundColor: '#F0F0F0',
  },
  triggerText: {
    flex: 1,
  },
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
  sheetHeader: {
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEAEA',
    marginBottom: SPACING.sm,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
  },
  optionSelected: {
    backgroundColor: '#F5F5F5',
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionTextSelected: {
    fontWeight: '500',
  },
})
