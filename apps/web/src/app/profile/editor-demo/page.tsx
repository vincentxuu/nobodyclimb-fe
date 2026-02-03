'use client'

/**
 * Profile 編輯器試用頁面
 *
 * 路徑: /profile/editor-demo
 * 用於測試和選擇不同版本的 Profile 編輯器
 */

import { Suspense } from 'react'
import { ProfileProvider } from '@/components/profile/ProfileContext'
import ProfileEditorSelector from '@/components/profile/dashboard/ProfileEditorSelector'

export default function EditorDemoPage() {
  return (
    <ProfileProvider>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
          </div>
        }
      >
        <ProfileEditorSelector />
      </Suspense>
    </ProfileProvider>
  )
}
