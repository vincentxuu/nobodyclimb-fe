/**
 * Hooks 導出
 */

export { useAboutStats } from './useAboutStats'
export { useBiographyStats } from './useBiographyStats'
export type { BookmarkedPost } from './useBookmarks'
// 個人收藏相關 hooks
export { useBookmarks, useRemoveBookmark } from './useBookmarks'
export type { BucketListItem } from './useBucketList'
// 人生清單相關 hooks
export {
  useBucketList,
  useCompleteBucketItem,
  useCreateBucketItem,
  useDeleteBucketItem,
  useToggleBucketItem,
  useUpdateBucketItem,
  useUpdateBucketMilestone,
} from './useBucketList'
export { type UnclaimedContent, useContentClaim } from './useContentClaim'
export { useCoreStories } from './useCoreStories'
// 岩場相關 hooks
export { useCragAreas, useCragDetail, useCragRoutes, useCrags, useRouteDetail } from './useCrags'
export { useDebounce } from './useDebounce'
export { useDebouncedCallback } from './useDebouncedCallback'
// 圖庫相關 hooks
export {
  updateGalleryPhoto,
  uploadGalleryImage,
  uploadGalleryPhoto,
  useGallery,
  useRefreshGallery,
} from './useGallery'
export { useGuestSession } from './useGuestSession'
// 岩館相關 hooks
export { useAdjacentGyms, useGymDetail, useGyms, useRelatedGyms, useSearchGyms } from './useGyms'
export { useInfiniteScroll } from './useInfiniteScroll'
// 響應式設計 hooks
export { BREAKPOINTS, useIsTablet, useMediaQuery, useScreenSize } from './useMediaQuery'
export type { GalleryPhoto } from './usePhotos'
// 照片相關 hooks
export {
  useDeletePhoto,
  useMyPhotos,
  useUpdatePhoto,
  useUploadPhoto,
  useUploadPhotoImage,
} from './usePhotos'
export type { Post } from './usePosts'
export {
  useDeletePost,
  useMyPosts,
  usePopularPosts,
  usePost,
  usePostBookmarkStatus,
  usePostLikeStatus,
  usePosts,
  useRelatedPosts,
  useTogglePostBookmark,
  useTogglePostLike,
} from './usePosts'
export { useQuestions } from './useQuestions'
export type { RouteAscentRecord, RouteAscentSummary } from './useRouteAscents'
// 路線攀爬記錄 hooks
export { useRouteAscents } from './useRouteAscents'
export { useRouteFilter } from './useRouteFilter'
export type { RouteFilterState, UseRouteFilterParamsResult } from './useRouteFilterParams'
export { useRouteFilterParams } from './useRouteFilterParams'
export type { PhotoItem } from './useRoutePhotos'
// 路線照片 hooks
export { useRoutePhotos } from './useRoutePhotos'
export type { RouteStory, RouteStoryFormData } from './useRouteStories'
// 路線故事 hooks
export {
  useCreateRouteStory,
  useRouteStories,
  useToggleStoryHelpful,
  useToggleStoryLike,
} from './useRouteStories'
export { useScrollProgress } from './useScrollProgress'
// 搜尋相關 hooks
export { useSearch } from './useSearch'
