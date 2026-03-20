'use client'

import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'

export function BiographyHeader() {
  const t = useTranslations('BiographyPage')
  return (
    <div className="relative h-[520px] w-full bg-black">
      <div className="absolute inset-0 z-0">
        <Image
          src="/photo/cover-photo.jpeg"
          alt="Biography Cover"
          fill
          className="object-cover opacity-70"
          priority
        />
      </div>

      <motion.div
        className="absolute bottom-[18%] left-[8%] z-10 text-white"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <h1 className="mb-2 text-4xl font-medium drop-shadow-lg">{t('headerTitle')}</h1>
        <p className="text-base font-medium drop-shadow-lg">{t('headerSubtitle')}</p>
      </motion.div>
    </div>
  )
}
