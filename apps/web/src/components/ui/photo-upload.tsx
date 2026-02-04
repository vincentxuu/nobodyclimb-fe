'use client';

import { useState, useCallback } from 'react';
import { X, Upload, Loader2, ImagePlus } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { cn } from '@/lib/utils';

const VALID_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 500 * 1024; // 500KB
const MAX_IMAGE_DIMENSION = 1920;

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  maxPhotos?: number;
  uploadFn: (file: File) => Promise<{ data?: { url: string } }>;
  disabled?: boolean;
  className?: string;
}

interface PhotoWithStatus {
  id: string;
  preview: string;
  url?: string;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export function PhotoUpload({
  photos,
  onChange,
  maxPhotos = 5,
  uploadFn,
  disabled = false,
  className,
}: PhotoUploadProps) {
  const [uploadingPhotos, setUploadingPhotos] = useState<PhotoWithStatus[]>([]);

  const compressImage = async (file: File): Promise<File> => {
    if (file.size <= MAX_FILE_SIZE) {
      return file;
    }

    const options = {
      maxSizeMB: MAX_FILE_SIZE / (1024 * 1024),
      maxWidthOrHeight: MAX_IMAGE_DIMENSION,
      useWebWorker: true,
      fileType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
    };

    return await imageCompression(file, options);
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles || selectedFiles.length === 0) return;

      const remainingSlots = maxPhotos - photos.length - uploadingPhotos.length;
      if (remainingSlots <= 0) return;

      const filesToProcess = Array.from(selectedFiles).slice(0, remainingSlots);

      // Validate file types
      const validFiles = filesToProcess.filter((file) =>
        VALID_FILE_TYPES.includes(file.type)
      );

      if (validFiles.length === 0) {
        e.target.value = '';
        return;
      }

      // Add files to uploading state
      const newPhotos: PhotoWithStatus[] = validFiles.map((file) => ({
        id: crypto.randomUUID(),
        preview: URL.createObjectURL(file),
        status: 'uploading' as const,
      }));

      setUploadingPhotos((prev) => [...prev, ...newPhotos]);

      // Upload files
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];
        const photoStatus = newPhotos[i];

        try {
          const compressedFile = await compressImage(file);
          const result = await uploadFn(compressedFile);

          if (result.data?.url) {
            setUploadingPhotos((prev) =>
              prev.map((p) =>
                p.id === photoStatus.id
                  ? { ...p, status: 'success', url: result.data!.url }
                  : p
              )
            );
            onChange([...photos, result.data.url]);
          } else {
            throw new Error('Upload failed');
          }
        } catch {
          setUploadingPhotos((prev) =>
            prev.map((p) =>
              p.id === photoStatus.id
                ? { ...p, status: 'error', error: '上傳失敗' }
                : p
            )
          );
        }
      }

      // Clean up completed uploads after a delay
      setTimeout(() => {
        setUploadingPhotos((prev) => {
          prev.forEach((p) => {
            if (p.status !== 'uploading') {
              URL.revokeObjectURL(p.preview);
            }
          });
          return prev.filter((p) => p.status === 'uploading');
        });
      }, 1000);

      e.target.value = '';
    },
    [photos, uploadingPhotos.length, maxPhotos, uploadFn, onChange]
  );

  const removePhoto = (url: string) => {
    onChange(photos.filter((p) => p !== url));
  };

  const totalPhotos = photos.length + uploadingPhotos.length;
  const canAddMore = totalPhotos < maxPhotos && !disabled;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Photo grid */}
      {(photos.length > 0 || uploadingPhotos.length > 0) && (
        <div className="grid grid-cols-5 gap-2">
          {photos.map((url) => (
            <div
              key={url}
              className="relative aspect-square rounded-md overflow-hidden group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Uploaded"
                className="h-full w-full object-cover"
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          {uploadingPhotos.map((photo) => (
            <div
              key={photo.id}
              className="relative aspect-square rounded-md overflow-hidden"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.preview}
                alt="Uploading"
                className="h-full w-full object-cover"
              />
              <div
                className={cn(
                  'absolute inset-0 flex items-center justify-center',
                  photo.status === 'uploading' && 'bg-black/50',
                  photo.status === 'error' && 'bg-red-500/50'
                )}
              >
                {photo.status === 'uploading' && (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                )}
                {photo.status === 'error' && (
                  <X className="h-5 w-5 text-white" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {canAddMore && (
        <label
          className={cn(
            'flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 transition-colors',
            'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
            disabled && 'cursor-not-allowed opacity-50'
          )}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={handleFileChange}
            disabled={disabled}
            className="hidden"
          />
          {photos.length === 0 ? (
            <>
              <Upload className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-500">
                新增照片（最多 {maxPhotos} 張）
              </span>
            </>
          ) : (
            <>
              <ImagePlus className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-500">
                新增更多（{photos.length}/{maxPhotos}）
              </span>
            </>
          )}
        </label>
      )}
    </div>
  );
}
