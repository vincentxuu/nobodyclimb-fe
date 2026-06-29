import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const messageVariants = cva('flex gap-3 px-4 py-2', {
  variants: {
    align: {
      start: 'justify-start',
      end: 'flex-row-reverse',
    },
  },
  defaultVariants: {
    align: 'start',
  },
})

interface MessageProps extends React.ComponentProps<'div'>, VariantProps<typeof messageVariants> {}

const Message = React.forwardRef<HTMLDivElement, MessageProps>(
  ({ className, align, ...props }, ref) => (
    <div ref={ref} className={cn(messageVariants({ align }), className)} {...props} />
  )
)
Message.displayName = 'Message'

const MessageAvatar = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', className)}
      {...props}
    />
  )
)
MessageAvatar.displayName = 'MessageAvatar'

const MessageContent = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex min-w-0 max-w-[80%] flex-col gap-1', className)}
      {...props}
    />
  )
)
MessageContent.displayName = 'MessageContent'

const MessageHeader = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}
      {...props}
    />
  )
)
MessageHeader.displayName = 'MessageHeader'

const MessageFooter = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}
      {...props}
    />
  )
)
MessageFooter.displayName = 'MessageFooter'

export { Message, MessageAvatar, MessageContent, MessageFooter, MessageHeader }
