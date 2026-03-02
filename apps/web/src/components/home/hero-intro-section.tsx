'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

export function HeroIntroSection() {
  return (
    <section className="relative flex min-h-[calc(100vh-80px)] flex-col items-center justify-center bg-gradient-to-b from-[#F5F5F5] to-white">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Image
            src="/logo/Nobodylimb-black.svg"
            alt="小人物攀岩"
            width={320}
            height={89}
            className="mx-auto w-[280px] md:w-[320px]"
            priority
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="mt-4 text-base text-[#6D6C6C] md:text-lg"
        >
          台灣攀岩社群
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          className="mt-4 text-xl text-[#1B1A1A] md:text-2xl"
        >
          查路線 · 看故事 · 寫紀錄
        </motion.p>
      </div>

      {/* 向下捲動提示 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center text-[#6D6C6C]"
        >
          <span className="mb-2 text-xs">向下探索</span>
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </motion.div>
    </section>
  )
}
