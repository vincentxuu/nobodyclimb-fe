'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/store/authStore'

export function AboutSection() {
  const { isAuthenticated } = useAuthStore()

  return (
    <section className="relative h-[500px] overflow-hidden bg-white">
      {/* 背景圖片 */}
      <div className="absolute inset-0">
        <div
          className="to-[#FFFFFF]/33 absolute inset-0 bg-gradient-to-b from-[#F5F5F5]"
          style={{
            backgroundImage:
              'linear-gradient(180deg, #F5F5F5 1.35%, rgba(255, 255, 255, 0.33) 100%), url(/photo/cont-about.jpeg)',
            backgroundSize: 'cover',
          }}
        />
      </div>

      {/* 內容區域 */}
      <div className="container relative z-10 mx-auto flex h-full flex-col items-center justify-center px-4 text-center">
        <h2 className="text-[32px] font-medium text-[#1B1A1A]">關於小人物攀岩</h2>

        <svg
          width="40"
          height="4"
          viewBox="0 0 40 4"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="my-2"
        >
          <rect width="40" height="4" fill="#1B1A1A" />
        </svg>

        <p className="mt-4 max-w-[582px] px-4 text-base text-[#1B1A1A]">
          緣起於一個 Nobody 很喜歡這項運動，希望有更多 Nobody 也能一起來 Climb
          <br />
          當然過程中一定會有一些疑惑，或許這裡能帶給你一些解答或收穫
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link href="/about" className="w-full sm:w-auto">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              認識小人物
            </Button>
          </Link>
          {!isAuthenticated && (
            <Link href="/auth/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-brand-accent/70 text-[#1B1A1A] hover:bg-brand-accent sm:w-auto">
                成為小人物
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}
