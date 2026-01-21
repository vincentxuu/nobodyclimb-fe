/**
 * 類型定義統一匯出
 *
 * 拆分策略：按領域逐步遷移
 * - 已拆分: user, notification
 * - 待拆分: content, api, auth, form, video, stats
 */

// 已拆分的類型
export * from './user'
export * from './notification'

// 尚未拆分的類型（從原 types.ts 匯出）
// 注意：逐步遷移後刪除此匯出
export {
  // 內容相關
  type Author,
  type Post,
  type PostDetail,
  type PostFormData,
  type Comment,
  type CommentFormData,
  type Tag,
  type Gym,
  type GymDetail,
  type GymFormData,
  type Review,
  type ReviewFormData,
  type GalleryItem,
  type GalleryDetail,
  type Biography,
  type BiographyFormData,
  type BucketListItem,
  type BucketListFormData,
  type Crag,
  type CragDetail,
  type CragFormData,
  type Route,
  type RouteFormData,
  type SearchResult,

  // API 相關
  type ApiResponse,
  type PaginatedResponse,
  type Pagination,
  type SortOption,
  type FilterOption,

  // 認證相關
  type AuthState,
  type LoginCredentials,
  type RegisterCredentials,

  // 表單相關
  type FormFieldConfig,
  type FormSection,
  type ValidationRule,

  // 影片相關
  type Video,
  type VideoChannel,
  type YouTubeVideo,

  // 統計與徽章相關
  STORY_FIELD_COUNTS,
  type BiographyStats,
  type CommunityStats,
  type Badge,
  type LeaderboardItem,
  type LeaderboardType,
  type ActivityTimelineItem,
} from '../types'
