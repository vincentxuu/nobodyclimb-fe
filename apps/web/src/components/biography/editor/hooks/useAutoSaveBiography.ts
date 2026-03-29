'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useDebouncedCallback } from '@/lib/hooks/useDebouncedCallback'
import type { BiographyV2 } from '@/lib/types/biography-v2'

interface UseAutoSaveBiographyOptions {
  biography: BiographyV2
  onChange: (_updates: Partial<BiographyV2>) => void
  onSave: (_biography: BiographyV2) => Promise<void>
  setSaving: () => void
  setSaved: () => void
  setError: (_error: string) => void
}

/**
 * 自動儲存 Biography Hook
 *
 * 處理本地草稿管理、debounced 自動儲存、重試機制等
 */
export function useAutoSaveBiography({
  biography,
  onChange,
  onSave,
  setSaving,
  setSaved,
  setError,
}: UseAutoSaveBiographyOptions) {
  // 本地草稿
  const [localBiography, setLocalBiography] = useState(biography)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Refs for tracking state
  const isEditingRef = useRef(false)
  const lastSavedBiographyRef = useRef(biography)
  const isSavingRef = useRef(false)
  const saveIdRef = useRef(0)
  const editVersionRef = useRef(0)
  const lastSavedVersionRef = useRef(0)
  const currentSaveIdRef = useRef(0)
  const needsAnotherSaveRef = useRef(false)
  const retryCountRef = useRef(0)
  const latestBiographyRef = useRef(biography)
  const isMountedRef = useRef(true)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 組件掛載/卸載追蹤
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
      }
    }
  }, [])

  // 從 props 同步到本地草稿
  useEffect(() => {
    if (!isEditingRef.current && !isSavingRef.current) {
      setLocalBiography(biography)
      lastSavedBiographyRef.current = biography
      latestBiographyRef.current = biography
      setHasUnsavedChanges(false)
    }
  }, [biography])

  // 當 biography.id 變更時，強制同步並重置編輯狀態
  useEffect(() => {
    setLocalBiography(biography)
    lastSavedBiographyRef.current = biography
    latestBiographyRef.current = biography
    isEditingRef.current = false
    saveIdRef.current = 0
    editVersionRef.current = 0
    lastSavedVersionRef.current = 0
    setHasUnsavedChanges(false)
    currentSaveIdRef.current = 0
    needsAnotherSaveRef.current = false
    retryCountRef.current = 0
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current)
      retryTimerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biography.id])

  // 自動儲存 - 使用 debounce
  const debouncedSave = useDebouncedCallback(
    async (bioToSave: BiographyV2, saveVersion: number) => {
      if (!isMountedRef.current) return

      // 序列化儲存
      if (isSavingRef.current) {
        needsAnotherSaveRef.current = true
        return
      }

      saveIdRef.current += 1
      const thisSaveId = saveIdRef.current

      try {
        isSavingRef.current = true
        currentSaveIdRef.current = thisSaveId
        if (isMountedRef.current) setSaving()

        await onSave(bioToSave)

        if (thisSaveId === saveIdRef.current) {
          lastSavedBiographyRef.current = bioToSave
          if (isMountedRef.current) setSaved()

          if (saveVersion === editVersionRef.current) {
            isEditingRef.current = false
            lastSavedVersionRef.current = saveVersion
            if (isMountedRef.current) setHasUnsavedChanges(false)
          }

          retryCountRef.current = 0
          if (retryTimerRef.current) {
            clearTimeout(retryTimerRef.current)
            retryTimerRef.current = null
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : '儲存失敗'
        const isTimeoutError = message.toLowerCase().includes('timeout')

        if (isMountedRef.current) {
          setError(isTimeoutError ? '儲存逾時，已暫停自動重試，請稍後再試' : message)
        }

        // 自動重試（最多 3 次）
        retryCountRef.current += 1
        if (!isTimeoutError && retryCountRef.current <= 3) {
          const retryDelay = 2000 * retryCountRef.current
          if (retryTimerRef.current) clearTimeout(retryTimerRef.current)

          retryTimerRef.current = setTimeout(() => {
            if (
              thisSaveId === saveIdRef.current &&
              isMountedRef.current &&
              latestBiographyRef.current
            ) {
              debouncedSave(latestBiographyRef.current, editVersionRef.current)
            }
          }, retryDelay)
        }
      } finally {
        isSavingRef.current = false

        if (needsAnotherSaveRef.current && latestBiographyRef.current) {
          needsAnotherSaveRef.current = false
          debouncedSave(latestBiographyRef.current, editVersionRef.current)
          debouncedSave.flush()
        }
      }
    },
    {
      delay: 5000,
      maxWait: 60000,
    }
  )

  // Handle changes
  const handleChange = useCallback(
    (updates: Partial<BiographyV2>) => {
      // 用 ref 計算新值，避免依賴 React setter callback（不保證同步執行）
      const newBio = { ...latestBiographyRef.current, ...updates }

      latestBiographyRef.current = newBio
      setLocalBiography(newBio)

      editVersionRef.current += 1
      const currentVersion = editVersionRef.current
      setHasUnsavedChanges(true)
      isEditingRef.current = true

      onChange(updates)
      debouncedSave(newBio, currentVersion)
    },
    [onChange, debouncedSave]
  )

  // 離開頁面時提示未儲存變更
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      const hasChanges =
        editVersionRef.current > lastSavedVersionRef.current ||
        isSavingRef.current ||
        needsAnotherSaveRef.current

      if (!hasChanges) return

      if (latestBiographyRef.current) {
        debouncedSave(latestBiographyRef.current, editVersionRef.current)
        debouncedSave.flush()
      }

      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [debouncedSave])

  // 立即儲存（flush pending debounced save）
  const flushSave = useCallback(() => {
    debouncedSave.flush()
  }, [debouncedSave])

  // 手動儲存（強制排入並立即執行，即使無 pending save 也會觸發）
  const manualSave = useCallback(() => {
    if (!latestBiographyRef.current) return
    debouncedSave(latestBiographyRef.current, editVersionRef.current)
    debouncedSave.flush()
  }, [debouncedSave])

  return {
    localBiography,
    hasUnsavedChanges,
    handleChange,
    flushSave,
    manualSave,
  }
}
