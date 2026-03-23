/**
 * ConfirmDialog 組件
 *
 * 確認對話框，用於需要使用者確認的操作（如刪除、送出等）
 */
import React from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { SPACING } from '@nobodyclimb/constants'
import { Dialog } from './Dialog'
import { Button } from './Button'

export interface ConfirmDialogProps {
  /** 是否顯示 */
  open: boolean
  /** 標題 */
  title: string
  /** 訊息 */
  message: string
  /** 確認按鈕文字 */
  confirmLabel?: string
  /** 取消按鈕文字 */
  cancelLabel?: string
  /** 載入中狀態（禁用兩個按鈕） */
  loading?: boolean
  /** 確認回調 */
  onConfirm: () => void
  /** 取消回調 */
  onCancel: () => void
  /** 是否為破壞性操作（使用 destructive 變體） */
  destructive?: boolean
}

/**
 * 確認對話框
 *
 * @example
 * ```tsx
 * <ConfirmDialog
 *   open={showConfirm}
 *   title="確認刪除"
 *   message="此操作無法復原，確定要繼續嗎？"
 *   confirmLabel="刪除"
 *   cancelLabel="取消"
 *   destructive
 *   loading={isDeleting}
 *   onConfirm={handleDelete}
 *   onCancel={() => setShowConfirm(false)}
 * />
 * ```
 */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '確認',
  cancelLabel = '取消',
  loading = false,
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      visible={open}
      title={title}
      message={message}
      dismissible={!loading}
      onClose={onCancel}
    >
      <View style={styles.actions}>
        <Button
          variant="outline"
          size="md"
          onPress={onCancel}
          disabled={loading}
          style={styles.action}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? 'destructive' : 'primary'}
          size="md"
          onPress={onConfirm}
          disabled={loading}
          style={StyleSheet.flatten([styles.action, styles.actionMargin]) as ViewStyle}
        >
          {confirmLabel}
        </Button>
      </View>
    </Dialog>
  )
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    marginTop: SPACING[4],
  },
  action: {
    flex: 1,
  },
  actionMargin: {
    marginLeft: SPACING[3],
  },
})

export default ConfirmDialog
