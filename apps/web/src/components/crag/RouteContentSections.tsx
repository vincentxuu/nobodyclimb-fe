'use client'

import React from 'react'
import { RouteStoriesSection } from '@/components/crag/RouteStoriesSection'
import { RoutePhotosSection } from '@/components/crag/RoutePhotosSection'
import { RouteYouTubeSection } from '@/components/crag/RouteYouTubeSection'
import { RouteInstagramSection } from '@/components/crag/RouteInstagramSection'
import { RouteAscentsSection } from '@/components/crag/RouteAscentsSection'

export interface RouteContentData {
  id: string
  name: string
  grade: string
  images?: string[]
  videos?: string[]
  youtubeVideos?: string[]
  instagramPosts?: string[]
}

interface RouteContentSectionsProps {
  route: RouteContentData
}

/**
 * 路線社群內容區塊組合
 * 包含：路線故事、社群照片、YouTube 影片、Instagram 分享、攀爬記錄
 */
export function RouteContentSections({ route }: RouteContentSectionsProps) {
  // 合併 videos 和 youtubeVideos
  const allVideos = [...(route.videos || []), ...(route.youtubeVideos || [])]

  return (
    <>
      {/* 路線故事 */}
      <RouteStoriesSection
        routeId={route.id}
        routeName={route.name}
        routeGrade={route.grade}
      />

      {/* 社群照片 */}
      <RoutePhotosSection
        routeId={route.id}
        routeName={route.name}
        staticPhotos={route.images}
      />

      {/* 攀登影片 (YouTube) */}
      <RouteYouTubeSection
        routeId={route.id}
        routeName={route.name}
        staticVideos={allVideos.length > 0 ? allVideos : route.youtubeVideos}
      />

      {/* Instagram 分享 */}
      <RouteInstagramSection
        routeId={route.id}
        routeName={route.name}
        staticPosts={route.instagramPosts}
      />

      {/* 攀爬記錄 */}
      <RouteAscentsSection
        routeId={route.id}
        routeName={route.name}
        routeGrade={route.grade}
      />
    </>
  )
}
