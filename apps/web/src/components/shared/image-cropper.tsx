'use client'

import React, { useState, useRef, useCallback } from 'react'
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Button } from '@/components/ui/button'
import { Loader2, X } from 'lucide-react'

interface ImageCropperProps {
  open: boolean
  onClose: () => void
  imageSrc: string
  // eslint-disable-next-line no-unused-vars
  onCropComplete: (croppedFile: File) => void
  aspectRatio?: number
  title?: string
  /** 輸出圖片寬度（預設 400px） */
  outputSize?: number
  /** 輸出圖片高度（預設依 aspectRatio 計算，若無則等於 outputSize） */
  outputHeight?: number
}

/**
 * 根據圖片尺寸創建置中的裁切區域
 */
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  )
}

/**
 * 將裁切區域轉換為 File 物件
 * crop 座標已經是原始圖片的像素座標（不需要縮放）
 */
async function getCroppedImgDirect(
  image: HTMLImageElement,
  crop: PixelCrop,
  fileName: string,
  outputWidth: number,
  outputHeight: number
): Promise<File> {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('無法創建 canvas context')
  }

  canvas.width = outputWidth
  canvas.height = outputHeight

  // 繪製裁切後的圖片（座標已經是原始圖片的像素座標）
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputWidth,
    outputHeight
  )

  // 將 canvas 轉換為 Blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas 轉換失敗'))
          return
        }
        const file = new File([blob], fileName, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        })
        resolve(file)
      },
      'image/jpeg',
      0.9
    )
  })
}

/**
 * 圖片裁切組件
 * 用於裁切頭像等需要固定比例的圖片
 */
export default function ImageCropper({
  open,
  onClose,
  imageSrc,
  onCropComplete,
  aspectRatio = 1,
  title = '裁切圖片',
  outputSize = 400,
  outputHeight,
}: ImageCropperProps) {
  // 計算輸出高度：優先使用 outputHeight，否則根據 aspectRatio 計算
  const finalOutputHeight = outputHeight ?? Math.round(outputSize / aspectRatio)
  const [crop, setCrop] = useState<Crop>()
  const [percentCrop, setPercentCrop] = useState<Crop>()
  const [isProcessing, setIsProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  /**
   * 圖片載入完成後設定初始裁切區域
   */
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget
      const initialCrop = centerAspectCrop(width, height, aspectRatio)
      setCrop(initialCrop)
      setPercentCrop(initialCrop)
    },
    [aspectRatio]
  )

  /**
   * 確認裁切
   */
  const handleConfirm = async () => {
    if (!imgRef.current || !percentCrop) {
      return
    }

    // 使用百分比直接計算原始圖片中的裁切區域（更可靠）
    const image = imgRef.current
    const sourceX = Math.round((percentCrop.x / 100) * image.naturalWidth)
    const sourceY = Math.round((percentCrop.y / 100) * image.naturalHeight)
    const sourceWidth = Math.round((percentCrop.width / 100) * image.naturalWidth)
    const sourceHeight = Math.round((percentCrop.height / 100) * image.naturalHeight)

    const pixelCrop: PixelCrop = {
      unit: 'px',
      x: sourceX,
      y: sourceY,
      width: sourceWidth,
      height: sourceHeight,
    }

    setIsProcessing(true)
    try {
      const croppedFile = await getCroppedImgDirect(
        imgRef.current,
        pixelCrop,
        'image.jpg',
        outputSize,
        finalOutputHeight
      )
      onCropComplete(croppedFile)
      onClose()
    } catch (error) {
      console.error('裁切失敗:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  /**
   * 取消裁切
   */
  const handleCancel = () => {
    setCrop(undefined)
    setPercentCrop(undefined)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleCancel} />

      {/* Dialog */}
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          disabled={isProcessing}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2 className="mb-4 text-xl font-medium text-[#1B1A1A]">{title}</h2>

        {/* Cropper */}
        <div className="flex justify-center py-4">
          <ReactCrop
            crop={crop}
            onChange={(_, pCrop) => {
              setCrop(pCrop)
              setPercentCrop(pCrop)
            }}
            aspect={aspectRatio}
            circularCrop={aspectRatio === 1}
            className="max-h-[400px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="裁切預覽"
              onLoad={onImageLoad}
              className="max-h-[400px] w-auto"
            />
          </ReactCrop>
        </div>

        <p className="mb-4 text-center text-sm text-[#8E8C8C]">
          拖曳或調整選取框來裁切圖片
        </p>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
            className="border-[#B6B3B3] text-[#3F3D3D] hover:bg-[#F5F5F5]"
          >
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || !percentCrop}
            className="bg-[#1B1A1A] text-white hover:bg-[#3F3D3D]"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                處理中...
              </>
            ) : (
              '確認裁切'
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
