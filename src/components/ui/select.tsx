import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
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

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div ref={ref} className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type === SelectTrigger) {
          return React.cloneElement(child as React.ReactElement<any>, {
            onClick: () => !disabled && setOpen(!open),
            value,
            open,
            disabled,
          })
        }
        
        if (React.isValidElement(child) && child.type === SelectContent) {
          if (!open) return null
          
          return React.cloneElement(child as React.ReactElement<any>, {
            onValueChange,
            onClose: () => setOpen(false)
          })
        }
        
        return child
      })}
    </div>
  )
}

interface SelectTriggerProps {
  children: React.ReactNode;
  value?: string;
  open?: boolean;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const SelectTrigger = ({ 
  children, 
  value, 
  open, 
  onClick, 
  className,
  disabled
}: SelectTriggerProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-md border border-[#B6B3B3] bg-white px-4 py-2 text-sm",
        "focus:outline-none cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        open && "border-[#1B1A1A]",
        className
      )}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 transition-transform", open && "transform rotate-180")} />
    </div>
  )
}

interface SelectValueProps {
  placeholder: string;
  children?: React.ReactNode;
}

const SelectValue = ({ placeholder, children }: SelectValueProps) => {
  return (
    <span className="block truncate">
      {children || <span className="text-[#6D6C6C]">{placeholder}</span>}
    </span>
  )
}

interface SelectContentProps {
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  onClose?: () => void;
  className?: string;
}

const SelectContent = ({ 
  children, 
  onValueChange, 
  onClose,
  className
}: SelectContentProps) => {
  return (
    <div
      className={cn(
        "absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-[#B6B3B3] bg-white shadow-lg",
        className
      )}
    >
      <div className="max-h-60 overflow-auto">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === SelectItem) {
            return React.cloneElement(child as React.ReactElement<any>, {
              onSelect: (value: string) => {
                onValueChange?.(value)
                onClose?.()
              }
            })
          }
          return child
        })}
      </div>
    </div>
  )
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  onSelect?: (value: string) => void;
  className?: string;
}

const SelectItem = ({ value, children, onSelect, className }: SelectItemProps) => {
  return (
    <div
      className={cn(
        "relative flex cursor-pointer select-none items-center px-4 py-2 text-sm outline-none",
        "hover:bg-[#F5F5F5]",
        className
      )}
      onClick={() => onSelect?.(value)}
    >
      {children}
    </div>
  )
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
}
