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

    // 驗證 lat/lng 參數是否為有效數字
    if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
      return NextResponse.json(
        { success: false, error: 'Invalid lat/lng parameters' },
        { status: 400 }
      )
    }

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
      console.error(`1968 API responded with status: ${response.status}`)
      // 外部 API 不可用時，回傳空資料而非錯誤
      return NextResponse.json(
        { success: true, data: [], message: '路況攝影機服務暫時無法使用' },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
          },
        }
      )
    }

    // 檢查回應內容類型，避免解析 HTML 為 JSON
    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      console.error(`1968 API returned non-JSON content: ${contentType}`)
      return NextResponse.json(
        { success: true, data: [], message: '路況攝影機服務暫時無法使用' },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
          },
        }
      )
    }

    const data = await response.json() as CameraListResponse

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    })
  } catch (error) {
    console.error('Error fetching traffic cameras:', error)
    // 發生錯誤時回傳空資料，提供更好的使用者體驗
    return NextResponse.json(
      {
        success: true,
        data: [],
        message: '路況攝影機服務暫時無法使用',
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    )
  }
}
