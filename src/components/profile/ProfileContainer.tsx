'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfilePageHeader from './ProfilePageHeader';
import ProfileDivider from './ProfileDivider';
import BasicInfoSection from './BasicInfoSection';
import ClimbingInfoSection from './ClimbingInfoSection';
import ClimbingExperienceSection from './ClimbingExperienceSection';
import PublicSettingSection from './PublicSettingSection';
import ProfileActionButtons from './ProfileActionButtons';
import { useProfile } from './ProfileContext';

export default function ProfileContainer() {
  const { profileData, setProfileData, isEditing, setIsEditing } = useProfile();
  const originalData = { ...profileData }; // Store the original profile data
  const [isMobile, setIsMobile] = useState(false);

  // 檢測是否為手機版
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    
    window.addEventListener('resize', checkIfMobile);
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // 處理表單變更
  const handleChange = (field: string, value: string | boolean) => {
    setProfileData({
      ...profileData,
      [field]: value,
    });
  };

  // 處理儲存
  const handleSave = () => {
    // 這裡應該會有API呼叫來保存資料
    console.log('儲存資料:', profileData);
    setIsEditing(false);
    
    // 使用 alert 代替 toast
    alert('資料儲存成功');
  };

  return (
    <motion.div
      className="flex-1"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white rounded-sm p-4 md:p-8">
        <ProfilePageHeader
          title="Profile Page"
          isEditing={isEditing}
          onEdit={() => setIsEditing(true)}
          isMobile={isMobile}
        />
        <div className="space-y-6">
          <BasicInfoSection
            name={profileData.name}
            isEditing={isEditing}
            isMobile={isMobile}
            onChange={handleChange}
          />
          <ProfileDivider />
          <ClimbingInfoSection
            startYear={profileData.startYear}
            frequentGyms={profileData.frequentGyms}
            favoriteRouteType={profileData.favoriteRouteType}
            isEditing={isEditing}
            isMobile={isMobile}
            onChange={handleChange}
          />
          <ProfileDivider />
          <ClimbingExperienceSection
            climbingReason={profileData.climbingReason}
            climbingMeaning={profileData.climbingMeaning}
            climbingBucketList={profileData.climbingBucketList}
            adviceForBeginners={profileData.adviceForBeginners}
            isEditing={isEditing}
            isMobile={isMobile}
            onChange={handleChange}
          />
          <ProfileDivider />
          <PublicSettingSection
            isPublic={profileData.isPublic}
            isMobile={isMobile}
            onChange={handleChange}
          />
          {isEditing && (
            <ProfileActionButtons
              onCancel={() => {
                setIsEditing(false);
                setProfileData(originalData);
              }}
              onSave={handleSave}
              isMobile={isMobile}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
