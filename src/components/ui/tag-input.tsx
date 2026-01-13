'use client'

import React, { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

/**
 * 標籤輸入元件
 * 輸入後按 Enter 新增，點擊 × 刪除
 */
export function TagInput({
  value,
  onChange,
  placeholder = '輸入後按 Enter 新增',
  className,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const trimmed = inputValue.trim()
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed])
        setInputValue('')
      }
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // 當輸入框空白且按 Backspace 時，刪除最後一個標籤
      onChange(value.slice(0, -1))
    }
  }

  const handleRemove = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  return (
    <div
      className={cn(
        'flex min-h-10 flex-wrap gap-2 rounded-md border border-[#B6B3B3] bg-white px-3 py-2',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
        >
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => handleRemove(tag)}
              className="rounded-full p-0.5 hover:bg-gray-200"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ''}
        disabled={disabled}
        className="min-w-[120px] flex-1 border-none bg-transparent text-sm outline-none placeholder:text-gray-400"
      />
    </div>
  )
}

/**
 * 將逗號分隔的字串轉換為標籤陣列
 */
export function stringToTags(str: string): string[] {
  if (!str) return []
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * 將標籤陣列轉換為逗號分隔的字串
 */
export function tagsToString(tags: string[]): string {
  return tags.join(', ')
}
