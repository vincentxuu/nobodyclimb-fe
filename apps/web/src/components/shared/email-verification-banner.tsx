'use client'

import { useState } from 'react'
import { Mail, X, Loader2 } from 'lucide-react'
import { authService } from '@/lib/api/services'
import { useAuthStore } from '@/store/authStore'

/**
 * 信箱驗證提醒 Banner
 *
 * 當用戶已登入但信箱尚未驗證時顯示
 */
export function EmailVerificationBanner() {
  const { user, status } = useAuthStore()
  const [dismissed, setDismissed] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendResult, setResendResult] = useState<'success' | 'error' | null>(null)

  // 不顯示條件：未登入、已驗證、已關閉
  if (status !== 'signIn' || !user || user.emailVerified || dismissed) {
    return null
  }

  const handleResend = async () => {
    setIsResending(true)
    setResendResult(null)
    try {
      const result = await authService.sendVerificationEmail()
      setResendResult(result.success ? 'success' : 'error')
    } catch {
      setResendResult('error')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="relative border-b border-amber-200 bg-amber-50 px-4 py-2.5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <Mail className="h-4 w-4 shrink-0" />
          <span>
            {resendResult === 'success'
              ? '驗證信已發送，請查收你的信箱'
              : resendResult === 'error'
                ? '發送失敗，請稍後再試'
                : '你的信箱尚未驗證，部分功能可能受限。'}
          </span>
          {resendResult !== 'success' && (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="shrink-0 font-medium underline hover:no-underline disabled:opacity-50"
            >
              {isResending ? (
                <Loader2 className="inline h-3.5 w-3.5 animate-spin" />
              ) : (
                '發送驗證信'
              )}
            </button>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 text-amber-600 hover:text-amber-800"
          aria-label="關閉"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
