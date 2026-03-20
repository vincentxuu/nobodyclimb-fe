'use client'

import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { biographyService } from '@/lib/api/services'
import { Biography } from '@/lib/types'
import { BiographyCard } from '@/components/biography/biography-list'
import { useTranslations } from 'next-intl'

interface RecommendedProfilesProps {
  currentId: string
  limit?: number
}

export function RecommendedProfiles({ currentId, limit = 3 }: RecommendedProfilesProps) {
  const t = useTranslations('BiographyPage')
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
          setError(t('loadError'))
          setProfiles([])
        }
      } catch (err) {
        console.error('Failed to fetch recommended profiles:', err)
        setError(t('loadErrorAlt'))
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
        <BiographyCard key={person.id} person={person} />
      ))}
    </div>
  )
}
