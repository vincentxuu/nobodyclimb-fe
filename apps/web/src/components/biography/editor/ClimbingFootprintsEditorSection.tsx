'use client'

import { useState, useEffect, useCallback } from 'react'
import { Globe, Loader2, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ClimbingFootprintsEditor } from '@/components/biography/climbing-footprints-editor'
import { ClimbingLocation, ClimbingLocationRecord } from '@/lib/types'
import { climbingLocationService } from '@/lib/api/services'
import { useToast } from '@/components/ui/use-toast'

interface ClimbingFootprintsEditorSectionProps {
  className?: string
}

// Convert ClimbingLocationRecord to ClimbingLocation (for Editor use)
function recordToLocation(record: ClimbingLocationRecord): ClimbingLocation & { _id: string } {
  return {
    _id: record.id,
    location: record.location,
    country: record.country,
    visit_year: record.visit_year,
    notes: record.notes,
    photos: record.photos,
    is_public: record.is_public,
  }
}

// Convert ClimbingLocation to API request format
function locationToCreateData(loc: ClimbingLocation) {
  return {
    location: loc.location,
    country: loc.country,
    visit_year: loc.visit_year || undefined,
    notes: loc.notes || undefined,
    photos: loc.photos || undefined,
    is_public: loc.is_public,
  }
}

/**
 * Climbing Footprints Editor Section
 *
 * Edit climbing footprints (locations visited)
 */
export function ClimbingFootprintsEditorSection({
  className,
}: ClimbingFootprintsEditorSectionProps) {
  const { toast } = useToast()
  const [records, setRecords] = useState<ClimbingLocationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Load climbing footprints
  const loadLocations = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await climbingLocationService.getMyLocations()
      if (response.success && response.data) {
        setRecords(response.data)
      } else {
        setError(response.error || 'Loading failed')
      }
    } catch (err) {
      console.error('Failed to load climbing locations:', err)
      setError('Cannot load climbing footprints')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadLocations()
  }, [loadLocations])

  // Convert records to Editor format
  const locations: ClimbingLocation[] = records.map(recordToLocation)

  // Handle editor changes
  const handleChange = useCallback(
    async (newLocations: ClimbingLocation[]) => {
      setIsSaving(true)

      try {
        // Create id -> record mapping
        const recordMap = new Map(records.map((r) => [r.id, r]))

        // Calculate items to add, update, delete
        const newLocationIds = new Set(
          newLocations
            .filter((loc) => (loc as ClimbingLocation & { _id?: string })._id)
            .map((loc) => (loc as ClimbingLocation & { _id?: string })._id)
        )
        const existingIds = new Set(records.map((r) => r.id))

        // Find items to delete (existing but not in new)
        const toDelete = records.filter((r) => !newLocationIds.has(r.id))

        // Find items to create (no _id)
        const toCreate = newLocations.filter(
          (loc) => !(loc as ClimbingLocation & { _id?: string })._id
        )

        // Find items to update (has _id and content changed)
        const toUpdate: Array<{ id: string; data: ClimbingLocation }> = []
        for (const loc of newLocations) {
          const id = (loc as ClimbingLocation & { _id?: string })._id
          if (id && existingIds.has(id)) {
            const existing = recordMap.get(id)
            if (existing) {
              if (
                loc.location !== existing.location ||
                loc.country !== existing.country ||
                loc.visit_year !== existing.visit_year ||
                loc.notes !== existing.notes ||
                loc.is_public !== existing.is_public ||
                JSON.stringify(loc.photos) !== JSON.stringify(existing.photos)
              ) {
                toUpdate.push({ id, data: loc })
              }
            }
          }
        }

        // Execute delete, create, update in parallel
        await Promise.all([
          ...toDelete.map((record) => climbingLocationService.deleteLocation(record.id)),
          ...toCreate.map((loc) => climbingLocationService.createLocation(locationToCreateData(loc))),
          ...toUpdate.map(({ id, data }) =>
            climbingLocationService.updateLocation(id, {
              location: data.location,
              country: data.country,
              visit_year: data.visit_year,
              notes: data.notes,
              photos: data.photos,
              is_public: data.is_public,
            })
          ),
        ])

        // Reload data
        await loadLocations()

        // Show success message
        const actions = []
        if (toCreate.length > 0) actions.push(`Added ${toCreate.length}`)
        if (toUpdate.length > 0) actions.push(`Updated ${toUpdate.length}`)
        if (toDelete.length > 0) actions.push(`Deleted ${toDelete.length}`)

        if (actions.length > 0) {
          toast({
            title: 'Climbing footprints updated',
            description: actions.join(', '),
          })
        }
      } catch (err) {
        console.error('Failed to update climbing locations:', err)
        toast({
          title: 'Update failed',
          description: 'Please try again later',
          variant: 'destructive',
        })
        await loadLocations()
      } finally {
        setIsSaving(false)
      }
    },
    [records, loadLocations, toast]
  )

  // Group locations by country
  const locationsByCountry = locations.reduce(
    (acc, loc) => {
      const country = loc.country || 'Unknown'
      if (!acc[country]) {
        acc[country] = []
      }
      acc[country].push(loc)
      return acc
    },
    {} as Record<string, ClimbingLocation[]>
  )

  const countryCount = Object.keys(locationsByCountry).length
  const totalLocations = locations.length

  return (
    <div className={cn('space-y-6', className)}>
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <Globe size={18} className="text-[#3F3D3D]" />
        <h3 className="font-semibold text-[#1B1A1A]">攀岩足跡</h3>
      </div>

      <p className="text-sm text-[#6D6C6C]">
        記錄你去過的攀岩地點和旅程
      </p>

      {/* Stats Badge */}
      {totalLocations > 0 && (
        <span className="inline-block rounded-full bg-[#F5F5F5] px-3 py-1 text-xs text-[#6D6C6C]">
          {countryCount} 國 / {totalLocations} 地點
        </span>
      )}

      {/* Saving Indicator */}
      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-sm text-[#6D6C6C]"
          >
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>儲存中...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#B6B3B3]" />
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
          <AlertCircle className="mx-auto mb-2 h-6 w-6 text-red-500" />
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={loadLocations}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            重試
          </button>
        </div>
      )}

      {/* Editor */}
      {!loading && !error && (
        <ClimbingFootprintsEditor
          locations={locations}
          onChange={handleChange}
          disabled={isSaving}
        />
      )}

      {/* Empty State with Add Button */}
      {!loading && !error && totalLocations === 0 && (
        <div className="rounded-lg border border-dashed border-[#B6B3B3] bg-[#F5F5F5] p-6 text-center">
          <Globe className="mx-auto mb-2 h-8 w-8 text-[#B6B3B3]" />
          <p className="text-sm text-[#6D6C6C] mb-3">還沒有記錄攀岩足跡</p>
          <p className="text-xs text-[#8E8C8C]">
            點擊上方按鈕新增你的第一個攀岩地點
          </p>
        </div>
      )}
    </div>
  )
}

export default ClimbingFootprintsEditorSection
