'use client'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, Users, MessageCircle } from 'lucide-react'
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
 * Hero Section - 極簡標題區
 * 純文字設計，不依賴照片，快速進入內容
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
      <div className="container relative mx-auto max-w-5xl px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          {/* 左側：名字與描述 */}
          <div>
            <h1 className="mb-2 text-3xl font-bold text-brand-dark md:text-4xl">
              {person.name}
            </h1>
            <p className="text-base text-text-subtle">
              {person.title}
            </p>
            {/* 社群連結 */}
            <CompactSocialLinks socialLinks={socialLinks} className="mt-3" />
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
