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
  link?: {
    href: string
    text: string
  }
  tags?: string[]
}

interface FunFactsData {
  facts: FunFact[]
  meta: {
    total: number
    lastUpdated: string
  }
}

export function FunFactSection() {
  const [isRevealed, setIsRevealed] = useState(false)
  const [currentFact, setCurrentFact] = useState<FunFact | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadFunFacts() {
      try {
        const response = await fetch('/data/fun-facts.json')
        const data: FunFactsData = await response.json()

        if (data.facts && data.facts.length > 0) {
          // 隨機選擇一則冷知識
          const randomIndex = Math.floor(Math.random() * data.facts.length)
          setCurrentFact(data.facts[randomIndex])
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
            <div className="h-[72px] animate-pulse rounded-xl bg-white/50" />
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
                  <span className="text-xs font-medium tracking-wide text-brand-dark-hover">
                    你知道嗎？
                  </span>
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
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-lg font-bold text-brand-dark md:text-xl">
                          {currentFact.answer}
                        </p>
                        <p className="mt-1 text-sm text-text-subtle">{currentFact.detail}</p>
                      </div>
                      {currentFact.link && (
                        <Link
                          href={currentFact.link.href}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-accent/70 px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-accent"
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
