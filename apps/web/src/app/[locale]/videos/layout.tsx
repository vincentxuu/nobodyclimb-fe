import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '攀岩影片',
  description: '精選攀岩影片，包含技術教學、比賽實況、戶外攀岩紀錄等，觀看世界級攀岩者的精彩表演。',
  keywords: ['攀岩影片', '攀岩教學影片', '抱石影片', '攀岩比賽', 'Adam Ondra', 'Janja Garnbret'],
  openGraph: {
    title: '攀岩影片 | NobodyClimb',
    description: '精選攀岩影片，觀看世界級攀岩者的精彩表演與教學。',
    type: 'website',
  },
}

export default function VideosLayout({ children }: { children: React.ReactNode }) {
  return children
}
