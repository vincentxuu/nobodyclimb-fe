'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/page-transition'
import { authService } from '@/lib/api/services'

type VerifyState = 'loading' | 'success' | 'error' | 'no-token'

export default function VerifyEmailPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [state, setState] = useState<VerifyState>(token ? 'loading' : 'no-token')
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
    try {
      const result = await authService.sendVerificationEmail()
      if (result.success) {
        setResendSuccess(true)
      } else {
        setErrorMessage(result.message || '發送失敗，請稍後再試')
      }
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } }
      setErrorMessage(apiError?.response?.data?.message || '發送失敗，請稍後再試')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <PageTransition>
      <div className="container flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-md space-y-6 text-center">
          {/* 驗證中 */}
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

          {/* 驗證失敗 */}
          {state === 'error' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-10 w-10 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold">驗證失敗</h1>
              <p className="text-muted-foreground">{errorMessage}</p>
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
                  ) : resendSuccess ? (
                    '驗證信已發送，請查收信箱'
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

          {/* 沒有 token（直接訪問頁面） */}
          {state === 'no-token' && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Mail className="h-10 w-10 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-bold">信箱驗證</h1>
              <p className="text-muted-foreground">
                如果你還沒收到驗證信，可以點擊下方按鈕重新發送。
              </p>
              {resendSuccess && (
                <div className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">
                  驗證信已發送，請查收你的信箱
                </div>
              )}
              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleResend}
                  disabled={isResending || resendSuccess}
                  className="w-full"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      發送中...
                    </>
                  ) : resendSuccess ? (
                    '已發送'
                  ) : (
                    '發送驗證信'
                  )}
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/">返回首頁</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </PageTransition>
  )
}
