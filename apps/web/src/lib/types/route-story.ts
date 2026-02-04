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
