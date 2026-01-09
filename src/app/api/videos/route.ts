import { NextRequest } from 'next/server'
import fs from 'fs'
import path from 'path'

// 从 public/data 读取静态文件，避免打包进 bundle
export async function GET(_request: NextRequest) {
  try {
    // 读取 public/data/videos.json（静态资源，不打包进 bundle）
    const filePath = path.join(process.cwd(), 'public', 'data', 'videos.json')
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const videosData = JSON.parse(fileContent)

    console.log('Loaded videos from public/data/videos.json, count:', videosData.length)

    return new Response(JSON.stringify(videosData), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate' // 缓存优化
      }
    })
  } catch (error) {
    console.error('Error loading videos:', error)
    return new Response(JSON.stringify({
      error: 'Failed to load videos',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}