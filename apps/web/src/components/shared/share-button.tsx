'use client'

import { Check, Link2, MessageCircle, Share } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface ShareButtonProps {
  url?: string
  title?: string
  description?: string
  className?: string
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'md' | 'lg' | 'icon'
  iconSize?: number
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
  iconSize,
}: ShareButtonProps) {
  const t = useTranslations('SharedUI')
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
        title: t('shareCopiedTitle'),
        description: t('shareCopiedDescription'),
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      toast({
        title: t('shareCopyFailedTitle'),
        description: t('shareCopyFailedDescription'),
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
  const supportsNativeShare = typeof navigator !== 'undefined' && navigator.share !== undefined

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={cn(className)}>
          <Share size={iconSize || 16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {supportsNativeShare && (
          <>
            <DropdownMenuItem onClick={handleNativeShare}>
              <Share className="mr-2 h-4 w-4" />
              <span>{t('shareNative')}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem onClick={handleCopyLink}>
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-600" />
              <span className="text-green-600">{t('shareCopied')}</span>
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-4 w-4" />
              <span>{t('shareCopyLink')}</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleShareFacebook}>
          <Share className="mr-2 h-4 w-4 text-blue-600" />
          <span>{t('shareTo', { platform: 'Facebook' })}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleShareTwitter}>
          <Share className="mr-2 h-4 w-4 text-sky-500" />
          <span>{t('shareTo', { platform: 'X (Twitter)' })}</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleShareLine}>
          <MessageCircle className="mr-2 h-4 w-4 text-green-500" />
          <span>{t('shareTo', { platform: 'LINE' })}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
