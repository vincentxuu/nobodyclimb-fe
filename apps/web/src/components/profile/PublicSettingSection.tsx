'use client'

import React from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

interface PublicSettingSectionProps {
  isPublic: boolean
  isMobile: boolean
  // eslint-disable-next-line no-unused-vars
  onChange: (_field: string, _value: string | boolean) => void
}

export default function PublicSettingSection({
  isPublic,
  isMobile,
  onChange,
}: PublicSettingSectionProps) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-[#EBEAEA] p-4">
      <Label className={`cursor-pointer font-medium text-[#3F3D3D] ${isMobile ? 'text-sm' : ''}`}>
        公開我的人物誌
      </Label>
      <Switch checked={isPublic} onCheckedChange={(checked) => onChange('isPublic', checked)} />
    </div>
  )
}
