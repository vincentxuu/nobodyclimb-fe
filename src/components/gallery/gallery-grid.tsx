import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react'; // Assuming lucide-react is installed

// Placeholder type, sync with page.tsx
interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  location?: {
    country: string;
    city: string;
    spot: string;
  };
}

interface GalleryGridProps {
  photos: GalleryPhoto[];
  onPhotoClick: (photo: GalleryPhoto, index: number) => void;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({ photos, onPhotoClick }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-5">
      {photos.map((photo, index) => (
        <motion.div
          key={photo.id}
          className="relative aspect-[2/3] cursor-pointer group overflow-hidden"
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
            priority={index < 12} // Prioritize loading initial images
          />
          {/* Hover effect with location info - based on Figma popup design */}
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity duration-300 flex items-end p-2 md:p-3 opacity-0 group-hover:opacity-100">
            {photo.location && (
              <div className="flex items-center gap-1 text-white text-xs md:text-sm">
                <MapPin size={14} />
                <span>{photo.location.country}</span>
                <span>{photo.location.city}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                <span className="font-medium">{photo.location.spot}</span>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default GalleryGrid;
