/**
 * Hooks 統一匯出
 *
 * 從 @nobodyclimb/hooks 共用套件重新導出通用 hooks，
 * 並匯出 web 專屬的 hooks
 */

// 從共用套件重新導出通用 hooks
export { useDebounce, useDebouncedCallback, useInfiniteScroll } from '@nobodyclimb/hooks'

// Web 專屬 hooks
export { useAuth } from './useAuth'
export { useIsMobile } from './useIsMobile'
export { useMediaQuery } from './useMediaQuery'
export { useScrollProgress } from './useScrollProgress'
export { useGuestSession, type GuestSession } from './useGuestSession'
export { useRouteFilter, type RouteFilterState } from './useRouteFilter'
export { useRouteFilterParams } from './useRouteFilterParams'
export { useContentClaim, type UnclaimedContent } from './useContentClaim'
export { useCoreStories } from './useCoreStories'
export { useAboutStats } from './useAboutStats'
export { useReferral } from './useReferral'
export {
  useBiographyStats,
  useBiographyBadges,
  useCommunityStats,
  useLeaderboard,
} from './useBiographyStats'
export {
  useQuestions,
  useChoiceQuestions,
  useSubmitChoiceAnswer,
  type QuestionsData,
  type ChoiceQuestion,
  type ChoiceOption,
} from './useQuestions'
export { useAscents } from './useAscents'
export { useRouteStories } from './useRouteStories'
