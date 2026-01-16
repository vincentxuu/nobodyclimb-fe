'use client'

import { Suspense } from 'react'
import { ProfileProvider } from '@/components/profile/ProfileContext'
import ProfileEditorVersionB from '@/components/profile/dashboard/ProfileEditorVersionB'

function ProfileFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProfileProvider>
      <Suspense fallback={<ProfileFallback />}>
        <ProfileEditorVersionB />
      </Suspense>
    </ProfileProvider>
  )
}
