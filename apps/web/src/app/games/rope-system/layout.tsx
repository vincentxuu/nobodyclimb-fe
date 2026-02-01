import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '攀岩系統練習 | NobodyClimb',
  description: '透過互動式遊戲學習攀岩繩索系統操作，適用於自主學習與單位教學認證。',
  keywords: ['攀岩', '繩索系統', '確保', '先鋒', '頂繩', '垂降', '固定點'],
}

interface RopeSystemLayoutProps {
  children: React.ReactNode
}

export default function RopeSystemLayout({ children }: RopeSystemLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {children}
    </div>
  )
}
