import { getPersonalityType, PERSONALITY_TYPES } from '@nobodyclimb/constants'
import type { PersonalityTypeCode } from '@nobodyclimb/types'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ResultPageClient } from '@/components/quiz/ResultPageClient'
import { SITE_NAME, SITE_URL } from '@/lib/constants'

const VALID_CODES = PERSONALITY_TYPES.map((t) => t.code.toLowerCase())

export function generateStaticParams() {
  const locales = ['zh', 'en', 'ja']
  return locales.flatMap((locale) => VALID_CODES.map((type) => ({ locale, type })))
}

type Props = {
  params: Promise<{ type: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params
  const code = type.toUpperCase() as PersonalityTypeCode
  const personality = getPersonalityType(code)

  if (!personality) {
    return { title: '找不到結果' }
  }

  const title = `我是${personality.nameZh} ${personality.nameEn} — ${SITE_NAME} 攀岩人格測驗`
  const description = `${personality.tagline}。${personality.description.slice(0, 100)}...`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/quiz/result/${type}`,
      images: [{ url: `${SITE_URL}/quiz/og/${type}.png`, width: 1200, height: 628 }],
      type: 'website',
    },
  }
}

export default async function ResultPage({ params }: Props) {
  const { type } = await params
  const code = type.toUpperCase() as PersonalityTypeCode
  const personality = getPersonalityType(code)

  if (!personality) {
    notFound()
  }

  return <ResultPageClient personality={personality} />
}
