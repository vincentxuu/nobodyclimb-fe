/**
 * 攀岩系統練習遊戲 - 音效管理器
 */

import { SOUND_IDS, type SoundId } from './constants'

/**
 * 音效管理器類別
 * 負責載入、快取和播放遊戲音效
 */
class SoundManager {
  private sounds: Map<SoundId, HTMLAudioElement>
  private enabled: boolean
  private initialized: boolean
  private volume: number

  constructor() {
    this.sounds = new Map()
    this.enabled = true
    this.initialized = false
    this.volume = 0.7 // 預設音量 70%
  }

  /**
   * 初始化音效
   * 需要在客戶端環境中調用（useEffect 內）
   */
  init(): void {
    // 確保在瀏覽器環境中執行
    if (typeof window === 'undefined') return
    if (this.initialized) return

    SOUND_IDS.forEach((id) => {
      try {
        const audio = new Audio(`/sounds/games/${id}.mp3`)
        audio.preload = 'auto'
        audio.volume = this.getVolumeForSound(id)
        this.sounds.set(id, audio)
      } catch (error) {
        console.warn(`Failed to load sound: ${id}`, error)
      }
    })

    this.initialized = true
  }

  /**
   * 取得特定音效的音量
   */
  private getVolumeForSound(id: SoundId): number {
    // 根據 04-ui-design.md 中定義的音量設定
    const volumeMap: Record<SoundId, number> = {
      correct: 0.7,
      wrong: 0.7,
      fall: 0.6,
      impact: 0.5,
      levelUp: 0.7,
      complete: 0.8,
      gameOver: 0.8,
    }
    return volumeMap[id] * this.volume
  }

  /**
   * 播放音效
   */
  play(id: SoundId): void {
    if (!this.enabled) return
    if (!this.initialized) {
      console.warn('SoundManager not initialized. Call init() first.')
      return
    }

    const sound = this.sounds.get(id)
    if (sound) {
      // 重置播放位置
      sound.currentTime = 0
      sound.volume = this.getVolumeForSound(id)

      // 播放音效，忽略自動播放被阻擋的錯誤
      sound.play().catch(() => {
        // 瀏覽器可能阻擋自動播放，靜默處理
      })
    }
  }

  /**
   * 停止指定音效
   */
  stop(id: SoundId): void {
    const sound = this.sounds.get(id)
    if (sound) {
      sound.pause()
      sound.currentTime = 0
    }
  }

  /**
   * 停止所有音效
   */
  stopAll(): void {
    this.sounds.forEach((sound) => {
      sound.pause()
      sound.currentTime = 0
    })
  }

  /**
   * 切換音效開關
   */
  toggle(): boolean {
    this.enabled = !this.enabled
    if (!this.enabled) {
      this.stopAll()
    }
    return this.enabled
  }

  /**
   * 設定音效開關
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    if (!enabled) {
      this.stopAll()
    }
  }

  /**
   * 取得音效狀態
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * 設定主音量
   */
  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume))
    // 更新所有已載入音效的音量
    this.sounds.forEach((sound, id) => {
      sound.volume = this.getVolumeForSound(id)
    })
  }

  /**
   * 取得主音量
   */
  getVolume(): number {
    return this.volume
  }

  /**
   * 預載入所有音效
   * 用於確保音效在需要時已經準備好
   */
  async preload(): Promise<void> {
    if (!this.initialized) {
      this.init()
    }

    const loadPromises = Array.from(this.sounds.values()).map(
      (audio) =>
        new Promise<void>((resolve) => {
          if (audio.readyState >= 3) {
            resolve()
          } else {
            audio.addEventListener('canplaythrough', () => resolve(), {
              once: true,
            })
            audio.addEventListener('error', () => resolve(), { once: true })
          }
        })
    )

    await Promise.all(loadPromises)
  }

  /**
   * 釋放資源
   */
  dispose(): void {
    this.stopAll()
    this.sounds.clear()
    this.initialized = false
  }
}

// 建立單例實例
export const soundManager = new SoundManager()

// ========== React Hook ==========

import { useEffect, useCallback } from 'react'
import { useRopeGameStore } from '@/store/ropeGameStore'

/**
 * 音效 Hook
 * 提供便捷的音效播放功能，自動同步遊戲狀態
 */
export function useGameSounds() {
  const soundEnabled = useRopeGameStore((state) => state.soundEnabled)

  // 初始化音效管理器並同步狀態
  useEffect(() => {
    soundManager.init()
    soundManager.setEnabled(soundEnabled)

    return () => {
      soundManager.stopAll()
    }
  }, [soundEnabled])

  // 播放音效
  const play = useCallback((id: SoundId) => {
    soundManager.play(id)
  }, [])

  // 播放答對音效
  const playCorrect = useCallback(() => {
    soundManager.play('correct')
  }, [])

  // 播放答錯音效
  const playWrong = useCallback(() => {
    soundManager.play('wrong')
  }, [])

  // 播放掉落音效
  const playFall = useCallback(() => {
    soundManager.play('fall')
  }, [])

  // 播放撞擊音效
  const playImpact = useCallback(() => {
    soundManager.play('impact')
  }, [])

  // 播放升級音效
  const playLevelUp = useCallback(() => {
    soundManager.play('levelUp')
  }, [])

  // 播放完成音效
  const playComplete = useCallback(() => {
    soundManager.play('complete')
  }, [])

  // 播放遊戲結束音效
  const playGameOver = useCallback(() => {
    soundManager.play('gameOver')
  }, [])

  return {
    play,
    playCorrect,
    playWrong,
    playFall,
    playImpact,
    playLevelUp,
    playComplete,
    playGameOver,
    isEnabled: soundEnabled,
  }
}
