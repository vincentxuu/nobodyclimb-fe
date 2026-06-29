import * as React from 'react'
import { cn } from '@/lib/utils'

const Empty = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-8 text-center',
        className
      )}
      {...props}
    />
  )
)
Empty.displayName = 'Empty'

const EmptyIcon = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-12 w-12 items-center justify-center rounded-full bg-muted [&>svg]:h-6 [&>svg]:w-6 [&>svg]:text-muted-foreground',
        className
      )}
      {...props}
    />
  )
)
EmptyIcon.displayName = 'EmptyIcon'

const EmptyTitle = React.forwardRef<HTMLHeadingElement, React.ComponentProps<'h3'>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
  )
)
EmptyTitle.displayName = 'EmptyTitle'

const EmptyDescription = React.forwardRef<HTMLParagraphElement, React.ComponentProps<'p'>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />
  )
)
EmptyDescription.displayName = 'EmptyDescription'

const EmptyAction = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('mt-2', className)} {...props} />
)
EmptyAction.displayName = 'EmptyAction'

export { Empty, EmptyAction, EmptyDescription, EmptyIcon, EmptyTitle }
