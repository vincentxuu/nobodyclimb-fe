import DOMPurify from 'dompurify'

/**
 * DOMPurify 配置選項
 */
const DOMPURIFY_CONFIG = {
  ALLOWED_TAGS: [
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'ul',
    'ol',
    'li',
    'blockquote',
    'pre',
    'code',
    'a',
    'img',
    'span',
    'div',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'style', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onclick', 'onload', 'onmouseover'],
}

/**
 * 淨化 HTML 內容，防止 XSS 攻擊
 * 在客戶端使用 DOMPurify，服務端直接返回原始內容
 * 注意：此函數應只在 'use client' 組件中使用
 */
export function sanitizeHtml(dirty: string): string {
  // 服務端：直接返回原始內容
  // 實際的 sanitize 會在客戶端 hydration 後執行
  if (typeof window === 'undefined') {
    return dirty
  }

  // 客戶端：使用 DOMPurify
  return DOMPurify.sanitize(dirty, DOMPURIFY_CONFIG)
}
