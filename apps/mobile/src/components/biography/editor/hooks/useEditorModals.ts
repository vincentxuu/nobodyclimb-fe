import { useState, useCallback } from 'react'

/**
 * 編輯器 Modal 狀態管理 Hook
 *
 * 管理所有 Modal 和 BottomSheet 的開關狀態
 */
export function useEditorModals() {
  // Story 編輯狀態
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null)

  // TagsBottomSheet 狀態
  const [tagsBottomSheetOpen, setTagsBottomSheetOpen] = useState(false)

  // Custom Tag Modal
  const [customTagModalOpen, setCustomTagModalOpen] = useState(false)
  const [customTagDimensionId, setCustomTagDimensionId] = useState<string | undefined>(undefined)

  // Custom Dimension Modal
  const [customDimensionModalOpen, setCustomDimensionModalOpen] = useState(false)

  // Custom One-liner Modal
  const [customOneLinerModalOpen, setCustomOneLinerModalOpen] = useState(false)

  // Custom Story Modal
  const [customStoryModalOpen, setCustomStoryModalOpen] = useState(false)
  const [customStoryCategoryId, setCustomStoryCategoryId] = useState<string | undefined>(undefined)

  // Story 編輯
  const openStoryEditor = useCallback((questionId: string) => {
    setEditingStoryId(questionId)
  }, [])

  const closeStoryEditor = useCallback(() => {
    setEditingStoryId(null)
  }, [])

  // Tags BottomSheet
  const openTagsBottomSheet = useCallback(() => {
    setTagsBottomSheetOpen(true)
  }, [])

  const closeTagsBottomSheet = useCallback(() => {
    setTagsBottomSheetOpen(false)
  }, [])

  // Custom Tag Modal
  const openCustomTagModal = useCallback((dimensionId?: string) => {
    setCustomTagDimensionId(dimensionId)
    setCustomTagModalOpen(true)
  }, [])

  const closeCustomTagModal = useCallback(() => {
    setCustomTagModalOpen(false)
  }, [])

  // Custom Dimension Modal
  const openCustomDimensionModal = useCallback(() => {
    setCustomDimensionModalOpen(true)
  }, [])

  const closeCustomDimensionModal = useCallback(() => {
    setCustomDimensionModalOpen(false)
  }, [])

  // Custom One-liner Modal
  const openCustomOneLinerModal = useCallback(() => {
    setCustomOneLinerModalOpen(true)
  }, [])

  const closeCustomOneLinerModal = useCallback(() => {
    setCustomOneLinerModalOpen(false)
  }, [])

  // Custom Story Modal
  const openCustomStoryModal = useCallback((categoryId?: string) => {
    setCustomStoryCategoryId(categoryId)
    setCustomStoryModalOpen(true)
  }, [])

  const closeCustomStoryModal = useCallback(() => {
    setCustomStoryModalOpen(false)
  }, [])

  return {
    // Story 編輯
    editingStoryId,
    openStoryEditor,
    closeStoryEditor,

    // Tags BottomSheet
    tagsBottomSheetOpen,
    openTagsBottomSheet,
    closeTagsBottomSheet,

    // Custom Tag Modal
    customTagModalOpen,
    customTagDimensionId,
    openCustomTagModal,
    closeCustomTagModal,

    // Custom Dimension Modal
    customDimensionModalOpen,
    openCustomDimensionModal,
    closeCustomDimensionModal,

    // Custom One-liner Modal
    customOneLinerModalOpen,
    openCustomOneLinerModal,
    closeCustomOneLinerModal,

    // Custom Story Modal
    customStoryModalOpen,
    customStoryCategoryId,
    openCustomStoryModal,
    closeCustomStoryModal,
  }
}
