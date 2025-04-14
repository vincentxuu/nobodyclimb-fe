'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ProfileProvider } from '@/components/profile/ProfileContext';
import { AnimatePresence, motion } from 'framer-motion';
import MobileNav from './MobileNav';

// 模擬用戶身份驗證檢查 - 在實際環境中，這裡會使用你的認證系統
const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    // 這裡簡單模擬一個已登入狀態
    // 實際應用中，應該檢查 localStorage、cookie 或其他身份驗證狀態
    const checkAuth = async () => {
      // 假設用戶已登入 - 在實際應用中，這裡會有真實的身份驗證檢查
      // 例如：const isLoggedIn = localStorage.getItem('token') !== null;
      const isLoggedIn = true; // 暫時設為 true 以便開發
      
      setIsAuthenticated(isLoggedIn);
    };
    
    checkAuth();
  }, []);
  
  return { isAuthenticated, isLoading: isAuthenticated === null };
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  // 檢測視窗寬度
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // 立即檢查一次
    checkIfMobile();
    
    // 監聽視窗大小變化
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // 檢查使用者是否已登入
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(pathname || '/profile'));
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  // 如果正在驗證中，顯示載入中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <AnimatePresence>
          <motion.div 
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-10 h-10 border-t-2 border-[#1B1A1A] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#3F3D3D]">載入中...</p>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  // 已登入時顯示內容，並使用 ProfileProvider
  return (
    <ProfileProvider>
      <div className="bg-[#F5F5F5] min-h-screen">
        {/* 手機版導航列 */}
        <div className="block md:hidden sticky top-0 z-50">
          <MobileNav />
        </div>
        
        {/* 頁面內容區域 - 增加手機版 padding */}
        <div className="md:py-6">
          {children}
        </div>
      </div>
    </ProfileProvider>
  );
}
