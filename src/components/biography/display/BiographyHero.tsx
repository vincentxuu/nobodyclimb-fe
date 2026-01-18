'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Clock, MapPin, BarChart3, Share2 } from 'lucide-react'
import type { BiographyV2 } from '@/lib/types/biography-v2'

interface BiographyHeroProps {
  /** 人物誌資料 */
  biography: BiographyV2
  /** 是否為擁有者 */
  isOwner?: boolean
  /** 是否為匿名模式 (覆蓋 visibility 判斷) */
  isAnonymous?: boolean
  /** 是否顯示追蹤和分享按鈕 */
  showActions?: boolean
  /** 追蹤回調 */
  onFollow?: () => void
  /** 分享回調 */
  onShare?: () => void
  /** 追蹤者數量變更回調 */
  onFollowerCountChange?: (count: number) => void
  /** 自訂樣式 */
  className?: string
}

/**
 * Hero 區塊組件
 *
 * 顯示封面圖、頭像、名稱、標語、基本資訊
 */
export function BiographyHero({
  biography,
  isOwner = false,
  isAnonymous: isAnonymousProp,
  showActions = true,
  onFollow,
  onShare,
  onFollowerCountChange,
  className,
}: BiographyHeroProps) {
  // 使用 prop 覆蓋或從 visibility 判斷
  const isAnonymous = isAnonymousProp ?? biography.visibility === 'anonymous'

  // 計算攀岩年資
  const climbingYears = biography.climbing_years

  return (
    <div className={cn('relative', className)}>
      {/* Cover Image */}
      <div className="relative w-full aspect-[3/1] md:aspect-[4/1] bg-gradient-to-br from-[#EBEAEA] to-[#DBD8D8] overflow-hidden">
        {biography.cover_url && (
          <Image
            src={biography.cover_url}
            alt="封面圖片"
            fill
            className="object-cover"
            priority
          />
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>

      {/* Profile Info Container */}
      <div className="relative px-4 md:px-8 pb-6">
        {/* Avatar - positioned to overlap cover */}
        <div className="absolute -top-12 md:-top-16 left-4 md:left-8">
          <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-[#EBEAEA] shadow-lg overflow-hidden">
            {isAnonymous ? (
              <div className="w-full h-full flex items-center justify-center bg-[#DBD8D8] text-4xl md:text-5xl">
                🎭
              </div>
            ) : biography.avatar_url ? (
              <Image
                src={biography.avatar_url}
                alt={biography.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-brand-accent/20 text-brand-dark text-2xl md:text-3xl font-bold">
                {biography.name?.charAt(0) || '?'}
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="pt-16 md:pt-20 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          {/* Left: Name & Info */}
          <div className="space-y-2">
            {/* Name */}
            <h1 className="text-2xl md:text-3xl font-bold text-[#1B1A1A]">
              {isAnonymous ? '匿名岩友' : biography.name}
            </h1>

            {/* Title/Tagline */}
            {biography.title && (
              <p className="text-lg md:text-xl text-[#6D6C6C]">
                「{biography.title}」
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-[#6D6C6C]">
              {climbingYears !== null && climbingYears > 0 && (
                <span className="flex items-center gap-1">
                  <Clock size={16} />
                  攀岩第 {climbingYears} 年
                </span>
              )}

              {biography.home_gym && (
                <>
                  <span className="text-[#B6B3B3]">·</span>
                  <span className="flex items-center gap-1">
                    <MapPin size={16} />
                    主場：{biography.home_gym}
                  </span>
                </>
              )}

              {biography.frequent_locations &&
                biography.frequent_locations.length > 0 && (
                  <>
                    <span className="text-[#B6B3B3]">·</span>
                    <span className="flex items-center gap-1">
                      <BarChart3 size={16} />
                      常出沒：{biography.frequent_locations.join('、')}
                    </span>
                  </>
                )}
            </div>
          </div>

          {/* Right: Actions */}
          {showActions && !isAnonymous && (
            <div className="flex items-center gap-2">
              <button
                onClick={onFollow}
                className="px-4 py-2 rounded-full bg-brand-dark text-white font-medium hover:bg-brand-dark-hover transition-colors"
              >
                追蹤
              </button>
              <button
                onClick={onShare}
                className="p-2 rounded-full border border-[#B6B3B3] text-[#6D6C6C] hover:bg-[#F5F5F5] transition-colors"
                aria-label="分享"
              >
                <Share2 size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BiographyHero
