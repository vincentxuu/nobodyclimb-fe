'use client';

import React, { useState } from 'react';
import GalleryGrid from '@/components/gallery/gallery-grid';
import PhotoPopup from '@/components/gallery/photo-popup';
import { Button } from '@/components/ui/button';
import { galleryPhotos } from '@/lib/constants/index'; // Explicitly import from index

// Placeholder type, replace with actual type later
interface GalleryPhoto {
  id: string;
  src: string;
  alt: string;
  location?: {
    country: string;
    city: string;
    spot: string;
  };
  uploadDate?: string;
}

const GalleryPage: React.FC = () => {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  // TODO: Implement actual pagination/infinite scroll
  const [visiblePhotos, setVisiblePhotos] = useState<GalleryPhoto[]>(galleryPhotos.slice(0, 18)); // Show initial 18 photos

  const openPopup = (photo: GalleryPhoto, index: number) => {
    setSelectedPhoto(photo);
    setCurrentIndex(index);
  };

  const closePopup = () => {
    setSelectedPhoto(null);
  };

  const showNextPhoto = () => {
    const nextIndex = (currentIndex + 1) % visiblePhotos.length;
    setSelectedPhoto(visiblePhotos[nextIndex]);
    setCurrentIndex(nextIndex);
  };

  const showPrevPhoto = () => {
    const prevIndex = (currentIndex - 1 + visiblePhotos.length) % visiblePhotos.length;
    setSelectedPhoto(visiblePhotos[prevIndex]);
    setCurrentIndex(prevIndex);
  };

  const loadMorePhotos = () => {
    // Placeholder logic: load all photos for now
    setVisiblePhotos(galleryPhotos);
    // In a real app, fetch next page and append
    console.log('Load more photos...');
  };


  return (
    <div className="container mx-auto px-4 py-8 md:py-16">
      <div className="text-center mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-medium text-neutral-800 mb-2">
          攝影集
        </h1>
        <p className="text-base md:text-lg text-neutral-500">
          欣賞小人物們攀岩的英姿
        </p>
      </div>

      <GalleryGrid photos={visiblePhotos} onPhotoClick={openPopup} />

      {visiblePhotos.length < galleryPhotos.length && (
         <div className="text-center mt-8 md:mt-12">
            <Button variant="outline" onClick={loadMorePhotos}>
                看更多
            </Button>
         </div>
      )}


      {selectedPhoto && (
        <PhotoPopup
          photo={selectedPhoto}
          onClose={closePopup}
          onNext={showNextPhoto}
          onPrev={showPrevPhoto}
        />
      )}
    </div>
  );
};

export default GalleryPage;
