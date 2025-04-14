'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import ProfileFormField from './ProfileFormField';
import ProfileTextDisplay from './ProfileTextDisplay';

interface BasicInfoSectionProps {
  name: string;
  isEditing: boolean;
  isMobile: boolean;
  onChange: (field: string, value: string | boolean) => void;
}

export default function BasicInfoSection({ 
  name, 
  isEditing, 
  isMobile, 
  onChange 
}: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <ProfileFormField label="名稱" isMobile={isMobile}>
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
    </div>
  );
}
