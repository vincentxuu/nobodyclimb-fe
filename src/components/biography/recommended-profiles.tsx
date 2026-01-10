'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRightCircle, Loader2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { biographyService } from '@/lib/api/services'
import { Biography } from '@/lib/types'
import { biographyData } from '@/data/biographyData'

// 靜態數據轉換為 Biography 類型
function mapStaticToBiography(staticPerson: (typeof biographyData)[0]): Biography {
  return {
    id: String(staticPerson.id),
    user_id: null,
    slug: staticPerson.name.toLowerCase().replace(/\s+/g, '-'),
    name: staticPerson.name,
    title: null,
    bio: null,
    avatar_url: staticPerson.imageSrc,
    cover_image: staticPerson.detailImageSrc,
    climbing_start_year: staticPerson.start,
    frequent_locations: staticPerson.showUp,
    favorite_route_type: staticPerson.type,
    climbing_reason: staticPerson.reason,
    climbing_meaning: staticPerson.why,
    bucket_list: staticPerson.list,
    advice: staticPerson.word,
    achievements: null,
    social_links: null,
    is_featured: 0,
    is_public: 1,
    published_at: staticPerson.time,
    created_at: staticPerson.time,
    updated_at: staticPerson.time,
  }
}

interface ProfileCardProps {
  person: Biography
}

function ProfileCard({ person }: ProfileCardProps) {
  const imageUrl = person.avatar_url || '/photo/personleft.jpeg'
  const climbingYears = person.climbing_start_year
    ? new Date().getFullYear() - parseInt(person.climbing_start_year)
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Link href={`/biography/profile/${person.id}`} className="block h-full">
        <Card className="h-full overflow-hidden transition-shadow duration-300 hover:shadow-md">
          <div className="relative h-[200px] overflow-hidden">
            <Image
              src={imageUrl}
              alt={person.name}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>

          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-[#1B1A1A]">{person.name}</h3>
                <p className="text-sm text-[#8E8C8C]">
                  攀岩年資 | {climbingYears !== null ? `${climbingYears}年` : '未知'}
                </p>
              </div>
              <ArrowRightCircle size={20} className="text-gray-400" />
            </div>

            <p className="line-clamp-2 text-sm text-[#1B1A1A]">
              {person.climbing_meaning || '尚未填寫'}
            </p>
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

  useEffect(() => {
    const loadProfiles = async () => {
      setLoading(true)

      try {
        // 嘗試從 API 獲取人物誌列表
        const response = await biographyService.getBiographies(1, limit + 1)

        if (response.success && response.data.length > 0) {
          // 排除當前人物誌，取得推薦列表
          const filtered = response.data
            .filter((p) => p.id !== currentId)
            .slice(0, limit)
          setProfiles(filtered)
        } else {
          throw new Error('No data from API')
        }
      } catch (error) {
        console.error('Failed to fetch recommended profiles, falling back to static data:', error)
        // API 失敗，使用靜態數據
        const staticProfiles = biographyData
          .filter((p) => String(p.id) !== currentId)
          .slice(0, limit)
          .map(mapStaticToBiography)
        setProfiles(staticProfiles)
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

  if (profiles.length === 0) {
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
