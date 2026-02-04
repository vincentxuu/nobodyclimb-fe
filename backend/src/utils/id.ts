// Generate a unique ID using crypto
export function generateId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate a slug from a string
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Parse pagination parameters
export function parsePagination(
  page?: string | null,
  limit?: string | null
): { page: number; limit: number; offset: number } {
  const p = Math.max(1, parseInt(page || '1', 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit || '20', 10) || 20));
  return { page: p, limit: l, offset: (p - 1) * l };
}

// Safe JSON parse with fallback
export function safeJsonParse<T>(json: string | null | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

// Valid ascent types
export const VALID_ASCENT_TYPES = [
  'redpoint',
  'flash',
  'onsight',
  'attempt',
  'toprope',
  'lead',
  'seconding',
  'repeat',
] as const;

export type AscentType = (typeof VALID_ASCENT_TYPES)[number];

export function isValidAscentType(type: string): type is AscentType {
  return VALID_ASCENT_TYPES.includes(type as AscentType);
}

// Valid story types
export const VALID_STORY_TYPES = [
  'beta',
  'experience',
  'first_ascent',
  'history',
  'safety',
  'conditions',
  'gear',
  'approach',
  'other',
] as const;

export type StoryType = (typeof VALID_STORY_TYPES)[number];

export function isValidStoryType(type: string): type is StoryType {
  return VALID_STORY_TYPES.includes(type as StoryType);
}
