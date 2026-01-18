'use client'

import * as React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, Mountain, Trophy, BookOpen } from 'lucide-react'
import { CategoryCard } from '@/components/games/rope-system'
import {
  CATEGORIES_BY_PARENT,
  PARENT_CATEGORIES,
} from '@/lib/games/rope-system/constants'

export default function RopeSystemHomePage() {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* 頂部導航 */}
      <header className="sticky top-0 z-40 border-b border-[#E5E5E5] bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-[#535353] hover:text-[#1B1A1A]"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>返回</span>
          </Link>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* 標題區域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <div className="mb-4 text-5xl">⛰️</div>
          <h1 className="mb-2 text-3xl font-bold text-[#1B1A1A]">
            攀岩系統練習
          </h1>
          <p className="text-[#535353]">
            練習繩索系統操作，學習安全攀岩技術
          </p>
        </motion.div>

        {/* 快捷操作 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="flex items-center gap-4 rounded-xl border border-[#E5E5E5] bg-white p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(255,231,12,0.2)]">
              <BookOpen className="h-6 w-6 text-[#1B1A1A]" />
            </div>
            <div>
              <h3 className="font-medium text-[#1B1A1A]">學習模式</h3>
              <p className="text-sm text-[#535353]">答錯顯示詳細解釋</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-[#E5E5E5] bg-white p-4 opacity-50">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(34,197,94,0.2)]">
              <Trophy className="h-6 w-6 text-[#22C55E]" />
            </div>
            <div>
              <h3 className="font-medium text-[#1B1A1A]">系統考試</h3>
              <p className="text-sm text-[#535353]">即將推出</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-[#E5E5E5] bg-white p-4 opacity-50 sm:col-span-2 lg:col-span-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(59,130,246,0.2)]">
              <Mountain className="h-6 w-6 text-[#3B82F6]" />
            </div>
            <div>
              <h3 className="font-medium text-[#1B1A1A]">認證徽章</h3>
              <p className="text-sm text-[#535353]">即將推出</p>
            </div>
          </div>
        </motion.div>

        {/* 運動攀登 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="text-2xl">{PARENT_CATEGORIES.sport.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-[#1B1A1A]">
                {PARENT_CATEGORIES.sport.name}
              </h2>
              <p className="text-sm text-[#535353]">
                {PARENT_CATEGORIES.sport.description}
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES_BY_PARENT.sport.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <CategoryCard category={category} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 傳統攀登 */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="mb-4 flex items-center gap-3">
            <span className="text-2xl">{PARENT_CATEGORIES.trad.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-[#1B1A1A]">
                {PARENT_CATEGORIES.trad.name}
              </h2>
              <p className="text-sm text-[#535353]">
                {PARENT_CATEGORIES.trad.description}
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES_BY_PARENT.trad.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
              >
                <CategoryCard category={category} />
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* 底部說明 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 rounded-xl border border-[#E5E5E5] bg-white p-6 text-center"
        >
          <p className="text-sm text-[#535353]">
            題目內容根據國際攀岩聯盟 (IFSC)、美國登山協會 (AAC)
            等權威來源編寫。
            <br />
            實際操作請在專業教練指導下進行，本系統僅供學習參考。
          </p>
        </motion.div>
      </main>
    </div>
  )
}
