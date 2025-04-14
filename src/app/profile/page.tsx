'use client';
import React from 'react';
import ProfileSidebar from '@/components/ProfileSidebar';
import ProfileContainer from '@/components/profile/ProfileContainer';

export default function ProfilePage() {
  return (
    <div className="container mx-auto px-4 md:px-6">
      <div className="flex flex-col md:flex-row md:space-x-8">
        {/* 側邊選單 - 在桌面版才顯示 */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <ProfileSidebar />
        </div>
        
        {/* 主要內容區域 */}
        <div className="flex-1 mt-16 md:mt-0">
          <ProfileContainer />
        </div>
      </div>
    </div>
  );
}
