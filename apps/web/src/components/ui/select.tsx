import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

// All interfaces defined at the top
interface SelectProps {
  value: string
  // eslint-disable-next-line no-unused-vars
  onValueChange: (_value: string) => void
  children: React.ReactNode
  disabled?: boolean
}

interface SelectTriggerProps {
  children: React.ReactNode
  displayText?: string
  open?: boolean
  onClick?: () => void
  className?: string
  disabled?: boolean
}

interface SelectValueProps {
  placeholder: string
  children?: React.ReactNode
  displayText?: string
}

interface SelectContentProps {
  children: React.ReactNode
  // eslint-disable-next-line no-unused-vars
  onValueChange?: (_value: string) => void
  onClose?: () => void
  className?: string
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  // eslint-disable-next-line no-unused-vars
  onSelect?: (_value: string) => void
  className?: string
}

// Components - defined after interfaces and in dependency order
const SelectValue = ({ placeholder, children, displayText }: SelectValueProps) => {
  return (
    <span className="block truncate">
      {displayText || children || <span className="text-[#6D6C6C]">{placeholder}</span>}
    </span>
  )
}

const SelectItem = ({ value, children, onSelect, className }: SelectItemProps) => {
  return (
    <div
      className={cn(
        'relative flex cursor-pointer select-none items-center px-4 py-2 text-sm outline-none',
        'hover:bg-[#F5F5F5]',
        className
      )}
      onClick={() => onSelect?.(value)}
    >
      {children}
    </div>
  )
}

const SelectContent = ({ children, onValueChange, onClose, className }: SelectContentProps) => {
  return (
    <div
      className={cn(
        'absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-[#B6B3B3] bg-white shadow-lg',
        className
      )}
    >
      <div className="max-h-60 overflow-auto">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === SelectItem) {
            return React.cloneElement(child as React.ReactElement<SelectItemProps>, {
              onSelect: (value: string) => {
                onValueChange?.(value)
                onClose?.()
              },
            })
          }
          return child
        })}
      </div>
    </div>
  )
}

const SelectTrigger = ({
  children,
  displayText,
  open,
  onClick,
  className,
  disabled,
}: SelectTriggerProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center justify-between rounded-md border border-[#B6B3B3] bg-white px-4 py-2 text-sm',
        'cursor-pointer focus:outline-none',
        disabled && 'cursor-not-allowed opacity-50',
        open && 'border-[#1B1A1A]',
        className
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectValue) {
          return React.cloneElement(child as React.ReactElement<SelectValueProps>, {
            displayText,
          })
        }
        return child
      })}
      <ChevronDown className={cn('h-4 w-4 flex-shrink-0 transition-transform', open && 'rotate-180 transform')} />
    </div>
  )
}

const Select = ({ value, onValueChange, children, disabled }: SelectProps) => {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  // 處理點擊外部關閉下拉選單
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 從 SelectContent 中找到匹配 value 的 SelectItem 的顯示文字
  const getDisplayText = (currentValue: string): string | undefined => {
    let displayText: string | undefined

    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child) && child.type === SelectContent) {
        const contentChild = child as React.ReactElement<SelectContentProps>
        React.Children.forEach(contentChild.props.children, (item) => {
          if (React.isValidElement(item) && item.type === SelectItem) {
            const itemElement = item as React.ReactElement<SelectItemProps>
            if (itemElement.props.value === currentValue) {
              // 取得 SelectItem 的 children 作為顯示文字
              const itemChildren = itemElement.props.children
              displayText = typeof itemChildren === 'string' ? itemChildren : currentValue
            }
          }
        })
      }
    })

    return displayText
  }

  const displayText = value ? getDisplayText(value) : undefined

  return (
    <div ref={ref} className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectTrigger) {
          return React.cloneElement(child as React.ReactElement<SelectTriggerProps>, {
            onClick: () => !disabled && setOpen(!open),
            displayText,
            open,
            disabled,
          })
        }

        if (React.isValidElement(child) && child.type === SelectContent) {
          if (!open) return null

          return React.cloneElement(child as React.ReactElement<SelectContentProps>, {
            onValueChange,
            onClose: () => setOpen(false),
          })
        }

        return child
      })}
    </div>
  )
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
