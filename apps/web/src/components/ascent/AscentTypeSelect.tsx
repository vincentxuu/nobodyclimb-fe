'use client';

import { cn } from '@/lib/utils';
import {
  CircleDot,
  Zap,
  Eye,
  Target,
  ArrowUp,
  Sword,
  Users,
  Repeat,
} from 'lucide-react';
import { AscentType, ASCENT_TYPE_DISPLAY } from '@/lib/types/ascent';

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

interface AscentTypeSelectProps {
  value: AscentType | null;
  onChange: (value: AscentType) => void;
  className?: string;
}

export function AscentTypeSelect({
  value,
  onChange,
  className,
}: AscentTypeSelectProps) {
  const types = Object.entries(ASCENT_TYPE_DISPLAY) as [
    AscentType,
    (typeof ASCENT_TYPE_DISPLAY)[AscentType]
  ][];

  return (
    <div className={cn('grid grid-cols-4 gap-2', className)}>
      {types.map(([type, info]) => {
        const Icon = ICON_MAP[info.icon as keyof typeof ICON_MAP];
        const isSelected = value === type;

        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border p-3 transition-all',
              isSelected
                ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            <Icon className={cn('h-5 w-5', isSelected ? 'text-emerald-600' : info.color)} />
            <span className="text-xs font-medium">{info.label}</span>
          </button>
        );
      })}
    </div>
  );
}
