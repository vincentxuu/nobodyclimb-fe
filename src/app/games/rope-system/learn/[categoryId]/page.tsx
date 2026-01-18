'use client'

import * as React from 'react'
import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { GameCanvas } from '@/components/games/rope-system'
import { CATEGORIES, ROUTES } from '@/lib/games/rope-system/constants'
import type { Question } from '@/lib/games/rope-system/types'

// 模擬題目資料（實際開發時會從 API 取得）
const mockQuestions: Record<string, Question[]> = {
  'sport-belay': [
    {
      id: 'sb-1',
      categoryId: 'sport-belay',
      type: 'choice',
      difficulty: 1,
      scenario: '你準備使用 ATC 確保器進行頂繩確保。',
      question: '繩索穿過 ATC 的正確方向是？',
      options: [
        { id: 'a', text: '攀登者端在上，制動端在下' },
        { id: 'b', text: '攀登者端在下，制動端在上' },
        { id: 'c', text: '兩端都可以，沒有差別' },
        { id: 'd', text: '視確保器型號而定' },
      ],
      correctAnswer: 'a',
      explanation:
        'ATC 的設計讓制動端（下方）產生更大的摩擦力。如果裝反，制動效果會大幅降低，發生墜落時可能無法有效制停。',
      hint: '思考摩擦力的產生原理',
      referenceSources: ['AMGA Single Pitch Instructor Manual'],
    },
    {
      id: 'sb-2',
      categoryId: 'sport-belay',
      type: 'choice',
      difficulty: 1,
      question: '確保者的制動手應該：',
      options: [
        { id: 'a', text: '始終保持在繩索上方' },
        { id: 'b', text: '始終保持在繩索下方' },
        { id: 'c', text: '可以隨意放置' },
        { id: 'd', text: '只在墜落時握住繩索' },
      ],
      correctAnswer: 'b',
      explanation:
        '制動手應始終保持在繩索下方（制動位置），這樣才能在緊急情況下立即制停。鬆開制動手或將其移至繩索上方會造成危險。',
      referenceSources: ['Climbing Anchors by John Long'],
    },
    {
      id: 'sb-3',
      categoryId: 'sport-belay',
      type: 'ordering',
      difficulty: 2,
      question: '請依序排列頂繩確保的正確收繩步驟：',
      options: [
        { id: 'step1', text: '導引手拉繩' },
        { id: 'step2', text: '制動手下滑至確保器' },
        { id: 'step3', text: '兩手同時握住繩索' },
        { id: 'step4', text: '制動手回到制動位置' },
      ],
      correctAnswer: ['step1', 'step3', 'step2', 'step4'],
      explanation:
        '正確的 PBUS (Pull, Brake, Under, Slide) 技術能確保制動手永遠不會完全離開繩索。',
      referenceSources: ['Gym Climbing by Matt Burbach'],
    },
    {
      id: 'sb-4',
      categoryId: 'sport-belay',
      type: 'situation',
      difficulty: 2,
      scenario:
        '攀登者正在岩壁中段攀爬，突然喊出「Take！」。',
      question: '身為確保者，你應該：',
      options: [
        { id: 'a', text: '立即收緊繩索並坐下制動' },
        { id: 'b', text: '繼續給繩讓攀登者下降' },
        { id: 'c', text: '詢問攀登者發生什麼事' },
        { id: 'd', text: '等待攀登者下一步指示' },
      ],
      correctAnswer: 'a',
      explanation:
        '「Take」是要求確保者收緊繩索並承接體重的指令。確保者應立即反應，收繩並轉入制動姿勢，讓攀登者可以安全休息或評估情況。',
    },
    {
      id: 'sb-5',
      categoryId: 'sport-belay',
      type: 'choice',
      difficulty: 1,
      question: '開始確保前，應該進行的安全檢查不包括：',
      options: [
        { id: 'a', text: '確認雙方繩結正確' },
        { id: 'b', text: '確認確保器裝置正確' },
        { id: 'c', text: '確認攀登者的攀爬計畫' },
        { id: 'd', text: '確認鉤環已鎖緊' },
      ],
      correctAnswer: 'c',
      explanation:
        '安全檢查應包括：繩結、確保器裝置、鉤環鎖緊、安全吊帶穿著正確。攀爬計畫雖然重要，但不屬於安全檢查的核心項目。',
      referenceSources: ['UIAA Safety Standards'],
    },
  ],
  'sport-lead': [
    {
      id: 'sl-1',
      categoryId: 'sport-lead',
      type: 'choice',
      difficulty: 2,
      question: '先鋒攀登時，掛繩的正確方向是？',
      options: [
        { id: 'a', text: '繩索從快扣外側進入，內側穿出' },
        { id: 'b', text: '繩索從快扣內側進入，外側穿出' },
        { id: 'c', text: '兩種方向都可以' },
        { id: 'd', text: '視快扣類型而定' },
      ],
      correctAnswer: 'a',
      explanation:
        '繩索應從快扣外側（遠離岩壁）進入，內側（靠近岩壁）穿出。錯誤的掛繩方向可能導致墜落時繩索脫離快扣。',
      referenceSources: ['Freedom of the Hills'],
    },
    {
      id: 'sl-2',
      categoryId: 'sport-lead',
      type: 'choice',
      difficulty: 2,
      question: '先鋒確保時，適當的給繩量應該：',
      options: [
        { id: 'a', text: '越少越好，保持繩索繃緊' },
        { id: 'b', text: '越多越好，給攀登者自由' },
        { id: 'c', text: '維持輕微鬆弛，跟隨攀登者動作' },
        { id: 'd', text: '固定不變，不需調整' },
      ],
      correctAnswer: 'c',
      explanation:
        '過緊的繩索會影響攀登者動作，過鬆則增加墜落距離。適當的鬆弛度能讓攀登者自由移動，同時確保墜落時能及時制動。',
    },
    {
      id: 'sl-3',
      categoryId: 'sport-lead',
      type: 'situation',
      difficulty: 2,
      scenario: '攀登者剛掛好第三個快扣，正準備往上攀爬。',
      question: '此時確保者應該注意什麼？',
      options: [
        { id: 'a', text: '收緊繩索防止墜落' },
        { id: 'b', text: '給繩讓攀登者能繼續往上' },
        { id: 'c', text: '準備動態確保減少衝擊力' },
        { id: 'd', text: '站在正下方以便觀察' },
      ],
      correctAnswer: 'b',
      explanation:
        '攀登者往上攀爬時需要繩索，確保者應適時給繩。站在正下方可能被墜落的攀登者砸到。',
    },
  ],
  'sport-toprope': [
    {
      id: 'st-1',
      categoryId: 'sport-toprope',
      type: 'choice',
      difficulty: 2,
      question: '架設頂繩系統時，固定點應該具備哪些特性？(SERENE)',
      options: [
        { id: 'a', text: '堅固、均衡、可調整' },
        { id: 'b', text: '堅固、冗餘、均衡、有效、無延伸' },
        { id: 'c', text: '簡單、經濟、快速' },
        { id: 'd', text: '輕量、耐用、防水' },
      ],
      correctAnswer: 'b',
      explanation:
        'SERENE 原則：Solid（堅固）、Equalized（均衡）、Redundant（冗餘）、Efficient（有效）、No Extension（無延伸）。這是評估固定點品質的重要標準。',
      referenceSources: ['AMGA Rock Guide Course Handbook'],
    },
    {
      id: 'st-2',
      categoryId: 'sport-toprope',
      type: 'choice',
      difficulty: 2,
      question: '頂繩架設完成後，應該進行什麼檢查？',
      options: [
        { id: 'a', text: '只需確認繩索穿過固定點' },
        { id: 'b', text: '確認所有鉤環已鎖緊，繩索無磨損' },
        { id: 'c', text: '快速看一眼即可開始攀爬' },
        { id: 'd', text: '只需確認繩長足夠' },
      ],
      correctAnswer: 'b',
      explanation:
        '完整的檢查應包括：所有鉤環已鎖緊、繩索無接觸銳利邊緣、固定點均衡受力、繩長足夠並有足夠末端。',
    },
  ],
  'sport-rappel': [
    {
      id: 'sr-1',
      categoryId: 'sport-rappel',
      type: 'choice',
      difficulty: 2,
      question: '垂降前最重要的檢查事項是？',
      options: [
        { id: 'a', text: '確認繩索長度足夠到達地面' },
        { id: 'b', text: '確認天氣狀況良好' },
        { id: 'c', text: '確認有足夠的日照' },
        { id: 'd', text: '確認岩壁表面乾燥' },
      ],
      correctAnswer: 'a',
      explanation:
        '繩索長度不足是垂降意外的常見原因。務必確認繩索能夠到達地面或下一個固定點，並在繩尾打上阻繩結作為備份。',
      referenceSources: ['Accidents in North American Climbing'],
    },
    {
      id: 'sr-2',
      categoryId: 'sport-rappel',
      type: 'ordering',
      difficulty: 2,
      question: '請排列正確的垂降準備順序：',
      options: [
        { id: 'step1', text: '確認備份系統已連接' },
        { id: 'step2', text: '穿繩並確認雙邊等長' },
        { id: 'step3', text: '安裝垂降確保器' },
        { id: 'step4', text: '拋繩並確認到達地面' },
      ],
      correctAnswer: ['step2', 'step4', 'step3', 'step1'],
      explanation:
        '正確順序確保在移除固定點保護前，垂降系統已完整建立。先穿繩、確認繩長，再安裝確保器和備份。',
    },
  ],
}

