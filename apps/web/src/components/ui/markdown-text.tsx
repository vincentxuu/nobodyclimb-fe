import * as React from 'react'
import { cn } from '@/lib/utils'

interface MarkdownTextProps {
  content: string
  className?: string
}

/**
 * 輕量 Markdown 文字渲染器
 * 支援：換行（\n 或真實換行）、粗體（**text**）、數字清單（1. item）
 */
export function MarkdownText({ content, className }: MarkdownTextProps) {
  // 將字面上的 \n 轉換為真實換行，再以空行分段落
  const normalized = content.replace(/\\n/g, '\n')
  const paragraphs = normalized.split(/\n{2,}/)

  return (
    <div className={cn('space-y-3', className)}>
      {paragraphs.map((para, i) => {
        const lines = para.split('\n').filter((l) => l.trim() !== '')
        // 判斷是否為數字清單段落（多行且每行以數字開頭）
        const isNumberedList =
          lines.length > 1 && lines.every((l) => /^\d+\./.test(l.trim()))

        if (isNumberedList) {
          return (
            <ol key={i} className="list-decimal space-y-1 pl-5">
              {lines.map((line, j) => (
                <li key={j} className="text-sm leading-relaxed">
                  <InlineMarkdown text={line.replace(/^\d+\.\s*/, '')} />
                </li>
              ))}
            </ol>
          )
        }

        return (
          <p key={i} className="text-sm leading-relaxed">
            {lines.map((line, j) => (
              <React.Fragment key={j}>
                {j > 0 && <br />}
                <InlineMarkdown text={line} />
              </React.Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}

/** 處理行內 Markdown：**bold** */
function InlineMarkdown({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  )
}
