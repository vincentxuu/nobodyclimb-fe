'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Instagram, Youtube } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { RouteStoryTypeSelect } from './RouteStoryTypeSelect';
import { RouteStoryType, RouteStoryFormData, RouteStoryVisibility } from '@/lib/types/route-story';

const routeStoryFormSchema = z.object({
  route_id: z.string().min(1, '請選擇路線'),
  story_type: z.enum([
    'beta',
    'experience',
    'first_ascent',
    'history',
    'safety',
    'conditions',
    'gear',
    'approach',
    'other',
  ]),
  title: z.string().nullable().optional(),
  content: z.string().min(1, '請輸入內容'),
  youtube_url: z.string().url().nullable().optional().or(z.literal('')),
  instagram_url: z.string().url().nullable().optional().or(z.literal('')),
  visibility: z.enum(['public', 'community', 'private']).optional(),
});

interface RouteStoryFormProps {
  routeId: string;
  routeName: string;
  routeGrade?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: RouteStoryFormData) => Promise<void>;
  initialData?: Partial<RouteStoryFormData>;
  isLoading?: boolean;
}

export function RouteStoryForm({
  routeId,
  routeName,
  routeGrade,
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
}: RouteStoryFormProps) {
  const form = useForm<RouteStoryFormData>({
    resolver: zodResolver(routeStoryFormSchema),
    defaultValues: {
      route_id: routeId,
      story_type: initialData?.story_type ?? 'beta',
      title: initialData?.title ?? null,
      content: initialData?.content ?? '',
      youtube_url: initialData?.youtube_url ?? null,
      instagram_url: initialData?.instagram_url ?? null,
      visibility: initialData?.visibility ?? 'public',
    },
  });

  const handleFormSubmit = async (data: RouteStoryFormData) => {
    await onSubmit({
      ...data,
      youtube_url: data.youtube_url || null,
      instagram_url: data.instagram_url || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>分享路線故事</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {routeName} {routeGrade && <span className="font-medium">({routeGrade})</span>}
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* 故事類型 */}
          <div className="space-y-2">
            <Label>故事類型</Label>
            <RouteStoryTypeSelect
              value={form.watch('story_type') as RouteStoryType}
              onChange={(type) => form.setValue('story_type', type)}
            />
          </div>

          {/* 標題 (可選) */}
          <div className="space-y-2">
            <Label htmlFor="title">標題 (可選)</Label>
            <Input
              id="title"
              placeholder="為你的故事加個標題"
              {...form.register('title')}
            />
          </div>

          {/* 內容 */}
          <div className="space-y-2">
            <Label htmlFor="content">內容 *</Label>
            <Textarea
              id="content"
              placeholder="分享你的經驗..."
              rows={6}
              {...form.register('content')}
            />
            {form.formState.errors.content && (
              <p className="text-xs text-red-500">
                {form.formState.errors.content.message}
              </p>
            )}
          </div>

          {/* 媒體連結 */}
          <div className="space-y-4">
            <Label>媒體連結 (可選)</Label>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Youtube className="h-5 w-5 text-red-500" />
                <Input
                  placeholder="YouTube 影片連結"
                  {...form.register('youtube_url')}
                />
              </div>
              <div className="flex items-center gap-2">
                <Instagram className="h-5 w-5 text-pink-500" />
                <Input
                  placeholder="Instagram 貼文連結"
                  {...form.register('instagram_url')}
                />
              </div>
            </div>
          </div>

          {/* 可見性設定 */}
          <div className="space-y-2">
            <Label>誰可以看到</Label>
            <Select
              value={form.watch('visibility')}
              onValueChange={(value: RouteStoryVisibility) =>
                form.setValue('visibility', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="選擇可見性" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">公開 - 所有人可見</SelectItem>
                <SelectItem value="community">社群 - 登入會員可見</SelectItem>
                <SelectItem value="private">私人 - 僅自己可見</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 提交按鈕 */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              取消
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? '發布中...' : '發布'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
