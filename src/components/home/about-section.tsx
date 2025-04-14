'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'

export function AboutSection() {
  return (
    <section className="relative overflow-hidden bg-white h-[500px]">
      {/* 背景圖片 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5F5F5] to-[#FFFFFF]/33" style={{
          backgroundImage: 'linear-gradient(180deg, #F5F5F5 1.35%, rgba(255, 255, 255, 0.33) 100%), url(/photo/cont-about.jpeg)',
          backgroundSize: 'cover',
        }} />
      </div>
      
      {/* 內容區域 */}
      <div className="container relative z-10 mx-auto flex flex-col items-center text-center h-full justify-center px-4">
        <h2 className="text-[32px] font-medium text-[#1B1A1A]">關於小人物攀岩</h2>
        
        <svg width="40" height="4" viewBox="0 0 40 4" fill="none" xmlns="http://www.w3.org/2000/svg" className="my-2">
          <rect width="40" height="4" fill="#1B1A1A"/>
        </svg>
        
        <p className="mt-4 max-w-[582px] text-base text-[#1B1A1A] px-4">
          緣起於一個 Nobody 很喜歡這項運動，希望有更多 Nobody 也能一起來 Climb<br />
          當然過程中一定會有一些疑惑，或許這裡能帶給你一些解答或收穫
        </p>
          
        <Link href="/about">
          <Button 
            variant="secondary" 
            size="lg"
            className="mt-8 rounded-md"
          >
            認識小人物
          </Button>
        </Link>
      </div>
    </section>
  )
}
