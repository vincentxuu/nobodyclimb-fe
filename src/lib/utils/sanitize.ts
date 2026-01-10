import DOMPurify from 'dompurify'

/**
 * 淨化 HTML 內容，防止 XSS 攻擊
 */
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') {
    // SSR 環境下返回空字串，避免錯誤
    return ''
  }

  return DOMPurify.sanitize(dirty, {
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
  })
}
