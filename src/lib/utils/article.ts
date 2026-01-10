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

  // 從 HTML 內容中提取純文字
  const plainTextContent = content.replace(/<[^>]*>/g, '').trim()

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
