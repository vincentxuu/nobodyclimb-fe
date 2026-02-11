'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface CollapsibleBreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function CollapsibleBreadcrumb({ items, className }: CollapsibleBreadcrumbProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className={cn('relative', className)}>
      {/* 螢幕閱讀器可見的完整麵包屑（SEO 友善） */}
      <nav aria-label="breadcrumb" className="sr-only">
        <ol>
          {items.map((item, index) => (
            <li key={item.label}>
              {item.href ? (
                <Link href={item.href} prefetch={false}>{item.label}</Link>
              ) : (
                <span>{item.label}</span>
              )}
              {index < items.length - 1 && <span> / </span>}
            </li>
          ))}
        </ol>
      </nav>

      {/* 可視的麵包屑（可收合） */}
      <div className="flex items-center">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700',
            isExpanded && 'bg-gray-100'
          )}
          aria-expanded={isExpanded}
          aria-label={isExpanded ? '收合導航路徑' : '展開導航路徑'}
        >
          <MoreHorizontal size={16} />
          {!isExpanded && (
            <span className="hidden sm:inline text-xs text-gray-400">導航</span>
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.nav
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
              className="ml-2 flex items-center"
              aria-label="breadcrumb"
            >
              {items.map((item, index) => (
                <React.Fragment key={item.label}>
                  {index > 0 && (
                    <ChevronRight className="mx-1 h-4 w-4 flex-shrink-0 text-gray-400" />
                  )}
                  {item.href ? (
                    <Link
                      href={item.href}
                      prefetch={false}
                      className="whitespace-nowrap text-sm text-gray-500 transition-colors hover:text-gray-900 hover:underline"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.label}
                    </span>
                  )}
                </React.Fragment>
              ))}
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
