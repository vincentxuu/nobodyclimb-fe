'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Eye, Users, MessageCircle, User } from 'lucide-react'
import { Biography, BiographySocialLinks } from '@/lib/types'
import { FollowButton } from '../follow-button'
import { CompactSocialLinks } from '../social-links'
import { BiographyLikeButton } from '../biography-like-button'
import { ShareButton } from '@/components/shared/share-button'
import { BiographyCommentSection } from '../biography-comment-section'

interface HeroSectionProps {
  person: Biography
  followerCount: number
  isOwner: boolean
  onFollowChange?: (_isFollowing: boolean) => void
}

/**
 * Hero Section - 標題區
 * 顯示人物頭像、名字、描述與社群統計
 */
export function HeroSection({ person, followerCount, isOwner, onFollowChange }: HeroSectionProps) {
  // 按讚數狀態
  const [likesCount, setLikesCount] = useState(person.total_likes || 0)
  // 評論區展開狀態
  const [showComments, setShowComments] = useState(false)
  // 評論數狀態
  const [commentsCount, setCommentsCount] = useState(0)

  // 解析社群連結
  const socialLinks = useMemo<BiographySocialLinks | null>(() => {
    if (!person.social_links) return null
    try {
      return JSON.parse(person.social_links)
    } catch {
      return null
    }
  }, [person.social_links])

  return (
    <div className="border-b border-gray-200 bg-white">
      {/* 封面圖 */}
      {person.cover_image && (
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-gray-100">
          <Image
            src={person.cover_image}
            alt={`${person.name} 的封面照片`}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      )}

      <div className="container relative mx-auto max-w-5xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          {/* 左側：頭像、名字與描述 */}
          <div className="flex items-center gap-4">
            {/* 頭像 */}
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full border-2 border-gray-200 bg-gray-100 md:h-24 md:w-24">
              {person.avatar_url ? (
                <Image
                  src={person.avatar_url}
                  alt={`${person.name} 的頭像`}
                  fill
                  className="object-cover"
                  sizes="96px"
                  priority
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <User className="h-10 w-10 md:h-12 md:w-12" />
                </div>
              )}
            </div>
            {/* 名字與描述 */}
            <div>
              <h1 className="mb-1 text-2xl font-bold text-brand-dark md:text-3xl lg:text-4xl">
                {person.name}
              </h1>
              <p className="text-sm text-text-subtle md:text-base">
                {person.title}
              </p>
              {/* 社群連結 */}
              <CompactSocialLinks socialLinks={socialLinks} className="mt-2" />
            </div>
          </div>

          {/* 右側：追蹤按鈕與統計 */}
          <div className="flex items-center gap-4">
            {!isOwner && person.id && (
              <FollowButton
                biographyId={person.id}
                className="bg-brand-dark text-white hover:bg-brand-dark-hover"
                onFollowChange={onFollowChange}
              />
            )}

            {/* 社群統計與分享 */}
            <div className="flex items-center gap-4 text-sm text-text-subtle">
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>{person.total_views || 0}</span>
              </div>
              <BiographyLikeButton
                biographyId={person.id}
                initialCount={likesCount}
                onLikeChange={(isLiked, count) => setLikesCount(count)}
                showCount
                className="text-text-subtle hover:text-emerald-600"
              />
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{followerCount}</span>
              </div>
              <button
                onClick={() => setShowComments(!showComments)}
                className="flex items-center gap-1.5 hover:text-brand-dark transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{commentsCount}</span>
              </button>
              <ShareButton
                title={`${person.name} 的攀岩人物誌 - NobodyClimb`}
                description={person.title || `來看看 ${person.name} 的攀岩故事`}
                className="text-text-subtle hover:text-text-subtle"
              />
            </div>
          </div>
        </motion.div>

        {/* 評論區展開內容 */}
        {showComments && (
          <div className="border-t border-gray-200 pt-6 mt-6">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowComments(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <BiographyCommentSection
              biographyId={person.id}
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
