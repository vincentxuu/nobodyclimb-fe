'use client'

import { Suspense } from 'react'
import ProfileEditorVersionB from '@/components/profile/dashboard/ProfileEditorVersionB'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'

function _ProfileFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProfilePageLayout>
      <Suspense fallback={<div className="flex h-96 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" /></div>}>
        <ProfileEditorVersionB />
      </Suspense>
    </ProfilePageLayout>
  )
}
