'use client'

import { useState, KeyboardEvent } from 'react'
import { X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface TagSelectorProps {
  tags: string[]
  // eslint-disable-next-line no-unused-vars
  onChange: (_newTags: string[]) => void
  placeholder?: string
  maxTags?: number
  suggestions?: string[]
}

export function TagSelector({
  tags,
  onChange,
  placeholder = '輸入標籤後按 Enter',
  maxTags = 5,
  suggestions = ['攀岩技巧', '裝備評測', '訓練心得', '比賽紀錄', '岩場分享', '抱石', '先鋒攀登'],
}: TagSelectorProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onChange([...tags, trimmedTag])
      setInputValue('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    }
  }

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().includes(inputValue.toLowerCase()) && !tags.includes(s)
  )

  return (
    <div className="space-y-3">
      {/* 已選標籤 */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-[#1B1A1A] px-3 py-1 text-sm text-white"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 rounded-full p-0.5 hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 輸入框 */}
      {tags.length < maxTags && (
        <div className="relative">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setShowSuggestions(true)
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={placeholder}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => addTag(inputValue)}
              disabled={!inputValue.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* 建議標籤 */}
          {showSuggestions && filteredSuggestions.length > 0 && inputValue && (
            <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {filteredSuggestions.slice(0, 5).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                  onMouseDown={() => addTag(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 快速選擇 */}
      {tags.length < maxTags && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-500">快速添加：</span>
          {suggestions
            .filter((s) => !tags.includes(s))
            .slice(0, 4)
            .map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => addTag(suggestion)}
                className="rounded-full border border-gray-300 px-3 py-1 text-xs text-gray-600 transition-colors hover:border-[#1B1A1A] hover:bg-gray-50"
              >
                + {suggestion}
              </button>
            ))}
        </div>
      )}

      {/* 提示訊息 */}
      <p className="text-xs text-gray-400">
        最多可添加 {maxTags} 個標籤，已添加 {tags.length} 個
      </p>
    </div>
  )
}
