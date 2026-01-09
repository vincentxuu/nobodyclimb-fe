'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRightCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { biographyData } from '@/data/biographyData'
import { biographyService } from '@/lib/api/services'
import { Biography } from '@/lib/types'

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

function ClimberCard({ person }: { person: Biography }) {
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
          <div className="relative h-[248px] overflow-hidden">
            <Image
              src={imageUrl}
              alt={person.name}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>

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

  useEffect(() => {
    const loadBiographies = async () => {
      try {
        // 嘗試從 API 獲取精選人物誌
        const response = await biographyService.getFeaturedBiographies(3)

        if (response.success && response.data && response.data.length > 0) {
          setBiographies(response.data)
        } else {
          // API 沒有數據，使用靜態數據
          setBiographies(biographyData.slice(0, 3).map(mapStaticToBiography))
        }
      } catch {
        // API 錯誤，使用靜態數據
        setBiographies(biographyData.slice(0, 3).map(mapStaticToBiography))
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
          <h2 className="text-[40px] font-bold text-[#1B1A1A]">人物誌</h2>
          <p className="mt-4 text-base text-[#6D6C6C]">認識這些熱愛攀岩的小人物們</p>
        </div>

        {loading ? (
          <div className="flex min-h-[300px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#1B1A1A]" />
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
