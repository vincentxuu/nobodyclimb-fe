'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { BiographyV2 } from '@/lib/types/biography-v2'

interface BiographyHeroProps {
  /** 人物誌資料 */
  biography: BiographyV2
  /** 是否為編輯模式 */
  editable?: boolean
  /** 是否顯示追蹤和分享按鈕 */
  showActions?: boolean
  /** 追蹤回調 */
  onFollow?: () => void
  /** 分享回調 */
  onShare?: () => void
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
  editable = false,
  showActions = true,
  onFollow,
  onShare,
  className,
}: BiographyHeroProps) {
  const climbingYears = biography.climbing_start_year
    ? new Date().getFullYear() - biography.climbing_start_year
    : null

  const isAnonymous = biography.visibility === 'anonymous'

  return (
    <div className={cn('relative', className)}>
      {/* Cover Image */}
      <div className="relative w-full aspect-[3/1] md:aspect-[4/1] bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden">
        {biography.cover_image && (
          <Image
            src={biography.cover_image}
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
          <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white bg-gray-100 shadow-lg overflow-hidden">
            {isAnonymous ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-200 text-4xl md:text-5xl">
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
              <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-2xl md:text-3xl font-bold">
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {isAnonymous ? '匿名岩友' : biography.name}
            </h1>

            {/* Title/Tagline */}
            {biography.title && (
              <p className="text-lg md:text-xl text-gray-600">
                「{biography.title}」
              </p>
            )}

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              {climbingYears !== null && (
                <span className="flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  攀岩第 {climbingYears + 1} 年
                </span>
              )}

              {biography.home_gym && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="w-4 h-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    主場：{biography.home_gym}
                  </span>
                </>
              )}

              {biography.frequent_locations &&
                biography.frequent_locations.length > 0 && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="flex items-center gap-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z" />
                      </svg>
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
                className="px-4 py-2 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                追蹤
              </button>
              <button
                onClick={onShare}
                className="p-2 rounded-full border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
                aria-label="分享"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="w-5 h-5"
                >
                  <path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.475l6.733-3.366A2.52 2.52 0 0113 4.5z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BiographyHero
