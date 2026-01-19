'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Clock, BarChart3, Globe, Eye, Users, MessageCircle } from 'lucide-react'
import type { BiographyV2, SocialLinks } from '@/lib/types/biography-v2'
import { FollowButton } from '../follow-button'
import { BiographyLikeButton } from '../biography-like-button'
import { ShareButton } from '@/components/shared/share-button'
import { BiographyCommentSection } from '../biography-comment-section'

// 社群平台圖示
const SocialIcon: Record<keyof SocialLinks, React.ReactNode> = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  threads: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.432 1.781 3.632 2.695 6.54 2.717 1.076-.007 2.097-.137 3.035-.388 2.272-.607 4.034-1.834 5.24-3.65.734-1.105 1.165-2.22 1.317-3.412.064-.505.058-1.017-.02-1.524-.136-.886-.474-1.653-1.047-2.362-.573-.71-1.298-1.253-2.164-1.618-.867-.366-1.833-.551-2.877-.551-.7 0-1.297.07-1.776.208-.52.151-.967.377-1.332.674-.371.301-.649.653-.83 1.048-.16.349-.242.699-.241 1.04.001.193.02.378.055.557.108.545.347 1.021.715 1.42.381.413.875.731 1.472.947.556.2 1.15.306 1.766.315.74-.007 1.399-.124 1.96-.347.46-.182.866-.444 1.211-.779.345-.336.619-.734.816-1.184.133-.301.229-.614.288-.935l2.006.46c-.102.519-.272 1.023-.508 1.506-.355.727-.824 1.37-1.398 1.914-.573.544-1.253.967-2.024 1.26-.815.31-1.735.474-2.737.487h-.062c-.817-.009-1.615-.133-2.372-.37-.812-.253-1.537-.633-2.155-1.13-.628-.505-1.143-1.133-1.53-1.869-.395-.751-.609-1.592-.637-2.498v-.006c.026-.7.158-1.354.395-1.95.237-.596.564-1.127.976-1.58.412-.453.907-.832 1.474-1.129.567-.297 1.19-.504 1.855-.616.664-.112 1.362-.154 2.076-.126 1.299.051 2.506.299 3.588.737 1.082.438 2.015 1.078 2.77 1.902.755.824 1.303 1.814 1.628 2.94.17.588.267 1.2.29 1.82.033.885-.113 1.76-.434 2.6-.32.84-.785 1.62-1.381 2.32-1.42 1.669-3.518 2.772-6.239 3.28-1.071.2-2.212.304-3.396.309z" />
    </svg>
  ),
  website: <Globe size={16} />,
}

// 建立社群連結 URL
function getSocialUrl(platform: keyof SocialLinks, value: string): string {
  switch (platform) {
    case 'instagram':
      return value.startsWith('http')
        ? value
        : `https://instagram.com/${value.replace('@', '')}`
    case 'youtube':
      return value.startsWith('http')
        ? value
        : `https://youtube.com/@${value.replace('@', '')}`
    case 'facebook':
      return value.startsWith('http')
        ? value
        : `https://facebook.com/${value}`
    case 'threads':
      return value.startsWith('http')
        ? value
        : `https://threads.net/@${value.replace('@', '')}`
    case 'website':
      return value.startsWith('http') ? value : `https://${value}`
    default:
      return value
  }
}

interface BiographyHeroProps {
  /** 人物誌資料 */
  biography: BiographyV2
  /** 是否為擁有者 */
  isOwner?: boolean
  /** 是否為匿名模式 (覆蓋 visibility 判斷) */
  isAnonymous?: boolean
  /** 是否顯示追蹤和分享按鈕 */
  showActions?: boolean
  /** 追蹤者數量變更回調 */
  onFollowerCountChange?: (_count: number) => void
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
  onFollowerCountChange,
  className,
}: BiographyHeroProps) {
  // 使用 prop 覆蓋或從 visibility 判斷
  const isAnonymous = isAnonymousProp ?? biography.visibility === 'anonymous'

  // 計算攀岩年資
  const climbingYears = biography.climbing_years

  // 按讚數狀態
  const [likesCount, setLikesCount] = useState(biography.total_likes || 0)
  // 評論區展開狀態
  const [showComments, setShowComments] = useState(false)
  // 評論數狀態
  const [commentsCount, setCommentsCount] = useState(0)
  // 追蹤數狀態
  const [followerCount, setFollowerCount] = useState(biography.follower_count || 0)

  // 處理追蹤狀態變化
  const handleFollowChange = (isFollowing: boolean) => {
    const newCount = isFollowing ? followerCount + 1 : Math.max(0, followerCount - 1)
    setFollowerCount(newCount)
    onFollowerCountChange?.(newCount)
  }

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
              <span className="flex items-center gap-1">
                <Clock size={16} />
                {climbingYears !== null && climbingYears > 0
                  ? `攀岩第 ${climbingYears} 年`
                  : '從入坑那天起算'}
              </span>

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

            {/* Social Links */}
            {biography.social_links && !isAnonymous && (
              <div className="flex items-center gap-2 mt-3">
                {(
                  Object.entries(biography.social_links) as [
                    keyof SocialLinks,
                    string | undefined,
                  ][]
                )
                  .filter(([, value]) => value && value.trim() !== '')
                  .map(([platform, value]) => (
                    <a
                      key={platform}
                      href={getSocialUrl(platform, value!)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full border border-[#DBD8D8] text-[#6D6C6C] hover:bg-[#F5F5F5] hover:text-[#3F3D3D] transition-colors"
                      aria-label={platform}
                    >
                      {SocialIcon[platform]}
                    </a>
                  ))}
              </div>
            )}
          </div>

          {/* Right: Actions & Stats */}
          {showActions && !isAnonymous && (
            <div className="flex flex-col items-end gap-3">
              {/* 追蹤按鈕 */}
              {!isOwner && biography.id && (
                <FollowButton
                  biographyId={biography.id}
                  onFollowChange={handleFollowChange}
                  className="bg-brand-dark text-white hover:bg-brand-dark-hover"
                />
              )}

              {/* 社群統計與互動 */}
              <div className="flex items-center gap-4 text-sm text-[#6D6C6C]">
                {/* 瀏覽數 */}
                <div className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  <span>{biography.total_views || 0}</span>
                </div>

                {/* 按讚 */}
                <BiographyLikeButton
                  biographyId={biography.id}
                  initialCount={likesCount}
                  onLikeChange={(_isLiked, count) => setLikesCount(count)}
                  showCount
                  className="text-[#6D6C6C] hover:text-emerald-600"
                />

                {/* 追蹤數 */}
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  <span>{followerCount}</span>
                </div>

                {/* 留言 */}
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="flex items-center gap-1.5 hover:text-brand-dark transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{commentsCount}</span>
                </button>

                {/* 分享 */}
                <ShareButton
                  title={`${biography.name} 的攀岩人物誌 - NobodyClimb`}
                  description={biography.title || `來看看 ${biography.name} 的攀岩故事`}
                  className="text-[#6D6C6C] hover:text-[#3F3D3D]"
                />
              </div>
            </div>
          )}
        </div>

        {/* 評論區展開內容 */}
        {showComments && (
          <div className="border-t border-[#DBD8D8] pt-6 mt-6">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowComments(false)}
                className="text-[#6D6C6C] hover:text-[#3F3D3D]"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <BiographyCommentSection
              biographyId={biography.id}
              defaultOpen={true}
              isEmbedded={true}
              onCountChange={setCommentsCount}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default BiographyHero
