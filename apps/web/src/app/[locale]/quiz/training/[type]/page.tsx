import { getPersonalityType, PERSONALITY_TYPES } from '@nobodyclimb/constants'
import type { PersonalityTypeCode } from '@nobodyclimb/types'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { TrainingPageClient } from '@/components/quiz/training/TrainingPageClient'
import { SITE_NAME } from '@/lib/constants'

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
    return { title: '找不到訓練計畫' }
  }

  return {
    title: `${personality.nameZh} 訓練計畫 — ${SITE_NAME}`,
    description: `${personality.nameZh}的 4 週攀岩訓練計畫，透過「訓練你的反面」核心理念，成為更全面的攀岩者。`,
  }
}

export default async function TrainingPage({ params }: Props) {
  const { type } = await params
  const code = type.toUpperCase() as PersonalityTypeCode
  const personality = getPersonalityType(code)

  if (!personality) {
    notFound()
  }

  return <TrainingPageClient personality={personality} />
}
