'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * 全域錯誤頁面（Next.js App Router）
 *
 * 處理路由級別的錯誤，包括：
 * - 伺服器端錯誤
 * - 客戶端導航錯誤
 * - 資料獲取錯誤
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  useEffect(() => {
    // 記錄錯誤（生產環境可整合 Sentry 等服務）
    console.error('Route error:', error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold">頁面發生錯誤</h1>
        <p className="mb-6 text-muted-foreground">抱歉，載入此頁面時發生問題。請嘗試重新載入或返回首頁。</p>

        {/* 開發環境顯示錯誤詳情 */}
        {isDevelopment && (
          <div className="mb-6 rounded-lg bg-muted p-4 text-left">
            <p className="mb-2 font-mono text-sm font-semibold text-destructive">{error.name}</p>
            <p className="mb-2 font-mono text-xs text-muted-foreground">{error.message}</p>
            {error.digest && <p className="font-mono text-xs text-muted-foreground/60">Digest: {error.digest}</p>}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={reset} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            重試
          </Button>
          <Button asChild className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              返回首頁
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
