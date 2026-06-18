function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

function formatInlineMarkdown(value: string): string {
  let output = escapeHtml(value)

  output = output.replace(/!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g, '<img src="$2" alt="$1" />')
  output = output.replace(
    /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
  )
  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  return output
}

export function markdownToArticleHtml(value: string): string {
  const normalized = value.replace(/\r\n/g, '\n').trim()
  if (!normalized) return ''

  const blocks = normalized.split(/\n{2,}/)

  return blocks
    .map((block) => {
      const lines = block
        .split('\n')
        .map((line) => line.trimEnd())
        .filter(Boolean)

      if (lines.length === 0) return ''

      const firstLine = lines[0].trim()
      if (firstLine.startsWith('# ')) {
        return `<h1>${formatInlineMarkdown(firstLine.slice(2).trim())}</h1>`
      }
      if (firstLine.startsWith('## ')) {
        return `<h2>${formatInlineMarkdown(firstLine.slice(3).trim())}</h2>`
      }
      if (lines.every((line) => line.trim().startsWith('- '))) {
        return `<ul>${lines
          .map((line) => `<li>${formatInlineMarkdown(line.trim().slice(2).trim())}</li>`)
          .join('')}</ul>`
      }
      if (lines.every((line) => /^\d+\.\s+/.test(line.trim()))) {
        return `<ol>${lines
          .map((line) => `<li>${formatInlineMarkdown(line.trim().replace(/^\d+\.\s+/, ''))}</li>`)
          .join('')}</ol>`
      }
      if (lines.every((line) => line.trim().startsWith('> '))) {
        return `<blockquote>${lines
          .map((line) => formatInlineMarkdown(line.trim().slice(2).trim()))
          .join('<br />')}</blockquote>`
      }

      return `<p>${lines.map((line) => formatInlineMarkdown(line)).join('<br />')}</p>`
    })
    .filter(Boolean)
    .join('\n')
}

export function htmlToEditableArticleText(value: string): string {
  if (!/<[a-z][\s\S]*>/i.test(value)) return value

  return decodeHtmlEntities(
    value
      .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '\n# $1\n')
      .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '\n## $1\n')
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '- $1\n')
      .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '\n> $1\n')
      .replace(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi, '\n\n![image]($1)\n\n')
      .replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)')
      .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<[^>]+>/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  )
}

export function plainTextSummary(value: string, fallback: string): string {
  const manual = fallback.trim()
  if (manual) return manual

  return value
    .replace(/!\[[^\]]*]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[#>*_`-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
}
