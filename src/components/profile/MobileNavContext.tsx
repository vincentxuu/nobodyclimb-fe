'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface MobileNavContextType {
  isMobile: boolean;
}

const MobileNavContext = createContext<MobileNavContextType | undefined>(undefined);

export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  // 檢測視窗寬度來判斷是否為手機版
  useEffect(() => {
    // 初始檢查
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

  return (
    <MobileNavContext.Provider value={{ isMobile }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav() {
  const context = useContext(MobileNavContext);
  if (context === undefined) {
    throw new Error('useMobileNav must be used within a MobileNavProvider');
  }
  return context;
}
