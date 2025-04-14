'use client'

import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center space-x-2', className)}>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-[#8E8C8C]" />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className="text-sm text-[#8E8C8C] hover:text-[#1B1A1A] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-sm text-[#1B1A1A]">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}