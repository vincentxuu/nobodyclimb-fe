/**
 * Native 平台的 API Client (React Native)
 *
 * 預留實作，未來可使用 SecureStore 或其他安全儲存方案
 */

import { createApiClient } from '../core/client'
import type { TokenStorage } from '../core/types'

export { createApiClient } from '../core/client'

/**
 * 建立 Native 平台的 Token Storage 實作
 *
 * TODO: 實作時需使用 expo-secure-store 或 react-native-keychain
 * 此處為預留介面
 */
export function createNativeTokenStorage(): TokenStorage {
  throw new Error(
    'Native token storage is not implemented yet. ' +
      'Please implement using expo-secure-store or react-native-keychain.'
  )
}

/**
 * 建立 Native 平台的 API Client
 *
 * TODO: 實作時需傳入實際的 TokenStorage 實作
 */
export function createNativeApiClient(
  baseURL: string,
  tokenStorage: TokenStorage,
  onAuthError?: () => void
) {
  return createApiClient({
    baseURL,
    tokenStorage,
    onAuthError,
  })
}
