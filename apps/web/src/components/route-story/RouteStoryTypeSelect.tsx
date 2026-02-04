'use client';

import { cn } from '@/lib/utils';
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
} from 'lucide-react';
import { RouteStoryType, ROUTE_STORY_TYPE_DISPLAY } from '@/lib/types/route-story';

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

interface RouteStoryTypeSelectProps {
  value: RouteStoryType | null;
  onChange: (value: RouteStoryType) => void;
  className?: string;
}

export function RouteStoryTypeSelect({
  value,
  onChange,
  className,
}: RouteStoryTypeSelectProps) {
  const types = Object.entries(ROUTE_STORY_TYPE_DISPLAY) as [
    RouteStoryType,
    (typeof ROUTE_STORY_TYPE_DISPLAY)[RouteStoryType]
  ][];

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {types.map(([type, info]) => {
        const Icon = ICON_MAP[info.icon as keyof typeof ICON_MAP];
        const isSelected = value === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all',
              isSelected
                ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-500'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            <Icon className={cn('h-4 w-4', isSelected ? 'text-emerald-600' : info.color)} />
            <span>{info.label}</span>
          </button>
        );
      })}
    </div>
  );
}
