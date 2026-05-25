'use client'

import { Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import React from 'react'
import { Input } from '@/components/ui/input'

interface SearchInputProps {
  value: string
  // eslint-disable-next-line no-unused-vars
  onChange: (_e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder, className }: SearchInputProps) {
  const t = useTranslations('CommonUI')

  return (
    <div className={`flex justify-center px-4 md:px-0 ${className ?? ''}`}>
      <Input
        type="text"
        placeholder={placeholder ?? t('searchPlaceholder')}
        value={value}
        onChange={onChange}
        rightIcon={<Search className="h-5 w-5 stroke-[1.5px] text-text-main" />}
        wrapperClassName="w-full max-w-[240px]"
        className="h-[40px] rounded-lg border-text-main bg-white font-light text-text-main placeholder:text-text-subtle focus:ring-2 focus:ring-text-main"
      />
    </div>
  )
}
