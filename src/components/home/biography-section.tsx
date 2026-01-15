'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRightCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AvatarImage } from '@/components/shared/avatar-image'
import { biographyService } from '@/lib/api/services'
import { Biography } from '@/lib/types'

function ClimberCard({ person }: { person: Biography }) {
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
          <AvatarImage
            avatarUrl={person.cover_image || person.avatar_url}
            altText={person.name}
            iconSize={64}
            containerClassName="h-[248px]"
          />

          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-medium text-[#1B1A1A]">{person.name}</h3>
                <p className="text-sm text-[#8E8C8C]">
                  攀岩年資 | {climbingYears ? `${climbingYears}年` : '未知'}
                </p>
              </div>
              <ArrowRightCircle size={22} className="text-gray-400" />
            </div>

            <div className="space-y-2">
              <h4 className="text-base font-medium text-[#1B1A1A]">攀岩對你來說，是什麼樣的存在</h4>
              <p className="line-clamp-2 text-sm text-[#1B1A1A]">
                {person.climbing_meaning || '尚未填寫'}
              </p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

export function BiographySection() {
  const [biographies, setBiographies] = useState<Biography[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadBiographies = async () => {
      try {
        // 先嘗試獲取精選人物誌
        const featuredResponse = await biographyService.getFeaturedBiographies(3)

        if (featuredResponse.success && featuredResponse.data && featuredResponse.data.length > 0) {
          setBiographies(featuredResponse.data)
        } else {
          // 如果沒有精選人物誌，改用一般的人物誌列表
          const response = await biographyService.getBiographies(1, 3)
          if (response.success && response.data) {
            setBiographies(response.data)
          } else {
            setBiographies([])
          }
        }
      } catch (err) {
        console.error('Failed to load biographies:', err)
        // 嘗試備用方案
        try {
          const response = await biographyService.getBiographies(1, 3)
          if (response.success && response.data) {
            setBiographies(response.data)
          } else {
            setError('載入人物誌時發生錯誤')
            setBiographies([])
          }
        } catch {
          setError('載入人物誌時發生錯誤')
          setBiographies([])
        }
      } finally {
        setLoading(false)
      }
    }

    loadBiographies()
  }, [])

  return (
    <section className="border-t border-[#D2D2D2] py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-[#1B1A1A] md:text-[40px]">熱門人物誌</h2>
          <p className="mt-4 text-base text-[#6D6C6C]">認識這些熱愛攀岩的小人物們</p>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
          </div>
        ) : error ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-lg text-red-600">{error}</p>
          </div>
        ) : biographies.length === 0 ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <p className="text-lg text-[#6D6C6C]">目前沒有精選人物誌</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
            {biographies.map((person) => (
              <ClimberCard key={person.id} person={person} />
            ))}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Link href="/biography">
            <Button
              variant="outline"
              className="h-11 border border-[#1B1A1A] px-8 text-base text-[#1B1A1A] hover:bg-[#DBD8D8]"
            >
              認識更多小人物
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
