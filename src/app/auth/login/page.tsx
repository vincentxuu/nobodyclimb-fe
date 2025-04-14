'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Mail, Lock, ArrowRight, LogIn } from 'lucide-react'
import { useAuth } from '@/lib/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { PageTransition } from '@/components/shared/page-transition'

/**
 * 登入頁面組件
 */
export default function LoginPage() {
  const router = useRouter()
  const { login, loginWithGoogle, loading, isAuthenticated } = useAuth()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  
  // 處理表單提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      const result = await login(email, password)
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
  
  // 處理Google登入
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle()
      // 重定向已在 loginWithGoogle 中處理
    } catch (err) {
      console.error('Google登入失敗', err)
      setError('Google登入過程中發生錯誤')
    }
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
                    className="w-full rounded-md border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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
                    className="w-full rounded-md border border-input bg-background pl-10 pr-10 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? '隱藏密碼' : '顯示密碼'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="flex justify-end">
                  <Link
                    href="/auth/reset-password"
                    className="text-xs text-muted-foreground hover:text-primary hover:underline"
                  >
                    忘記密碼?
                  </Link>
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? '登入中...' : '登入'}
                <LogIn className="ml-2 h-4 w-4" />
              </Button>
            </form>
            
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-border"></div>
              <div className="mx-4 text-xs text-muted-foreground">或</div>
              <div className="flex-grow border-t border-border"></div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <svg
                className="mr-2 h-4 w-4"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
              </svg>
              使用 Google 登入
            </Button>
            
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
