/**
 * @nobodyclimb/hooks
 *
 * 統一的 React Hooks 套件，供 Web 和 App 使用
 */

// 通用 Hooks
export { useDebounce } from './useDebounce'
export { useDebouncedCallback } from './useDebouncedCallback'
export { useInfiniteScroll } from './useInfiniteScroll'

// 認證 Store（平台無關）
export {
  createAuthStore,
  type AuthStatus,
  type AuthStore,
  type AuthStoreState,
  type AuthStoreActions,
  type UpdateUserData,
  type CreateAuthStoreConfig,
} from './createAuthStore'
