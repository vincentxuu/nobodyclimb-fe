/**
 * @nobodyclimb/hooks
 *
 * 統一的 React Hooks 套件，供 Web 和 App 使用
 */

// 認證 Store（平台無關）
export {
  type AuthStatus,
  type AuthStore,
  type AuthStoreActions,
  type AuthStoreState,
  type CreateAuthStoreConfig,
  createAuthStore,
  type UpdateUserData,
} from './createAuthStore'
// 通用 Hooks
export { useDebounce } from './useDebounce'
export { useDebouncedCallback } from './useDebouncedCallback'
export { useInfiniteScroll } from './useInfiniteScroll'
