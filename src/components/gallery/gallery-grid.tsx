import React from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'

interface GalleryPhoto {
  id: string
  src: string
  alt: string
  location?: {
    country: string
    city: string
    spot: string
  }
  author?: {
    id: string
    username: string
    displayName?: string
    avatar?: string
  }
}

interface GalleryGridProps {
  photos: GalleryPhoto[]
  // eslint-disable-next-line no-unused-vars
  onPhotoClick: (_photo: GalleryPhoto, _index: number) => void
}

const GalleryGrid: React.FC<GalleryGridProps> = ({ photos, onPhotoClick }) => {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-3">
      {photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          className="group relative aspect-[2/3] cursor-pointer overflow-hidden"
          onClick={() => onPhotoClick(photo, index)}
          whileHover={{ scale: 1.03 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            priority={index < 12}
          />
          {/* Hover effect with location and author info */}
          <div className="absolute inset-0 flex flex-col justify-between bg-black bg-opacity-0 p-2 opacity-0 transition-opacity duration-300 group-hover:bg-opacity-40 group-hover:opacity-100 md:p-3">
            {/* Author info at top */}
            {photo.author && (
              <div className="flex items-center gap-2">
                {photo.author.avatar ? (
                  <Image
                    src={photo.author.avatar}
                    alt={photo.author.displayName || photo.author.username}
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-600 text-xs text-white">
                    {(photo.author.displayName || photo.author.username).charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-white md:text-sm">
                  {photo.author.displayName || photo.author.username}
                </span>
              </div>
            )}

            {/* Location info at bottom */}
            {photo.location && (photo.location.country || photo.location.city || photo.location.spot) && (
              <div className="flex items-center gap-1 text-xs text-white md:text-sm">
                <MapPin size={14} />
                {photo.location.country && <span>{photo.location.country}</span>}
                {photo.location.city && <span>{photo.location.city}</span>}
                {photo.location.spot && (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                    <span className="font-medium">{photo.location.spot}</span>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

export default GalleryGrid
