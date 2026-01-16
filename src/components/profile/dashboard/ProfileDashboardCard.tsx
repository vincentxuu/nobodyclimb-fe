'use client'

import React from 'react'
import { ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProfileDashboardCardProps {
  icon: React.ReactNode
  title: string
  description?: string
  preview?: React.ReactNode
  progress?: {
    current: number
    total: number
  }
  isComplete?: boolean
  onClick?: () => void
  size?: 'normal' | 'large'
  className?: string
}

export function ProfileDashboardCard({
  icon,
  title,
  description,
  preview,
  progress,
  isComplete,
  onClick,
  size = 'normal',
  className,
}: ProfileDashboardCardProps) {
  const percentage = progress ? Math.round((progress.current / progress.total) * 100) : null

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex w-full flex-col rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:shadow-md',
        size === 'large' && 'col-span-2',
        className
      )}
    >
      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-gray-600 group-hover:bg-brand-accent/10 group-hover:text-brand-accent">
            {icon}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{title}</h3>
            {description && <p className="text-xs text-gray-500">{description}</p>}
          </div>
        </div>
        {isComplete ? (
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
            <Check className="h-4 w-4 text-green-600" />
          </div>
        ) : (
          <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
        )}
      </div>

      {/* Progress Bar */}
      {progress && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-gray-500">
              {progress.current}/{progress.total}
            </span>
            <span className="font-medium text-gray-700">{percentage}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-brand-accent transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Preview Content */}
      {preview && <div className="flex-1 text-sm text-gray-600">{preview}</div>}
    </button>
  )
}
