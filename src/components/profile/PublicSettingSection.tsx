'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface PublicSettingSectionProps {
  isPublic: boolean;
  isMobile: boolean;
  onChange: (field: string, value: string | boolean) => void;
}

export default function PublicSettingSection({
  isPublic,
  isMobile,
  onChange
}: PublicSettingSectionProps) {
  return (
    <div className="bg-[#EBEAEA] p-4 rounded-lg flex items-center justify-between">
      <Label className={`text-[#3F3D3D] font-medium cursor-pointer ${isMobile ? 'text-sm' : ''}`}>
        公開我的人物誌
      </Label>
      <Switch 
        checked={isPublic} 
        onCheckedChange={(checked) => onChange('isPublic', checked)}
      />
    </div>
  );
}
