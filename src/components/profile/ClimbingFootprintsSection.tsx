'use client'

import React from 'react'
import { Globe } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { ClimbingFootprintsEditor } from '@/components/biography/climbing-footprints-editor'
import { ClimbingLocation } from '@/lib/types'
import { getCountryFlag } from '@/lib/utils/country'

interface ClimbingFootprintsSectionProps {
  locations: ClimbingLocation[]
  isEditing: boolean
  isMobile: boolean
  onChange: (_locations: ClimbingLocation[]) => void
}

export default function ClimbingFootprintsSection({
  locations,
  isEditing,
  isMobile,
  onChange,
}: ClimbingFootprintsSectionProps) {
  // Group locations by country
  const locationsByCountry = locations.reduce(
    (acc, loc) => {
      const country = loc.country || '未知'
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
    <div className="space-y-4">
      {/* Section Title */}
      <div>
        <Label className={`font-medium text-strong ${isMobile ? 'text-sm' : 'text-base'}`}>
          攀岩足跡
        </Label>
        <p className="mt-1 text-xs text-gray-500">記錄你去過的攀岩地點和旅程</p>
      </div>
      {/* Stats Badge */}
      {totalLocations > 0 && (
        <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
          {countryCount} 國 · {totalLocations} 地點
        </span>
      )}

      {/* Display Mode */}
      {!isEditing && (
        <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4">
          {totalLocations === 0 ? (
            <div className="py-4 text-center text-gray-500">
              <Globe className="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p className="text-sm">還沒有記錄攀岩足跡</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(locationsByCountry).map(([country, locs]) => (
                <div key={country}>
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-lg">{getCountryFlag(country)}</span>
                    <span className="text-sm font-medium text-gray-700">{country}</span>
                    <span className="text-xs text-gray-500">({locs.length})</span>
                  </div>
                  <div className={`flex flex-wrap gap-2 ${isMobile ? '' : 'pl-7'}`}>
                    {locs.map((loc, idx) => (
                      <span
                        key={`${loc.country}-${loc.location}-${idx}`}
                        className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm text-gray-700"
                      >
                        {loc.location}
                        {loc.visit_year && (
                          <span className="ml-1 text-xs text-gray-400">({loc.visit_year})</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Mode */}
      {isEditing && <ClimbingFootprintsEditor locations={locations} onChange={onChange} />}
    </div>
  )
}
