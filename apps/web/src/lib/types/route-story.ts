/**
 * 路線故事類型
 */
export type RouteStoryType =
  | 'beta' // 攀爬技巧
  | 'experience' // 攀爬心得
  | 'first_ascent' // 首攀故事
  | 'history' // 路線歷史
  | 'safety' // 安全提醒
  | 'conditions' // 岩況報告
  | 'gear' // 裝備建議
  | 'approach' // 進場資訊
  | 'other'; // 其他

/**
 * 故事類型顯示資訊
 */
export const ROUTE_STORY_TYPE_DISPLAY: Record<
  RouteStoryType,
  {
    label: string;
    icon: string;
    description: string;
    color: string;
  }
> = {
  beta: {
    label: '攀爬技巧',
    icon: 'Lightbulb',
    description: '動作建議與攀爬技巧',
    color: 'text-yellow-500',
  },
  experience: {
    label: '攀爬心得',
    icon: 'Heart',
    description: '攀爬這條路線的心得感想',
    color: 'text-pink-500',
  },
  first_ascent: {
    label: '首攀故事',
    icon: 'Trophy',
    description: '關於這條路線的首攀故事',
    color: 'text-amber-500',
  },
  history: {
    label: '路線歷史',
    icon: 'History',
    description: '路線的歷史背景與故事',
    color: 'text-blue-500',
  },
  safety: {
    label: '安全提醒',
    icon: 'AlertTriangle',
    description: '攀爬時需注意的安全事項',
    color: 'text-red-500',
  },
  conditions: {
    label: '岩況報告',
    icon: 'Mountain',
    description: '路線的岩況與條件報告',
    color: 'text-green-500',
  },
  gear: {
    label: '裝備建議',
    icon: 'Wrench',
    description: '建議攜帶的裝備',
    color: 'text-gray-500',
  },
  approach: {
    label: '進場資訊',
    icon: 'MapPin',
    description: '如何抵達路線起攀點',
    color: 'text-cyan-500',
  },
  other: {
    label: '其他',
    icon: 'MessageSquare',
    description: '其他相關分享',
    color: 'text-slate-500',
  },
};

/**
 * 路線故事可見性
 */
export type RouteStoryVisibility = 'public' | 'community' | 'private';

/**
 * 路線故事
 */
export interface RouteStory {
  id: string;
  user_id: string;
  route_id: string;

  story_type: RouteStoryType;
  title: string | null;
  content: string;

  // 媒體連結
  photos: string[];
  youtube_url: string | null;
  instagram_url: string | null;

  visibility: RouteStoryVisibility;
  is_featured: boolean;
  is_verified: boolean;

  like_count: number;
  comment_count: number;
  helpful_count: number;

  created_at: string;
  updated_at: string;

  // 互動狀態
  is_liked?: boolean;
  is_helpful?: boolean;

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
 * 新增/編輯路線故事表單
 */
export interface RouteStoryFormData {
  route_id: string;
  story_type: RouteStoryType;
  title?: string | null;
  content: string;
  photos?: string[];
  youtube_url?: string | null;
  instagram_url?: string | null;
  visibility?: RouteStoryVisibility;
}

/**
 * 路線故事留言
 */
export interface RouteStoryComment {
  id: string;
  user_id: string;
  entity_type: 'route_story';
  entity_id: string;
  content: string;
  parent_id: string | null;
  like_count: number;
  reply_count: number;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;

  // Joined fields
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}
