'use client'

import { Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export interface InteractorUser {
  user_id: string
  username: string
  display_name: string | null
  avatar_url: string | null
}

interface ContentInteractorsPanelProps {
  isOpen: boolean
  users: InteractorUser[]
  isLoading: boolean
  emptyMessage?: string
  panelClassName?: string
}

/**
 * 互動者列表 Panel（按讚者 / 反應者）
 * inline 展開，使用時需設 basis-full 讓其佔滿整行
 */
export function ContentInteractorsPanel({
  isOpen,
  users,
  isLoading,
  emptyMessage,
  panelClassName,
}: ContentInteractorsPanelProps) {
  const t = useTranslations('BiographyPage')
  const resolvedEmptyMessage = emptyMessage ?? t('noInteractors')
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn('w-full overflow-hidden basis-full', panelClassName)}
        >
          <div className="mt-3 border-t border-[#EBEAEA] pt-3">
            {isLoading ? (
              <div className="flex justify-center py-3">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              </div>
            ) : users.length > 0 ? (
              <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                {users.map((user) => {
                  const displayName = user.display_name || user.username
                  return (
                    <Link
                      key={user.user_id}
                      href={`/profile/${user.username}`}
                      className="flex items-center gap-1.5 rounded-full border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
                    >
                      <div className="h-5 w-5 flex-shrink-0 overflow-hidden rounded-full bg-gray-200">
                        {user.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={user.avatar_url}
                            alt={displayName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span>{displayName}</span>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p className="py-2 text-center text-xs text-gray-400">{resolvedEmptyMessage}</p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ContentInteractorsPanel
