import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '@/lib/utils'

const markerVariants = cva('flex items-center gap-2 text-xs text-muted-foreground', {
  variants: {
    variant: {
      default: '',
      separator: 'my-4',
      bordered: 'my-2 rounded-lg border bg-muted/50 px-3 py-2',
      status: 'my-1 justify-center',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

interface MarkerProps extends React.ComponentProps<'div'>, VariantProps<typeof markerVariants> {}

const Marker = React.forwardRef<HTMLDivElement, MarkerProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} className={cn(markerVariants({ variant }), className)} {...props} />
  )
)
Marker.displayName = 'Marker'

const MarkerSeparator = React.forwardRef<HTMLDivElement, React.ComponentProps<'div'>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center gap-3 py-3', className)} {...props}>
      <div className="h-px flex-1 bg-border" />
      {children && <span className="shrink-0 text-xs text-muted-foreground">{children}</span>}
      <div className="h-px flex-1 bg-border" />
    </div>
  )
)
MarkerSeparator.displayName = 'MarkerSeparator'

export { Marker, MarkerSeparator, markerVariants }
