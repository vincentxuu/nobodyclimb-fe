'use client'

import ProfilePageLayout from '@/components/profile/layout/ProfilePageLayout'
import RecommendationTab from '@/components/profile/RecommendationTab'

export default function RecommendationsPage() {
  return (
    <ProfilePageLayout>
      <div className="mx-auto max-w-2xl px-4 py-6">
        <RecommendationTab />
      </div>
    </ProfilePageLayout>
  )
}
