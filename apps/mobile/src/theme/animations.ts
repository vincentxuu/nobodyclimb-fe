/**
 * 動畫系統配置
 *
 * 使用 React Native Reanimated 定義常用動畫
 * 從 @nobodyclimb/constants 導入共用時長
 */
import { Easing } from 'react-native-reanimated'
import { DURATION } from '@nobodyclimb/constants'

// Re-export DURATION for use by UI components
export { DURATION }

// ============================================
// Easing 曲線
// ============================================

export const EASING = {
  /** 標準進出曲線 */
  standard: Easing.bezier(0.4, 0, 0.2, 1),
  /** 減速曲線（進入畫面） */
  decelerate: Easing.bezier(0, 0, 0.2, 1),
  /** 加速曲線（離開畫面） */
  accelerate: Easing.bezier(0.4, 0, 1, 1),
  /** 強調曲線（彈性效果） */
  emphasized: Easing.bezier(0.2, 0, 0, 1),
  /** 線性 */
  linear: Easing.linear,
  /** 彈跳效果 */
  bounce: Easing.bounce,
} as const

// ============================================
// 動畫配置
// ============================================

/**
 * 淡入動畫配置
 */
export const fadeInConfig = {
  duration: DURATION.normal,
  easing: EASING.decelerate,
}

/**
 * 淡出動畫配置
 */
export const fadeOutConfig = {
  duration: DURATION.fast,
  easing: EASING.accelerate,
}

/**
 * 從下方滑入動畫配置
 */
export const slideUpConfig = {
  duration: DURATION.normal,
  easing: EASING.decelerate,
}

/**
 * 向下滑出動畫配置
 */
export const slideDownConfig = {
  duration: DURATION.fast,
  easing: EASING.accelerate,
}

/**
 * 縮放進入動畫配置
 */
export const scaleInConfig = {
  duration: DURATION.normal,
  easing: EASING.emphasized,
}

/**
 * 按壓縮放動畫配置
 */
export const pressScaleConfig = {
  duration: DURATION.fast,
  easing: EASING.standard,
  scale: 0.97,
}

// ============================================
// 動畫預設值
// ============================================

/**
 * 列表項目進入動畫的預設延遲間隔（毫秒）
 */
export const STAGGER_DELAY = 50

/**
 * 滑入動畫的預設位移量（像素）
 */
export const SLIDE_OFFSET = 20

/**
 * 縮放動畫的初始比例
 */
export const SCALE_INITIAL = 0.95

// ============================================
// Spring 動畫配置
// ============================================

/**
 * 輕量彈簧配置（快速響應）
 */
export const springConfigLight = {
  damping: 20,
  stiffness: 300,
  mass: 0.5,
}

/**
 * 標準彈簧配置
 */
export const springConfigStandard = {
  damping: 15,
  stiffness: 200,
  mass: 1,
}

/**
 * 重量彈簧配置（緩慢但有彈性）
 */
export const springConfigHeavy = {
  damping: 20,
  stiffness: 100,
  mass: 1.5,
}

/**
 * 彈跳彈簧配置
 */
export const springConfigBouncy = {
  damping: 10,
  stiffness: 150,
  mass: 1,
}
