import { getTagOptionById, SYSTEM_TAG_DIMENSIONS } from '@/lib/constants/biography-tags'
import type { TagsDataStorage, TagSelection } from '@/lib/types/biography-v2'

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

// ═══════════════════════════════════════════
// 匿名人物誌處理
// ═══════════════════════════════════════════

type VisibilityLevel = 'private' | 'anonymous' | 'community' | 'public' | null | undefined

/**
 * 根據人物誌可見性取得顯示名稱
 * 匿名人物誌顯示「匿名岩友」，其他則顯示實際名稱
 */
export function getDisplayNameForVisibility(
  visibility: VisibilityLevel,
  actualName: string
): string {
  return visibility === 'anonymous' ? '匿名岩友' : actualName
}

// ═══════════════════════════════════════════
// 展示標籤相關
// ═══════════════════════════════════════════

export interface DisplayTag {
  id: string
  label: string
}

// 默認展示的三個維度
const DEFAULT_DISPLAY_DIMENSIONS = [
  SYSTEM_TAG_DIMENSIONS.STYLE_CULT,       // 風格邪教
  SYSTEM_TAG_DIMENSIONS.SHOE_FACTION,     // 鞋子門派
  SYSTEM_TAG_DIMENSIONS.TRAINING_APPROACH, // 訓練取向
]

/**
 * 從已選標籤中取得默認展示標籤
 * 優先從三個指定維度（風格邪教、鞋子門派、訓練取向）各取一個
 * 不足 3 個時，從其他已選標籤按順序補齊
 */
function getDefaultDisplayTags(selections: TagSelection[], maxCount = 3): DisplayTag[] {
  const result: DisplayTag[] = []
  const usedTagIds = new Set<string>()

  // 第一輪：優先從三個指定維度各取一個
  for (const dimensionId of DEFAULT_DISPLAY_DIMENSIONS) {
    if (result.length >= maxCount) break

    const tagInDimension = selections.find(sel => {
      const option = getTagOptionById(sel.tag_id)
      return option?.dimension_id === dimensionId && !usedTagIds.has(sel.tag_id)
    })

    if (tagInDimension) {
      const option = getTagOptionById(tagInDimension.tag_id)
      if (option) {
        result.push({ id: tagInDimension.tag_id, label: option.label })
        usedTagIds.add(tagInDimension.tag_id)
      }
    }
  }

  // 第二輪：不足 3 個時，從其他已選標籤按順序補齊
  for (const sel of selections) {
    if (result.length >= maxCount) break
    if (usedTagIds.has(sel.tag_id)) continue

    const option = getTagOptionById(sel.tag_id)
    if (option) {
      result.push({ id: sel.tag_id, label: option.label })
      usedTagIds.add(sel.tag_id)
    }
  }

  return result
}

/**
 * 取得卡片展示標籤
 * 優先使用用戶設定的 display_tags，否則使用默認邏輯
 *
 * 支援兩種資料格式：
 * - 舊格式：TagSelection[] 陣列
 * - 新格式：TagsDataStorage 物件 { selections, display_tags?, ... }
 */
export function getDisplayTags(tagsDataJson: string | null | undefined, maxCount = 3): DisplayTag[] {
  if (!tagsDataJson) return []

  try {
    const parsed = JSON.parse(tagsDataJson)

    // 判斷是舊格式（陣列）還是新格式（物件）
    if (Array.isArray(parsed)) {
      // 舊格式：TagSelection[] 陣列
      return getDefaultDisplayTags(parsed as TagSelection[], maxCount)
    }

    // 新格式：TagsDataStorage 物件
    const tagsData = parsed as TagsDataStorage

    // 優先使用用戶設定的展示標籤
    if (tagsData.display_tags && tagsData.display_tags.length > 0) {
      return tagsData.display_tags
        .slice(0, maxCount)
        .map(tagId => {
          const option = getTagOptionById(tagId)
          return option ? { id: tagId, label: option.label } : null
        })
        .filter((tag): tag is DisplayTag => tag !== null)
    }

    // 沒有設定，使用默認邏輯
    return getDefaultDisplayTags(tagsData.selections || [], maxCount)
  } catch {
    return []
  }
}
