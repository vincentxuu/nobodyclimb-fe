'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface ProfileActionButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  isMobile: boolean;
}

export default function ProfileActionButtons({ 
  onCancel, 
  onSave, 
  isMobile 
}: ProfileActionButtonsProps) {
  return (
    <div className={`flex ${isMobile ? 'flex-col' : 'justify-end'} gap-3 mt-6`}>
      <Button 
        variant="outline" 
        onClick={onCancel}
        className={`border-[#1B1A1A] text-[#1B1A1A] hover:bg-[#F5F5F5] ${isMobile ? 'w-full' : ''}`}
      >
        取消
      </Button>
      <Button 
        onClick={onSave}
        className={`bg-[#1B1A1A] text-white hover:bg-[#3F3D3D] ${isMobile ? 'w-full' : ''}`}
      >
        儲存資料
      </Button>
    </div>
  );
}
