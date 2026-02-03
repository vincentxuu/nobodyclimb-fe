/**
 * @nobodyclimb/api-client
 *
 * 統一的 API Client 套件
 *
 * 使用方式：
 *
 * Web 平台：
 * ```ts
 * import { createWebApiClient } from '@nobodyclimb/api-client/web'
 * const apiClient = createWebApiClient('https://api.nobodyclimb.cc/api/v1')
 * ```
 *
 * Native 平台（未來）：
 * ```ts
 * import { createNativeApiClient } from '@nobodyclimb/api-client/native'
 * const apiClient = createNativeApiClient('https://api.nobodyclimb.cc/api/v1', tokenStorage)
 * ```
 */

// 核心
export { createApiClient } from './core/client'
export type {
  ApiClientConfig,
  TokenStorage,
  RetryConfig,
  ExtendedRequestConfig,
} from './core/types'
