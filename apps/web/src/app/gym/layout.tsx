import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '岩館',
  description: '台灣室內攀岩館完整介紹，包含抱石館、上攀館，提供地址、營業時間、設施、價格等詳細資訊。',
  keywords: ['攀岩館', '抱石館', '室內攀岩', '台北攀岩館', '台中攀岩館', '高雄攀岩館'],
  openGraph: {
    title: '岩館 | NobodyClimb',
    description: '台灣室內攀岩館完整介紹，找到離你最近的攀岩館。',
    type: 'website',
  },
}

export default function GymLayout({ children }: { children: React.ReactNode }) {
  return children
}
