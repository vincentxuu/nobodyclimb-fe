import React from 'react'

interface ProfilePageTitleProps {
  title: string
  subtitle?: string
  isAI?: boolean
  action?: React.ReactNode
}

export default function ProfilePageTitle({
  title,
  subtitle,
  isAI = false,
  action,
}: ProfilePageTitleProps) {
  return (
    <div className="mb-6 flex items-center justify-between md:mb-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-[#1B1A1A] md:text-3xl">
          {isAI && (
            <span className="rounded bg-[#FFE70C] px-1.5 py-0.5 text-xs font-bold text-[#1B1A1A]">
              AI
            </span>
          )}
          {title}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-text-subtle">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
