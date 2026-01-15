import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '岩場',
  description: '探索台灣戶外攀岩岩場，包含龍洞、大砲岩、關子嶺等熱門地點，提供難度、路線、最佳季節等完整資訊。',
  keywords: ['台灣岩場', '戶外攀岩', '龍洞攀岩', '大砲岩', '攀岩地點', '運動攀登'],
  openGraph: {
    title: '岩場 | NobodyClimb',
    description: '探索台灣戶外攀岩岩場，找到適合你的攀岩地點。',
    type: 'website',
  },
}

export default function CragLayout({ children }: { children: React.ReactNode }) {
  return children
}
