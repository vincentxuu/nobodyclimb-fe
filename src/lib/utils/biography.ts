import { getTagOptionById, SYSTEM_TAG_DIMENSIONS } from '@/lib/constants/biography-tags'
import type { TagsDataStorage, TagSelection, TagOption } from '@/lib/types/biography-v2'

// ═══════════════════════════════════════════
// 一句話資料格式轉換
// ═══════════════════════════════════════════

/**
 * 後端 one_liners_data 的儲存格式
 */
export type OneLinersDataStorage = Record<string, { answer: string; visibility: string }>

/**
 * 將簡單的問答映射轉換為後端 one_liners_data 格式
 *
 * @param answers - 問題 ID 到答案的映射
 * @param visibility - 預設可見性 (預設為 'public')
 * @returns 後端格式的一句話資料物件
 *
 * @example
 * const answers = { 'climbing_start_reason': '想挑戰自己', 'climbing_joy': '攀到頂的成就感' }
 * const data = buildOneLinersData(answers)
 * // { 'climbing_start_reason': { answer: '想挑戰自己', visibility: 'public' }, ... }
 */
export function buildOneLinersData(
  answers: Record<string, string>,
  visibility: string = 'public'
): OneLinersDataStorage {
  const result: OneLinersDataStorage = {}

  for (const [questionId, answer] of Object.entries(answers)) {
    const trimmedAnswer = answer.trim()
    if (trimmedAnswer) {
      result[questionId] = { answer: trimmedAnswer, visibility }
    }
  }

  return result
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
  isCustom?: boolean
}

// 默認展示的三個維度
const DEFAULT_DISPLAY_DIMENSIONS = [
  SYSTEM_TAG_DIMENSIONS.STYLE_CULT,       // 風格邪教
  SYSTEM_TAG_DIMENSIONS.SHOE_FACTION,     // 鞋子門派
  SYSTEM_TAG_DIMENSIONS.TRAINING_APPROACH, // 訓練取向
]

/**
 * 從已選標籤中取得默認展示標籤
 * 優先顯示自訂標籤，然後從三個指定維度（風格邪教、鞋子門派、訓練取向）各取一個
 * 不足 3 個時，從其他已選標籤按順序補齊
 */
function getDefaultDisplayTags(
  selections: TagSelection[],
  maxCount = 3,
  customTagsMap?: Map<string, TagOption>
): DisplayTag[] {
  const result: DisplayTag[] = []
  const usedTagIds = new Set<string>()

  // 輔助函數：判斷是否為自訂標籤
  const isCustomTag = (sel: TagSelection): boolean => {
    // 1. 檢查 source
    if (sel.source === 'user') return true
    // 2. 檢查是否在 customTagsMap 中
    if (customTagsMap?.has(sel.tag_id)) return true
    // 3. 檢查 tag_id 是否以 usr_ 開頭
    if (sel.tag_id.startsWith('usr_')) return true
    return false
  }

  // 輔助函數：查找標籤
  const findTagOption = (tagId: string): TagOption | undefined => {
    return customTagsMap?.get(tagId) || getTagOptionById(tagId)
  }

  // 第零輪：優先加入自訂標籤
  for (const sel of selections) {
    if (result.length >= maxCount) break
    if (isCustomTag(sel)) {
      const option = findTagOption(sel.tag_id)
      if (option) {
        result.push({ id: sel.tag_id, label: option.label, isCustom: true })
        usedTagIds.add(sel.tag_id)
      }
    }
  }

  // 第一輪：優先從三個指定維度各取一個
  for (const dimensionId of DEFAULT_DISPLAY_DIMENSIONS) {
    if (result.length >= maxCount) break

    const tagInDimension = selections.find(sel => {
      const option = findTagOption(sel.tag_id)
      return option?.dimension_id === dimensionId && !usedTagIds.has(sel.tag_id)
    })

    if (tagInDimension) {
      const option = findTagOption(tagInDimension.tag_id)
      if (option) {
        result.push({ id: tagInDimension.tag_id, label: option.label, isCustom: false })
        usedTagIds.add(tagInDimension.tag_id)
      }
    }
  }

  // 第二輪：不足 3 個時，從其他已選標籤按順序補齊
  for (const sel of selections) {
    if (result.length >= maxCount) break
    if (usedTagIds.has(sel.tag_id)) continue

    const option = findTagOption(sel.tag_id)
    if (option) {
      result.push({ id: sel.tag_id, label: option.label, isCustom: isCustomTag(sel) })
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
 * - 新格式：TagsDataStorage 物件 { selections, display_tags?, custom_tags?, custom_dimensions? }
 */
export function getDisplayTags(tagsDataJson: string | null | undefined, maxCount = 3): DisplayTag[] {
  if (!tagsDataJson) return []

  try {
    const parsed = JSON.parse(tagsDataJson)

    // 判斷是舊格式（陣列）還是新格式（物件）
    if (Array.isArray(parsed)) {
      // 舊格式：TagSelection[] 陣列（沒有自訂標籤資訊）
      return getDefaultDisplayTags(parsed as TagSelection[], maxCount)
    }

    // 新格式：TagsDataStorage 物件
    const tagsData = parsed as TagsDataStorage

    // 建立自訂標籤查找表（包含 custom_tags 和 custom_dimensions 中的標籤）
    const customTagsMap = new Map<string, TagOption>()

    // 加入 custom_tags（用戶為系統維度新增的自訂標籤）
    if (tagsData.custom_tags) {
      for (const tag of tagsData.custom_tags) {
        customTagsMap.set(tag.id, tag)
      }
    }

    // 加入 custom_dimensions 中的所有標籤
    if (tagsData.custom_dimensions) {
      for (const dimension of tagsData.custom_dimensions) {
        for (const tag of dimension.options) {
          customTagsMap.set(tag.id, tag)
        }
      }
    }

    // 輔助函數：查找標籤（優先從自訂標籤查找）
    const findTagOption = (tagId: string): TagOption | undefined => {
      return customTagsMap.get(tagId) || getTagOptionById(tagId)
    }

    // 輔助函數：判斷是否為自訂標籤
    const isCustomTag = (tagId: string): boolean => {
      // 1. 檢查是否在 custom_tags 中
      if (customTagsMap.has(tagId)) return true
      // 2. 檢查 selections 中的 source
      const selection = tagsData.selections?.find(s => s.tag_id === tagId)
      if (selection?.source === 'user') return true
      // 3. 檢查 tag_id 是否以 usr_ 開頭
      if (tagId.startsWith('usr_')) return true
      return false
    }

    // 優先使用用戶設定的展示標籤
    if (tagsData.display_tags && tagsData.display_tags.length > 0) {
      const tags: DisplayTag[] = []
      for (const tagId of tagsData.display_tags.slice(0, maxCount)) {
        const option = findTagOption(tagId)
        if (option) {
          tags.push({
            id: tagId,
            label: option.label,
            isCustom: isCustomTag(tagId)
          })
        }
      }
      return tags
    }

    // 沒有設定，使用默認邏輯（傳入 customTagsMap 以識別自訂標籤）
    return getDefaultDisplayTags(tagsData.selections || [], maxCount, customTagsMap)
  } catch {
    return []
  }
}
