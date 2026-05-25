'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'

interface UnsavedChangesPromptProps {
  when: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
}

export function UnsavedChangesPrompt({
  when,
  title,
  message,
  confirmText,
  cancelText,
}: UnsavedChangesPromptProps) {
  const t = useTranslations('SharedUI')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [isOpen, setIsOpen] = useState(false)
  const pendingUrlRef = useRef<string | null>(null)
  const currentUrlRef = useRef<string>('')
  const ignoreNextRef = useRef(false)

  useEffect(() => {
    const search = searchParams?.toString()
    currentUrlRef.current = `${pathname}${search ? `?${search}` : ''}`
    if (ignoreNextRef.current) {
      ignoreNextRef.current = false
    }
  }, [pathname, searchParams])

  const openPrompt = (url: string) => {
    pendingUrlRef.current = url
    setIsOpen(true)
  }

  const closePrompt = () => {
    pendingUrlRef.current = null
    setIsOpen(false)
  }

  const handleConfirm = () => {
    const target = pendingUrlRef.current
    closePrompt()
    if (!target) return
    ignoreNextRef.current = true
    router.push(target)
  }

  useEffect(() => {
    const shouldBlock = () => when && !ignoreNextRef.current

    const handleClick = (event: MouseEvent) => {
      if (!shouldBlock()) return
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target as HTMLElement | null
      const anchor = target?.closest('a')
      if (!anchor) return
      if (anchor.target && anchor.target !== '_self') return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return

      let url: URL
      try {
        url = new URL(href, window.location.origin)
      } catch {
        return
      }

      if (url.origin !== window.location.origin) return

      event.preventDefault()
      event.stopPropagation()
      openPrompt(`${url.pathname}${url.search}${url.hash}`)
    }

    const handlePopState = () => {
      if (!shouldBlock()) return
      const targetUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`
      const fallbackUrl = currentUrlRef.current || '/'

      history.pushState(null, '', fallbackUrl)
      openPrompt(targetUrl)
    }

    window.addEventListener('click', handleClick, true)
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('click', handleClick, true)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [when])

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={closePrompt}
      onConfirm={handleConfirm}
      title={title ?? t('unsavedTitle')}
      message={message ?? t('unsavedMessage')}
      confirmText={confirmText ?? t('unsavedConfirm')}
      cancelText={cancelText ?? t('cancel')}
      variant="warning"
    />
  )
}

export default UnsavedChangesPrompt
