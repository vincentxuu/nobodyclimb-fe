import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '攝影集',
  description: '攀岩攝影作品集，紀錄攀岩者在岩壁上的精彩瞬間，展現攀岩運動的力與美。',
  keywords: ['攀岩攝影', '攀岩照片', '戶外攀岩照片', '抱石攝影'],
  openGraph: {
    title: '攝影集 | NobodyClimb',
    description: '攀岩攝影作品集，紀錄攀岩者在岩壁上的精彩瞬間。',
    type: 'website',
  },
}

export default function GalleryLayout({ children }: { children: React.ReactNode }) {
  return children
}
