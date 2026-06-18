import { SEMANTIC_COLORS, SPACING } from '@nobodyclimb/constants'
import { Merge, User, UserCheck, X } from 'lucide-react-native'
import { type ReactNode, useState } from 'react'
import { Modal, Pressable, StyleSheet, View } from 'react-native'
import { type UnclaimedContent, useContentClaim } from '@/lib/hooks/useContentClaim'
import { Button, Checkbox, Text } from '../ui'

interface ClaimContentModalProps {
  isOpen: boolean
  onClose: () => void
  unclaimedContent: UnclaimedContent[]
}

export function ClaimContentModal({ isOpen, onClose, unclaimedContent }: ClaimContentModalProps) {
  const { claimBiography, mergeBiography } = useContentClaim()
  const [keepAnonymous, setKeepAnonymous] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMergeOption, setShowMergeOption] = useState(false)

  const content = unclaimedContent[0]

  const handleClaim = async () => {
    if (!content) return

    setIsProcessing(true)
    setError(null)

    const result = await claimBiography(content.id, keepAnonymous)

    if (result.success) {
      onClose()
    } else if (result.error === '你已有人物誌') {
      setShowMergeOption(true)
    } else {
      setError(result.error || '認領失敗')
    }

    setIsProcessing(false)
  }

  const handleMerge = async () => {
    if (!content) return

    setIsProcessing(true)
    setError(null)

    const result = await mergeBiography(content.id)

    if (result.success) {
      onClose()
    } else {
      setError(result.error || '合併失敗')
    }

    setIsProcessing(false)
  }

  if (!content) return null

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Pressable onPress={onClose} style={styles.closeButton} disabled={isProcessing}>
            <X size={20} color={SEMANTIC_COLORS.textMuted} />
          </Pressable>

          {!showMergeOption ? (
            <>
              <View style={styles.hero}>
                <View style={styles.iconCircle}>
                  <User size={28} color={SEMANTIC_COLORS.textMain} />
                </View>
                <Text variant="h3" fontWeight="700" style={styles.title}>
                  發現你之前分享的故事！
                </Text>
                <Text variant="body" color="textSubtle" style={styles.subtitle}>
                  要把這個故事連結到你的帳號嗎？
                </Text>
              </View>

              <View style={styles.preview}>
                <View style={styles.avatar}>
                  <User size={18} color={SEMANTIC_COLORS.textMuted} />
                </View>
                <View>
                  <Text variant="body" fontWeight="600">
                    {content.anonymousName}
                  </Text>
                  <Text variant="small" color="textMuted">
                    {content.storyCount} 則故事 ·{' '}
                    {new Date(content.createdAt).toLocaleDateString('zh-TW')}
                  </Text>
                </View>
              </View>

              <Pressable
                style={styles.optionBox}
                onPress={() => setKeepAnonymous((current) => !current)}
                disabled={isProcessing}
              >
                <Checkbox checked={keepAnonymous} onCheckedChange={setKeepAnonymous} />
                <View style={styles.optionText}>
                  <Text variant="body" fontWeight="600">
                    保持匿名顯示
                  </Text>
                  <Text variant="small" color="textMuted">
                    其他人只會看到「{content.anonymousName}」，不會看到你的帳號資訊
                  </Text>
                </View>
              </Pressable>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button
                variant="primary"
                onPress={handleClaim}
                loading={isProcessing}
                leftIcon={UserCheck}
                fullWidth
              >
                認領這個故事
              </Button>
              <Button variant="ghost" onPress={onClose} disabled={isProcessing} fullWidth>
                不是我的，跳過
              </Button>
            </>
          ) : (
            <>
              <View style={styles.hero}>
                <View style={styles.iconCircle}>
                  <Merge size={28} color={SEMANTIC_COLORS.textMain} />
                </View>
                <Text variant="h3" fontWeight="700" style={styles.title}>
                  你已經有人物誌了
                </Text>
                <Text variant="body" color="textSubtle" style={styles.subtitle}>
                  要把匿名故事的內容合併到你現有的人物誌嗎？
                </Text>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button
                variant="primary"
                onPress={handleMerge}
                loading={isProcessing}
                leftIcon={Merge}
                fullWidth
              >
                合併到我的人物誌
              </Button>
              <Button variant="ghost" onPress={onClose} disabled={isProcessing} fullWidth>
                保持分開，不合併
              </Button>
            </>
          )}
        </View>
      </View>
    </Modal>
  )
}

export function ClaimContentProvider({ children }: { children: ReactNode }) {
  const { unclaimedContent, hasUnclaimedContent, dismissClaim } = useContentClaim()
  const [isModalOpen, setIsModalOpen] = useState(true)

  const handleClose = () => {
    setIsModalOpen(false)
    dismissClaim()
  }

  return (
    <>
      {children}
      {hasUnclaimedContent && isModalOpen && (
        <ClaimContentModal isOpen onClose={handleClose} unclaimedContent={unclaimedContent} />
      )}
    </>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: SPACING.md,
  },
  modal: {
    backgroundColor: SEMANTIC_COLORS.cardBg,
    borderRadius: 12,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  closeButton: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    zIndex: 1,
    padding: 4,
  },
  hero: {
    alignItems: 'center',
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFE70C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: '#F7F7F7',
    borderRadius: 10,
    padding: SPACING.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    padding: SPACING.md,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  errorText: {
    color: '#D94A4A',
    textAlign: 'center',
  },
})
