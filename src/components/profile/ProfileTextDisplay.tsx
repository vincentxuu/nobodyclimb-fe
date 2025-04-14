'use client';

import React from 'react';

interface ProfileTextDisplayProps {
  text: string;
  minHeight?: string;
  isMobile: boolean;
}

export default function ProfileTextDisplay({ text, minHeight = "auto", isMobile }: ProfileTextDisplayProps) {
  return (
    <div className={`p-3 bg-white border border-[#B6B3B3] rounded-sm ${minHeight} ${isMobile ? 'text-sm' : ''}`}>
      {text}
    </div>
  );
}
