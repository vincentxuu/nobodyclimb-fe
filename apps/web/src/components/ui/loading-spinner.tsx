'use client'

import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  className?: string
  inline?: boolean
  fullPage?: boolean
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
}

export function LoadingSpinner({
  size = 'lg',
  text,
  className,
  inline = false,
  fullPage = false,
}: LoadingSpinnerProps) {
  const content = (
    <div className={cn('flex items-center justify-center', className)}>
      <Spinner className={cn('text-muted-foreground', sizeMap[size], inline && 'mr-2')} />
      {text && <span className="ml-2 text-muted-foreground">{text}</span>}
    </div>
  )

  if (fullPage) {
    return <div className="flex min-h-[400px] items-center justify-center">{content}</div>
  }

  return content
}

export function LoadingPage({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-h-[50vh] items-center justify-center', className)}>
      <LoadingSpinner size="lg" />
    </div>
  )
}

export default LoadingSpinner
