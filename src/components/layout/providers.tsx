'use client'

import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from '@/components/ui/toaster'
import { GOOGLE_CLIENT_ID } from '@/lib/constants'

interface ProvidersProps {
  children: ReactNode
}

// 創建一個React Query查詢客戶端
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分鐘
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
})

/**
 * 全局提供者組件
 * 包含React Query、主題提供者、Google OAuth等全局上下文
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  )
}
