'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp } from 'lucide-react'

export const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)

  // 監聽滾動事件，決定按鈕顯示與否
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)

    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  // 回到頂部的點擊事件
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          onClick={scrollToTop}
          className="fixed bottom-6 right-4 z-40 rounded-full bg-white p-2 shadow-md hover:bg-gray-200 md:bottom-10 md:right-8 md:p-3"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
          aria-label="回到頂部"
        >
          <ChevronUp className="h-5 w-5 md:h-6 md:w-6" />
        </motion.button>
      )}
    </AnimatePresence>
  )
}

export default BackToTop
