import type { PersonalityTypeCode } from '@nobodyclimb/types'
import { PERSONALITY_TYPES } from './types'

export const PERSONALITY_COLORS: Record<PersonalityTypeCode, string> = Object.fromEntries(
  PERSONALITY_TYPES.map((t) => [t.code, t.color])
) as Record<PersonalityTypeCode, string>

export function getPersonalityColor(code: PersonalityTypeCode): string {
  return PERSONALITY_COLORS[code]
}
