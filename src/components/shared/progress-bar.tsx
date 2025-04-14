'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'

/**
 * 頁面閱讀進度條組件
 * 顯示使用者在頁面上的滾動進度
 */
export function ProgressBar() {
  const { scrollProgress, setScrollProgress } = useUIStore()
  
  useEffect(() => {
    // 計算滾動進度
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight
      const scrolled = (winScroll / height) * 100
      setScrollProgress(scrolled)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [setScrollProgress])
  
  return (
    <motion.div
      className="progress-bar"
      style={{ width: `${scrollProgress}%` }}
      initial={{ opacity: 0 }}
      animate={{
        opacity: scrollProgress > 0 ? 1 : 0,
      }}
      transition={{ duration: 0.2 }}
    />
  )
}
