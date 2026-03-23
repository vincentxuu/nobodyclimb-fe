/**
 * Hooks 導出
 */
export { useDebounce } from './useDebounce'
export { useDebouncedCallback } from './useDebouncedCallback'
export { useInfiniteScroll } from './useInfiniteScroll'
export { useScrollProgress } from './useScrollProgress'
export { useBiographyStats } from './useBiographyStats'
export { useAboutStats } from './useAboutStats'
export { useRouteFilter } from './useRouteFilter'
export { useRouteFilterParams } from './useRouteFilterParams'
export type { RouteFilterState, UseRouteFilterParamsResult } from './useRouteFilterParams'
export { useGuestSession } from './useGuestSession'
export { useCoreStories } from './useCoreStories'
export { useQuestions } from './useQuestions'
export { usePosts, usePost, useMyPosts } from './usePosts'
export type { Post } from './usePosts'

// 岩場相關 hooks
export { useCrags, useCragDetail, useCragRoutes, useCragAreas, useRouteDetail } from './useCrags'

// 岩館相關 hooks
export { useGyms, useGymDetail, useRelatedGyms, useAdjacentGyms, useSearchGyms } from './useGyms'

// 圖庫相關 hooks
export { useGallery, useRefreshGallery } from './useGallery'

// 搜尋相關 hooks
export { useSearch } from './useSearch'

// 響應式設計 hooks
export { useMediaQuery, useScreenSize, useIsTablet, BREAKPOINTS } from './useMediaQuery'

// 個人收藏相關 hooks
export { useBookmarks } from './useBookmarks'
export type { BookmarkedPost } from './useBookmarks'

// 人生清單相關 hooks
export { useBucketList, useToggleBucketItem, useDeleteBucketItem } from './useBucketList'
export type { BucketListItem } from './useBucketList'

// 照片相關 hooks
export { useMyPhotos, useDeletePhoto, useUploadPhoto } from './usePhotos'
export type { GalleryPhoto } from './usePhotos'

// 路線照片 hooks
export { useRoutePhotos } from './useRoutePhotos'
export type { PhotoItem } from './useRoutePhotos'

// 路線攀爬記錄 hooks
export { useRouteAscents } from './useRouteAscents'
export type { RouteAscentRecord, RouteAscentSummary } from './useRouteAscents'

// 路線故事 hooks
export {
  useRouteStories,
  useCreateRouteStory,
  useToggleStoryLike,
  useToggleStoryHelpful,
} from './useRouteStories'
export type { RouteStory, RouteStoryFormData } from './useRouteStories'
