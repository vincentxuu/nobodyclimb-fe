'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface MessageScrollerProps extends React.ComponentProps<'div'> {
  autoScroll?: boolean
}

const MessageScroller = React.forwardRef<HTMLDivElement, MessageScrollerProps>(
  ({ className, autoScroll = true, children, ...props }, ref) => {
    const innerRef = React.useRef<HTMLDivElement>(null)
    const [isAtBottom, setIsAtBottom] = React.useState(true)

    const scrollRef = (ref as React.RefObject<HTMLDivElement>) || innerRef

    const scrollToBottom = React.useCallback(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, [scrollRef])

    React.useEffect(() => {
      if (autoScroll && isAtBottom) {
        scrollToBottom()
      }
    })

    const handleScroll = React.useCallback(() => {
      if (!scrollRef.current) return
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < 40)
    }, [scrollRef])

    return (
      <div className={cn('relative flex flex-col', className)} {...props}>
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
          {children}
        </div>
        {!isAtBottom && (
          <button
            type="button"
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border bg-background px-3 py-1.5 text-xs shadow-md transition-colors hover:bg-accent"
          >
            ↓ 捲動到底部
          </button>
        )}
      </div>
    )
  }
)
MessageScroller.displayName = 'MessageScroller'

export { MessageScroller }
