import * as React from 'react'
import { cn } from '@/lib/utils'

// 簡化的 Tabs 實現，不依賴 Radix UI
interface TabsContextValue {
  activeTab: string
  // eslint-disable-next-line no-unused-vars
  setActiveTab: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

interface TabsProps {
  defaultValue?: string
  value?: string
  // eslint-disable-next-line no-unused-vars
  onValueChange?: (_value: string) => void
  children: React.ReactNode
  className?: string
}

const Tabs = ({ defaultValue, value, onValueChange, children, className }: TabsProps) => {
  const [activeTab, setActiveTab] = React.useState(value || defaultValue || '')

  const handleTabChange = React.useCallback(
    (newValue: string) => {
      if (!value) {
        setActiveTab(newValue)
      }
      onValueChange?.(newValue)
    },
    [onValueChange, value]
  )

  React.useEffect(() => {
    if (value) {
      setActiveTab(value)
    }
  }, [value])

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={cn('', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

interface TabsListProps {
  className?: string
  children: React.ReactNode
}

const TabsList = ({ className, children }: TabsListProps) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2',
        className
      )}
    >
      {children}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  className?: string
  children: React.ReactNode
}

const TabsTrigger = ({ value, className, children }: TabsTriggerProps) => {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component')
  }

  const { activeTab, setActiveTab } = context
  const isActive = activeTab === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-base font-medium rounded-md',
        'transition-all duration-200 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'text-[#1B1A1A] bg-[#EBEAEA]'
          : 'text-[#8E8C8C] hover:text-[#3F3D3D] hover:bg-[#F5F5F5]',
        className
      )}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
}

const TabsContent = ({ value, className, children }: TabsContentProps) => {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component')
  }

  const { activeTab } = context
  const isActive = activeTab === value

  if (!isActive) return null

  return (
    <div
      role="tabpanel"
      data-state={isActive ? 'active' : 'inactive'}
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2',
        className
      )}
    >
      {children}
    </div>
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
