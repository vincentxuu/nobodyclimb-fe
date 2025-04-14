'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface ProfilePageHeaderProps {
  title: string;
  isEditing: boolean;
  onEdit: () => void;
  isMobile: boolean;
}

export default function ProfilePageHeader({ title, isEditing, onEdit, isMobile }: ProfilePageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className={`${isMobile ? 'text-2xl' : 'text-4xl'} font-medium text-[#1B1A1A]`}>
        {title}
      </h1>
      {!isEditing && (
        <Button 
          variant="outline" 
          onClick={onEdit}
          className="border-[#1B1A1A] text-[#1B1A1A] hover:bg-[#F5F5F5] text-sm md:text-base"
        >
          編輯資料
        </Button>
      )}
    </div>
  );
}
