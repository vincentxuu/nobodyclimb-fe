'use client'

import { motion } from 'framer-motion'
import { Eye, Mountain, Users } from 'lucide-react'
import { Biography } from '@/lib/types'
import { FollowButton } from '../follow-button'

interface HeroSectionProps {
  person: Biography
  followerCount: number
  isOwner: boolean
  onFollowChange?: (isFollowing: boolean) => void
}

/**
 * Hero Section - 極簡標題區
 * 純文字設計，不依賴照片，快速進入內容
 */
export function HeroSection({ person, followerCount, isOwner, onFollowChange }: HeroSectionProps) {
  return (
    <div className="border-b border-gray-200 bg-white">
      <div className="container mx-auto max-w-5xl px-4 py-8">
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
              {person.title || '攀岩者'}
            </p>
          </div>

          {/* 右側：追蹤按鈕與統計 */}
          <div className="flex items-center gap-6">
            {!isOwner && person.id && (
              <FollowButton
                biographyId={person.id}
                className="bg-brand-dark text-white hover:bg-brand-dark-hover"
                onFollowChange={onFollowChange}
              />
            )}

            {/* 社群統計 */}
            <div className="flex items-center gap-4 text-sm text-text-subtle">
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" />
                <span>{person.total_views || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mountain className="h-4 w-4" />
                <span>{person.total_likes || 0}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                <span>{followerCount}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
