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
  hideOnMobile?: boolean
}

export function Breadcrumb({ items, className, hideOnMobile = false }: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center space-x-2', hideOnMobile && 'hidden md:flex', className)}>
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          {index > 0 && <ChevronRight className="h-4 w-4 text-[#8E8C8C]" />}
          {item.href ? (
            <Link
              href={item.href}
              prefetch={false}
              className="text-sm text-[#8E8C8C] transition-colors hover:text-[#1B1A1A]"
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
