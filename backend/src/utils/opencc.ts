import { Converter } from 'opencc-js/cn2t'

// 簡體 -> 繁體（僅轉換字元與慣用語，不做 IT 詞彙全面在地化，
// 避免像「twp」模式把一般詞彙誤判成技術詞彙後置換，例如「類型」被誤轉成「型別」）
const converter = Converter({ from: 'cn', to: 'tw' })

// OpenCC 字典會選用「巖」「臺」等正式異體字，但站內用語（攀岩、岩場、台灣…）
// 一律使用「岩」「台」，故轉換後需改回專案慣用字，避免和既有內容不一致
const HOUSE_STYLE_OVERRIDES: ReadonlyArray<readonly [RegExp, string]> = [
  [/巖/g, '岩'],
  [/臺/g, '台'],
]

/**
 * 將 LLM 生成內容轉換為繁體中文（台灣用語）。
 * 作為 prompt 指令之外的保底防線，避免模型（如 Qwen、GitHub Models 等）
 * 在指令未被完全遵守時吐出簡體字或中國大陸慣用詞彙。
 */
export function toTraditionalChinese(text: string): string {
  if (!text) return text
  let result = converter(text)
  for (const [pattern, replacement] of HOUSE_STYLE_OVERRIDES) {
    result = result.replace(pattern, replacement)
  }
  return result
}
