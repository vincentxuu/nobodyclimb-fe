import * as React from 'react'
import { cn } from '@/lib/utils'

const Field = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-2', className)} {...props} />
  )
)
Field.displayName = 'Field'

const FieldLabel = React.forwardRef<HTMLLabelElement, React.ComponentProps<'label'>>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  )
)
FieldLabel.displayName = 'FieldLabel'

const FieldDescription = React.forwardRef<HTMLParagraphElement, React.ComponentProps<'p'>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-[0.8rem] text-muted-foreground', className)} {...props} />
  )
)
FieldDescription.displayName = 'FieldDescription'

const FieldError = React.forwardRef<HTMLParagraphElement, React.ComponentProps<'p'>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-[0.8rem] font-medium text-destructive', className)}
      {...props}
    />
  )
)
FieldError.displayName = 'FieldError'

export { Field, FieldDescription, FieldError, FieldLabel }
