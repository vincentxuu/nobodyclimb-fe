import * as React from 'react'
import { cn } from '@/lib/utils'

const Item = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground',
        className
      )}
      {...props}
    />
  )
)
Item.displayName = 'Item'

const ItemIcon = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border',
        className
      )}
      {...props}
    />
  )
)
ItemIcon.displayName = 'ItemIcon'

const ItemContent = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex min-w-0 flex-1 flex-col gap-0.5', className)} {...props} />
  )
)
ItemContent.displayName = 'ItemContent'

const ItemTitle = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('truncate font-medium', className)} {...props} />
  )
)
ItemTitle.displayName = 'ItemTitle'

const ItemDescription = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('truncate text-xs text-muted-foreground', className)} {...props} />
  )
)
ItemDescription.displayName = 'ItemDescription'

const ItemAction = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('ml-auto shrink-0', className)} {...props} />
  )
)
ItemAction.displayName = 'ItemAction'

export { Item, ItemAction, ItemContent, ItemDescription, ItemIcon, ItemTitle }
