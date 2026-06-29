import * as React from 'react'
import { cn } from '@/lib/utils'

const ButtonGroup = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex -space-x-px rounded-lg shadow-sm shadow-black/5 rtl:space-x-reverse',
        '[&>*]:rounded-none [&>*:first-child]:rounded-s-lg [&>*:last-child]:rounded-e-lg',
        className
      )}
      role="group"
      {...props}
    />
  )
)
ButtonGroup.displayName = 'ButtonGroup'

export { ButtonGroup }
