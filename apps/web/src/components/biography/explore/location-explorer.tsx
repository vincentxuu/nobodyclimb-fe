'use client'

import { motion } from 'framer-motion'
import { ChevronRight, Globe, Loader2, MapPin, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { bucketListService } from '@/lib/api/services'
import { isSvgUrl } from '@/lib/utils/image'

interface LocationData {
  location: string
  country: string
  visitors: Array<{
    id: string
    name: string
    avatar_url: string | null
    slug: string
  }>
}

interface BucketListLocation {
  location: string
  item_count: number
  user_count: number
  completed_count: number
}

export function LocationExplorer() {
  const t = useTranslations('BiographyPage')
  const [taiwanLocations, setTaiwanLocations] = useState<LocationData[]>([])
  const [overseasLocations, setOverseasLocations] = useState<LocationData[]>([])
  const [bucketListLocations, setBucketListLocations] = useState<BucketListLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'taiwan' | 'overseas' | 'bucket'>('taiwan')

  useEffect(() => {
    const loadLocations = async () => {
      setLoading(true)
      setError(null)
      try {
        // 並行載入各種地點資料
        const [taiwanRes, overseasRes, bucketRes] = await Promise.all([
          bucketListService.getClimbingFootprints(8, 'taiwan'),
          bucketListService.getClimbingFootprints(8, 'overseas'),
          bucketListService.getPopularLocations(8),
        ])

        if (taiwanRes.success && taiwanRes.data) {
          setTaiwanLocations(taiwanRes.data)
        }
        if (overseasRes.success && overseasRes.data) {
          setOverseasLocations(overseasRes.data)
        }
        if (bucketRes.success && bucketRes.data) {
          setBucketListLocations(bucketRes.data)
        }
      } catch (err) {
        console.error('Failed to load locations:', err)
        setError(t('locationLoadError'))
      } finally {
        setLoading(false)
      }
    }

    loadLocations()
  }, [])

  const renderLocationCard = (loc: LocationData, index: number) => (
    <motion.div
      key={`${loc.location}-${loc.country}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="h-full cursor-pointer transition-shadow duration-300 hover:shadow-md">
        <CardContent className="p-4">
          <h4 className="mb-2 font-semibold text-[#1B1A1A]">{loc.location}</h4>
          <p className="mb-3 text-sm text-gray-500">{loc.country}</p>
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{t('visitorsCount', { count: loc.visitors.length })}</span>
          </div>
          {/* 訪客頭像 */}
          {loc.visitors.length > 0 && (
            <div className="mt-3 flex -space-x-2">
              {loc.visitors.slice(0, 4).map((visitor) => (
                <Link
                  key={visitor.id}
                  href={`/biography/profile/${visitor.slug || visitor.id}`}
                  className="relative h-7 w-7 overflow-hidden rounded-full border-2 border-white bg-gray-200"
                  title={visitor.name}
                >
                  {visitor.avatar_url ? (
                    isSvgUrl(visitor.avatar_url) ? (
                      <img
                        src={visitor.avatar_url}
                        alt={visitor.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={visitor.avatar_url}
                        alt={visitor.name}
                        fill
                        className="object-cover"
                      />
                    )
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-gray-500">
                      {visitor.name.charAt(0)}
                    </div>
                  )}
                </Link>
              ))}
              {loc.visitors.length > 4 && (
                <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-100 text-xs text-gray-600">
                  +{loc.visitors.length - 4}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )

  const renderBucketListLocationCard = (loc: BucketListLocation, index: number) => (
    <motion.div
      key={loc.location}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card className="h-full cursor-pointer transition-shadow duration-300 hover:shadow-md">
        <CardContent className="p-4">
          <h4 className="mb-2 font-semibold text-[#1B1A1A]">{loc.location}</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center justify-between">
              <span>{t('setAsGoal')}</span>
              <span className="font-medium">{t('itemCountUnit', { count: loc.item_count })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('inChallenge')}</span>
              <span className="font-medium">{t('personCountUnit', { count: loc.user_count })}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{t('completed')}</span>
              <span className="font-medium text-green-600">
                {t('personCountUnit', { count: loc.completed_count })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  if (loading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[200px] items-center justify-center text-red-500">{error}</div>
    )
  }

  return (
    <div>
      {/* 標題 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-bold text-[#1B1A1A]">{t('exploreByLocationTitle')}</h2>
        </div>
        <Link
          href="/biography/explore/locations"
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          {t('moreLocations')}
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* 標籤切換 */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setActiveTab('taiwan')}
          className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'taiwan'
              ? 'bg-[#1B1A1A] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <MapPin className="h-4 w-4" />
          {t('taiwanCrags')}
        </button>
        <button
          onClick={() => setActiveTab('overseas')}
          className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'overseas'
              ? 'bg-[#1B1A1A] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Globe className="h-4 w-4" />
          {t('overseasClimbing')}
        </button>
        <button
          onClick={() => setActiveTab('bucket')}
          className={`flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'bucket'
              ? 'bg-[#1B1A1A] text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {t('goalLocations')}
        </button>
      </div>

      {/* 地點網格 */}
      {activeTab === 'taiwan' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {taiwanLocations.length > 0 ? (
            taiwanLocations.map((loc, index) => renderLocationCard(loc, index))
          ) : (
            <div className="col-span-full py-8 text-center text-gray-500">
              {t('noTaiwanCragData')}
            </div>
          )}
        </div>
      )}

      {activeTab === 'overseas' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {overseasLocations.length > 0 ? (
            overseasLocations.map((loc, index) => renderLocationCard(loc, index))
          ) : (
            <div className="col-span-full py-8 text-center text-gray-500">
              {t('noOverseasData')}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bucket' && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {bucketListLocations.length > 0 ? (
            bucketListLocations.map((loc, index) => renderBucketListLocationCard(loc, index))
          ) : (
            <div className="col-span-full py-8 text-center text-gray-500">
              {t('noGoalLocationData')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
