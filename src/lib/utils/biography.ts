/**
 * 計算攀岩年資
 * @param climbingStartYear 開始攀岩的年份字串
 * @returns 攀岩年數，如果無法計算則返回 null
 */
export function calculateClimbingYears(climbingStartYear: string | null | undefined): number | null {
  if (!climbingStartYear) return null
  const startYear = parseInt(climbingStartYear, 10)
  return isNaN(startYear) ? null : new Date().getFullYear() - startYear
}
