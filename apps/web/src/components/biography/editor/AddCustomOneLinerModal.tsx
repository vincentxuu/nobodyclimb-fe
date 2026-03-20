'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { X, Loader2, MessageCircle } from 'lucide-react'
import type { OneLinerQuestion, ContentSource } from '@/lib/types/biography-v2'

interface AddCustomOneLinerModalProps {
  /** 是否開啟 */
  isOpen: boolean
  /** 關閉回調 */
  onClose: () => void
  /** 儲存回調 */
  onSave: (_question: OneLinerQuestion) => void
  /** 是否正在儲存 */
  isSaving?: boolean
  /** 自訂樣式 */
  className?: string
}

/**
 * 新增自訂一句話問題 Modal
 *
 * 用於用戶新增自訂一句話問題
 */
export function AddCustomOneLinerModal({
  isOpen,
  onClose,
  onSave,
  isSaving = false,
  className,
}: AddCustomOneLinerModalProps) {
  const t = useTranslations('BiographyEditor')
  const [question, setQuestion] = useState('')
  const [formatHint, setFormatHint] = useState('')
  const [placeholder, setPlaceholder] = useState('')

  // 重置表單狀態
  useEffect(() => {
    if (isOpen) {
      setQuestion('')
      setFormatHint('')
      setPlaceholder('')
    }
  }, [isOpen])

  const handleSave = () => {
    if (!question.trim()) return

    const newQuestion: OneLinerQuestion = {
      id: `usr_ol_${Date.now()}`,
      source: 'user' as ContentSource,
      question: question.trim().endsWith('？') ? question.trim() : `${question.trim()}？`,
      format_hint: formatHint.trim() || null,
      placeholder: placeholder.trim() || t('answerInputPlaceholder'),
      order: 999,
    }

    onSave(newQuestion)
  }

  if (!isOpen) return null

  const canSave = question.trim().length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-brand-dark/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative bg-white w-full md:max-w-md md:rounded-lg rounded-t-2xl max-h-[90vh] flex flex-col',
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#EBEAEA]">
          <div className="flex items-center gap-2">
            <MessageCircle size={20} className="text-[#3F3D3D]" />
            <h3 className="font-semibold text-[#1B1A1A]">{t('addCustomOneLinerTitle')}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#6D6C6C] hover:text-[#1B1A1A] hover:bg-[#F5F5F5] rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 問題文字 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1B1A1A]">
              {t('oneLinerQuestionLabel')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={t('oneLinerQuestionPlaceholder')}
              className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors text-[#1B1A1A] placeholder:text-[#9D9D9D]"
              maxLength={50}
            />
            <p className="text-xs text-[#8E8C8C]">
              {t('oneLinerQuestionHint')}
            </p>
          </div>

          {/* 格式引導 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1B1A1A]">
              {t('oneLinerFormatHintLabel')} <span className="text-[#8E8C8C]">{t('oneLinerFormatHintOptional')}</span>
            </label>
            <input
              type="text"
              value={formatHint}
              onChange={(e) => setFormatHint(e.target.value)}
              placeholder={t('oneLinerFormatHintPlaceholder')}
              className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors text-[#1B1A1A] placeholder:text-[#9D9D9D]"
              maxLength={30}
            />
            <p className="text-xs text-[#8E8C8C]">
              {t('oneLinerFormatHintHint')}
            </p>
          </div>

          {/* 範例答案 */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#1B1A1A]">
              {t('oneLinerExampleLabel')} <span className="text-[#8E8C8C]">{t('oneLinerExampleOptional')}</span>
            </label>
            <input
              type="text"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              placeholder={t('oneLinerExamplePlaceholder')}
              className="w-full px-4 py-3 bg-white border border-[#B6B3B3] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-dark transition-colors text-[#1B1A1A] placeholder:text-[#9D9D9D]"
              maxLength={50}
            />
            <p className="text-xs text-[#8E8C8C]">
              {t('oneLinerExampleHint')}
            </p>
          </div>

          {/* 預覽 */}
          {question.trim() && (
            <div className="bg-[#F5F5F5] rounded-lg p-4 space-y-3">
              <p className="text-sm text-[#6D6C6C]">{t('oneLinerPreviewLabel')}</p>
              <div className="bg-white rounded-lg p-4 space-y-2">
                <p className="font-medium text-[#1B1A1A]">
                  {question.trim().endsWith('？') ? question.trim() : `${question.trim()}？`}
                </p>
                {formatHint.trim() && (
                  <p className="text-sm text-[#8E8C8C]">{formatHint.trim()}</p>
                )}
                <div className="pt-2 border-t border-[#EBEAEA]">
                  <p className="text-sm text-[#B6B3B3] italic">
                    {placeholder.trim() || t('answerInputPlaceholder')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 提示 */}
          <div className="bg-brand-accent/10 rounded-lg p-4">
            <p className="text-sm text-[#3F3D3D]">
              {t('oneLinerTip')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#EBEAEA] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-[#B6B3B3] text-[#3F3D3D] rounded-lg font-medium hover:bg-[#F5F5F5] transition-colors"
          >
            {t('cancelButton')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className={cn(
              'flex-1 px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
              canSave
                ? 'bg-brand-dark text-white hover:bg-brand-dark-hover'
                : 'bg-[#EBEAEA] text-[#B6B3B3] cursor-not-allowed'
            )}
          >
            {isSaving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {t('addingStatus')}
              </>
            ) : (
              t('addOneLinerButton')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AddCustomOneLinerModal
