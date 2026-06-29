import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const bubbleVariants = cva('relative max-w-full rounded-2xl px-4 py-2.5 text-sm', {
  variants: {
    variant: {
      received: 'bg-muted text-foreground rounded-tl-sm',
      sent: 'bg-primary text-primary-foreground rounded-tr-sm',
    },
  },
  defaultVariants: {
    variant: 'received',
  },
})

interface BubbleProps extends React.ComponentProps<'div'>, VariantProps<typeof bubbleVariants> {}

const Bubble = React.forwardRef<HTMLDivElement, BubbleProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(bubbleVariants({ variant }), className)} {...props} />
  )
)
Bubble.displayName = 'Bubble'

const BubbleActions = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-1 flex items-center gap-1', className)} {...props} />
  )
)
BubbleActions.displayName = 'BubbleActions'

export { Bubble, BubbleActions, bubbleVariants }
