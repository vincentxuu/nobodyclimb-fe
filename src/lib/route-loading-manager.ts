/**
 * 路線載入管理器 - 防止過度請求導致 503 錯誤
 */

class RouteLoadingManager {
  private loadingRoutes = new Set<string>()
  private recentRequests: string[] = []
  private readonly maxConcurrentRequests = 2
  private readonly requestWindowMs = 1000 // 1 second window
  private readonly maxRequestsPerWindow = 5

  /**
   * 檢查是否可以載入路線
   */
  canLoadRoute(routeId: string): boolean {
    // 檢查是否已在載入中
    if (this.loadingRoutes.has(routeId)) {
      return false
    }

    // 檢查並發請求限制
    if (this.loadingRoutes.size >= this.maxConcurrentRequests) {
      return false
    }

    // 檢查時間窗口內的請求數量
    this.cleanupOldRequests()
    if (this.recentRequests.length >= this.maxRequestsPerWindow) {
      return false
    }

    return true
  }

  /**
   * 開始載入路線
   */
  startLoadingRoute(routeId: string): void {
    this.loadingRoutes.add(routeId)
    this.recentRequests.push(`${Date.now()}-${routeId}`)
  }

  /**
   * 完成載入路線
   */
  finishLoadingRoute(routeId: string): void {
    this.loadingRoutes.delete(routeId)
  }

  /**
   * 清理過期的請求記錄
   */
  private cleanupOldRequests(): void {
    const now = Date.now()
    this.recentRequests = this.recentRequests.filter(request => {
      const [timestamp] = request.split('-')
      return now - parseInt(timestamp) < this.requestWindowMs
    })
  }

  /**
   * 獲取當前載入狀態
   */
  getLoadingStatus(): { loadingCount: number; recentRequestCount: number } {
    this.cleanupOldRequests()
    return {
      loadingCount: this.loadingRoutes.size,
      recentRequestCount: this.recentRequests.length
    }
  }
}

// 單例實例
export const routeLoadingManager = new RouteLoadingManager()