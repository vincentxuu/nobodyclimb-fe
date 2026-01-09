import { NextRequest, NextResponse } from 'next/server'

/**
 * Videos API Route
 *
 * 此 API 重定向到靜態 JSON 檔案，以兼容 Cloudflare Workers 環境
 * Workers 環境中沒有檔案系統存取，因此直接使用 /data/videos.json
 */
export async function GET(request: NextRequest) {
  try {
    // 獲取請求的完整 URL
    const url = new URL(request.url)

    // 構建靜態檔案 URL
    const staticFileUrl = `${url.protocol}//${url.host}/data/videos.json`

    // Fetch 靜態檔案（適用於所有環境，包括 Workers）
    // 注意：不使用 next.revalidate，因為它在 Cloudflare Workers 環境中不支持
    const response = await fetch(staticFileUrl, {
      cache: 'default'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.status}`)
    }

    const videosData = await response.json() as unknown[]

    console.log('Loaded videos, count:', videosData.length)

    return NextResponse.json(videosData, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate',
      }
    })
  } catch (error) {
    console.error('Error loading videos:', error)
    return NextResponse.json(
      {
        error: 'Failed to load videos',
        details: error instanceof Error ? error.message : String(error),
        hint: 'Try accessing /data/videos.json directly'
      },
      {
        status: 500,
      }
    )
  }
}