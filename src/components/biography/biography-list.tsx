'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRightCircle } from 'lucide-react'
import { Card, CardContent, CardMedia } from '@/components/ui/card'
import { biographyData } from '@/data/biographyData'

// 卡片組件
interface BiographyCardProps {
  person: typeof biographyData[0];
}

function BiographyCard({ person }: BiographyCardProps) {
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

interface BiographyListProps {
  searchTerm: string;
}

export function BiographyList({ searchTerm }: BiographyListProps) {
  // 根據搜尋詞篩選人物
  const filteredBiography = biographyData.filter(person => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      person.name.toLowerCase().includes(searchLower) ||
      person.why.toLowerCase().includes(searchLower) ||
      person.start.toLowerCase().includes(searchLower) ||
      person.showUp.toLowerCase().includes(searchLower) ||
      person.type.toLowerCase().includes(searchLower) ||
      person.reason.toLowerCase().includes(searchLower) ||
      person.list.toLowerCase().includes(searchLower) ||
      person.word.toLowerCase().includes(searchLower)
    );
  });
  
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredBiography.map((person) => (
        <BiographyCard key={person.id} person={person} />
      ))}
    </div>
  )
}
