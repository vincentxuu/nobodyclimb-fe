'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRightCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { biographyData } from '@/data/biographyData'

function ClimberCard({ person }: { person: typeof biographyData[0] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-full"
    >
      <Link href={`/biography/profile/${person.id}`} className="block h-full">
        <Card className="h-full overflow-hidden hover:shadow-md transition-shadow duration-300">
          <div className="relative h-[248px] overflow-hidden">
            <Image
              src={person.imageSrc}
              alt={person.name}
              fill
              className="object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
          
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-medium text-[#1B1A1A]">{person.name}</h3>
                <p className="text-sm text-[#8E8C8C]">攀岩年資 | {person.start ? `${new Date().getFullYear() - parseInt(person.start)}年` : '3年'}</p>
              </div>
              <ArrowRightCircle size={22} className="text-gray-400" />
            </div>
            
            <div className="space-y-2">
              <h4 className="text-base font-medium text-[#1B1A1A]">攀岩對你來說，是什麼樣的存在</h4>
              <p className="text-sm text-[#1B1A1A] line-clamp-2">{person.why}</p>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

export function BiographySection() {
  // 只顯示前3個人物資料
  const displayedClimbers = biographyData.slice(0, 3);
  
  return (
    <section className="py-16 md:py-20 border-t border-[#D2D2D2]">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="text-[40px] font-bold text-[#1B1A1A]">
            人物誌
          </h2>
          <p className="text-base text-[#6D6C6C] mt-4">
            認識這些熱愛攀岩的小人物們
          </p>
        </div>
        
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          {displayedClimbers.map((person) => (
            <ClimberCard key={person.id} person={person} />
          ))}
        </div>
        
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
