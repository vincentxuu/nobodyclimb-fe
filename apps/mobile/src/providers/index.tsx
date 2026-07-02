/**
 * App Providers
 *
 * 整合所有 Providers
 */

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { TamaguiProvider } from '@tamagui/core'
import { type ReactNode, useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { ChatWidget } from '@/components/ai'
import { AuthInitializer as StoryPromptInitializer } from '@/components/shared/AuthInitializer'
import { ClaimContentProvider } from '@/components/shared/ClaimContentModal'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { PushNotificationManager } from '@/components/shared/PushNotificationManager'
import { ShareInvitation } from '@/components/shared/ShareInvitation'
import { ToastProvider } from '@/components/ui/Toast'
import { tokenStorage, useAuthStore } from '@/store/authStore'
import config from '../../tamagui.config'
import { QueryProvider } from './QueryProvider'

interface ProvidersProps {
  children: ReactNode
}

const ENABLE_AI_CHAT = process.env.EXPO_PUBLIC_ENABLE_AI_CHAT === 'true'

/**
 * Auth Initializer
 * 在 app 啟動時載入 tokens 並恢復認證狀態
 */
function AuthInitializer({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const hydrate = useAuthStore((state) => state.hydrate)

  useEffect(() => {
    async function init() {
      // 先載入 tokens 到記憶體
      await tokenStorage.loadTokens()
      // 然後恢復認證狀態
      await hydrate()
      setIsReady(true)
    }
    init()
  }, [hydrate])

  if (!isReady) {
    return null // 或者顯示 splash screen
  }

  return <>{children}</>
}

export function Providers({ children }: ProvidersProps) {
  const colorScheme = useColorScheme()

  return (
    <SafeAreaProvider>
      <TamaguiProvider config={config} defaultTheme={colorScheme ?? 'light'}>
        <QueryProvider>
          <BottomSheetModalProvider>
            <ToastProvider>
              <AuthInitializer>
                <ErrorBoundary>
                  <ClaimContentProvider>
                    {children}
                    <StoryPromptInitializer />
                    <PushNotificationManager />
                    <ShareInvitation />
                    {ENABLE_AI_CHAT && <ChatWidget />}
                  </ClaimContentProvider>
                </ErrorBoundary>
              </AuthInitializer>
            </ToastProvider>
          </BottomSheetModalProvider>
        </QueryProvider>
      </TamaguiProvider>
    </SafeAreaProvider>
  )
}
