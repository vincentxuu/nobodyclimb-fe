export type AscentType =
  | 'redpoint' | 'flash' | 'onsight' | 'attempt'
  | 'toprope' | 'lead' | 'seconding' | 'repeat'

export const ASCENT_TYPE_LABELS: Record<AscentType, string> = {
  redpoint: 'Redpoint',
  flash: 'Flash',
  onsight: 'Onsight',
  attempt: 'Attempt',
  toprope: 'Top Rope',
  lead: 'Lead',
  seconding: 'Second',
  repeat: 'Repeat',
}

export const ASCENT_TYPE_COLORS: Record<AscentType, string> = {
  redpoint: '#EF4444',
  flash: '#EAB308',
  onsight: '#10B981',
  attempt: '#6B7280',
  toprope: '#3B82F6',
  lead: '#A855F7',
  seconding: '#06B6D4',
  repeat: '#6366F1',
}
