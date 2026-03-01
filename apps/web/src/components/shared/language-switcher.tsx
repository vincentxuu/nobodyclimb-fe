'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { Globe } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('common')

  function handleChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[#1B1A1A] transition-colors hover:bg-gray-100"
          aria-label={t('language.switchLanguage')}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden text-xs md:inline">{t(`language.${locale}`)}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[140px] rounded-lg border border-[#EBEAEA] bg-white p-1 shadow-md">
        {routing.locales.map((l) => (
          <DropdownMenuItem
            key={l}
            className={`cursor-pointer rounded-md px-3 py-2 text-sm ${
              l === locale
                ? 'bg-[#FFE70C]/10 font-medium text-[#1B1A1A]'
                : 'text-[#3F3D3D] hover:bg-gray-100'
            }`}
            onClick={() => handleChange(l)}
          >
            {t(`language.${l}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
