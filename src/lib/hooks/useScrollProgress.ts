import { useState, useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'

/**
 * 監聽頁面滾動進度的 hook
 * 計算從頁面頂部滾動到底部的進度百分比
 * 並將進度存儲到 UI Store 中，用於顯示頁面閱讀進度條
 * 
 * @returns {number} 滾動進度百分比，範圍 0-100
 */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState<number>(0)
  const setScrollProgress = useUIStore((state) => state.setScrollProgress)
  
  useEffect(() => {
    // 如果不是客戶端環境，不執行後續邏輯
    if (typeof window === 'undefined') return
    
    // 計算滾動進度的函數
    const calculateScrollProgress = () => {
      // 頁面可滾動的總高度 = 頁面總高度 - 視窗高度
      const totalHeight = document.body.scrollHeight - window.innerHeight
      
      // 如果頁面無法滾動（內容太少），進度設為 0
      if (totalHeight <= 0) {
        setProgress(0)
        setScrollProgress(0)
        return
      }
      
      // 目前已滾動的距離
      const scrollDistance = window.scrollY
      
      // 計算進度百分比
      const currentProgress = Math.min(100, Math.max(0, (scrollDistance / totalHeight) * 100))
      
      setProgress(currentProgress)
      setScrollProgress(currentProgress)
    }
    
    // 初始計算
    calculateScrollProgress()
    
    // 添加滾動事件監聽器
    window.addEventListener('scroll', calculateScrollProgress, { passive: true })
    
    // 添加視窗大小變化監聽器（視窗大小改變可能影響總滾動高度）
    window.addEventListener('resize', calculateScrollProgress, { passive: true })
    
    // 清理函數
    return () => {
      window.removeEventListener('scroll', calculateScrollProgress)
      window.removeEventListener('resize', calculateScrollProgress)
    }
  }, [setScrollProgress])
  
  return progress
}
