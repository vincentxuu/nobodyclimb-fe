'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary 組件
 *
 * 捕捉子組件中的 JavaScript 錯誤，防止整個應用程式崩潰。
 * 當錯誤發生時顯示備用 UI，並提供重試選項。
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 記錄錯誤到 console（生產環境可整合 Sentry 等服務）
    console.error('ErrorBoundary caught an error:', error)
    console.error('Component stack:', errorInfo.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // 如果有自訂 fallback，使用它
      const FallbackComponent = this.props.fallback
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error!} reset={this.handleReset} />
      }

      // 預設的錯誤 UI
      return <DefaultErrorFallback error={this.state.error} onReset={this.handleReset} onReload={this.handleReload} />
    }

    return this.props.children
  }
}

/**
 * 預設的錯誤顯示畫面
 */
function DefaultErrorFallback({
  error,
  onReset,
  onReload,
}: {
  error: Error | null
  onReset: () => void
  onReload: () => void
}) {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <h1 className="mb-2 text-2xl font-bold">發生錯誤</h1>
        <p className="mb-6 text-muted-foreground">抱歉，頁面發生了一些問題。請嘗試重新載入或稍後再試。</p>

        {/* 開發環境顯示錯誤詳情 */}
        {isDevelopment && error && (
          <div className="mb-6 rounded-lg bg-muted p-4 text-left">
            <p className="mb-2 font-mono text-sm font-semibold text-destructive">{error.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{error.message}</p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={onReset} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            重試
          </Button>
          <Button onClick={onReload} className="gap-2">
            重新載入頁面
          </Button>
        </div>
      </div>
    </div>
  )
}
