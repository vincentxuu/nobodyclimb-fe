/**
 * Tabs 組件
 *
 * 標籤頁切換，與 apps/web/src/components/ui/tabs.tsx 對應
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { XStack, YStack } from 'tamagui'
import { SEMANTIC_COLORS, FONT_SIZE, DURATION } from '@nobodyclimb/constants'
import { Text } from './Text'

// Context
interface TabsContextValue {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component')
  }
  return context
}

// Tabs
export interface TabsProps {
  /** 預設選中的標籤 */
  defaultValue?: string
  /** 受控模式下的選中值 */
  value?: string
  /** 選中值變化時的回調 */
  onValueChange?: (value: string) => void
  /** 子元素 */
  children: React.ReactNode
}

export function Tabs({
  defaultValue = '',
  value,
  onValueChange,
  children,
}: TabsProps) {
  const [activeTab, setActiveTabState] = useState(value ?? defaultValue)

  const handleTabChange = useCallback(
    (newValue: string) => {
      if (value === undefined) {
        setActiveTabState(newValue)
      }
      onValueChange?.(newValue)
    },
    [onValueChange, value]
  )

  useEffect(() => {
    if (value !== undefined) {
      setActiveTabState(value)
    }
  }, [value])

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <YStack>{children}</YStack>
    </TabsContext.Provider>
  )
}

// TabsList
export interface TabsListProps {
  /** 子元素 */
  children: React.ReactNode
}

export function TabsList({ children }: TabsListProps) {
  return (
    <XStack
      backgroundColor="#F5F5F5"
      borderRadius={8}
      padding={4}
      alignItems="center"
    >
      {children}
    </XStack>
  )
}

// TabsTrigger
export interface TabsTriggerProps {
  /** 標籤值 */
  value: string
  /** 標籤內容 */
  children: React.ReactNode
  /** 是否禁用 */
  disabled?: boolean
}

export function TabsTrigger({ value, children, disabled = false }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext()
  const isActive = activeTab === value

  const scale = useSharedValue(1)
  const opacity = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withTiming(0.95, { duration: DURATION.fast })
    }
  }

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: DURATION.fast })
  }

  const handlePress = () => {
    if (!disabled) {
      setActiveTab(value)
    }
  }

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.trigger,
          isActive && styles.triggerActive,
          disabled && styles.triggerDisabled,
        ]}
      >
        <Text
          variant="body"
          color={isActive ? 'textMain' : 'textSubtle'}
          fontWeight={isActive ? '500' : '400'}
        >
          {children}
        </Text>
      </Pressable>
    </Animated.View>
  )
}

// TabsContent
export interface TabsContentProps {
  /** 標籤值 */
  value: string
  /** 內容 */
  children: React.ReactNode
}

export function TabsContent({ value, children }: TabsContentProps) {
  const { activeTab } = useTabsContext()
  const isActive = activeTab === value

  if (!isActive) return null

  return <View style={styles.content}>{children}</View>
}

const styles = StyleSheet.create({
  trigger: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  triggerDisabled: {
    opacity: 0.5,
  },
  content: {
    marginTop: 8,
  },
})

export { TabsContext, useTabsContext }
