import Image from 'next/image'
import { QuizLayoutWrapper } from '@/components/quiz/QuizLayoutWrapper'
import { Link } from '@/i18n/navigation'

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuizLayoutWrapper>
      <div className="flex min-h-screen flex-col">
        <header className="flex h-14 items-center border-b border-gray-100 px-4 md:h-16 md:px-6">
          <Link href="/" aria-label="前往首頁">
            <Image
              src="/logo/Nobodylimb-black.svg"
              alt="NobodyClimb Logo"
              width={120}
              height={32}
              priority
              className="h-6 w-auto md:h-8"
            />
          </Link>
        </header>
        <div className="flex-1">{children}</div>
      </div>
    </QuizLayoutWrapper>
  )
}
