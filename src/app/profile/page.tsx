'use client'

import { Suspense } from 'react'
import ProfileEditorV2Wrapper from '@/components/biography/editor/ProfileEditorV2Wrapper'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'

function ProfileFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProfilePageLayout>
      <Suspense fallback={<ProfileFallback />}>
        <ProfileEditorV2Wrapper />
      </Suspense>
    </ProfilePageLayout>
  )
}
