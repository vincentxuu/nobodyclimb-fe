'use client';

import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import {
  Lightbulb,
  Heart,
  Trophy,
  History,
  AlertTriangle,
  Mountain,
  Wrench,
  MapPin,
  MessageSquare,
  ThumbsUp,
  Youtube,
  Instagram,
  Image as ImageIcon,
  CheckCircle,
  Star,
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { RouteStory, ROUTE_STORY_TYPE_DISPLAY } from '@/lib/types/route-story';
import { cn } from '@/lib/utils';

const ICON_MAP = {
  Lightbulb,
  Heart,
  Trophy,
  History,
  AlertTriangle,
  Mountain,
  Wrench,
  MapPin,
  MessageSquare,
};

interface RouteStoryCardProps {
  story: RouteStory;
  showRoute?: boolean;
  onLike?: () => void;
  onHelpful?: () => void;
  onComment?: () => void;
  className?: string;
}

export function RouteStoryCard({
  story,
  showRoute = false,
  onLike,
  onHelpful,
  onComment,
  className,
}: RouteStoryCardProps) {
  const typeInfo = ROUTE_STORY_TYPE_DISPLAY[story.story_type];
  const Icon = ICON_MAP[typeInfo.icon as keyof typeof ICON_MAP];

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardContent className="p-4">
        {/* Header: 使用者資訊和類型標籤 */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={story.avatar_url || undefined} />
              <AvatarFallback>
                {(story.display_name || story.username || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {story.display_name || story.username}
                </span>
                {story.is_verified && (
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {format(new Date(story.created_at), 'PPP', { locale: zhTW })}
              </span>
            </div>
          </div>

          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
              'bg-gray-100'
            )}
          >
            <Icon className={cn('h-3 w-3', typeInfo.color)} />
            <span>{typeInfo.label}</span>
          </div>
        </div>

        {/* 路線資訊 */}
        {showRoute && story.route_name && (
          <div className="mt-3 flex items-center gap-2">
            <Badge variant="outline">{story.route_name}</Badge>
            {story.route_grade && (
              <Badge variant="secondary">{story.route_grade}</Badge>
            )}
            {story.crag_name && (
              <span className="text-xs text-muted-foreground">
                @ {story.crag_name}
              </span>
            )}
          </div>
        )}

        {/* 精選標籤 */}
        {story.is_featured && (
          <div className="mt-2">
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
              <Star className="mr-1 h-3 w-3" />
              精選
            </Badge>
          </div>
        )}

        {/* 標題 */}
        {story.title && (
          <h3 className="mt-3 font-semibold">{story.title}</h3>
        )}

        {/* 內容 */}
        <p className="mt-2 text-sm text-muted-foreground whitespace-pre-wrap">
          {story.content}
        </p>

        {/* 媒體連結 */}
        <div className="mt-3 flex items-center gap-3">
          {story.photos && story.photos.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ImageIcon className="h-3 w-3" />
              <span>{story.photos.length} 張照片</span>
            </div>
          )}
          {story.youtube_url && (
            <a
              href={story.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
            >
              <Youtube className="h-4 w-4" />
              <span>影片</span>
            </a>
          )}
          {story.instagram_url && (
            <a
              href={story.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-600"
            >
              <Instagram className="h-4 w-4" />
              <span>貼文</span>
            </a>
          )}
        </div>
      </CardContent>

      {/* Footer: 互動按鈕 */}
      <CardFooter className="border-t px-4 py-2">
        <div className="flex items-center gap-4">
          {/* 按讚 */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 gap-1.5',
              story.is_liked && 'text-emerald-600'
            )}
            onClick={onLike}
          >
            <Mountain
              className={cn('h-4 w-4', story.is_liked && 'fill-emerald-600')}
            />
            <span>{story.like_count || ''}</span>
          </Button>

          {/* 有幫助 */}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-8 gap-1.5',
              story.is_helpful && 'text-blue-600'
            )}
            onClick={onHelpful}
          >
            <ThumbsUp
              className={cn('h-4 w-4', story.is_helpful && 'fill-blue-600')}
            />
            <span>{story.helpful_count || ''}</span>
            <span className="text-xs">有幫助</span>
          </Button>

          {/* 留言 */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5"
            onClick={onComment}
          >
            <MessageSquare className="h-4 w-4" />
            <span>{story.comment_count || ''}</span>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
