import { NextResponse } from 'next/server'

/**
 * 前端 Worker 健康檢查端點
 *
 * 用途：
 * 1. 監控服務 (UptimeRobot, Cloudflare Health Checks) 可以定期 ping
 * 2. 保持 Worker 溫暖，減少冷啟動
 * 3. 快速診斷 Worker 是否正常運作
 *
 * 回應時間應該 < 100ms（不涉及資料庫或外部 API）
 */
export async function GET() {
  const startTime = Date.now()

  return NextResponse.json(
    {
      status: 'healthy',
      service: 'nobodyclimb-fe',
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      environment: process.env.NODE_ENV || 'production',
    },
    {
      status: 200,
      headers: {
        // 不快取健康檢查回應
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    }
  )
}

// 支援 HEAD 請求（某些監控服務使用）
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  })
}
