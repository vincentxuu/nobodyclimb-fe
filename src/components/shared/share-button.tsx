'use client'

import { useState } from 'react'
import { Share, Link2, Check, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface ShareButtonProps {
  url?: string
  title?: string
  description?: string
  className?: string
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'md' | 'lg' | 'icon'
}

/**
 * 分享按鈕組件
 * 支援複製連結、分享到社群媒體
 */
export function ShareButton({
  url,
  title = '',
  description = '',
  className,
  variant = 'ghost',
  size = 'sm',
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  // 使用當前頁面 URL 如果沒有提供
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(title)

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast({
        title: '已複製連結',
        description: '分享連結已複製到剪貼簿',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      toast({
        title: '複製失敗',
        description: '無法複製連結，請手動複製',
        variant: 'destructive',
      })
    }
  }

  const handleShareFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
    window.open(facebookUrl, '_blank', 'width=600,height=400')
  }

  const handleShareTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
  }

  const handleShareLine = () => {
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`
    window.open(lineUrl, '_blank', 'width=600,height=400')
  }

  // 使用 Web Share API（行動裝置原生分享）
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        })
      } catch (error) {
        // 用戶取消分享，不需要顯示錯誤
        if ((error as Error).name !== 'AbortError') {
          console.error('Share failed:', error)
        }
      }
    }
  }

  // 檢查是否支援原生分享
  const supportsNativeShare =
    typeof navigator !== 'undefined' && navigator.share !== undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={cn('gap-2', className)}>
          <Share className="h-4 w-4" />
          {size !== 'icon'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {supportsNativeShare && (
          <>
            <DropdownMenuItem onClick={handleNativeShare}>
              <Share className="mr-2 h-4 w-4" />
              <span>分享...</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-600" />
              <span className="text-green-600">已複製</span>
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-4 w-4" />
              <span>複製連結</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleShareFacebook}>
          <Share className="mr-2 h-4 w-4 text-blue-600" />
          <span>分享到 Facebook</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleShareTwitter}>
          <Share className="mr-2 h-4 w-4 text-sky-500" />
          <span>分享到 X (Twitter)</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleShareLine}>
          <MessageCircle className="mr-2 h-4 w-4 text-green-500" />
          <span>分享到 LINE</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
