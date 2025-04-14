'use client'

import { useRouter } from 'next/navigation'

/**
 * Logo 組件
 * 顯示網站 Logo，並支援點擊回到首頁
 */
export default function Logo() {
  const router = useRouter()
  
  return (
    <div className="bg-[#FFE70C] h-[70px] flex items-center px-6">
      <div 
        className="flex items-center cursor-pointer" 
        onClick={() => router.push('/')}
        role="button"
        aria-label="前往首頁"
      >
        <img src="/logo/Nobodylimb-black.svg" alt="NobodyClimb Logo" className="h-8 w-auto" />
      </div>
    </div>
  )
}
