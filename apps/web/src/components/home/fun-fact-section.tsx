'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'

interface FunFact {
  id: string
  question: string
  answer: string
  detail: string
  category: string
  source?: string
  link?: {
    href: string
    text: string
  }
  tags?: string[]
}

// 判斷是否為有效的 URL
function isValidUrl(str: string): boolean {
  return str.startsWith('http://') || str.startsWith('https://')
}

interface FunFactsData {
  featured?: string // 指定顯示的題目 ID，留空則用原本邏輯
  facts: FunFact[]
  meta: {
    total: number
    lastUpdated: string
    categories: Record<string, string>
  }
}

// 每週七天對應的類別
const DAILY_CATEGORIES = [
  'taiwan',      // 週日
  'record',      // 週一
  'history',     // 週二
  'technique',   // 週三
  'gear',        // 週四
  'culture',     // 週五
  'competition', // 週六
] as const

// 類別顯示名稱
const CATEGORY_LABELS: Record<string, string> = {
  taiwan: '台灣攀岩',
  record: '世界紀錄',
  history: '攀岩歷史',
  technique: '技術知識',
  gear: '裝備知識',
  culture: '攀岩文化',
  competition: '競技攀岩',
}

// 根據日期生成穩定的偽隨機數
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function FunFactSection() {
  const [isRevealed, setIsRevealed] = useState(false)
  const [currentFact, setCurrentFact] = useState<FunFact | null>(null)
  const [categoryLabel, setCategoryLabel] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadFunFacts() {
      try {
        const response = await fetch('/data/fun-facts.json')
        const data: FunFactsData = await response.json()

        if (data.facts && data.facts.length > 0) {
          // 優先檢查是否有指定的 featured 題目
          if (data.featured) {
            const featuredFact = data.facts.find((fact) => fact.id === data.featured)
            if (featuredFact) {
              setCurrentFact(featuredFact)
              setCategoryLabel(CATEGORY_LABELS[featuredFact.category] || featuredFact.category)
              setIsLoading(false)
              return
            }
          }

          // 沒有 featured 或找不到，使用原本的每日類別邏輯
          const today = new Date()
          const dayOfWeek = today.getDay() // 0-6 (週日-週六)
          const todayCategory = DAILY_CATEGORIES[dayOfWeek]

          // 篩選當天類別的冷知識
          const categoryFacts = data.facts.filter((fact) => fact.category === todayCategory)

          if (categoryFacts.length > 0) {
            // 使用日期作為種子，確保同一天顯示同一則
            const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
            const index = Math.floor(seededRandom(dateSeed) * categoryFacts.length)
            setCurrentFact(categoryFacts[index])
            setCategoryLabel(CATEGORY_LABELS[todayCategory] || todayCategory)
          }
        }
      } catch (error) {
        console.error('Failed to load fun facts:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadFunFacts()
  }, [])

  if (isLoading) {
    return (
      <section className="bg-gradient-to-r from-brand-accent/20 to-brand-accent/10 py-4 md:py-6">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="rounded-xl bg-white/80 p-4 shadow-sm backdrop-blur-sm md:p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-accent/20" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-16 rounded bg-brand-accent/20" />
                  <div className="h-4 w-3/4 rounded bg-brand-accent/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (!currentFact) {
    return null
  }

  return (
    <section className="bg-gradient-to-r from-brand-accent/20 to-brand-accent/10 py-4 md:py-6">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl">
          <div
            className="cursor-pointer rounded-xl bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-all hover:shadow-md md:p-6"
            onClick={() => setIsRevealed(!isRevealed)}
          >
            {/* 標題區 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-accent/30">
                  <Lightbulb className="h-5 w-5 text-brand-dark" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium tracking-wide text-brand-dark-hover">
                      你知道嗎？
                    </span>
                    {categoryLabel && (
                      <span className="rounded-full bg-brand-accent/40 px-2 py-0.5 text-[10px] font-medium text-brand-dark">
                        {categoryLabel}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm font-medium text-brand-dark md:text-base">
                    {currentFact.question}
                  </p>
                </div>
              </div>
              <button
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-brand-accent/30 text-brand-dark transition-colors hover:bg-brand-accent/50"
                aria-label={isRevealed ? '隱藏答案' : '顯示答案'}
              >
                {isRevealed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            {/* 答案區 */}
            <AnimatePresence>
              {isRevealed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 border-t border-brand-accent/30 pt-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <p className="text-lg font-bold text-brand-dark md:text-xl">
                          {currentFact.answer}
                        </p>
                        <p className="mt-1 text-sm text-text-subtle">{currentFact.detail}</p>
                        {currentFact.source && isValidUrl(currentFact.source) && (
                          <a
                            href={currentFact.source}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-flex items-center gap-1 text-xs text-text-subtle/70 hover:text-brand-dark"
                            onClick={(e) => e.stopPropagation()}
                          >
                            了解更多
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      {currentFact.link && (
                        <Link
                          href={currentFact.link.href}
                          className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-brand-accent/70 px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-accent"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {currentFact.link.text}
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
