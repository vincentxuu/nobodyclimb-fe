import type { Metadata } from 'next'
import { QuizLanding } from '@/components/quiz/QuizLanding'
import { SITE_NAME, SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: `你是哪種攀岩者？ — ${SITE_NAME} 攀岩人格測驗`,
  description:
    '24 題攀岩人格測驗，3-5 分鐘探索你的攀岩性格。發現你是碎岩者、狙擊手、浪人還是禪者？立即測驗，找到你的攀岩人格！',
  openGraph: {
    title: `你是哪種攀岩者？ — ${SITE_NAME} 攀岩人格測驗`,
    description:
      '24 題攀岩人格測驗，3-5 分鐘探索你的攀岩性格。發現你是碎岩者、狙擊手、浪人還是禪者？',
    url: `${SITE_URL}/quiz`,
    images: [{ url: `${SITE_URL}/quiz/og/default.png`, width: 1200, height: 628 }],
    type: 'website',
  },
}

export default function QuizPage() {
  return <QuizLanding />
}
