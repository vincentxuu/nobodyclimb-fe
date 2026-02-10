'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Calendar as CalendarIcon, Star, Instagram, Youtube } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PhotoUpload } from '@/components/ui/photo-upload';
import { galleryService } from '@/lib/api/services';

import { AscentTypeSelect } from './AscentTypeSelect';
import { AscentType, AscentFormData } from '@/lib/types/ascent';
import { cn } from '@/lib/utils';

const ascentFormSchema = z.object({
  route_id: z.string().min(1, '請選擇路線'),
  ascent_type: z.enum([
    'redpoint',
    'flash',
    'onsight',
    'attempt',
    'toprope',
    'lead',
    'seconding',
    'repeat',
  ]),
  ascent_date: z.string().min(1, '請選擇日期'),
  attempts_count: z.number().min(1).optional(),
  rating: z.number().min(1).max(5).nullable().optional(),
  perceived_grade: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  photos: z.array(z.string()).optional(),
  youtube_url: z.string().url().nullable().optional().or(z.literal('')),
  instagram_url: z.string().url().nullable().optional().or(z.literal('')),
  is_public: z.boolean().optional(),
});

interface AscentFormProps {
  routeId: string;
  routeName: string;
  routeGrade?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: AscentFormData) => Promise<void>;
  initialData?: Partial<AscentFormData>;
  isLoading?: boolean;
}

export function AscentForm({
  routeId,
  routeName,
  routeGrade,
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading = false,
}: AscentFormProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    initialData?.ascent_date ? new Date(initialData.ascent_date) : new Date()
  );
  const [photos, setPhotos] = useState<string[]>(initialData?.photos ?? []);

  const form = useForm<AscentFormData>({
    resolver: zodResolver(ascentFormSchema),
    defaultValues: {
      route_id: routeId,
      ascent_type: initialData?.ascent_type ?? 'redpoint',
      ascent_date: initialData?.ascent_date ?? format(new Date(), 'yyyy-MM-dd'),
      attempts_count: initialData?.attempts_count ?? 1,
      rating: initialData?.rating ?? null,
      perceived_grade: initialData?.perceived_grade ?? null,
      notes: initialData?.notes ?? null,
      photos: initialData?.photos ?? [],
      youtube_url: initialData?.youtube_url ?? null,
      instagram_url: initialData?.instagram_url ?? null,
      is_public: initialData?.is_public ?? true,
    },
  });

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      form.setValue('ascent_date', format(date, 'yyyy-MM-dd'));
    }
  };

  const handleRatingChange = (newRating: number) => {
    const currentRating = form.getValues('rating');
    const finalRating = currentRating === newRating ? null : newRating;
    form.setValue('rating', finalRating);
  };

  // 取得目前的 rating 值以用於渲染
  const currentRating = form.watch('rating');

  // 當 dialog 關閉時重置表單狀態
  useEffect(() => {
    if (!open) {
      form.reset({
        route_id: routeId,
        ascent_type: initialData?.ascent_type ?? 'redpoint',
        ascent_date: initialData?.ascent_date ?? format(new Date(), 'yyyy-MM-dd'),
        attempts_count: initialData?.attempts_count ?? 1,
        rating: initialData?.rating ?? null,
        perceived_grade: initialData?.perceived_grade ?? null,
        notes: initialData?.notes ?? null,
        photos: initialData?.photos ?? [],
        youtube_url: initialData?.youtube_url ?? null,
        instagram_url: initialData?.instagram_url ?? null,
        is_public: initialData?.is_public ?? true,
      });
      setPhotos(initialData?.photos ?? []);
      setSelectedDate(initialData?.ascent_date ? new Date(initialData.ascent_date) : new Date());
    }
  }, [open, form, routeId, initialData]);

  const handleFormSubmit = async (data: AscentFormData) => {
    await onSubmit({
      ...data,
      photos: photos.length > 0 ? photos : undefined,
      youtube_url: data.youtube_url || null,
      instagram_url: data.instagram_url || null,
    });
    setPhotos([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>記錄攀爬</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {routeName} {routeGrade && <span className="font-medium">({routeGrade})</span>}
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* 攀爬類型 */}
          <div className="space-y-2">
            <Label>攀爬類型</Label>
            <AscentTypeSelect
              value={form.watch('ascent_type') as AscentType}
              onChange={(type) => form.setValue('ascent_type', type)}
            />
          </div>

          {/* 攀爬日期 */}
          <div className="space-y-2">
            <Label>攀爬日期</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !selectedDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate
                    ? format(selectedDate, 'PPP', { locale: zhTW })
                    : '選擇日期'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  autoFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* 嘗試次數 */}
          <div className="space-y-2">
            <Label htmlFor="attempts_count">嘗試次數</Label>
            <Input
              id="attempts_count"
              type="number"
              min={1}
              {...form.register('attempts_count', { valueAsNumber: true })}
            />
          </div>

          {/* 個人評分 */}
          <div className="space-y-2">
            <Label>個人評分 (可選)</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleRatingChange(star)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      'h-6 w-6 transition-colors',
                      currentRating && star <= currentRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-300'
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* 感受難度 */}
          <div className="space-y-2">
            <Label htmlFor="perceived_grade">感受難度 (可選)</Label>
            <Input
              id="perceived_grade"
              placeholder="例如：比標示難度稍難"
              {...form.register('perceived_grade')}
            />
          </div>

          {/* 筆記 */}
          <div className="space-y-2">
            <Label htmlFor="notes">筆記 (可選)</Label>
            <Textarea
              id="notes"
              placeholder="記錄這次攀爬的心得..."
              rows={3}
              {...form.register('notes')}
            />
          </div>

          {/* 照片上傳 */}
          <div className="space-y-2">
            <Label>照片 (可選)</Label>
            <PhotoUpload
              photos={photos}
              onChange={setPhotos}
              maxPhotos={5}
              uploadFn={galleryService.uploadImage}
              disabled={isLoading}
            />
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

          {/* 公開設定 */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="is_public">公開這筆記錄</Label>
              <p className="text-xs text-muted-foreground">
                其他人可以看到這筆攀爬記錄
              </p>
            </div>
            <Switch
              id="is_public"
              checked={form.watch('is_public')}
              onCheckedChange={(checked) => form.setValue('is_public', checked)}
            />
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
              {isLoading ? '儲存中...' : '儲存'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
