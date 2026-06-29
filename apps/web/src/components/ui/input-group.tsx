import * as React from 'react'
import { cn } from '@/lib/utils'

const InputGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center rounded-md border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring',
        '[&>input]:border-0 [&>input]:shadow-none [&>input]:focus-visible:ring-0',
        className
      )}
      {...props}
    />
  )
)
InputGroup.displayName = 'InputGroup'

const InputGroupText = React.forwardRef<HTMLSpanElement, React.ComponentProps<'span'>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn('flex items-center px-3 text-sm text-muted-foreground', className)}
      {...props}
    />
  )
)
InputGroupText.displayName = 'InputGroupText'

export { InputGroup, InputGroupText }
