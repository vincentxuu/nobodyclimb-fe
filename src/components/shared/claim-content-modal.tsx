'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, UserCheck, Merge, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useContentClaim, type UnclaimedContent } from '@/lib/hooks/useContentClaim'

interface ClaimContentModalProps {
  isOpen: boolean
  onClose: () => void
  unclaimedContent: UnclaimedContent[]
  onClaimSuccess?: (biographyId: string) => void
}

/**
 * 認領內容 Modal
 * 當用戶登入後發現有未認領的匿名內容時顯示
 */
export function ClaimContentModal({
  isOpen,
  onClose,
  unclaimedContent,
  onClaimSuccess,
}: ClaimContentModalProps) {
  const { claimBiography, mergeBiography } = useContentClaim()
  const [keepAnonymous, setKeepAnonymous] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMergeOption, setShowMergeOption] = useState(false)

  if (!isOpen || unclaimedContent.length === 0) return null

  const content = unclaimedContent[0] // 一次處理一個

  const handleClaim = async () => {
    setIsProcessing(true)
    setError(null)

    const result = await claimBiography(content.id, keepAnonymous)

    if (result.success) {
      onClaimSuccess?.(result.biographyId!)
      onClose()
    } else if (result.error === '你已有人物誌') {
      // 顯示合併選項
      setShowMergeOption(true)
    } else {
      setError(result.error || '認領失敗')
    }

    setIsProcessing(false)
  }

  const handleMerge = async () => {
    setIsProcessing(true)
    setError(null)

    const result = await mergeBiography(content.id)

    if (result.success) {
      onClaimSuccess?.(result.biographyId!)
      onClose()
    } else {
      setError(result.error || '合併失敗')
    }

    setIsProcessing(false)
  }

  const handleDismiss = () => {
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={handleDismiss}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative z-10 mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>

          {!showMergeOption ? (
            <>
              {/* Header */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffe70c]">
                  <User className="h-7 w-7 text-[#1B1A1A]" />
                </div>
                <h2 className="text-xl font-bold text-[#1B1A1A]">
                  發現你之前分享的故事！
                </h2>
                <p className="mt-2 text-gray-600">
                  要把這個故事連結到你的帳號嗎？
                </p>
              </div>

              {/* Content preview */}
              <div className="mb-6 rounded-lg bg-gray-50 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium text-[#1B1A1A]">{content.anonymousName}</p>
                    <p className="text-sm text-gray-500">
                      {content.storyCount} 則故事 · {new Date(content.createdAt).toLocaleDateString('zh-TW')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Keep anonymous option */}
              <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={keepAnonymous}
                  onChange={(e) => setKeepAnonymous(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#ffe70c] focus:ring-[#ffe70c]"
                />
                <div>
                  <p className="font-medium text-[#1B1A1A]">保持匿名顯示</p>
                  <p className="text-sm text-gray-500">
                    其他人只會看到「{content.anonymousName}」，不會看到你的帳號資訊
                  </p>
                </div>
              </label>

              {/* Error */}
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleClaim}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      認領這個故事
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  disabled={isProcessing}
                  className="w-full"
                >
                  不是我的，跳過
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Merge option */}
              <div className="mb-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-100">
                  <Merge className="h-7 w-7 text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-[#1B1A1A]">
                  你已經有人物誌了
                </h2>
                <p className="mt-2 text-gray-600">
                  要把匿名故事的內容合併到你現有的人物誌嗎？
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  onClick={handleMerge}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Merge className="mr-2 h-4 w-4" />
                      合併到我的人物誌
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  disabled={isProcessing}
                  className="w-full"
                >
                  保持分開，不合併
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

/**
 * 認領內容 Provider
 * 自動檢測並顯示認領提示
 */
export function ClaimContentProvider({ children }: { children: React.ReactNode }) {
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
        <ClaimContentModal
          isOpen={true}
          onClose={handleClose}
          unclaimedContent={unclaimedContent}
        />
      )}
    </>
  )
}
