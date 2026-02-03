'use client'

import React from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchInputProps {
  value: string
  // eslint-disable-next-line no-unused-vars
  onChange: (_e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = '搜尋...',
  className,
}: SearchInputProps) {
  return (
    <div className={`flex justify-center px-4 md:px-0 ${className ?? ''}`}>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        rightIcon={<Search className="h-5 w-5 stroke-[1.5px] text-text-main" />}
        wrapperClassName="w-full max-w-[240px]"
        className="h-[40px] rounded-[4px] border-text-main bg-white font-light text-text-main placeholder:text-text-subtle focus:ring-2 focus:ring-text-main"
      />
    </div>
  )
}
