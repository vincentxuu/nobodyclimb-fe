import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

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
  uploadDate?: string; // Format like 'YYYY. MM. DD' based on Figma
}

interface PhotoPopupProps {
  photo: GalleryPhoto;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

const PhotoPopup: React.FC<PhotoPopupProps> = ({ photo, onClose, onNext, onPrev }) => {
  // Prevent background scroll when popup is open
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
        onClick={onClose} // Close on backdrop click
      >
        {/* Content */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-white max-w-4xl w-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden rounded-lg"
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside content
        >
          {/* Image Container - Simplified: Relative position and width constraints */}
          {/* Image Container - Relative position and width constraints */}
          <div className="relative w-full md:w-2/3 flex items-center justify-center overflow-hidden">
            {/* Use explicit width/height and object-contain style */}
            <Image
              src={photo.src}
              alt={photo.alt}
              width={1000} // Provide large intrinsic width
              height={1500} // Provide large intrinsic height (adjust ratio if needed)
              style={{ objectFit: 'contain', width: 'auto', height: 'auto', maxHeight: '100%', maxWidth: '100%' }}
              sizes="(max-width: 768px) 90vw, 60vw"
              priority // Prioritize loading the main popup image
            />
          </div>

          {/* Info Panel - Allow vertical scrolling on desktop if content overflows */}
          <div className="w-full md:w-1/3 p-4 flex flex-col justify-between bg-neutral-800 text-white md:overflow-y-auto">
            <div>
              {photo.location && (
                <div className="flex items-center gap-2 mb-3 text-sm">
                  <MapPin size={16} className="text-neutral-400" />
                  <span>{photo.location.country}</span>
                  <span>{photo.location.city}</span>
                  <span className="font-semibold">{photo.location.spot}</span>
                </div>
              )}
              {photo.uploadDate && (
                <div className="text-xs text-neutral-400">
                  <span className="font-medium text-neutral-300">上傳日期:</span> {photo.uploadDate}
                </div>
              )}
            </div>
            {/* Add other details if needed */}
            <div className="text-sm text-neutral-300 mt-4">
              {/* Placeholder for description or other info */}
              {photo.alt}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 md:top-4 md:right-4 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-colors z-10"
            aria-label="Close photo"
          >
            <X size={20} />
          </button>

          {/* Prev Button */}
          <button
            onClick={onPrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-colors z-10"
            aria-label="Previous photo"
          >
            <ChevronLeft size={24} />
          </button>

          {/* Next Button */}
          <button
            onClick={onNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white rounded-full p-2 transition-colors z-10"
            aria-label="Next photo"
          >
            <ChevronRight size={24} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PhotoPopup;
