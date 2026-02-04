'use client';

import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import {
  CircleDot,
  Zap,
  Eye,
  Target,
  ArrowUp,
  Sword,
  Users,
  Repeat,
  Star,
  Youtube,
  Instagram,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UserRouteAscent, ASCENT_TYPE_DISPLAY } from '@/lib/types/ascent';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  CircleDot,
  Zap,
  Eye,
  Target,
  ArrowUp,
  Sword,
  Users,
  Repeat,
};

interface AscentCardProps {
  ascent: UserRouteAscent;
  showRoute?: boolean;
  showUser?: boolean;
  className?: string;
}

export function AscentCard({
  ascent,
  showRoute = true,
  showUser = true,
  className,
}: AscentCardProps) {
  const typeInfo = ASCENT_TYPE_DISPLAY[ascent.ascent_type];
  const Icon = ICON_MAP[typeInfo.icon as keyof typeof ICON_MAP];

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* 使用者頭像 */}
          {showUser && ascent.username && (
            <Avatar className="h-10 w-10">
              <AvatarImage src={ascent.avatar_url || undefined} />
              <AvatarFallback>
                {(ascent.display_name || ascent.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="flex-1 min-w-0">
            {/* 使用者名稱和日期 */}
            <div className="flex items-center justify-between gap-2">
              {showUser && ascent.username && (
                <span className="font-medium text-sm truncate">
                  {ascent.display_name || ascent.username}
                </span>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {format(new Date(ascent.ascent_date), 'PPP', { locale: zhTW })}
              </div>
            </div>

            {/* 路線資訊 */}
            {showRoute && ascent.route_name && (
              <div className="mt-1">
                <span className="text-sm font-medium">{ascent.route_name}</span>
                {ascent.route_grade && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {ascent.route_grade}
                  </Badge>
                )}
                {ascent.crag_name && (
                  <span className="text-xs text-muted-foreground ml-2">
                    @ {ascent.crag_name}
                  </span>
                )}
              </div>
            )}

            {/* 攀爬類型 */}
            <div className="mt-2 flex items-center gap-2">
              <div
                className={cn(
                  'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                  'bg-gray-100'
                )}
              >
                <Icon className={cn('h-3 w-3', typeInfo.color)} />
                <span>{typeInfo.label}</span>
              </div>

              {ascent.attempts_count > 1 && (
                <span className="text-xs text-muted-foreground">
                  {ascent.attempts_count} 次嘗試
                </span>
              )}

              {ascent.perceived_grade && (
                <span className="text-xs text-muted-foreground">
                  感受：{ascent.perceived_grade}
                </span>
              )}
            </div>

            {/* 評分 */}
            {ascent.rating && (
              <div className="mt-2 flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      'h-3 w-3',
                      star <= ascent.rating!
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-200'
                    )}
                  />
                ))}
              </div>
            )}

            {/* 筆記 */}
            {ascent.notes && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {ascent.notes}
              </p>
            )}

            {/* 媒體連結 */}
            <div className="mt-2 flex items-center gap-2">
              {ascent.photos && ascent.photos.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ImageIcon className="h-3 w-3" />
                  <span>{ascent.photos.length} 張照片</span>
                </div>
              )}
              {ascent.youtube_url && (
                <a
                  href={ascent.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-500 hover:text-red-600"
                >
                  <Youtube className="h-4 w-4" />
                </a>
              )}
              {ascent.instagram_url && (
                <a
                  href={ascent.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-500 hover:text-pink-600"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
