'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import ProfileFormField from './ProfileFormField'
import ProfileTextDisplay from './ProfileTextDisplay'

interface BasicInfoSectionProps {
  name: string
  title: string
  isEditing: boolean
  isMobile: boolean
  // eslint-disable-next-line no-unused-vars
  onChange: (_field: string, _value: string | boolean) => void
}

export default function BasicInfoSection({
  name,
  title,
  isEditing,
  isMobile,
  onChange,
}: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <ProfileFormField label="暱稱" isMobile={isMobile}>
        {isEditing ? (
          <Input
            value={name}
            onChange={(e) => onChange('name', e.target.value)}
            className="border-[#B6B3B3] text-sm md:text-base"
          />
        ) : (
          <ProfileTextDisplay text={name} isMobile={isMobile} />
        )}
      </ProfileFormField>
      <ProfileFormField label="一句話形容自己" isMobile={isMobile}>
        {isEditing ? (
          <Input
            value={title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="例如：抱石愛好者"
            className="border-[#B6B3B3] text-sm md:text-base"
          />
        ) : (
          <ProfileTextDisplay text={title || '未設定'} isMobile={isMobile} />
        )}
      </ProfileFormField>
    </div>
  )
}
