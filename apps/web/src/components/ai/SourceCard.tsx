'use client'

import Link from 'next/link'
import { MountainSnow, MapPin, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AISource } from '@/lib/api/ai'

const TYPE_LABEL: Record<AISource['type'], string> = {
  route: '路線',
  crag: '岩場',
  video: '影片',
}

const TYPE_ICON: Record<AISource['type'], React.ElementType> = {
  route: MountainSnow,
  crag: MapPin,
  video: Video,
}

interface SourceCardProps {
  source: AISource
  className?: string
}

export function SourceCard({ source, className }: SourceCardProps) {
  const Icon = TYPE_ICON[source.type]
  const label = TYPE_LABEL[source.type]
  const isExternal = source.url?.startsWith('http')

  const content = (
    <div
      className={cn(
        'flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2',
        'hover:bg-muted/70 transition-colors cursor-pointer',
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium">{source.title}</span>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {label}
          </span>
        </div>
        {source.excerpt && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{source.excerpt}</p>
        )}
      </div>
    </div>
  )

  if (!source.url) return content

  if (isExternal) {
    return (
      <a href={source.url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
  }

  return <Link href={source.url} target="_blank" rel="noopener noreferrer">{content}</Link>
}
