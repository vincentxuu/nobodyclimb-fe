'use client'

import { useEffect, useCallback } from 'react'

/**
 * Valid referral sources (must match backend REFERRAL_SOURCES)
 */
export const REFERRAL_SOURCES = [
  'instagram',
  'facebook',
  'youtube',
  'google',
  'friend',
  'event',
  'organic',
  'other',
] as const

export type ReferralSource = (typeof REFERRAL_SOURCES)[number]

const STORAGE_KEY = 'referral_source'

/**
 * Referral tracking hook
 * - Captures referral source from URL parameters on page load
 * - Stores in localStorage for persistence across sessions
 * - Provides methods to get and clear referral data
 *
 * URL parameters supported:
 * - ?ref=instagram
 * - ?utm_source=google
 */
export function useReferral() {
  // Capture referral from URL on mount
  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref') || params.get('utm_source')

    if (ref) {
      // Validate against known sources, default to 'other' if unknown
      const validSource = REFERRAL_SOURCES.includes(ref as ReferralSource)
        ? (ref as ReferralSource)
        : 'other'

      localStorage.setItem(STORAGE_KEY, validSource)
    }
  }, [])

  /**
   * Get stored referral source
   */
  const getReferralSource = useCallback((): ReferralSource | null => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && REFERRAL_SOURCES.includes(stored as ReferralSource)) {
      return stored as ReferralSource
    }
    return null
  }, [])

  /**
   * Clear stored referral source (call after successful registration)
   */
  const clearReferralSource = useCallback(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return {
    getReferralSource,
    clearReferralSource,
  }
}
