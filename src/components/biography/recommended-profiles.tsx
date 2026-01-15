'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRightCircle, Loader2, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { biographyService } from '@/lib/api/services'
import { Biography } from '@/lib/types'
import { calculateClimbingYears } from '@/lib/utils/biography'

interface ProfileCardProps {
  person: Biography
}

function ProfileCard({ person }: ProfileCardProps) {
  const climbingYears = calculateClimbingYears(person.climbing_start_year)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Link href={`/biography/profile/${person.id}`} className="block h-full">
        <Card className="h-full overflow-hidden rounded-lg transition-shadow duration-300 hover:shadow-md">
          <CardContent className="p-6">
            <div className="mb-4 space-y-3">
              {person.climbing_meaning ? (
                <div className="relative">
                  <p className="line-clamp-3 text-base font-medium leading-relaxed text-[#1B1A1A]">
                    &ldquo;{person.climbing_meaning}&rdquo;
                  </p>
                </div>
              ) : (
                <p className="text-sm italic text-[#8E8C8C]">尚未分享故事</p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                  {person.avatar_url ? (
                    <Image
                      src={person.avatar_url}
                      alt={person.name}
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <User size={20} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-[#1B1A1A]">{person.name}</h3>
                  <p className="text-xs text-[#8E8C8C]">
                    攀岩 {climbingYears !== null ? `${climbingYears}年` : '年資未知'}
                  </p>
                </div>
              </div>
              <ArrowRightCircle size={18} className="flex-shrink-0 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

interface RecommendedProfilesProps {
  currentId: string
  limit?: number
}

export function RecommendedProfiles({ currentId, limit = 3 }: RecommendedProfilesProps) {
  const [profiles, setProfiles] = useState<Biography[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfiles = async () => {
      setLoading(true)
      setError(null)

      try {
        // 從 API 獲取人物誌列表
        const response = await biographyService.getBiographies(1, limit + 1)

        if (response.success) {
          // 排除當前人物誌，取得推薦列表
          const filtered = response.data
            .filter((p) => p.id !== currentId)
            .slice(0, limit)
          setProfiles(filtered)
        } else {
          setError('無法載入推薦人物誌')
          setProfiles([])
        }
      } catch (err) {
        console.error('Failed to fetch recommended profiles:', err)
        setError('載入推薦人物誌時發生錯誤')
        setProfiles([])
      } finally {
        setLoading(false)
      }
    }

    loadProfiles()
  }, [currentId, limit])

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#1B1A1A]" />
      </div>
    )
  }

  if (error || profiles.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {profiles.map((person) => (
        <ProfileCard key={person.id} person={person} />
      ))}
    </div>
  )
}
