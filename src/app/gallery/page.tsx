'use client'

import React, { useState, useEffect, useCallback } from 'react'
import GalleryGrid from '@/components/gallery/gallery-grid'
import PhotoPopup from '@/components/gallery/photo-popup'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/ui/page-header'
import { Loader2 } from 'lucide-react'
import { galleryService } from '@/lib/api/services'
import { GalleryPhoto } from '@/lib/types'

// Transform API photo to component format
interface DisplayPhoto {
  id: string
  src: string
  alt: string
  location?: {
    country: string
    city: string
    spot: string
  }
  uploadDate?: string
  author?: {
    id: string
    username: string
    displayName?: string
    avatar?: string
  }
}

const transformPhoto = (photo: GalleryPhoto): DisplayPhoto => ({
  id: photo.id,
  src: photo.image_url,
  alt: photo.caption || '攀岩照片',
  location:
    photo.location_country || photo.location_city || photo.location_spot
      ? {
          country: photo.location_country || '',
          city: photo.location_city || '',
          spot: photo.location_spot || '',
        }
      : undefined,
  uploadDate: photo.created_at
    ? new Date(photo.created_at).toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
    : undefined,
  author: {
    id: photo.author_id,
    username: photo.username,
    displayName: photo.display_name,
    avatar: photo.author_avatar,
  },
})

const GalleryPage: React.FC = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<DisplayPhoto | null>(null)
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [photos, setPhotos] = useState<DisplayPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  // Fetch photos from API
  const fetchPhotos = useCallback(async (pageNum: number, append = false) => {
    try {
      if (pageNum === 1) {
        setIsLoading(true)
      } else {
        setIsLoadingMore(true)
      }
      setError(null)

      const response = await galleryService.getPhotos(pageNum, 18)

      if (response.success && response.data) {
        const transformedPhotos = response.data.map(transformPhoto)

        if (append) {
          setPhotos((prev) => [...prev, ...transformedPhotos])
        } else {
          setPhotos(transformedPhotos)
        }

        // Check if there are more photos
        const { pagination } = response
        setHasMore(pagination.page < pagination.total_pages)
      } else {
        setError('無法載入照片')
      }
    } catch (err) {
      console.error('Failed to fetch photos:', err)
      setError('載入照片時發生錯誤')
    } finally {
      setIsLoading(false)
      setIsLoadingMore(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    fetchPhotos(1)
  }, [fetchPhotos])

  const openPopup = (photo: DisplayPhoto, index: number) => {
    setSelectedPhoto(photo)
    setCurrentIndex(index)
  }

  const closePopup = () => {
    setSelectedPhoto(null)
  }

  const showNextPhoto = () => {
    const nextIndex = (currentIndex + 1) % photos.length
    setSelectedPhoto(photos[nextIndex])
    setCurrentIndex(nextIndex)
  }

  const showPrevPhoto = () => {
    const prevIndex = (currentIndex - 1 + photos.length) % photos.length
    setSelectedPhoto(photos[prevIndex])
    setCurrentIndex(prevIndex)
  }

  const loadMorePhotos = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchPhotos(nextPage, true)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <PageHeader title="攝影集" subtitle="欣賞小人物們攀岩的英姿" />

      <div className="container mx-auto px-4 py-6">

      {/* Loading State */}
      {isLoading && (
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <p className="mb-4 text-neutral-500">{error}</p>
          <Button variant="outline" onClick={() => fetchPhotos(1)}>
            重新載入
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && photos.length === 0 && (
        <div className="flex min-h-[400px] flex-col items-center justify-center">
          <p className="text-neutral-500">目前還沒有照片</p>
        </div>
      )}

      {/* Photos Grid */}
      {!isLoading && !error && photos.length > 0 && (
        <>
          <GalleryGrid photos={photos} onPhotoClick={openPopup} />

          {hasMore && (
            <div className="mt-8 text-center md:mt-12">
              <Button variant="outline" onClick={loadMorePhotos} disabled={isLoadingMore}>
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    載入中...
                  </>
                ) : (
                  '看更多'
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Photo Popup */}
      {selectedPhoto && (
        <PhotoPopup
          photo={selectedPhoto}
          onClose={closePopup}
          onNext={showNextPhoto}
          onPrev={showPrevPhoto}
        />
      )}
      </div>
    </div>
  )
}

export default GalleryPage
