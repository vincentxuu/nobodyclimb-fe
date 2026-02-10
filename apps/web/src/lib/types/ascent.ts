/**
 * 攀爬類型
 */
export type AscentType =
  | 'redpoint' // 紅點完攀
  | 'flash' // 閃攀
  | 'onsight' // 視攀
  | 'attempt' // 嘗試
  | 'toprope' // 上方確保
  | 'lead' // 先鋒
  | 'seconding' // 跟攀
  | 'repeat'; // 重複完攀

/**
 * 攀爬類型顯示資訊
 */
export const ASCENT_TYPE_DISPLAY: Record<
  AscentType,
  {
    label: string;
    description: string;
    icon: string;
    color: string;
  }
> = {
  redpoint: {
    label: 'Redpoint',
    description: '經過練習後一次完攀',
    icon: 'CircleDot',
    color: 'text-red-500',
  },
  flash: {
    label: 'Flash',
    description: '第一次嘗試且看過他人攀爬',
    icon: 'Zap',
    color: 'text-yellow-500',
  },
  onsight: {
    label: 'Onsight',
    description: '第一次嘗試且未看過任何資訊',
    icon: 'Eye',
    color: 'text-emerald-500',
  },
  attempt: {
    label: 'Attempt',
    description: '未完攀',
    icon: 'Target',
    color: 'text-gray-500',
  },
  toprope: {
    label: 'Top Rope',
    description: '上方確保攀登',
    icon: 'ArrowUp',
    color: 'text-blue-500',
  },
  lead: {
    label: 'Lead',
    description: '先鋒攀登',
    icon: 'Sword',
    color: 'text-purple-500',
  },
  seconding: {
    label: 'Second',
    description: '跟攀',
    icon: 'Users',
    color: 'text-cyan-500',
  },
  repeat: {
    label: 'Repeat',
    description: '重複完攀',
    icon: 'Repeat',
    color: 'text-indigo-500',
  },
};

/**
 * 使用者攀爬記錄
 */
export interface UserRouteAscent {
  id: string;
  user_id: string;
  route_id: string;

  ascent_type: AscentType;
  ascent_date: string;
  attempts_count: number;
  rating: number | null;
  perceived_grade: string | null;

  notes: string | null;
  is_public: boolean;

  // 媒體連結
  photos: string[];
  youtube_url: string | null;
  instagram_url: string | null;

  created_at: string;
  updated_at: string;

  // Joined fields
  route_name?: string;
  route_grade?: string;
  crag_id?: string;
  crag_name?: string;
  username?: string;
  display_name?: string | null;
  avatar_url?: string | null;
}

/**
 * 新增/編輯攀爬記錄表單
 */
export interface AscentFormData {
  route_id: string;
  ascent_type: AscentType;
  ascent_date: string;
  attempts_count?: number;
  rating?: number | null;
  perceived_grade?: string | null;
  notes?: string | null;
  photos?: string[];
  youtube_url?: string | null;
  instagram_url?: string | null;
  is_public?: boolean;
}

/**
 * 使用者攀爬統計
 */
export interface UserClimbingStats {
  total_ascents: number;
  unique_routes: number;
  unique_crags: number;

  by_type: Record<AscentType, number>;
  by_grade: Record<string, number>;
  by_month: Array<{
    month: string;
    count: number;
  }>;

  highest_grades: Record<string, string>;

  recent_ascents: UserRouteAscent[];
}

/**
 * 路線攀爬摘要
 */
export interface RouteAscentSummary {
  total_ascents: number;
  unique_climbers: number;
  avg_rating: number | null;
  rating_count: number;
  by_type: Record<AscentType, number>;
}
