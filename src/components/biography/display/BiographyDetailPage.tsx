'use client'

import { cn } from '@/lib/utils'
import type { BiographyV2 } from '@/lib/types/biography-v2'
import { BiographyHero } from './BiographyHero'
import { BiographyTags } from './BiographyTags'
import { BiographyOneLiners } from './BiographyOneLiners'
import { BiographyStories } from './BiographyStories'
import { BiographyFootprints } from './BiographyFootprints'
import { BiographyGallery } from './BiographyGallery'
import { EmptyState } from './EmptyState'

interface BiographyDetailPageProps {
  /** 人物誌資料 */
  biography: BiographyV2
  /** 是否為擁有者 */
  isOwner?: boolean
  /** 追蹤者數量變更回調 */
  onFollowerCountChange?: (count: number) => void
  /** 自訂樣式 */
  className?: string
}

/**
 * 檢查人物誌是否有任何內容
 */
function hasAnyContent(biography: BiographyV2): boolean {
  return (
    (biography.tags && biography.tags.length > 0) ||
    (biography.one_liners && biography.one_liners.length > 0) ||
    (biography.stories && biography.stories.length > 0) ||
    (biography.gallery_images && biography.gallery_images.length > 0) ||
    (biography.social_links &&
      Object.values(biography.social_links).some((v) => v && v.trim() !== ''))
  )
}

/**
 * 人物誌詳細頁組件
 *
 * 整合所有 V2 展示組件，按照 docs/persona-page-layout.md 規格排版
 *
 * 頁面結構：
 * 1. Hero Section - 封面圖 + 頭像 + 基本資訊 + 社群連結
 * 2. Identity Tags - 攀岩人格標籤
 * 3. Quick Intro - 一句話系列
 * 4. Stories - 深度故事
 * 5. Climbing Footprints - 攀岩足跡
 * 6. Gallery - 攀岩相簿
 */
export function BiographyDetailPage({
  biography,
  isOwner = false,
  onFollowerCountChange,
  className,
}: BiographyDetailPageProps) {
  // 處理隱私狀態
  const isPrivate = biography.visibility === 'private'
  const isAnonymous = biography.visibility === 'anonymous'

  // 如果是私密且不是擁有者，顯示空狀態
  if (isPrivate && !isOwner) {
    return (
      <div className={cn('min-h-screen bg-[#F5F5F5]', className)}>
        <div className="container mx-auto max-w-4xl px-4 py-16">
          <EmptyState
            type="locked"
            title="這位岩友的人物誌是私密的"
            description="他們可能正在準備中，或想保持低調"
            actionLabel="探索其他岩友的故事"
            actionHref="/biography"
          />
        </div>
      </div>
    )
  }

  // 檢查是否有內容
  const hasContent = hasAnyContent(biography)

  // 如果沒有內容且是擁有者，顯示引導
  if (!hasContent && isOwner) {
    return (
      <div className={cn('min-h-screen bg-[#F5F5F5]', className)}>
        {/* Hero Section 仍然顯示 */}
        <BiographyHero
          biography={biography}
          isOwner={isOwner}
          isAnonymous={isAnonymous}
          onFollowerCountChange={onFollowerCountChange}
        />

        <div className="container mx-auto max-w-4xl px-4 py-16">
          <EmptyState
            type="empty"
            title="開始記錄你的攀岩故事"
            description="每個人的故事都值得被記錄，跟你爬多難沒關係"
            actionLabel="開始記錄我的故事"
            actionHref="/profile"
          />
        </div>
      </div>
    )
  }

  // 如果沒有內容且不是擁有者
  if (!hasContent && !isOwner) {
    return (
      <div className={cn('min-h-screen bg-[#F5F5F5]', className)}>
        <BiographyHero
          biography={biography}
          isOwner={isOwner}
          isAnonymous={isAnonymous}
          onFollowerCountChange={onFollowerCountChange}
        />

        <div className="container mx-auto max-w-4xl px-4 py-16">
          <EmptyState
            type="empty"
            title="這裡還沒有任何故事"
            description="這位岩友還沒有分享他們的攀岩故事"
            actionLabel="探索其他岩友的故事"
            actionHref="/biography"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('min-h-screen bg-[#F5F5F5]', className)}>
      {/* 1. Hero Section */}
      <BiographyHero
        biography={biography}
        isOwner={isOwner}
        isAnonymous={isAnonymous}
        onFollowerCountChange={onFollowerCountChange}
      />

      {/* 內容區塊 */}
      <div className="container mx-auto max-w-4xl px-4">
        {/* 2. Identity Tags - 攀岩人格標籤 */}
        <BiographyTags biography={biography} />

        {/* 3. Quick Intro - 一句話系列 */}
        <BiographyOneLiners biography={biography} />

        {/* 4. Stories - 深度故事 */}
        <BiographyStories biography={biography} />

        {/* 5. Climbing Footprints - 攀岩足跡 */}
        <BiographyFootprints biography={biography} />

        {/* 6. Gallery - 攀岩相簿 */}
        <BiographyGallery biography={biography} />

        {/* 底部間距 */}
        <div className="h-16" />
      </div>
    </div>
  )
}

export default BiographyDetailPage
