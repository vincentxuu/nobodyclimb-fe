'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="bg-[#f5f5f5] py-12 md:py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-[#1B1A1A] md:text-4xl">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-base text-[#6D6C6C] md:text-lg">{subtitle}</p>
          )}
        </motion.div>
      </div>
    </div>
  )
}
