/**
 * 類型定義統一匯出
 *
 * 目前策略：保留 web 本地型別檔案，以確保向後相容性
 * 共用套件 (@nobodyclimb/types) 可在需要時直接 import
 *
 * 按領域拆分：
 * - user.ts: 使用者相關
 * - notification.ts: 通知相關
 * - api.ts: API 回應相關
 * - auth.ts: 認證相關
 * - content.ts: 內容相關（Post, Gym, Biography, BucketList, etc.）
 * - video.ts: 影片相關
 * - stats.ts: 統計與徽章相關
 * - biography-v2.ts: Biography V2 型別
 */

// 使用者相關
export * from './user'

// 通知相關
export * from './notification'

// API 相關
export * from './api'

// 認證相關
export * from './auth'

// 內容相關
export * from './content'

// 影片相關
export * from './video'

// 統計與徽章相關
export * from './stats'

// Biography V2
export * from './biography-v2'

// 攀爬記錄相關
export * from './ascent'

// 路線故事相關
export * from './route-story'
