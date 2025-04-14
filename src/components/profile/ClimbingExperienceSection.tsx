'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ProfileFormField from './ProfileFormField';
import ProfileTextDisplay from './ProfileTextDisplay';

interface ClimbingExperienceSectionProps {
  climbingReason: string;
  climbingMeaning: string;
  climbingBucketList: string;
  adviceForBeginners: string;
  isEditing: boolean;
  isMobile: boolean;
  onChange: (field: string, value: string | boolean) => void;
}

export default function ClimbingExperienceSection({
  climbingReason,
  climbingMeaning,
  climbingBucketList,
  adviceForBeginners,
  isEditing,
  isMobile,
  onChange
}: ClimbingExperienceSectionProps) {
  return (
    <div className="space-y-4">
      <ProfileFormField label="踏上攀岩不歸路的原因" isMobile={isMobile}>
        {isEditing ? (
          <Textarea 
            value={climbingReason} 
            onChange={(e) => onChange('climbingReason', e.target.value)}
            className="border-[#B6B3B3] resize-none min-h-[120px] text-sm md:text-base"
          />
        ) : (
          <ProfileTextDisplay text={climbingReason} minHeight="min-h-[80px]" isMobile={isMobile} />
        )}
      </ProfileFormField>

      <ProfileFormField label="攀岩對你來說是什麼樣的存在" isMobile={isMobile}>
        {isEditing ? (
          <Textarea 
            value={climbingMeaning} 
            onChange={(e) => onChange('climbingMeaning', e.target.value)}
            className="border-[#B6B3B3] resize-none min-h-[120px] text-sm md:text-base"
          />
        ) : (
          <ProfileTextDisplay text={climbingMeaning} minHeight="min-h-[80px]" isMobile={isMobile} />
        )}
      </ProfileFormField>

      <ProfileFormField label="在攀岩世界裡，想做的人生清單是什麼" isMobile={isMobile}>
        {isEditing ? (
          <Textarea 
            value={climbingBucketList} 
            onChange={(e) => onChange('climbingBucketList', e.target.value)}
            className="border-[#B6B3B3] resize-none min-h-[120px] text-sm md:text-base"
          />
        ) : (
          <ProfileTextDisplay text={climbingBucketList} minHeight="min-h-[80px]" isMobile={isMobile} />
        )}
      </ProfileFormField>

      <ProfileFormField label="對於初踏入攀岩的岩友，留言給他們的一句話" isMobile={isMobile}>
        {isEditing ? (
          <Input 
            value={adviceForBeginners} 
            onChange={(e) => onChange('adviceForBeginners', e.target.value)}
            className="border-[#B6B3B3] text-sm md:text-base"
          />
        ) : (
          <ProfileTextDisplay text={adviceForBeginners} isMobile={isMobile} />
        )}
      </ProfileFormField>
    </div>
  );
}
