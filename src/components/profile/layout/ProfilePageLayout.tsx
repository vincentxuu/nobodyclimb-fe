'use client'

import React from 'react'
import { motion } from 'framer-motion'
import ProfileSidebar from '@/components/ProfileSidebar'

interface ProfilePageLayoutProps {
  children: React.ReactNode
}

export default function ProfilePageLayout({ children }: ProfilePageLayoutProps) {

  return (
    <div className="container mx-auto max-w-screen-xl px-4 md:px-6">
      <div className="flex flex-col md:flex-row md:space-x-6">
        {/* 側邊選單 - 在桌面版才顯示 */}
        <div className="sticky top-6 hidden w-64 flex-shrink-0 self-start md:block">
          <ProfileSidebar />
        </div>

        {/* 主要內容區域 */}
        <div className="mt-16 flex-1 md:mt-0">
          <motion.div
            className="w-full flex-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
