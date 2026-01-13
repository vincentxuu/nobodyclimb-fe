'use client'

import React from 'react'
import { Label } from '@/components/ui/label'

interface ProfileFormFieldProps {
  label: string
  hint?: string
  children: React.ReactNode
  isMobile: boolean
}

export default function ProfileFormField({
  label,
  hint,
  children,
  isMobile,
}: ProfileFormFieldProps) {
  return (
    <div className="w-full space-y-2">
      <div>
        <Label className={`font-medium text-strong ${isMobile ? 'text-sm' : 'text-base'}`}>
          {label}
        </Label>
        {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      </div>
      {children}
    </div>
  )
}
