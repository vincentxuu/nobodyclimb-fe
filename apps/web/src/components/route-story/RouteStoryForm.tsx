'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { RouteStoryFormData } from '@/lib/types/route-story';

const routeStoryFormSchema = z.object({
  route_id: z.string().min(1, '請選擇路線'),
  title: z.string().nullable().optional(),
  content: z.string().min(1, '請輸入內容'),
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
      title: initialData?.title ?? null,
      content: initialData?.content ?? '',
    },
  });

  // 當 dialog 關閉時重置表單狀態
  useEffect(() => {
    if (!open) {
      form.reset({
        route_id: routeId,
        title: initialData?.title ?? null,
        content: initialData?.content ?? '',
      });
    }
  }, [open, form, routeId, initialData]);

  const handleFormSubmit = async (data: RouteStoryFormData) => {
    await onSubmit({
      ...data,
      visibility: 'public',
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>分享路線故事</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {routeName} {routeGrade && <span className="font-medium">({routeGrade})</span>}
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* 標題 (可選) */}
          <div className="space-y-2">
            <Label htmlFor="title">標題 (可選)</Label>
            <Input
              id="title"
              placeholder="例如：為什麼叫做這個名字"
              {...form.register('title')}
            />
          </div>

          {/* 內容 */}
          <div className="space-y-2">
            <Label htmlFor="content">故事內容 *</Label>
            <Textarea
              id="content"
              placeholder="分享這條路線的命名由來、歷史故事或特別的經歷..."
              rows={5}
              {...form.register('content')}
            />
            {form.formState.errors.content && (
              <p className="text-xs text-red-500">
                {form.formState.errors.content.message}
              </p>
            )}
          </div>

          {/* 提交按鈕 */}
          <div className="flex gap-2 pt-2">
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
