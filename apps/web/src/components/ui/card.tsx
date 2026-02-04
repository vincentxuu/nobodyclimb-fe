import * as React from 'react'
import { ArrowRightCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'normal' | 'homepage'
  state?: 'normal' | 'hover'
  device?: 'desktop' | 'mobile'
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  // eslint-disable-next-line no-unused-vars
  ({ className, type = 'normal', state = 'normal', device: _device = 'desktop', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'overflow-hidden rounded-lg bg-white shadow-sm',
        type === 'homepage' ? 'cursor-pointer' : '',
        state === 'hover' ? 'shadow-md' : '',
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardMedia = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('relative overflow-hidden', className)} {...props} />
  )
)
CardMedia.displayName = 'CardMedia'

interface CardInfoProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'normal' | 'homepage'
  device?: 'desktop' | 'mobile'
}

const CardInfo = React.forwardRef<HTMLDivElement, CardInfoProps>(
  ({ className, type = 'normal', device = 'desktop', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col p-4 md:p-5',
        type === 'homepage' && device === 'desktop' ? 'p-5' : '',
        type === 'homepage' && device === 'mobile' ? 'p-4' : '',
        className
      )}
      {...props}
    />
  )
)
CardInfo.displayName = 'CardInfo'

interface CardTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  experience?: string
  type?: 'normal' | 'homepage'
  showArrow?: boolean
}

const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
  (
    // eslint-disable-next-line no-unused-vars
    { className, title, subtitle: _subtitle, experience, type: _type = 'normal', showArrow = false, ...props },
    ref
  ) => (
    <div ref={ref} className={cn('mb-3 flex items-center justify-between', className)} {...props}>
      <div className="space-y-1">
        <h3 className="text-2xl font-medium leading-tight text-[#1B1A1A]">{title}</h3>
        {experience && (
          <div className="flex items-center gap-2 text-sm text-[#535353]">
            <span>攀岩資歷</span>
            <div className="h-4 w-0.5 bg-[#FAF40A]"></div>
            <span>{experience}</span>
          </div>
        )}
      </div>

      {showArrow && <ArrowRightCircle size={22} className="text-[#1B1A1A]" />}
    </div>
  )
)
CardTitle.displayName = 'CardTitle'

// 讓 CardContent 能夠適配不同的元素類型，包括 motion.div
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, as: Component = 'div', ...props }, ref) => {
    return <Component ref={ref} className={cn('text-sm text-[#1B1A1A]', className)} {...props} />
  }
)
CardContent.displayName = 'CardContent'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

export { Card, CardMedia, CardInfo, CardTitle, CardContent, CardHeader, CardFooter, CardDescription }