// 為其他類別生成簡單的模擬題目
const generateMockQuestions = (categoryId: string): Question[] => {
  const category = CATEGORIES.find((c) => c.id === categoryId)
  if (!category) return []

  return Array.from({ length: 5 }, (_, i) => ({
    id: `${categoryId}-${i + 1}`,
    categoryId,
    type: i % 3 === 2 ? 'ordering' : 'choice' as const,
    difficulty: category.difficulty as 1 | 2 | 3,
    question: `${category.name}練習題目 ${i + 1}`,
    options: [
      { id: 'a', text: '選項 A' },
      { id: 'b', text: '選項 B' },
      { id: 'c', text: '選項 C' },
      { id: 'd', text: '選項 D' },
    ],
    correctAnswer: i % 3 === 2 ? ['a', 'b', 'c', 'd'] : 'a',
    explanation: '這是練習題目的解釋說明。實際開發時會從 API 取得真實題目。',
  }))
}

export default function LearnModePage() {
  const params = useParams()
  const router = useRouter()
  const categoryId = params.categoryId as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 取得類別資料
  const category = useMemo(
    () => CATEGORIES.find((c) => c.id === categoryId),
    [categoryId]
  )

  // 載入題目
  useEffect(() => {
    if (!categoryId) return

    const loadQuestions = async () => {
      setIsLoading(true)
      try {
        // 模擬 API 延遲
        await new Promise((resolve) => setTimeout(resolve, 500))

        // 使用模擬資料或生成簡單題目
        const loadedQuestions =
          mockQuestions[categoryId] || generateMockQuestions(categoryId)

        if (loadedQuestions.length === 0) {
          router.push(ROUTES.HOME)
          return
        }

        // 隨機打亂題目順序
        setQuestions([...loadedQuestions].sort(() => Math.random() - 0.5))
      } finally {
        setIsLoading(false)
      }
    }

    loadQuestions()
  }, [categoryId, router])

  // 類別不存在
  if (!category) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-5xl">🤔</div>
          <h1 className="mb-2 text-xl font-bold text-[#1B1A1A]">
            找不到該類別
          </h1>
          <p className="text-[#535353]">請確認網址是否正確</p>
        </div>
      </div>
    )
  }

  // 載入中
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-[#FFE70C]" />
          <p className="text-[#535353]">正在載入題目...</p>
        </motion.div>
      </div>
    )
  }

  return (
    <GameCanvas
      mode="learn"
      questions={questions}
      category={category}
    />
  )
}
