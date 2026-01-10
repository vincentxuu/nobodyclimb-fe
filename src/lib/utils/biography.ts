import { Biography } from '@/lib/types'
import { biographyData } from '@/data/biographyData'

/**
 * 將靜態人物資料轉換為 Biography 類型
 */
export function mapStaticToBiography(staticPerson: (typeof biographyData)[0]): Biography {
  return {
    id: String(staticPerson.id),
    user_id: null,
    slug: staticPerson.name.toLowerCase().replace(/\s+/g, '-'),
    name: staticPerson.name,
    title: null,
    bio: null,
    avatar_url: staticPerson.imageSrc,
    cover_image: staticPerson.detailImageSrc,
    climbing_start_year: staticPerson.start,
    frequent_locations: staticPerson.showUp,
    favorite_route_type: staticPerson.type,
    climbing_reason: staticPerson.reason,
    climbing_meaning: staticPerson.why,
    bucket_list: staticPerson.list,
    advice: staticPerson.word,
    achievements: null,
    social_links: null,
    is_featured: 0,
    is_public: 1,
    published_at: staticPerson.time,
    created_at: staticPerson.time,
    updated_at: staticPerson.time,
  }
}

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
