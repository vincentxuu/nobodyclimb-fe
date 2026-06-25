'use client'

import { useEffect } from 'react'

export function QuizLayoutWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.classList.add('quiz-mode')
    return () => document.body.classList.remove('quiz-mode')
  }, [])

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        body.quiz-mode nav,
        body.quiz-mode .navbar,
        body.quiz-mode footer { display: none !important; }
        body.quiz-mode main { padding-top: 0 !important; min-height: 100vh !important; }
      `,
        }}
      />
      {children}
    </>
  )
}
