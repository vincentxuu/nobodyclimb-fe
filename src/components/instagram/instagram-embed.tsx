'use client'

import { useEffect, useRef, useState } from 'react'

interface InstagramEmbedProps {
  /**
   * Instagram 貼文 URL
   * 例如: https://www.instagram.com/p/DQ0D25cE4Wa/
   */
  url: string
  /**
   * 寬度（預設 540px）
   */
  width?: number
  /**
   * 高度（預設 700px）
   */
  height?: number
  /**
   * 是否顯示 caption（預設 true）
   */
  captioned?: boolean
  /**
   * 自訂 className
   */
  className?: string
}

/**
 * Instagram 貼文嵌入元件
 *
 * 使用 iframe 方式嵌入 Instagram 貼文，這是最可靠的方法
 *
 * @example
 * ```tsx
 * <InstagramEmbed url="https://www.instagram.com/p/DQ0D25cE4Wa/" />
 * ```
 */
export default function InstagramEmbed({
  url,
  width = 540,
  height = 700,
  // eslint-disable-next-line no-unused-vars
  captioned: _captioned = true,
  className = ''
}: InstagramEmbedProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // 從 URL 提取 shortcode
  const getShortcode = (instagramUrl: string): string | null => {
    const match = instagramUrl.match(/instagram\.com\/p\/([A-Za-z0-9_-]+)/)
    return match ? match[1] : null
  }

  const shortcode = getShortcode(url)
  const embedUrl = shortcode ? `https://www.instagram.com/p/${shortcode}/embed/` : null

  useEffect(() => {
    // 重置狀態
    setIsLoading(true)
    setHasError(false)

    // 設定載入超時 - 使用 functional update 避免依賴 isLoading
    const timeout = setTimeout(() => {
      setIsLoading((current) => {
        if (current) {
          return false
        }
        return current
      })
    }, 5000)

    return () => clearTimeout(timeout)
  }, [url])

  const handleLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
  }

  if (!embedUrl) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="text-center">
          <p className="text-sm font-medium text-red-800">無效的 Instagram URL</p>
          <p className="mt-1 text-xs text-red-600">請確認 URL 格式正確</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`instagram-embed-container ${className}`}>
      {/* 載入中狀態 */}
      {isLoading && (
        <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50 p-6">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-3 text-sm text-gray-600">載入 Instagram 貼文中...</p>
          </div>
        </div>
      )}

      {/* 錯誤狀態 */}
      {hasError && (
        <div className="flex items-center justify-center rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-yellow-800">無法載入 Instagram 貼文</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              在 Instagram 上查看 →
            </a>
          </div>
        </div>
      )}

      {/* Instagram iframe */}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        width={width}
        height={height}
        frameBorder="0"
        scrolling="no"
        allow="encrypted-media"
        onLoad={handleLoad}
        onError={handleError}
        className={`instagram-embed-iframe rounded-lg ${isLoading || hasError ? 'hidden' : 'block'}`}
        style={{
          border: '1px solid #dbdbdb',
          borderRadius: '3px',
          boxShadow: '0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)',
          maxWidth: '540px',
          width: '100%',
          margin: '0 auto',
          display: isLoading || hasError ? 'none' : 'block'
        }}
        title={`Instagram post ${shortcode}`}
      />
    </div>
  )
}
