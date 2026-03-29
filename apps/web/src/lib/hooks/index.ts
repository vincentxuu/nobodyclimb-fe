/**
 * Hooks 統一匯出
 *
 * 從 @nobodyclimb/hooks 共用套件重新導出通用 hooks，
 * 並匯出 web 專屬的 hooks
 */

// 從共用套件重新導出通用 hooks
export { useDebounce, useDebouncedCallback, useInfiniteScroll } from '@nobodyclimb/hooks'
export { useAboutStats } from './useAboutStats'
export { useAscents } from './useAscents'
// Web 專屬 hooks
export { useAuth } from './useAuth'
export {
  useBiographyBadges,
  useBiographyStats,
  useCommunityStats,
  useLeaderboard,
} from './useBiographyStats'
export { type UnclaimedContent, useContentClaim } from './useContentClaim'
export { useCoreStories } from './useCoreStories'
export { type GuestSession, useGuestSession } from './useGuestSession'
export { useIsMobile } from './useIsMobile'
export { useMediaQuery } from './useMediaQuery'
export {
  type ChoiceOption,
  type ChoiceQuestion,
  type QuestionsData,
  useChoiceQuestions,
  useQuestions,
  useSubmitChoiceAnswer,
} from './useQuestions'
export { useReferral } from './useReferral'
export { type RouteFilterState, useRouteFilter } from './useRouteFilter'
export { useRouteFilterParams } from './useRouteFilterParams'
export { useRouteStories } from './useRouteStories'
export { useScrollProgress } from './useScrollProgress'
