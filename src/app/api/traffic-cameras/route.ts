import { NextRequest, NextResponse } from 'next/server'

/**
 * Traffic Cameras API Route
 *
 * 代理 1968 服務的即時路況攝影機 API
 * 由於 CORS 限制，前端無法直接呼叫 1968 API
 */

interface Camera {
  camid: string
  camname: string
  camuri: string
  location: string
  latitude: number
  longitude: number
  direction?: string
}

interface CameraListResponse {
  success: boolean
  data: Camera[]
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const lat = searchParams.get('lat') || '25.1056'
    const lng = searchParams.get('lng') || '121.92'

    const apiUrl = `https://www.1968services.tw/query-cam-list-by-coordinate/${lat}/${lng}`

    const response = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://www.1968services.tw/',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      throw new Error(`1968 API responded with status: ${response.status}`)
    }

    const data = await response.json() as CameraListResponse

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching traffic cameras:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch traffic cameras',
        details: error instanceof Error ? error.message : String(error),
      },
      {
        status: 500,
      }
    )
  }
}
