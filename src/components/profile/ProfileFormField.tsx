'use client';

import React from 'react';
import { Label } from '@/components/ui/label';

interface ProfileFormFieldProps {
  label: string;
  children: React.ReactNode;
  isMobile: boolean;
}

export default function ProfileFormField({ label, children, isMobile }: ProfileFormFieldProps) {
  return (
    <div className="space-y-2">
      <Label className={`text-[#3F3D3D] font-medium ${isMobile ? 'text-sm' : ''}`}>
        {label}
      </Label>
      {children}
    </div>
  );
}
