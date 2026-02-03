// HTML 實體對應表（移到函式外部以提升效能）
const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&hellip;': '…',
  '&mdash;': '—',
  '&ndash;': '–',
  '&lsquo;': '\u2018',
  '&rsquo;': '\u2019',
  '&ldquo;': '\u201C',
  '&rdquo;': '\u201D',
}

// 匹配 HTML 實體的正規表達式（包含數字實體）
const HTML_ENTITY_REGEX = /&(?:#(\d+)|#x([a-fA-F0-9]+)|([a-zA-Z]+));/g

/**
 * 解碼 HTML 實體
 * @param text - 包含 HTML 實體的文字
 * @returns 解碼後的文字
 */
export function decodeHtmlEntities(text: string): string {
  return text.replace(HTML_ENTITY_REGEX, (match, decimal, hex, named) => {
    // 處理數字實體 (&#123;)
    if (decimal) {
      return String.fromCharCode(parseInt(decimal, 10))
    }
    // 處理十六進位實體 (&#x7B;)
    if (hex) {
      return String.fromCharCode(parseInt(hex, 16))
    }
    // 處理命名實體 (&nbsp;)
    const namedEntity = `&${named};`
    return HTML_ENTITIES[namedEntity] || match
  })
}

/**
 * 從 HTML 內容生成文章摘要
 * @param content - HTML 格式的文章內容
 * @param manualSummary - 手動輸入的摘要（如果有）
 * @param maxLength - 摘要最大長度，預設 150
 * @returns 摘要文字
 */
export function generateSummary(
  content: string,
  manualSummary?: string,
  maxLength: number = 150
): string {
  // 如果有手動輸入的摘要，使用它
  if (manualSummary?.trim()) {
    return manualSummary.trim()
  }

  // 先解碼 HTML 實體，再移除 HTML 標籤
  // 這樣可以確保解碼後產生的標籤（如 &lt;b&gt; -> <b>）也會被移除
  const plainTextContent = decodeHtmlEntities(content).replace(/<[^>]*>/g, '').trim()

  // 如果內容為空，返回空字串
  if (!plainTextContent) {
    return ''
  }

  // 如果內容長度超過最大長度，截斷並加上省略號
  if (plainTextContent.length > maxLength) {
    return plainTextContent.substring(0, maxLength) + '...'
  }

  return plainTextContent
}
