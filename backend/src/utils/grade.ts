// 難度轉換工具
// YDS 與 V-grade 轉為數值，方便統計比較

const YDS_MAP: Record<string, number> = {
  '5.6': 1,
  '5.7': 2,
  '5.8': 3,
  '5.9': 4,
  '5.10a': 5,
  '5.10b': 6,
  '5.10c': 7,
  '5.10d': 8,
  '5.11a': 9,
  '5.11b': 10,
  '5.11c': 11,
  '5.11d': 12,
  '5.12a': 13,
  '5.12b': 14,
  '5.12c': 15,
  '5.12d': 16,
  '5.13a': 17,
  '5.13b': 18,
  '5.13c': 19,
  '5.13d': 20,
  '5.14a': 21,
  '5.14b': 22,
  '5.14c': 23,
  '5.14d': 24,
  '5.15a': 25,
  '5.15b': 26,
  '5.15c': 27,
  '5.15d': 28,
}

const NUMERIC_TO_YDS: Record<number, string> = Object.fromEntries(
  Object.entries(YDS_MAP).map(([grade, num]) => [num, grade])
)

/** 將難度字串轉為數值，無效格式回傳 0 */
export function gradeToNumeric(grade: string): number {
  if (!grade) return 0

  const normalized = grade.trim().toLowerCase()

  // YDS 格式
  if (YDS_MAP[normalized] !== undefined) {
    return YDS_MAP[normalized]
  }

  // V-grade 格式 (V0=1, V1=2, ... V16=17)
  const vMatch = normalized.match(/^v(\d+)$/)
  if (vMatch) {
    const vNum = parseInt(vMatch[1], 10)
    if (vNum >= 0 && vNum <= 16) {
      return vNum + 1
    }
  }

  return 0
}

/** 將數值轉回 YDS 難度字串，找不到回傳空字串 */
export function numericToGrade(num: number): string {
  return NUMERIC_TO_YDS[num] ?? ''
}
