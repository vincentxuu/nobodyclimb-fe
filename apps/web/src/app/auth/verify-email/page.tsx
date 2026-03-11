'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Mail, MailOpen } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/page-transition'
import { authService } from '@/lib/api/services'
import { useAuthStore } from '@/store/authStore'

type VerifyState = 'loading' | 'success' | 'error' | 'pending'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const { user } = useAuthStore()

  const [state, setState] = useState<VerifyState>(token ? 'loading' : 'pending')
  const [errorMessage, setErrorMessage] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const verifyToken = useCallback(async (t: string) => {
    try {
      const result = await authService.verifyEmail(t)
      if (result.success) {
        setState('success')
      } else {
        setState('error')
        setErrorMessage(result.message || '驗證失敗')
      }
    } catch (error: unknown) {
      setState('error')
      const apiError = error as { response?: { data?: { message?: string } } }
      setErrorMessage(
        apiError?.response?.data?.message || '驗證連結無效或已過期，請重新發送驗證信'
      )
    }
  }, [])

  useEffect(() => {
    if (token) {
      verifyToken(token)
    }
  }, [token, verifyToken])

  const handleResend = async () => {
    setIsResending(true)
    setResendSuccess(false)
    setErrorMessage('')
    try {
      const result = await authService.sendVerificationEmail()
      if (result.success) {
        setResendSuccess(true)
      } else {
        setErrorMessage(result.message || '發送失敗，請稍後再試')
      }
    } catch (error: unknown) {
      const apiError = error as { response?: { status?: number; data?: { message?: string } } }
      if (apiError?.response?.status === 429) {
        setErrorMessage('請等候 60 秒後再重新發送')
      } else {
        setErrorMessage(apiError?.response?.data?.message || '發送失敗，請稍後再試')
      }
    } finally {
      setIsResending(false)
    }
  }

  const userEmail = user?.email
    ? user.email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + b.replace(/./g, '*') + c)
    : ''

  return (
    <PageTransition>
      <div className="container flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-md space-y-6 text-center">
          {/* 驗證 token 中 */}
          {state === 'loading' && (
            <>
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
              <h1 className="text-2xl font-bold">驗證中...</h1>
              <p className="text-muted-foreground">正在驗證你的信箱，請稍候</p>
            </>
          )}

          {/* 驗證成功 */}
          {state === 'success' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle className="h-10 w-10 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold">信箱驗證成功！</h1>
              <p className="text-muted-foreground">
                你的電子信箱已完成驗證，現在可以使用所有功能了。
              </p>
              <Button onClick={() => router.push('/')} className="w-full">
                前往首頁
              </Button>
            </>
          )}

          {/* 驗證 token 失敗 */}
          {state === 'error' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold">驗證失敗</h1>
              <p className="text-muted-foreground">{errorMessage}</p>
              {resendSuccess && (
                <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
                  驗證信已重新發送，請查收信箱
                </div>
              )}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleResend}
                  disabled={isResending || resendSuccess}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      發送中...
                    </>
                  ) : (
                    '重新發送驗證信'
                  )}
                </Button>
                <Button asChild className="w-full">
                  <Link href="/">返回首頁</Link>
                </Button>
              </div>
            </>
          )}

          {/* 尚未驗證（登入/註冊後跳轉至此） */}
          {state === 'pending' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                <MailOpen className="h-10 w-10 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold">請驗證你的信箱</h1>
              <p className="text-muted-foreground">
                我們已將驗證信寄送到{userEmail ? <span className="font-medium text-foreground"> {userEmail}</span> : '你的信箱'}，
                請點擊信件中的連結完成驗證。
              </p>
              <p className="text-sm text-muted-foreground">
                沒收到信嗎？請檢查垃圾信件匣，或點擊下方按鈕重新發送。
              </p>

              {errorMessage && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {errorMessage}
                </div>
              )}

              {resendSuccess && (
                <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
                  驗證信已重新發送，請查收信箱
                </div>
              )}

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleResend}
                  disabled={isResending || resendSuccess}
                  variant="outline"
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      發送中...
                    </>
                  ) : (
                    '重新發送驗證信'
                  )}
                </Button>
                <Button asChild variant="ghost" className="w-full text-muted-foreground">
                  <Link href="/">稍後再驗證，先逛逛</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
