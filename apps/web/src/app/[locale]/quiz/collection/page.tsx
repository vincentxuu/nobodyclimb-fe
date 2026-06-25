import { PERSONALITY_TYPES } from '@nobodyclimb/constants'
import type { Metadata } from 'next'
import { CollectionCard } from '@/components/quiz/CollectionCard'
import { SITE_NAME, SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: `8 種攀岩人格 — ${SITE_NAME} 攀岩人格測驗`,
  description: '碎岩者、鍛造者、野火、恆者、狙擊手、解碼者、浪人、禪者 — 探索 8 種攀岩人格類型',
  openGraph: {
    title: `8 種攀岩人格 — ${SITE_NAME} 攀岩人格測驗`,
    description: '探索 8 種攀岩人格類型，找到你的攀岩風格',
    url: `${SITE_URL}/quiz/collection`,
    images: [{ url: `${SITE_URL}/quiz/og/default.png`, width: 1200, height: 628 }],
    type: 'website',
  },
}

export default function CollectionPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-12">
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">8 種攀岩人格</h1>
        <p className="text-gray-500">探索每種攀岩人格的特質與風格</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PERSONALITY_TYPES.map((type) => (
          <CollectionCard key={type.code} personality={type} />
        ))}
      </div>
    </div>
  )
}
