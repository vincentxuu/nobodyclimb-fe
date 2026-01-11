'use client'

import React, { useState, useEffect } from 'react'
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
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 rounded-full bg-primary p-3 text-white shadow-lg transition-all duration-300 hover:bg-black"
          aria-label="回到頂部"
        >
          <ChevronUp size={24} />
        </button>
      )}
    </>
  )
}

export default BackToTop
