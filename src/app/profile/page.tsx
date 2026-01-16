'use client'
import React, { Suspense } from 'react'
import { ProfileDashboard } from '@/components/profile/dashboard'
import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'

function ProfileDashboardFallback() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-brand-accent" />
    </div>
  )
}

export default function ProfilePage() {
  return (
    <ProfilePageLayout>
      <Suspense fallback={<ProfileDashboardFallback />}>
        <ProfileDashboard />
      </Suspense>
    </ProfilePageLayout>
  )
}
