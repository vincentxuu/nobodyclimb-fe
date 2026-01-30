'use client'

import React from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import SortableImageCard from './SortableImageCard'
import { ProfileImage, ImageLayout } from '../types'

interface SortableImageGridProps {
  images: ProfileImage[]
  layout: ImageLayout
  // eslint-disable-next-line no-unused-vars
  onReorder: (_images: ProfileImage[]) => void
  // eslint-disable-next-line no-unused-vars
  onDelete: (_id: string) => void
  // eslint-disable-next-line no-unused-vars
  onCaptionChange: (_id: string, _caption: string) => void
}

export default function SortableImageGrid({
  images,
  layout,
  onReorder,
  onDelete,
  onCaptionChange,
}: SortableImageGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id)
      const newIndex = images.findIndex((img) => img.id === over.id)

      const newImages = arrayMove(images, oldIndex, newIndex).map((img, index) => ({
        ...img,
        order: index,
      }))

      onReorder(newImages)
    }
  }

  const getGridClass = () => {
    switch (layout) {
      case 'single':
        return 'grid-cols-1'
      case 'double':
        return 'grid-cols-1 sm:grid-cols-2'
      case 'grid':
        return 'grid-cols-2 sm:grid-cols-3'
      default:
        return 'grid-cols-1 sm:grid-cols-2'
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
        <div className={`grid gap-3 ${getGridClass()}`}>
          {images.map((image) => (
            <SortableImageCard
              key={image.id}
              image={image}
              onDelete={onDelete}
              onCaptionChange={onCaptionChange}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
