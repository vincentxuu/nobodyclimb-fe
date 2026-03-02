'use client'

import React from 'react'
import { ImageLayout } from '../types'

interface LayoutSelectorProps {
  value: ImageLayout
  // eslint-disable-next-line no-unused-vars
  onChange: (_layout: ImageLayout) => void
  disabled?: boolean
}

const layouts: { value: ImageLayout; label: string; icon: React.ReactNode }[] = [
  {
    value: 'single',
    label: '單列',
    icon: (
      <div className="flex flex-col gap-0.5">
        <div className="h-2 w-6 rounded-sm bg-current" />
        <div className="h-2 w-6 rounded-sm bg-current" />
      </div>
    ),
  },
  {
    value: 'double',
    label: '兩欄',
    icon: (
      <div className="flex gap-0.5">
        <div className="h-4 w-3 rounded-sm bg-current" />
        <div className="h-4 w-3 rounded-sm bg-current" />
      </div>
    ),
  },
  {
    value: 'grid',
    label: '網格',
    icon: (
      <div className="grid grid-cols-3 gap-0.5">
        <div className="h-2 w-2 rounded-sm bg-current" />
        <div className="h-2 w-2 rounded-sm bg-current" />
        <div className="h-2 w-2 rounded-sm bg-current" />
        <div className="h-2 w-2 rounded-sm bg-current" />
        <div className="h-2 w-2 rounded-sm bg-current" />
        <div className="h-2 w-2 rounded-sm bg-current" />
      </div>
    ),
  },
]

export default function LayoutSelector({
  value,
  onChange,
  disabled = false,
}: LayoutSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">排版：</span>
      <div className="flex gap-1">
        {layouts.map((layout) => (
          <button
            key={layout.value}
            onClick={() => onChange(layout.value)}
            disabled={disabled}
            className={`
              flex flex-col items-center gap-1 rounded-lg px-3 py-2 transition-colors
              ${
                value === layout.value
                  ? 'bg-primary text-white'
                  : disabled
                    ? 'bg-gray-100 text-gray-300'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }
            `}
            aria-label={layout.label}
            title={layout.label}
          >
            {layout.icon}
            <span className="text-xs">{layout.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
