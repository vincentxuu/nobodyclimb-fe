import * as React from 'react'
import { cn } from '@/lib/utils'

const Attachment = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-3 rounded-lg border bg-card p-3 text-sm', className)}
      {...props}
    />
  )
)
Attachment.displayName = 'Attachment'

const AttachmentIcon = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-muted-foreground',
        className
      )}
      {...props}
    />
  )
)
AttachmentIcon.displayName = 'AttachmentIcon'

const AttachmentContent = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex min-w-0 flex-1 flex-col gap-0.5', className)} {...props} />
  )
)
AttachmentContent.displayName = 'AttachmentContent'

const AttachmentTitle = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('truncate font-medium', className)} {...props} />
  )
)
AttachmentTitle.displayName = 'AttachmentTitle'

const AttachmentMeta = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-xs text-muted-foreground', className)} {...props} />
  )
)
AttachmentMeta.displayName = 'AttachmentMeta'

const AttachmentActions = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('ml-auto flex shrink-0 items-center gap-1', className)}
      {...props}
    />
  )
)
AttachmentActions.displayName = 'AttachmentActions'

export {
  Attachment,
  AttachmentActions,
  AttachmentContent,
  AttachmentIcon,
  AttachmentMeta,
  AttachmentTitle,
}
