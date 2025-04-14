'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { WeatherInfo } from '@/components/layout/weather'

/**
 * 首頁英雄區組件
 * 展示網站主要視覺元素和標語
 */
export function Hero() {
  return (
    <div className="relative h-[100vh] w-full overflow-hidden pt-[80px]">
      {/* 背景圖片 */}
      <div className="absolute inset-0 bg-[#242424]/40" style={{
        background: 'linear-gradient(0deg, rgba(36, 36, 36, 0.4), rgba(36, 36, 36, 0.4)), url(/photo/cont-intro.jpeg)',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }} />
      
      {/* 內容 */}
      <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center text-white">
        
        <motion.div
          className="max-w-3xl space-y-6 flex flex-col items-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="mb-2 font-['Glow_Sans_TC'] text-[40px] font-bold tracking-[0.16em] leading-[1.733em]">
            緣起於一個 Nobody
          </h1>
          
          <div className="logo-container flex flex-col items-center gap-3">
            <Image 
              src="/logo/Nobodylimb-white.svg" 
              alt="NobodyClimb Logo" 
              width={140} 
              height={24}
              className="mt-2"
            />
          </div>
          
          <p className="mx-auto mt-6 max-w-[503px] font-['Noto_Sans_CJK_TC'] text-[16px] font-normal leading-[150%] text-center px-4 tracking-[0.01em]">
            希望有更多 Nobody 也一起 Climb，找到交流的地方
          </p>
        </motion.div>
      </div>
      
      {/* 向下捲動提示 */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.7, 
          delay: 0.5,
          repeat: Infinity,
          repeatType: "reverse",
          repeatDelay: 0.5
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </motion.div>
    </div>
  )
}
