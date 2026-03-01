'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight, LogIn } from 'lucide-react'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { useAuth } from '@/lib/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/page-transition'
import { GOOGLE_CLIENT_ID } from '@/lib/constants'

/**
 * 登入頁面組件
 */
export default function LoginPage() {
  const router = useRouter()
  const { signIn, signInWithGoogle, isLoading } = useAuth()
  const { status } = useAuthStore()

  // 已登入用戶自動重導向到首頁
  useEffect(() => {
    if (status === 'signIn') {
      router.replace('/')
    }
  }, [status, router])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const result = await signIn(email, password)
      if (result.success) {
        router.push('/')
      } else {
        setError(result.error || '登入失敗，請檢查您的帳號密碼')
      }
    } catch (err) {
      console.error('登入失敗', err)
      setError('登入過程中發生錯誤')
    }
  }

  // 處理Google登入成功
  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        setError('無法取得 Google 認證資訊')
        return
      }

      const result = await signInWithGoogle(credentialResponse.credential)
      if (result.success) {
        // 新用戶跳轉到 profile-setup，舊用戶跳轉到首頁
        if (result.isNewUser) {
          router.push('/auth/profile-setup/basic-info')
        } else {
          router.push('/')
        }
      } else {
        setError(result.error || 'Google 登入失敗')
      }
    } catch (err) {
      console.error('Google登入失敗', err)
      setError('Google登入過程中發生錯誤')
    }
  }

  // 處理Google登入失敗
  const handleGoogleError = () => {
    setError('Google 登入失敗，請稍後再試')
  }

  return (
    <PageTransition>
      <div className="container flex min-h-[calc(100vh-14rem)] flex-col items-center justify-center px-4 py-12">
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">歡迎回來</h1>
            <p className="text-muted-foreground">登入您的帳號以繼續</p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-center text-sm text-destructive">
              {error}
              <button
                onClick={() => setError('')}
                className="ml-2 underline hover:no-underline"
                aria-label="關閉錯誤提示"
              >
                清除
              </button>
            </div>
          )}

          <div className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="電子郵件"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="密碼"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-md border border-input bg-background py-2 pl-10 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-muted-foreground hover:text-primary hover:underline"
                  >
                    忘記密碼?
                  </Link>
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? '登入中...' : '登入'}
                <LogIn className="ml-2 h-4 w-4" />
              </Button>
            </form>

            {GOOGLE_CLIENT_ID && (
              <>
                <div className="relative flex items-center">
                  <div className="flex-grow border-t border-border"></div>
                  <div className="mx-4 text-xs text-muted-foreground">或</div>
                  <div className="flex-grow border-t border-border"></div>
                </div>

                <div className="flex justify-center">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                    theme="outline"
                    size="large"
                    width={320}
                    text="signin_with"
                    shape="rectangular"
                  />
                </div>
              </>
            )}

            <div className="text-center text-sm">
              <span className="text-muted-foreground">還沒有帳號？</span>{' '}
              <Link href="/auth/register" className="font-medium text-primary hover:underline">
                立即註冊
                <ArrowRight className="ml-1 inline-block h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
