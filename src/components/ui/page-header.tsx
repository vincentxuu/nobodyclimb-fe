'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface PageHeaderProps {
  title: string
  subtitle?: string
}

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <div className="bg-page-bg py-12 md:py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-text-main md:text-4xl">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-base text-text-subtle md:text-lg">{subtitle}</p>
          )}
        </motion.div>
      </div>
    </div>
  )
}
