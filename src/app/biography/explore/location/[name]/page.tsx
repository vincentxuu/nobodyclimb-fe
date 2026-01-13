'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MapPin, Users, Calendar, ArrowLeft, Loader2, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { climbingLocationService } from '@/lib/api/services'
import { LocationDetail } from '@/lib/types'
import { getCountryFlag } from '@/lib/utils/country'

interface LocationDetailPageProps {
  params: Promise<{
    name: string
  }>
}

export default function LocationDetailPage({ params }: LocationDetailPageProps) {
  const resolvedParams = use(params)
  const locationName = decodeURIComponent(resolvedParams.name)

  const [location, setLocation] = useState<LocationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLocation = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await climbingLocationService.getLocationDetail(locationName)
        if (response.success && response.data) {
          setLocation(response.data)
        } else {
          setError('找不到此地點')
        }
      } catch (err) {
        console.error('Failed to fetch location:', err)
        setError('無法載入地點資料')
      } finally {
        setLoading(false)
      }
    }
    fetchLocation()
  }, [locationName])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  if (error || !location) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-12">
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
            <MapPin className="mx-auto mb-4 h-12 w-12 text-red-300" />
            <h2 className="mb-2 text-xl font-medium text-red-800">{error || '找不到此地點'}</h2>
            <Link href="/biography/explore/locations">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回探索頁面
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 頂部區域 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <Breadcrumb
            items={[
              { label: '首頁', href: '/' },
              { label: '人物誌', href: '/biography' },
              { label: '攀岩足跡探索', href: '/biography/explore/locations' },
              { label: location.location },
            ]}
          />

          <div className="mt-6">
            <Link href="/biography/explore/locations">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回探索
              </Button>
            </Link>

            <div className="flex items-center gap-4">
              <span className="text-5xl">{getCountryFlag(location.country)}</span>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{location.location}</h1>
                <p className="mt-1 text-gray-600">{location.country}</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-emerald-600">
              <Users className="h-5 w-5" />
              <span className="text-lg font-medium">
                {location.visitor_count} 位岩友去過這裡
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 訪客列表 */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="mb-6 text-xl font-medium text-gray-900">去過的岩友</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {location.visitors.map((visitor, index) => (
            <motion.div
              key={visitor.biography_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="overflow-hidden rounded-lg border bg-white shadow-sm"
            >
              <Link href={`/biography/profile/${visitor.biography_id}`}>
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-full bg-gray-100">
                      {visitor.avatar_url ? (
                        <Image
                          src={visitor.avatar_url}
                          alt={visitor.biography_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-lg font-medium text-gray-500">
                          {visitor.biography_name.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 hover:text-emerald-600">
                        {visitor.biography_name}
                      </h3>
                      {visitor.visit_year && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{visitor.visit_year}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {visitor.notes && (
                    <div className="mt-3 rounded-lg bg-gray-50 p-3">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <p className="text-sm text-gray-600 line-clamp-3">{visitor.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
